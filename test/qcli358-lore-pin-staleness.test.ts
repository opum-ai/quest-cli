import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  compareVersions,
  evaluate,
  GATE_WORKFLOW,
  ISSUE_LABEL,
  issueBody,
  readPin,
  schemaDifferences,
  syncIssue,
} from "../scripts/lore-pin-staleness.mjs";

/**
 * QCLI-358, opum-doc ADR
 * detect-a-stale-lore-pin-without-touching-a-required-ci-context. The unit
 * half: every network edge (npm, npx, gh) is injected, so these run offline.
 * The real-lore measurements (current, behind, behind and schema-changing)
 * are recorded on the task, because they need the registry.
 */

const REPO = join(import.meta.dir, "..");
const read = (path: string) => readFile(join(REPO, path), "utf8");

const schemas = (entries: Record<string, string>) =>
  new Map(Object.entries(entries));

test("the pin is read from the gate workflow, exactly one, plain X.Y.Z", async () => {
  expect(readPin(await read(GATE_WORKFLOW))).toMatch(/^\d+\.\d+\.\d+$/);
  expect(() => readPin("run: echo nothing pinned")).toThrow(/found 0/);
  expect(() =>
    readPin(
      "npm install -g @opum-ai/lore@0.9.3\nnpm install -g @opum-ai/lore@0.11.0",
    ),
  ).toThrow(/found 2/);
  expect(() => readPin("npm install -g @opum-ai/lore@0.12.0-rc.1")).toThrow(
    /not X.Y.Z/,
  );
});

test("versions compare numerically, not lexically", () => {
  expect(compareVersions("0.9.3", "0.11.0")).toBeLessThan(0);
  expect(compareVersions("0.11.0", "0.9.3")).toBeGreaterThan(0);
  expect(compareVersions("0.11.0", "0.11.0")).toBe(0);
});

test("current stays quiet: no schemas are exported and the verdict is current", async () => {
  let exports = 0;
  const schemasAt = async () => {
    exports++;
    return schemas({});
  };
  for (const [pin, newest] of [
    ["0.11.0", "0.11.0"],
    ["0.12.0", "0.11.0"],
  ])
    expect(await evaluate({ pin, newest, schemasAt })).toEqual({
      state: "current",
      pin,
      newest,
    });
  expect(exports).toBe(0);
});

test("behind is told apart from behind AND schema-changing", async () => {
  const same = await evaluate({
    pin: "0.9.2",
    newest: "0.9.3",
    schemasAt: async () => schemas({ "adr.schema.json": "{}" }),
  });
  expect(same).toMatchObject({ state: "behind", schemaChanging: false });

  const changed = await evaluate({
    pin: "0.9.3",
    newest: "0.11.0",
    schemasAt: async (version: string) =>
      version === "0.11.0"
        ? schemas({ "adr.schema.json": "{new}", "constants.schema.json": "{}" })
        : schemas({ "adr.schema.json": "{old}" }),
  });
  expect(changed).toMatchObject({
    state: "behind",
    schemaChanging: true,
    differences: ["adr.schema.json", "constants.schema.json"],
    schemasRead: { "0.9.3": 1, "0.11.0": 2 },
  });
  // Only the schema-changing case asks for the two-step bump.
  expect(issueBody(changed)).toContain("Regenerate the schemas");
  expect(issueBody(same)).not.toContain("Regenerate the schemas");
});

test("a removed schema counts as a difference", () => {
  expect(
    schemaDifferences(
      schemas({ "a.json": "1", "b.json": "2" }),
      schemas({ "a.json": "1" }),
    ),
  ).toEqual(["b.json"]);
});

/** A fake gh: answers `issue list` with `open`, records every call. */
function fakeGh(open: { number: number; title: string }[]) {
  const calls: string[][] = [];
  const run = async (command: string, args: readonly string[]) => {
    expect(command).toBe("gh");
    calls.push([...args]);
    return {
      stdout:
        args[0] === "issue" && args[1] === "list" ? JSON.stringify(open) : "",
      stderr: "",
    };
  };
  return { run, calls };
}

const behind = {
  state: "behind",
  pin: "0.9.3",
  newest: "0.11.0",
  schemaChanging: true,
  differences: ["adr.schema.json"],
  schemasRead: { "0.9.3": 8, "0.11.0": 10 },
} as const;

test("behind with nothing open opens ONE labelled issue", async () => {
  const gh = fakeGh([]);
  expect(await syncIssue(behind, gh)).toBe("opened a new issue");
  const created = gh.calls.filter(([a, b]) => a === "issue" && b === "create");
  expect(created).toHaveLength(1);
  expect(created[0]).toContain(ISSUE_LABEL);
});

test("behind with one open updates it in place, and closes duplicates", async () => {
  const gh = fakeGh([
    { number: 7, title: "lore pin is behind: 0.9.3 -> 0.10.0" },
    { number: 9, title: "stray" },
  ]);
  expect(await syncIssue(behind, gh)).toBe("updated #7, closed 1 duplicate(s)");
  expect(gh.calls.some(([a, b]) => a === "issue" && b === "create")).toBe(
    false,
  );
  expect(gh.calls).toContainEqual(expect.arrayContaining(["edit", "7"]));
  expect(gh.calls).toContainEqual(expect.arrayContaining(["close", "9"]));
});

test("current closes an open issue, and does nothing when none is open", async () => {
  const current = {
    state: "current",
    pin: "0.11.0",
    newest: "0.11.0",
  } as const;
  const withOpen = fakeGh([{ number: 7, title: "x" }]);
  expect(await syncIssue(current, withOpen)).toBe("closed #7");
  const none = fakeGh([]);
  expect(await syncIssue(current, none)).toBe("nothing open, nothing to do");
  expect(none.calls).toHaveLength(1); // the list read, and nothing else
});

test("no required context reads the network for this: the workflow is schedule-only", async () => {
  const workflow = await read(".github/workflows/lore-pin-staleness.yml");
  const on = workflow.slice(
    workflow.indexOf("\non:"),
    workflow.indexOf("\npermissions:"),
  );
  expect(on).toContain("schedule:");
  expect(on).toContain("workflow_dispatch:");
  expect(on).not.toMatch(/pull_request|push:/);
  // And the gate itself never runs the detector or reads npm's latest.
  const gate = await read(GATE_WORKFLOW);
  expect(gate).not.toContain("node scripts/lore-pin-staleness");
  expect(gate).not.toMatch(/npm view/);
});
