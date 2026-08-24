import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { runQuest } from "../../src/cli/main.ts";

const correlation = "f54125ae12e541f4b7ba83abb8ba8a35";

let workspace = "";
let previousCwd = "";

async function quest(arguments_: string[]) {
  return runQuest([...arguments_, "--json"], false);
}

beforeAll(async () => {
  workspace = await mkdtemp(join(tmpdir(), "quest-binding-"));
  previousCwd = process.cwd();
  process.chdir(workspace);
  const init = Bun.spawn(["git", "init", "-q"], {
    stdout: "ignore",
    stderr: "ignore",
  });
  expect(await init.exited).toBe(0);
  const initialized = await quest(["init"]);
  expect(initialized.exitCode).toBe(0);
  const created = await quest([
    "task",
    "create",
    "Bound task",
    "--id",
    "T-1",
    "--actor",
    "human-1",
    "--actor-kind",
    "human",
    "--reference",
    correlation,
  ]);
  expect(created.exitCode).toBe(0);
  const edited = await quest([
    "task",
    "edit",
    "T-1",
    "--status",
    "In Progress",
    "--actor",
    "human-1",
    "--actor-kind",
    "human",
  ]);
  expect(edited.exitCode).toBe(0);
});

afterAll(async () => {
  process.chdir(previousCwd);
  await rm(workspace, { recursive: true, force: true });
});

function bindingArguments(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    "--contract": "opum-agent-workflow/v1",
    "--task": "T-1",
    "--claim-or-correlation": correlation,
    "--holder": "agent-1",
    "--base": "origin/dev",
    "--settlement": "origin/dev",
    ...overrides,
  };
  const arguments_: string[] = ["task", "binding"];
  for (const [flag, value] of Object.entries(values)) {
    if (value !== "") arguments_.push(flag, value);
  }
  return arguments_;
}

test("manifest and help expose the read-only binding command", async () => {
  const manifest = await quest(["manifest"]);
  expect(manifest.exitCode).toBe(0);
  const registry = JSON.parse(manifest.stdout);
  const entry = registry.data.commands.find(
    (command: { name: string }) => command.name === "task binding",
  );
  expect(entry).toMatchObject({ kind: "task.binding", mutates: false });
  const help = await quest(["help", "task"]);
  expect(
    JSON.parse(help.stdout).data.commands.some(
      (command: { name: string }) => command.name === "task binding",
    ),
  ).toBe(true);
});

test("binds an in-progress task by accepted correlation over public output", async () => {
  const before = await Bun.spawn(["git", "status", "--porcelain"], {
    cwd: workspace,
    stdout: "pipe",
    stderr: "ignore",
  }).exited;
  void before;
  const result = await quest(bindingArguments());
  expect(result.exitCode).toBe(0);
  const envelope = JSON.parse(result.stdout);
  expect(envelope.kind).toBe("task.binding");
  expect(envelope.data.contract).toBe("opum-agent-workflow");
  expect(envelope.data.requestId).toMatch(/^[0-9a-f]{32}$/);
  expect(envelope.data.binding).toEqual({
    selectedVersion: 1,
    taskId: "T-1",
    repositoryId: expect.any(String),
    holder: "agent-1",
    taskState: "in_progress",
    relationshipKind: "correlation",
    relationshipId: "T-1",
    relationshipState: "accepted",
    baseRef: "origin/dev",
    settlementRef: "origin/dev",
    issuedAt: expect.any(String),
    expiresAt: expect.any(String),
  });
});

test("rejects foreign contracts without fallback", async () => {
  const result = await quest(
    bindingArguments({ "--contract": "other-workflow/v9" }),
  );
  expect(result.exitCode).not.toBe(0);
  const diagnostic = JSON.parse(result.stderr);
  expect(diagnostic.input.code).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
});

test("unbound identities are ABSENT", async () => {
  const result = await quest(
    bindingArguments({ "--claim-or-correlation": "unknown-id" }),
  );
  expect(JSON.parse(result.stderr).input.code).toBe(
    "OPUM_WORKFLOW_QUEST_ABSENT",
  );
});

test("tasks outside in-progress are STATE rejections", async () => {
  const created = await quest([
    "task",
    "create",
    "Idle task",
    "--id",
    "T-2",
    "--actor",
    "human-1",
    "--actor-kind",
    "human",
    "--reference",
    correlation,
  ]);
  expect(created.exitCode).toBe(0);
  const result = await quest(
    bindingArguments({
      "--task": "T-2",
      "--settlement": "origin/dev",
    }),
  );
  expect(JSON.parse(result.stderr).input.code).toBe(
    "OPUM_WORKFLOW_QUEST_STATE",
  );
});
