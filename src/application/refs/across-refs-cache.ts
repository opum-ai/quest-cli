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
import { CONTINUITY_TASK_LOCATIONS } from "../checks/continuity.ts";

/**
 * QCLI-563 (DEC-282 (a13), option A): the two-level, content-addressed cache
 * behind `quest task list --across-refs`, at
 * `<git-common-dir>/quest/across-refs-cache/`.
 *
 * The live case: a clone with 2,313 tasks and 47 worktrees ran 4-9 concurrent
 * invocations at 60-90 seconds each, load 41 -- every run re-read every ref's
 * whole record set, one `git cat-file` process per record. The FIRST run on a
 * clone is still that slow; later runs answer from this cache.
 *
 * LAYOUT, two levels:
 *   - `manifests/<tree-key>.json` -- one manifest per `.quest` TREE. It lists
 *     every path `listFilesRequired` returned as `{location, path, blob}`: `blob`
 *     is the Git blob oid for a path this build read, and `null` for a path it
 *     did not (the same marker the raw layout used as `text: null`).
 *   - `blobs/<blob-oid>` -- the raw text of one blob, stored ONCE however many
 *     trees contain that path. A manifest references it by oid.
 * The tree key is the ref's `.quest` tree hash (or `root-<root tree hash>` when
 * there is no `.quest` tree); a Git tree is content-addressed, so invalidation
 * is BY CONTENT, never by time.
 *
 * PRUNE AND GC run ONCE at the end of a view: manifests are trimmed to the newest
 * {@link DEFAULT_MAX_ENTRIES} by last use, PROTECTING every key this run used
 * (however many), and blob files referenced by no surviving manifest are
 * deleted. A hit touches its manifest (mtime = last-used). If a surviving
 * manifest cannot be read, blob GC is skipped for that prune rather than risk
 * deleting a blob it still references. Stale `.tmp` files are removed too.
 *
 * READS re-run the dot-file filter, `JSON.parse`, `taskState` and the
 * duplicate-id check in the caller (`materialize`) on the raw text, so a cache
 * written by one build can never hand another build a record it would not
 * itself produce. CACHE_VERSION describes only the on-disk document shape.
 * A corrupt manifest, a missing blob, or text the caller cannot materialize is a
 * MISS that repairs itself on the next successful read; an UNREADABLE ref is
 * never cached as empty.
 *
 * FAILURES (S5) report through an injected `note: ` sink at most once per
 * process: a read I/O error, an unwritable directory or ENOSPC on write, or an
 * unreadable common dir. A MISS (absent, corrupt) writes nothing.
 *
 * A cache is an optimization and must never turn a successful read into a
 * failure. Writes are atomic (unique sibling temp file, then `rename`); a temp
 * file left by a failed write is unlinked; a blob already present is not
 * rewritten unless a repair is requested.
 */

/** One file under a task location as the caller materializes it: `text` is the
 *  raw Git content, or null for a path this build did not read. */
export interface AcrossRefsCachedFile {
  readonly path: string;
  readonly text: string | null;
}

/** The materialized read result, grouped by task location. */
export type AcrossRefsCachedLocations = Readonly<
  Record<string, readonly AcrossRefsCachedFile[]>
>;

/** One manifest row: a path, its location, and the blob oid (null = unread). */
export interface AcrossRefsManifestEntry {
  readonly location: string;
  readonly path: string;
  readonly blob: string | null;
}

/** What the caller hands {@link AcrossRefsCachePort.write}: the manifest rows,
 *  the set of locations the read covered, and the blob texts to store. */
export interface AcrossRefsWritePayload {
  readonly locations: readonly string[];
  readonly entries: readonly AcrossRefsManifestEntry[];
  readonly blobs: ReadonlyMap<string, string>;
}

/** A cache read: a hit with materializable raw text, an ordinary MISS (absent),
 *  or a CORRUPT entry (bad manifest, missing blob) that the caller repairs by
 *  reading fresh and rewriting. */
export type AcrossRefsCacheRead =
  | { readonly kind: "hit"; readonly locations: AcrossRefsCachedLocations }
  | { readonly kind: "miss" }
  | { readonly kind: "corrupt" };

export interface AcrossRefsCachePort {
  read(key: string): Promise<AcrossRefsCacheRead>;
  /** Store `payload` under `key`. `rewriteBlobs` forces existing blob files to be
   *  replaced (a repair); otherwise one already present is left alone. Never
   *  rejects. */
  write(
    key: string,
    payload: AcrossRefsWritePayload,
    options?: { readonly rewriteBlobs?: boolean },
  ): Promise<void>;
  /** Mark `key` as used now, so pruning keeps it. Never rejects. */
  touch(key: string): Promise<void>;
  /** Bound the directory once, at the end of a view: keep every key in
   *  `protectedKeys`, trim the rest to the newest entries, GC unreferenced
   *  blobs, and unlink stale temp files. Never rejects. */
  prune(protectedKeys: ReadonlySet<string>): Promise<void>;
}

/**
 * The filesystem operations the cache performs, injectable so tests can drive
 * pruning, GC, touching and a failed write deterministically. Production uses
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
 * every read.
 */
const CACHE_VERSION = 2;

/** How many manifests a prune keeps (plus any key the current view used). */
export const DEFAULT_MAX_ENTRIES = 64;

/** A `.tmp` file older than this is residue from a crashed write. */
export const STALE_TMP_MILLISECONDS = 60 * 60 * 1_000;

const MANIFESTS_DIRECTORY = "manifests";
const BLOBS_DIRECTORY = "blobs";
const MANIFEST_SUFFIX = ".json";

const SHA_PATTERN = /^[0-9a-f]{40}$/u;

/** A ref key is either a `.quest` tree hash, or `root-<root-tree-hash>` for a
 *  ref with no `.quest` tree. Both are fixed shapes, so a key is always safe as
 *  a filename. */
const KEY_PATTERN = /^(?:[0-9a-f]{40}|root-[0-9a-f]{40})$/u;

/** The one `note: ` line a cache FAILURE reports. Names the cause and that the
 *  read ran uncached. A MISS reports nothing. */
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

/**
 * QCLI-568 Q568-INT B item 3: a stable identity for a failure CAUSE, comparable
 * between two reporters that saw the SAME underlying failure.
 *
 * The lock and the read cache both reach `<git-common-dir>/quest`, and when
 * that entry is a regular file both fail with `ENOTDIR` -- but each error names
 * its OWN path, so the message text differs and only the errno code is shared.
 * Comparing codes first, and the first message line second, is therefore what
 * "the same cause" means here. It NEVER equates two errors that merely share a
 * category: an ENOSPC cache write beside an expired lock has no code on the
 * lock side, so the signatures differ and both notes appear.
 *
 * Accepts either a thrown value or an already-formatted cause string (the
 * shape the cache's note sink receives).
 */
export function failureSignature(value: unknown): string {
  const code = (value as { code?: unknown } | null)?.code;
  if (typeof code === "string" && code !== "") return `code:${code}`;
  const text = typeof value === "string" ? value : cacheFailureCause(value);
  const head = text.split("\n")[0]?.trim() ?? "";
  const coded = /^([A-Z][A-Z0-9_]+):/u.exec(head);
  return coded === null ? `message:${head}` : `code:${coded[1]}`;
}

function isMissing(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === "ENOENT";
}

/** The on-disk manifest. `key` is repeated so a file that was moved or misnamed
 *  is recognised as not answering the key it was read under. */
interface ManifestDocument {
  readonly kind: "manifest";
  readonly version: number;
  readonly key: string;
  readonly locations: readonly string[];
  readonly entries: readonly AcrossRefsManifestEntry[];
}

/** `<git-common-dir>/quest/across-refs-cache/`, shared by every worktree of one
 *  clone, beside QCLI-568's advisory lock, and inside `.git` so it never dirties
 *  a checkout. */
export function acrossRefsCacheDirectory(commonDirectory: string): string {
  return join(commonDirectory, "quest", "across-refs-cache");
}

/** The per-ref cache key for a commit: the `.quest` tree hash, or
 *  `root-<root tree hash>` for a ref with no `.quest` tree. `undefined` means no
 *  key could be derived; the caller reads and does not cache that ref. */
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
    // A damaged commit/tree: no key.
  }
  return undefined;
}

function manifestPath(manifestsDirectory: string, key: string): string {
  return join(manifestsDirectory, `${key}${MANIFEST_SUFFIX}`);
}

function blobPath(blobsDirectory: string, oid: string): string {
  return join(blobsDirectory, oid);
}

/** A task location this cache is allowed to serve. The three names are the
 *  domain's own list (QCLI-527), so a manifest written by any build names one
 *  of them; anything else -- `__proto__`, `constructor`, a path, a typo -- is
 *  not a location this cache wrote, and the document is corrupt. */
const KNOWN_LOCATIONS: ReadonlySet<string> = new Set(CONTINUITY_TASK_LOCATIONS);

/** Parse and validate a manifest. Returns null for anything that is not the
 *  expected shape (the caller treats that as a corrupt MISS). */
function parseManifest(text: string, key: string): ManifestDocument | null {
  try {
    const document = JSON.parse(text) as Partial<ManifestDocument>;
    if (
      document.kind !== "manifest" ||
      document.version !== CACHE_VERSION ||
      document.key !== key ||
      !Array.isArray(document.locations) ||
      !document.locations.every(
        (location) =>
          typeof location === "string" && KNOWN_LOCATIONS.has(location),
      ) ||
      !Array.isArray(document.entries)
    )
      return null;
    const entries: AcrossRefsManifestEntry[] = [];
    for (const row of document.entries) {
      if (typeof row !== "object" || row === null) return null;
      const { location, path, blob } = row as {
        location?: unknown;
        path?: unknown;
        blob?: unknown;
      };
      // QCLI-568 Q568-INT B nit 5: the location is a BUCKET KEY on the read
      // path (`locations[entry.location]`), and a manifest is untrusted input
      // from the shared directory. Only the domain's three location names are
      // valid, so a hostile `__proto__`/`constructor` row is corrupt rather
      // than a prototype write.
      if (
        typeof location !== "string" ||
        !KNOWN_LOCATIONS.has(location) ||
        !document.locations.includes(location) ||
        typeof path !== "string"
      )
        return null;
      if (
        blob !== null &&
        (typeof blob !== "string" || !SHA_PATTERN.test(blob))
      )
        return null;
      entries.push({ location, path, blob });
    }
    return {
      kind: "manifest",
      version: CACHE_VERSION,
      key,
      locations: document.locations,
      entries,
    };
  } catch {
    return null;
  }
}

export class AcrossRefsCache implements AcrossRefsCachePort {
  private readonly io: CacheIo;
  private readonly maxEntries: number;
  private readonly onFailure:
    | ((line: string, error: unknown) => void)
    | undefined;
  private readonly manifestsDirectory: string;
  private readonly blobsDirectory: string;
  private failureNoted = false;
  /** Per-process blob text, so trees that share a blob read it once. */
  private readonly blobText = new Map<string, string>();

  constructor(
    directory: string,
    options: {
      readonly maxEntries?: number;
      readonly io?: Partial<CacheIo>;
      readonly onFailure?: (line: string, error: unknown) => void;
    } = {},
  ) {
    this.io = { ...defaultIo, ...options.io };
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.onFailure = options.onFailure;
    this.manifestsDirectory = join(directory, MANIFESTS_DIRECTORY);
    this.blobsDirectory = join(directory, BLOBS_DIRECTORY);
  }

  /** Report a FAILURE at most once per instance (once per process in the CLI's
   *  one-view-per-invocation path). A miss never reaches here. The ORIGINAL
   *  error travels to the sink as well, so a caller can compare its cause
   *  signature with another reporter's (QCLI-568 Q568-INT B item 3). */
  private fail(error: unknown): void {
    if (this.failureNoted) return;
    this.failureNoted = true;
    this.onFailure?.(cacheFailureNote(cacheFailureCause(error)), error);
  }

  /** The cache rooted at the clone's shared directory. */
  static underCommonDirectory(
    commonDirectory: string,
    options: {
      readonly maxEntries?: number;
      readonly io?: Partial<CacheIo>;
      readonly onFailure?: (line: string, error: unknown) => void;
    } = {},
  ): AcrossRefsCache {
    return new AcrossRefsCache(
      acrossRefsCacheDirectory(commonDirectory),
      options,
    );
  }

  async read(key: string): Promise<AcrossRefsCacheRead> {
    // A key that is not one of the two fixed shapes is never one this cache
    // wrote; using it as a filename would be a path-traversal hole, so it is a
    // miss.
    if (!KEY_PATTERN.test(key)) return { kind: "miss" };
    let text: string;
    try {
      text = await this.io.readFile(manifestPath(this.manifestsDirectory, key));
    } catch (error) {
      if (isMissing(error)) return { kind: "miss" };
      this.fail(error);
      return { kind: "corrupt" };
    }
    const manifest = parseManifest(text, key);
    if (manifest === null) return { kind: "corrupt" };
    // QCLI-568 Q568-INT B nit 5: a NULL-PROTOTYPE map, so no location name --
    // however hostile the manifest -- can reach Object.prototype through the
    // bucket assignment below. `parseManifest` already refuses an unknown
    // location; this is the second, independent guard.
    const locations: Record<string, AcrossRefsCachedFile[]> = Object.create(
      null,
    ) as Record<string, AcrossRefsCachedFile[]>;
    for (const location of manifest.locations) locations[location] = [];
    for (const entry of manifest.entries) {
      let bucket = locations[entry.location];
      if (bucket === undefined) {
        bucket = [];
        locations[entry.location] = bucket;
      }
      let fileText: string | null = null;
      if (entry.blob !== null) {
        // A manifest row with a bad oid is corrupt: repair by reading fresh.
        if (!SHA_PATTERN.test(entry.blob)) return { kind: "corrupt" };
        const cached = this.blobText.get(entry.blob);
        if (cached !== undefined) {
          fileText = cached;
        } else {
          try {
            fileText = await this.io.readFile(
              blobPath(this.blobsDirectory, entry.blob),
            );
          } catch (error) {
            if (isMissing(error)) return { kind: "corrupt" };
            this.fail(error);
            return { kind: "corrupt" };
          }
          this.blobText.set(entry.blob, fileText);
        }
      }
      bucket.push({ path: entry.path, text: fileText });
    }
    return { kind: "hit", locations };
  }

  async write(
    key: string,
    payload: AcrossRefsWritePayload,
    options: { readonly rewriteBlobs?: boolean } = {},
  ): Promise<void> {
    if (!KEY_PATTERN.test(key)) return;
    const rewrite = options.rewriteBlobs === true;
    for (const [oid, text] of payload.blobs) {
      if (!SHA_PATTERN.test(oid)) continue;
      const target = blobPath(this.blobsDirectory, oid);
      if (!rewrite && (await this.exists(target))) {
        this.blobText.set(oid, text);
        continue;
      }
      const cause = await this.writeTextAtomically(
        this.blobsDirectory,
        target,
        text,
      );
      if (cause !== null) {
        // Without every blob the manifest would be a permanent MISS; do not
        // write it, so the next run simply reads fresh.
        this.fail(cause);
        return;
      }
      this.blobText.set(oid, text);
    }
    const document: ManifestDocument = {
      kind: "manifest",
      version: CACHE_VERSION,
      key,
      locations: [...payload.locations],
      entries: [...payload.entries],
    };
    const cause = await this.writeTextAtomically(
      this.manifestsDirectory,
      manifestPath(this.manifestsDirectory, key),
      JSON.stringify(document),
    );
    if (cause !== null) this.fail(cause);
  }

  async touch(key: string): Promise<void> {
    if (!KEY_PATTERN.test(key)) return;
    const now = new Date();
    await this.io
      .utimes(manifestPath(this.manifestsDirectory, key), now, now)
      .catch(() => undefined);
  }

  /**
   * Bound the cache ONCE, at the end of a view. Manifests this run used are
   * PROTECTED (never evicted however many), and the remaining budget --
   * `maxEntries` minus the protected count -- goes to the newest unprotected
   * manifests. Then every blob referenced by no surviving manifest is deleted.
   * If a surviving manifest cannot be read, blob GC is SKIPPED for this prune
   * rather than risk deleting a blob it still references. Stale `.tmp` files in
   * either directory are unlinked.
   */
  async prune(protectedKeys: ReadonlySet<string>): Promise<void> {
    const now = Date.now();
    let names: string[];
    try {
      names = await this.io.readdir(this.manifestsDirectory);
    } catch {
      names = [];
    }
    const present: {
      readonly key: string;
      readonly path: string;
      mtimeMs: number;
    }[] = [];
    for (const name of names) {
      const path = join(this.manifestsDirectory, name);
      if (name.endsWith(".tmp")) {
        await this.unlinkIfStale(path, now);
        continue;
      }
      if (!name.endsWith(MANIFEST_SUFFIX)) continue;
      const key = name.slice(0, -MANIFEST_SUFFIX.length);
      try {
        const stats = await this.io.stat(path);
        present.push({ key, path, mtimeMs: stats.mtimeMs });
      } catch {
        // A vanishing manifest is not this cache's problem.
      }
    }

    const protectedEntries = present.filter((entry) =>
      protectedKeys.has(entry.key),
    );
    const otherEntries = present
      .filter((entry) => !protectedKeys.has(entry.key))
      .sort((a, b) => b.mtimeMs - a.mtimeMs);
    const budget = Math.max(0, this.maxEntries - protectedKeys.size);
    for (const stale of otherEntries.slice(budget))
      await this.io.unlink(stale.path).catch(() => undefined);
    const survivors = [...protectedEntries, ...otherEntries.slice(0, budget)];

    let gcSafe = true;
    const referenced = new Set<string>();
    for (const entry of survivors) {
      let text: string;
      try {
        text = await this.io.readFile(entry.path);
      } catch {
        gcSafe = false;
        continue;
      }
      const manifest = parseManifest(text, entry.key);
      if (manifest === null) {
        gcSafe = false;
        continue;
      }
      for (const row of manifest.entries)
        if (row.blob !== null) referenced.add(row.blob);
    }

    let blobNames: string[];
    try {
      blobNames = await this.io.readdir(this.blobsDirectory);
    } catch {
      blobNames = [];
    }
    for (const name of blobNames) {
      const path = join(this.blobsDirectory, name);
      if (name.endsWith(".tmp")) {
        await this.unlinkIfStale(path, now);
        continue;
      }
      if (!SHA_PATTERN.test(name)) continue;
      if (gcSafe && !referenced.has(name))
        await this.io.unlink(path).catch(() => undefined);
    }
  }

  private async exists(path: string): Promise<boolean> {
    try {
      await this.io.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  private async unlinkIfStale(path: string, now: number): Promise<void> {
    try {
      const stats = await this.io.stat(path);
      if (now - stats.mtimeMs > STALE_TMP_MILLISECONDS)
        await this.io.unlink(path).catch(() => undefined);
    } catch {
      // A vanishing temp file is not this cache's problem.
    }
  }

  /** Write `text` atomically. Returns null on success, or the one-line cause on
   *  failure, after unlinking whatever temp file the failed write left behind. */
  private async writeTextAtomically(
    directory: string,
    target: string,
    text: string,
  ): Promise<string | null> {
    const temporary = `${target}.${process.pid}.${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}.tmp`;
    try {
      await this.io.mkdir(directory);
      await this.io.writeFile(temporary, text);
      await this.io.rename(temporary, target);
      return null;
    } catch (error) {
      await this.io.unlink(temporary).catch(() => undefined);
      return cacheFailureCause(error);
    }
  }
}
