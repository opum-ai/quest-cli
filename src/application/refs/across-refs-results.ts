import {
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  unlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

import type { AcrossRefsOutcome } from "./across-refs.ts";
import { cacheFailureCause, type CacheIo } from "./across-refs-cache.ts";

/**
 * QCLI-568 Q568-INT (B), DEC-282 (a7) item 1, (a9) item 1, (a13) item 3(a) and
 * QCLI-568 AC2: the WHOLE-RESULT record a `task list --across-refs` run that
 * holds the common-directory lock writes, and that a matching WAITER replays
 * instead of recomputing.
 *
 * WHY THIS IS NOT A CACHE. QCLI-563's read cache answers per REF, keyed by that
 * ref's `.quest` tree hash, and it does so DURING the read. A waiter needs
 * something different: the answer to the question it asked, complete with the
 * population's coverage, so it can return it without re-reading anything at
 * all. That is a whole-result record, and it lives in its own directory
 *
 *     <git-common-dir>/quest/across-refs-results/<request-fingerprint>.json
 *
 * -- NOT under `across-refs-cache/`, whose prune bounds a different budget and
 * whose read rejects every key that is not a tree hash (`KEY_PATTERN`).
 *
 * KEYED BY TWO THINGS. The FILE is named by the normalised REQUEST FINGERPRINT
 * (`acrossRefsRequestFingerprint`, a 64-hex sha256 of every input that changes
 * the answer). The document also carries the PLAN IDENTITY
 * (`acrossRefsPlanIdentity`, the population plus every planned ref's sha and
 * label) and a reader must compare it to the identity it computed ITSELF. A
 * pull-request head can move without its `.quest` tree changing, so a
 * fingerprint alone would let a later run replay states that are no longer
 * true.
 *
 * A REPLAY IS ONLY SAFE FOR A RUN THAT WAS WAITING WHEN THE RECORD WAS MADE.
 * `finishedAt` is compared against the waiter's own wait start by the caller
 * (`AcrossRefsLockedService`); this module only stores and validates. A LATER
 * fresh run therefore never replays a stale result, however well the inputs
 * match: it recomputes, and its recompute replaces the record.
 *
 * FAILURE IS NEVER THE COMMAND'S FAILURE. A read that cannot be parsed, is
 * absent, or names a different plan is a MISS (recompute). A WRITE that fails
 * returns its one-line cause to the caller, which reports it through the same
 * once-per-invocation note path the read cache uses. Nothing here throws out of
 * `read`, `touch` or `prune`.
 *
 * BOUNDED AND ATOMIC. Records are small and kept in a bounded set: a prune
 * keeps the newest {@link DEFAULT_MAX_RESULTS} by mtime, PROTECTING the record
 * this run made or replayed (a replay touches it so it stays the newest). Every
 * write is a unique sibling temp file followed by `rename`, and a stale temp
 * file is removed by the prune.
 */

/** The outcome a reusable invocation returns: a whole view. An `absent` answer
 *  is cheap to rediscover and is never recorded. */
export type AcrossRefsViewOutcome = Extract<
  AcrossRefsOutcome,
  { kind: "view" }
>;

/** One recorded result. `notes` are the exact strings the holder delivered to
 *  its note sink (cache-failure notes), so a replay reproduces stderr too. */
export interface AcrossRefsResultRecord {
  readonly planIdentity: string;
  /** The holder's clock instant at which the record was complete, in epoch ms. */
  readonly finishedAt: number;
  readonly outcome: AcrossRefsViewOutcome;
  readonly notes: readonly string[];
  /** The recording run's own token, for diagnostics and for a reader that wants
   *  to say which run produced a record. */
  readonly holderToken: string;
  /** The identity of the build that wrote the record (version plus a digest of
   *  its code). A reader of a DIFFERENT build misses and recomputes: the build
   *  is an input to the answer (Q568-INT B, Opus round 2). */
  readonly buildId: string;
}

export interface AcrossRefsResultsPort {
  /** The record for `fingerprint`, or null for absent/corrupt/unreadable.
   *  Never rejects. */
  read(fingerprint: string): Promise<AcrossRefsResultRecord | null>;
  /** Store the record atomically. Returns null on success, or the one-line
   *  cause on failure. Never rejects. */
  write(
    fingerprint: string,
    record: AcrossRefsResultRecord,
  ): Promise<string | null>;
  /** Mark the record as used now so the prune keeps it. Never rejects. */
  touch(fingerprint: string): Promise<void>;
  /** Bound the directory: keep every key in `protectedKeys` and the newest
   *  `maxRecords` others, and unlink stale temp files. Never rejects. */
  prune(protectedKeys: ReadonlySet<string>): Promise<void>;
}

/** Bumped when the on-disk record shape changes. */
export const RESULTS_VERSION = 2;

/** How many records a prune keeps (plus any key the current run used). */
export const DEFAULT_MAX_RESULTS = 16;

/** A `.tmp` file older than this is residue from a crashed write. */
export const STALE_RESULT_TMP_MILLISECONDS = 60 * 60 * 1_000;

const RECORD_SUFFIX = ".json";

/** A fingerprint is a sha256 hex digest: the only shape that is safe as a
 *  filename. */
const KEY_PATTERN = /^[0-9a-f]{64}$/u;

/** The one `note: ` line a failure to RECORD reports. Names the cause and says
 *  what the consequence is; a MISS reports nothing. */
export function resultsFailureNote(cause: string): string {
  const detail = cause.trim().split("\n")[0] ?? "";
  const named = detail === "" ? "unknown error" : detail;
  return `note: the across-refs result record is unavailable (${named}); concurrent runs will recompute.`;
}

/** `<git-common-dir>/quest/across-refs-results/`, shared by every worktree of
 *  one clone, beside the advisory lock and the read cache, inside `.git` so it
 *  never dirties a checkout. */
export function acrossRefsResultsDirectory(commonDirectory: string): string {
  return join(commonDirectory, "quest", "across-refs-results");
}

interface ResultDocument {
  readonly kind: "across-refs-result";
  readonly version: number;
  readonly fingerprint: string;
  readonly planIdentity: string;
  readonly finishedAt: number;
  readonly holderToken: string;
  readonly buildId: string;
  readonly notes: readonly string[];
  readonly outcome: AcrossRefsViewOutcome;
}

function parseRecord(
  text: string,
  fingerprint: string,
): AcrossRefsResultRecord | null {
  try {
    const document = JSON.parse(text) as Partial<ResultDocument>;
    if (
      document.kind !== "across-refs-result" ||
      document.version !== RESULTS_VERSION ||
      document.fingerprint !== fingerprint ||
      typeof document.planIdentity !== "string" ||
      typeof document.finishedAt !== "number" ||
      !Number.isFinite(document.finishedAt) ||
      typeof document.holderToken !== "string" ||
      typeof document.buildId !== "string" ||
      !Array.isArray(document.notes) ||
      !document.notes.every((note) => typeof note === "string")
    )
      return null;
    const outcome = document.outcome as
      | Partial<AcrossRefsViewOutcome>
      | undefined;
    if (outcome === undefined || outcome === null) return null;
    if (outcome.kind !== "view" || !Array.isArray(outcome.entries)) return null;
    const coverage = outcome.coverage as
      | Partial<AcrossRefsViewOutcome["coverage"]>
      | undefined;
    if (
      coverage === undefined ||
      coverage === null ||
      typeof coverage.complete !== "boolean" ||
      typeof coverage.population !== "string" ||
      typeof coverage.discoveredAt !== "string" ||
      !Array.isArray(coverage.refsRead) ||
      !Array.isArray(coverage.refsUnreadable)
    )
      return null;
    return {
      planIdentity: document.planIdentity,
      finishedAt: document.finishedAt,
      outcome: outcome as AcrossRefsViewOutcome,
      notes: [...document.notes],
      holderToken: document.holderToken,
      buildId: document.buildId,
    };
  } catch {
    return null;
  }
}

export class AcrossRefsResults implements AcrossRefsResultsPort {
  private readonly io: CacheIo;
  private readonly maxRecords: number;
  private readonly directory: string;

  constructor(
    directory: string,
    options: {
      readonly maxRecords?: number;
      readonly io?: Partial<CacheIo>;
    } = {},
  ) {
    this.io = { ...defaultResultIo, ...options.io };
    this.maxRecords = options.maxRecords ?? DEFAULT_MAX_RESULTS;
    this.directory = directory;
  }

  /** The record store rooted at the clone's shared directory. */
  static underCommonDirectory(
    commonDirectory: string,
    options: {
      readonly maxRecords?: number;
      readonly io?: Partial<CacheIo>;
    } = {},
  ): AcrossRefsResults {
    return new AcrossRefsResults(
      acrossRefsResultsDirectory(commonDirectory),
      options,
    );
  }

  private recordPath(fingerprint: string): string {
    return join(this.directory, `${fingerprint}${RECORD_SUFFIX}`);
  }

  async read(fingerprint: string): Promise<AcrossRefsResultRecord | null> {
    if (!KEY_PATTERN.test(fingerprint)) return null;
    try {
      const text = await this.io.readFile(this.recordPath(fingerprint));
      return parseRecord(text, fingerprint);
    } catch {
      // Absent, unreadable, or mid-write: recompute is always correct.
      return null;
    }
  }

  async write(
    fingerprint: string,
    record: AcrossRefsResultRecord,
  ): Promise<string | null> {
    if (!KEY_PATTERN.test(fingerprint)) return null;
    const document: ResultDocument = {
      kind: "across-refs-result",
      version: RESULTS_VERSION,
      fingerprint,
      planIdentity: record.planIdentity,
      finishedAt: record.finishedAt,
      holderToken: record.holderToken,
      buildId: record.buildId,
      notes: [...record.notes],
      outcome: record.outcome,
    };
    const target = this.recordPath(fingerprint);
    const temporary = `${target}.${process.pid}.${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}.tmp`;
    try {
      await this.io.mkdir(this.directory);
      await this.io.writeFile(temporary, JSON.stringify(document));
      await this.io.rename(temporary, target);
      return null;
    } catch (error) {
      await this.io.unlink(temporary).catch(() => undefined);
      return cacheFailureCause(error);
    }
  }

  async touch(fingerprint: string): Promise<void> {
    if (!KEY_PATTERN.test(fingerprint)) return;
    const now = new Date();
    await this.io
      .utimes(this.recordPath(fingerprint), now, now)
      .catch(() => undefined);
  }

  async prune(protectedKeys: ReadonlySet<string>): Promise<void> {
    const now = Date.now();
    let names: string[];
    try {
      names = await this.io.readdir(this.directory);
    } catch {
      return;
    }
    const present: {
      readonly key: string;
      readonly path: string;
      mtimeMs: number;
    }[] = [];
    for (const name of names) {
      const path = join(this.directory, name);
      if (name.endsWith(".tmp")) {
        await this.unlinkIfStale(path, now);
        continue;
      }
      if (!name.endsWith(RECORD_SUFFIX)) continue;
      const key = name.slice(0, -RECORD_SUFFIX.length);
      if (!KEY_PATTERN.test(key)) continue;
      try {
        const stats = await this.io.stat(path);
        present.push({ key, path, mtimeMs: stats.mtimeMs });
      } catch {
        // A vanishing record is not this store's problem.
      }
    }
    const protectedEntries = present.filter((entry) =>
      protectedKeys.has(entry.key),
    );
    const others = present
      .filter((entry) => !protectedKeys.has(entry.key))
      .sort((a, b) => b.mtimeMs - a.mtimeMs);
    const budget = Math.max(0, this.maxRecords - protectedEntries.length);
    for (const stale of others.slice(budget))
      await this.io.unlink(stale.path).catch(() => undefined);
  }

  private async unlinkIfStale(path: string, now: number): Promise<void> {
    try {
      const stats = await this.io.stat(path);
      if (now - stats.mtimeMs > STALE_RESULT_TMP_MILLISECONDS)
        await this.io.unlink(path).catch(() => undefined);
    } catch {
      // A vanishing temp file is not this store's problem.
    }
  }
}

const defaultResultIo: CacheIo = {
  readFile: (path) => readFile(path, "utf8"),
  writeFile: (path, data) => writeFile(path, data, "utf8"),
  rename: (from, to) => rename(from, to),
  unlink: (path) => unlink(path),
  mkdir: (path) => mkdir(path, { recursive: true }).then(() => undefined),
  readdir: (path) => readdir(path),
  utimes: (path, atime, mtime) => utimes(path, atime, mtime),
  stat: (path) => stat(path),
};
