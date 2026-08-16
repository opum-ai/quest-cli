import { expect, test } from "bun:test";

import {
  type JiraCliRunner,
  type JiraImportError,
  JiraImporter,
} from "../../../src/adapters/migration/jira/index.ts";
import { RecordValidationError } from "../../../src/domain/records.ts";

const fixture = `${import.meta.dir}/../../fixtures/jira`;

async function help(argv: readonly string[]): Promise<string> {
  const process = Bun.spawn([...argv, "--help"], { stdout: "pipe" });
  await process.exited;
  expect(process.exitCode).toBe(0);
  return new Response(process.stdout).text();
}

class GoldenRunner implements JiraCliRunner {
  readonly calls: string[][] = [];
  constructor(private readonly failure?: { readonly stderr: string }) {}
  async run(argv: readonly string[]) {
    this.calls.push([...argv]);
    if (this.failure)
      return { exitCode: 1, stdout: "", stderr: this.failure.stderr };
    const token = argv[argv.indexOf("--next-page-token") + 1];
    const start = argv[argv.indexOf("--start-at") + 1];
    const file = argv.includes("search")
      ? token === "page-2"
        ? "issues-page-2.json"
        : "issues-page-1.json"
      : argv.includes("Q-1")
        ? `comments-q-1-${start}.json`
        : "comments-q-2-0.json";
    return {
      exitCode: 0,
      stdout: await Bun.file(`${fixture}/${file}`).text(),
      stderr: "",
    };
  }
}

test("installed jira-cli 1.0.2 exposes the qualified search and comment argv", async () => {
  expect((await Bun.$`jira --version`.text()).trim()).toBe("1.0.2");
  await expect(help(["jira", "issue", "search"])).resolves.toContain(
    "--next-page-token",
  );
  await expect(help(["jira", "issue", "search"])).resolves.toContain(
    "--max-results",
  );
  await expect(help(["jira", "comment", "list"])).resolves.toContain(
    "jira comment list <issueKey>",
  );
  await expect(help(["jira", "comment", "list"])).resolves.toContain(
    "--start-at",
  );
});

test("imports the paged public JSON surface, retaining provenance and every explicit gap", async () => {
  const runner = new GoldenRunner();
  const snapshot = await new JiraImporter(
    {
      project: "Q",
      profile: "adoption",
      maxResults: 1,
      statusMappings: { "To Do": "todo", "In Progress": "active" },
    },
    runner,
  ).readSnapshot();
  expect(snapshot.records.map((record) => record.issueKey)).toEqual([
    "Q-1",
    "Q-2",
  ]);
  expect(snapshot.records[0]).toMatchObject({
    sourceInstance: "jira:Q",
    sourceFolder: "Q",
    sourceIdentifier: "10001",
    links: [{ type: { name: "blocks" } }],
    fixVersions: [{ name: "1.0" }],
    labels: ["migration", "golden"],
    description: "Normalized description from jira-cli",
    comments: [
      {
        id: "20001",
        body: "First normalized comment",
        author: { accountId: "acct-commenter" },
      },
      {
        id: "20002",
        body: "Second normalized comment",
        author: { accountId: "acct-commenter-2" },
      },
    ],
    unsupportedFields: [
      "attachments",
      "worklogs",
      "changelog",
      "boards",
      "sprints",
    ],
  });
  expect(snapshot.records[1]).toMatchObject({
    parent: { id: "10001", key: "Q-1" },
  });
  expect(runner.calls[0]).toEqual([
    "jira",
    "issue",
    "search",
    "--jql",
    "project = Q",
    "--fields",
    expect.any(String),
    "--max-results",
    "1",
    "--profile",
    "adoption",
  ]);
  expect(runner.calls.find((argv) => argv.includes("Q-1"))).toEqual([
    "jira",
    "comment",
    "list",
    "Q-1",
    "--max-results",
    "1",
    "--start-at",
    "0",
    "--profile",
    "adoption",
  ]);
  expect(runner.calls.every((argv) => !argv.includes("--json"))).toBe(true);
  expect(
    runner.calls.some(
      (argv) => argv.includes("--next-page-token") && argv.includes("page-2"),
    ),
  ).toBe(true);
  expect(
    runner.calls.some(
      (argv) => argv.includes("--start-at") && argv.includes("1"),
    ),
  ).toBe(true);
  expect(
    runner.calls.every(
      (argv) => argv.includes("--profile") && argv.includes("adoption"),
    ),
  ).toBe(true);
});

test("classifies inaccessible sources and refuses an unnormalized ADF payload", async () => {
  await expect(
    new JiraImporter(
      { project: "Q", statusMappings: {} },
      new GoldenRunner({ stderr: "Permission denied" }),
    ).readSnapshot(),
  ).rejects.toMatchObject({
    kind: "denied",
  } satisfies Partial<JiraImportError>);
  const runner: JiraCliRunner = {
    async run(argv) {
      if (argv.includes("search"))
        return {
          exitCode: 0,
          stderr: "",
          stdout: JSON.stringify({
            success: true,
            data: {
              issues: [
                {
                  id: "1",
                  key: "Q-1",
                  fields: {
                    summary: "ADF",
                    status: { name: "To Do" },
                    description: { type: "doc" },
                  },
                },
              ],
            },
          }),
        };
      return {
        exitCode: 0,
        stderr: "",
        stdout: JSON.stringify({
          success: true,
          data: { comments: [], total: 0 },
        }),
      };
    },
  };
  await expect(
    new JiraImporter(
      { project: "Q", statusMappings: { "To Do": "todo" } },
      runner,
    ).readSnapshot(),
  ).rejects.toBeInstanceOf(RecordValidationError);
});

test("requires an explicit mapping for every Jira status", async () => {
  await expect(
    new JiraImporter(
      { project: "Q", statusMappings: { "To Do": "todo" } },
      new GoldenRunner(),
    ).readSnapshot(),
  ).rejects.toThrow("jira_status_mapping_incomplete");
});
