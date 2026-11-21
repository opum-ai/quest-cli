import { randomUUID } from "node:crypto";
import { readFileSync, unlinkSync } from "node:fs";
import {
  link,
  mkdir,
  open,
  readFile,
  rename,
  stat,
  unlink,
} from "node:fs/promises";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";

/**
 * QCLI-568: the advisory, cross-worktree lock behind `task list --across-refs`.
 *
 * THE PROBLEM IS PER-CLONE, NOT PER-WORKTREE. Every worktree of one clone
 * shares `$GIT_COMMON_DIR`, so a plain file inside a worktree would give each
 * worktree its own lock and serialize nothing. The lock lives at
 * `<git-common-dir>/quest/across-refs.lock` so two runs started from different
 * worktrees of the same clone contend for the same file.
 *
 * IT IS ADVISORY. Git's conditional ref update remains the only ordering
 * authority (see `docs/specs/quest-cli-architecture.md`); this lock only stops
 * N processes from all reading the ref set at once and duplicating the same
 * expensive read. Nothing correctness-critical may depend on holding it: a
 * caller whose wait times out may proceed unlocked, and the caller decides
 * that (see {@link CommonDirLockTimeoutError}).
 *
 * A CRASHED HOLDER MUST NOT BLOCK FOREVER, so the lock records its owner and
 * a waiter treats an owner as STALE when its pid is not alive OR its age
 * exceeds `staleAfterMs`. The age clause is the backstop for pid reuse and for
 * a holder that lost its pid but not its file. The exit hook below is only
 * tidiness: a SIGKILL never runs it, and stale detection is what makes that
 * safe.
 *
 * WAITER REUSE IS THE CALLER'S JOB, NOT THIS MODULE'S. Acquiring the lock only
 * serialises the read; it cannot tell a waiter whether the ref hashes it
 * captured before waiting still match the result the previous holder wrote.
 * After acquiring, the caller re-reads its cache and reuses that result when
 * the hashes match, doing its own work only otherwise. See
 * {@link withCommonDirLock} for the modelled handshake.
 *
 * No walls are shared with the across-refs cache: this file knows about a
 * filesystem path, a pid and a token, so it can be tested without Git.
 */

/** Lock-file basename; the full path is `<commonDir>/quest/<name>.lock`. */
export const DEFAULT_COMMON_DIR_LOCK_NAME = "across-refs";

/**
 * How long a holder may be considered live before a waiter recovers its lock.
 * Generous by design: too small steals a live holder's lock (advisory, but it
 * defeats the serialisation), too large delays recovery after a crash. Ten
 * minutes is far longer than a ref read and short enough to self-heal.
 */
export const DEFAULT_STALE_AFTER_MS = 10 * 60 * 1_000;

/** Longest a caller waits before it must decide whether to proceed unlocked. */
export const DEFAULT_WAIT_TIMEOUT_MS = 30_000;

/** Poll interval while another holder owns the lock. */
export const DEFAULT_POLL_MS = 50;

/** The JSON body written to the lock file. `startedAt` is epoch milliseconds. */
export interface CommonDirLockOwner {
  readonly pid: number;
  readonly startedAt: number;
  readonly token: string;
}

export interface CommonDirLockOptions {
  /**
   * Lock basename, default {@link DEFAULT_COMMON_DIR_LOCK_NAME}. Rejected if it
   * could escape the lock directory (no path separators, no leading dot).
   */
  readonly name?: string;
  /** Age past which a holder is stale even if its pid is alive. */
  readonly staleAfterMs?: number;
  /** Bound on the wait. On expiry a {@link CommonDirLockTimeoutError} is thrown. */
  readonly waitTimeoutMs?: number;
  /** Sleep between acquisition attempts. Must be greater than zero. */
  readonly pollMs?: number;
  /**
   * Whether `pid` is alive. Injected for deterministic tests; the default uses
   * `process.kill(pid, 0)`, where ESRCH means dead and any other failure
   * (notably EPERM) means alive-but-not-ours.
   */
  readonly isAlive?: (pid: number) => boolean;
  /**
   * Clock used to stamp this lock's `startedAt` and to judge a holder's age.
   * Injected for deterministic tests. The WAIT DEADLINE is deliberately read
   * from the monotonic clock instead, so a frozen injected clock can never turn
   * a bounded wait into an unbounded one.
   */
  readonly now?: () => number;
}

/** A held lock. `release` is idempotent and token-checked. */
export interface CommonDirLockHandle {
  release(): Promise<void>;
}

/**
 * The wait expired with a live holder still in place.
 *
 * This is a DELIBERATE, TYPED outcome rather than a generic failure: the lock
 * is advisory, so the caller decides whether to proceed unlocked (the
 * `--across-refs` read is safe to run concurrently, it just duplicates work)
 * or to report the contention. The message says so, because a bare timeout
 * string reads like an error in a read-only command that has no failure.
 */
export class CommonDirLockTimeoutError extends Error {
  readonly lockPath: string;
  readonly waitedMs: number;
  readonly holder: CommonDirLockOwner | null;

  constructor(
    lockPath: string,
    waitedMs: number,
    holder: CommonDirLockOwner | null,
  ) {
    const heldBy =
      holder === null ? "no readable holder" : `held by pid ${holder.pid}`;
    super(
      `Timed out after ${Math.round(waitedMs)}ms waiting for the common-directory lock at ${lockPath} (${heldBy}); the lock is advisory and the caller may proceed without it`,
    );
    this.name = "CommonDirLockTimeoutError";
    this.lockPath = lockPath;
    this.waitedMs = waitedMs;
    this.holder = holder;
  }
}

/**
 * `<commonDir>/quest/<name>.lock`, with `name` validated so it cannot traverse
 * out of the lock directory. Pure.
 */
export function resolveCommonDirLockPath(
  commonDir: string,
  name: string = DEFAULT_COMMON_DIR_LOCK_NAME,
): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(name)) {
    throw new TypeError(
      `Invalid lock name ${JSON.stringify(name)}: expected [A-Za-z0-9][A-Za-z0-9._-]*`,
    );
  }
  return join(commonDir, "quest", `${name}.lock`);
}

/**
 * Acquire the advisory common-directory lock, waiting up to `waitTimeoutMs`
 * for a live holder to release it.
 *
 * The create is `O_EXCL` (`fs.open(..., "wx")`), so exactly one of any number
 * of racing processes writes the lock body. A waiter that judges the current
 * holder stale does not simply unlink it: it renames the file to a unique
 * quarantine name and verifies the bytes it captured are the bytes it moved,
 * so two waiters recovering one stale lock cannot both proceed to hold it --
 * whichever loses the following `O_EXCL` create waits for the winner like any
 * other contender. A token check on release means a handle whose file has
 * since been replaced never deletes the new holder's lock.
 */
export async function acquireCommonDirLock(
  commonDir: string,
  options: CommonDirLockOptions = {},
): Promise<CommonDirLockHandle> {
  const opts = resolveOptions(commonDir, options);
  const startedWaitingAt = performance.now();
  let lastHolder: CommonDirLockOwner | null = null;

  for (let attempt = 0; ; attempt += 1) {
    if (
      attempt > 0 &&
      performance.now() - startedWaitingAt >= opts.waitTimeoutMs
    ) {
      throw new CommonDirLockTimeoutError(
        opts.lockPath,
        performance.now() - startedWaitingAt,
        lastHolder,
      );
    }

    await mkdir(opts.lockDir, { recursive: true });

    const owner: CommonDirLockOwner = {
      pid: process.pid,
      startedAt: opts.now(),
      token: randomUUID(),
    };

    let created = false;
    try {
      const handle = await open(opts.lockPath, "wx");
      try {
        await handle.writeFile(`${JSON.stringify(owner)}\n`, "utf8");
      } finally {
        await handle.close();
      }
      created = true;
    } catch (error) {
      if (errnoCode(error) !== "EEXIST") throw error;
    }
    if (created) return makeHandle(opts.lockPath, owner);

    const snapshot = await readSnapshot(opts.lockPath);
    if (snapshot === null) {
      // The file vanished between our create attempt and our read: whoever
      // removed it may be about to create. Retry immediately.
      continue;
    }
    lastHolder = snapshot.owner;

    if (isSnapshotStale(snapshot, opts)) {
      const recovered = await recoverStaleSnapshot(opts.lockPath, snapshot);
      if (recovered) continue;
      // We displaced a lock that replaced the stale one; it has been put back
      // (or a third lock now owns the path). Treat it as a live holder.
    }

    const remaining =
      opts.waitTimeoutMs - (performance.now() - startedWaitingAt);
    await delay(Math.max(1, Math.min(opts.pollMs, remaining)));
  }
}

/**
 * Hold the lock for the duration of `work`, releasing in a `finally` so a
 * thrown error does not strand the lock.
 *
 * WAITER REUSE LIVES HERE, ONE LEVEL UP. This helper guarantees only mutual
 * exclusion; it cannot know what the caller was about to look up. A caller
 * that captured ref hashes before waiting must, INSIDE `work`, re-read its
 * cache first: if a result was written while it waited and its ref hashes
 * match (or the cache is newer than the capture), return that result and do no
 * work. The test `withCommonDirLock lets a waiter reuse ...` models exactly
 * that handshake with a counter that must stay at one.
 */
export async function withCommonDirLock<T>(
  commonDir: string,
  work: () => Promise<T>,
  options: CommonDirLockOptions = {},
): Promise<T> {
  const lock = await acquireCommonDirLock(commonDir, options);
  try {
    return await work();
  } finally {
    await lock.release();
  }
}

interface ResolvedOptions {
  readonly lockDir: string;
  readonly lockPath: string;
  readonly staleAfterMs: number;
  readonly waitTimeoutMs: number;
  readonly pollMs: number;
  readonly isAlive: (pid: number) => boolean;
  readonly now: () => number;
}

interface LockSnapshot {
  /** The exact bytes read, used to verify which lock a rename captured. */
  readonly raw: string;
  /** Parsed owner, or null when the file is empty/partial/corrupt. */
  readonly owner: CommonDirLockOwner | null;
  /** Modification time, the age fallback for an unparseable (partial) file. */
  readonly mtimeMs: number;
}

function resolveOptions(
  commonDir: string,
  options: CommonDirLockOptions,
): ResolvedOptions {
  const name = options.name ?? DEFAULT_COMMON_DIR_LOCK_NAME;
  const lockPath = resolveCommonDirLockPath(commonDir, name);
  return {
    lockDir: join(commonDir, "quest"),
    lockPath,
    staleAfterMs: requirePositive(
      options.staleAfterMs,
      DEFAULT_STALE_AFTER_MS,
      "staleAfterMs",
    ),
    waitTimeoutMs: requireNonNegative(
      options.waitTimeoutMs,
      DEFAULT_WAIT_TIMEOUT_MS,
      "waitTimeoutMs",
    ),
    pollMs: requirePositive(options.pollMs, DEFAULT_POLL_MS, "pollMs"),
    isAlive: options.isAlive ?? defaultIsAlive,
    now: options.now ?? Date.now,
  };
}

function requirePositive(
  value: number | undefined,
  fallback: number,
  label: string,
): number {
  const resolved = value ?? fallback;
  if (!Number.isFinite(resolved) || resolved <= 0) {
    throw new RangeError(`${label} must be a positive finite number`);
  }
  return resolved;
}

function requireNonNegative(
  value: number | undefined,
  fallback: number,
  label: string,
): number {
  const resolved = value ?? fallback;
  if (!Number.isFinite(resolved) || resolved < 0) {
    throw new RangeError(`${label} must be a non-negative finite number`);
  }
  return resolved;
}

function errnoCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  const code = (error as { readonly code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function defaultIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // ESRCH is the only signal that the pid is gone. EPERM means it exists and
    // belongs to someone else, which is still alive.
    return errnoCode(error) !== "ESRCH";
  }
}

/** Parse a lock body, returning null for anything that is not a complete owner. */
function parseOwner(raw: string): CommonDirLockOwner | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const { pid, startedAt, token } = record;
  if (typeof pid !== "number" || !Number.isInteger(pid) || pid <= 0)
    return null;
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt)) return null;
  if (typeof token !== "string" || token.length === 0) return null;
  return { pid, startedAt, token };
}

async function readSnapshot(lockPath: string): Promise<LockSnapshot | null> {
  let raw: string;
  try {
    raw = await readFile(lockPath, "utf8");
  } catch (error) {
    if (errnoCode(error) === "ENOENT") return null;
    throw error;
  }
  let info: Awaited<ReturnType<typeof stat>>;
  try {
    info = await stat(lockPath);
  } catch (error) {
    if (errnoCode(error) === "ENOENT") return null;
    throw error;
  }
  return { raw, owner: parseOwner(raw), mtimeMs: info.mtimeMs };
}

function isSnapshotStale(
  snapshot: LockSnapshot,
  opts: ResolvedOptions,
): boolean {
  if (snapshot.owner !== null) {
    if (opts.now() - snapshot.owner.startedAt > opts.staleAfterMs) return true;
    return !opts.isAlive(snapshot.owner.pid);
  }
  // Partial or corrupt body (for example, killed between O_EXCL create and
  // write). There is no pid to probe, so the file's age is the only evidence.
  return opts.now() - snapshot.mtimeMs > opts.staleAfterMs;
}

/**
 * Remove the stale lock at `lockPath` only if it is still the one observed.
 *
 * Rename-then-verify: the rename is atomic, and comparing the moved bytes with
 * the observed bytes decides whether we moved the stale lock or a holder that
 * replaced it in between. If we moved a live replacement, put it back without
 * clobbering anything newer. Returns true when the observed stale lock is gone
 * (whether by us or by another waiter), meaning the caller should retry the
 * O_EXCL create; false means the caller should keep waiting.
 */
async function recoverStaleSnapshot(
  lockPath: string,
  observed: LockSnapshot,
): Promise<boolean> {
  const quarantinePath = `${lockPath}.stale-${randomUUID()}`;
  try {
    await rename(lockPath, quarantinePath);
  } catch (error) {
    // Another waiter recovered it first; our create attempt will race theirs.
    if (errnoCode(error) === "ENOENT") return true;
    throw error;
  }

  let movedRaw: string | null = null;
  try {
    movedRaw = await readFile(quarantinePath, "utf8");
  } catch (error) {
    if (errnoCode(error) !== "ENOENT") throw error;
  }

  if (movedRaw === observed.raw) {
    await unlinkIfPresent(quarantinePath);
    return true;
  }

  await restoreQuarantined(quarantinePath, lockPath);
  return false;
}

/**
 * Put a quarantined lock back at `lockPath` iff nothing newer owns the path.
 *
 * `link` is the atomic no-clobber restore: it fails with EEXIST rather than
 * replacing a third lock the way `rename` would. Filesystems without hardlinks
 * fall back to an existence-checked rename; the residual race there is a lock
 * file that has already been displaced, and release's token check is what
 * stops that from deleting the new holder's lock.
 */
async function restoreQuarantined(
  quarantinePath: string,
  lockPath: string,
): Promise<void> {
  try {
    await link(quarantinePath, lockPath);
    await unlinkIfPresent(quarantinePath);
    return;
  } catch (error) {
    const code = errnoCode(error);
    if (code === "EEXIST") {
      // A third lock owns the path; keep it and drop the copy we displaced.
      await unlinkIfPresent(quarantinePath);
      return;
    }
    if (
      code !== "EPERM" &&
      code !== "ENOSYS" &&
      code !== "EXDEV" &&
      code !== "EMLINK" &&
      code !== "EOPNOTSUPP"
    ) {
      throw error;
    }
  }

  const current = await statOrNull(lockPath);
  if (current === null) {
    try {
      await rename(quarantinePath, lockPath);
      return;
    } catch (error) {
      if (errnoCode(error) !== "EEXIST") throw error;
    }
  }
  await unlinkIfPresent(quarantinePath);
}

async function statOrNull(path: string) {
  try {
    return await stat(path);
  } catch (error) {
    if (errnoCode(error) === "ENOENT") return null;
    throw error;
  }
}

async function unlinkIfPresent(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch (error) {
    if (errnoCode(error) !== "ENOENT") throw error;
  }
}

function makeHandle(
  lockPath: string,
  owner: CommonDirLockOwner,
): CommonDirLockHandle {
  let released = false;

  // Best-effort tidy on a normal process exit. Correctness never depends on
  // this: a SIGKILLed holder leaves the file and stale detection recovers it.
  const onExit = () => {
    try {
      const current = parseOwner(readFileSync(lockPath, "utf8"));
      if (current?.token === owner.token) unlinkSync(lockPath);
    } catch {
      // Exit handlers may not throw and cannot wait; the stale backstop is the
      // real recovery path.
    }
  };
  process.on("exit", onExit);

  return {
    async release() {
      if (released) return;
      released = true;
      process.removeListener("exit", onExit);

      let raw: string;
      try {
        raw = await readFile(lockPath, "utf8");
      } catch (error) {
        if (errnoCode(error) === "ENOENT") return;
        throw error;
      }
      // Never delete a lock someone else now holds: our file may have been
      // judged stale and recovered while we were running.
      if (parseOwner(raw)?.token !== owner.token) return;
      await unlinkIfPresent(lockPath);
    },
  };
}
