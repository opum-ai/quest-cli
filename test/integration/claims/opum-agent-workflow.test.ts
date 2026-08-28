import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GitSnapshotEvidence } from "../../../src/adapters/claims/local-claim-evidence.ts";
import { LocalGitPort } from "../../../src/adapters/git/local-git.ts";
import {
  OpumAgentWorkflowBindingService,
  OpumAgentWorkflowError,
  type TaskBindingCommand,
} from "../../../src/application/claims/opum-agent-workflow.ts";

const correlation = "f54125ae12e541f4b7ba83abb8ba8a35";

let root = "";
const actors = [
  { id: "human", kind: "human", roles: ["maintainer"] },
  {
    id: "agent-1",
    kind: "delegated-agent",
    accountableHumanId: "human",
    roles: [],
  },
];

async function git(rootPath: string, args: string[]) {
  const child = Bun.spawn(["git", "-C", rootPath, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const code = await child.exited;
  const stdout = await new Response(child.stdout).text();
  const stderr = await new Response(child.stderr).text();
  if (code !== 0) throw new Error(stderr);
  return stdout.trim();
}

/** Commits evidence into real Git objects; reads are revision-pinned. */
async function commitEvidence(files: Record<string, string>): Promise<string> {
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path);
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, content);
  }
  await git(root, ["add", "-A"]);
  const tree = await git(root, ["write-tree"]);
  const parent = await git(root, ["rev-parse", "HEAD"]);
  const commit = await git(root, [
    "-c",
    "user.email=t@t",
    "-c",
    "user.name=t",
    "commit-tree",
    tree,
    "-p",
    parent,
    "-m",
    "evidence",
  ]);
  await git(root, ["update-ref", "HEAD", commit]);
  return commit;
}

async function setup(
  relationship?: Record<string, unknown>,
  claimEvents?: readonly Record<string, unknown>[],
) {
  root = await mkdtemp(join(tmpdir(), "quest-binding-model-"));
  await git(root, ["init", "-q", "-b", "main"]);
  await git(root, [
    "-c",
    "user.email=t@t",
    "-c",
    "user.name=t",
    "commit",
    "--allow-empty",
    "-m",
    "init",
  ]);
  const files: Record<string, string> = {
    ".quest/claims/actors.json": JSON.stringify(actors),
  };
  if (claimEvents) {
    files[".quest/claims/T-1.jsonl"] = claimEvents
      .map((event) => JSON.stringify(event))
      .join("\n");
  }
  if (relationship) {
    const record = {
      schemaVersion: 1,
      id: correlation,
      taskId: "T-1",
      kind: "correlation" as string,
      state: "accepted",
      holder: "agent-1",
      baseRef: "origin/dev",
      settlementRef: "origin/dev",
      ...relationship,
    };
    if (record.kind === "claim") {
      const { holder: _drop, ...rest } = record;
      files[
        `.quest/relationships/${(await import("../../../src/adapters/claims/local-claim-evidence.ts")).safeStorageName(correlation)}.json`
      ] = JSON.stringify(rest);
    } else {
      files[
        `.quest/relationships/${(await import("../../../src/adapters/claims/local-claim-evidence.ts")).safeStorageName(correlation)}.json`
      ] = JSON.stringify(record);
    }
  }
  await commitEvidence(files);
}

async function teardown() {
  await rm(root, { recursive: true, force: true });
}

function service(): OpumAgentWorkflowBindingService {
  const git = new LocalGitPort();
  return new OpumAgentWorkflowBindingService({
    subject: async () => ({ id: "T-1", status: "In Progress" }),
    claimEvents: async (taskId) => {
      const revision = await git.readRevision(root, "HEAD");
      const snapshot = new GitSnapshotEvidence(git, root, revision);
      return snapshot.events(taskId);
    },
    actors: async () => {
      const revision = await git.readRevision(root, "HEAD");
      const snapshot = new GitSnapshotEvidence(git, root, revision);
      return snapshot.actors();
    },
    relationship: async (id) => {
      const revision = await git.readRevision(root, "HEAD");
      const snapshot = new GitSnapshotEvidence(git, root, revision);
      return snapshot.relationship(id);
    },
    repositoryId: async () => "/repo/common",
  });
}

function command(
  overrides: Partial<TaskBindingCommand> = {},
): TaskBindingCommand {
  return {
    contract: "opum-agent-workflow/v1",
    taskId: "T-1",
    claimOrCorrelationId: correlation,
    holder: "agent-1",
    repositoryId: "/repo/common",
    baseRef: "origin/dev",
    settlementRef: "origin/dev",
    requestId: "a".repeat(32),
    now: new Date(),
    ...overrides,
  };
}

async function codeOf(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    expect(error).toBeInstanceOf(OpumAgentWorkflowError);
    return (error as OpumAgentWorkflowError).code;
  }
  throw new Error("expected the binding to fail");
}

describe("OpumAgentWorkflowBindingService over pinned Git snapshots", () => {
  test("binds through an authoritative committed correlation record", async () => {
    await setup({});
    const response = await service().bind(command());
    expect(response.contract).toBe("opum-agent-workflow");
    expect(response.selectedVersion).toBe(1);
    expect(response.relationshipKind).toBe("correlation");
    expect(response.relationshipState).toBe("accepted");
    expect(response.holder).toBe("agent-1");
    await teardown();
  });

  test("binds a live claim whose identity binds the current generation, surviving renewal", async () => {
    const claimed = {
      eventId: correlation,
      operationId: "op-1",
      taskId: "T-1",
      kind: "claimed",
      generation: "g1",
      holderId: "agent-1",
      accountableHumanId: "human",
      at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    };
    const renewed = {
      eventId: "renew-1",
      operationId: "op-2",
      taskId: "T-1",
      kind: "renewed",
      generation: "g1",
      holderId: "agent-1",
      accountableHumanId: "human",
      at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    };
    await setup({ kind: "claim" }, [claimed, renewed]);
    const response = await service().bind(command());
    expect(response.relationshipKind).toBe("claim");
    expect(response.relationshipState).toBe("active");
    expect(response.holder).toBe("agent-1");
    expect(response.relationshipId).toBe(correlation);
    await teardown();
  });

  test("expired or anomalous claim generations are STATE", async () => {
    const expired = [
      {
        eventId: correlation,
        operationId: "op-1",
        taskId: "T-1",
        kind: "claimed",
        generation: "g1",
        holderId: "agent-1",
        accountableHumanId: "human",
        at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
    ];
    await setup({ kind: "claim" }, expired);
    expect(await codeOf(() => service().bind(command()))).toBe(
      "OPUM_WORKFLOW_QUEST_STATE",
    );
    await teardown();

    const clockRegressed = [
      {
        eventId: correlation,
        operationId: "op-1",
        taskId: "T-1",
        kind: "claimed",
        generation: "g1",
        holderId: "agent-1",
        accountableHumanId: "human",
        at: new Date().toISOString(),
      },
      {
        eventId: "renew-bad",
        operationId: "op-2",
        taskId: "T-1",
        kind: "renewed",
        generation: "g1",
        holderId: "agent-1",
        accountableHumanId: "human",
        at: new Date(Date.now() - 60_000).toISOString(),
      },
    ];
    await setup({ kind: "claim" }, clockRegressed);
    expect(await codeOf(() => service().bind(command()))).toBe(
      "OPUM_WORKFLOW_QUEST_STATE",
    );
    await teardown();
  });

  test("missing records are ABSENT and terminal states are STATE", async () => {
    await setup();

    expect(await codeOf(() => service().bind(command()))).toBe(
      "OPUM_WORKFLOW_QUEST_ABSENT",
    );
    await teardown();
  });

  test("foreign repository, holder, base, settlement, and contracts are INCOMPATIBLE", async () => {
    await setup({});
    for (const overrides of [
      { repositoryId: "/repo/other" },
      { holder: "agent-2" },
      { baseRef: "origin/main" },
      { settlementRef: "origin/main" },
      { contract: "other/v9" },
    ]) {
      expect(await codeOf(() => service().bind(command(overrides)))).toBe(
        "OPUM_WORKFLOW_QUEST_INCOMPATIBLE",
      );
    }
    await teardown();
  });

  test("deterministic output for identical inputs", async () => {
    await setup({});
    const pinned = command({ now: new Date("2026-08-24T00:01:00.000Z") });
    const first = await service().bind(pinned);
    const second = await service().bind(pinned);
    expect(first).toEqual(second);
    await teardown();
  });

  test("hostile worktree symlinks cannot alter pinned snapshot reads", async () => {
    await setup({});
    // Swap the worktree evidence for symlinks pointing outside; the binding
    // still reads the pinned Git objects and never follows the links.
    await rm(join(root, ".quest", "claims", "T-1.jsonl"), { force: true });
    await symlink("/etc/hostname", join(root, ".quest", "claims", "T-1.jsonl"));
    await rm(join(root, ".quest", "claims", "actors.json"), { force: true });
    await symlink(
      "/etc/hostname",
      join(root, ".quest", "claims", "actors.json"),
    );
    const response = await service().bind(command());
    expect(response.taskId).toBe("T-1");
    await teardown();
  });
});
