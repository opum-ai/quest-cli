import {
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";

import { compareTaskIds } from "../../domain/tasks/tasks.ts";
import type { GitPort } from "../../ports/git.ts";

/**
 * QCLI-495 (DEC-179 part 1, closing its measurement m1). Every id family's
 * allocator was refs-aware only (QCLI-279 for tasks, QCLI-290 for drafts,
 * milestones and decisions): it took the highest id across local branches and
 * remote-tracking refs and never read another checkout's UNCOMMITTED working
 * tree. Two worktrees of one repository share refs but not working trees, so
 * two sessions that each create before committing both mint N+1, and the merge
 * is an add/add conflict on the same `.quest/tasks/<P>-<N+1>.json` path.
 *
 * This module closes that on one machine, and the three moving parts are
 * exactly the three DEC-179 names:
 *
 *   - a LOCK, at `<git-common-dir>/quest/alloc.lock`, which every worktree of
 *     the repository shares, so two allocators in one repository serialise;
 *   - a RESERVATION LEDGER, at `<git-common-dir>/quest/reserved-ids`, which is
 *     what makes the serialisation mean anything: an id handed out is written
 *     down before the lock is released, so a second allocator that arrives
 *     after the first has released -- but before any record carrying that id
 *     is visible anywhere -- still sees it;
 *   - the WORKTREE SCAN, `git worktree list --porcelain` plus a read of each
 *     worktree's own `.quest`, which is the reading of uncommitted records the
 *     refs-aware scan structurally cannot do.
 *
 * Nothing here touches the network: the lock and the ledger are files in the
 * common dir, and the worktree enumeration is a local Git read. DEC-179's
 * cross-machine half is part (4) and is deliberately NOT here.
 *
 * The lock and the ledger live INSIDE `<git-common-dir>`, which is not the
 * working tree, so allocation never dirties the checkout and never adds a path
 * for anyone to commit.
 */

/** DEC-179 (1): a lock held by a process whose pid is gone is stale after this
 * long. The age test is what makes the pid test safe -- a lock file is created
 * empty and written a moment later, so a zero-byte lock younger than this is a
 * holder mid-write, never an abandoned one. */
export const STALE_LOCK_MILLISECONDS = 30_000;

/** DEC-179 (1): a reservation is dropped once its record is visible, or after
 * this long, whichever comes first. */
export const LEDGER_ENTRY_TTL_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

/** How long an allocator waits for a live holder before giving up. DEC-179
 * does not name one; a create holds the lock for one worktree scan and one
 * small file write, so ten seconds is already two orders of magnitude of
 * headroom, and giving up beats blocking a create forever behind a holder
 * that is wedged but alive. */
const LOCK_WAIT_MILLISECONDS = 10_000;

const LOCK_POLL_MILLISECONDS = 25;

const ALLOCATION_DIRECTORY = "quest";
const LOCK_FILE_NAME = "alloc.lock";
const LEDGER_FILE_NAME = "reserved-ids";
/** QCLI-522: the breaker's own file, beside the lock. Declared here because
 * {@link IdAllocationLockTimeoutError} reports its path by default. */
const BREAK_FILE_STALE_MILLISECONDS = 10_000;
const BREAK_FILE_SUFFIX = ".break";

export interface IdAllocationRequest {
  readonly git: GitPort;
  /** The root of THIS checkout -- the directory holding `.quest`. */
  readonly worktreeRoot: string;
  /** `<git-common-dir>` as `git rev-parse --git-common-dir` resolves it, or
   * null when the caller names a raw store with no workspace behind it (the
   * `QUEST_TASK_STORE` override). A workspace with no Git repository never
   * reaches here: resolving it fails first, with `WorkspaceError`. */
  readonly commonDirectory: string | null;
  /** The family's id marker, e.g. `QCLI-`, `D-`, `M-`, `DEC-`. */
  readonly marker: string;
  /** Which record family this is -- `task`, `draft`, `milestone`, `decision`
   * or `question`. Kept apart from the marker because a workspace whose task
   * prefix is `D` shares the marker `D-` with drafts, and the ledger must not
   * let one family's reservation stand in for the other's. */
  readonly family: string;
  /** `.quest`-relative directories this family keeps one record per file in
   * (tasks, drafts), or null when it lives in `.quest/planning.json`
   * (milestones, decisions). */
  readonly recordDirectories: readonly string[] | null;
  /** The ids already visible from every local and remote-tracking ref and from
   * this checkout's own records. */
  readonly visibleIds: readonly string[];
  /** Test seams; production callers omit them. */
  readonly now?: () => number;
  readonly processId?: number;
  readonly sleep?: (milliseconds: number) => Promise<void>;
  /** QCLI-528: the two reads {@link readLock} performs, so a test can drive
   * the stat-then-read window deterministically instead of racing a real
   * filesystem. Production callers omit it and get `node:fs/promises`. */
  readonly lockReadIo?: LockReadIo;
}

export interface IdAllocation {
  readonly id: string;
  /** True when this run found the lock abandoned and broke it. AC 5 requires
   * the run to SAY so, so the caller must report it rather than swallow it. */
  readonly brokeStaleLock: boolean;
  /** The lock that was held, or null when there was none to hold. */
  readonly lockPath: string | null;
}

interface LedgerEntry {
  readonly id: string;
  readonly at: number;
  /** The family that reserved it, or null for a line that names none. */
  readonly family: string | null;
}

/** QCLI-495 round 1, finding 6: waiting for the lock ran out. A conflict, not a
 * validation failure -- contention is retryable and the CLI already answers its
 * own `.write.lock` timeout that way. Carries what the hint needs.
 *
 * QCLI-522: it also carries what is at `<lockPath>.break`, because that file
 * decides whether removing the lock is safe at all. A break file can be read
 * (a pid, possibly alive) or not -- and an unreadable one is ambiguous between
 * a breaker killed before writing its pid and a LIVE one between creating the
 * file and writing it. It is never auto-cleared (see `takeBreakFile`) and it
 * blocks breaking a stale lock, so a hint that called the lock unconditionally
 * safe to remove was wrong in exactly the state a wedged allocator ends up in.
 * QCLI-522 round 1, MAJOR 1: the hint therefore reports the ambiguity and the
 * file's age rather than asserting a cause. */
export class IdAllocationLockTimeoutError extends Error {
  constructor(
    readonly lockPath: string,
    readonly holderPid: number | null,
    readonly lockAgeMilliseconds: number | null,
    readonly waitedMilliseconds: number,
    /** `<lockPath>.break`, the file that serialises breakers. */
    readonly breakPath: string = `${lockPath}${BREAK_FILE_SUFFIX}`,
    /** Whether a file exists at {@link breakPath} at all. QCLI-528 (QCLI-522
     * round 2, N2): true also when the file exists and cannot be stat'd --
     * an unreadable file is not an absent one, and only absence licenses
     * removing the lock. */
    readonly breakFilePresent: boolean = false,
    /** The breaker's pid as recorded, or null when the file is present but its
     * holder cannot be read (a breaker between creating the file and writing
     * its pid, or one killed before doing so) OR when there is no file --
     * {@link breakFilePresent} is what separates those two. */
    readonly breakHolderPid: number | null = null,
    /** True only when a readable break pid names a process this machine can
     * still see. A live breaker means the lock must not be removed. */
    readonly breakHolderAlive: boolean = false,
    /** How old the break file is. QCLI-528: this is the file's own stamp when
     * one is readable, and its MTIME otherwise -- which is every zero-byte
     * file, because the stamp is the second line. Null when there is no file
     * at all, and null when the file exists but its stat failed with something
     * other than ENOENT; {@link breakFilePresent} separates those two. QCLI-522
     * round 1, MAJOR 1: the removal advice is conditional on the age, because
     * a young unreadable file is equally a LIVE breaker between creating it
     * and writing its pid. */
    readonly breakFileAgeMilliseconds: number | null = null,
  ) {
    super(
      `id_allocation_lock_timeout: waited ${Math.round(waitedMilliseconds / 1000)}s for the id allocation lock at ${lockPath}, held by ${holderPid === null ? "an unidentified process" : `pid ${holderPid}`}${lockAgeMilliseconds === null ? "" : ` (lock stamped ${Math.round(lockAgeMilliseconds / 1000)}s ago)`}${breakFilePresent ? `; a break file is present at ${breakPath}` : ""}. Nothing was written.`,
    );
    this.name = "IdAllocationLockTimeoutError";
  }
}

/**
 * QCLI-522: the timeout hint, as ONE function so a test can assert the exact
 * text without spawning a process and waiting out the lock's ten-second
 * window, and so the break-file clause has one home.
 *
 * The rule the wording encodes: `alloc.lock` is safe to remove only when no
 * LIVE break holder exists. A break file this command can read and whose pid
 * is alive means a breaker is mid-critical-section, and that one is certain.
 *
 * A break file whose holder CANNOT be read is the state this function must not
 * overclaim about (QCLI-522 round 1, MAJOR 1). An empty file is equally a LIVE
 * breaker between `open(wx)` and the write of its pid, a suspended breaker, or
 * a killed one -- so the wording says the holder cannot be determined, never
 * that a breaker died. The removal advice is conditional on BOTH no quest
 * process running AND the file's age: an unreadable file that is still inside
 * the window a breaker has to write its pid is exactly the one an operator
 * must not delete. `takeBreakFile` refuses to auto-clear the same state for
 * the same reason, so the hint cannot be stricter or looser than the module.
 *
 * QCLI-528: "cannot be read" includes a file that cannot be STAT'd with
 * anything but ENOENT. That file is PRESENT with no readable age, so it takes
 * the same branch and prints the existing "its age could not be read" clause --
 * what it must never do is claim the file does not exist and call the lock safe
 * to remove.
 *
 * This function, and the CLI path that calls it, never remove or clear the
 * break file -- they only report it.
 */
export function allocationLockTimeoutHint(
  error: IdAllocationLockTimeoutError,
): string {
  const holder =
    error.holderPid === null
      ? "an unidentified process"
      : `pid ${error.holderPid}`;
  const age =
    error.lockAgeMilliseconds === null
      ? "has no readable stamp"
      : `was stamped ${Math.round(error.lockAgeMilliseconds / 1000)}s ago`;
  // Existence only: nothing here can say a pid belongs to quest (QCLI-522
  // round 1, NIT) -- only that this machine can still see it.
  const holderGoneWhen =
    error.holderPid === null
      ? "no quest process is running"
      : `no process with pid ${error.holderPid} is running`;
  const breakStaleSeconds = Math.round(BREAK_FILE_STALE_MILLISECONDS / 1000);
  const breakAge =
    error.breakFileAgeMilliseconds === null
      ? null
      : Math.round(error.breakFileAgeMilliseconds / 1000);
  // Inside the window a breaker has to create the file and write its pid, so
  // an unreadable file this young may be a LIVE holder mid-write.
  const breakIsSettling =
    error.breakFileAgeMilliseconds !== null &&
    error.breakFileAgeMilliseconds <= BREAK_FILE_STALE_MILLISECONDS;
  const breakAgeClause =
    breakAge === null
      ? "its age could not be read"
      : `it was written ${breakAge}s ago`;
  const breakClause = !error.breakFilePresent
    ? `No break file exists at ${error.breakPath}.`
    : error.breakHolderPid === null
      ? breakIsSettling
        ? `A break file EXISTS at ${error.breakPath} and its holder cannot be determined (${breakAgeClause}); a breaker creates the file and writes its pid a moment later, so an empty or unreadable file this new may be a LIVE breaker mid-write. While it is there a stale lock cannot be broken, and this command never removes or clears it: retry shortly, and remove ${error.breakPath} yourself only once no quest process is running and the file is older than ${breakStaleSeconds}s. Removing ${error.lockPath} is NOT safe until it is gone.`
        : `A break file EXISTS at ${error.breakPath} and its holder cannot be determined (${breakAgeClause}); an empty or unreadable file may be a breaker killed before writing its pid, and it blocks breaking a stale lock. This command never removes or clears it: remove ${error.breakPath} yourself only if no quest process is running and the file is older than ${breakStaleSeconds}s. Removing ${error.lockPath} is NOT safe until it is gone.`
      : error.breakHolderAlive
        ? `A break file EXISTS at ${error.breakPath}, held by LIVE pid ${error.breakHolderPid}. Removing ${error.lockPath} is NOT safe while that breaker is running, and this command never removes or clears the break file.`
        : `A break file EXISTS at ${error.breakPath}, held by pid ${error.breakHolderPid}, which is not running. Remove ${error.breakPath} first if it still names pid ${error.breakHolderPid} -- a reused pid would make that file another process's, so check the file itself; while it is there a stale lock cannot be broken, and this command never clears it.`;
  // The final sentence states the safe condition too, and for an unreadable
  // holder it must carry the AGE as well as process quiescence.
  const breakRemovalCondition =
    error.breakFilePresent && error.breakHolderPid === null
      ? `no quest process is running and ${error.breakPath} is older than ${breakStaleSeconds}s`
      : "no live break holder exists";
  return `Retry the create. The lock ${age}, held by ${holder}; one whose holder pid is gone is broken automatically once it is 30s old, so a create after a crashed holder can fail for up to that long. ${breakClause} If it keeps failing, removing ${error.lockPath} is safe only when ${breakRemovalCondition} and ${holderGoneWhen}.`;
}

/** QCLI-495 round 1, finding 5: `git worktree list` answered nothing while a
 * common dir resolves. Such a list always holds at least the current worktree,
 * so an empty one is a failed read, and carrying on without the worktree source
 * would silently hand back the pre-fix answer. */
export class IdAllocationWorktreeReadError extends Error {
  constructor(readonly worktreeRoot: string) {
    super(
      `id_allocation_worktree_list_empty: git worktree list read 0 worktrees from ${worktreeRoot}. An empty read is a failure, not a pass -- it cannot be told apart from a wrong repository or a failed Git call, and allocating without it would ignore every other worktree's uncommitted records.`,
    );
    this.name = "IdAllocationWorktreeReadError";
  }
}

function sleepFor(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** The sequence an id carries, or null when it does not belong to `marker`'s
 * family or its tail is not a plain integer. `QCLI-10x` and `D-` are both
 * refused here rather than coerced, the way the allocators this replaces
 * already refused them. */
function sequenceOfId(id: string, marker: string): number | null {
  if (!id.startsWith(marker)) return null;
  const tail = id.slice(marker.length);
  if (!/^\d+$/u.test(tail)) return null;
  const sequence = Number(tail);
  return Number.isSafeInteger(sequence) ? sequence : null;
}

/**
 * QCLI-495 AC 8, and DEC-181's ordering: this is the ONE comparison the
 * allocator uses to decide which of two ids is higher, and it is #604's
 * `compareTaskIds` -- numeric on the id's sequence, never on its characters,
 * so `P-10` outranks `P-9` and `P-100` outranks `P-99`. A second comparator
 * here would be a second place for the digit-boundary defect to live; the
 * test for this criterion mutates the CALL below into a bare `.sort()`, which
 * is the string sort the criterion names.
 */
function highestId(ids: readonly string[], marker: string): string | null {
  const family = ids.filter((id) => sequenceOfId(id, marker) !== null);
  if (family.length === 0) return null;
  return [...family].sort(compareTaskIds).at(-1) ?? null;
}

/** One above the highest id visible anywhere, or the family's first id. */
function candidateId(ids: readonly string[], marker: string): string {
  const highest = highestId(ids, marker);
  const sequence = highest === null ? 0 : (sequenceOfId(highest, marker) ?? 0);
  return `${marker}${sequence + 1}`;
}

/** Whether a pid names a process this machine can still see. `EPERM` means it
 * exists and belongs to someone else, which is still alive. */
function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** The two filesystem reads {@link readLock} performs. QCLI-528: injectable so
 * the stat-then-read window is drivable in a test without racing a real
 * filesystem; production callers use {@link REAL_LOCK_IO}. */
export interface LockReadIo {
  readonly stat: (path: string) => Promise<{ readonly mtimeMs: number }>;
  readonly readFile: (path: string) => Promise<string>;
}

const REAL_LOCK_IO: LockReadIo = {
  stat: (path) => stat(path),
  readFile: (path) => readFile(path, "utf8"),
};

/** A lock or break file this call could see. `pid` is null when the file is
 * present but its holder cannot be read; `at` is null when the file is present
 * but its age cannot be read either. */
interface ReadLockHolder {
  readonly pid: number | null;
  readonly at: number | null;
}

/** The lock's holder, as `<pid>\n<epoch-millis>\n`. `null` means the file is
 * ABSENT -- ENOENT on the stat, or ENOENT on the read after a successful stat,
 * which is a file removed between the two (QCLI-522 round 1, MINOR 3). Every
 * other outcome is PRESENT, and the split matters:
 *
 *  - a stat failure other than ENOENT (`EACCES`, `EIO`, `ELOOP`) leaves a file
 *    whose age cannot be read; `pid` and `at` are both null (QCLI-528);
 *  - a read failure other than ENOENT leaves the holder unreadable but the
 *    stat's mtime is still an age, so `pid` is null and `at` is that mtime.
 *
 * QCLI-528 (QCLI-522 round 2, N2): the stat catch used to collapse EVERY
 * failure into "absent", and absent is the branch the hint reads as "no break
 * file exists" -- the branch that makes removing the lock sound safe. A file
 * this command merely cannot stat is not an absent one, so it must never
 * answer that way. An unreadable age is likewise never judged stale by
 * {@link breakStaleLock}: only an age that was READ can prove abandonment. */
async function readLock(
  lockPath: string,
  io: LockReadIo = REAL_LOCK_IO,
): Promise<ReadLockHolder | null> {
  // stat FIRST and readFile second: a holder between the two has created the
  // file and not yet written it, and the stat's mtime is then the age this
  // function reports. The reverse order loses that fallback to a race it
  // cannot see.
  let info: { readonly mtimeMs: number };
  try {
    info = await io.stat(lockPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    return { pid: null, at: null };
  }
  let body: string;
  try {
    body = await io.readFile(lockPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    body = "";
  }
  const lines = body.split("\n");
  const pid = Number(lines[0]);
  const stamp = Number(lines[1]);
  return {
    pid: Number.isSafeInteger(pid) && pid > 0 ? pid : null,
    at: Number.isFinite(stamp) && stamp > 0 ? stamp : info.mtimeMs,
  };
}

/** Test seams (production callers pass only `processId`): `afterStaleJudgement`
 * is the window a second breaker can act in before anything is removed. */
export interface BreakOptions {
  /** The pid recorded in the break file; defaults to this process. */
  readonly processId?: number;
  readonly afterStaleJudgement?: () => Promise<void>;
  /** Runs while the break file is held, after the lock was read again and
   * still matched, and before it is removed -- where a second breaker has to
   * be refused by the break file and by nothing else. */
  readonly afterLockedReread?: () => Promise<void>;
  /** QCLI-528: test seam for the stat-then-read window, as in
   * {@link IdAllocationRequest.lockReadIo}. */
  readonly readIo?: LockReadIo;
}

/**
 * DEC-179 (1)'s stale rule, and only that rule: older than 30 seconds AND the
 * holder's pid is gone. A lock whose pid line is missing or unreadable falls
 * back to the file's own mtime and is broken on age alone -- a holder that
 * cannot be identified is exactly the wedged state this exists to clear, and
 * the age test is what keeps a mid-write holder out of it.
 *
 * BREAKERS ARE SERIALISED through a second exclusive file, `alloc.lock.break`.
 * Judging a lock stale and removing it are two steps, and anything between
 * them can change what is at `lockPath`: a faster breaker can take the lock and
 * start allocating. A rename-and-restore, or a bare unlink, then moves or
 * deletes a LIVE holder's lock (round 2, NEW 1). So nothing here touches
 * `alloc.lock` unless it holds the break file, and under it the lock is read
 * again and removed only if its pid and stamp still equal the stale reading.
 * While the stale lock exists nobody can `open(wx)` over it, and with breakers
 * serialised nobody else can remove it, so that second read has no gap left to
 * race in. Nothing is ever parked or restored, so there is no parked file for a
 * killed breaker to leave behind and no moment `lockPath` is absent while a
 * live holder owns it (round 2, NEW 2 and NOTE 4).
 */
export async function breakStaleLock(
  lockPath: string,
  now: () => number,
  options: BreakOptions = {},
): Promise<boolean> {
  const io = options.readIo ?? REAL_LOCK_IO;
  const holder = await readLock(lockPath, io);
  if (holder === null) return false;
  // QCLI-528: an age that could not be READ is never an age that proves
  // abandonment. Before the stat catch was narrowed this state was reported as
  // an absent lock, which took this same early return; the fix must keep it a
  // refusal rather than let a NaN age fall through the comparison.
  if (holder.at === null) return false;
  if (now() - holder.at <= STALE_LOCK_MILLISECONDS) return false;
  if (holder.pid !== null && processIsAlive(holder.pid)) return false;
  await options.afterStaleJudgement?.();
  const breakPath = `${lockPath}${BREAK_FILE_SUFFIX}`;
  const processId = options.processId ?? process.pid;
  const mine = await takeBreakFile(breakPath, now, processId, io);
  if (mine === null) return false;
  try {
    const current = await readLock(lockPath, io);
    if (
      current === null ||
      current.pid !== holder.pid ||
      current.at !== holder.at
    )
      return false;
    await options.afterLockedReread?.();
    await unlink(lockPath).catch(() => undefined);
    return true;
  } finally {
    // Only a break file this call still owns: the clear rule below keeps a
    // live breaker's file in place, but a release that read someone else's
    // would take their serialisation with it.
    const left = await readLock(breakPath, io);
    if (left !== null && left.pid === mine.pid && left.at === mine.at)
      await unlink(breakPath).catch(() => undefined);
  }
}

/** The break file is held for one read and one unlink, and records its holder
 * the way the lock does (`<pid>\n<epoch-millis>\n`). One is cleared only when
 * it is older than this AND its pid is provably gone -- the same rule as the
 * lock's own. Age alone was the first version, and it let a LIVE breaker that
 * stalled for longer than this (a suspended process, a starved runner) lose its
 * break file to a second breaker, which then removed a new holder's lock when
 * the first resumed (round 3, F2). A file whose pid cannot be read is never
 * cleared here: a breaker killed between creating the file and writing it
 * would leave one, and until someone removes it a stale lock cannot be broken
 * (creates time out with exit 5 and the hint names the lock path). Recorded,
 * not closed: clearing is still check-then-unlink, so two clearers can race
 * for a file whose holder really is dead, and a loser's unlink can hit the
 * winner's fresh file; that needs a killed breaker AND two clearers AND a third
 * breaker in the same instant, and the stale reading must still match. */

/** The holder written into a break file this call created, or null when it was
 * not taken. */
async function takeBreakFile(
  breakPath: string,
  now: () => number,
  processId: number,
  io: LockReadIo,
): Promise<{ readonly pid: number; readonly at: number } | null> {
  try {
    const handle = await open(breakPath, "wx");
    const at = now();
    try {
      await handle.writeFile(`${processId}\n${at}\n`, "utf8");
    } catch (error) {
      await handle.close().catch(() => undefined);
      await unlink(breakPath).catch(() => undefined);
      throw error;
    }
    await handle.close();
    return { pid: processId, at };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  const existing = await readLock(breakPath, io);
  if (
    existing !== null &&
    existing.pid !== null &&
    existing.at !== null &&
    now() - existing.at > BREAK_FILE_STALE_MILLISECONDS &&
    !processIsAlive(existing.pid)
  )
    await unlink(breakPath).catch(() => undefined);
  return null;
}

/**
 * Takes the lock and says whether this call had to BREAK a stale one to do it.
 * A break is never the end of the call: it loops back to the exclusive create,
 * because breaking removes the file and holding the lock means having created
 * one. Returning straight after the break (the first version) left every
 * breaker running the critical section with no lock at all, and a second
 * allocator's create then succeeded alongside it (round 1, finding 1).
 */
async function acquireLock(
  lockPath: string,
  now: () => number,
  processId: number,
  sleep: (milliseconds: number) => Promise<void>,
  io: LockReadIo = REAL_LOCK_IO,
): Promise<boolean> {
  const started = now();
  let broke = false;
  for (;;) {
    try {
      const handle = await open(lockPath, "wx");
      try {
        await handle.writeFile(`${processId}\n${now()}\n`, "utf8");
      } catch (error) {
        // An empty lock would block every create for 30 seconds.
        await handle.close().catch(() => undefined);
        await unlink(lockPath).catch(() => undefined);
        throw error;
      }
      await handle.close();
      return broke;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    if (await breakStaleLock(lockPath, now, { processId, readIo: io })) {
      broke = true;
      continue;
    }
    if (now() - started >= LOCK_WAIT_MILLISECONDS) {
      const holder = await readLock(lockPath, io);
      // QCLI-522: the break file decides whether the lock is safe to remove,
      // so what is at it is part of the answer. `readLock` answers null for an
      // ABSENT file and a holder with `pid: null` for one whose holder cannot
      // be read -- the two states the hint must not conflate. QCLI-528: an
      // unreadable STAT also answers present-with-no-age, so both ages below
      // are null in that case rather than NaN.
      const breakPath = `${lockPath}${BREAK_FILE_SUFFIX}`;
      const breaker = await readLock(breakPath, io);
      throw new IdAllocationLockTimeoutError(
        lockPath,
        holder?.pid ?? null,
        holder === null || holder.at === null ? null : now() - holder.at,
        now() - started,
        breakPath,
        breaker !== null,
        breaker?.pid ?? null,
        breaker?.pid != null && processIsAlive(breaker.pid),
        breaker === null || breaker.at === null ? null : now() - breaker.at,
      );
    }
    await sleep(LOCK_POLL_MILLISECONDS);
  }
}

/** Releases only a lock this process still holds: a holder slow enough to be
 * broken as stale has already lost it, and unlinking on the way out would take
 * the new holder's lock instead. */
async function releaseLock(
  lockPath: string,
  processId: number,
  io: LockReadIo = REAL_LOCK_IO,
): Promise<void> {
  const holder = await readLock(lockPath, io);
  if (holder === null || holder.pid !== processId) return;
  await unlink(lockPath).catch(() => undefined);
}

async function readLedger(ledgerPath: string): Promise<LedgerEntry[]> {
  const text = await readFile(ledgerPath, "utf8").catch(() => "");
  const entries: LedgerEntry[] = [];
  for (const line of text.split("\n")) {
    if (line.trim() === "") continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue; // a corrupt line is dropped, not fatal; the atomic write below makes one practically unreachable (it WOULD under-report, the unsafe direction)
    }
    const entry = parsed as {
      id?: unknown;
      at?: unknown;
      family?: unknown;
    } | null;
    if (typeof entry?.id !== "string" || !Number.isFinite(entry.at)) continue;
    entries.push({
      id: entry.id,
      at: entry.at as number,
      family: typeof entry.family === "string" ? entry.family : null,
    });
  }
  return entries;
}

/** Temp file plus rename, the way local-task-repository.ts writes a record: a
 * process killed mid-write leaves the previous ledger whole instead of a
 * truncated one that readLedger would silently under-read. The caller holds the
 * lock, so the temp name need only differ from every OTHER process's. */
async function writeLedger(
  ledgerPath: string,
  entries: readonly LedgerEntry[],
  processId: number,
): Promise<void> {
  const temporary = `${ledgerPath}.tmp-${processId}`;
  await writeFile(
    temporary,
    entries.map((entry) => `${JSON.stringify(entry)}\n`).join(""),
    "utf8",
  );
  await rename(temporary, ledgerPath);
}

/** Record ids this family keeps one per file in `directory`. An absent
 * directory is an empty one, which is what a fresh worktree has. */
async function fileRecordIds(
  directory: string,
  marker: string,
): Promise<readonly string[]> {
  const names = await readdir(directory).catch(() => [] as string[]);
  return names
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.slice(0, -".json".length))
    .filter((id) => sequenceOfId(id, marker) !== null);
}

/** Record ids this family keeps inside `.quest/planning.json`, whose two
 * arrays share one file -- hence the marker filter, or `DEC-9` would advance
 * the milestone counter. */
async function planningRecordIds(
  documentPath: string,
  marker: string,
): Promise<readonly string[]> {
  const text = await readFile(documentPath, "utf8").catch(() => null);
  if (text === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return []; // one worktree's corrupt document must not wedge allocation
  }
  if (typeof parsed !== "object" || parsed === null) return [];
  const record = parsed as Record<string, unknown>;
  const ids: string[] = [];
  for (const key of ["milestones", "decisions"]) {
    const entries = record[key];
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      const id = (entry as { id?: unknown } | null)?.id;
      if (typeof id === "string" && sequenceOfId(id, marker) !== null)
        ids.push(id);
    }
  }
  return ids;
}

/** DEC-179's second source: every worktree's own `.quest`, including records
 * no ref has ever seen. The current worktree is in this list too, so its
 * uncommitted records are read here as well as by the caller -- one listing
 * per source is the point, and a source read twice is not a source missed. */
async function worktreeIds(
  request: IdAllocationRequest,
): Promise<readonly string[]> {
  const worktrees = await request.git
    .listWorktrees(request.worktreeRoot)
    .catch(() => [] as readonly string[]);
  // A common dir resolved, so this list holds at least the current worktree.
  // Empty can only mean the read failed -- and the fleet rule is that a check
  // which read zero inputs fails rather than passes.
  if (worktrees.length === 0)
    throw new IdAllocationWorktreeReadError(request.worktreeRoot);
  const ids: string[] = [];
  for (const worktree of worktrees) {
    const quest = join(worktree, ".quest");
    if (request.recordDirectories === null) {
      ids.push(
        ...(await planningRecordIds(
          join(quest, "planning.json"),
          request.marker,
        )),
      );
      continue;
    }
    for (const directory of request.recordDirectories)
      ids.push(
        ...(await fileRecordIds(join(quest, directory), request.marker)),
      );
  }
  return ids;
}

/**
 * QCLI-520: a BLOCK of consecutive ids for one family, requested in one call.
 *
 * The Backlog.md migration mints a whole batch of task ids (and milestone
 * ids) for one apply, and it used to compute them itself from its own
 * worktree -- no lock, no ledger, no worktree scan -- so two worktrees
 * migrating before either committed both minted the same numbers
 * (src/application/migration/backlog-public.ts). A block request puts that
 * batch through the same lock and ledger one id already goes through.
 */
export interface IdBlockRequest extends IdAllocationRequest {
  readonly count: number;
}

export interface IdBlock {
  readonly ids: readonly string[];
  readonly brokeStaleLock: boolean;
  readonly lockPath: string | null;
}

/** The block's first sequence: one above everything visible to this call,
 * which is the same rule {@link candidateId} applies to a single id. */
function blockIds(
  ids: readonly string[],
  marker: string,
  count: number,
): readonly string[] {
  const highest = highestId(ids, marker);
  const base = highest === null ? 0 : (sequenceOfId(highest, marker) ?? 0);
  return Array.from(
    { length: count },
    (_, index) => `${marker}${base + index + 1}`,
  );
}

/** Live reservations for this family, which raise its floor exactly as they do
 * for a single allocation. */
function ownReservations(
  reserved: readonly LedgerEntry[],
  family: string,
): readonly string[] {
  return reserved
    .filter((entry) => entry.family === family)
    .map((entry) => entry.id);
}

/**
 * QCLI-520: the block a reservation WOULD return, computed without the lock
 * and without writing anything.
 *
 * A migration preview has to show the ids the apply will mint (they are part
 * of the approved digest), and it must not reserve them: a preview that
 * reserved would move the floor, so the apply that follows could not
 * reproduce the approved plan. So preview peeks and apply reserves, and the
 * two agree because both read the same visible set and the same ledger -- and
 * when a concurrent allocator moves the floor between them, the migration's
 * own digest check refuses the stale plan instead of minting an unapproved
 * one.
 */
export async function peekIdBlock(
  request: IdBlockRequest,
): Promise<readonly string[]> {
  if (request.count <= 0) return [];
  const visible = [...request.visibleIds];
  let reserved: readonly LedgerEntry[] = [];
  if (request.commonDirectory !== null) {
    const now = request.now ?? Date.now;
    const ledgerPath = join(
      request.commonDirectory,
      ALLOCATION_DIRECTORY,
      LEDGER_FILE_NAME,
    );
    visible.push(...(await worktreeIds(request)));
    reserved = (await readLedger(ledgerPath)).filter(
      (entry) => now() - entry.at <= LEDGER_ENTRY_TTL_MILLISECONDS,
    );
  }
  return blockIds(
    [...visible, ...ownReservations(reserved, request.family)],
    request.marker,
    request.count,
  );
}

/**
 * QCLI-520: reserve `count` consecutive ids for one family in one lock hold.
 * The reservations are durable when this resolves, so a second worktree's
 * migration sees them (through the ledger and, once written, through its
 * worktree scan) and starts above them rather than on top of them.
 */
export async function reserveIdBlock(
  request: IdBlockRequest,
): Promise<IdBlock> {
  if (request.count <= 0)
    return { ids: [], brokeStaleLock: false, lockPath: null };
  if (request.commonDirectory === null)
    return {
      ids: blockIds(request.visibleIds, request.marker, request.count),
      brokeStaleLock: false,
      lockPath: null,
    };

  const now = request.now ?? Date.now;
  const processId = request.processId ?? process.pid;
  const sleep = request.sleep ?? sleepFor;
  const directory = join(request.commonDirectory, ALLOCATION_DIRECTORY);
  const lockPath = join(directory, LOCK_FILE_NAME);
  const ledgerPath = join(directory, LEDGER_FILE_NAME);

  await mkdir(dirname(lockPath), { recursive: true });
  const brokeStaleLock = await acquireLock(
    lockPath,
    now,
    processId,
    sleep,
    request.lockReadIo,
  );
  try {
    const visible = [...request.visibleIds, ...(await worktreeIds(request))];
    const visibleSet = new Set(visible);
    const reserved = (await readLedger(ledgerPath)).filter(
      (entry) => now() - entry.at <= LEDGER_ENTRY_TTL_MILLISECONDS,
    );
    const ids = blockIds(
      [...visible, ...ownReservations(reserved, request.family)],
      request.marker,
      request.count,
    );
    const kept = reserved.filter(
      (entry) => !(entry.family === request.family && visibleSet.has(entry.id)),
    );
    await writeLedger(
      ledgerPath,
      [
        ...kept,
        ...ids.map((id) => ({ id, at: now(), family: request.family })),
      ],
      processId,
    );
    return { ids, brokeStaleLock, lockPath };
  } finally {
    await releaseLock(lockPath, processId, request.lockReadIo);
  }
}

/** QCLI-520 round 1 (MAJOR 3): what a release needs. No `visibleIds` and no
 * `recordDirectories` -- releasing withdraws entries this run itself wrote, so
 * it never scans a worktree or a record directory. */
export type IdReleaseRequest = Omit<
  IdAllocationRequest,
  "visibleIds" | "recordDirectories"
>;

/**
 * QCLI-520 round 1 (MAJOR 3): give back a block THIS RUN reserved.
 *
 * `migration backlog apply` reserves its task block (and then its milestone
 * block) before it writes anything, and every failure path after that point
 * writes nothing at all. Without this, the abandoned block stays in the ledger
 * for its 7-day TTL, so a retry carrying the SAME approved digest peeks above
 * it, computes a different block, and is refused as
 * `migration_approval_digest_mismatch` -- the plan is undone by a reservation
 * this run never used.
 *
 * Exactly the entries whose family matches AND whose id is in `ids` are
 * removed; another family's reservation is never touched, and the ledger is
 * rewritten only when something changed. It takes the same lock as
 * `reserveIdBlock`, so a concurrent allocator cannot interleave a read/write
 * pair, and applies the same TTL filter, so expired entries are pruned on the
 * same terms. With no common dir there is no ledger: a no-op that returns
 * false.
 */
export async function releaseIdBlock(
  request: IdReleaseRequest,
  ids: readonly string[],
): Promise<boolean> {
  if (request.commonDirectory === null || ids.length === 0) return false;
  const now = request.now ?? Date.now;
  const processId = request.processId ?? process.pid;
  const sleep = request.sleep ?? sleepFor;
  const directory = join(request.commonDirectory, ALLOCATION_DIRECTORY);
  const lockPath = join(directory, LOCK_FILE_NAME);
  const ledgerPath = join(directory, LEDGER_FILE_NAME);

  await mkdir(dirname(lockPath), { recursive: true });
  await acquireLock(lockPath, now, processId, sleep, request.lockReadIo);
  try {
    const wanted = new Set(ids);
    const reserved = (await readLedger(ledgerPath)).filter(
      (entry) => now() - entry.at <= LEDGER_ENTRY_TTL_MILLISECONDS,
    );
    const kept = reserved.filter(
      (entry) => !(entry.family === request.family && wanted.has(entry.id)),
    );
    if (kept.length === reserved.length) return false;
    await writeLedger(ledgerPath, kept, processId);
    return true;
  } finally {
    await releaseLock(lockPath, processId, request.lockReadIo);
  }
}

/**
 * Allocates one id for one family. The returned id is the caller's to write;
 * the reservation is already durable when this resolves, which is what lets a
 * second allocator release the lock, read the ledger, and still see it.
 *
 * With no common dir -- the caller's raw-store case, see `commonDirectory` --
 * there is nothing to lock, no worktree list to enumerate and no ledger to
 * keep, so the answer is one above
 * the ids the caller can already see -- byte-for-byte the behaviour that
 * existed before this module, which DEC-179 makes a requirement rather than a
 * degradation.
 */
export async function allocateId(
  request: IdAllocationRequest,
): Promise<IdAllocation> {
  if (request.commonDirectory === null)
    return {
      id: candidateId(request.visibleIds, request.marker),
      brokeStaleLock: false,
      lockPath: null,
    };

  const now = request.now ?? Date.now;
  const processId = request.processId ?? process.pid;
  const sleep = request.sleep ?? sleepFor;
  const directory = join(request.commonDirectory, ALLOCATION_DIRECTORY);
  const lockPath = join(directory, LOCK_FILE_NAME);
  const ledgerPath = join(directory, LEDGER_FILE_NAME);

  await mkdir(dirname(lockPath), { recursive: true });
  const brokeStaleLock = await acquireLock(
    lockPath,
    now,
    processId,
    sleep,
    request.lockReadIo,
  );
  try {
    const visible = [...request.visibleIds, ...(await worktreeIds(request))];
    const visibleSet = new Set(visible);
    // DEC-179's second pruning limb, applied BEFORE the entry can influence
    // anything: an entry past its 7 days is spent whether or not a record
    // carrying it ever appeared, and dropping it only on the way out would
    // still let an expired reservation hold its id hostage forever.
    const reserved = (await readLedger(ledgerPath)).filter(
      (entry) => now() - entry.at <= LEDGER_ENTRY_TTL_MILLISECONDS,
    );
    // Only THIS family's reservations raise this family's floor, and only a
    // reservation that parses as one of this marker's ids can.
    const ownReservedIds = reserved
      .filter((entry) => entry.family === request.family)
      .map((entry) => entry.id);
    const id = candidateId([...visible, ...ownReservedIds], request.marker);
    // DEC-179's first pruning limb, exactly: an entry is spent once a record
    // carrying THAT id is visible in a ref or a worktree. Another family's
    // entry is checked against ITS visibility, which this call cannot see, so
    // it is left to the 7-day limb. (The first version pruned every entry at or
    // below the highest visible sequence, and treated a foreign entry as
    // sequence 0, which wiped every other family's reservation -- round 1,
    // finding 2.)
    const kept = reserved.filter(
      (entry) => !(entry.family === request.family && visibleSet.has(entry.id)),
    );
    await writeLedger(
      ledgerPath,
      [...kept, { id, at: now(), family: request.family }],
      processId,
    );
    return { id, brokeStaleLock, lockPath };
  } finally {
    await releaseLock(lockPath, processId, request.lockReadIo);
  }
}
