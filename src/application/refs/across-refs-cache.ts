import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { type TaskState, taskState } from "../../domain/tasks/tasks.ts";
import type { GitPort } from "../../ports/git.ts";
import type { AcrossRefsCoverage, AcrossRefsEntry } from "./across-refs.ts";

/**
 * QCLI-563: the cache behind `quest task list --across-refs`, at
 * `<git-common-dir>/quest/across-refs-cache/`.
 *
 * The live case: a clone with 2,313 tasks and 47 worktrees ran 4-9 concurrent
 * invocations at 60-90 seconds each, load 41 -- every run re-read every ref's
 * whole record set, one `git cat-file` process per record. This module fixes
 * that with TWO layers, both under one directory:
 *
 *   1. A PER-REF RECORD CACHE, keyed by that ref's `.quest` TREE HASH
 *      (`git rev-parse <sha>:.quest`). A Git tree is content-addressed, so the
 *      key changes exactly when the records change: invalidation is BY CONTENT,
 *      never by time, and there is no TTL to go stale. This is the layer that
 *      makes "a changed ref re-reads only that ref" true -- unchanged refs are
 *      served from their tree, changed ones re-read.
 *
 *   2. A WHOLE-RESULT CACHE ({@link readAcrossRefsCache} /
 *      {@link writeAcrossRefsCache}), keyed by the planned ref set's name -> key
 *      map. On a full hit the command returns the prior result without reading
 *      any ref at all. It is the seam a wrapper (QCLI-568's advisory lock) will
 *      use: acquire lock, read this, otherwise compute and write this, release.
 *
 * A cache is an optimization and must never turn a successful read into a
 * failure. Every read and write below swallows its own I/O errors: a missing,
 * unreadable, corrupt or unwritable entry falls back to the normal read. Writes
 * are atomic (`writeFile` to a sibling temp path, then `rename`), so a
 * concurrent reader never observes a half-written file, and temp names are
 * unique so concurrent writers do not clobber each other.
 *
 * AN UNREADABLE REF IS NEVER CACHED AS EMPTY. The per-ref layer caches only a
 * read that SUCCEEDED (an unreadable ref returns before the write), and the
 * whole-result writer refuses a result whose `coverage.refsUnreadable` is
 * non-empty. A ref with NO `.quest` tree is a different, cacheable state: its
 * key is derived from its ROOT tree (`root-<sha>`, see {@link acrossRefsRefKey}),
 * so the empty record set is cached without ever being confused with an
 * unreadable ref or with a `.quest` tree that actually holds records.
 *
 * `records` is the only per-ref payload. Ref provenance (the ref name, its
 * `owner/repo#N` label and the commit sha) is supplied fresh from the planned
 * ref on every call, so one `.quest` tree shared by several refs -- the common
 * case, since most branches do not touch `.quest` -- is stored once and still
 * answers each ref with its own provenance.
 */

/** One task record as the view parsed it: the task, plus whether it was found
 *  in the archive location (which `--include-archived` decides over). */
export interface AcrossRefsCachedRecord {
  readonly task: TaskState;
  readonly archived: boolean;
}

/** The result a `task list --across-refs` run returns: the same entries and
 *  coverage the command emits, unchanged. */
export interface AcrossRefsCacheResult {
  readonly entries: readonly AcrossRefsEntry[];
  readonly coverage: AcrossRefsCoverage;
}

/** The per-ref payload as it lands on disk. */
interface RecordDocument {
  readonly kind: "records";
  readonly version: number;
  readonly key: string;
  readonly records: readonly AcrossRefsCachedRecord[];
}

/** The whole-result payload as it lands on disk. `key` repeats the derived key
 *  so a file that was moved or misnamed is recognised as not answering it. */
interface ResultDocument {
  readonly kind: "result";
  readonly version: number;
  readonly key: string;
  readonly result: AcrossRefsCacheResult;
}

/**
 * The per-ref cache seam, so a test can prove a second call reads nothing
 * without a filesystem. Production uses {@link AcrossRefsCache}.
 */
export interface AcrossRefsCachePort {
  /** The records stored for `key`, or null on a miss OR any unreadable or
   *  corrupt entry -- the two are deliberately the same answer. */
  read(key: string): Promise<readonly AcrossRefsCachedRecord[] | null>;
  /** Store `records` under `key`. Never rejects. */
  write(key: string, records: readonly AcrossRefsCachedRecord[]): Promise<void>;
}

/**
 * Bumped when the SHAPE of a cached document changes (or when record parsing
 * changes in a way that makes an old parse wrong): an entry written by a
 * different version is ignored and re-read rather than trusted.
 */
const CACHE_VERSION = 1;

const FILE_SUFFIX = ".json";

const SHA_PATTERN = /^[0-9a-f]{40}$/u;

/** A ref key is either a `.quest` tree hash, or `root-<root-tree-hash>` for a
 *  ref with no `.quest` tree (see {@link acrossRefsRefKey}). Both are fixed
 *  shapes, so a key is always safe as a filename. */
const KEY_PATTERN = /^(?:[0-9a-f]{40}|root-[0-9a-f]{40})$/u;

/** `<git-common-dir>/quest/across-refs-cache/`. Under the common dir, because
 *  every worktree of one clone shares it, so worktrees do not each pay for the
 *  same reads. Beside the id allocator's `quest/` files, so QCLI-568's advisory
 *  lock (`<git-common-dir>/quest/across-refs.lock`) can sit with them. Inside
 *  `.git`, so it never dirties a checkout or becomes a path anyone might
 *  commit. */
export function acrossRefsCacheDirectory(commonDirectory: string): string {
  return join(commonDirectory, "quest", "across-refs-cache");
}

/**
 * The per-ref cache key for a commit. The `.quest` tree hash when that tree
 * exists; otherwise `root-<root tree hash>`, which is content-addressed by the
 * WHOLE commit tree -- so a ref with no `.quest` tree is its own distinct,
 * cacheable state, and a `.quest` that could not be resolved to a hash for any
 * reason still cannot be handed another ref's records (the same root tree means
 * the same `.quest` content, by construction).
 *
 * Exported so a QCLI-568 wrapper can build the `refHashes` map the
 * whole-result functions take from the SAME rule the command uses.
 * `undefined` means no key could be derived; the caller reads and does not
 * cache that ref.
 */
export async function acrossRefsRefKey(
  git: GitPort,
  repositoryPath: string,
  sha: string,
): Promise<string | undefined> {
  try {
    const quest = await git.treeHash(repositoryPath, sha, ".quest");
    if (SHA_PATTERN.test(quest)) return quest;
  } catch {
    // `.quest` may genuinely be absent at this commit; fall back to the root
    // tree, which content-addresses the whole snapshot either way.
  }
  try {
    const root = await git.readRevision(repositoryPath, `${sha}^{tree}`);
    if (SHA_PATTERN.test(root)) return `root-${root}`;
  } catch {
    // A damaged commit/tree: no key, so the ref is read and (if readable) not
    // cached; if unreadable, it is never cached at all.
  }
  return undefined;
}

function recordPath(directory: string, key: string): string {
  return join(directory, `${key}${FILE_SUFFIX}`);
}

async function readJson(path: string): Promise<unknown | null> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Write `value` to `path` atomically: a unique sibling temp file, then rename.
 *  Swallows every error -- a cache that cannot be written is not a failure. */
async function writeJsonAtomically(
  directory: string,
  path: string,
  value: unknown,
): Promise<void> {
  const temporary = `${path}.${process.pid}.${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    await mkdir(directory, { recursive: true });
    await writeFile(temporary, JSON.stringify(value), "utf8");
    await rename(temporary, path);
  } catch {
    // The cache is an optimization: an unwritable directory or file must never
    // fail the read that produced the value.
  }
}

export class AcrossRefsCache implements AcrossRefsCachePort {
  constructor(private readonly directory: string) {}

  /** The per-ref cache rooted at the clone's shared directory. */
  static underCommonDirectory(commonDirectory: string): AcrossRefsCache {
    return new AcrossRefsCache(acrossRefsCacheDirectory(commonDirectory));
  }

  async read(key: string): Promise<readonly AcrossRefsCachedRecord[] | null> {
    // A key that is not one of the two fixed shapes is never one this cache
    // wrote; using it as a filename would be a path-traversal hole, so it is a
    // miss.
    if (!KEY_PATTERN.test(key)) return null;
    const parsed = await readJson(recordPath(this.directory, key));
    if (parsed === null) return null;
    try {
      const document = parsed as Partial<RecordDocument>;
      if (
        document.kind !== "records" ||
        document.version !== CACHE_VERSION ||
        document.key !== key ||
        !Array.isArray(document.records)
      )
        return null;
      const records: AcrossRefsCachedRecord[] = [];
      for (const candidate of document.records) {
        if (
          typeof candidate !== "object" ||
          candidate === null ||
          typeof (candidate as AcrossRefsCachedRecord).archived !== "boolean"
        )
          return null;
        // Re-validate through the same domain constructor a fresh read uses: a
        // file that parses but no longer holds a task record is corrupt, and
        // the caller must get a normal read rather than a fabricated one.
        records.push({
          task: taskState((candidate as AcrossRefsCachedRecord).task),
          archived: (candidate as AcrossRefsCachedRecord).archived,
        });
      }
      return records;
    } catch {
      return null;
    }
  }

  async write(
    key: string,
    records: readonly AcrossRefsCachedRecord[],
  ): Promise<void> {
    if (!KEY_PATTERN.test(key)) return;
    const document: RecordDocument = {
      kind: "records",
      version: CACHE_VERSION,
      key,
      records,
    };
    await writeJsonAtomically(
      this.directory,
      recordPath(this.directory, key),
      document,
    );
  }
}

/** The canonical string a whole result is keyed by: every planned ref paired
 *  with its per-ref key ({@link acrossRefsRefKey}), sorted by ref so iteration
 *  order cannot change the key. */
function resultKey(refHashes: ReadonlyMap<string, string>): string {
  const canonical = [...refHashes.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([ref, hash]) => `${ref}\u0000${hash}`)
    .join("\u0001");
  return createHash("sha256").update(canonical).digest("hex");
}

function resultPath(commonDirectory: string, key: string): string {
  return join(
    acrossRefsCacheDirectory(commonDirectory),
    `result-${key}${FILE_SUFFIX}`,
  );
}

/**
 * The whole-result cache read (QCLI-568 seam). `refHashes` maps each planned
 * ref's NAME to its per-ref key ({@link acrossRefsRefKey}: a `.quest` tree hash,
 * or `root-<sha>` for a ref with no `.quest` tree). A hit returns the exact
 * result a fresh run produced for that ref set; a miss, an unreadable file, or a
 * corrupt document all return null so the caller computes normally.
 *
 * CAVEAT for the wrapper that adopts this: the key is the REF SET only. The
 * cached result is the view for the request (filter, `--allow-partial`) that
 * produced it, so a caller with a different request must not reuse it -- either
 * fold a request fingerprint into `refHashes` (a reserved pseudo-entry) or add
 * a scope argument when wiring the lock. Do not assume two requests over the
 * same refs want the same filtered entries.
 */
export async function readAcrossRefsCache(
  commonDirectory: string,
  refHashes: ReadonlyMap<string, string>,
): Promise<AcrossRefsCacheResult | null> {
  const key = resultKey(refHashes);
  const parsed = await readJson(resultPath(commonDirectory, key));
  if (parsed === null) return null;
  try {
    const document = parsed as Partial<ResultDocument>;
    if (
      document.kind !== "result" ||
      document.version !== CACHE_VERSION ||
      document.key !== key ||
      typeof document.result !== "object" ||
      document.result === null ||
      !Array.isArray(document.result.entries) ||
      typeof document.result.coverage !== "object" ||
      document.result.coverage === null
    )
      return null;
    return document.result;
  } catch {
    return null;
  }
}

/**
 * The whole-result cache write (QCLI-568 seam). Never rejects.
 *
 * REFUSES to cache a result that names an unreadable ref (the coverage rule
 * this command exists for) or a read of ZERO refs (indistinguishable from a
 * wrong repository), so a transient failure is never served as a settled
 * answer. The stored `coverage.discoveredAt` is the instant the producing run
 * read the population; a reuse therefore reports that instant, not the reuse's
 * own -- the wrapper owns any re-stamping.
 */
export async function writeAcrossRefsCache(
  commonDirectory: string,
  refHashes: ReadonlyMap<string, string>,
  result: AcrossRefsCacheResult,
): Promise<void> {
  if (refHashes.size === 0) return;
  if (result.coverage.refsUnreadable.length > 0) return;
  const document: ResultDocument = {
    kind: "result",
    version: CACHE_VERSION,
    key: resultKey(refHashes),
    result,
  };
  await writeJsonAtomically(
    acrossRefsCacheDirectory(commonDirectory),
    resultPath(commonDirectory, document.key),
    document,
  );
}
