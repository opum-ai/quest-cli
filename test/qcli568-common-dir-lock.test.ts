import { afterEach, expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  open,
  readFile,
  rm,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  acquireCommonDirLock,
  CommonDirLockTimeoutError,
  resolveCommonDirLockPath,
  withCommonDirLock,
} from "../src/application/refs/common-dir-lock.ts";

/**
 * QCLI-568. The common-dir lock serialises `task list --across-refs` runs that
 * start from different worktrees of one clone. These tests use a real temp
 * directory as the "common git dir" and injected pid/clock predicates, so the
 * staleness branches are deterministic and no test sleeps for more than a poll.
 */

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function tempCommonDir(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "qcli568-lock-"));
  roots.push(root);
  return root;
}

interface SeededOwner {
  readonly pid: number;
  readonly startedAt: number;
  readonly token: string;
}

async function seedLock(
  commonDir: string,
  owner: SeededOwner,
): Promise<string> {
  const path = resolveCommonDirLockPath(commonDir);
  await mkdir(join(commonDir, "quest"), { recursive: true });
  await writeFile(path, `${JSON.stringify(owner)}\n`, "utf8");
  return path;
}

async function readSeededOwner(commonDir: string): Promise<SeededOwner> {
  return JSON.parse(
    await readFile(resolveCommonDirLockPath(commonDir), "utf8"),
  );
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as { readonly code?: string }).code === "ENOENT") return false;
    throw error;
  }
}

test("resolves the lock under the clone's common git directory", () => {
  expect(resolveCommonDirLockPath("/clone/.git")).toBe(
    join("/clone/.git", "quest", "across-refs.lock"),
  );
  // A name that could escape the lock directory is rejected outright.
  expect(() => resolveCommonDirLockPath("/clone/.git", "../escape")).toThrow(
    TypeError,
  );
});

test("serializes holders from one clone: two never overlap", async () => {
  const commonDir = await tempCommonDir();
  let inside = 0;
  let overlapped = false;
  const events: string[] = [];

  const run = (label: string) =>
    withCommonDirLock(
      commonDir,
      async () => {
        inside += 1;
        if (inside > 1) overlapped = true;
        events.push(`enter-${label}`);
        // Yield long enough that a second, unserialised run would enter.
        await new Promise((resolve) => setTimeout(resolve, 25));
        events.push(`exit-${label}`);
        inside -= 1;
      },
      { pollMs: 5, waitTimeoutMs: 5_000 },
    );

  await Promise.all([run("a"), run("b")]);

  expect(overlapped).toBe(false);
  expect(events).toHaveLength(4);
  // Strict alternation is the interleaving proof: no second enter before the
  // first exit.
  expect(events[0]).toMatch(/^enter-/);
  expect(events[1]).toMatch(/^exit-/);
  expect(events[2]).toMatch(/^enter-/);
  expect(events[3]).toMatch(/^exit-/);
});

test("releases the lock when the work throws", async () => {
  const commonDir = await tempCommonDir();

  await expect(
    withCommonDirLock(
      commonDir,
      async () => {
        throw new Error("boom");
      },
      { pollMs: 5, waitTimeoutMs: 5_000 },
    ),
  ).rejects.toThrow("boom");

  // If the throw stranded the lock, this acquisition would time out.
  const lock = await acquireCommonDirLock(commonDir, {
    pollMs: 5,
    waitTimeoutMs: 500,
  });
  await lock.release();
  expect(await pathExists(resolveCommonDirLockPath(commonDir))).toBe(false);
});

test("recovers a lock whose holder pid is dead", async () => {
  const commonDir = await tempCommonDir();
  await seedLock(commonDir, {
    pid: 999_999,
    // Older than the dead-pid floor: a fresh dead pid is treated as mid-write.
    startedAt: Date.now() - 60_000,
    token: "dead-holder",
  });

  const lock = await acquireCommonDirLock(commonDir, {
    // The seeded pid is not this process, so it probes dead.
    isAlive: (pid) => pid === process.pid,
    pollMs: 5,
    waitTimeoutMs: 500,
  });
  const owner = await readSeededOwner(commonDir);
  expect(owner.token).not.toBe("dead-holder");
  expect(owner.pid).toBe(process.pid);
  await lock.release();
});

test("a lock replaced after the stale judgement is never removed, and no contender can create mid-recovery", async () => {
  const commonDir = await tempCommonDir();
  const frozenNow = 1_700_000_000_000;
  const lockPath = await seedLock(commonDir, {
    pid: 999_999,
    startedAt: frozenNow - 120_000,
    token: "judged-stale",
  });

  // The contender is a REAL new holder: its pid is this process and it is
  // fresh, so the only correct recovery is to leave it alone.
  const contender: SeededOwner = {
    pid: process.pid,
    startedAt: frozenNow,
    token: "contender",
  };
  let midRecoveryCreateSucceeded = false;

  const error = await acquireCommonDirLock(commonDir, {
    isAlive: (pid) => pid === process.pid,
    now: () => frozenNow,
    staleAfterMs: 600_000,
    pidGoneFloorMs: 30_000,
    pollMs: 5,
    waitTimeoutMs: 200,
    afterStaleJudgement: async () => {
      // F1: a competing breaker removes the judged-stale lock and a new
      // holder acquires before this caller acts on its stale reading.
      await unlink(lockPath);
      await writeFile(lockPath, `${JSON.stringify(contender)}\n`, "utf8");
    },
    afterLockedReread: async () => {
      // If recovery has emptied lockPath, a third contender creates here --
      // the F1 window. In a correct recovery the path is still occupied.
      try {
        const handle = await open(lockPath, "wx");
        midRecoveryCreateSucceeded = true;
        await handle.writeFile(
          `${JSON.stringify({ pid: process.pid, startedAt: frozenNow, token: "third" })}\n`,
          "utf8",
        );
        await handle.close();
      } catch (thrown) {
        if ((thrown as { readonly code?: string }).code !== "EEXIST") {
          throw thrown;
        }
      }
    },
  }).then(
    () => null,
    (thrown: unknown) => thrown,
  );

  // The contender is live, so this caller can only wait.
  expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
  // RED against rename-and-restore recovery: the contender's lock is moved
  // aside, a third lock is created in the gap, and the restore drops the
  // contender's body.
  expect(midRecoveryCreateSucceeded).toBe(false);
  expect((await readSeededOwner(commonDir)).token).toBe("contender");
});

test("two waiters recovering one stale lock still serialize", async () => {
  const commonDir = await tempCommonDir();
  await seedLock(commonDir, {
    pid: 999_999,
    startedAt: Date.now() - 60_000,
    token: "stale-holder",
  });

  let inside = 0;
  let overlapped = false;
  const run = () =>
    withCommonDirLock(
      commonDir,
      async () => {
        inside += 1;
        if (inside > 1) overlapped = true;
        await new Promise((resolve) => setTimeout(resolve, 15));
        inside -= 1;
      },
      // Only the seeded pid is dead. The winner's fresh lock carries this
      // process's live pid, so the loser must wait rather than steal it.
      {
        isAlive: (pid) => pid === process.pid,
        pollMs: 5,
        waitTimeoutMs: 5_000,
      },
    );

  // Both waiters judge the same lock stale and race to recover it. Exactly one
  // may end up holding; the loser must wait for the winner's release.
  await Promise.all([run(), run()]);
  expect(overlapped).toBe(false);
});

test("a fresh dead-pid lock is not broken before the floor", async () => {
  const commonDir = await tempCommonDir();
  // Age ~0: a create interrupted before its body write looks exactly like this
  // and must be left alone until the floor passes.
  const path = await seedLock(commonDir, {
    pid: 999_999,
    startedAt: Date.now(),
    token: "mid-write",
  });

  const error = await acquireCommonDirLock(commonDir, {
    isAlive: (pid) => pid === process.pid,
    pollMs: 5,
    waitTimeoutMs: 100,
  }).then(
    () => null,
    (thrown: unknown) => thrown,
  );

  expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
  expect((await readSeededOwner(commonDir)).token).toBe("mid-write");
  expect(await pathExists(path)).toBe(true);
});

test("a stale break file from a killed breaker is cleared", async () => {
  const commonDir = await tempCommonDir();
  const lockPath = await seedLock(commonDir, {
    pid: 999_999,
    startedAt: Date.now() - 60_000,
    token: "dead-holder",
  });
  const breakPath = `${lockPath}.break`;
  await writeFile(
    breakPath,
    `${JSON.stringify({ pid: 999_998, startedAt: Date.now() - 60_000, token: "dead-breaker" })}\n`,
    "utf8",
  );

  const lock = await acquireCommonDirLock(commonDir, {
    isAlive: (pid) => pid === process.pid,
    pollMs: 5,
    waitTimeoutMs: 1_000,
  });
  expect((await readSeededOwner(commonDir)).token).not.toBe("dead-holder");
  await lock.release();
  expect(await pathExists(breakPath)).toBe(false);
});

test("a live break file serialises breakers", async () => {
  const commonDir = await tempCommonDir();
  const lockPath = await seedLock(commonDir, {
    pid: 999_999,
    startedAt: Date.now() - 60_000,
    token: "dead-holder",
  });
  const breakPath = `${lockPath}.break`;
  const liveBreaker = {
    pid: process.pid,
    startedAt: Date.now(),
    token: "live-breaker",
  };
  await writeFile(breakPath, `${JSON.stringify(liveBreaker)}\n`, "utf8");

  const error = await acquireCommonDirLock(commonDir, {
    isAlive: (pid) => pid === process.pid,
    pollMs: 5,
    waitTimeoutMs: 100,
  }).then(
    () => null,
    (thrown: unknown) => thrown,
  );

  // A paused breaker must not lose its break file to a second breaker.
  expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
  expect((await readSeededOwner(commonDir)).token).toBe("dead-holder");
  expect(JSON.parse(await readFile(breakPath, "utf8")).token).toBe(
    "live-breaker",
  );
});

test("recovers the lock of a child killed with SIGKILL", async () => {
  const commonDir = await tempCommonDir();
  const scriptPath = join(commonDir, "holder.ts");
  await writeFile(
    scriptPath,
    [
      'import { mkdir, writeFile } from "node:fs/promises";',
      'import { join } from "node:path";',
      "const commonDir = process.argv[2];",
      'const path = join(commonDir, "quest", "across-refs.lock");',
      'await mkdir(join(commonDir, "quest"), { recursive: true });',
      'await writeFile(path, JSON.stringify({ pid: process.pid, startedAt: Date.now(), token: "child" }) + "\\n");',
      'process.stdout.write("held\\n");',
      "setInterval(() => {}, 1_000);",
      "",
    ].join("\n"),
    "utf8",
  );

  const child = Bun.spawn([process.execPath, scriptPath, commonDir], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const lockPath = resolveCommonDirLockPath(commonDir);
  const readyBy = Date.now() + 5_000;
  while (!(await pathExists(lockPath))) {
    if (Date.now() > readyBy) {
      child.kill(9);
      throw new Error("child never created the lock");
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  const childOwner = JSON.parse(await readFile(lockPath, "utf8"));
  child.kill(9);
  await child.exited;

  // A real dead pid. A short floor keeps the test bounded; the age backstop
  // is out of reach, so recovery can only come from the dead-pid rule.
  const started = performance.now();
  const lock = await acquireCommonDirLock(commonDir, {
    pidGoneFloorMs: 100,
    staleAfterMs: 60_000,
    pollMs: 10,
    waitTimeoutMs: 5_000,
  });
  const elapsed = performance.now() - started;
  const recovered = await readSeededOwner(commonDir);
  await lock.release();

  expect(recovered.pid).toBe(process.pid);
  expect(recovered.pid).not.toBe(childOwner.pid);
  expect(elapsed).toBeLessThan(5_000);
}, 20_000);

test("recovers a lock older than staleAfterMs even when its pid is alive", async () => {
  const commonDir = await tempCommonDir();
  const frozenNow = 1_700_000_000_000;
  await seedLock(commonDir, {
    pid: process.pid,
    startedAt: frozenNow - 5_000,
    token: "aged-holder",
  });

  // The clock is frozen, so only the age clause can make this holder stale; the
  // real monotonic wait deadline is what keeps a recovery bug from hanging.
  const lock = await acquireCommonDirLock(commonDir, {
    isAlive: () => true,
    now: () => frozenNow,
    staleAfterMs: 1_000,
    pollMs: 5,
    waitTimeoutMs: 2_000,
  });
  expect((await readSeededOwner(commonDir)).token).not.toBe("aged-holder");
  await lock.release();
});

test("does not steal a live, unexpired holder", async () => {
  const commonDir = await tempCommonDir();
  const path = await seedLock(commonDir, {
    pid: process.pid,
    startedAt: Date.now(),
    token: "live-holder",
  });

  const error = await acquireCommonDirLock(commonDir, {
    isAlive: () => true,
    pollMs: 5,
    waitTimeoutMs: 75,
  }).then(
    () => null,
    (thrown: unknown) => thrown,
  );

  expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
  // The holder's file is untouched, not replaced by the timed-out waiter.
  expect((await readSeededOwner(commonDir)).token).toBe("live-holder");
  expect(await pathExists(path)).toBe(true);
});

test("a wait that exceeds waitTimeoutMs throws the typed timeout", async () => {
  const commonDir = await tempCommonDir();
  await seedLock(commonDir, {
    pid: process.pid,
    startedAt: Date.now(),
    token: "busy-holder",
  });

  let caught: unknown;
  try {
    await acquireCommonDirLock(commonDir, {
      isAlive: () => true,
      pollMs: 5,
      waitTimeoutMs: 50,
    });
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(CommonDirLockTimeoutError);
  const timeout = caught as CommonDirLockTimeoutError;
  expect(timeout.name).toBe("CommonDirLockTimeoutError");
  expect(timeout.holder?.token).toBe("busy-holder");
  // The advisory lock is explicit about the caller's choice on expiry.
  expect(timeout.message).toContain("may proceed without it");
});

test("release never deletes a lock carrying another holder's token", async () => {
  const commonDir = await tempCommonDir();
  const lock = await acquireCommonDirLock(commonDir);
  const path = resolveCommonDirLockPath(commonDir);

  // Simulate our file being judged stale and replaced while we were running.
  const replacement: SeededOwner = {
    pid: 1,
    startedAt: Date.now(),
    token: "someone-else",
  };
  await writeFile(path, `${JSON.stringify(replacement)}\n`, "utf8");

  await lock.release();

  expect((await readSeededOwner(commonDir)).token).toBe("someone-else");
  await unlink(path);
});

test("release is idempotent and leaves the quest directory in place", async () => {
  const commonDir = await tempCommonDir();
  const lock = await acquireCommonDirLock(commonDir);

  expect(await pathExists(join(commonDir, "quest"))).toBe(true);
  await lock.release();
  await lock.release();

  expect(await pathExists(resolveCommonDirLockPath(commonDir))).toBe(false);
  expect(await pathExists(join(commonDir, "quest"))).toBe(true);
});

test("withCommonDirLock lets a waiter reuse the result the previous holder wrote", async () => {
  const commonDir = await tempCommonDir();

  // Both runs capture the same ref hashes BEFORE they start waiting, exactly
  // as `--across-refs` captures the SHAs it is about to read.
  const capturedRefHashes = "sha:aaaaaaaa";
  let cache: { refHashes: string; result: string } | null = null;
  let workRuns = 0;

  const run = (label: string) =>
    withCommonDirLock(
      commonDir,
      async () => {
        // Waiter reuse is the caller's job: re-read the cache after acquiring
        // and reuse a result whose ref hashes still match.
        if (cache !== null && cache.refHashes === capturedRefHashes) {
          return cache.result;
        }
        workRuns += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        cache = { refHashes: capturedRefHashes, result: `result-${label}` };
        return cache.result;
      },
      { pollMs: 5, waitTimeoutMs: 5_000 },
    );

  const [first, second] = await Promise.all([run("first"), run("second")]);

  // The work ran once; the second holder observed the first's result while it
  // waited on the lock and skipped its own read.
  expect(workRuns).toBe(1);
  expect(first).toBe(second);
});
