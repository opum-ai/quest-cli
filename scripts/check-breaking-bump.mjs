// A breaking CHANGELOG entry needs at least a minor version bump (QCLI-328).
//
// Motivating case: 0.6.2. Its CHANGELOG entry correctly called its
// normalized mutation envelopes a breaking change (QCLI-264/QCLI-265), and it
// shipped as a patch anyway. A consumer reading only the version number had
// no signal. The convention (a `### Changed (breaking)` heading) already
// existed. What was missing was a check of it against the chosen number. This
// is that check. It is ruled in opum-doc
// docs/adr/gate-release-prep-on-a-breaking-changelog-entry-at-a-patch-bump.md.
// Because lore and quest share one version (constitution Article 3 clause 1),
// a breaking entry in EITHER repository's CHANGELOG forces the pair to at
// least minor, including the side that "did not change functionally". So
// `--pair` also reads lore-cli's CHANGELOG by ref through the GitHub API and
// applies the same rule to lore's notes for the same version (QCLI-403).
// It fails closed: a lore CHANGELOG that cannot be read, or reads with no
// version section, refuses rather than passing on nothing. lore-cli runs the
// mirror of this against quest-cli.
//
// The quest-only form (no `--pair`) is the `breaking_bump` source gate and
// stays offline, because a network read in a required context makes it
// flaky. The pair form runs at release time instead: in release.yml beside
// the version-parity gate, and by hand during release prep.
//
// Which notes belong to the package.json version depends on where release
// prep has got to (see docs/runbooks/quest-cli-package-and-release.md):
//   - after step 5, `## <version>` exists and holds them;
//   - on the bump PR, before step 5, they are still under `## Unreleased`,
//     and the previous release is the first version heading in the file.
// Both states are checked, so the bump PR itself is where a patch-level
// number on a breaking section is refused.
//
//   node scripts/check-breaking-bump.mjs               # the package.json version
//   node scripts/check-breaking-bump.mjs --next 0.12.0 # release prep, before the bump
//   node scripts/check-breaking-bump.mjs --pair        # also lore-cli's CHANGELOG on its main
//   node scripts/check-breaking-bump.mjs --pair --lore-ref dev --next 0.12.0

import { execFile as execFileCallback } from "node:child_process";
import { realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = fileURLToPath(new URL("..", import.meta.url));

/**
 * The peer whose CHANGELOG `--pair` reads. `main` by default, the same ref
 * the version-parity gate reads: a paired release has already reached one
 * version on both sides' `main` before either side tags.
 */
export const LORE = Object.freeze({
  repository: "opum-ai/lore-cli",
  ref: "main",
});

/** A `### ...` heading marked `(breaking)`, e.g. `### Changed (breaking)`. */
export const BREAKING_HEADING = /^###\s.*\(breaking\)/im;

// quest writes `## 1.4.0 - date` and `## Unreleased`; lore-cli writes Keep a
// Changelog's bracketed `## [1.4.0] - date` and `## [Unreleased]`.
const VERSION_HEADING = /^## \[?(\d+\.\d+\.\d+)\]?(?:\s.*)?$/;
const UNRELEASED_HEADING = /^## \[?Unreleased\]?\s*$/;

function parse(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return match ? match.slice(1, 4).map(Number) : null;
}

/** "major", "minor" or "patch" for the step from `previous` to `next`. */
export function bumpLevel(previous, next) {
  const [a, b] = [parse(previous), parse(next)];
  if (!a || !b) return null;
  if (a[0] !== b[0]) return "major";
  if (a[1] !== b[1]) return "minor";
  return "patch";
}

/** Every `## ` section, in file order, with its heading and body. */
function sections(changelog) {
  const lines = changelog.split("\n");
  const out = [];
  for (const [index, line] of lines.entries()) {
    if (!line.startsWith("## ")) continue;
    if (out.length) out[out.length - 1].end = index;
    out.push({ heading: line, start: index + 1, end: lines.length });
  }
  return out.map(({ heading, start, end }) => ({
    heading,
    version: VERSION_HEADING.exec(heading)?.[1] ?? null,
    body: lines.slice(start, end).join("\n"),
  }));
}

/**
 * Problems with releasing `version` given `changelog`, plus what was read,
 * so a caller can tell a clean answer from one that read nothing.
 */
export function breakingBumpProblems(
  changelog,
  version,
  { name = "CHANGELOG.md" } = {},
) {
  const all = sections(changelog);
  const versioned = all.filter((section) => section.version !== null);
  const problems = [];
  const own = versioned.findIndex((section) => section.version === version);
  let notes;
  let previous;
  let source;
  if (own !== -1) {
    notes = versioned[own];
    previous = versioned[own + 1]?.version ?? null;
    source = notes.heading;
  } else {
    notes = all.find((section) => UNRELEASED_HEADING.test(section.heading));
    previous = versioned[0]?.version ?? null;
    source = notes?.heading ?? "## Unreleased";
    if (!notes)
      problems.push(
        `${name} has neither a "## ${version}" section nor a "## Unreleased" section to hold ${version}'s notes`,
      );
  }
  const breaking = notes ? BREAKING_HEADING.test(notes.body) : false;
  const level = previous ? bumpLevel(previous, version) : null;
  if (breaking && previous === null)
    problems.push(
      `${source} carries a breaking heading, but no earlier version heading exists to compare ${version} with`,
    );
  if (breaking && level === "patch")
    problems.push(
      `${source} carries a breaking heading, but ${previous} -> ${version} is a patch bump; a breaking change needs at least a minor bump (QCLI-328; 0.6.2 shipped this way)`,
    );
  return {
    problems,
    version,
    previous,
    level,
    source,
    breaking,
    sectionsRead: all.length,
    versionSectionsRead: versioned.length,
  };
}

export async function checkBreakingBump({ directory = root, next } = {}) {
  const version =
    next ??
    JSON.parse(await readFile(join(directory, "package.json"), "utf8")).version;
  const changelog = await readFile(join(directory, "CHANGELOG.md"), "utf8");
  return breakingBumpProblems(changelog, version);
}

/**
 * lore-cli's CHANGELOG at `ref`, read at the commit the ref resolves to, so
 * the answer names exactly what was read even if the branch moves. Every
 * failure comes back as `text: null` with its cause, never thrown and never
 * defaulted.
 */
export async function readLoreChangelog({
  ref = LORE.ref,
  execFile: run = execFile,
} = {}) {
  let sha = null;
  try {
    const gh = async (args) =>
      (await run("gh", ["api", ...args], { maxBuffer: 16 * 1024 * 1024 }))
        .stdout;
    sha = (
      await gh([
        `repos/${LORE.repository}/commits/${encodeURIComponent(ref)}`,
        "--jq",
        ".sha",
      ])
    ).trim();
    if (!/^[0-9a-f]{40}$/.test(sha)) {
      const answered = sha;
      sha = null;
      return {
        text: null,
        ref,
        sha,
        error: `the ref resolved to ${JSON.stringify(answered.slice(0, 80))}, not a commit`,
      };
    }
    const text = await gh([
      "-H",
      "Accept: application/vnd.github.raw",
      `repos/${LORE.repository}/contents/CHANGELOG.md?ref=${sha}`,
    ]);
    return { text, ref, sha };
  } catch (error) {
    const detail = String(error?.stderr || error?.message || error)
      .trim()
      .split("\n")[0];
    return { text: null, ref, sha, error: detail || "the read failed" };
  }
}

/**
 * The quest check plus the same rule over lore-cli's notes for the same
 * version (QCLI-403). Refuses on any problem either side reports, and on a
 * lore CHANGELOG that could not be read or holds no version section.
 */
export async function checkPairBreakingBump({
  directory = root,
  next,
  loreRef = LORE.ref,
  read = readLoreChangelog,
} = {}) {
  const quest = await checkBreakingBump({ directory, next });
  const loreRead = await read({ ref: loreRef });
  const where = `${LORE.repository}@${loreRead.ref}${loreRead.sha ? ` (${loreRead.sha})` : ""}`;
  const problems = quest.problems.map((problem) => `quest: ${problem}`);
  if (quest.sectionsRead === 0)
    problems.push(
      "quest: CHANGELOG.md has no ## sections; nothing was checked",
    );
  let lore = null;
  if (loreRead.text === null)
    problems.push(
      `lore: the CHANGELOG could not be read at ${where}: ${loreRead.error}. The pair check refuses rather than passing on nothing read`,
    );
  else {
    lore = breakingBumpProblems(loreRead.text, quest.version, {
      name: `lore-cli's CHANGELOG.md at ${where}`,
    });
    if (lore.versionSectionsRead === 0)
      problems.push(
        `lore: the CHANGELOG at ${where} holds no parseable version section (${lore.sectionsRead} ## sections read), so there is nothing to compare ${quest.version} against`,
      );
    problems.push(
      ...lore.problems.map((problem) => `lore (${where}): ${problem}`),
    );
  }
  return {
    quest,
    lore,
    loreRef: loreRead.ref,
    loreSha: loreRead.sha,
    problems,
  };
}

/** One line saying what was read and what it decided. */
export function describe(result, label = "") {
  return (
    `${label}${result.version}: read ${result.sectionsRead} CHANGELOG sections; its notes are ${result.source}, ` +
    (result.breaking
      ? `which carries a breaking heading, and ${result.previous} -> ${result.version} is a ${result.level} bump.`
      : `with no breaking heading${result.level ? ` (${result.previous} -> ${result.version} is a ${result.level} bump)` : ""}.`)
  );
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  const argv = process.argv.slice(2);
  const value = (flag) => {
    const at = argv.indexOf(flag);
    return at === -1 ? { given: false } : { given: true, value: argv[at + 1] };
  };
  const nextFlag = value("--next");
  const refFlag = value("--lore-ref");
  const pair = argv.includes("--pair");
  if (
    (nextFlag.given && (!nextFlag.value || !parse(nextFlag.value))) ||
    (refFlag.given &&
      (!pair || !refFlag.value || refFlag.value.startsWith("--")))
  ) {
    console.error(
      "usage: check-breaking-bump.mjs [--next <x.y.z>] [--pair [--lore-ref <ref>]]",
    );
    process.exit(2);
  }
  const next = nextFlag.value;
  if (pair) {
    const result = await checkPairBreakingBump({
      next,
      loreRef: refFlag.value ?? LORE.ref,
    });
    if (result.problems.length) {
      console.error(
        "The pair's version bump does not match the CHANGELOGs:\n" +
          result.problems.map((problem) => `  - ${problem}`).join("\n"),
      );
      process.exit(1);
    }
    console.log(describe(result.quest, "quest "));
    console.log(
      `${describe(result.lore, "lore ")} Read at ${LORE.repository}@${result.loreRef} (${result.loreSha}).`,
    );
    process.exit(0);
  }
  const result = await checkBreakingBump({ next });
  if (result.sectionsRead === 0) {
    console.error("CHANGELOG.md has no ## sections; nothing was checked.");
    process.exit(1);
  }
  if (result.problems.length) {
    console.error(
      "The version bump does not match the CHANGELOG:\n" +
        result.problems.map((problem) => `  - ${problem}`).join("\n"),
    );
    process.exit(1);
  }
  console.log(describe(result));
}
