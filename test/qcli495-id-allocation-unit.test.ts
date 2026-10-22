import { expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  open,
  readdir,
  readFile,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  allocateId,
  breakStaleLock,
  IdAllocationLockTimeoutError,
  IdAllocationWorktreeReadError,
  peekIdBlock,
  reserveIdBlock,
} from "../src/application/tasks/id-allocation.ts";
import type { GitPort } from "../src/ports/git.ts";

/**
 * QCLI-495, round 1 review of opum-ai/quest-cli#646. The two blocking findings
 * were reasoned from the code and never run, and no CLI-level test could see
 * either: both need the allocator's own seams (the clock, the pid, the Git
 * port) to hold the critical section open and look at what the lock and the
 * ledger are WHILE it runs, which a spawned process cannot do.
 */

/** A pid that is certainly gone: a child this process spawned and reaped.
 * A fixed number such as 999999 is dead on macOS (pid_max 99998) but can be a
 * live process on a Linux runner (pid_max often 4194304). */
const deadPid = (() => {
  const child = spawnSync(process.execPath, ["--version"]);
  if (child.pid === undefined) throw new Error("could not spawn a child");
  return child.pid;
})();

const ONE_DAY = 24 * 60 * 60 * 1000;

/** A port that answers only `listWorktrees`, with a hook that runs inside the
 * critical section -- the only moment the lock can be observed held. */
function portWithHook(
  worktrees: readonly string[],
  hook: () => Promise<void> = async () => undefined,
): GitPort {
  return {
    listWorktrees: async () => {
      await hook();
      return worktrees;
    },
  } as unknown as GitPort;
}

async function repositoryDirectory() {
  const root = await mkdtemp(join(tmpdir(), "qcli495-unit-"));
  const common = join(root, "common");
  const quest = join(common, "quest");
  await mkdir(quest, { recursive: true });
  return {
    root,
    common,
    lockPath: join(quest, "alloc.lock"),
    ledgerPath: join(quest, "reserved-ids"),
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

test("a process that broke a stale lock HOLDS the lock while it allocates (QCLI-495 round 1, finding 1)", async () => {
  const repo = await repositoryDirectory();
  try {
    const now = Date.now();
    // A pid that cannot be alive and a stamp past the 30s window: both halves
    // of the stale rule, so the lock is broken.
    await writeFile(repo.lockPath, `${deadPid}\n${now - 60_000}\n`, "utf8");
    let heldDuringCriticalSection: string | null = null;
    const allocation = await allocateId({
      git: portWithHook([repo.root], async () => {
        heldDuringCriticalSection = await readFile(repo.lockPath, "utf8").catch(
          () => null,
        );
      }),
      worktreeRoot: repo.root,
      commonDirectory: repo.common,
      marker: "T-",
      family: "task",
      recordDirectories: ["tasks"],
      visibleIds: [],
      processId: 424_242,
      now: () => now,
    });
    expect(allocation.brokeStaleLock).toBe(true);
    // The break is reported only once the lock is held, and what is held is
    // THIS process's lock -- not the absence of one.
    expect(heldDuringCriticalSection).not.toBeNull();
    expect(String(heldDuringCriticalSection).startsWith("424242\n")).toBe(true);
  } finally {
    await repo.cleanup();
  }
});

test("an allocation for one family leaves another family's fresh reservation alone (QCLI-495 round 1, finding 2)", async () => {
  const repo = await repositoryDirectory();
  try {
    const now = Date.now();
    // A draft create has reserved D-7 and released the lock, and its record
    // is not on disk yet: the window the ledger exists for.
    await writeFile(
      repo.ledgerPath,
      `${JSON.stringify({ id: "D-7", at: now, family: "draft" })}\n`,
      "utf8",
    );
    const common = {
      git: portWithHook([repo.root]),
      worktreeRoot: repo.root,
      commonDirectory: repo.common,
      recordDirectories: ["tasks"],
      visibleIds: [] as string[],
      now: () => now,
    };
    const task = await allocateId({
      ...common,
      marker: "T-",
      family: "task",
    });
    expect(task.id).toBe("T-1");
    expect(await readFile(repo.ledgerPath, "utf8")).toContain('"id":"D-7"');
    // And the draft that arrives next must not mint D-7 again.
    const draft = await allocateId({
      ...common,
      marker: "D-",
      family: "draft",
    });
    expect(draft.id).toBe("D-8");
  } finally {
    await repo.cleanup();
  }
});

const sharedRequest = (repo: { root: string; common: string }) => ({
  worktreeRoot: repo.root,
  commonDirectory: repo.common,
  recordDirectories: ["tasks"] as string[],
  visibleIds: [] as string[],
});

test("two allocators that both find a stale lock still serialise and mint distinct ids (QCLI-495 round 1, finding 1)", async () => {
  const repo = await repositoryDirectory();
  try {
    const now = Date.now();
    await writeFile(repo.lockPath, `${deadPid}\n${now - 60_000}\n`, "utf8");
    // Each allocator yields inside its critical section, so one that was NOT
    // holding the lock would overlap the other and read the same ledger.
    const slow = portWithHook([repo.root], () => Bun.sleep(40));
    const results = await Promise.all(
      [1, 2, 3].map((n) =>
        allocateId({
          ...sharedRequest(repo),
          git: slow,
          marker: "T-",
          family: "task",
          processId: process.pid + n,
          now: () => Date.now(),
        }),
      ),
    );
    const ids = results.map((result) => result.id);
    expect(new Set(ids).size).toBe(3);
    // Exactly one of them broke the lock, and said so.
    expect(results.filter((result) => result.brokeStaleLock).length).toBe(1);
  } finally {
    await repo.cleanup();
  }
});

test("a reservation is dropped only when ITS id is visible, not whenever a higher id is (QCLI-495 round 1, finding 7)", async () => {
  const repo = await repositoryDirectory();
  try {
    const now = Date.now();
    await writeFile(
      repo.ledgerPath,
      [
        { id: "T-5", at: now, family: "task" },
        { id: "T-6", at: now, family: "task" },
      ]
        .map((entry) => `${JSON.stringify(entry)}\n`)
        .join(""),
      "utf8",
    );
    // T-6 is visible; T-5's own record is not, even though a HIGHER id is.
    await allocateId({
      ...sharedRequest(repo),
      git: portWithHook([repo.root]),
      marker: "T-",
      family: "task",
      visibleIds: ["T-6"],
      now: () => now,
    });
    const ledger = await readFile(repo.ledgerPath, "utf8");
    expect(ledger).toContain('"id":"T-5"');
    expect(ledger).not.toContain('"id":"T-6"');
  } finally {
    await repo.cleanup();
  }
});

test("a reservation older than 7 days is dropped whatever family it names (QCLI-495 round 1, finding 7)", async () => {
  const repo = await repositoryDirectory();
  try {
    const now = Date.now();
    await writeFile(
      repo.ledgerPath,
      `${JSON.stringify({ id: "D-9", at: now - 8 * ONE_DAY, family: "draft" })}\n`,
      "utf8",
    );
    await allocateId({
      ...sharedRequest(repo),
      git: portWithHook([repo.root]),
      marker: "T-",
      family: "task",
      now: () => now,
    });
    expect(await readFile(repo.ledgerPath, "utf8")).not.toContain("D-9");
  } finally {
    await repo.cleanup();
  }
});

test("a task prefix that equals a draft's marker does not alias the draft family (QCLI-495 round 1, finding 2's note)", async () => {
  const repo = await repositoryDirectory();
  try {
    const now = Date.now();
    // A workspace whose task prefix is `D` mints task ids `D-N`, the same
    // marker drafts use. The ledger entry is tagged with its FAMILY, so the
    // task reservation cannot raise the draft counter.
    await writeFile(
      repo.ledgerPath,
      `${JSON.stringify({ id: "D-9", at: now, family: "task" })}\n`,
      "utf8",
    );
    const draft = await allocateId({
      ...sharedRequest(repo),
      git: portWithHook([repo.root]),
      marker: "D-",
      family: "draft",
      now: () => now,
    });
    expect(draft.id).toBe("D-1");
    const task = await allocateId({
      ...sharedRequest(repo),
      git: portWithHook([repo.root]),
      marker: "D-",
      family: "task",
      now: () => now,
    });
    expect(task.id).toBe("D-10");
  } finally {
    await repo.cleanup();
  }
});

test("an empty worktree list refuses the allocation instead of falling back to refs only (QCLI-495 round 1, finding 5)", async () => {
  const repo = await repositoryDirectory();
  try {
    await expect(
      allocateId({
        ...sharedRequest(repo),
        git: portWithHook([]),
        marker: "T-",
        family: "task",
      }),
    ).rejects.toBeInstanceOf(IdAllocationWorktreeReadError);
    // A refusal releases the lock and reserves nothing.
    expect(await readFile(repo.lockPath, "utf8").catch(() => null)).toBeNull();
    expect(
      await readFile(repo.ledgerPath, "utf8").catch(() => null),
    ).toBeNull();
  } finally {
    await repo.cleanup();
  }
});

test("a worktree list that throws refuses the allocation too (QCLI-495 round 1, finding 5)", async () => {
  const repo = await repositoryDirectory();
  try {
    await expect(
      allocateId({
        ...sharedRequest(repo),
        git: {
          listWorktrees: async () => {
            throw new Error("git exploded");
          },
        } as unknown as GitPort,
        marker: "T-",
        family: "task",
      }),
    ).rejects.toBeInstanceOf(IdAllocationWorktreeReadError);
  } finally {
    await repo.cleanup();
  }
});

test("a live holder that never lets go times out as a named error carrying what the hint needs (QCLI-495 round 1, finding 6)", async () => {
  const repo = await repositoryDirectory();
  try {
    let clock = 1_000_000;
    // This very process is the holder: alive, so the stale rule never breaks it.
    await writeFile(repo.lockPath, `${process.pid}\n${clock}\n`, "utf8");
    const failure = await allocateId({
      ...sharedRequest(repo),
      git: portWithHook([repo.root]),
      marker: "T-",
      family: "task",
      processId: process.pid + 1,
      now: () => clock,
      sleep: async (milliseconds) => {
        clock += milliseconds * 40;
      },
    }).then(
      () => null,
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(IdAllocationLockTimeoutError);
    const timeout = failure as IdAllocationLockTimeoutError;
    expect(timeout.lockPath).toBe(repo.lockPath);
    expect(timeout.holderPid).toBe(process.pid);
    expect(timeout.lockAgeMilliseconds).toBeGreaterThan(0);
    // It says how long this call WAITED. It must not claim how long the lock
    // was HELD: nothing measures that.
    expect(timeout.message).not.toMatch(/held (it )?for/u);
    expect(timeout.message).toContain("waited");
    // The live holder's lock is untouched.
    expect(await readFile(repo.lockPath, "utf8")).toStartWith(
      `${process.pid}\n`,
    );
  } finally {
    await repo.cleanup();
  }
});

test("the ledger is written atomically and leaves no temporary file behind (QCLI-495 round 1, finding 10)", async () => {
  const repo = await repositoryDirectory();
  try {
    await allocateId({
      ...sharedRequest(repo),
      git: portWithHook([repo.root]),
      marker: "T-",
      family: "task",
    });
    const { readdir } = await import("node:fs/promises");
    const names = await readdir(join(repo.common, "quest"));
    expect(names).toEqual(["reserved-ids"]);
  } finally {
    await repo.cleanup();
  }
});

test("a breaker that judged a lock stale never removes the fresh lock a faster breaker took meanwhile (QCLI-495 round 2, NEW 1)", async () => {
  const repo = await repositoryDirectory();
  try {
    const now = Date.now();
    await writeFile(repo.lockPath, `${deadPid}\n${now - 60_000}\n`, "utf8");
    let interleaved = false;
    // P3: a late allocator that tries the exclusive create on every turn of
    // the event loop for as long as the slow breaker runs. If the lock path is
    // EVER free while P1 holds it, P3 gets in beside P1 -- two holders. This
    // poller lands in the old rename-to-link gap on most runs, not all: it is
    // evidence for the lock-path invariant, and the serialisation half is
    // pinned by the next test, which needs no timing.
    let breakerRunning = true;
    let thirdPartyEntered = false;
    const thirdParty = (async () => {
      while (breakerRunning) {
        if (interleaved) {
          const handle = await open(repo.lockPath, "wx").catch(() => null);
          if (handle !== null) {
            thirdPartyEntered = true;
            await handle.close();
            return;
          }
        }
        await new Promise((resolve) => setImmediate(resolve));
      }
    })();
    const broke = await breakStaleLock(repo.lockPath, () => now, {
      // P2 has judged S stale and is about to act. Here P1 breaks S and takes
      // the lock -- before P2 removes anything.
      afterStaleJudgement: async () => {
        await unlink(repo.lockPath);
        await writeFile(repo.lockPath, `${process.pid}\n${now}\n`, "utf8");
        interleaved = true;
      },
    });
    breakerRunning = false;
    await thirdParty;
    // The seam must have fired, or this proves nothing.
    expect(interleaved).toBe(true);
    expect(broke).toBe(false);
    expect(thirdPartyEntered).toBe(false);
    // P1's lock is still there, still P1's, and nothing was parked or left.
    expect(await readFile(repo.lockPath, "utf8")).toBe(
      `${process.pid}\n${now}\n`,
    );
    expect(
      (await readdir(join(repo.common, "quest"))).filter((name) =>
        name.startsWith("alloc.lock."),
      ),
    ).toEqual([]);
  } finally {
    await repo.cleanup();
  }
});

test("a slow breaker leaves no orphaned lock when the faster holder finishes first (QCLI-495 round 2, NEW 2)", async () => {
  const repo = await repositoryDirectory();
  try {
    const now = Date.now();
    await writeFile(repo.lockPath, `${deadPid}\n${now - 60_000}\n`, "utf8");
    let interleaved = false;
    const broke = await breakStaleLock(repo.lockPath, () => now, {
      // P1 broke S, took the lock, allocated and released it, all inside P2's
      // window. The round-1 code could re-create P1's lock from a parked copy
      // after P1 had gone, stamped fresh and owned by a dead pid.
      afterStaleJudgement: async () => {
        await unlink(repo.lockPath);
        await writeFile(repo.lockPath, `${process.pid}\n${now}\n`, "utf8");
        await unlink(repo.lockPath);
        interleaved = true;
      },
    });
    expect(interleaved).toBe(true);
    expect(broke).toBe(false);
    // Nothing at the lock path, and nothing beside it: no parked copy, no
    // break file.
    expect(await readdir(join(repo.common, "quest"))).toEqual([]);
  } finally {
    await repo.cleanup();
  }
});

test("a second breaker is refused by the break file alone while the first holds it (QCLI-495 round 3, F1)", async () => {
  const repo = await repositoryDirectory();
  try {
    const now = Date.now();
    const stale = `${deadPid}\n${now - 60_000}\n`;
    await writeFile(repo.lockPath, stale, "utf8");
    let secondBroke: boolean | null = null;
    let lockDuringSecond: string | null = null;
    let firstReachedTheSeam = false;
    const first = await breakStaleLock(repo.lockPath, () => now, {
      // Breaker A holds the break file and has read S again: it matches, and
      // A is about to remove it. Breaker B judged the SAME S stale and now
      // tries to act. Nothing but the break file stands between B and a second
      // removal, so B must be refused here.
      afterLockedReread: async () => {
        firstReachedTheSeam = true;
        secondBroke = await breakStaleLock(repo.lockPath, () => now);
        lockDuringSecond = await readFile(repo.lockPath, "utf8").catch(
          () => null,
        );
      },
    });
    expect(firstReachedTheSeam).toBe(true);
    expect(secondBroke as boolean | null).toBe(false);
    expect(lockDuringSecond as string | null).toBe(stale);
    expect(first).toBe(true);
    // A removed S and released its break file.
    expect(await readdir(join(repo.common, "quest"))).toEqual([]);
  } finally {
    await repo.cleanup();
  }
});

test("a break file is cleared only when it is old AND its holder is gone (QCLI-495 round 3, F2)", async () => {
  const repo = await repositoryDirectory();
  const breakPath = `${repo.lockPath}.break`;
  try {
    const now = Date.now();
    const stale = `${deadPid}\n${now - 60_000}\n`;
    await writeFile(repo.lockPath, stale, "utf8");

    // LIVE and old: a breaker that stalled past the age limit. It must keep
    // its break file, so a second breaker cannot remove a new holder's lock.
    await writeFile(breakPath, `${process.pid}\n${now - 60_000}\n`, "utf8");
    expect(await breakStaleLock(repo.lockPath, () => now)).toBe(false);
    expect(await readFile(breakPath, "utf8")).toBe(
      `${process.pid}\n${now - 60_000}\n`,
    );
    expect(await readFile(repo.lockPath, "utf8")).toBe(stale);

    // DEAD but young: still inside the age window, so left alone.
    await writeFile(breakPath, `${deadPid}\n${now - 1_000}\n`, "utf8");
    expect(await breakStaleLock(repo.lockPath, () => now)).toBe(false);
    expect(await readFile(breakPath, "utf8")).toBe(
      `${deadPid}\n${now - 1_000}\n`,
    );

    // DEAD and old: a killed breaker's file. The first call clears it, the
    // next breaks the lock.
    await writeFile(breakPath, `${deadPid}\n${now - 60_000}\n`, "utf8");
    expect(await breakStaleLock(repo.lockPath, () => now)).toBe(false);
    expect(await readFile(breakPath, "utf8").catch(() => null)).toBeNull();
    expect(await breakStaleLock(repo.lockPath, () => now)).toBe(true);
    expect(await readFile(repo.lockPath, "utf8").catch(() => null)).toBeNull();

    // A file whose holder cannot be read is never cleared: a live breaker
    // between creating and writing it would look identical.
    await writeFile(repo.lockPath, stale, "utf8");
    await writeFile(breakPath, "", "utf8");
    expect(await breakStaleLock(repo.lockPath, () => now + ONE_DAY)).toBe(
      false,
    );
    expect(await readFile(breakPath, "utf8")).toBe("");
  } finally {
    await repo.cleanup();
  }
});

test("a breaker never releases a break file that is no longer its own (QCLI-495 round 3, F2)", async () => {
  const repo = await repositoryDirectory();
  const breakPath = `${repo.lockPath}.break`;
  try {
    const now = Date.now();
    await writeFile(repo.lockPath, `${deadPid}\n${now - 60_000}\n`, "utf8");
    // QCLI-523: the foreign file differs in BOTH halves -- a different pid
    // AND a different stamp (now + 1). Pinning only the pid left the stamp
    // half of the comparison untested, which is what this test used to do.
    // Deliberately `process.pid + 1` and NOT `deadPid`: the release path
    // (id-allocation.ts:277-279) has no liveness check, so any pid that is not
    // the breaker's pins the same half, and `deadPid` would suggest liveness is
    // part of what this fixture tests when it is not.
    const foreign = `${process.pid + 1}\n${now + 1}\n`;
    expect(
      await breakStaleLock(repo.lockPath, () => now, {
        afterLockedReread: async () => {
          await writeFile(breakPath, foreign, "utf8");
        },
      }),
    ).toBe(true);
    expect(await readFile(breakPath, "utf8")).toBe(foreign);
  } finally {
    await repo.cleanup();
  }
});

test("a breaker never releases a break file carrying its OWN pid but a different stamp (QCLI-523)", async () => {
  const repo = await repositoryDirectory();
  const breakPath = `${repo.lockPath}.break`;
  try {
    const now = Date.now();
    await writeFile(repo.lockPath, `${deadPid}\n${now - 60_000}\n`, "utf8");
    // SAME pid as the breaker, DIFFERENT stamp. This is the only fixture that
    // can tell "release only if pid and stamp are both mine" from "release if
    // the pid is mine": every other foreign file in this suite differs by pid,
    // so a pid-only release passes them. Mutating the release check in
    // breakStaleLock to compare the pid alone turns THIS test red (measured).
    expect(
      await breakStaleLock(repo.lockPath, () => now, {
        afterLockedReread: async () => {
          await writeFile(breakPath, `${process.pid}\n${now + 1}\n`, "utf8");
        },
      }),
    ).toBe(true);
    expect(await readFile(breakPath, "utf8")).toBe(
      `${process.pid}\n${now + 1}\n`,
    );
  } finally {
    await repo.cleanup();
  }
});

/* ---- QCLI-520 round 1, MINOR 2: the block API's own unit coverage ---------
 *
 * The migration's end-to-end test proves two worktrees end up disjoint; it
 * cannot isolate the block rules themselves, so they are pinned here against
 * the allocator's real seams (clock, pid, Git port).
 */

const blockRequest = (repo: { root: string; common: string }) => ({
  ...sharedRequest(repo),
  git: portWithHook([repo.root]),
  marker: "T-",
  family: "task",
});

test("a zero-count block asks for nothing and writes nothing (QCLI-520 round 1, MINOR 2)", async () => {
  const repo = await repositoryDirectory();
  try {
    expect(await peekIdBlock({ ...blockRequest(repo), count: 0 })).toEqual([]);
    const reserved = await reserveIdBlock({
      ...blockRequest(repo),
      count: 0,
    });
    expect(reserved.ids).toEqual([]);
    expect(reserved.brokeStaleLock).toBe(false);
    expect(
      await readFile(repo.ledgerPath, "utf8").catch(() => null),
    ).toBeNull();
    expect(await readFile(repo.lockPath, "utf8").catch(() => null)).toBeNull();
  } finally {
    await repo.cleanup();
  }
});

test("a peek is exactly the block a reservation then writes when nothing moved (QCLI-520 round 1, MINOR 2)", async () => {
  const repo = await repositoryDirectory();
  try {
    const peeked = await peekIdBlock({ ...blockRequest(repo), count: 3 });
    expect(peeked).toEqual(["T-1", "T-2", "T-3"]);
    // The preview half must not move the floor the apply will read.
    expect(
      await readFile(repo.ledgerPath, "utf8").catch(() => null),
    ).toBeNull();
    const reserved = await reserveIdBlock({
      ...blockRequest(repo),
      count: 3,
    });
    expect(reserved.ids).toEqual(peeked);
    const ledger = await readFile(repo.ledgerPath, "utf8");
    for (const id of peeked) expect(ledger).toContain(`"id":"${id}"`);
  } finally {
    await repo.cleanup();
  }
});

test("a single id allocated after a reserved block lands ABOVE it (QCLI-520 round 1, MINOR 2)", async () => {
  const repo = await repositoryDirectory();
  try {
    const block = await reserveIdBlock({ ...blockRequest(repo), count: 2 });
    expect(block.ids).toEqual(["T-1", "T-2"]);
    const single = await allocateId({ ...blockRequest(repo) });
    expect(single.id).toBe("T-3");
  } finally {
    await repo.cleanup();
  }
});

test("a single id already allocated pushes a later block up (QCLI-520 round 1, MINOR 2)", async () => {
  const repo = await repositoryDirectory();
  try {
    const single = await allocateId({ ...blockRequest(repo) });
    expect(single.id).toBe("T-1");
    const block = await reserveIdBlock({ ...blockRequest(repo), count: 2 });
    expect(block.ids).toEqual(["T-2", "T-3"]);
  } finally {
    await repo.cleanup();
  }
});

test("a breaker never releases a break file carrying a foreign pid but its OWN stamp (QCLI-523)", async () => {
  const repo = await repositoryDirectory();
  const breakPath = `${repo.lockPath}.break`;
  try {
    const now = Date.now();
    await writeFile(repo.lockPath, `${deadPid}\n${now - 60_000}\n`, "utf8");
    // A foreign pid with the breaker's own stamp -- the mirror of the case
    // above, and the only fixture that pins the STAMP half of the comparison:
    // every other foreign file here differs by pid too, so a release comparing
    // the stamp alone passes them all. Together the two cases pin both halves
    // of `left.pid === mine.pid && left.at === mine.at`.
    expect(
      await breakStaleLock(repo.lockPath, () => now, {
        afterLockedReread: async () => {
          await writeFile(breakPath, `${process.pid + 1}\n${now}\n`, "utf8");
        },
      }),
    ).toBe(true);
    expect(await readFile(breakPath, "utf8")).toBe(
      `${process.pid + 1}\n${now}\n`,
    );
  } finally {
    await repo.cleanup();
  }
});
