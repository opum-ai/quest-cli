import { expect, test } from "bun:test";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  checkBreakingBump,
  checkPairBreakingBump,
  LORE,
  readLoreChangelog,
} from "../scripts/check-breaking-bump.mjs";

/**
 * QCLI-403 (opum-doc
 * docs/adr/gate-release-prep-on-a-breaking-changelog-entry-at-a-patch-bump.md,
 * Consequences). Lore and quest share one version, so a breaking heading in
 * lore-cli's notes for the paired version forces the PAIR past a patch bump,
 * even when quest's own notes carry none. The pair form reads lore's
 * CHANGELOG by ref and fails closed when it cannot. Every GitHub read is
 * injected, so these run offline.
 */

const SHA = "a".repeat(40);

// quest's own format: plain headings, no breaking section.
const QUEST_CLEAN = [
  "# Changelog",
  "",
  "## Unreleased",
  "",
  "### Fixed",
  "",
  "- Something small.",
  "",
  "## 1.4.0 - 2026-09-01",
  "",
  "### Fixed",
  "",
  "- Something.",
].join("\n");

// lore-cli's format: Keep a Changelog brackets.
const LORE_BREAKING = [
  "# Changelog",
  "",
  "## [Unreleased]",
  "",
  "### Changed (breaking)",
  "",
  "- A lore envelope moved.",
  "",
  "## [1.4.0] - 2026-09-01",
  "",
  "### Fixed",
  "",
  "- Something.",
].join("\n");

const LORE_CLEAN = LORE_BREAKING.replace(
  "### Changed (breaking)",
  "### Changed",
);

async function questTree(version: string, changelog = QUEST_CLEAN) {
  // realpath: macOS tmpdir is a symlink (QCLI-404).
  const directory = await realpath(await mkdtemp(join(tmpdir(), "qcli403-")));
  await writeFile(join(directory, "package.json"), JSON.stringify({ version }));
  await writeFile(join(directory, "CHANGELOG.md"), changelog);
  return directory;
}

const served =
  (text: string) =>
  async ({ ref }: { ref: string }) => ({
    text,
    ref,
    sha: SHA,
  });

test("a breaking lore section refuses a patch bump of the pair and accepts a minor one (one quest tree)", async () => {
  const directory = await questTree("1.4.0");
  try {
    const patch = await checkPairBreakingBump({
      directory,
      next: "1.4.1",
      read: served(LORE_BREAKING),
    });
    expect(patch.quest.problems).toEqual([]);
    expect(patch.lore?.breaking).toBe(true);
    expect(patch.lore?.source).toBe("## [Unreleased]");
    expect(patch.problems).toHaveLength(1);
    expect(patch.problems[0]).toStartWith("lore (");
    expect(patch.problems[0]).toContain("1.4.0 -> 1.4.1 is a patch bump");
    expect(patch.problems[0]).toContain(`${LORE.repository}@main (${SHA})`);

    const minor = await checkPairBreakingBump({
      directory,
      next: "1.5.0",
      read: served(LORE_BREAKING),
    });
    expect(minor.problems).toEqual([]);
    expect(minor.lore?.level).toBe("minor");

    // Same quest tree, lore clean: the patch is fine.
    const clean = await checkPairBreakingBump({
      directory,
      next: "1.4.1",
      read: served(LORE_CLEAN),
    });
    expect(clean.problems).toEqual([]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("lore's finalized [x.y.z] section is read once it exists", async () => {
  const finalized = LORE_BREAKING.replace(
    "## [Unreleased]",
    "## [Unreleased]\n\n## [1.4.1] - 2026-09-02",
  );
  const directory = await questTree("1.4.1");
  try {
    const result = await checkPairBreakingBump({
      directory,
      read: served(finalized),
    });
    expect(result.lore?.source).toBe("## [1.4.1] - 2026-09-02");
    expect(result.lore?.previous).toBe("1.4.0");
    expect(result.problems.join("\n")).toContain("is a patch bump");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("an unreadable lore CHANGELOG refuses, naming the cause, never passing on nothing read", async () => {
  const directory = await questTree("1.4.0");
  try {
    for (const [error, sha] of [
      ["HTTP 404: Not Found (https://api.github.com/...)", SHA],
      ["HTTP 401: Bad credentials", null],
      ["error connecting to api.github.com", null],
    ] as const) {
      const result = await checkPairBreakingBump({
        directory,
        next: "1.5.0",
        read: async ({ ref }) => ({ text: null, ref, sha, error }),
      });
      expect(result.lore).toBeNull();
      expect(result.problems).toHaveLength(1);
      expect(result.problems[0]).toContain("could not be read");
      expect(result.problems[0]).toContain(error);
    }
    // A readable file with no version section is also nothing to compare.
    const empty = await checkPairBreakingBump({
      directory,
      next: "1.5.0",
      read: served("# Changelog\n\n## [Unreleased]\n\n- x\n"),
    });
    expect(empty.problems.join("\n")).toContain(
      "holds no parseable version section (1 ## sections read)",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the reader resolves the ref to a commit first, then reads the file AT that commit", async () => {
  const calls: string[][] = [];
  const run = async (_command: string, args: readonly string[]) => {
    calls.push([...args]);
    if (args[1]?.includes("/commits/")) return { stdout: `${SHA}\n` };
    return { stdout: LORE_CLEAN };
  };
  const read = await readLoreChangelog({ ref: "dev", execFile: run });
  expect(read).toEqual({ text: LORE_CLEAN, ref: "dev", sha: SHA });
  expect(calls[0]).toEqual([
    "api",
    `repos/${LORE.repository}/commits/dev`,
    "--jq",
    ".sha",
  ]);
  expect(calls[1]).toContain(
    `repos/${LORE.repository}/contents/CHANGELOG.md?ref=${SHA}`,
  );

  // A failing gh surfaces its first stderr line as the cause.
  const failing = await readLoreChangelog({
    execFile: async () => {
      throw Object.assign(new Error("exit 1"), {
        stderr: "gh: Not Found (HTTP 404)\nmore",
      });
    },
  });
  expect(failing).toEqual({
    text: null,
    ref: "main",
    sha: null,
    error: "gh: Not Found (HTTP 404)",
  });

  // A ref that answers something other than a commit sha is refused too.
  const odd = await readLoreChangelog({
    execFile: async () => ({ stdout: "null\n" }),
  });
  expect(odd.text).toBeNull();
  expect(odd.error).toContain("not a commit");
});

test("the quest-only check is unchanged by the pair form, and still offline", async () => {
  const directory = await questTree("1.4.0");
  try {
    const alone = await checkBreakingBump({ directory, next: "1.4.1" });
    const pair = await checkPairBreakingBump({
      directory,
      next: "1.4.1",
      read: served(LORE_BREAKING),
    });
    expect(pair.quest).toEqual(alone);
    expect(alone.problems).toEqual([]);
    expect(alone.source).toBe("## Unreleased");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
  // The source gate runs the quest-only form, with no network.
  const prepublish = await readFile(
    join(import.meta.dir, "..", "scripts", "qualification", "prepublish.mjs"),
    "utf8",
  );
  expect(prepublish).toContain('["run", "check:breaking-bump"]');
  expect(prepublish).not.toContain("--pair");
});

test("release.yml runs the pair form, after the version-parity gate and before the publish", async () => {
  const workflow = await readFile(
    join(import.meta.dir, "..", ".github", "workflows", "release.yml"),
    "utf8",
  );
  const parity = workflow.indexOf("version-parity.mjs --require");
  const pair = workflow.indexOf(
    "run: node scripts/check-breaking-bump.mjs --pair",
  );
  const publish = workflow.search(/^\s+npm publish "/m);
  expect(parity).toBeGreaterThan(-1);
  expect(pair).toBeGreaterThan(parity);
  expect(publish).toBeGreaterThan(pair);
});
