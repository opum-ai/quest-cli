import { afterEach, expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
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
    startedAt: Date.now(),
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

test("two waiters recovering one stale lock still serialize", async () => {
  const commonDir = await tempCommonDir();
  await seedLock(commonDir, {
    pid: 999_999,
    startedAt: Date.now(),
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
