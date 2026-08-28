import { expect, test } from "bun:test";
import {
  trackerConformanceFixtures,
  trackerTaskFixture,
} from "../../../src/contract/tracker/fixtures.ts";
import {
  QuestTrackerClient,
  type TrackerProcessRunner,
} from "../../../src/contract/tracker/index.ts";

function fixtureRunner(): {
  readonly runner: TrackerProcessRunner;
  readonly calls: string[][];
} {
  const calls: string[][] = [];
  const runner: TrackerProcessRunner = {
    async run(argv) {
      calls.push([...argv]);
      const first = argv[0] ?? "";
      const key = ["manifest", "search"].includes(first)
        ? first
        : argv.slice(0, 2).join(" ");
      if (argv[0] === "--version")
        return {
          exitCode: 0,
          stdout: trackerConformanceFixtures.versionOutput,
          stderr: "",
        };
      const records: Record<string, unknown> = {
        manifest: trackerConformanceFixtures.manifest,
        "task status-flow": trackerConformanceFixtures.statusFlow,
        "task list": trackerConformanceFixtures.list,
        "task view": trackerConformanceFixtures.view,
        search: trackerConformanceFixtures.search,
        "task create": trackerConformanceFixtures.created,
        "task edit": trackerConformanceFixtures.updated,
      };
      return { exitCode: 0, stdout: JSON.stringify(records[key]), stderr: "" };
    },
  };
  return { runner, calls };
}

test("public conformance fixtures exercise probe, complete read surface, and argv-safe writes", async () => {
  const { runner, calls } = fixtureRunner();
  const client = new QuestTrackerClient(runner, 17);
  await expect(client.probe()).resolves.toMatchObject({ version: "0.1.0" });
  await expect(client.statusFlow()).resolves.toMatchObject({
    statuses: ["To Do", "In Progress", "Done"],
  });
  await expect(
    client.list({ status: "To Do", labels: ["doc:story"] }),
  ).resolves.toHaveLength(1);
  await expect(client.view("T-1")).resolves.toMatchObject({ id: "T-1" });
  await expect(client.search("Conformance task")).resolves.toHaveLength(1);
  await expect(
    client.create(
      { title: "x; not shell", labels: ["doc:story"] },
      { id: "person-1", kind: "human" },
    ),
  ).resolves.toMatchObject({ id: "T-1" });
  await expect(
    client.edit(
      "T-1",
      { addLabels: ["two"] },
      { id: "bot-1", kind: "delegated-agent", accountableHumanId: "person-1" },
    ),
  ).resolves.toMatchObject({ id: "T-1" });
  expect(calls.find((argv) => argv.includes("x; not shell"))).toEqual(
    expect.arrayContaining(["task", "create", "x; not shell"]),
  );
});

test("the client rejects timeouts, schema drift, and actor-free writes deterministically", async () => {
  const timeout: TrackerProcessRunner = {
    async run() {
      return { exitCode: 0, stdout: "", stderr: "", timedOut: true };
    },
  };
  await expect(new QuestTrackerClient(timeout).list()).rejects.toMatchObject({
    error_type: "drift",
  });
  const { runner } = fixtureRunner();
  await expect(
    new QuestTrackerClient(runner).create({ title: "no actor" }),
  ).rejects.toMatchObject({ error_type: "denied" });
});

test("the client rejects malformed success payloads as contract drift", async () => {
  const malformed: TrackerProcessRunner = {
    async run(argv) {
      return argv[0] === "--version"
        ? { exitCode: 0, stdout: "0.1.0\n", stderr: "" }
        : {
            exitCode: 0,
            stdout: JSON.stringify({
              schemaVersion: 1,
              kind: "task.list",
              data: [{ id: "T-1", title: "missing fields" }],
            }),
            stderr: "",
          };
    },
  };
  await expect(new QuestTrackerClient(malformed).list()).rejects.toMatchObject({
    error_type: "drift",
  });
});

function viewFixtureRunner(viewData: unknown): TrackerProcessRunner {
  return {
    async run(argv) {
      if (argv[0] === "--version")
        return {
          exitCode: 0,
          stdout: trackerConformanceFixtures.versionOutput,
          stderr: "",
        };
      const first = argv[0] ?? "";
      const key = ["manifest", "search"].includes(first)
        ? first
        : argv.slice(0, 2).join(" ");
      const records: Record<string, unknown> = {
        manifest: trackerConformanceFixtures.manifest,
        "task status-flow": trackerConformanceFixtures.statusFlow,
        "task list": trackerConformanceFixtures.list,
        "task view": {
          schemaVersion: 1,
          kind: "task.view",
          data: viewData,
        },
        search: trackerConformanceFixtures.search,
        "task create": trackerConformanceFixtures.created,
        "task edit": trackerConformanceFixtures.updated,
      };
      return { exitCode: 0, stdout: JSON.stringify(records[key]), stderr: "" };
    },
  };
}

test("the tracker contract accepts legacy string checklists and checked item lists and rejects malformed items", async () => {
  const base = { ...trackerTaskFixture };
  await expect(
    new QuestTrackerClient(viewFixtureRunner(base)).view("T-1"),
  ).resolves.toMatchObject({
    acceptanceCriteria: [{ index: 0, text: "round-trip", checked: false }],
  });
  const legacy = {
    ...base,
    acceptanceCriteria: ["legacy"],
    definitionOfDone: [],
  };
  await expect(
    new QuestTrackerClient(viewFixtureRunner(legacy)).view("T-1"),
  ).resolves.toMatchObject({ acceptanceCriteria: ["legacy"] });
  const missingChecked = {
    ...base,
    acceptanceCriteria: [{ index: 0, text: "x" }],
  };
  await expect(
    new QuestTrackerClient(viewFixtureRunner(missingChecked)).view("T-1"),
  ).rejects.toMatchObject({ error_type: "drift" });
  const badIndex = {
    ...base,
    acceptanceCriteria: [{ index: -1, text: "x", checked: false }],
  };
  await expect(
    new QuestTrackerClient(viewFixtureRunner(badIndex)).view("T-1"),
  ).rejects.toMatchObject({ error_type: "drift" });
});

test("probe requires the full advertised tracker command set and rejects missing or drifted entries", async () => {
  const { commands } = trackerConformanceFixtures.manifest.data;
  const withoutEdit = {
    schemaVersion: 1,
    kind: "manifest.registry",
    data: {
      commands: commands.filter((entry) => entry.name !== "task edit"),
    },
  };
  const drifted = {
    schemaVersion: 1,
    kind: "manifest.registry",
    data: {
      commands: commands.map((entry) =>
        entry.name === "task create" ? { ...entry, mutates: false } : entry,
      ),
    },
  };
  for (const manifest of [withoutEdit, drifted]) {
    const runner: TrackerProcessRunner = {
      async run(argv) {
        if (argv[0] === "--version")
          return {
            exitCode: 0,
            stdout: trackerConformanceFixtures.versionOutput,
            stderr: "",
          };
        return {
          exitCode: 0,
          stdout: JSON.stringify(manifest),
          stderr: "",
        };
      },
    };
    await expect(new QuestTrackerClient(runner).probe()).rejects.toMatchObject({
      error_type: "drift",
    });
  }
});

test("edits emit the full replace add remove clear argv in a fixed order", async () => {
  const calls: string[][] = [];
  const runner: TrackerProcessRunner = {
    async run(argv) {
      calls.push([...argv]);
      return {
        exitCode: 0,
        stdout: JSON.stringify(trackerConformanceFixtures.updated),
        stderr: "",
      };
    },
  };
  const client = new QuestTrackerClient(runner);
  await client.edit(
    "T-1",
    {
      plan: ["p1"],
      addPlan: ["p2"],
      removePlan: ["p3"],
      acceptanceCriteria: [{ index: 0, text: "ac", checked: true }],
      clearMilestone: true,
      parentId: "T-0",
      addDependencies: ["T-9"],
      addAssignees: ["person-2"],
    },
    { id: "person-1", kind: "human" },
  );
  const editCall = calls.find((argv) => argv[1] === "edit");
  if (!editCall) throw new Error("edit_call_missing");
  expect(editCall.slice(editCall.indexOf("--plan"))).toEqual([
    "--plan",
    '["p1"]',
    "--add-plan",
    "p2",
    "--remove-plan",
    "p3",
    "--acceptance-criteria",
    '[{"index":0,"text":"ac","checked":true}]',
    "--add-dependency",
    "T-9",
    "--parent",
    "T-0",
    "--clear-milestone",
    "--add-assignee",
    "person-2",
  ]);
});

test("probe requires exact fields and filters and rejects omissions or drift", async () => {
  const { commands } = trackerConformanceFixtures.manifest.data;
  const omitField = {
    schemaVersion: 1,
    kind: "manifest.registry",
    data: {
      commands: commands.map((entry) =>
        entry.name === "task create"
          ? {
              ...entry,
              fields: entry.fields?.filter((field) => field !== "summary"),
            }
          : entry,
      ),
    },
  };
  const driftFilter = {
    schemaVersion: 1,
    kind: "manifest.registry",
    data: {
      commands: commands.map((entry) =>
        entry.name === "task list"
          ? { ...entry, filters: ["label"] as readonly string[] }
          : entry,
      ),
    },
  };
  for (const manifest of [omitField, driftFilter]) {
    const runner: TrackerProcessRunner = {
      async run(argv) {
        if (argv[0] === "--version")
          return {
            exitCode: 0,
            stdout: trackerConformanceFixtures.versionOutput,
            stderr: "",
          };
        return {
          exitCode: 0,
          stdout: JSON.stringify(manifest),
          stderr: "",
        };
      },
    };
    await expect(new QuestTrackerClient(runner).probe()).rejects.toMatchObject({
      error_type: "drift",
    });
  }
});

test("checklist responses reject reordered indexes and mixed legacy strings", async () => {
  const reordered = {
    ...trackerTaskFixture,
    acceptanceCriteria: [
      { index: 1, text: "second", checked: false },
      { index: 0, text: "first", checked: false },
    ],
  };
  await expect(
    new QuestTrackerClient(viewFixtureRunner(reordered)).view("T-1"),
  ).rejects.toMatchObject({ error_type: "drift" });
  const mixed = {
    ...trackerTaskFixture,
    acceptanceCriteria: [{ index: 0, text: "first", checked: false }, "legacy"],
  };
  await expect(
    new QuestTrackerClient(viewFixtureRunner(mixed)).view("T-1"),
  ).rejects.toMatchObject({ error_type: "drift" });
});

test("create emits structured field argv", async () => {
  const calls: string[][] = [];
  const runner: TrackerProcessRunner = {
    async run(argv) {
      calls.push([...argv]);
      return {
        exitCode: 0,
        stdout: JSON.stringify(trackerConformanceFixtures.created),
        stderr: "",
      };
    },
  };
  const client = new QuestTrackerClient(runner);
  await client.create(
    {
      title: "full",
      priority: "high",
      type: "feature",
      ordinal: 7,
      aliases: ["FULL"],
      acceptanceCriteria: ["works"],
      assignees: ["person-1"],
      milestoneId: "M-1",
    },
    { id: "person-1", kind: "human" },
  );
  const createCall = calls.find((argv) => argv[1] === "create");
  if (!createCall) throw new Error("create_call_missing");
  expect(createCall.slice(createCall.indexOf("--priority"))).toEqual([
    "--priority",
    "high",
    "--type",
    "feature",
    "--ordinal",
    "7",
    "--alias",
    "FULL",
    "--acceptance-criteria",
    '["works"]',
    "--assignee",
    "person-1",
    "--milestone",
    "M-1",
  ]);
});
