import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import {
  type ExecFile,
  ensureGitHubRelease,
} from "../scripts/github-release.mjs";

/**
 * QCLI-401, paired with lore-cli LCLI-622. QCLI-398's cut treated ANY
 * existing vX as done. It viewed only `tagName`, then marked it latest. So a
 * stale or hand-edited release passed as the one this CHANGELOG describes,
 * and a draft or prerelease vX would have been marked latest without anyone
 * looking at it. Both are now refused. They are never repaired, because
 * editing a published release is a decision for a person, not for a release
 * script.
 *
 * The refusal has to come BEFORE anything moves. promote-release.mjs calls
 * ensureGitHubRelease with `dryRun: true` on the dry run and on --promote
 * before any dist-tag moves, and refuses on `ok: false`. So each case is
 * asserted in dry-run mode as well as in the real mode.
 */

type Release = {
  tagName?: string;
  body?: string;
  isDraft?: boolean;
  isPrerelease?: boolean;
};

const existing = (release: Release) => {
  const calls: string[][] = [];
  const execFile: ExecFile = async (_file, args) => {
    calls.push([...args]);
    return {
      stdout:
        args[1] === "view"
          ? JSON.stringify({
              tagName: "v1.2.3",
              body: "Notes.\n",
              isDraft: false,
              isPrerelease: false,
              ...release,
            })
          : "",
    };
  };
  return { calls, execFile };
};

const modes = [
  { dryRun: true, latest: true },
  { dryRun: false, latest: true },
  { dryRun: false, latest: false },
] as const;

for (const [name, release, reason] of [
  ["notes that differ", { body: "Hand-edited.\n" }, "notes differ"],
  ["a draft", { isDraft: true }, "draft"],
  ["a prerelease", { isPrerelease: true }, "prerelease"],
] as const) {
  test(`an existing vX with ${name} is refused and never edited (QCLI-401)`, async () => {
    for (const mode of modes) {
      const { calls, execFile } = existing(release);
      const out = await ensureGitHubRelease({
        version: "1.2.3",
        notes: "Notes.",
        ...mode,
        execFile,
      });
      expect({ mode, ok: out.ok, action: out.action }).toEqual({
        mode,
        ok: false,
        action: "none",
      });
      expect(out.detail).toContain(reason);
      // Refused, not repaired: the view is the only call made.
      expect(calls.map((args) => args[1])).toEqual(["view"]);
    }
  });
}

test("the state is read in the one view call, not a second (QCLI-401)", async () => {
  const { calls, execFile } = existing({});
  await ensureGitHubRelease({ version: "1.2.3", notes: "Notes.", execFile });
  const views = calls.filter((args) => args[1] === "view");
  expect(views).toHaveLength(1);
  const fields = views[0]?.[views[0].indexOf("--json") + 1]?.split(",");
  expect(fields?.sort()).toEqual(
    ["body", "isDraft", "isPrerelease", "tagName"].sort(),
  );
});

test("matching notes still pass, including a CRLF-only and a trailing-whitespace difference (QCLI-401)", async () => {
  for (const body of ["Notes.", "Notes.\n", "Notes.\r\n", "\nNotes.\r\n\r\n"]) {
    const { calls, execFile } = existing({ body });
    const out = await ensureGitHubRelease({
      version: "1.2.3",
      notes: "Notes.",
      execFile,
    });
    expect({ body, ok: out.ok, action: out.action }).toEqual({
      body,
      ok: true,
      action: "marked-latest",
    });
    expect(calls.map((args) => args[1])).toEqual(["view", "edit"]);
  }
  // Multi-line notes: CRLF throughout, as GitHub may store a body.
  const { execFile } = existing({ body: "One.\r\n\r\n- two\r\n" });
  const out = await ensureGitHubRelease({
    version: "1.2.3",
    notes: "One.\n\n- two",
    dryRun: true,
    execFile,
  });
  expect(out).toMatchObject({ ok: true, action: "would-mark-latest" });
});

test("a view whose output is not the expected JSON is an unreadable state, not a pass (QCLI-401)", async () => {
  for (const stdout of ["", "not json", "[]", "null"]) {
    const calls: string[][] = [];
    const execFile: ExecFile = async (_file, args) => {
      calls.push([...args]);
      return { stdout: args[1] === "view" ? stdout : "" };
    };
    const out = await ensureGitHubRelease({
      version: "1.2.3",
      notes: "Notes.",
      execFile,
    });
    expect({ stdout, ok: out.ok }).toEqual({ stdout, ok: false });
    expect(calls.map((args) => args[1])).toEqual(["view"]);
  }
});

test("promote-release refuses on the pre-move check's ok:false before the dry-run exit and any tag move (QCLI-401)", () => {
  // The refusal above only protects `latest` if promote-release acts on it
  // before moving anything. That wiring is QCLI-398's; pin that it still
  // gates on `planned.ok` ahead of the dry-run exit and the first move.
  const main =
    readFileSync(
      new URL("../scripts/promote-release.mjs", import.meta.url),
      "utf8",
    ).split("async function main(")[1] ?? "";
  const gate = main.indexOf("if (!planned.ok)");
  expect(gate).toBeGreaterThan(main.indexOf("dryRun: true"));
  expect(gate).toBeLessThan(main.indexOf("if (!act) {"));
  expect(gate).toBeLessThan(main.indexOf("await promote({"));
  expect(main.slice(gate, main.indexOf("if (!act) {"))).toContain(
    "process.exit(1)",
  );
});
