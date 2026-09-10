import { expect, test } from "bun:test";

import {
  type JiraCliRunner,
  type JiraImportError,
  JiraImporter,
} from "../../../src/adapters/migration/jira/importer.ts";

const fixture = `${import.meta.dir}/../../fixtures/jira`;

class RecordedProject implements JiraCliRunner {
  drift = false;
  readonly calls: string[][] = [];

  async run(argv: readonly string[]) {
    this.calls.push([...argv]);
    const token = argv[argv.indexOf("--next-page-token") + 1];
    const start = argv[argv.indexOf("--start-at") + 1];
    const file = argv.includes("search")
      ? token === "page-2"
        ? "issues-page-2.json"
        : "issues-page-1.json"
      : argv.includes("Q-1")
        ? `comments-q-1-${start}.json`
        : "comments-q-2-0.json";
    const stdout = await Bun.file(`${fixture}/${file}`).text();
    return {
      exitCode: 0,
      stderr: "",
      stdout:
        this.drift && file === "issues-page-1.json"
          ? stdout.replace("Normalized description", "Changed description")
          : stdout,
    };
  }
}

test("recorded Jira paging produces a reproducible complete preview and detects source drift", async () => {
  const project = new RecordedProject();
  const importer = new JiraImporter(
    {
      project: "Q",
      profile: "qualification",
      maxResults: 1,
      statusMappings: { "To Do": "todo", "In Progress": "active" },
    },
    project,
  );
  const first = await importer.readSnapshot();
  const repeat = await importer.readSnapshot();
  expect(repeat).toEqual(first);
  expect(first.records.map((record) => record.issueKey)).toEqual([
    "Q-1",
    "Q-2",
  ]);
  expect(first.records[1]?.parent).toEqual({ id: "10001", key: "Q-1" });
  expect(first.records[0]?.comments).toHaveLength(2);
  expect(first.records[0]?.assignee?.accountId).toBe("acct-assignee");
  expect(first.records[1]).toMatchObject({
    issueKey: "Q-2",
    priority: undefined,
    reporter: undefined,
    assignee: undefined,
    creator: undefined,
    resolved: undefined,
  });
  expect(first.records[0]?.unsupportedFields).toEqual([
    "attachments",
    "worklogs",
    "changelog",
    "boards",
    "sprints",
  ]);
  expect(project.calls.some((call) => call.includes("page-2"))).toBeTrue();
  expect(
    project.calls.some(
      (call) =>
        call[call.indexOf("--start-at") + 1] === "1" && call.includes("Q-1"),
    ),
  ).toBeTrue();

  project.drift = true;
  expect((await importer.readSnapshot()).fingerprint).not.toBe(
    first.fingerprint,
  );
});

test("recorded permission denial remains a classified Jira source failure", async () => {
  const denied: JiraCliRunner = {
    async run() {
      return { exitCode: 1, stdout: "", stderr: "Permission denied" };
    },
  };
  await expect(
    new JiraImporter(
      { project: "Q", statusMappings: {} },
      denied,
    ).readSnapshot(),
  ).rejects.toMatchObject({
    kind: "denied",
  } satisfies Partial<JiraImportError>);
});
