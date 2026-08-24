import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  LocalClaimEvidence,
  LocalTaskRelationshipRepository,
} from "../../../src/adapters/claims/local-claim-evidence.ts";
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

async function setup(store: {
  relationship?: Record<string, unknown> | null;
  claimEvents?: readonly Record<string, unknown>[];
}) {
  root = await mkdtemp(join(tmpdir(), "quest-binding-model-"));
  const claims = join(root, ".quest", "claims");
  await Bun.write(join(claims, "actors.json"), JSON.stringify(actors));
  if (store.claimEvents) {
    await Bun.write(
      join(claims, "T-1.jsonl"),
      store.claimEvents.map((event) => JSON.stringify(event)).join("\n"),
    );
  }
  if (store.relationship !== null) {
    await new LocalTaskRelationshipRepository(root).write({
      schemaVersion: 1,
      id: correlation,
      taskId: "T-1",
      kind: "correlation",
      state: "accepted",
      holder: "agent-1",
      baseRef: "origin/dev",
      settlementRef: "origin/dev",
      ...store.relationship,
    } as never);
  }
  const evidence = new LocalClaimEvidence(root);
  const relationships = new LocalTaskRelationshipRepository(root);
  return new OpumAgentWorkflowBindingService({
    subject: async () => ({ id: "T-1", status: "In Progress" }),
    claimEvents: (taskId) => evidence.events(taskId),
    actors: () => evidence.actors(),
    relationship: (id) => relationships.find(id),
    repositoryId: async () => "/repo/common",
  });
}

async function teardown() {
  await rm(root, { recursive: true, force: true });
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
    now: new Date("2026-08-24T00:01:00.000Z"),
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

describe("OpumAgentWorkflowBindingService with real local stores", () => {
  test("binds through an authoritative correlation record", async () => {
    const service = await setup({});
    const response = await service.bind(command());
    expect(Object.keys(response)).toContain("contract");
    expect(response.contract).toBe("opum-agent-workflow");
    expect(response.selectedVersion).toBe(1);
    expect(response.taskId).toBe("T-1");
    expect(response.relationshipKind).toBe("correlation");
    expect(response.relationshipState).toBe("accepted");
    expect(response.holder).toBe("agent-1");
    await teardown();
  });

  test("binds a live claim whose identity binds the current generation, surviving renewal", async () => {
    const baseEvent = {
      eventId: correlation,
      operationId: "op-1",
      taskId: "T-1",
      kind: "claimed",
      generation: "g1",
      holderId: "agent-1",
      accountableHumanId: "human",
      at: "2026-08-23T23:40:00.000Z",
    };
    const renewed = {
      eventId: "renew-1",
      operationId: "op-2",
      taskId: "T-1",
      kind: "renewed",
      generation: "g1",
      holderId: "agent-1",
      accountableHumanId: "human",
      at: "2026-08-23T23:55:00.000Z",
    };
    const service = await setup({
      relationship: { kind: "claim", holder: undefined },
      claimEvents: [baseEvent, renewed],
    });
    const response = await service.bind(
      command({ now: new Date("2026-08-23T23:56:00.000Z") }),
    );
    expect(response.relationshipKind).toBe("claim");
    expect(response.relationshipState).toBe("active");
    expect(response.holder).toBe("agent-1");
    // The original identity stays live after renewal because it binds g1.
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
        at: "2026-08-23T20:00:00.000Z",
      },
    ];
    let service = await setup({
      relationship: { kind: "claim", holder: undefined },
      claimEvents: expired,
    });
    expect(await codeOf(() => service.bind(command()))).toBe(
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
        at: "2026-08-23T23:50:00.000Z",
      },
      {
        eventId: "renew-bad",
        operationId: "op-2",
        taskId: "T-1",
        kind: "renewed",
        generation: "g1",
        holderId: "agent-1",
        accountableHumanId: "human",
        at: "2026-08-23T23:40:30.000Z",
      },
    ];
    service = await setup({
      relationship: { kind: "claim" },
      claimEvents: clockRegressed,
    });
    expect(await codeOf(() => service.bind(command()))).toBe(
      "OPUM_WORKFLOW_QUEST_STATE",
    );
    await teardown();
  });

  test("missing records are ABSENT and terminal states are STATE", async () => {
    const noRecord = await setup({ relationship: null });
    expect(await codeOf(() => noRecord.bind(command()))).toBe(
      "OPUM_WORKFLOW_QUEST_ABSENT",
    );
    await teardown();

    const done = await setup({ relationship: { state: "done" } });
    expect(await codeOf(() => done.bind(command()))).toBe(
      "OPUM_WORKFLOW_QUEST_STATE",
    );
    await teardown();
  });

  test("foreign repository, holder, base, settlement, and contracts are INCOMPATIBLE", async () => {
    for (const overrides of [
      { repositoryId: "/repo/other" },
      { holder: "agent-2" },
      { baseRef: "origin/main" },
      { settlementRef: "origin/main" },
      { contract: "other/v9" },
    ]) {
      const service = await setup({});
      expect(await codeOf(() => service.bind(command(overrides)))).toBe(
        "OPUM_WORKFLOW_QUEST_INCOMPATIBLE",
      );
      await teardown();
    }
  });

  test("deterministic output for identical inputs", async () => {
    const service = await setup({});
    const first = await service.bind(command());
    const second = await service.bind(command());
    expect(first).toEqual(second);
    await teardown();
  });
});
