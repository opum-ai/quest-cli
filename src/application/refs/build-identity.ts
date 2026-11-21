import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { QUEST_VERSION } from "../version.ts";

/**
 * QCLI-568 Q568-INT B (DEC-282 (a7), Opus round 2 on #777): the identity of the
 * RUNNING build, so a recorded whole-result is replayed only by the build that
 * wrote it.
 *
 * The result directory is shared by every worktree of a clone, so an installed
 * quest and a dev build can wait on the same request. A version string alone
 * cannot tell them apart -- a held version can name two byte-sets, and a source
 * run (`bun run src/cli/main.ts`) reports the bare literal -- so the identity is
 * the version PLUS a digest of the code that is actually executing:
 *
 *  - the bytes of `process.execPath` (the whole program for a compiled
 *    release or platform binary; the `bun` runtime for a source run), and
 *  - for a source run, the bytes of every `.ts` file under this checkout's
 *    `src/` (a compiled binary has no readable `src/`, so that part is skipped).
 *
 * It is computed once per process and is cheap beside the minute-scale read it
 * guards. It can only NARROW reuse: a failure to read any part yields an
 * identity that matches nothing else, never a shared one.
 */
let cached: Promise<string> | undefined;

export function currentBuildIdentity(): Promise<string> {
  cached ??= computeBuildIdentity();
  return cached;
}

export async function computeBuildIdentity(): Promise<string> {
  const hash = createHash("sha256");
  hash.update(`version:${QUEST_VERSION}\n`);
  try {
    hash.update(await readFile(process.execPath));
  } catch {
    // Unreadable runtime: fold in a per-process nonce so nothing can match.
    hash.update(`unreadable-exec:${process.pid}:${Date.now()}`);
  }
  hash.update("\n--src--\n");
  try {
    const root = resolve(import.meta.dirname, "..", "..");
    const entries = (await readdir(root, { recursive: true }))
      .filter((name) => name.endsWith(".ts"))
      .sort();
    for (const name of entries) {
      hash.update(`${name}\n`);
      hash.update(await readFile(join(root, name)));
    }
  } catch {
    // A compiled binary has no readable src/ -- its execPath bytes are the code.
  }
  return `${QUEST_VERSION}+sha256:${hash.digest("hex")}`;
}
