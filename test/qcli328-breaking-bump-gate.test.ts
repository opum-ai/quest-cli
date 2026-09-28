import { expect, test } from "bun:test";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  breakingBumpProblems,
  bumpLevel,
} from "../scripts/check-breaking-bump.mjs";

/**
 * QCLI-328 (opum-doc
 * docs/adr/gate-release-prep-on-a-breaking-changelog-entry-at-a-patch-bump.md).
 * 0.6.2's entry correctly called its envelope change breaking, and it
 * shipped as a patch. The gate checks the CHANGELOG against the chosen
 * number. It is proven both ways on ONE tree: the same CHANGELOG is rejected
 * at a patch bump and accepted at a minor bump.
 */

const SCRIPT = new URL("../scripts/check-breaking-bump.mjs", import.meta.url)
  .pathname;

const BREAKING_UNRELEASED = [
  "# Changelog",
  "",
  "## Unreleased",
  "",
  "### Changed (breaking)",
  "",
  "- An envelope moved.",
  "",
  "## 1.4.0 - 2026-09-01",
  "",
  "### Fixed",
  "",
  "- Something.",
].join("\n");

test("bump levels", () => {
  expect(bumpLevel("1.4.0", "1.4.1")).toBe("patch");
  expect(bumpLevel("1.4.0", "1.5.0")).toBe("minor");
  expect(bumpLevel("0.10.0", "0.11.0")).toBe("minor");
  expect(bumpLevel("1.4.0", "2.0.0")).toBe("major");
});

test("bump PR, notes still under Unreleased: patch is refused, minor and major pass (one tree)", () => {
  const patch = breakingBumpProblems(BREAKING_UNRELEASED, "1.4.1");
  expect(patch).toMatchObject({
    source: "## Unreleased",
    previous: "1.4.0",
    level: "patch",
    breaking: true,
  });
  expect(patch.problems).toHaveLength(1);
  expect(patch.problems[0]).toContain("1.4.0 -> 1.4.1 is a patch bump");
  for (const version of ["1.5.0", "2.0.0"])
    expect(breakingBumpProblems(BREAKING_UNRELEASED, version).problems).toEqual(
      [],
    );
});

test("after the changelog is finalized: the version's own section is read against the heading below it", () => {
  const finalized = BREAKING_UNRELEASED.replace(
    "## Unreleased",
    "## Unreleased\n\n## 1.4.1 - 2026-09-02",
  );
  const patch = breakingBumpProblems(finalized, "1.4.1");
  expect(patch).toMatchObject({
    source: "## 1.4.1 - 2026-09-02",
    previous: "1.4.0",
    breaking: true,
  });
  expect(patch.problems).toHaveLength(1);
  const minor = finalized.replace("## 1.4.1 -", "## 1.5.0 -");
  expect(breakingBumpProblems(minor, "1.5.0").problems).toEqual([]);
});

test("no breaking heading: a patch bump passes", () => {
  const plain = BREAKING_UNRELEASED.replace(
    "### Changed (breaking)",
    "### Fixed",
  );
  const result = breakingBumpProblems(plain, "1.4.1");
  expect(result).toMatchObject({ breaking: false, level: "patch" });
  expect(result.problems).toEqual([]);
});

test("a breaking heading in an OLDER section does not bind the current bump", () => {
  // Between releases, package.json names the last release and its own section
  // is what gets checked. An earlier breaking section is history.
  const history = [
    "## Unreleased",
    "",
    "## 1.5.1 - 2026-09-03",
    "",
    "### Fixed",
    "",
    "## 1.5.0 - 2026-09-02",
    "",
    "### Changed (breaking)",
    "",
    "## 1.4.0 - 2026-09-01",
  ].join("\n");
  expect(breakingBumpProblems(history, "1.5.1").problems).toEqual([]);
});

test("the real CHANGELOG: the current version passes, and 0.6.2 -- the motivating case -- is caught", async () => {
  const real = await readFile(
    new URL("../CHANGELOG.md", import.meta.url),
    "utf8",
  );
  const version = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ).version;
  const current = breakingBumpProblems(real, version);
  expect(current.sectionsRead).toBeGreaterThan(5);
  expect(current.problems).toEqual([]);
  // Positive control on real history: the gate would have refused 0.6.2.
  // The 0.6.2 entry itself is not rewritten (ADR).
  const incident = breakingBumpProblems(real, "0.6.2");
  expect(incident).toMatchObject({
    previous: "0.6.1",
    level: "patch",
    breaking: true,
  });
  expect(incident.problems).toHaveLength(1);
});

test("the CLI exits 1 on a patch bump over a breaking section and 0 on a minor one, same files", async () => {
  // realpath: on macOS tmpdir() is under /var, a symlink to /private/var, and
  // the script only runs its CLI when argv[1] resolves to its own URL.
  const dir = await realpath(await mkdtemp(join(tmpdir(), "qcli328-")));
  try {
    await writeFile(join(dir, "CHANGELOG.md"), BREAKING_UNRELEASED);
    const run = async (version: string) => {
      await writeFile(join(dir, "package.json"), JSON.stringify({ version }));
      // The script reads the checkout it lives in; copy it next to the files.
      const copy = join(dir, "check.mjs");
      await writeFile(
        copy,
        (await readFile(SCRIPT, "utf8")).replace(
          'new URL("..", import.meta.url)',
          'new URL(".", import.meta.url)',
        ),
      );
      const child = Bun.spawnSync(["node", copy], {
        stdout: "pipe",
        stderr: "pipe",
      });
      return { exitCode: child.exitCode, stderr: child.stderr.toString() };
    };
    const patch = await run("1.4.1");
    expect(patch.exitCode).toBe(1);
    expect(patch.stderr).toContain("patch bump");
    expect((await run("1.5.0")).exitCode).toBe(0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
