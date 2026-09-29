// Cuts the GitHub Release for a version tag, its body taken from that
// version's CHANGELOG.md section AT THE COMMIT THE TAG PEELS TO, read
// through the GitHub API rather than from the checkout this runs in
// (QCLI-398, opum-agent OPAG-646; QCLI-407, paired with lore-cli LCLI-639).
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
// An existing release counts as done only when it is published and carries
// these notes (QCLI-401, paired with lore-cli LCLI-622). A draft, a
// prerelease, or different notes is refused and left for a person to repair.

import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { resolveTagCommit } from "./qualification/pair-receipt.mjs";

const execFile = promisify(execFileCallback);

export const RELEASE_REPOSITORY = "github.com/opum-ai/quest-cli";

/** The same repository as it is addressed under `gh api repos/<this>`. */
const REPOSITORY_PATH = RELEASE_REPOSITORY.replace(/^github\.com\//, "");

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * An opening fence: up to three spaces of indent, then ``` or ~~~, and
 * anything after it (an info string). A closing fence is the same marker
 * with nothing but whitespace after it. Both sides of the pairing implement
 * exactly these two predicates, so a change here is a divergence to agree
 * with lore-cli before landing (QCLI-407 / LCLI-639).
 */
const FENCE_OPEN = /^ {0,3}(```|~~~)/;
const FENCE_CLOSE = /^ {0,3}(```|~~~)[ \t]*$/;

/**
 * The body of `## <version>` in CHANGELOG.md, up to the next `## ` heading,
 * trimmed. The heading may carry a suffix (`## 0.11.0 - 2026-09-27`), but
 * `## 0.1.0` never matches `## 0.1.01`. Returns null when there is no such
 * section or it is empty: a release with no notes is refused, not cut.
 *
 * Line endings are normalised to LF before anything is split, so the same
 * bytes give the same body whatever the file's line endings are, and the
 * notes this returns are the notes GitHub is asked to store.
 *
 * A `## ` line inside an open fence does not end the section -- a fenced
 * block in a changelog entry is content, and reading it as a heading
 * silently truncated a release body. An UNCLOSED fence runs to EOF, which
 * is CommonMark: a body that then carries the following entries is the loud
 * failure, where stopping early ships a short body silently. The heading
 * search itself is deliberately not fence-aware -- this rule governs where
 * a section ENDS, which is what the pairing agreed.
 */
export function changelogSection(changelog, version) {
  const heading = new RegExp(`^## ${escapeRegExp(version)}(?:\\s.*)?$`);
  const lines = changelog.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) return null;
  let end = lines.length;
  let fenced = false;
  for (let i = start + 1; i < lines.length; i++) {
    if (fenced) {
      if (FENCE_CLOSE.test(lines[i])) fenced = false;
      continue;
    }
    if (FENCE_OPEN.test(lines[i])) {
      fenced = true;
      continue;
    }
    if (lines[i].startsWith("## ")) {
      end = i;
      break;
    }
  }
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

/** Notes compared as GitHub may store them: CRLF line ends, outer whitespace. */
const normaliseNotes = (text) => text.replace(/\r\n/g, "\n").trim();

/**
 * Creates the release for v<version>, or confirms one exists. Never edits an
 * existing release's notes. An existing release must be published (not a
 * draft or prerelease) and carry `notes`, or the result is a failure
 * (QCLI-401). When `latest` is asked for and the release already
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
  let state;
  try {
    const { stdout } = await execFileFn("gh", [
      "release",
      "view",
      tag,
      ...repo,
      "--json",
      "tagName,body,isDraft,isPrerelease",
    ]);
    try {
      state = JSON.parse(stdout);
    } catch {
      state = undefined;
    }
    if (
      state === null ||
      typeof state !== "object" ||
      Array.isArray(state) ||
      typeof state.body !== "string"
    )
      return {
        ok: false,
        action: "none",
        detail: `could not read release ${tag}: gh release view did not return its state`,
      };
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
    // QCLI-401: refused, never repaired. Publishing a draft or rewriting a
    // release body is a decision for a person, not for a release script.
    if (state.isDraft !== false || state.isPrerelease !== false)
      return {
        ok: false,
        action: "none",
        detail: `release ${tag} exists but is a ${state.isDraft !== false ? "draft" : "prerelease"}; publish or delete it by hand, then re-run`,
      };
    if (normaliseNotes(state.body) !== normaliseNotes(notes))
      return {
        ok: false,
        action: "none",
        detail: `release ${tag} exists but its notes differ from the CHANGELOG section; it is never edited here, so reconcile it by hand, then re-run`,
      };
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

/**
 * CHANGELOG.md's bytes at `commit`, through the GitHub API (QCLI-407, paired
 * with lore-cli LCLI-639). The tag is created remotely by release.yml and
 * this flow holds no local-git invocation, so the commit addressed here is
 * the one resolveTagCommit already resolved -- never a working tree, and
 * never a tag name, which can be re-pointed where a commit cannot.
 *
 * Every failure comes back as `text: null` with its cause, never thrown and
 * never defaulted, the shape check-breaking-bump.mjs reads a peer's
 * changelog with.
 */
export async function changelogAt(
  commit,
  { execFile: execFileFn = execFile } = {},
) {
  try {
    const { stdout } = await execFileFn(
      "gh",
      [
        "api",
        "--hostname",
        "github.com",
        "-H",
        "Accept: application/vnd.github.raw",
        `repos/${REPOSITORY_PATH}/contents/CHANGELOG.md?ref=${commit}`,
      ],
      { maxBuffer: 16 * 1024 * 1024 },
    );
    return { text: stdout, commit, error: null };
  } catch (error) {
    const detail = String(error?.stderr || error?.message || error)
      .trim()
      .split("\n")[0];
    return { text: null, commit, error: detail || "the read failed" };
  }
}

/**
 * The notes and title for a version, read at the commit v<version> peels to
 * (QCLI-407). A working-tree read used to stand here, which made an
 * uncommitted edit -- or work landed after the tag -- the body of a new
 * release. The tag is immutable once cut, so a missing section is not
 * repairable by editing and re-running, and the refusal says so rather than
 * leaving that remedy implied.
 */
export async function releaseNotesFor(
  version,
  { commit, execFile: execFileFn = execFile } = {},
) {
  const read = await changelogAt(commit, { execFile: execFileFn });
  if (read.error)
    return {
      ok: false,
      detail: `CHANGELOG.md at ${commit} could not be read (${read.error}).`,
    };
  const section = changelogSection(read.text, version);
  if (!section)
    return {
      ok: false,
      detail: `CHANGELOG.md at ${commit} has no non-empty "## ${version}" section for its GitHub Release. v${version} is already tagged, so adding a section and re-running cannot reach it: re-tag, or cut the release by hand.`,
    };
  return {
    ok: true,
    notes: section.body,
    title: releaseTitle(version, section.heading),
  };
}

async function main(argv) {
  const index = argv.indexOf("--version");
  const version = index === -1 ? undefined : argv[index + 1];
  if (!version || version.startsWith("--"))
    throw new Error(
      "usage: github-release.mjs --version <x.y.z> [--create] [--not-latest]",
    );
  // QCLI-407: the notes are read at the tagged commit, so this tool resolves
  // the peel too -- it must cut the same bytes the next promote's preflight
  // will compare against, and neither of them reads a working tree.
  const peeled = await resolveTagCommit(version);
  if (!peeled.commit) {
    console.error(
      `Refusing to cut v${version}: ${peeled.error}. The notes are read at the tagged commit, so the tag has to resolve before there is anything to read.`,
    );
    process.exit(1);
  }
  const release = await releaseNotesFor(version, { commit: peeled.commit });
  if (!release.ok) {
    console.error(`Refusing to cut a release without notes: ${release.detail}`);
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
