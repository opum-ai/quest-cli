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
 * WHAT IS CACHED IS RAW MATERIAL: `{ location: [{path, text}] }` -- the text of
 * each record-candidate file, exactly as read from Git. The domain work -- the
 * dot-file filter, `JSON.parse`, `taskState` validation and the duplicate-id
 * check -- is re-run on EVERY cache read by the caller, so a cache written by one
 * build can never hand another build a record it would not itself produce.
 * CACHE_VERSION therefore describes only the on-disk DOCUMENT shape, not the
 * domain's record semantics.
 *
 * THE CACHE IS BOUNDED and its mtime means last-used: a successful write prunes
 * the directory to the newest {@link DEFAULT_MAX_ENTRIES} entries by mtime, and
 * a cache hit touches the entry, so a frequently-read tree is not evicted in
 * favour of a one-off one.
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

/** One record-candidate file as it was read from Git: its path and its raw
 *  text. Parsing and validation happen on every read, not here. */
export interface AcrossRefsCachedFile {
  readonly path: string;
  readonly text: string;
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
  /** Store `locations` under `key`, then prune to the newest entries. Never
   *  rejects. */
  write(key: string, locations: AcrossRefsCachedLocations): Promise<void>;
  /** Mark `key` as used now, so pruning keeps it. Never rejects. */
  touch(key: string): Promise<void>;
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

/** How many entries a write keeps. */
export const DEFAULT_MAX_ENTRIES = 64;

const FILE_SUFFIX = ".json";

const SHA_PATTERN = /^[0-9a-f]{40}$/u;

/** A ref key is either a `.quest` tree hash, or `root-<root-tree-hash>` for a
 *  ref with no `.quest` tree (see {@link acrossRefsRefKey}). Both are fixed
 *  shapes, so a key is always safe as a filename. */
const KEY_PATTERN = /^(?:[0-9a-f]{40}|root-[0-9a-f]{40})$/u;

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
      if (typeof path !== "string" || typeof text !== "string") return null;
      clean.push({ path, text });
    }
    locations[location] = clean;
  }
  return locations;
}

export class AcrossRefsCache implements AcrossRefsCachePort {
  private readonly io: CacheIo;
  private readonly maxEntries: number;

  constructor(
    private readonly directory: string,
    options: {
      readonly maxEntries?: number;
      readonly io?: Partial<CacheIo>;
    } = {},
  ) {
    this.io = { ...defaultIo, ...options.io };
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  }

  /** The per-ref cache rooted at the clone's shared directory. */
  static underCommonDirectory(commonDirectory: string): AcrossRefsCache {
    return new AcrossRefsCache(acrossRefsCacheDirectory(commonDirectory));
  }

  async read(key: string): Promise<AcrossRefsCachedLocations | null> {
    // A key that is not one of the two fixed shapes is never one this cache
    // wrote; using it as a filename would be a path-traversal hole, so it is a
    // miss.
    if (!KEY_PATTERN.test(key)) return null;
    let text: string;
    try {
      text = await this.io.readFile(recordPath(this.directory, key));
    } catch {
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
    const written = await this.writeJsonAtomically(
      recordPath(this.directory, key),
      document,
    );
    if (written) await this.prune();
  }

  async touch(key: string): Promise<void> {
    if (!KEY_PATTERN.test(key)) return;
    const now = new Date();
    await this.io
      .utimes(recordPath(this.directory, key), now, now)
      .catch(() => undefined);
  }

  /** Keep only the newest `maxEntries` record documents by mtime. Temp files
   *  (any suffix other than `.json`) are not entries and are left alone. */
  private async prune(): Promise<void> {
    let names: string[];
    try {
      names = await this.io.readdir(this.directory);
    } catch {
      return;
    }
    const entries: { readonly path: string; readonly mtimeMs: number }[] = [];
    for (const name of names) {
      if (!name.endsWith(FILE_SUFFIX)) continue;
      const path = join(this.directory, name);
      try {
        const stats = await this.io.stat(path);
        entries.push({ path, mtimeMs: stats.mtimeMs });
      } catch {
        // A vanishing entry is not this cache's problem.
      }
    }
    if (entries.length <= this.maxEntries) return;
    entries.sort((a, b) => b.mtimeMs - a.mtimeMs);
    for (const stale of entries.slice(this.maxEntries))
      await this.io.unlink(stale.path).catch(() => undefined);
  }

  /** Write atomically. Returns false (and reports nothing) on failure, after
   *  unlinking whatever temp file the failed write may have left behind. */
  private async writeJsonAtomically(
    target: string,
    value: unknown,
  ): Promise<boolean> {
    const temporary = `${target}.${process.pid}.${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}.tmp`;
    try {
      await this.io.mkdir(this.directory);
      await this.io.writeFile(temporary, JSON.stringify(value));
      await this.io.rename(temporary, target);
      return true;
    } catch {
      await this.io.unlink(temporary).catch(() => undefined);
      return false;
    }
  }
}
