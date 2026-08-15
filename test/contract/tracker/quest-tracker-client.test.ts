import { expect, test } from "bun:test";
import { trackerConformanceFixtures } from "../../../src/contract/tracker/fixtures.ts";
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
