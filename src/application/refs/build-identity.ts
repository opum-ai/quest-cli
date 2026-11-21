import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import { QUEST_VERSION } from "../version.ts";

/**
 * QCLI-568 Q568-INT B (DEC-282 (a7), Opus rounds 2 and 3 on #777): the identity
 * of the RUNNING build, so a recorded whole-result is replayed only by the build
 * that wrote it.
 *
 * The result directory is shared by every worktree of a clone, so an installed
 * quest and a dev build can wait on the same request. A version string alone
 * cannot tell them apart -- a held version can name two byte-sets, and a source
 * run (`bun run src/cli/main.ts`) reports the bare literal -- so the identity is
 * the version PLUS a digest of the code that is actually executing:
 *
 *  - ALWAYS the bytes of `process.execPath`: the whole program for a compiled
 *    release or platform binary, the `bun` runtime for a source run;
 *  - ON A SOURCE RUN ONLY, the bytes of every `.ts` file under this checkout's
 *    `src/`. A source run is detected POSITIVELY ({@link resolveSourceRoot}): the
 *    module sits two levels under a directory named `src` that holds
 *    `cli/main.ts`, and not under a `$bunfs` virtual root. A compiled binary has
 *    no such directory, so it never walks anything -- in particular never `/`.
 *
 * THREE WAYS, not two. The module directory is either a positively detected
 * SOURCE root (version + runtime + src bytes), a RECOGNISED compiled root
 * (`/$bunfs/root` on POSIX, `B:\~BUN\root` on Windows: version + runtime bytes
 * only), or ANYTHING ELSE -- a layout this code does not recognise, such as an
 * unpacked `/opt/dist` -- which gets a per-process nonce, so it matches nothing.
 *
 * FAIL-SAFE: it can only NARROW reuse. Any failure to read the runtime, or --
 * on a source run -- to list or read any source file, also folds a per-process
 * nonce into the digest, so the identity then matches no other process and a
 * partial read can never produce a shared one.
 *
 * LIMIT: a source-run identity covers `src/**` and the runtime, not
 * `node_modules` or `bun.lock`, so a dependency-only change shares an identity.
 *
 * It is computed once per process and costs tens of milliseconds, beside the
 * minute-scale read it guards: 25-32 ms measured inside a compiled darwin-arm64
 * binary (runtime bytes only), 28-101 ms for a source run on a 63 MB runtime.
 */
let cached: Promise<string> | undefined;

export function currentBuildIdentity(): Promise<string> {
  cached ??= computeBuildIdentity();
  return cached;
}

/**
 * The `src/` root of a SOURCE run, or null when this is not one (a compiled
 * binary, whose modules live under a `$bunfs` virtual root, or any layout that
 * is not `<root>/src/<dir>/<file>` with `<root>/src/cli/main.ts` present).
 * `moduleDirectory` is this module's directory (`src/application/refs`).
 */
/** A module directory that is a RECOGNISED compiled-binary virtual root:
 *  `/$bunfs/root` (POSIX) or `B:\~BUN\root` (Windows). */
export function isCompiledRoot(moduleDirectory: string): boolean {
  return moduleDirectory.includes("$bunfs") || moduleDirectory.includes("~BUN");
}

export function resolveSourceRoot(moduleDirectory: string): string | null {
  if (isCompiledRoot(moduleDirectory)) return null;
  const root = resolve(moduleDirectory, "..", "..");
  if (basename(root) !== "src") return null;
  return existsSync(join(root, "cli", "main.ts")) ? root : null;
}

export interface BuildIdentityInputs {
  /** Defaults to {@link QUEST_VERSION}. */
  readonly version?: string;
  /** Defaults to `process.execPath`. */
  readonly execPath?: string;
  /** Defaults to this module's directory. */
  readonly moduleDirectory?: string;
}

export async function computeBuildIdentity(
  inputs: BuildIdentityInputs = {},
): Promise<string> {
  const version = inputs.version ?? QUEST_VERSION;
  const hash = createHash("sha256");
  let failed = false;
  hash.update(`version:${version}\n`);
  try {
    hash.update(await readFile(inputs.execPath ?? process.execPath));
  } catch {
    failed = true;
  }
  const moduleDirectory = inputs.moduleDirectory ?? import.meta.dirname;
  const root = resolveSourceRoot(moduleDirectory);
  // Neither a source root nor a recognised compiled root: unknown layout.
  if (root === null && !isCompiledRoot(moduleDirectory)) failed = true;
  if (root !== null) {
    hash.update("\n--src--\n");
    try {
      const names = (await readdir(root, { recursive: true }))
        .filter((name) => name.endsWith(".ts"))
        .sort();
      for (const name of names) {
        hash.update(`${name}\n`);
        hash.update(await readFile(join(root, name)));
      }
    } catch {
      failed = true;
    }
  }
  // Unreadable runtime, or a source run with any unreadable part: nothing may
  // share this identity.
  if (failed)
    hash.update(`\nnonce:${process.pid}:${Date.now()}:${Math.random()}`);
  return `${version}+sha256:${hash.digest("hex")}`;
}
