// Cuts the GitHub Release for a version tag, its body taken from that
// version's CHANGELOG.md section (QCLI-398, opum-agent OPAG-646).
//
// GitHub Releases stopped at v0.6.0 because nothing in the release flow ever
// created one: every later release moved npm `latest` and left GitHub saying
// v0.6.0. promote-release.mjs now calls ensureGitHubRelease once `latest` is
// verified moved, so the step cannot be skipped again. This file is also the
// backfill and the repair tool:
//
//   node scripts/github-release.mjs --version 0.11.0            # dry run
//   node scripts/github-release.mjs --version 0.11.0 --create   # cut it
//   node scripts/github-release.mjs --version 0.9.0 --create --not-latest
//
// It never creates a tag (`--verify-tag`), never edits an existing release's
// body, and pins the host (`-R github.com/...`) so GH_HOST cannot redirect it.

import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = dirname(dirname(fileURLToPath(import.meta.url)));

export const RELEASE_REPOSITORY = "github.com/opum-ai/quest-cli";

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The body of `## <version>` in CHANGELOG.md, up to the next `## ` heading,
 * trimmed. The heading may carry a suffix (`## 0.11.0 - 2026-09-27`), but
 * `## 0.1.0` never matches `## 0.1.01`. Returns null when there is no such
 * section or it is empty: a release with no notes is refused, not cut.
 */
export function changelogSection(changelog, version) {
  const heading = new RegExp(`^## ${escapeRegExp(version)}(?:\\s.*)?$`);
  const lines = changelog.split("\n");
  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) return null;
  let end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  if (end === -1) end = lines.length;
  const body = lines
    .slice(start + 1, end)
    .join("\n")
    .trim();
  return body === "" ? null : { heading: lines[start], body };
}

/** "Quest CLI 0.11.0", matching lore-cli's "Lore CLI <v>". */
export function releaseTitle(version, heading = "") {
  return /never published/i.test(heading)
    ? `Quest CLI ${version} (tagged, never published)`
    : `Quest CLI ${version}`;
}

/**
 * Creates the release for v<version>, or confirms one exists. Never edits an
 * existing release's notes. When `latest` is asked for and the release already
 * exists, it is marked latest, because that is the state a finished release
 * must leave behind. Returns {ok, action, detail}; every failure is returned,
 * never thrown, so a caller that has already moved npm `latest` can report it
 * without a stack trace that reads like the promotion failed.
 */
export async function ensureGitHubRelease({
  version,
  notes,
  title = releaseTitle(version),
  latest = true,
  dryRun = false,
  execFile: execFileFn = execFile,
}) {
  const tag = `v${version}`;
  const repo = ["-R", RELEASE_REPOSITORY];
  let exists;
  try {
    await execFileFn("gh", [
      "release",
      "view",
      tag,
      ...repo,
      "--json",
      "tagName",
    ]);
    exists = true;
  } catch (error) {
    const detail = String(error?.stderr || error?.message || error);
    // gh prints "release not found" for a missing repository too. The
    // repository is a constant here, so that case is an access loss, and the
    // create that follows fails closed on it rather than succeeding.
    if (!/release not found/i.test(detail))
      return {
        ok: false,
        action: "none",
        detail: `could not read release ${tag}: ${detail.trim().split("\n")[0]}`,
      };
    exists = false;
  }

  if (exists) {
    if (!latest)
      return {
        ok: true,
        action: "exists",
        detail: `release ${tag} already exists; left as is`,
      };
    if (dryRun)
      return {
        ok: true,
        action: "would-mark-latest",
        detail: `release ${tag} exists; would mark it latest`,
      };
    try {
      await execFileFn("gh", ["release", "edit", tag, ...repo, "--latest"]);
      return {
        ok: true,
        action: "marked-latest",
        detail: `release ${tag} already existed; marked latest`,
      };
    } catch (error) {
      const detail = String(error?.stderr || error?.message || error)
        .trim()
        .split("\n")[0];
      return {
        ok: false,
        action: "none",
        detail: `release ${tag} exists but could not be marked latest: ${detail}`,
      };
    }
  }

  if (dryRun)
    return {
      ok: true,
      action: "would-create",
      detail: `would create release ${tag} "${title}" (${Buffer.byteLength(notes)} bytes of notes)${latest ? ", marked latest" : ""}`,
    };

  let dir;
  try {
    dir = await mkdtemp(join(tmpdir(), "quest-release-notes-"));
    const notesFile = join(dir, "notes.md");
    await writeFile(notesFile, `${notes}\n`);
    await execFileFn("gh", [
      "release",
      "create",
      tag,
      ...repo,
      "--verify-tag",
      "--title",
      title,
      "--notes-file",
      notesFile,
      `--latest=${latest ? "true" : "false"}`,
    ]);
    return {
      ok: true,
      action: "created",
      detail: `created release ${tag} "${title}"`,
    };
  } catch (error) {
    const detail = String(error?.stderr || error?.message || error)
      .trim()
      .split("\n")[0];
    return {
      ok: false,
      action: "none",
      detail: `could not create release ${tag}: ${detail}`,
    };
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true });
  }
}

/** The notes and title for a version, read from this checkout's CHANGELOG. */
export async function releaseNotesFor(
  version,
  { changelogPath = join(root, "CHANGELOG.md") } = {},
) {
  const section = changelogSection(
    await readFile(changelogPath, "utf8"),
    version,
  );
  if (!section) return null;
  return { notes: section.body, title: releaseTitle(version, section.heading) };
}

async function main(argv) {
  const index = argv.indexOf("--version");
  const version = index === -1 ? undefined : argv[index + 1];
  if (!version || version.startsWith("--"))
    throw new Error(
      "usage: github-release.mjs --version <x.y.z> [--create] [--not-latest]",
    );
  const release = await releaseNotesFor(version);
  if (!release) {
    console.error(
      `CHANGELOG.md has no non-empty "## ${version}" section; refusing to cut a release without notes.`,
    );
    process.exit(1);
  }
  const outcome = await ensureGitHubRelease({
    version,
    ...release,
    latest: !argv.includes("--not-latest"),
    dryRun: !argv.includes("--create"),
  });
  (outcome.ok ? console.log : console.error)(outcome.detail);
  if (!outcome.ok) process.exit(1);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}
