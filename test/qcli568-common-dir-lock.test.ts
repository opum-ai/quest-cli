import { afterEach, expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  open,
  readFile,
  rm,
  stat,
  unlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import { hostname as osHostname, tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
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
  /** QCLI-568 Q568-INT A: the liveness stamp; absent on a pre-heartbeat record. */
  readonly updatedAt?: number;
  /** DEC-282 (a16): the holder's host; absent on a record written before it. */
  readonly host?: string;
}

/**
 * Poll until `predicate` holds or the deadline passes. Used only to wait for a
 * real heartbeat to land on an injected clock, so the heartbeat tests assert a
 * state rather than sleeping a guess.
 */
async function waitFor(
  predicate: () => Promise<boolean> | boolean,
  timeoutMs = 2_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await predicate()) return;
    if (Date.now() > deadline)
      throw new Error(`condition not met within ${timeoutMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
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
    host: osHostname(),
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

test("a lock replaced after the stale judgement is never removed", async () => {
  const commonDir = await tempCommonDir();
  const frozenNow = 1_700_000_000_000;
  const lockPath = await seedLock(commonDir, {
    pid: 999_999,
    startedAt: frozenNow - 120_000,
    token: "judged-stale",
    host: osHostname(),
  });

  // The contender is a REAL new holder: its pid is this process and it is
  // fresh, so the only correct recovery is to leave it alone.
  const contender: SeededOwner = {
    pid: process.pid,
    startedAt: frozenNow,
    token: "contender",
    host: osHostname(),
  };
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
  }).then(
    () => null,
    (thrown: unknown) => thrown,
  );

  // The contender is live, so this caller can only wait.
  expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
  expect((await readSeededOwner(commonDir)).token).toBe("contender");
});

test("the locked re-read runs exactly once with the lock path still occupied", async () => {
  const commonDir = await tempCommonDir();
  const frozenNow = 1_700_000_000_000;
  const lockPath = await seedLock(commonDir, {
    pid: 999_999,
    startedAt: frozenNow - 120_000,
    token: "judged-stale",
    host: osHostname(),
  });

  let hookRuns = 0;
  let probeSawEexist = false;
  const lock = await acquireCommonDirLock(commonDir, {
    isAlive: (pid) => pid === process.pid,
    now: () => frozenNow,
    staleAfterMs: 600_000,
    pidGoneFloorMs: 30_000,
    pollMs: 5,
    waitTimeoutMs: 1_000,
    afterLockedReread: async () => {
      hookRuns += 1;
      // The judged lock must still occupy the path here: recovery removes it
      // only after this seam returns.
      try {
        const handle = await open(lockPath, "wx");
        await handle.close();
        await unlink(lockPath);
      } catch (thrown) {
        if ((thrown as { readonly code?: string }).code === "EEXIST") {
          probeSawEexist = true;
        } else {
          throw thrown;
        }
      }
    },
  });
  await lock.release();

  expect(hookRuns).toBe(1);
  expect(probeSawEexist).toBe(true);
});

test("two waiters recovering one stale lock still serialize", async () => {
  const commonDir = await tempCommonDir();
  await seedLock(commonDir, {
    pid: 999_999,
    startedAt: Date.now() - 60_000,
    token: "stale-holder",
    host: osHostname(),
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
    host: osHostname(),
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
    host: osHostname(),
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
    host: osHostname(),
  });
  const breakPath = `${lockPath}.break`;
  const liveBreaker = {
    pid: process.pid,
    // Mid-band: older than breakStaleAfterMs (10 s) but younger than the
    // default staleAfterMs (600 s). A LIVE pid must survive here, so the second
    // breaker waits instead of clearing a paused breaker's file.
    startedAt: Date.now() - 60_000,
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

test("an aged unreadable break file is cleared by age alone", async () => {
  const commonDir = await tempCommonDir();
  const frozenNow = 1_700_000_000_000;
  const lockPath = await seedLock(commonDir, {
    pid: 999_999,
    startedAt: frozenNow - 120_000,
    token: "dead-holder",
    host: osHostname(),
  });
  const breakPath = `${lockPath}.break`;
  await writeFile(breakPath, "", "utf8");
  const old = new Date(frozenNow - 700_000);
  await utimes(breakPath, old, old);

  // N1: the unreadable breaker is past the age-only backstop, so recovery is
  // not disabled forever.
  const lock = await acquireCommonDirLock(commonDir, {
    isAlive: (pid) => pid === process.pid,
    now: () => frozenNow,
    staleAfterMs: 1_000,
    pollMs: 5,
    waitTimeoutMs: 1_000,
  });
  expect((await readSeededOwner(commonDir)).token).not.toBe("dead-holder");
  await lock.release();
  expect(await pathExists(breakPath)).toBe(false);
});

test("an aged break file held by a live pid is cleared by age alone", async () => {
  const commonDir = await tempCommonDir();
  const frozenNow = 1_700_000_000_000;
  const lockPath = await seedLock(commonDir, {
    pid: 999_999,
    startedAt: frozenNow - 120_000,
    token: "dead-holder",
    host: osHostname(),
  });
  const breakPath = `${lockPath}.break`;
  await writeFile(
    breakPath,
    `${JSON.stringify({ pid: process.pid, startedAt: frozenNow - 700_000, token: "live-but-aged" })}\n`,
    "utf8",
  );

  // The pid reads alive (reuse / a suspended breaker), but the age backstop
  // clears it anyway.
  const lock = await acquireCommonDirLock(commonDir, {
    isAlive: (pid) => pid === process.pid,
    now: () => frozenNow,
    staleAfterMs: 1_000,
    pollMs: 5,
    waitTimeoutMs: 1_000,
  });
  expect((await readSeededOwner(commonDir)).token).not.toBe("dead-holder");
  await lock.release();
  expect(await pathExists(breakPath)).toBe(false);
});

test("a fresh unreadable break file is not cleared", async () => {
  const commonDir = await tempCommonDir();
  const lockPath = await seedLock(commonDir, {
    pid: 999_999,
    startedAt: Date.now() - 60_000,
    token: "dead-holder",
    host: osHostname(),
  });
  const breakPath = `${lockPath}.break`;
  await writeFile(breakPath, "", "utf8");

  const error = await acquireCommonDirLock(commonDir, {
    isAlive: (pid) => pid === process.pid,
    pollMs: 5,
    waitTimeoutMs: 100,
  }).then(
    () => null,
    (thrown: unknown) => thrown,
  );

  // Inside the window a breaker has to write its pid; do not clear it.
  expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
  expect(await pathExists(breakPath)).toBe(true);
  expect((await readSeededOwner(commonDir)).token).toBe("dead-holder");
});

test("an unreadable break file younger than staleAfterMs is not cleared", async () => {
  const commonDir = await tempCommonDir();
  const lockPath = await seedLock(commonDir, {
    pid: 999_999,
    startedAt: Date.now() - 60_000,
    token: "dead-holder",
    host: osHostname(),
  });
  const breakPath = `${lockPath}.break`;
  await writeFile(breakPath, "", "utf8");
  // MID-BAND: older than the default breakStaleAfterMs (10 s) but younger than
  // the default staleAfterMs (600 s). An unreadable body may be a breaker
  // mid-write, so it must be KEPT here -- only the staleAfterMs age backstop
  // may clear it.
  const old = new Date(Date.now() - 60_000);
  await utimes(breakPath, old, old);

  const error = await acquireCommonDirLock(commonDir, {
    isAlive: (pid) => pid === process.pid,
    pollMs: 5,
    waitTimeoutMs: 100,
  }).then(
    () => null,
    (thrown: unknown) => thrown,
  );

  expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
  expect(await pathExists(breakPath)).toBe(true);
  expect((await readSeededOwner(commonDir)).token).toBe("dead-holder");
});

test("the timeout message reports a live break file and the remedy", async () => {
  const commonDir = await tempCommonDir();
  const lockPath = await seedLock(commonDir, {
    pid: 999_999,
    startedAt: Date.now() - 60_000,
    token: "dead-holder",
    host: osHostname(),
  });
  const breakPath = `${lockPath}.break`;
  await writeFile(
    breakPath,
    `${JSON.stringify({ pid: process.pid, startedAt: Date.now(), token: "live-breaker" })}\n`,
    "utf8",
  );

  const error = await acquireCommonDirLock(commonDir, {
    isAlive: (pid) => pid === process.pid,
    pollMs: 5,
    waitTimeoutMs: 50,
  }).then(
    () => null,
    (thrown: unknown) => thrown,
  );

  expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
  const timeout = error as CommonDirLockTimeoutError;
  expect(timeout.breakFilePresent).toBe(true);
  expect(timeout.breakHolderPid).toBe(process.pid);
  expect(timeout.breakHolderAlive).toBe(true);
  expect(timeout.message).toContain(breakPath);
  expect(timeout.message).toContain(`LIVE pid ${process.pid}`);
  expect(timeout.message).toContain("may proceed without it");
});

test("the timeout message reports an unreadable break file", async () => {
  const commonDir = await tempCommonDir();
  const lockPath = await seedLock(commonDir, {
    pid: 999_999,
    startedAt: Date.now() - 60_000,
    token: "dead-holder",
    host: osHostname(),
  });
  const breakPath = `${lockPath}.break`;
  await writeFile(breakPath, "", "utf8");

  const error = await acquireCommonDirLock(commonDir, {
    isAlive: (pid) => pid === process.pid,
    pollMs: 5,
    waitTimeoutMs: 50,
  }).then(
    () => null,
    (thrown: unknown) => thrown,
  );

  expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
  const timeout = error as CommonDirLockTimeoutError;
  expect(timeout.breakFilePresent).toBe(true);
  expect(timeout.breakHolderPid).toBeNull();
  expect(timeout.message).toContain(breakPath);
  expect(timeout.message).toContain("cannot be read");
});

test("the timeout message reports no break file", async () => {
  const commonDir = await tempCommonDir();
  const lockPath = await seedLock(commonDir, {
    pid: process.pid,
    startedAt: Date.now(),
    token: "live-holder",
    host: osHostname(),
  });
  const breakPath = `${lockPath}.break`;

  // A live, fresh holder with no breaker at all: plain contention.
  const error = await acquireCommonDirLock(commonDir, {
    isAlive: () => true,
    pollMs: 5,
    waitTimeoutMs: 50,
  }).then(
    () => null,
    (thrown: unknown) => thrown,
  );

  expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
  const timeout = error as CommonDirLockTimeoutError;
  expect(timeout.breakFilePresent).toBe(false);
  expect(timeout.breakHolderPid).toBeNull();
  expect(timeout.message).toContain(`No break file exists at ${breakPath}.`);
});

test("the timeout message reports a break file held by a dead pid", async () => {
  const commonDir = await tempCommonDir();
  const lockPath = await seedLock(commonDir, {
    pid: process.pid,
    startedAt: Date.now(),
    token: "live-holder",
    host: osHostname(),
  });
  const breakPath = `${lockPath}.break`;
  await writeFile(
    breakPath,
    `${JSON.stringify({ pid: 999_999, startedAt: Date.now(), token: "dead-breaker" })}\n`,
    "utf8",
  );

  // The lock is live, so the breaker is never inspected by recovery; the timeout
  // message must still report it.
  const error = await acquireCommonDirLock(commonDir, {
    isAlive: (pid) => pid === process.pid,
    pollMs: 5,
    waitTimeoutMs: 50,
  }).then(
    () => null,
    (thrown: unknown) => thrown,
  );

  expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
  const timeout = error as CommonDirLockTimeoutError;
  expect(timeout.breakFilePresent).toBe(true);
  expect(timeout.breakHolderPid).toBe(999_999);
  expect(timeout.breakHolderAlive).toBe(false);
  expect(timeout.message).toContain("which is not running");
});

test("the timeout message keeps the lock age of an unreadable holder", async () => {
  const commonDir = await tempCommonDir();
  const lockPath = resolveCommonDirLockPath(commonDir);
  await mkdir(join(commonDir, "quest"), { recursive: true });
  await writeFile(lockPath, "", "utf8");
  const old = new Date(Date.now() - 60_000);
  await utimes(lockPath, old, old);

  // The pid floor is above the age, so the unreadable body is not judged stale
  // and the caller must wait -- and report the age from the file's mtime.
  const error = await acquireCommonDirLock(commonDir, {
    isAlive: () => true,
    pidGoneFloorMs: 120_000,
    pollMs: 5,
    waitTimeoutMs: 75,
  }).then(
    () => null,
    (thrown: unknown) => thrown,
  );

  expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
  const timeout = error as CommonDirLockTimeoutError;
  expect(timeout.holder).toBeNull();
  expect(timeout.lockAgeMs).not.toBeNull();
  expect(timeout.lockAgeMs ?? 0).toBeGreaterThan(30_000);
  expect(timeout.message).toContain("no readable holder");
  expect(timeout.message).toContain("stamped");
});

test("recovers the lock of a child killed with SIGKILL", async () => {
  const commonDir = await tempCommonDir();
  const modulePath = fileURLToPath(
    new URL("../src/application/refs/common-dir-lock.ts", import.meta.url),
  );
  const scriptPath = join(commonDir, "holder.ts");
  await writeFile(
    scriptPath,
    [
      `import { acquireCommonDirLock } from ${JSON.stringify(modulePath)};`,
      "const commonDir = process.argv[2];",
      "await acquireCommonDirLock(commonDir);",
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
  const stdout = child.stdout;
  if (!stdout) throw new Error("child stdout was not piped");
  // Drain stderr in the background so a failure message can name it. It is only
  // read after the child has been killed (closing the stream).
  const stderrText = child.stderr
    ? new Response(child.stderr).text()
    : Promise.resolve("");
  const reader = stdout.getReader();
  const decoder = new TextDecoder();
  let output = "";
  try {
    const readyBy = Date.now() + 5_000;
    while (!output.includes("held")) {
      if (Date.now() > readyBy) {
        child.kill(9);
        await child.exited;
        throw new Error(
          `child never printed held; stderr: ${await stderrText}`,
        );
      }
      const { value, done } = await reader.read();
      if (done) break;
      output += decoder.decode(value, { stream: true });
    }
    reader.releaseLock();
    expect(output).toContain("held");

    // The child has signalled that its acquire returned, so its body is written.
    const lockPath = resolveCommonDirLockPath(commonDir);
    const childOwner = JSON.parse(await readFile(lockPath, "utf8"));
    expect(childOwner.pid).toBe(child.pid);
    child.kill(9);
    await child.exited;

    // POSITIVE CONTROL: the SIGKILLed holder left its lock behind. If the child
    // had exited cleanly, the exit hook would have removed it and the recovery
    // below would prove nothing about the dead-pid rule.
    expect(await pathExists(lockPath)).toBe(true);
  } finally {
    try {
      child.kill(9);
    } catch {
      // Already gone.
    }
  }

  // A real dead pid. A short floor keeps the test bounded; the age backstop is
  // out of reach, so recovery can only come from the dead-pid rule.
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
  // Close to the 100 ms floor, not merely inside the wait timeout.
  expect(elapsed).toBeLessThan(1_000);
}, 20_000);

test("recovers a silent holder recorded on ANOTHER host after staleAfterMs (DEC-282 (a16))", async () => {
  const commonDir = await tempCommonDir();
  const frozenNow = 1_700_000_000_000;
  await seedLock(commonDir, {
    pid: process.pid,
    startedAt: frozenNow - 5_000,
    updatedAt: frozenNow - 5_000,
    token: "other-host-holder",
    host: "elsewhere.example",
  });

  // The pid is THIS process's and probes alive, but the record names another
  // host, so liveness cannot be confirmed here: silence past staleAfterMs
  // (5 s > 1 s) recovers it. A same-host record with this pid would be KEPT.
  const lock = await acquireCommonDirLock(commonDir, {
    isAlive: () => true,
    now: () => frozenNow,
    staleAfterMs: 1_000,
    pollMs: 5,
    waitTimeoutMs: 2_000,
  });
  expect((await readSeededOwner(commonDir)).token).not.toBe(
    "other-host-holder",
  );
  await lock.release();
});

test("does not steal a live, unexpired holder", async () => {
  const commonDir = await tempCommonDir();
  const path = await seedLock(commonDir, {
    pid: process.pid,
    startedAt: Date.now(),
    token: "live-holder",
    host: osHostname(),
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
    host: osHostname(),
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

/* -------------------------------------------------------------------------- */
/* QCLI-568 Q568-INT A: the heartbeat (DEC-282 (a15))                          */
/*                                                                             */
/* A live holder refreshes a liveness stamp; staleness is judged on the        */
/* SILENCE since that stamp, never on the holder's acquisition age. Each test  */
/* below was run against the listed mutant and observed RED before the fix was */
/* restored (see the commit body).                                             */
/* -------------------------------------------------------------------------- */

test("(a) a live holder older than staleAfterMs that keeps heartbeating is NOT broken", async () => {
  const commonDir = await tempCommonDir();
  const base = 1_700_000_000_000;
  const clock = { t: base };
  const lockPath = resolveCommonDirLockPath(commonDir);

  const holder = await acquireCommonDirLock(commonDir, {
    now: () => clock.t,
    heartbeatMs: 20,
    staleAfterMs: 1_000,
    pidGoneFloorMs: 30_000,
    pollMs: 5,
    waitTimeoutMs: 2_000,
  });
  try {
    const held = JSON.parse(await readFile(lockPath, "utf8")) as SeededOwner;
    // The holder's ACQUISITION stamp is now five times the stale bound old --
    // exactly the state the old age-only rule broke while the run was alive.
    clock.t = base + 5_000;
    // POSITIVE CONTROL: a real beat lands on the injected clock, so staleness
    // is genuinely being measured from a refreshed stamp, not from a lucky time.
    await waitFor(async () => {
      const current = JSON.parse(
        await readFile(lockPath, "utf8"),
      ) as SeededOwner;
      return current.updatedAt === clock.t;
    });

    // A waiter here is SAME-HOST and the pid probes alive, so DEC-282 (a16)
    // says never steal: it waits. (The positive control above keeps the
    // heartbeat itself load-bearing, since a beatless same-host live holder is
    // also never stale.)
    const error = await acquireCommonDirLock(commonDir, {
      now: () => clock.t,
      isAlive: () => true,
      staleAfterMs: 1_000,
      pidGoneFloorMs: 30_000,
      pollMs: 5,
      waitTimeoutMs: 100,
    }).then(
      () => null,
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
    // The beating holder's file is untouched, not broken and replaced.
    expect(
      ((await readFile(lockPath, "utf8").then(JSON.parse)) as SeededOwner)
        .token,
    ).toBe(held.token);
  } finally {
    await holder.release();
  }
});

test("(b) a SILENT same-host holder with a LIVE-looking pid is NOT broken (DEC-282 (a16))", async () => {
  const commonDir = await tempCommonDir();
  const base = 1_700_000_000_000;
  await seedLock(commonDir, {
    pid: process.pid,
    startedAt: base,
    updatedAt: base,
    token: "silent-same-host",
    host: osHostname(),
  });

  // 5 s of silence against a 1 s bound, and the pid probes ALIVE on THIS host:
  // (a16) says never steal by age -- the waiter times out and leaves the file.
  const error = await acquireCommonDirLock(commonDir, {
    now: () => base + 5_000,
    isAlive: () => true,
    staleAfterMs: 1_000,
    pidGoneFloorMs: 30_000,
    pollMs: 5,
    waitTimeoutMs: 100,
  }).then(
    () => null,
    (thrown: unknown) => thrown,
  );

  expect(error).toBeInstanceOf(CommonDirLockTimeoutError);
  expect((await readSeededOwner(commonDir)).token).toBe("silent-same-host");
});

test("a SILENT same-host holder with a DEAD pid IS broken past the floor (DEC-282 (a16))", async () => {
  const commonDir = await tempCommonDir();
  const base = 1_700_000_000_000;
  await seedLock(commonDir, {
    pid: 999_999,
    startedAt: base,
    updatedAt: base,
    token: "silent-dead-pid",
    host: osHostname(),
  });

  // Same host, but the pid is gone. staleAfterMs is left large so recovery can
  // ONLY come from the dead-pid rule at pidGoneFloorMs (silence 5 s > 1 s).
  const lock = await acquireCommonDirLock(commonDir, {
    now: () => base + 5_000,
    isAlive: (pid) => pid === process.pid,
    staleAfterMs: 600_000,
    pidGoneFloorMs: 1_000,
    pollMs: 5,
    waitTimeoutMs: 1_000,
  });
  expect((await readSeededOwner(commonDir)).token).not.toBe("silent-dead-pid");
  await lock.release();
});

test("a record with NO host is unconfirmable and broken past the pid-gone floor (DEC-282 (a16))", async () => {
  const commonDir = await tempCommonDir();
  const base = 1_700_000_000_000;
  // A record written before the `host` field existed: no host, and a dead pid.
  await seedLock(commonDir, {
    pid: 999_999,
    startedAt: base,
    updatedAt: base,
    token: "legacy-no-host",
  });

  // (a16) follows lore-cli#746, whose record parser REQUIRES a hostname: a
  // record missing it is unconfirmable and takes the pidGoneFloorMs bound, NOT
  // the another-host staleAfterMs bound. staleAfterMs is left far above the
  // silence, so this can only recover via the floor.
  const lock = await acquireCommonDirLock(commonDir, {
    now: () => base + 60_000,
    isAlive: (pid) => pid === process.pid,
    staleAfterMs: 600_000,
    pidGoneFloorMs: 30_000,
    pollMs: 5,
    waitTimeoutMs: 1_000,
  });
  expect((await readSeededOwner(commonDir)).token).not.toBe("legacy-no-host");
  await lock.release();
});

test("(c1) the heartbeat timer is unref'd and stopped on release", async () => {
  const commonDir = await tempCommonDir();
  const originalSetInterval = globalThis.setInterval;
  const originalClearInterval = globalThis.clearInterval;
  const created: ReturnType<typeof setInterval>[] = [];
  const cleared: ReturnType<typeof setInterval>[] = [];
  const unrefCalled = new WeakMap<object, () => boolean>();

  globalThis.setInterval = ((...args: Parameters<typeof setInterval>) => {
    const timer = originalSetInterval(...args);
    let called = false;
    const unref = timer.unref?.bind(timer);
    if (unref !== undefined) {
      timer.unref = () => {
        called = true;
        return unref();
      };
    }
    unrefCalled.set(timer as unknown as object, () => called);
    created.push(timer);
    return timer;
  }) as typeof setInterval;
  globalThis.clearInterval = ((timer: Parameters<typeof clearInterval>[0]) => {
    cleared.push(timer as ReturnType<typeof setInterval>);
    return originalClearInterval(timer);
  }) as typeof clearInterval;

  try {
    const lock = await acquireCommonDirLock(commonDir, { heartbeatMs: 60_000 });
    await lock.release();
  } finally {
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
  }

  // POSITIVE CONTROL: the heartbeat STARTED. A build with no heartbeat creates
  // no timer, and every assertion below would then be vacuously satisfied.
  expect(created).toHaveLength(1);
  expect(unrefCalled.get(created[0] as unknown as object)?.()).toBe(true);
  expect(cleared).toContain(created[0]);
});

test("(c2) a process can exit while holding the lock (the heartbeat does not hold it open)", async () => {
  const commonDir = await tempCommonDir();
  const modulePath = fileURLToPath(
    new URL("../src/application/refs/common-dir-lock.ts", import.meta.url),
  );
  const scriptPath = join(commonDir, "exiting-holder.ts");
  await writeFile(
    scriptPath,
    [
      `import { acquireCommonDirLock } from ${JSON.stringify(modulePath)};`,
      "const commonDir = process.argv[2];",
      "await acquireCommonDirLock(commonDir, { heartbeatMs: 60_000 });",
      'process.stdout.write("held\\n");',
      // NOTHING else keeps the event loop alive. If the heartbeat were ref'd,
      // this process would hang until killed; unref'd, it exits on its own.
      "",
    ].join("\n"),
    "utf8",
  );

  const child = Bun.spawn([process.execPath, scriptPath, commonDir], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = child.stdout;
  if (!stdout) throw new Error("child stdout was not piped");
  const reader = stdout.getReader();
  const decoder = new TextDecoder();
  let output = "";
  try {
    const readyBy = Date.now() + 5_000;
    while (!output.includes("held")) {
      if (Date.now() > readyBy) throw new Error("child never printed held");
      const { value, done } = await reader.read();
      if (done) break;
      output += decoder.decode(value, { stream: true });
    }
    reader.releaseLock();
    expect(output).toContain("held");

    const exited = await Promise.race([
      child.exited.then(() => true),
      new Promise<boolean>((resolve) =>
        setTimeout(() => resolve(false), 3_000),
      ),
    ]);
    if (!exited) {
      child.kill(9);
      await child.exited;
    }
    // A ref'd heartbeat would have kept it alive past the 3 s bound.
    expect(exited).toBe(true);
    expect(child.exitCode).toBe(0);
  } finally {
    try {
      child.kill(9);
    } catch {
      // Already gone.
    }
  }
}, 15_000);

test("(d) a heartbeat never resurrects or clobbers a lock the holder no longer owns", async () => {
  const commonDir = await tempCommonDir();
  const base = 1_700_000_000_000;
  const clock = { t: base };
  const lockPath = resolveCommonDirLockPath(commonDir);
  const breakPath = `${lockPath}.break`;

  const holder = await acquireCommonDirLock(commonDir, {
    now: () => clock.t,
    heartbeatMs: 15,
    staleAfterMs: 600_000,
    pollMs: 5,
    waitTimeoutMs: 1_000,
  });
  const successor: SeededOwner = {
    pid: 424_242,
    startedAt: base,
    updatedAt: base,
    token: "successor",
  };
  try {
    const token = (JSON.parse(await readFile(lockPath, "utf8")) as SeededOwner)
      .token;

    // Serialise the replacement with the heartbeat: take `.break` ourselves
    // (called `mine`, so it is not a stale breaker) so no beat can run between
    // our read and our write. Then hand the path to a successor.
    await waitFor(async () => {
      try {
        const handle = await open(breakPath, "wx");
        await handle.writeFile(
          `${JSON.stringify({ pid: process.pid, startedAt: Date.now(), token: "test-breaker" })}\n`,
          "utf8",
        );
        await handle.close();
        return true;
      } catch (error) {
        if ((error as { readonly code?: string }).code !== "EEXIST")
          throw error;
        return false;
      }
    });
    await writeFile(lockPath, `${JSON.stringify(successor)}\n`, "utf8");
    await unlink(breakPath);

    // Several beats now fire, each seeing a token that is not the holder's.
    clock.t = base + 10_000;
    await new Promise((resolve) => setTimeout(resolve, 200));

    // No beat may touch the successor's record -- not its token, not its stamp.
    expect(JSON.parse(await readFile(lockPath, "utf8"))).toEqual(successor);

    // Release is token-checked too: it must not delete the successor's file.
    await holder.release();
    expect(JSON.parse(await readFile(lockPath, "utf8"))).toEqual(successor);
    expect(token).not.toBe(successor.token);
  } finally {
    await unlink(lockPath).catch(() => undefined);
    await unlink(breakPath).catch(() => undefined);
  }
});

test("(e) a heartbeat write failure does not throw into the holder's run", async () => {
  const commonDir = await tempCommonDir();
  const base = 1_700_000_000_000;
  const clock = { t: base };
  const lockPath = resolveCommonDirLockPath(commonDir);

  const holder = await acquireCommonDirLock(commonDir, {
    now: () => clock.t,
    heartbeatMs: 10,
    staleAfterMs: 600_000,
    pollMs: 5,
    waitTimeoutMs: 1_000,
  });
  let temporary = "";
  try {
    const token = (JSON.parse(await readFile(lockPath, "utf8")) as SeededOwner)
      .token;
    temporary = `${lockPath}.${token}.tmp`;

    // POSITIVE CONTROL: a beat succeeds first, so the failure below is measured
    // against a heartbeat that is known to run.
    clock.t = base + 1_000;
    await waitFor(async () => {
      const current = JSON.parse(
        await readFile(lockPath, "utf8"),
      ) as SeededOwner;
      return current.updatedAt === clock.t;
    });

    // Occupy the beat's temp path with a DIRECTORY, so its write must fail.
    await mkdir(temporary, { recursive: true });
    clock.t = base + 2_000;

    // The holder's own run carries on (this is the "does not throw" part)...
    await new Promise((resolve) => setTimeout(resolve, 120));
    // ...and the failed write left the last successful stamp in place.
    expect(
      (JSON.parse(await readFile(lockPath, "utf8")) as SeededOwner).updatedAt,
    ).toBe(base + 1_000);

    // The holder still releases cleanly after the failed beats.
    await holder.release();
    expect(await pathExists(lockPath)).toBe(false);
  } finally {
    await rm(temporary, { recursive: true, force: true }).catch(
      () => undefined,
    );
  }
});
