import {
  link,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
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

export interface IdAllocationRequest {
  readonly git: GitPort;
  /** The root of THIS checkout -- the directory holding `.quest`. */
  readonly worktreeRoot: string;
  /** `<git-common-dir>` as `git rev-parse --git-common-dir` resolves it, or
   * null when `.quest` has no Git repository behind it. */
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
 * own `.write.lock` timeout that way. Carries what the hint needs. */
export class IdAllocationLockTimeoutError extends Error {
  constructor(
    readonly lockPath: string,
    readonly holderPid: number | null,
    readonly lockAgeMilliseconds: number | null,
    readonly waitedMilliseconds: number,
  ) {
    super(
      `id_allocation_lock_timeout: waited ${Math.round(waitedMilliseconds / 1000)}s for the id allocation lock at ${lockPath}, held by ${holderPid === null ? "an unidentified process" : `pid ${holderPid}`}${lockAgeMilliseconds === null ? "" : ` (lock stamped ${Math.round(lockAgeMilliseconds / 1000)}s ago)`}. Nothing was written.`,
    );
    this.name = "IdAllocationLockTimeoutError";
  }
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

/** The lock's holder, as `<pid>\n<epoch-millis>\n`. A holder is `null` only
 * when the lock has vanished, so a caller that reads it has the file in hand
 * and can decide about it without a second read. */
async function readLock(
  lockPath: string,
): Promise<{ readonly pid: number | null; readonly at: number } | null> {
  // stat FIRST and readFile second: a holder between the two has created the
  // file and not yet written it, and the stat's mtime is then the age this
  // function reports. The reverse order loses that fallback to a race it
  // cannot see.
  const info = await stat(lockPath).catch(() => null);
  if (info === null) return null;
  const lines = (await readFile(lockPath, "utf8").catch(() => "")).split("\n");
  const pid = Number(lines[0]);
  const stamp = Number(lines[1]);
  return {
    pid: Number.isSafeInteger(pid) && pid > 0 ? pid : null,
    at: Number.isFinite(stamp) && stamp > 0 ? stamp : info.mtimeMs,
  };
}

/**
 * DEC-179 (1)'s stale rule, and only that rule: older than 30 seconds AND the
 * holder's pid is gone. A lock whose pid line is missing or unreadable falls
 * back to the file's own mtime and is broken on age alone -- a holder that
 * cannot be identified is exactly the wedged state this exists to clear, and
 * the age test is what keeps a mid-write holder out of it.
 *
 * Breaking is a RENAME to a name only this call knows, then a re-read of what
 * was renamed. Two breakers can both judge the same lock stale; with a plain
 * unlink the slower one deletes the FRESH lock the faster one has since taken
 * (round 1, finding 1's secondary). After the rename the slower breaker finds
 * a lock that is not the one it judged, and puts it back with `link`, which
 * refuses to overwrite -- so it can never replace a newer holder's lock.
 */
async function breakStaleLock(
  lockPath: string,
  now: () => number,
): Promise<boolean> {
  const holder = await readLock(lockPath);
  if (holder === null) return false;
  if (now() - holder.at <= STALE_LOCK_MILLISECONDS) return false;
  if (holder.pid !== null && processIsAlive(holder.pid)) return false;
  const parked = `${lockPath}.stale-${randomUUID()}`;
  const renamed = await rename(lockPath, parked).then(
    () => true,
    () => false,
  );
  // Someone else broke it first: the lock is gone and the caller retries.
  if (!renamed) return false;
  const taken = await readLock(parked);
  const sameLock =
    taken !== null && taken.pid === holder.pid && taken.at === holder.at;
  if (!sameLock) {
    // We parked a lock that is not the stale one: restore it, never over a
    // newer one.
    await link(parked, lockPath).catch(() => undefined);
  }
  await unlink(parked).catch(() => undefined);
  return sameLock;
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
    if (await breakStaleLock(lockPath, now)) {
      broke = true;
      continue;
    }
    if (now() - started >= LOCK_WAIT_MILLISECONDS) {
      const holder = await readLock(lockPath);
      throw new IdAllocationLockTimeoutError(
        lockPath,
        holder?.pid ?? null,
        holder === null ? null : now() - holder.at,
        now() - started,
      );
    }
    await sleep(LOCK_POLL_MILLISECONDS);
  }
}

/** Releases only a lock this process still holds: a holder slow enough to be
 * broken as stale has already lost it, and unlinking on the way out would take
 * the new holder's lock instead. */
async function releaseLock(lockPath: string, processId: number): Promise<void> {
  const holder = await readLock(lockPath);
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
      continue; // a corrupt line is dropped, not fatal: it can only under-report
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
 * Allocates one id for one family. The returned id is the caller's to write;
 * the reservation is already durable when this resolves, which is what lets a
 * second allocator release the lock, read the ledger, and still see it.
 *
 * With no Git repository behind `.quest` there is no common dir to lock, no
 * worktree list to enumerate and no ledger to keep, so the answer is one above
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
  const brokeStaleLock = await acquireLock(lockPath, now, processId, sleep);
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
    await releaseLock(lockPath, processId);
  }
}
