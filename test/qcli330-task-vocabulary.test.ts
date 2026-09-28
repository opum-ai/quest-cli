import { afterAll, expect, test } from "bun:test";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  resolveVocabularyValue,
  VocabularyValueError,
} from "../src/domain/tasks/vocabulary.ts";

/**
 * QCLI-330, ruled by opum-doc ADR "Make quest's type and priority vocabulary
 * workspace-configured, with a canonical default", with the orchestrator's
 * option-A ruling of 2026-09-28: a workspace with no [tasks] table is OPEN.
 *
 * Each test names the acceptance criterion (or ruling constraint) it
 * exercises. Every CLI case runs the real CLI against a fresh temp
 * workspace; the temp root is realpath'd because on macOS tmpdir() sits
 * behind the /var -> /private/var symlink (QCLI-404).
 */

const MAIN = new URL("../src/cli/main.ts", import.meta.url).pathname;
const ACTOR = ["--actor", "person-1", "--actor-kind", "human"] as const;
const DEFAULT_TYPES = [
  "feature",
  "bug",
  "chore",
  "docs",
  "enhancement",
  "spike",
];
const DEFAULT_PRIORITIES = ["low", "medium", "high", "critical"];
const roots: string[] = [];

afterAll(async () => {
  for (const root of roots) await rm(root, { recursive: true, force: true });
});

function quest(cwd: string, args: readonly string[]) {
  const child = Bun.spawnSync(["bun", MAIN, ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    exitCode: child.exitCode ?? 0,
    stdout: child.stdout ? child.stdout.toString() : "",
    stderr: child.stderr ? child.stderr.toString() : "",
  };
}

async function tempRoot(): Promise<string> {
  const root = await realpath(await mkdtemp(join(tmpdir(), "qcli330-")));
  roots.push(root);
  return root;
}

/** A freshly initialized workspace: init's own default [tasks] table. */
async function workspace(): Promise<string> {
  const root = await tempRoot();
  await Bun.spawn(["git", "init", "-q"], { cwd: root }).exited;
  // Positive control: every case below depends on init having run.
  expect(quest(root, ["init", "--json"]).exitCode).toBe(0);
  return root;
}

const tomlPath = (root: string) => join(root, ".quest", "workspace.toml");

async function writeToml(root: string, content: string) {
  await writeFile(tomlPath(root), content);
}

function create(root: string, title: string, ...extra: string[]) {
  return quest(root, ["task", "create", title, ...extra, ...ACTOR, "--json"]);
}

function manifestVocabulary(root: string) {
  const result = quest(root, ["manifest", "--json"]);
  expect(result.exitCode).toBe(0);
  return JSON.parse(result.stdout).data.taskVocabulary;
}

test("AC1 AC2: a fresh init writes the canonical default [tasks] table, and the type set omits `task`", async () => {
  const root = await workspace();
  const toml = await readFile(tomlPath(root), "utf8");
  expect(toml).toContain(
    '[tasks]\ntypes = ["feature", "bug", "chore", "docs", "enhancement", "spike"]\npriorities = ["low", "medium", "high", "critical"]\n',
  );
  expect(DEFAULT_TYPES).not.toContain("task");
});

test("AC4: the manifest reports a configured workspace's sets under data.taskVocabulary", async () => {
  const root = await workspace();
  expect(manifestVocabulary(root)).toEqual({
    types: DEFAULT_TYPES,
    priorities: DEFAULT_PRIORITIES,
  });
  // Inside data, never a new top-level key: the envelope order is unchanged.
  expect(
    Object.keys(JSON.parse(quest(root, ["manifest", "--json"]).stdout)),
  ).toEqual(["schemaVersion", "contractVersion", "kind", "data", "principal"]);
});

test("AC4: an OPEN field is null in the manifest, never an empty list -- unconfigured and one-field alike", async () => {
  const root = await workspace();
  await writeToml(root, "schemaVersion = 1\n");
  expect(manifestVocabulary(root)).toEqual({ types: null, priorities: null });
  await writeToml(root, 'schemaVersion = 1\n\n[tasks]\ntypes = ["story"]\n');
  expect(manifestVocabulary(root)).toEqual({
    types: ["story"],
    priorities: null,
  });
});

test("AC4: the manifest outside any workspace reports both fields open", async () => {
  const root = await tempRoot();
  expect(manifestVocabulary(root)).toEqual({ types: null, priorities: null });
});

test("AC3: task create refuses an out-of-set type with exit 6, names the allowed set, and writes nothing", async () => {
  const root = await workspace();
  const refused = create(root, "a", "--type", "task");
  expect(refused.exitCode).toBe(6);
  expect(JSON.parse(refused.stderr)).toMatchObject({
    error_type: "validation",
    input: { field: "type", value: "task", allowed: DEFAULT_TYPES },
  });
  const listed = JSON.parse(quest(root, ["task", "list", "--json"]).stdout);
  expect(listed.data).toEqual([]);
});

test("AC3: task create stores a case-only difference in the configured spelling", async () => {
  const root = await workspace();
  const created = create(root, "a", "--type", "Bug", "--priority", "HIGH");
  expect(created.exitCode).toBe(0);
  expect(JSON.parse(created.stdout).data).toMatchObject({
    type: "bug",
    priority: "high",
  });
});

test("AC3: task edit refuses an out-of-set priority and leaves the record byte-identical", async () => {
  const root = await workspace();
  expect(create(root, "a", "--priority", "low").exitCode).toBe(0);
  const record = join(root, ".quest", "tasks", "T-1.json");
  const before = await readFile(record, "utf8");
  const refused = quest(root, [
    "task",
    "edit",
    "T-1",
    "--priority",
    "urgent",
    ...ACTOR,
    "--json",
  ]);
  expect(refused.exitCode).toBe(6);
  expect(JSON.parse(refused.stderr).input).toMatchObject({
    field: "priority",
    value: "urgent",
  });
  expect(await readFile(record, "utf8")).toBe(before);
});

test("AC3: an edit that does not write type or priority lands on a record holding a legacy value", async () => {
  const root = await workspace();
  await writeToml(root, "schemaVersion = 1\n");
  expect(create(root, "a", "--type", "task").exitCode).toBe(0);
  await writeToml(
    root,
    `schemaVersion = 1\n\n[tasks]\ntypes = ${JSON.stringify(DEFAULT_TYPES)}\n`,
  );
  const edited = quest(root, [
    "task",
    "edit",
    "T-1",
    "--title",
    "renamed",
    ...ACTOR,
    "--json",
  ]);
  expect(edited.exitCode).toBe(0);
  expect(JSON.parse(edited.stdout).data).toMatchObject({
    title: "renamed",
    type: "task",
  });
});

test("AC3: task edit-batch fails only the item carrying an out-of-set value", async () => {
  const root = await workspace();
  expect(create(root, "a").exitCode).toBe(0);
  const operations = join(root, "ops.jsonl");
  await writeFile(
    operations,
    [
      { reference: "T-1", operationId: "o1", patch: { priority: "CRITICAL" } },
      { reference: "T-1", operationId: "o2", patch: { type: "nope" } },
      { reference: "T-1", operationId: "o3", patch: { title: "after" } },
    ]
      .map((item) => JSON.stringify(item))
      .join("\n"),
  );
  const result = quest(root, [
    "task",
    "edit-batch",
    "--file",
    operations,
    ...ACTOR,
    "--json",
  ]);
  const items = JSON.parse(result.stdout).data.items;
  expect(items.map((item: { kind: string }) => item.kind)).toEqual([
    "updated",
    "error",
    "updated",
  ]);
  expect(items[0].task.priority).toBe("critical");
  expect(items[1].message).toContain("task_vocabulary_value_invalid");
  expect(items[2].task).toMatchObject({ title: "after", priority: "critical" });
});

test("AC3 (option A): a workspace with no [tasks] table accepts any value, verbatim", async () => {
  const root = await workspace();
  await writeToml(root, "schemaVersion = 1\n");
  const created = create(
    root,
    "a",
    "--type",
    "anything",
    "--priority",
    "Whatever",
  );
  expect(created.exitCode).toBe(0);
  expect(JSON.parse(created.stdout).data).toMatchObject({
    type: "anything",
    priority: "Whatever",
  });
});

test("AC3: an open vocabulary (the default for any caller that reads no workspace.toml, migration included) passes every value through", () => {
  expect(resolveVocabularyValue("type", "task", {})).toBe("task");
  expect(resolveVocabularyValue("priority", "Medium", {})).toBe("Medium");
  expect(() =>
    resolveVocabularyValue("type", "task", { types: ["bug"] }),
  ).toThrow(VocabularyValueError);
});

test("AC6: doctor reports each off-set value in every location, marks a case-only difference, and rewrites nothing", async () => {
  const root = await workspace();
  await writeToml(root, "schemaVersion = 1\n");
  expect(
    create(root, "active", "--type", "task", "--priority", "High").exitCode,
  ).toBe(0);
  expect(create(root, "done", "--type", "spike").exitCode).toBe(0);
  expect(
    quest(root, ["task", "start", "T-2", ...ACTOR, "--json"]).exitCode,
  ).toBe(0);
  expect(
    quest(root, ["task", "complete", "T-2", ...ACTOR, "--json"]).exitCode,
  ).toBe(0);
  await writeToml(
    root,
    `schemaVersion = 1\n\n[tasks]\ntypes = ["bug"]\npriorities = ${JSON.stringify(DEFAULT_PRIORITIES)}\n`,
  );
  const active = join(root, ".quest", "tasks", "T-1.json");
  const completed = join(root, ".quest", "completed", "T-2.json");
  const before = [
    await readFile(active, "utf8"),
    await readFile(completed, "utf8"),
  ];

  const doctor = quest(root, ["doctor", "--json"]);
  expect(doctor.exitCode).toBe(0);
  const data = JSON.parse(doctor.stdout).data;
  expect(data.healthy).toBe(false);
  const issues = data.issues
    .filter(
      (issue: { code: string }) => issue.code === "task_vocabulary_off_set",
    )
    .map(({ hint, ...rest }: { hint: string }) => {
      expect(hint.length).toBeGreaterThan(0);
      return rest;
    });
  expect(issues).toEqual([
    {
      code: "task_vocabulary_off_set",
      taskId: "T-1",
      field: "type",
      value: "task",
    },
    {
      code: "task_vocabulary_off_set",
      taskId: "T-1",
      field: "priority",
      value: "High",
      normalizesTo: "high",
    },
    {
      code: "task_vocabulary_off_set",
      taskId: "T-2",
      field: "type",
      value: "spike",
    },
  ]);
  expect([
    await readFile(active, "utf8"),
    await readFile(completed, "utf8"),
  ]).toEqual(before);
});

test("AC6 (option A): doctor on a workspace with no [tasks] table reports no vocabulary issue", async () => {
  const root = await workspace();
  await writeToml(root, "schemaVersion = 1\n");
  expect(create(root, "a", "--type", "anything").exitCode).toBe(0);
  expect(JSON.parse(quest(root, ["doctor", "--json"]).stdout).data).toEqual({
    healthy: true,
    issues: [],
  });
});

test("ruling constraint 2: re-running init ADDS the default to a workspace that configures neither field", async () => {
  const root = await workspace();
  await writeToml(root, 'schemaVersion = 1\nname = "Kept"\n');
  expect(quest(root, ["init", "--reconfigure", "--json"]).exitCode).toBe(0);
  expect(manifestVocabulary(root)).toEqual({
    types: DEFAULT_TYPES,
    priorities: DEFAULT_PRIORITIES,
  });
  expect(await readFile(tomlPath(root), "utf8")).toContain('name = "Kept"');
});

test("ruling constraint 2: re-running init never changes a configured set, including one that configures a single field", async () => {
  const root = await workspace();
  await writeToml(
    root,
    'schemaVersion = 1\n\n[tasks]\ntypes = ["story", "defect"]\n',
  );
  expect(quest(root, ["init", "--reconfigure", "--json"]).exitCode).toBe(0);
  expect(
    quest(root, ["init", "--reconfigure", "--name", "Renamed", "--json"])
      .exitCode,
  ).toBe(0);
  expect(manifestVocabulary(root)).toEqual({
    types: ["story", "defect"],
    priorities: null,
  });
});

test("a malformed [tasks] table fails closed instead of reading as open", async () => {
  const root = await workspace();
  for (const [table, fragment] of [
    ["types = []", "must not be empty"],
    ['types = ["Bug", "bug"]', "twice"],
    ["priorities = [1]", "non-empty strings"],
    ['types = "bug"', "array of strings"],
  ] as const) {
    await writeToml(root, `schemaVersion = 1\n\n[tasks]\n${table}\n`);
    const refused = create(root, "a", "--type", "anything");
    expect(refused.exitCode).toBe(6);
    expect(JSON.parse(refused.stderr).message).toContain(fragment);
  }
  // Nothing was written by any of the refused creates.
  await writeToml(root, "schemaVersion = 1\n");
  expect(
    JSON.parse(quest(root, ["task", "list", "--json"]).stdout).data,
  ).toEqual([]);
});
