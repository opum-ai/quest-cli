import { randomUUID } from "node:crypto";
import { readFileSync, unlinkSync } from "node:fs";
import {
  mkdir,
  open,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { hostname as osHostname } from "node:os";
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
 * A CRASHED HOLDER MUST NOT BLOCK FOREVER, AND A LIVE SAME-HOST HOLDER MUST
 * NOT BE BROKEN BY AGE ALONE (DEC-282 (a16), option A; lore-cli#746 F2). The
 * lock records its owner and a LIVENESS STAMP; while it runs the holder
 * refreshes that stamp on an unref'd timer (see {@link DEFAULT_HEARTBEAT_MS}).
 * Staleness is judged by the SILENCE since that stamp, but ONLY for a holder
 * whose liveness cannot be confirmed:
 *
 *  1. SAME HOST (`host` matches) and the pid is ALIVE -> NEVER stale, however
 *     long its silence (a starved or suspended-but-alive holder is bounded by
 *     each waiter's (a8) wait and its one stderr line, not by a steal);
 *  2. SAME HOST and the pid is DEAD -> stale once silence exceeds
 *     `pidGoneFloorMs` (the dead-pid rule);
 *  3. ANOTHER HOST -> liveness cannot be probed here, so stale once silence
 *     exceeds `staleAfterMs`;
 *  4. an UNREADABLE body -> the `pidGoneFloorMs` bound. A record is readable
 *     only if it parses with a numeric `pid` and `startedAt` and string `token`
 *     and `host`, so a record with NO `host` is UNREADABLE (lore's
 *     `isLockRecord`, lore-cli 809fbb83). A record that parses but cannot PROVE
 *     a same-host identity (a different or empty `host`, an empty `token`, a
 *     non-positive or non-integer `pid`) is judged by silence against
 *     `staleAfterMs`, like another host's (lore's `isLockSnapshotStale`).
 *
 * A holder that keeps beating therefore never reaches either silence bound,
 * and a same-host holder that merely stops beating while still alive is never
 * stolen from. The measured cold run takes 619-623 s; under the earlier
 * acquisition-age rule that live run was broken at the 10-minute mark, which is
 * what the heartbeat, and (a16)'s same-host rule, close. The exit hook below is
 * only tidiness: a SIGKILL never runs it, and stale detection is what makes that
 * safe.
 *
 * BREAKING A STALE LOCK IS SERIALISED, and nothing is ever parked or restored.
 * Judging a lock stale and removing it are two steps, and anything between them
 * can replace what is at the lock path. An earlier version renamed the lock
 * aside and restored it on a byte mismatch; that opened a window where the
 * path was empty while a live holder owned it, so a third contender's create
 * succeeded and the restore then dropped the live holder's body (QCLI-568
 * review, F1). The shape here is ported from `src/application/tasks/
 * id-allocation.ts`: breakers take a second exclusive file,
 * `<lock>.break`, and under it re-read the lock and remove it only if it still
 * matches the snapshot that was judged stale. While the stale lock exists
 * nobody can `open(wx)` over it, and breakers are serialised, so recovery has
 * no gap to race in and, absent a breaker stalled past `staleAfterMs` between
 * its re-read and its unlink, never moves a live holder's file. THE HEARTBEAT
 * AND THE RELEASE RE-VERIFY UNDER THE SAME `.break` FILE, so a holder that has
 * already lost its lock to a breaker normally neither rewrites nor deletes a
 * successor's record (residual (3) below is the exception): both re-read the
 * lock and compare its TOKEN before touching it.
 *
 * THREE RESIDUALS REMAIN, and they are acceptable ONLY because this lock is
 * advisory. (1) A breaker stalled past `staleAfterMs` between its locked
 * re-read and its unlink has its `.break` cleared by age alone (N1) and re-taken
 * by a successor, so on resuming it can unlink a lock the successor has since
 * put in place -- the re-read compared the LOCK bytes, not the `.break` handoff,
 * and the unlink is not re-validated. That can produce two concurrent holders,
 * whose worst cost is one duplicated ref read. (2) Release serialises
 * through the same `.break` file, so a release that cannot take it (a breaker
 * mid-recovery, or a process exit while a heartbeat holds it) leaves the lock
 * rather than risk deleting another holder's file: recovery is DELAYED, never
 * wrong. Release keeps its exit hook registered
 * until it has unlinked the lock or confirmed the lock is not ours, and retries
 * `.break` once after clearing a stale one, so the only stranding left is a
 * breaker that stays live across both attempts; the process's exit then
 * unlinks the lock. (3) A heartbeat and a breaker can still run together when a
 * `.break` is cleared by age or by the check-then-unlink above: the beat's
 * `rename` is unconditional, so it can resurrect the lock after the breaker's
 * unlink or overwrite a third contender's fresh record with the old token,
 * leaving that contender holding nothing it can release. The cost is again
 * only duplicated work. Nothing correctness-critical depends on this
 * lock; Git's conditional ref update remains the ordering authority.
 *
 * STALENESS RESTS ON THE WALL CLOCK (N4). A backward jump can delay recovery
 * and a forward jump can hasten it; for an advisory lock whose worst cost is
 * duplicated work that is acceptable. The heartbeat bounds the exposure for a
 * waiter that CANNOT confirm liveness (another host, or a shared common
 * directory): a backward jump can make a beating holder read as silent for at
 * most one {@link DEFAULT_HEARTBEAT_MS} interval before the next beat re-stamps
 * it. A same-host waiter is never fooled, because a live pid outranks silence.
 *
 * RECORD FORMAT AND COMPATIBILITY. The body is `{pid, startedAt, token,
 * updatedAt, host}`; `updatedAt` (the liveness stamp) and `host` (this process's
 * `os.hostname()`) are NEW here and optional. A record written before this
 * change has neither: a reader falls back to `startedAt` for the stamp and, for
 * the missing host, to branch 4 above (a record with no `host` is UNREADABLE and
 * takes the `pidGoneFloorMs` bound, as in lore). No released quest wrote this
 * lock before this change, so that window is theoretical. An OLDER reader ignores the extra keys and
 * keeps using `startedAt`, so both directions parse. The consequence of running
 * two CLI versions against one common directory: an old waiter still ages a new
 * holder from `startedAt` and can break it at `staleAfterMs` of run time, and an
 * old-format holder (no `host`, unreadable to a new waiter) is broken once its
 * silence passes `pidGoneFloorMs`. Both are bounded by the advisory contract.
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
 * Silence bound for a holder whose liveness CANNOT be confirmed here: one
 * recorded on ANOTHER host (its pid is meaningless locally), and the `.break`
 * age backstop. It is NOT the bound for a live same-host holder, which is never
 * broken by age/silence (DEC-282 (a16)). Long enough that a real ref read never
 * reaches it; the measured cold run is 619-623 s, under this bound, and a
 * beating holder keeps its stamp fresh so its silence never approaches it.
 *
 * An UNREADABLE body (including a record with no `host`) takes
 * {@link DEFAULT_PID_GONE_FLOOR_MS} instead; a readable record that cannot
 * prove a same-host identity is judged against THIS bound, like another host's
 * (lore-cli 809fbb83, `isLockSnapshotStale`).
 *
 * COUPLING: the lock wrapper's wait bound is derived from this value
 * (`DEFAULT_ACROSS_REFS_WAIT_TIMEOUT_MS`), and since (a16) that wait is the ONLY
 * limit on a LIVE same-host holder. Raising this constant silently lengthens it.
 */
export const DEFAULT_STALE_AFTER_MS = 10 * 60 * 1_000;

/**
 * How often a live holder refreshes its liveness stamp. Well under
 * {@link DEFAULT_STALE_AFTER_MS} -- 30 s is one twentieth of the 10-minute
 * bound -- so several beats can be missed before a waiter that CANNOT confirm
 * liveness (another host, or a record read across a shared common directory)
 * could judge a beating holder stale. A same-host waiter confirms liveness by
 * pid and never breaks a live holder by age at all (DEC-282 (a16)). Cheap: one
 * small file rewrite, serialised through the `.break` file, every interval.
 * Injectable via {@link CommonDirLockOptions.heartbeatMs} for tests.
 */
export const DEFAULT_HEARTBEAT_MS = 30_000;

/**
 * Floor for the dead-pid rule, ported from `id-allocation.ts`: a pid is
 * evidence of abandonment only after the lock has existed this long. Without
 * it a create interrupted between `open(wx)` and its body write, or a pid
 * reused by an unrelated process, is broken the instant it is seen.
 */
export const DEFAULT_PID_GONE_FLOOR_MS = 30_000;

/**
 * Age floor for clearing a break file left by a breaker that was killed. Same
 * AND rule as the lock: older than this AND its pid is gone.
 */
export const DEFAULT_BREAK_STALE_AFTER_MS = 10_000;

/** Longest a caller waits before it must decide whether to proceed unlocked. */
export const DEFAULT_WAIT_TIMEOUT_MS = 30_000;

/** Poll interval while another holder owns the lock. */
export const DEFAULT_POLL_MS = 50;

/** Suffix of the breaker-serialising file, as in `id-allocation.ts`. */
const BREAK_FILE_SUFFIX = ".break";

/** The JSON body written to a lock or break file. `startedAt` is epoch ms. */
export interface CommonDirLockOwner {
  readonly pid: number;
  /** Wall-clock epoch ms when the lock (or break file) was taken. */
  readonly startedAt: number;
  readonly token: string;
  /**
   * Wall-clock epoch ms of the last heartbeat: the LIVENESS STAMP staleness is
   * measured from. Optional on read, because a record written before QCLI-568
   * Q568-INT A has no such key; a reader then falls back to `startedAt`.
   */
  readonly updatedAt?: number;
  /**
   * `os.hostname()` of the holder (DEC-282 (a16)). Optional on read: a record
   * written before this field existed has none, and is then UNREADABLE (it takes the
   * `pidGoneFloorMs` bound), as in lore. Written at acquire and preserved by
   * heartbeat rewrites.
   */
  readonly host?: string;
}

export interface CommonDirLockOptions {
  /**
   * Lock basename, default {@link DEFAULT_COMMON_DIR_LOCK_NAME}. Rejected if it
   * could escape the lock directory (no path separators, no leading dot).
   *
   * RESERVED NAME: `alloc` forms `<commonDir>/quest/alloc.lock`, which is
   * `src/application/tasks/id-allocation.ts`'s own lock. Passing it here would
   * make the two unrelated locks contend; the name is documented as reserved
   * rather than rejected so a caller that reads this learns why.
   */
  readonly name?: string;
  /**
   * Silence bound for a lock held on ANOTHER host (whose pid cannot be probed
   * here), and the age-only backstop for the `.break` file. It is NOT the bound
   * for a live same-host holder, which is never broken by silence/age
   * (DEC-282 (a16)). Normally larger than {@link pidGoneFloorMs}; when it is
   * smaller the backstop simply dominates, which is what the deterministic age
   * tests rely on.
   */
  readonly staleAfterMs?: number;
  /**
   * How often a holder refreshes its liveness stamp (
   * {@link DEFAULT_HEARTBEAT_MS}). Must stay well under {@link staleAfterMs};
   * injectable so a test does not have to wait out a production interval. The
   * timer is `unref`'d (a beating holder does not keep the process alive) and
   * cleared on release.
   */
  readonly heartbeatMs?: number;
  /**
   * Identity written to the lock record and compared when judging a holder's
   * liveness (DEC-282 (a16)). Defaults to `os.hostname()`; injected for
   * deterministic tests. A holder whose `host` equals this one is probed by
   * pid here; a different host (or a record with no host) cannot be confirmed.
   */
  readonly host?: string;
  /**
   * The dead-pid rule requires the lock to be at least this old. A fresh
   * dead-pid file is treated as mid-write, not abandoned. Also the silence
   * bound for an UNREADABLE body, which includes a record with no `host`
   * (DEC-282 (a16)).
   */
  readonly pidGoneFloorMs?: number;
  /**
   * Age floor for clearing a `.break` file whose pid is readable and gone.
   * An unreadable or live-pid `.break` is still cleared past `staleAfterMs`
   * (age alone), so a wedged breaker cannot disable recovery forever (N1).
   */
  readonly breakStaleAfterMs?: number;
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
   * Clock used to stamp this lock's `startedAt`/`updatedAt` and to judge a
   * holder's SILENCE since its last liveness stamp. Injected for deterministic
   * tests. The WAIT DEADLINE is deliberately read from the monotonic clock
   * instead, so a frozen injected clock can never turn a bounded wait into an
   * unbounded one.
   *
   * This is a WALL clock (N4): a backward jump delays recovery and a forward
   * jump hastens it. The only cost is duplicated work, which the advisory
   * contract accepts.
   */
  readonly now?: () => number;
  /**
   * TEST SEAM: runs after a lock is judged stale and before anything is
   * removed -- the window a competing breaker can act in (F2).
   */
  readonly afterStaleJudgement?: () => Promise<void>;
  /**
   * TEST SEAM: runs under the break file, after the lock was re-read and still
   * matched, and before it is removed. The lock path must still be occupied
   * here; a second breaker is refused by the break file and by nothing else.
   */
  readonly afterLockedReread?: () => Promise<void>;
}

/** A held lock. `release` is idempotent and token-checked. */
export interface CommonDirLockHandle {
  release(): Promise<void>;
}

/** Everything the timeout message needs, gathered at throw time. */
export interface CommonDirLockTimeoutDetails {
  readonly lockPath: string;
  readonly waitedMs: number;
  readonly holder: CommonDirLockOwner | null;
  readonly lockAgeMs: number | null;
  readonly breakPath: string;
  /** False only when the file is provably ABSENT (ENOENT). A file that exists
   * but cannot be read is present-and-unreadable, never absent. */
  readonly breakFilePresent: boolean;
  /** The breaker's pid, or null when the file is absent or unreadable. */
  readonly breakHolderPid: number | null;
  readonly breakHolderAlive: boolean;
  readonly breakFileAgeMs: number | null;
  /** The error text when reading the `.break` itself failed (non-ENOENT), so
   * the message can name it instead of claiming an automatic clear (R3-5).
   * null when the file was read (whether or not its body parsed). */
  readonly breakReadError: string | null;
  readonly staleAfterMs: number;
  readonly pidGoneFloorMs: number;
  readonly breakStaleAfterMs: number;
}

/**
 * The wait expired without acquiring the lock.
 *
 * This is a DELIBERATE, TYPED outcome rather than a generic failure: the lock
 * is advisory, so the caller decides whether to proceed unlocked (the
 * `--across-refs` read is safe to run concurrently, it just duplicates work)
 * or to report the contention. The message says so, because a bare timeout
 * string reads like an error in a read-only command that has no failure.
 *
 * It also carries the `.break` file's state (N1(b)), because that file decides
 * whether recovery is happening at all: absent is transient contention, a live
 * breaker is in progress, and an unreadable breaker is ambiguous. When the read
 * itself failed, the detail carries that error verbatim (R3-5) rather than
 * asserting the file will be cleared.
 */
export class CommonDirLockTimeoutError extends Error {
  readonly lockPath: string;
  readonly waitedMs: number;
  readonly holder: CommonDirLockOwner | null;
  readonly lockAgeMs: number | null;
  readonly breakPath: string;
  readonly breakFilePresent: boolean;
  readonly breakHolderPid: number | null;
  readonly breakHolderAlive: boolean;
  readonly breakFileAgeMs: number | null;
  readonly breakReadError: string | null;

  constructor(details: CommonDirLockTimeoutDetails) {
    super(commonDirLockTimeoutMessage(details));
    this.name = "CommonDirLockTimeoutError";
    this.lockPath = details.lockPath;
    this.waitedMs = details.waitedMs;
    this.holder = details.holder;
    this.lockAgeMs = details.lockAgeMs;
    this.breakPath = details.breakPath;
    this.breakFilePresent = details.breakFilePresent;
    this.breakHolderPid = details.breakHolderPid;
    this.breakHolderAlive = details.breakHolderAlive;
    this.breakFileAgeMs = details.breakFileAgeMs;
    this.breakReadError = details.breakReadError;
  }
}

function seconds(milliseconds: number | null): string | null {
  return milliseconds === null ? null : `${Math.round(milliseconds / 1000)}s`;
}

/** The timeout text, in one function so a test can assert it exactly. */
function commonDirLockTimeoutMessage(
  details: CommonDirLockTimeoutDetails,
): string {
  const holder =
    details.holder === null
      ? "no readable holder"
      : `pid ${details.holder.pid}`;
  const lockAge = seconds(details.lockAgeMs);
  const held = `${holder}${lockAge === null ? "" : `, stamped ${lockAge} ago`}`;

  const breakAge = seconds(details.breakFileAgeMs);
  const breakAgeClause =
    breakAge === null ? "its age could not be read" : `written ${breakAge} ago`;
  const breakClause = !details.breakFilePresent
    ? `No break file exists at ${details.breakPath}.`
    : details.breakHolderPid !== null && details.breakHolderAlive
      ? `A break file EXISTS at ${details.breakPath}, held by LIVE pid ${details.breakHolderPid} (${breakAgeClause}); a breaker is mid-recovery and blocks recovery until it finishes or the file passes the ${seconds(details.staleAfterMs)} age backstop.`
      : details.breakHolderPid !== null
        ? `A break file EXISTS at ${details.breakPath}, held by pid ${details.breakHolderPid}, which is not running (${breakAgeClause}); it is cleared automatically once older than ${seconds(details.breakStaleAfterMs)}, or at ${seconds(details.staleAfterMs)} regardless of pid.`
        : details.breakReadError !== null
          ? `A break file EXISTS at ${details.breakPath}, but reading it failed with "${details.breakReadError}" (${breakAgeClause}); the ${seconds(details.staleAfterMs)} age backstop is the only route past it, and only if it can then be removed.`
          : `A break file EXISTS at ${details.breakPath} and its holder cannot be read (${breakAgeClause}); the ${seconds(details.staleAfterMs)} age backstop is the only route past it, and only if it can then be removed.`;

  return `Timed out after ${Math.round(details.waitedMs)}ms waiting for the common-directory lock at ${details.lockPath} (${held}). ${breakClause} This lock is advisory: the caller may proceed without it, and concurrent runs then duplicate the ref read and nothing else. If you prefer to clear it by hand: remove ${details.breakPath} only when no breaker is running; and if the holder${details.holder === null ? "" : ` (pid ${details.holder.pid})`} is not a running quest process (a reused pid or a stopped process is never broken by age on its own host), remove the LOCK file ${details.lockPath} itself.`;
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
 * holder stale does not touch the lock directly: it takes the `.break` file,
 * re-reads the lock under it and unlinks only if the bytes still match the
 * snapshot it judged stale (see {@link breakStaleLock}). The lock path is
 * therefore never emptied while a live holder owns it, and a holder that
 * replaced the stale one is left untouched.
 */
export async function acquireCommonDirLock(
  commonDir: string,
  options: CommonDirLockOptions = {},
): Promise<CommonDirLockHandle> {
  const opts = resolveOptions(commonDir, options);
  const startedWaitingAt = performance.now();
  let lastSnapshot: LockSnapshot | null = null;

  for (let attempt = 0; ; attempt += 1) {
    if (
      attempt > 0 &&
      performance.now() - startedWaitingAt >= opts.waitTimeoutMs
    ) {
      throw await timeoutError(
        opts,
        performance.now() - startedWaitingAt,
        lastSnapshot,
      );
    }

    // NON-RECURSIVE on purpose (F9): `lockDir` is `<commonDir>/quest`, and the
    // common directory must already exist. If a wrong or relative root reached
    // us, this fails with ENOENT instead of silently creating a stray
    // `<wrong-root>/quest`; the caller treats that as a broken lock mechanism
    // and proceeds unlocked. An already-created `quest/` (a concurrent creator,
    // or a caller that seeded it) is the only tolerated error.
    try {
      await mkdir(opts.lockDir);
    } catch (error) {
      if (errnoCode(error) !== "EEXIST") throw error;
    }

    // Stamped once so `startedAt` (acquisition) and `updatedAt` (the first
    // liveness stamp) start equal; every heartbeat moves only `updatedAt`.
    const stamp = opts.now();
    const owner: CommonDirLockOwner = {
      pid: process.pid,
      startedAt: stamp,
      token: randomUUID(),
      updatedAt: stamp,
      host: opts.host,
    };

    let created = false;
    try {
      const handle = await open(opts.lockPath, "wx");
      try {
        await handle.writeFile(`${JSON.stringify(owner)}\n`, "utf8");
      } catch (error) {
        // F4: an empty lock would block every create until the age backstop.
        // We just created it exclusively, so removing it cannot hit a holder.
        await handle.close().catch(() => undefined);
        await unlinkIfPresent(opts.lockPath);
        throw error;
      }
      try {
        await handle.close();
      } catch (error) {
        // F4 minor: the body was written but the handle did not close cleanly,
        // and we have no handle to return; do not leave the lock behind.
        await unlinkIfPresent(opts.lockPath);
        throw error;
      }
      created = true;
    } catch (error) {
      if (errnoCode(error) !== "EEXIST") throw error;
    }
    if (created) return makeHandle(opts, owner);

    const snapshot = await readSnapshot(opts.lockPath);
    if (snapshot === null) {
      // The file vanished between our create attempt and our read: whoever
      // removed it may be about to create. Retry immediately.
      continue;
    }
    lastSnapshot = snapshot;

    if (await breakStaleLock(opts, snapshot)) continue;

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
  readonly heartbeatMs: number;
  readonly host: string;
  readonly pidGoneFloorMs: number;
  readonly breakStaleAfterMs: number;
  readonly waitTimeoutMs: number;
  readonly pollMs: number;
  readonly isAlive: (pid: number) => boolean;
  readonly now: () => number;
  readonly afterStaleJudgement?: () => Promise<void>;
  readonly afterLockedReread?: () => Promise<void>;
}

interface LockSnapshot {
  /** The exact bytes read, used to verify which lock the breaker judged. */
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
    heartbeatMs: requirePositive(
      options.heartbeatMs,
      DEFAULT_HEARTBEAT_MS,
      "heartbeatMs",
    ),
    host: options.host ?? osHostname(),
    pidGoneFloorMs: requirePositive(
      options.pidGoneFloorMs,
      DEFAULT_PID_GONE_FLOOR_MS,
      "pidGoneFloorMs",
    ),
    breakStaleAfterMs: requirePositive(
      options.breakStaleAfterMs,
      DEFAULT_BREAK_STALE_AFTER_MS,
      "breakStaleAfterMs",
    ),
    waitTimeoutMs: requireNonNegative(
      options.waitTimeoutMs,
      DEFAULT_WAIT_TIMEOUT_MS,
      "waitTimeoutMs",
    ),
    pollMs: requirePositive(options.pollMs, DEFAULT_POLL_MS, "pollMs"),
    isAlive: options.isAlive ?? defaultIsAlive,
    now: options.now ?? Date.now,
    afterStaleJudgement: options.afterStaleJudgement,
    afterLockedReread: options.afterLockedReread,
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

/**
 * Parse a body, returning null for anything that is not a PARSEABLE owner. The
 * line between unreadable and readable-but-unprovable is lore's
 * (`isLockRecord`, lore-cli 809fbb83): a record must carry a numeric `pid`, a
 * numeric `startedAt`, a string `token` and a string `host` to parse at all, and
 * a record missing any of them (including a record with NO `host`) is
 * UNREADABLE, so it takes the `pidGoneFloorMs` bound. A record that parses but
 * cannot PROVE a same-host identity -- a different or empty `host`, an empty
 * `token`, a non-positive or non-integer `pid` -- is readable, and
 * {@link isSnapshotStale} judges it by silence against `staleAfterMs`.
 */
function parseOwner(raw: string): CommonDirLockOwner | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const { pid, startedAt, token, updatedAt, host } = record;
  if (typeof pid !== "number" || !Number.isFinite(pid)) return null;
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt)) return null;
  if (typeof token !== "string") return null;
  if (typeof host !== "string") return null;
  // `updatedAt` is optional: a non-finite one is ignored (the stamp falls back
  // to `startedAt`).
  return {
    pid,
    startedAt,
    token,
    host,
    ...(typeof updatedAt === "number" && Number.isFinite(updatedAt)
      ? { updatedAt }
      : {}),
  };
}

/**
 * Read the file and then its stat (N3(a)). The order is safe: `mtimeMs` is
 * consulted only when the body has no readable owner, and if the file was
 * replaced between the two calls the stat reports the REPLACEMENT's age, which
 * can only make the computed age YOUNGER -- the conservative direction, since
 * a younger file is less likely to be judged stale.
 */
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

/**
 * The liveness stamp a snapshot is aged from: the last heartbeat when the
 * record carries one, else its acquisition stamp (a pre-heartbeat record), else
 * the file's mtime when the body is unreadable.
 */
function livenessStamp(snapshot: LockSnapshot): number {
  const owner = snapshot.owner;
  return owner?.updatedAt ?? owner?.startedAt ?? snapshot.mtimeMs;
}

/**
 * `now` minus the snapshot's liveness stamp -- the SILENCE since the last sign
 * of progress, which is what staleness is judged on (QCLI-568 Q568-INT A).
 */
function snapshotAge(snapshot: LockSnapshot, nowMs: number): number {
  return nowMs - livenessStamp(snapshot);
}

/**
 * Gather the `.break` state for the timeout message (N1(b)). A non-ENOENT
 * failure while reading it is reported as PRESENT but unreadable, never as
 * absent: only ENOENT licenses calling the path free (the same distinction
 * id-allocation's QCLI-528 fix draws).
 */
async function timeoutError(
  opts: ResolvedOptions,
  waitedMs: number,
  lastSnapshot: LockSnapshot | null,
): Promise<CommonDirLockTimeoutError> {
  const breakPath = `${opts.lockPath}${BREAK_FILE_SUFFIX}`;
  let present = false;
  let breakHolder: CommonDirLockOwner | null = null;
  let breakAgeMs: number | null = null;
  let breakReadError: string | null = null;
  try {
    const snapshot = await readSnapshot(breakPath);
    present = snapshot !== null;
    if (snapshot !== null) {
      breakHolder = snapshot.owner;
      breakAgeMs = snapshotAge(snapshot, opts.now());
    }
  } catch (error) {
    // Present but the read itself failed: name the error (R3-5), never call
    // the path free -- only ENOENT licenses that, and ENOENT returns null.
    present = true;
    breakReadError = error instanceof Error ? error.message : String(error);
  }
  // The LAST snapshot is kept so the lock's age is still known when its body is
  // unreadable: `snapshotAge` falls back to the file's mtime then (R3-5).
  return new CommonDirLockTimeoutError({
    lockPath: opts.lockPath,
    waitedMs,
    holder: lastSnapshot?.owner ?? null,
    lockAgeMs:
      lastSnapshot === null ? null : snapshotAge(lastSnapshot, opts.now()),
    breakPath,
    breakFilePresent: present,
    breakHolderPid: breakHolder?.pid ?? null,
    breakHolderAlive:
      breakHolder !== null ? opts.isAlive(breakHolder.pid) : false,
    breakFileAgeMs: breakAgeMs,
    breakReadError,
    staleAfterMs: opts.staleAfterMs,
    pidGoneFloorMs: opts.pidGoneFloorMs,
    breakStaleAfterMs: opts.breakStaleAfterMs,
  });
}

/**
 * The stale rule (DEC-282 (a16), option A -- the same rule as lore-cli#746's
 * `isLockSnapshotStale`). Silence is measured from the holder's LIVENESS STAMP,
 * and it decides staleness ONLY where liveness cannot be confirmed:
 *
 *  1. record on THIS host (`host` matches) and the pid is ALIVE -> NEVER stale,
 *     however long its silence. A wedged-but-alive holder is bounded by each
 *     waiter's (a8) wait and its one stderr line, never stolen from (lore's
 *     F2; breaking a merely-stopped holder risks two writers if it resumes);
 *  2. record on THIS host and the pid is DEAD -> stale once silence exceeds
 *     `pidGoneFloorMs` (the mid-write guard folds into that floor);
 *  3. record on ANOTHER host -> its pid cannot be probed here, so stale once
 *     silence exceeds `staleAfterMs`;
 *  4. an UNREADABLE body -> the `pidGoneFloorMs` bound. A record is readable
 *     only if it parses with a numeric `pid` and `startedAt` and string `token`
 *     and `host`, so a record with NO `host` is UNREADABLE (lore's
 *     `isLockRecord`, lore-cli 809fbb83). A record that parses but cannot PROVE
 *     a same-host identity (a different or empty `host`, an empty `token`, a
 *     non-positive or non-integer `pid`) is judged by silence against
 *     `staleAfterMs`, like another host's (lore's `isLockSnapshotStale`).
 */
function isSnapshotStale(
  snapshot: LockSnapshot,
  opts: ResolvedOptions,
): boolean {
  const silence = snapshotAge(snapshot, opts.now());
  const owner = snapshot.owner;
  // 4a: an UNREADABLE body (including a record with no `host`) -> the floor.
  if (owner === null) return silence > opts.pidGoneFloorMs;
  // 4b: readable but unable to PROVE a same-host identity (different or empty
  // host, empty token, non-positive or non-integer pid) -> staleAfterMs.
  const provesSameHost =
    owner.host !== undefined &&
    owner.host !== "" &&
    owner.host === opts.host &&
    owner.token !== "" &&
    Number.isInteger(owner.pid) &&
    owner.pid > 0;
  if (!provesSameHost) return silence > opts.staleAfterMs;
  // 1 and 2: a same-host LIVE pid is never stale; a dead one waits the floor.
  if (opts.isAlive(owner.pid)) return false;
  return silence > opts.pidGoneFloorMs;
}

/**
 * N1: a `.break` file may NOT disable recovery forever. Its rule is unchanged
 * by the heartbeat (a break file is never heartbeated, so its "age" is its
 * acquisition stamp, or its mtime when unreadable):
 *
 *  1. silent for longer than `staleAfterMs` -> clear whatever its pid says,
 *     including an unreadable body or a pid that looks alive through reuse (the
 *     age-only backstop);
 *  2. otherwise an unreadable body is kept (it may be a breaker mid-write);
 *  3. otherwise older than `breakStaleAfterMs` AND its pid is gone -> clear.
 *
 * This deliberately diverges from `id-allocation.ts`, which never clears an
 * unreadable or live-looking break file: there the fail-closed side protects
 * id uniqueness, while this lock is advisory and its worst case is duplicated
 * work. A wedged breaker costs at most `staleAfterMs`, not forever.
 */
function isBreakFileStale(
  snapshot: LockSnapshot,
  opts: ResolvedOptions,
): boolean {
  const age = snapshotAge(snapshot, opts.now());
  if (age > opts.staleAfterMs) return true;
  if (snapshot.owner === null) return false;
  if (age <= opts.breakStaleAfterMs) return false;
  return !opts.isAlive(snapshot.owner.pid);
}

/**
 * Take `<lock>.break` exclusively. Returns its owner on success, or null when
 * another breaker holds it (optionally clearing a dead breaker's file first).
 */
async function takeBreakFile(
  breakPath: string,
  opts: ResolvedOptions,
): Promise<CommonDirLockOwner | null> {
  const owner: CommonDirLockOwner = {
    pid: process.pid,
    startedAt: opts.now(),
    token: randomUUID(),
    host: opts.host,
  };
  try {
    const handle = await open(breakPath, "wx");
    try {
      await handle.writeFile(`${JSON.stringify(owner)}\n`, "utf8");
    } catch (error) {
      // Same F4 guard as the lock: never leave an empty break file.
      await handle.close().catch(() => undefined);
      await unlinkIfPresent(breakPath);
      throw error;
    }
    try {
      await handle.close();
    } catch (error) {
      // We created it and cannot hand it back; do not leave a wedged break.
      await unlinkIfPresent(breakPath);
      throw error;
    }
    return owner;
  } catch (error) {
    if (errnoCode(error) !== "EEXIST") throw error;
  }

  const existing = await readSnapshot(breakPath);
  if (existing !== null && isBreakFileStale(existing, opts)) {
    // Check-then-unlink residual, recorded not closed (as in id-allocation):
    // two clearers can race for an aged or dead breaker's file and a loser's
    // unlink can hit the winner's fresh file. The subsequent locked re-read
    // compares the LOCK bytes only -- it does NOT protect this `.break` handoff,
    // so a breaker whose file was aged out can still finish its own unlink (see
    // residual (1) in the module docblock).
    await unlinkIfPresent(breakPath);
  }
  return null;
}

/**
 * Break a stale lock, serialised through the break file. `observed` is the
 * snapshot the caller already read and judged stale; it is re-read under the
 * break file and removed only if the bytes still match, so a holder that
 * replaced it in the meantime is never touched.
 *
 * Returns true only when this call removed the judged lock; the caller then
 * loops back to the exclusive create. A false return means another breaker
 * owns the file, the lock changed, or it is no longer stale -- the caller
 * waits like any other contender.
 */
async function breakStaleLock(
  opts: ResolvedOptions,
  observed: LockSnapshot,
): Promise<boolean> {
  if (!isSnapshotStale(observed, opts)) return false;
  await opts.afterStaleJudgement?.();

  const breakPath = `${opts.lockPath}${BREAK_FILE_SUFFIX}`;
  const mine = await takeBreakFile(breakPath, opts);
  if (mine === null) return false;

  try {
    const current = await readSnapshot(opts.lockPath);
    if (current === null || current.raw !== observed.raw) return false;
    await opts.afterLockedReread?.();
    await unlinkIfPresent(opts.lockPath);
    return true;
  } finally {
    // Clear only a break file this call still owns: a release that read
    // someone else's would take their serialisation with it. N3(c): this is
    // best-effort like id-allocation -- an unreadable or unremovable break file
    // must not mask the outcome of the recovery, and the `staleAfterMs`
    // backstop clears it later anyway.
    try {
      await releaseOwnedBreakFile(breakPath, mine.token);
    } catch {
      // Leave it to the age backstop.
    }
  }
}

/** Clear a break file only while this call still owns it. */
async function releaseOwnedBreakFile(
  breakPath: string,
  token: string,
): Promise<void> {
  const left = await readSnapshot(breakPath);
  if (left?.owner?.token === token) await unlinkIfPresent(breakPath);
}

async function unlinkIfPresent(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch (error) {
    if (errnoCode(error) !== "ENOENT") throw error;
  }
}

/**
 * One heartbeat: re-stamp the lock's `updatedAt` while this process still owns
 * it. It takes the break file FIRST, so it cannot race a breaker's locked
 * re-read/unlink; it re-reads the lock under that file and rewrites ONLY when
 * the token still matches, so a holder that already lost its lock normally
 * neither resurrects nor clobbers a successor's record. The exception is
 * residual (3) in the module docblock: when a `.break` was cleared by age or by
 * the check-then-unlink, a beat and a breaker can run together and the beat's
 * unconditional `rename` can resurrect the lock. Every failure is swallowed by
 * {@link startHeartbeat}: a missed beat is not an error, and the `staleAfterMs`
 * silence bound is the backstop.
 */
async function heartbeatOnce(
  opts: ResolvedOptions,
  owner: CommonDirLockOwner,
): Promise<void> {
  const breakPath = `${opts.lockPath}${BREAK_FILE_SUFFIX}`;
  const mine = await takeBreakFile(breakPath, opts);
  if (mine === null) return;
  try {
    const current = await readSnapshot(opts.lockPath);
    if (current?.owner?.token !== owner.token) return;
    // Preserve every field -- notably `host` (DEC-282 (a16)) -- and move only
    // the liveness stamp.
    const refreshed: CommonDirLockOwner = {
      ...current.owner,
      updatedAt: opts.now(),
    };
    // Temp-then-rename, so a waiter reads either the old body or the new one,
    // never a torn one.
    const temporary = `${opts.lockPath}.${owner.token}.tmp`;
    try {
      await writeFile(temporary, `${JSON.stringify(refreshed)}\n`, "utf8");
      await rename(temporary, opts.lockPath);
    } catch (error) {
      await unlinkIfPresent(temporary).catch(() => undefined);
      throw error;
    }
  } finally {
    try {
      await releaseOwnedBreakFile(breakPath, mine.token);
    } catch {
      // Leave it to the age backstop.
    }
  }
}

/** The heartbeat handle's shared state, so `release` can await a beat already
 * running before it removes the lock. */
interface HeartbeatState {
  inFlight: Promise<void> | null;
}

/**
 * Start refreshing the liveness stamp every `heartbeatMs`. The timer is
 * UNREF'd, so holding the lock never keeps a process alive (a process may exit
 * while holding, and the exit hook plus stale detection are what make that
 * safe); a beat failing to write is a missed beat, never an error thrown into
 * the holder's run. `release` clears the interval and awaits any beat already
 * in flight.
 */
function startHeartbeat(
  opts: ResolvedOptions,
  owner: CommonDirLockOwner,
  state: HeartbeatState,
): ReturnType<typeof setInterval> {
  const timer = setInterval(() => {
    if (state.inFlight !== null) return; // never overlap beats
    state.inFlight = heartbeatOnce(opts, owner)
      .catch(() => undefined)
      .finally(() => {
        state.inFlight = null;
      });
  }, opts.heartbeatMs);
  (timer as { readonly unref?: () => void }).unref?.();
  return timer;
}

function makeHandle(
  opts: ResolvedOptions,
  owner: CommonDirLockOwner,
): CommonDirLockHandle {
  let released = false;
  const state: HeartbeatState = { inFlight: null };

  // Best-effort tidy on a normal process exit. Correctness never depends on
  // this: a SIGKILLed holder leaves the file and stale detection recovers it.
  const onExit = () => {
    try {
      const current = parseOwner(readFileSync(opts.lockPath, "utf8"));
      if (current?.token === owner.token) unlinkSync(opts.lockPath);
    } catch {
      // Exit handlers may not throw and cannot wait; the stale backstop is the
      // real recovery path.
    }
  };
  process.on("exit", onExit);
  const timer = startHeartbeat(opts, owner, state);
  const breakPath = `${opts.lockPath}${BREAK_FILE_SUFFIX}`;

  return {
    async release() {
      if (released) return;
      released = true;
      clearInterval(timer);
      // Let a beat already running finish: it holds `.break` while it runs, so
      // waiting here means the release below neither races it for that file nor
      // lets it rewrite the record after we remove it.
      if (state.inFlight !== null) await state.inFlight.catch(() => undefined);

      // Release under `.break`, like the breaker: a holder that already lost
      // its lock must not delete a successor's record, and a breaker mid-recovery
      // owns the transition. The exit hook STAYS REGISTERED until this call has
      // either unlinked the lock or confirmed it is not ours (S2): a release
      // that gives up must not strand a lock owned by a live pid that no longer
      // beats, which no same-host waiter would ever break.
      const take = async (): Promise<CommonDirLockOwner | null> => {
        try {
          return await takeBreakFile(breakPath, opts);
        } catch {
          return null;
        }
      };
      // takeBreakFile returns null both for "held by someone live" and for "I
      // just cleared a stale `.break`"; retry ONCE so the second case does not
      // make this release bail (a `.break` left by a holder SIGKILLed mid-beat).
      const mine = (await take()) ?? (await take());
      if (mine === null) return;
      try {
        let raw: string;
        try {
          raw = await readFile(opts.lockPath, "utf8");
        } catch (error) {
          if (errnoCode(error) === "ENOENT") {
            process.removeListener("exit", onExit);
            return;
          }
          throw error;
        }
        // Never delete a lock someone else now holds: our file may have been
        // judged stale and recovered while we were running.
        if (parseOwner(raw)?.token !== owner.token) {
          process.removeListener("exit", onExit);
          return;
        }
        await unlinkIfPresent(opts.lockPath);
        process.removeListener("exit", onExit);
      } finally {
        try {
          await releaseOwnedBreakFile(breakPath, mine.token);
        } catch {
          // Leave it to the age backstop.
        }
      }
    },
  };
}
