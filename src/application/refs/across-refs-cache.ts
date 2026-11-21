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

import type { GitPort } from "../../ports/git.ts";

/**
 * QCLI-563: the per-ref read cache behind `quest task list --across-refs`, at
 * `<git-common-dir>/quest/across-refs-cache/`.
 *
 * The live case: a clone with 2,313 tasks and 47 worktrees ran 4-9 concurrent
 * invocations at 60-90 seconds each, load 41 -- every run re-read every ref's
 * whole record set, one `git cat-file` process per record. This module caches
 * each ref's raw record files so an unchanged ref is not re-read.
 *
 * THE KEY IS THE `.quest` TREE HASH. A Git tree is content-addressed, so the
 * key changes exactly when the records change: invalidation is BY CONTENT,
 * never by time, and there is no TTL to go stale. A ref with no `.quest` tree is
 * its own distinct, cacheable state, keyed `root-<root tree hash>` (see
 * {@link acrossRefsRefKey}).
 *
 * WHAT IS CACHED IS RAW MATERIAL: `{ location: [{path, text}] }` for EVERY
 * path `listFilesRequired` returned, exactly as read from Git. The domain work
 * -- the dot-file filter, `JSON.parse`, `taskState` validation and the
 * duplicate-id check -- is re-run on EVERY cache read by the caller, so a cache
 * written by one build can never hand another build a record it would not
 * itself produce. A path this build's filter did not select is stored with
 * `text: null` rather than omitted: a build with a WIDER filter then sees the
 * path, needs its text, and treats the entry as a MISS instead of being
 * silently served a shorter record set. CACHE_VERSION therefore describes only
 * the on-disk DOCUMENT shape, not the domain's record semantics.
 *
 * THE CACHE IS BOUNDED and its mtime means last-used: {@link AcrossRefsCache.prune}
 * runs ONCE at the end of a view, keeps the keys that view used regardless of
 * age, and trims the rest to the newest {@link DEFAULT_MAX_ENTRIES}; a cache hit
 * touches the entry, so mtime tracks last use. Pruning once (not per write)
 * keeps a run that touches more than the bound from evicting its own entries.
 * It also unlinks `.tmp` files older than an hour, leftover from a crashed write.
 *
 * AN UNREADABLE REF IS NEVER CACHED AS EMPTY: only a read that SUCCEEDED reaches
 * the write, so a transient failure is re-read next time rather than served.
 *
 * A cache is an optimization and must never turn a successful read into a
 * failure. Every read and write swallows its own I/O errors: a missing,
 * unreadable, corrupt or unwritable entry falls back to the normal read. Writes
 * are atomic (a unique sibling temp file, then `rename`), and a temp file left
 * by a failed write is unlinked.
 */

/** One file under a task location. `text` is the raw Git content for a path the
 *  writing build selected, and NULL for a path it did not read: a reader with a
 *  wider filter sees the null and treats the entry as a miss (never a shorter
 *  record set). Parsing and validation happen on every read, not here. */
export interface AcrossRefsCachedFile {
  readonly path: string;
  readonly text: string | null;
}

/** The raw material of one ref, grouped by the task location it was found in.
 *  The location name carries the archive flag (`archive/tasks`), so `archived`
 *  is derived on materialization rather than stored. */
export type AcrossRefsCachedLocations = Readonly<
  Record<string, readonly AcrossRefsCachedFile[]>
>;

/**
 * The cache seam, so a test can prove a second call reads nothing without a
 * filesystem. Production uses {@link AcrossRefsCache}.
 */
export interface AcrossRefsCachePort {
  /** The raw material stored for `key`, or null on a miss OR any unreadable or
   *  malformed entry -- the two are deliberately the same answer. */
  read(key: string): Promise<AcrossRefsCachedLocations | null>;
  /** Store `locations` under `key`. Never rejects. */
  write(key: string, locations: AcrossRefsCachedLocations): Promise<void>;
  /** Mark `key` as used now, so pruning keeps it. Never rejects. */
  touch(key: string): Promise<void>;
  /** Bound the directory once, at the end of a view: keep every key in
   *  `protectedKeys` regardless of age, trim the rest to the newest entries, and
   *  unlink stale temp files. Never rejects. */
  prune(protectedKeys: ReadonlySet<string>): Promise<void>;
}

/**
 * The filesystem operations the cache performs, injectable so tests can drive
 * pruning, touching and a failed write deterministically. Production uses
 * `node:fs/promises`.
 */
export interface CacheIo {
  readFile(path: string): Promise<string>;
  writeFile(path: string, data: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  unlink(path: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  utimes(path: string, atime: Date, mtime: Date): Promise<void>;
  stat(path: string): Promise<{ readonly mtimeMs: number }>;
}

const defaultIo: CacheIo = {
  readFile: (path) => readFile(path, "utf8"),
  writeFile: (path, data) => writeFile(path, data, "utf8"),
  rename: (from, to) => rename(from, to),
  unlink: (path) => unlink(path),
  mkdir: (path) => mkdir(path, { recursive: true }).then(() => undefined),
  readdir: (path) => readdir(path),
  utimes: (path, atime, mtime) => utimes(path, atime, mtime),
  stat: (path) => stat(path),
};

/**
 * Bumped when the SHAPE of a cached document changes. It deliberately says
 * nothing about record parsing: the raw text is re-parsed and re-validated on
 * every read, so a change to the record schema or to `taskState` needs no bump.
 */
const CACHE_VERSION = 1;

/** How many entries a prune keeps (plus any key the current view used). */
export const DEFAULT_MAX_ENTRIES = 64;

/** A `.tmp` file older than this is residue from a crashed write, not a write in
 *  flight, and prune unlinks it. */
export const STALE_TMP_MILLISECONDS = 60 * 60 * 1_000;

const FILE_SUFFIX = ".json";

const SHA_PATTERN = /^[0-9a-f]{40}$/u;

/** A ref key is either a `.quest` tree hash, or `root-<root-tree-hash>` for a
 *  ref with no `.quest` tree (see {@link acrossRefsRefKey}). Both are fixed
 *  shapes, so a key is always safe as a filename. */
const KEY_PATTERN = /^(?:[0-9a-f]{40}|root-[0-9a-f]{40})$/u;

/**
 * QCLI-563 / S5: the one `note: `-prefixed stderr line a cache FAILURE reports.
 * It names the cause and says the read ran uncached, so a broken cache cannot
 * quietly remove the fix it is meant to provide. Callers route it through their
 * own sink; this module never writes to a stream itself. A mere cache MISS
 * (absent or corrupt entry) is normal operation and reports nothing.
 */
export function cacheFailureNote(cause: string): string {
  const detail = cause.trim().split("\n")[0] ?? "";
  const named = detail === "" ? "unknown error" : detail;
  return `note: the across-refs read cache is unavailable (${named}); the read ran uncached.`;
}

/** A one-line cause for a thrown filesystem error: its `code` (EACCES, ENOSPC,
 *  …) when present, then its first message line. */
export function cacheFailureCause(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  const message =
    error instanceof Error ? error.message : String(error ?? "unknown error");
  const first = message.split("\n")[0]?.trim() ?? "";
  if (typeof code === "string" && code !== "" && !first.includes(code))
    return `${code}: ${first}`.trim();
  return first;
}

function isMissing(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === "ENOENT";
}

/** The on-disk document. `key` is repeated so a file that was moved or misnamed
 *  is recognised as not answering the key it was read under. */
interface RecordDocument {
  readonly kind: "records";
  readonly version: number;
  readonly key: string;
  readonly locations: AcrossRefsCachedLocations;
}

/** `<git-common-dir>/quest/across-refs-cache/`. Under the common dir, because
 *  every worktree of one clone shares it, so worktrees do not each pay for the
 *  same reads. Beside QCLI-568's advisory lock
 *  (`<git-common-dir>/quest/across-refs.lock`). Inside `.git`, so it never
 *  dirties a checkout or becomes a path anyone might commit. */
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
 * `undefined` means no key could be derived; the caller reads and does not cache
 * that ref.
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

/** Read and validate the `locations` payload. Returns null for anything that is
 *  not the expected shape, which the caller treats as a miss. */
function locationsOf(value: unknown): AcrossRefsCachedLocations | null {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;
  const locations: Record<string, readonly AcrossRefsCachedFile[]> = {};
  for (const [location, files] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!Array.isArray(files)) return null;
    const clean: AcrossRefsCachedFile[] = [];
    for (const file of files) {
      if (typeof file !== "object" || file === null) return null;
      const { path, text } = file as { path?: unknown; text?: unknown };
      // `text: null` is a path the writing build did not read; the caller
      // decides whether that is a miss, so it is part of the valid shape.
      if (typeof path !== "string") return null;
      if (text !== null && typeof text !== "string") return null;
      clean.push({ path, text });
    }
    locations[location] = clean;
  }
  return locations;
}

export class AcrossRefsCache implements AcrossRefsCachePort {
  private readonly io: CacheIo;
  private readonly maxEntries: number;
  /** S5: failure sink (a `note: ` line), and the once-per-instance guard. */
  private readonly onFailure: ((line: string) => void) | undefined;
  private failureNoted = false;

  constructor(
    private readonly directory: string,
    options: {
      readonly maxEntries?: number;
      readonly io?: Partial<CacheIo>;
      readonly onFailure?: (line: string) => void;
    } = {},
  ) {
    this.io = { ...defaultIo, ...options.io };
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.onFailure = options.onFailure;
  }

  /** Report a FAILURE at most once per instance (once per process in the CLI's
   *  one-view-per-invocation path). A miss never reaches here. */
  private fail(cause: string): void {
    if (this.failureNoted) return;
    this.failureNoted = true;
    this.onFailure?.(cacheFailureNote(cause));
  }

  /** The per-ref cache rooted at the clone's shared directory. */
  static underCommonDirectory(
    commonDirectory: string,
    options: {
      readonly maxEntries?: number;
      readonly io?: Partial<CacheIo>;
      readonly onFailure?: (line: string) => void;
    } = {},
  ): AcrossRefsCache {
    return new AcrossRefsCache(
      acrossRefsCacheDirectory(commonDirectory),
      options,
    );
  }

  async read(key: string): Promise<AcrossRefsCachedLocations | null> {
    // A key that is not one of the two fixed shapes is never one this cache
    // wrote; using it as a filename would be a path-traversal hole, so it is a
    // miss.
    if (!KEY_PATTERN.test(key)) return null;
    let text: string;
    try {
      text = await this.io.readFile(recordPath(this.directory, key));
    } catch (error) {
      // A missing entry (ENOENT) is an ordinary miss; any other read error is a
      // cache FAILURE worth one line. A corrupt document below is a miss too.
      if (!isMissing(error)) this.fail(cacheFailureCause(error));
      return null;
    }
    try {
      const document = JSON.parse(text) as Partial<RecordDocument>;
      if (
        document.kind !== "records" ||
        document.version !== CACHE_VERSION ||
        document.key !== key
      )
        return null;
      return locationsOf(document.locations);
    } catch {
      return null;
    }
  }

  async write(
    key: string,
    locations: AcrossRefsCachedLocations,
  ): Promise<void> {
    if (!KEY_PATTERN.test(key)) return;
    const document: RecordDocument = {
      kind: "records",
      version: CACHE_VERSION,
      key,
      locations,
    };
    const cause = await this.writeJsonAtomically(
      recordPath(this.directory, key),
      document,
    );
    if (cause !== null) this.fail(cause);
  }

  async touch(key: string): Promise<void> {
    if (!KEY_PATTERN.test(key)) return;
    const now = new Date();
    await this.io
      .utimes(recordPath(this.directory, key), now, now)
      .catch(() => undefined);
  }

  /**
   * R2-8: bound the directory ONCE, at the end of a view. Pruning per write
   * thrashes when one run uses more than `maxEntries` distinct keys: every new
   * write would evict one of the same run's earlier entries. So the keys this
   * view used are PROTECTED (never evicted however many there are), and the
   * remaining budget -- `maxEntries` minus the protected count -- goes to the
   * newest unprotected entries. The effective bound is therefore at least
   * `maxEntries` and at least the size of the run.
   *
   * R2-9: a `.tmp` file older than {@link STALE_TMP_MILLISECONDS} is residue
   * from a crashed write and is unlinked here too.
   */
  async prune(protectedKeys: ReadonlySet<string>): Promise<void> {
    let names: string[];
    try {
      names = await this.io.readdir(this.directory);
    } catch {
      return;
    }
    const now = Date.now();
    const entries: { readonly path: string; readonly mtimeMs: number }[] = [];
    for (const name of names) {
      const path = join(this.directory, name);
      if (name.endsWith(".tmp")) {
        try {
          const stats = await this.io.stat(path);
          if (now - stats.mtimeMs > STALE_TMP_MILLISECONDS)
            await this.io.unlink(path).catch(() => undefined);
        } catch {
          // A vanishing temp file is not this cache's problem.
        }
        continue;
      }
      if (!name.endsWith(FILE_SUFFIX)) continue;
      const key = name.slice(0, -FILE_SUFFIX.length);
      if (protectedKeys.has(key)) continue;
      try {
        const stats = await this.io.stat(path);
        entries.push({ path, mtimeMs: stats.mtimeMs });
      } catch {
        // A vanishing entry is not this cache's problem.
      }
    }
    const budget = Math.max(0, this.maxEntries - protectedKeys.size);
    if (entries.length <= budget) return;
    entries.sort((a, b) => b.mtimeMs - a.mtimeMs);
    for (const stale of entries.slice(budget))
      await this.io.unlink(stale.path).catch(() => undefined);
  }

  /** Write atomically. Returns null on success, or the one-line cause on
   *  failure, after unlinking whatever temp file the failed write left behind. */
  private async writeJsonAtomically(
    target: string,
    value: unknown,
  ): Promise<string | null> {
    const temporary = `${target}.${process.pid}.${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}.tmp`;
    try {
      await this.io.mkdir(this.directory);
      await this.io.writeFile(temporary, JSON.stringify(value));
      await this.io.rename(temporary, target);
      return null;
    } catch (error) {
      await this.io.unlink(temporary).catch(() => undefined);
      return cacheFailureCause(error);
    }
  }
}
