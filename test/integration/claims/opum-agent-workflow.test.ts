import { describe, expect, test } from "bun:test";

import {
  OpumAgentWorkflowBindingService,
  OpumAgentWorkflowError,
} from "../../../src/application/claims/opum-agent-workflow.ts";
import type { ClaimReadSnapshot } from "../../../src/application/claims/claims.ts";
import type { TaskBindingSubject } from "../../../src/application/claims/opum-agent-workflow.ts";

const correlation = "f54125ae12e541f4b7ba83abb8ba8a35";

function model(
  overrides: Partial<{
    subject: TaskBindingSubject | null;
    snapshot: ClaimReadSnapshot;
    repositoryId: string;
  }> = {},
): {
  subject: () => Promise<TaskBindingSubject | null>;
  claimSnapshot?: () => Promise<ClaimReadSnapshot>;
  repositoryId: () => Promise<string>;
} {
  const result: {
    subject: () => Promise<TaskBindingSubject | null>;
    claimSnapshot?: () => Promise<ClaimReadSnapshot>;
    repositoryId: () => Promise<string>;
  } = {
    subject: async () =>
      "subject" in overrides
        ? (overrides.subject ?? null)
        : ({
            id: "T-1",
            status: "In Progress",
            references: [correlation],
          } satisfies TaskBindingSubject),
    repositoryId: async () => overrides.repositoryId ?? "/repo/common",
  };
  if (overrides.snapshot) {
    const snapshot = overrides.snapshot;
    result.claimSnapshot = async () => snapshot;
  }
  return result;
}

const command = {
  contract: "opum-agent-workflow/v1",
  taskId: "T-1",
  claimOrCorrelationId: correlation,
  holder: "agent-1",
  baseRef: "origin/dev",
  settlementRef: "origin/dev",
  requestId: "a".repeat(32),
  now: new Date("2026-08-24T00:01:00.000Z"),
} as const;

async function codeOf(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    expect(error).toBeInstanceOf(OpumAgentWorkflowError);
    return (error as OpumAgentWorkflowError).code;
  }
  throw new Error("expected the binding to fail");
}

describe("OpumAgentWorkflowBindingService", () => {
  test("binds through a public task reference with an accepted correlation", async () => {
    const service = new OpumAgentWorkflowBindingService(model());
    const response = await service.bind(command);
    expect(response.contract).toBe("opum-agent-workflow");
    expect(response.requestId).toMatch(/^[0-9a-f]{32}$/);
    expect(response.binding).toMatchObject({
      selectedVersion: 1,
      taskId: "T-1",
      relationshipKind: "correlation",
      relationshipState: "accepted",
      holder: "agent-1",
      baseRef: "origin/dev",
      settlementRef: "origin/dev",
    });
    const issued = Date.parse(response.binding.issuedAt);
    const expires = Date.parse(response.binding.expiresAt);
    expect(expires - issued).toBeLessThanOrEqual(5 * 60 * 1000);
  });

  test("resolves a live claim through the public CAS/liveness replay", async () => {
    const snapshot: ClaimReadSnapshot = {
      revision: "r1",
      tasks: [{ id: "T-1", aliases: [] }],
      actors: [
        { id: "human", kind: "human", roles: ["maintainer"] },
        {
          id: "agent-1",
          kind: "delegated-agent",
          accountableHumanId: "human",
          roles: [],
        },
      ],
      events: [
        {
          eventId: correlation,
          operationId: "op-1",
          taskId: "T-1",
          kind: "claimed",
          generation: "g1",
          holderId: "agent-1",
          accountableHumanId: "human",
          at: "2026-08-24T00:00:30.000Z",
        },
      ],
    };
    const service = new OpumAgentWorkflowBindingService(model({ snapshot }));
    const response = await service.bind({
      ...command,
      claimOrCorrelationId: correlation,
    });
    expect(response.binding.relationshipKind).toBe("claim");
    expect(response.binding.relationshipState).toBe("active");
  });

  test("unknown tasks and unbound identities are ABSENT", async () => {
    const missingTask = new OpumAgentWorkflowBindingService(
      model({ subject: null }),
    );
    expect(await codeOf(() => missingTask.bind(command))).toBe(
      "OPUM_WORKFLOW_QUEST_ABSENT",
    );
    const noRelationship = new OpumAgentWorkflowBindingService(
      model({ subject: { id: "T-1", status: "In Progress" } }),
    );
    expect(await codeOf(() => noRelationship.bind(command))).toBe(
      "OPUM_WORKFLOW_QUEST_ABSENT",
    );
  });

  test("incompatible contracts are rejected without fallback", async () => {
    const service = new OpumAgentWorkflowBindingService(model());
    expect(
      await codeOf(() => service.bind({ ...command, contract: "other/v9" })),
    ).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
  });

  test("deterministic output for identical inputs", async () => {
    const service = new OpumAgentWorkflowBindingService(model());
    const first = await service.bind(command);
    const second = await service.bind(command);
    expect(first).toEqual(second);
  });
});
