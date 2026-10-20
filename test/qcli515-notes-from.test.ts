import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { type ExecFile, notesCommitFrom } from "../scripts/github-release.mjs";

/**
 * QCLI-515 (opum-doc DEC-204 (3)): `promote-release.mjs --notes-from <sha>`
 * moves only where the release notes are read, and only to a CHANGELOG-only
 * descendant of the tag's commit. Each refusal is proved by name, and so is
 * the accepting case, so a gate that refuses everything cannot pass.
 */

const TAG = "053d8595f2caa34b04abc451d711e62fff5314b4";
const GOOD = "ce33f6d50cd193d2673ceede40fc4e89d5549c99";

const compareReturning =
  (answer: unknown): ExecFile =>
  async (_file, args) => {
    // The compare is addressed tag...sha, never the other way round.
    expect(args.at(-1)).toBe(
      `repos/opum-ai/quest-cli/compare/${TAG}...${GOOD}`,
    );
    return { stdout: JSON.stringify(answer) };
  };

const changed = (filename: string, extra: object = {}) => ({
  filename,
  status: "modified",
  ...extra,
});

test("accepted: a descendant whose net diff is CHANGELOG.md alone", async () => {
  const outcome = await notesCommitFrom(GOOD, TAG, {
    execFile: compareReturning({
      status: "ahead",
      files: [changed("CHANGELOG.md")],
    }),
  });
  expect(outcome).toEqual({ ok: true, commit: GOOD, tagCommit: TAG });
});

test("refused: a descendant that also touches another file names that file", async () => {
  const outcome = await notesCommitFrom(GOOD, TAG, {
    execFile: compareReturning({
      status: "ahead",
      files: [
        changed("CHANGELOG.md"),
        changed("src/application/tasks/tasks.ts"),
      ],
    }),
  });
  expect(outcome.ok).toBe(false);
  if (!outcome.ok) {
    expect(outcome.detail).toContain("src/application/tasks/tasks.ts");
    expect(outcome.detail).not.toContain("CHANGELOG.md,");
  }
});

test("refused: a sha that does not descend from the tag commit, by status", async () => {
  for (const status of ["diverged", "behind", "identical"]) {
    const outcome = await notesCommitFrom(GOOD, TAG, {
      execFile: compareReturning({ status, files: [changed("CHANGELOG.md")] }),
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.detail).toContain("does not descend");
      expect(outcome.detail).toContain(JSON.stringify(status));
    }
  }
});

test("refused: a rename onto CHANGELOG.md, and a CHANGELOG.md that was added", async () => {
  for (const file of [
    changed("CHANGELOG.md", { status: "renamed", previous_filename: "OLD.md" }),
    changed("CHANGELOG.md", { status: "added" }),
  ]) {
    const outcome = await notesCommitFrom(GOOD, TAG, {
      execFile: compareReturning({ status: "ahead", files: [file] }),
    });
    expect(outcome.ok).toBe(false);
  }
});

test("refused: an empty, missing or truncated file list is not trusted", async () => {
  const truncated = Array.from({ length: 300 }, () => changed("CHANGELOG.md"));
  for (const files of [[], undefined, truncated]) {
    const outcome = await notesCommitFrom(GOOD, TAG, {
      execFile: compareReturning({ status: "ahead", files }),
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.detail).toContain("changed-file list");
  }
});

test("refused: anything but a full 40-hex commit, and the tag's own commit", async () => {
  const neverCalled: ExecFile = async () => {
    throw new Error("the compare must not run");
  };
  for (const sha of ["dev", "v0.14.1", "ce33f6d", GOOD.toUpperCase(), ""]) {
    const outcome = await notesCommitFrom(sha, TAG, { execFile: neverCalled });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.detail).toContain("40-hex");
  }
  const own = await notesCommitFrom(TAG, TAG, { execFile: neverCalled });
  expect(own.ok).toBe(false);
  if (!own.ok) expect(own.detail).toContain("the tag's own commit");
});

test("refused: a compare that cannot be read says so and does not default", async () => {
  const outcome = await notesCommitFrom(GOOD, TAG, {
    execFile: async () => {
      throw Object.assign(new Error("boom"), {
        stderr: "gh: Not Found (HTTP 404)\n",
      });
    },
  });
  expect(outcome.ok).toBe(false);
  if (!outcome.ok) expect(outcome.detail).toContain("Not Found (HTTP 404)");
});

test("wiring: only the notes read moves; the bundle gate stays on the tag peel", () => {
  const source = readFileSync(
    new URL("../scripts/promote-release.mjs", import.meta.url),
    "utf8",
  );
  expect(source).toContain("releaseNotesFor(version, { commit: notesCommit })");
  expect(source).toContain("notesCommitFrom(notesFrom, peeled.commit)");
  // The qualified-bundle gate is still keyed to the tag peel.
  expect(source).toMatch(/commit: peeled\.commit,/);
  // The flag defaults to the tag peel when it is absent.
  expect(source).toContain("let notesCommit = peeled.commit;");
});
