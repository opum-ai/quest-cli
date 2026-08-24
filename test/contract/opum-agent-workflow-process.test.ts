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

async function quest(arguments_: string[]) {
  return runQuest([...arguments_, "--json"], false);
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

test("prints the exact public v1 envelope with the closed key set", async () => {
  await writeRelationship(correlation, {
    kind: "correlation",
    state: "accepted",
    holder: "agent-1",
    baseRef: "origin/dev",
    settlementRef: "origin/dev",
  });
  const result = await quest(bindingArguments());
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  const response = JSON.parse(result.stdout);
  expect(Object.keys(response).sort()).toEqual(
    [
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
    ].sort(),
  );
  expect(response.contract).toBe("opum-agent-workflow");
  expect(response.selectedVersion).toBe(1);
  expect(response.requestId).toMatch(/^[0-9a-f]{32}$/);
  expect(response.taskId).toBe("T-1");
  expect(response.taskState).toBe("in_progress");
  expect(response.relationshipId).toBe(correlation);
  expect(response.relationshipState).toBe("accepted");
  expect(response.repositoryId).toBe(repositoryId);
});

test("binds a live claim through its current generation, surviving renewal", async () => {
  const claimsDirectory = join(workspace, ".quest", "claims");
  await mkdir(claimsDirectory, { recursive: true });
  await Bun.write(
    join(claimsDirectory, "actors.json"),
    JSON.stringify([
      { id: "human", kind: "human", roles: ["maintainer"] },
      {
        id: "agent-1",
        kind: "delegated-agent",
        accountableHumanId: "human",
        roles: [],
      },
    ]),
  );
  const events = [
    {
      eventId: correlation,
      operationId: "op-1",
      taskId: "T-1",
      kind: "claimed",
      generation: "g1",
      holderId: "agent-1",
      accountableHumanId: "human",
      at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      eventId: renewal,
      operationId: "op-2",
      taskId: "T-1",
      kind: "renewed",
      generation: "g1",
      holderId: "agent-1",
      accountableHumanId: "human",
      at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
  ];
  await writeFile(
    join(claimsDirectory, "T-1.jsonl"),
    events.map((event) => JSON.stringify(event)).join("\n"),
  );
  await commitAll();
  await writeRelationship(correlation, {
    kind: "claim",
    state: "accepted",
    baseRef: "origin/dev",
    settlementRef: "origin/dev",
  });
  const originalIdentity = await quest(bindingArguments());
  expect(originalIdentity.exitCode).toBe(0);
  const response = JSON.parse(originalIdentity.stdout);
  expect(response.relationshipKind).toBe("claim");
  expect(response.relationshipState).toBe("active");
  expect(response.holder).toBe("agent-1");

  // The renewal identity also binds generation g1 via its own record.
  await writeRelationship(renewal, {
    kind: "claim",
    state: "accepted",
    baseRef: "origin/dev",
    settlementRef: "origin/dev",
  });
  const renewed = await quest(
    bindingArguments({ "--claim-or-correlation": renewal }),
  );
  expect(renewed.exitCode).toBe(0);
  expect(JSON.parse(renewed.stdout).relationshipId).toBe(renewal);

  // A stale identity from a superseded generation is STATE.
  await writeFile(
    join(claimsDirectory, "T-1.jsonl"),
    [
      ...events,
      {
        eventId: "reclaim-1",
        operationId: "op-3",
        taskId: "T-1",
        kind: "reclaimed",
        generation: "g2",
        holderId: "agent-1",
        accountableHumanId: "human",
        at: new Date().toISOString(),
      },
    ]
      .map((event) => JSON.stringify(event))
      .join("\n"),
  );
  // g2's lease is live but our records only bound g1.
  await writeRelationship(correlation, {
    kind: "claim",
    state: "superseded",
    baseRef: "origin/dev",
    settlementRef: "origin/dev",
  });
  const stale = await quest(bindingArguments());
  expect(JSON.parse(stale.stderr).input.code).toBe("OPUM_WORKFLOW_QUEST_STATE");
});

test("rejects foreign repository, holder, base, and settlement as INCOMPATIBLE", async () => {
  await writeRelationship(correlation, {
    kind: "correlation",
    state: "accepted",
    holder: "agent-1",
    baseRef: "origin/dev",
    settlementRef: "origin/dev",
  });
  const foreignCases: Record<string, string>[] = [
    { "--repository": "/somewhere/else" },
    { "--holder": "agent-2" },
    { "--base": "origin/main" },
    { "--settlement": "origin/main" },
    { "--contract": "other-workflow/v9" },
  ];
  for (const overrides of foreignCases) {
    const result = await quest(bindingArguments(overrides));
    expect(JSON.parse(result.stderr).input.code).toBe(
      "OPUM_WORKFLOW_QUEST_INCOMPATIBLE",
    );
  }
});

test("missing records are ABSENT; terminal states are STATE", async () => {
  const absent = await quest(
    bindingArguments({ "--claim-or-correlation": "unknown-id" }),
  );
  expect(JSON.parse(absent.stderr).input.code).toBe(
    "OPUM_WORKFLOW_QUEST_ABSENT",
  );

  await writeRelationship(correlation, {
    kind: "correlation",
    state: "done",
    holder: "agent-1",
    baseRef: "origin/dev",
    settlementRef: "origin/dev",
  });
  const done = await quest(bindingArguments());
  expect(JSON.parse(done.stderr).input.code).toBe("OPUM_WORKFLOW_QUEST_STATE");

  // T-2 stays in To Do: not in progress even with a valid record.
  await writeRelationship("T-2-record", {
    id: "T-2-record",
    taskId: "T-2",
    kind: "correlation",
    state: "accepted",
    holder: "agent-1",
    baseRef: "origin/dev",
    settlementRef: "origin/dev",
  });
  const idle = await quest(
    bindingArguments({
      "--task": "T-2",
      "--claim-or-correlation": "T-2-record",
    }),
  );
  expect(JSON.parse(idle.stderr).input.code).toBe("OPUM_WORKFLOW_QUEST_STATE");
});
