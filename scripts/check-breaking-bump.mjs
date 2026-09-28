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
// lore-cli runs the same check over its own CHANGELOG, and a breaking entry
// in either forces the pair to at least minor.
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

import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

/** A `### ...` heading marked `(breaking)`, e.g. `### Changed (breaking)`. */
export const BREAKING_HEADING = /^###\s.*\(breaking\)/im;

const VERSION_HEADING = /^## (\d+\.\d+\.\d+)(?:\s.*)?$/;

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
export function breakingBumpProblems(changelog, version) {
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
    notes = all.find((section) => /^## Unreleased\s*$/.test(section.heading));
    previous = versioned[0]?.version ?? null;
    source = "## Unreleased";
    if (!notes)
      problems.push(
        `CHANGELOG.md has neither a "## ${version}" section nor a "## Unreleased" section to hold ${version}'s notes`,
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
  };
}

export async function checkBreakingBump({ directory = root, next } = {}) {
  const version =
    next ??
    JSON.parse(await readFile(join(directory, "package.json"), "utf8")).version;
  const changelog = await readFile(join(directory, "CHANGELOG.md"), "utf8");
  return breakingBumpProblems(changelog, version);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const argv = process.argv.slice(2);
  const at = argv.indexOf("--next");
  const next = at === -1 ? undefined : argv[at + 1];
  if (at !== -1 && (!next || !parse(next))) {
    console.error("usage: check-breaking-bump.mjs [--next <x.y.z>]");
    process.exit(2);
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
  console.log(
    `${result.version}: read ${result.sectionsRead} CHANGELOG sections; its notes are ${result.source}, ` +
      (result.breaking
        ? `which carries a breaking heading, and ${result.previous} -> ${result.version} is a ${result.level} bump.`
        : `with no breaking heading${result.level ? ` (${result.previous} -> ${result.version} is a ${result.level} bump)` : ""}.`),
  );
}
