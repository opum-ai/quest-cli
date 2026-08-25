import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { runQuest } from "../../src/cli/main.ts";
import { safeStorageName } from "../../src/adapters/claims/local-claim-evidence.ts";

const correlation = "f54125ae12e541f4b7ba83abb8ba8a35";
const renewal = "0123456789abcdef0123456789abcdef";

let workspace = "";
let repositoryId = "";
let previousCwd = "";

async function quest(arguments_: string[], stdin?: string) {
  if (stdin === undefined) return runQuest([...arguments_, "--json"], false);
  // Stdin transport: pipe the envelope through runQuest's real stdin.
  const { runQuest: rq } = await import("../../src/cli/main.ts");
  void rq;
  const child = Bun.spawn(
    ["bun", "run", join("src/cli/main.ts"), ...arguments_, "--json"],
    {
      cwd: `${import.meta.dir}/../..`,
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      env: { ...Bun.env, QUEST_TASK_STORE: workspace },
    },
  );
  child.stdin.write(stdin);
  child.stdin.end();
  const exitCode = await child.exited;
  return {
    exitCode,
    stdout: await new Response(child.stdout).text(),
    stderr: await new Response(child.stderr).text(),
  };
}

async function writeRelationship(
  id: string,
  record: Record<string, unknown>,
): Promise<void> {
  const directory = join(workspace, ".quest", "relationships");
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, `${safeStorageName(id)}.json`),
    JSON.stringify({ schemaVersion: 1, id, taskId: "T-1", ...record }),
  );
  await commitAll();
}

async function commitAll(): Promise<void> {
  Bun.spawnSync(["git", "add", "-A"], { cwd: workspace });
  Bun.spawnSync(
    [
      "git",
      "-c",
      "user.email=t@t",
      "-c",
      "user.name=t",
      "commit",
      "-m",
      "evidence",
    ],
    { cwd: workspace },
  );
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
  const commonDirectory = Bun.spawnSync(
    ["git", "rev-parse", "--git-common-dir"],
    {
      cwd: workspace,
      stdout: "pipe",
    },
  )
    .stdout.toString()
    .trim();
  const { realpathSync } = await import("node:fs");
  repositoryId = commonDirectory.startsWith("/")
    ? commonDirectory
    : join(realpathSync(workspace), commonDirectory);
  const initialized = await quest(["init"]);
  expect(initialized.exitCode).toBe(0);
  for (const [id, title] of [
    ["T-1", "Bound task"],
    ["T-2", "Idle task"],
  ] as const) {
    const created = await quest([
      "task",
      "create",
      title,
      "--id",
      id,
      "--actor",
      "human-1",
      "--actor-kind",
      "human",
    ]);
    expect(created.exitCode).toBe(0);
  }
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
  await commitAll();
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
    "--repository": repositoryId,
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

const EXPECTED_KEYS = [
  "baseRef",
  "contract",
  "expiresAt",
  "holder",
  "issuedAt",
  "relationshipId",
  "relationshipKind",
  "relationshipState",
  "repositoryId",
  "requestId",
  "selectedVersion",
  "settlementRef",
  "taskId",
  "taskState",
].sort();

function bindingArguments(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    "--contract": "opum-agent-workflow/v1",
    "--task": "T-1",
    "--claim-or-correlation": correlation,
    "--holder": "agent-1",
    "--repository": workspace,
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

test("stdin transport prints the exact closed-key public v1 envelope", async () => {
  await writeRelationship(correlation, {
    kind: "correlation",
    state: "accepted",
    holder: "agent-1",
    baseRef: "origin/dev",
    settlementRef: "origin/dev",
  });
  const result = await spawnBindingFor("T-1", "b".repeat(32));
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  const response = JSON.parse(result.stdout);
  expect(Object.keys(response).sort()).toEqual(EXPECTED_KEYS);
  expect(response.contract).toBe("opum-agent-workflow");
  expect(response.selectedVersion).toBe(1);
  expect(response.requestId).toMatch(/^[0-9a-f]{32}$/);
  expect(response.taskId).toBe("T-1");
  expect(response.taskState).toBe("in_progress");
  expect(response.relationshipId).toBe(correlation);
  expect(response.relationshipState).toBe("accepted");
});

test("mixed stdin and flag transport is refused", async () => {
  const child = Bun.spawn(
    [
      "bun",
      new URL("../../src/cli/main.ts", import.meta.url).pathname,
      "task",
      "binding",
      "--contract",
      "opum-agent-workflow/v1",
      "--json",
      "--holder",
      "agent-1",
    ],
    {
      cwd: workspace,
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      env: { ...Bun.env, QUEST_TASK_STORE: workspace },
    },
  );
  child.stdin.write(
    JSON.stringify({
      contract: "opum-agent-workflow",
      supportedVersions: [1],
      requestId: "c".repeat(32),
      taskId: "T-1",
    }),
  );
  await child.stdin.end();
  expect(await child.exited).not.toBe(0);
  const diagnostic = JSON.parse(await new Response(child.stderr).text());
  expect(diagnostic.error_type).toBe("usage");
});
