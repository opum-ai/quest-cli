// The root launcher's rc-to-final equivalence (QCLI-399; constitution Article 3
// clause 5 as amended by ODOC-302, read at opum-doc f322cff).
//
// The root launcher @opum-ai/quest stages as X-rc.N and opum-cli-e2e qualifies
// it. It then reaches `latest` by a fresh publish of X, because a dist-tag move
// never populates npm's packument readme. The amendment allows exactly one
// difference between the qualified and the published launcher: "identical
// once X-rc.N is substituted for X throughout, checked mechanically in CI".
//
// This is that check, and it is shared: the candidate bundle build runs it on
// the two launchers it packs, and promote-release.mjs runs it again on the rc
// the registry actually serves against the X it is about to publish.
//
// It compares UNPACKED trees, entry by entry: the same set of entries, the same
// mode on each, and each file's bytes equal once every "X-rc.N" in the rc copy
// is replaced by "X". Whole-archive bytes cannot be compared, because each tar
// header records its file's size and the substitution shortens the file. The
// agreed contract with lore-cli (LCLI-621) is the same comparison.

import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const STRICT_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** "0.12.0" and 1 -> "0.12.0-rc.1". */
export function launcherRcVersion(version, n) {
  if (!STRICT_SEMVER.test(String(version)))
    throw new Error(`not a release version: ${JSON.stringify(version)}`);
  if (!Number.isInteger(n) || n < 1)
    throw new Error(
      `rc number must be an integer >= 1, got ${JSON.stringify(n)}`,
    );
  return `${version}-rc.${n}`;
}

/**
 * The rc number the next staging of `version` must take: one past the highest
 * `version-rc.N` the registry already carries, or 1. An rc version is
 * immutable once published, so a re-stage never reuses a number.
 */
export function nextRcNumber(version, publishedVersions) {
  const prefix = `${version}-rc.`;
  let highest = 0;
  for (const published of publishedVersions) {
    if (!published.startsWith(prefix)) continue;
    const tail = published.slice(prefix.length);
    if (/^(0|[1-9]\d*)$/.test(tail)) highest = Math.max(highest, Number(tail));
  }
  return highest + 1;
}

/** Replaces every occurrence of `from` with `to` in a byte buffer. */
export function substituteBytes(bytes, from, to) {
  const needle = Buffer.from(from);
  const replacement = Buffer.from(to);
  const parts = [];
  let start = 0;
  for (;;) {
    const at = bytes.indexOf(needle, start);
    if (at === -1) break;
    parts.push(bytes.subarray(start, at), replacement);
    start = at + needle.length;
  }
  parts.push(bytes.subarray(start));
  return Buffer.concat(parts);
}

/** Every entry under `dir`, relative, with its mode and (for files) bytes. */
async function readTree(dir) {
  const entries = new Map();
  const walk = async (relative) => {
    for (const dirent of await readdir(join(dir, relative), {
      withFileTypes: true,
    })) {
      const path = relative ? `${relative}/${dirent.name}` : dirent.name;
      const full = join(dir, path);
      const mode = (await stat(full)).mode & 0o7777;
      if (dirent.isDirectory()) {
        entries.set(`${path}/`, { mode, bytes: null });
        await walk(path);
      } else if (dirent.isFile()) {
        entries.set(path, { mode, bytes: await readFile(full) });
      } else {
        entries.set(path, { mode, bytes: null, special: true });
      }
    }
  };
  await walk("");
  return entries;
}

/**
 * Pure comparison of two trees as readTree returns them. Returns every
 * difference, not the first, so one run names the whole problem.
 */
export function compareTrees(rcTree, finalTree, { rcVersion, version }) {
  const problems = [];
  for (const path of rcTree.keys())
    if (!finalTree.has(path))
      problems.push(`${path}: in the rc launcher, missing from the final one`);
  for (const path of finalTree.keys())
    if (!rcTree.has(path))
      problems.push(`${path}: in the final launcher, missing from the rc one`);
  for (const [path, rc] of rcTree) {
    const final = finalTree.get(path);
    if (!final) continue;
    if (rc.special || final.special)
      problems.push(`${path}: not a regular file or directory`);
    if (rc.mode !== final.mode)
      problems.push(
        `${path}: mode ${rc.mode.toString(8)} in the rc launcher, ${final.mode.toString(8)} in the final one`,
      );
    if (rc.bytes && final.bytes) {
      const substituted = substituteBytes(rc.bytes, rcVersion, version);
      if (!substituted.equals(final.bytes))
        problems.push(
          `${path}: differs from the rc launcher by more than "${rcVersion}" -> "${version}"`,
        );
    }
  }
  return problems;
}

/**
 * Unpacks both launcher tarballs and compares them. Also asserts each
 * package.json declares the version its role requires: without that, two
 * launchers that both said X would pass a substitution check that substituted
 * nothing. Every failure is returned, never thrown.
 */
export async function checkLauncherEquivalence({
  rcTarball,
  finalTarball,
  rcVersion,
  version,
  execFile: execFileFn = execFile,
}) {
  let scratch;
  try {
    if (rcVersion === version || !rcVersion.startsWith(`${version}-rc.`))
      return {
        ok: false,
        problems: [`${rcVersion} is not an rc of ${version}`],
      };
    scratch = await mkdtemp(join(tmpdir(), "quest-launcher-equivalence-"));
    const trees = {};
    for (const [role, tarball] of [
      ["rc", rcTarball],
      ["final", finalTarball],
    ]) {
      const into = join(scratch, role);
      await execFileFn("mkdir", ["-p", into]);
      // -p keeps the archive's modes rather than applying this umask.
      await execFileFn("tar", ["-xzpf", tarball, "-C", into]);
      trees[role] = await readTree(into);
    }
    const problems = [];
    for (const [role, expected] of [
      ["rc", rcVersion],
      ["final", version],
    ]) {
      const manifest = trees[role].get("package/package.json");
      const declared = manifest
        ? JSON.parse(manifest.bytes.toString("utf8")).version
        : undefined;
      if (declared !== expected)
        problems.push(
          `the ${role} launcher's package.json declares ${JSON.stringify(declared)}, expected ${expected}`,
        );
    }
    problems.push(
      ...compareTrees(trees.rc, trees.final, { rcVersion, version }),
    );
    return { ok: problems.length === 0, problems };
  } catch (error) {
    const detail = String(error?.stderr || error?.message || error)
      .trim()
      .split("\n")[0];
    return {
      ok: false,
      problems: [`could not unpack and compare the launchers: ${detail}`],
    };
  } finally {
    if (scratch) await rm(scratch, { recursive: true, force: true });
  }
}
