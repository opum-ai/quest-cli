import type { AcrossRefsOutcome, AcrossRefsRequest } from "./across-refs.ts";
import {
  acquireCommonDirLock,
  type CommonDirLockHandle,
  type CommonDirLockOptions,
  CommonDirLockTimeoutError,
  DEFAULT_STALE_AFTER_MS,
} from "./common-dir-lock.ts";

/**
 * QCLI-568 (wiring half): serialise `task list --across-refs` across the
 * worktrees of one clone through the advisory common-directory lock.
 *
 * A THIN DECORATOR, NOT A REWRITE. The real view owns planning, ref reads and
 * coverage; this file only decides whether the read runs under the lock. It
 * wraps {@link AcrossRefsView.view} and returns the inner outcome unchanged, so
 * the envelope, flags and exit codes are byte-identical to the unwrapped view.
 *
 * THE COMMON DIRECTORY MUST BE REALPATH'D (F9). The lock lives at
 * `<git-common-dir>/quest/across-refs.lock`; `git rev-parse --git-common-dir`
 * returns a RELATIVE path (`.git`) in the main worktree, and creating the lock
 * under that raw value from a different working directory would make a stray
 * `<wrong-root>/quest` instead of contending for the clone's real lock. The
 * resolver passed by the composition root is the workspace port's
 * `inspect(...).commonDirectory`, which is already `realpath`'d against the
 * worktree (see `src/adapters/workspaces/local-workspaces.ts`).
 *
 * WAITER REUSE IS NOT THIS WRAPPER'S JOB. Acquiring serialises the read; it
 * cannot tell a waiter whether the ref hashes it captured before waiting still
 * match the result the previous holder wrote. QCLI-563's cache has landed, and
 * the reuse handshake belongs to the layer that owns it (Q568-INT part B); this
 * wrapper does not re-read anything after acquiring.
 *
 * READ-ONLY IS NOT "CREATES NOTHING". The view may create
 * `<git-common-dir>/quest/` and a transient lock file there while it runs.
 * That is a directory and a file beside the repository's GIT metadata, never a
 * tracker record; the lock file is removed on release, or recovered by the
 * stale backstop. The one-line note on an unlocked path EMBEDS ABSOLUTE PATHS
 * (the lock path, and any errno text from a broken mechanism), so a caller
 * capturing stderr should treat it as machine-local, not a stable message.
 *
 * THE LOCK IS ADVISORY, SO A READ-ONLY LISTING NEVER FAILS BECAUSE OF IT
 * (DEC-282 (a8), recorded under ODOC-610). Two unlocked paths exist, and
 * NEITHER IS SILENT (each writes exactly one line to stderr naming the cause
 * and saying the command ran unlocked; nothing changes on stdout, and the exit
 * code and JSON shape are untouched):
 *
 *  1. A BROKEN LOCK MECHANISM -- the common directory cannot be resolved, or
 *     any acquire error that is not {@link CommonDirLockTimeoutError} (EACCES,
 *     EISDIR, ENOSPC on the lock or its `.break`, an unreadable `.break` that
 *     throws). There is no lock to wait on, so the run PROCEEDS UNLOCKED and
 *     records the swallowed error on {@link AcrossRefsLockedService.lastLockError}.
 *
 *  2. A PATHOLOGICAL-BUT-REACHABLE EXPIRY -- the wait elapsed without acquiring
 *     while holders are still live. It is NOT unreachable behind a normal
 *     holder: waiters POLL and are not FIFO, and this wiring serialises without
 *     waiter reuse, so a QUEUE of live holders can in principle outlast one
 *     waiter's wait. The wait is bounded PER WAITER FROM ITS OWN START, not
 *     against a single holder: it is {@link DEFAULT_ACROSS_REFS_WAIT_TIMEOUT_MS},
 *     derived from the lock's own `staleAfterMs` (10 min) PLUS a margin. The
 *     policy is a single named seam, {@link AcrossRefsLockedOptions.onTimeout};
 *     its DEFAULT proceeds unlocked (a read-only listing never fails because of
 *     the lock).
 */

/** What a `--across-refs` read needs; satisfied by `AcrossRefsViewService`. */
export interface AcrossRefsView {
  view(request: AcrossRefsRequest): Promise<AcrossRefsOutcome>;
}

/**
 * Margin added to the lock's own `staleAfterMs` for the wiring's wait. A
 * normal 60-90 s read releases the lock far sooner. Since DEC-282 (a16) the
 * lock breaks a holder as follows: a DEAD same-host pid after the 30 s floor,
 * a cross-host holder after `staleAfterMs` of SILENCE since its last heartbeat,
 * and a LIVE same-host holder NEVER. So this wait is the ONLY limit on a live
 * same-host holder (the measured cold run takes 619-623 s, under the 660 s
 * bound); the margin keeps a waiter from expiring in the same instant a
 * cross-host silence break is about to fire. Derived from
 * `DEFAULT_STALE_AFTER_MS` in one place so the two cannot drift.
 */
export const ACROSS_REFS_WAIT_MARGIN_MS = 60_000;

/**
 * The wiring's wait: `staleAfterMs + margin` (about 11 minutes with the
 * default 10-minute `staleAfterMs`). It is bounded PER WAITER FROM ITS OWN
 * START; a queue of live holders can in principle outlast it, so expiry is
 * pathological but not unreachable (F5).
 */
export const DEFAULT_ACROSS_REFS_WAIT_TIMEOUT_MS =
  DEFAULT_STALE_AFTER_MS + ACROSS_REFS_WAIT_MARGIN_MS;

/** Acquire seam, injectable so tests can force a failing or timing-out lock. */
export type AcrossRefsLockAcquire = (
  commonDir: string,
  options: CommonDirLockOptions,
) => Promise<CommonDirLockHandle>;

/**
 * What to do when the wait expires with a live holder. `proceedUnlocked` runs
 * the inner view without the lock. The DEFAULT proceeds unlocked and writes
 * the one-line note; supplying this seam is the only way to choose a different
 * policy (e.g. fail closed) at the composition root. A custom policy that
 * proceeds unlocked is responsible for its own note -- the wrapper writes none
 * for it, so it cannot report "ran unlocked" on a policy that instead fails.
 */
export type AcrossRefsTimeoutPolicy = (
  error: CommonDirLockTimeoutError,
  proceedUnlocked: () => Promise<AcrossRefsOutcome>,
) => Promise<AcrossRefsOutcome>;

export interface AcrossRefsLockedOptions {
  /** Wait before the timeout policy runs; defaults to {@link
   * DEFAULT_ACROSS_REFS_WAIT_TIMEOUT_MS}. */
  readonly waitTimeoutMs?: number;
  /** Poll interval while waiting, forwarded to the lock. */
  readonly pollMs?: number;
  /** Acquisition seam; defaults to {@link acquireCommonDirLock}. */
  readonly acquire?: AcrossRefsLockAcquire;
  /** Timeout policy seam; defaults to proceeding unlocked (DEC-282 (a8)). */
  readonly onTimeout?: AcrossRefsTimeoutPolicy;
  /** Single-line stderr writer; defaults to `process.stderr.write`. Injectable
   * so a test can assert exactly one line was written. */
  readonly writeNote?: (line: string) => void;
}

export class AcrossRefsLockedService implements AcrossRefsView {
  private readonly waitTimeoutMs: number;
  private readonly pollMs: number | undefined;
  private readonly acquire: AcrossRefsLockAcquire;
  private readonly onTimeout: AcrossRefsTimeoutPolicy;
  private readonly writeNote: (line: string) => void;
  private swallowedLockError: unknown = null;

  constructor(
    private readonly inner: AcrossRefsView,
    /**
     * Resolves the clone's REALPATH'D common git directory from the repository
     * path the request names (F9). The composition root supplies the workspace
     * port's `inspect(...).commonDirectory`; a resolver that throws is treated
     * as a broken lock mechanism and the run proceeds unlocked.
     */
    private readonly resolveCommonDir: (
      repositoryPath: string,
    ) => Promise<string>,
    options: AcrossRefsLockedOptions = {},
  ) {
    this.waitTimeoutMs =
      options.waitTimeoutMs ?? DEFAULT_ACROSS_REFS_WAIT_TIMEOUT_MS;
    this.pollMs = options.pollMs;
    this.acquire = options.acquire ?? acquireCommonDirLock;
    this.writeNote =
      options.writeNote ?? ((line: string) => process.stderr.write(line));
    this.onTimeout =
      options.onTimeout ??
      (async (error, proceedUnlocked) => {
        // DEC-282 (a8): a read-only listing never fails because of the lock.
        // The lock is advisory; concurrent runs duplicate the ref read and
        // nothing else. Say so once on stderr so the wedge is not silent.
        // Authored across lines for readability; `note()` collapses it to the
        // single line the stderr contract requires (R6).
        this.note(
          `note: task list --across-refs ran unlocked:
timed out after ${Math.round(error.waitedMs)}ms waiting for the
common-directory lock at ${error.lockPath}${error.holder === null ? "" : ` (held by pid ${error.holder.pid})`}.
${error.holder === null ? "Its holder could not be read; if no quest process is running" : "If that pid is not a running quest process"}, remove the lock file ${error.lockPath}
(and ${error.breakPath} only if no breaker is running).`,
        );
        return proceedUnlocked();
      });
  }

  /**
   * The last error that made a run PROCEED UNLOCKED via the BROKEN-MECHANISM
   * path (an unresolvable common directory, or a non-timeout acquire failure).
   * `null` when the run held the lock or never attempted it. Exposed for tests;
   * the note on stderr is the operator-facing record. A timeout does not land
   * here: it is the separate expiry path, reported by its own note.
   */
  get lastLockError(): unknown {
    return this.swallowedLockError;
  }

  async view(request: AcrossRefsRequest): Promise<AcrossRefsOutcome> {
    // R5: reset per invocation so a reused service never reports a previous
    // run's swallowed error.
    this.swallowedLockError = null;
    const proceedUnlocked = () => this.inner.view(request);

    let commonDir: string;
    try {
      commonDir = await this.resolveCommonDir(request.repositoryPath);
    } catch (error) {
      // CANNOT RESOLVE THE COMMON DIRECTORY: there is no lock to wait on.
      this.swallowedLockError = error;
      this.note(brokenMechanismNote(error));
      return proceedUnlocked();
    }

    let lock: CommonDirLockHandle;
    try {
      lock = await this.acquire(commonDir, {
        waitTimeoutMs: this.waitTimeoutMs,
        ...(this.pollMs === undefined ? {} : { pollMs: this.pollMs }),
      });
    } catch (error) {
      if (error instanceof CommonDirLockTimeoutError) {
        // PATHOLOGICAL EXPIRY (DEC-282 (a8)): run unlocked, once, with a note.
        return this.onTimeout(error, proceedUnlocked);
      }
      // BROKEN LOCK MECHANISM (EACCES/EISDIR/ENOSPC on the lock or `.break`,
      // an unreadable `.break`, ...): no lock to wait on.
      this.swallowedLockError = error;
      this.note(brokenMechanismNote(error));
      return proceedUnlocked();
    }

    try {
      return await this.inner.view(request);
    } finally {
      // Release is best-effort: a read-only command must not fail because the
      // lock file could not be cleaned up, and the stale backstop recovers an
      // unreleased lock. Nothing correctness-critical depends on holding it.
      try {
        await lock.release();
      } catch {
        // Left to the age backstop.
      }
    }
  }

  /** Exactly one stderr line, newline-terminated, with no embedded newline. */
  private note(text: string): void {
    this.writeNote(`${oneLine(text)}\n`);
  }
}

/** The broken-mechanism note: names the cause and says the run was unlocked.
 * The `note: ` prefix is deliberate -- opum-cli-e2e's `stderrSilentOnSuccess`
 * check accepts stderr lines that start with warning/note/hint, so a success
 * row that hits a broken lock must not go red. */
function brokenMechanismNote(error: unknown): string {
  const cause = error instanceof Error ? error.message : String(error);
  return `note: task list --across-refs ran unlocked: the common-directory lock is unusable (${oneLine(cause)}).`;
}

/** Collapse a multi-line message to one line for a single stderr write. */
function oneLine(text: string): string {
  return text
    .split(/\r?\n/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(" ");
}
