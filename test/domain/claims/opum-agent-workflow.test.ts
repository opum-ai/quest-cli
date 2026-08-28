import { describe, expect, test } from "bun:test";

import {
  evaluateTaskBindingV1,
  normalizedTaskState,
  OpumAgentWorkflowError,
  parseTaskBindingRequestV1,
  validateBindingFreshness,
} from "../../../src/domain/claims/opum-agent-workflow.ts";

const request = {
  contract: "opum-agent-workflow",
  supportedVersions: [1],
  requestId: "a".repeat(32),
  taskId: "T-1",
} as const;

const record = {
  id: "corr-1",
  taskId: "T-1",
  kind: "correlation" as const,
  state: "accepted",
  holder: "agent-1",
  baseRef: "origin/dev",
  settlementRef: "origin/dev",
};

function environment(
  overrides: Partial<
    Parameters<typeof evaluateTaskBindingV1>[0]["environment"]
  > = {},
) {
  return {
    issuedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2026-08-24T00:05:00.000Z",
    observedAt: new Date("2026-08-24T00:01:00.000Z"),
    derivedRepositoryId: "/repo/common",
    requestedRepositoryId: "/repo/common",
    requestedHolder: "agent-1",
    requestedBaseRef: "origin/dev",
    requestedSettlementRef: "origin/dev",
    ...overrides,
  };
}

function codeOf(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(OpumAgentWorkflowError);
    return (error as OpumAgentWorkflowError).code;
  }
  throw new Error("expected the evaluation to fail");
}

describe("opum-agent-workflow/v1 request envelope", () => {
  test("accepts the exact supported envelope", () => {
    expect(parseTaskBindingRequestV1({ ...request })).toMatchObject({
      contract: "opum-agent-workflow",
      requestId: "a".repeat(32),
      taskId: "T-1",
    });
  });

  test("rejects unknown fields with INCOMPATIBLE", () => {
    expect(
      codeOf(() => parseTaskBindingRequestV1({ ...request, extra: true })),
    ).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
  });

  test("rejects unknown contracts and versions without fallback", () => {
    expect(
      codeOf(() =>
        parseTaskBindingRequestV1({ ...request, contract: "other" }),
      ),
    ).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
    expect(
      codeOf(() =>
        parseTaskBindingRequestV1({ ...request, supportedVersions: [2] }),
      ),
    ).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
  });

  test("rejects malformed or uppercase request ids", () => {
    expect(
      codeOf(() => parseTaskBindingRequestV1({ ...request, requestId: "xyz" })),
    ).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
    expect(
      codeOf(() =>
        parseTaskBindingRequestV1({ ...request, requestId: "A".repeat(32) }),
      ),
    ).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
  });
});

describe("binding freshness", () => {
  test("accepts observations within the skew and expiry window", () => {
    validateBindingFreshness(environment());
  });

  test("rejects future observation beyond tolerance as STALE", () => {
    expect(
      codeOf(() =>
        validateBindingFreshness(
          environment({ observedAt: new Date("2026-08-23T23:58:00.000Z") }),
        ),
      ),
    ).toBe("OPUM_WORKFLOW_QUEST_STALE");
  });

  test("rejects expired bindings as STALE", () => {
    expect(
      codeOf(() =>
        validateBindingFreshness(
          environment({ observedAt: new Date("2026-08-24T00:05:00.000Z") }),
        ),
      ),
    ).toBe("OPUM_WORKFLOW_QUEST_STALE");
  });

  test("rejects lifetimes over five minutes as STALE", () => {
    expect(
      codeOf(() =>
        validateBindingFreshness(
          environment({ expiresAt: "2026-08-24T00:06:00.000Z" }),
        ),
      ),
    ).toBe("OPUM_WORKFLOW_QUEST_STALE");
  });

  test("rejects malformed timestamps as INCOMPATIBLE envelope drift", () => {
    expect(
      codeOf(() =>
        validateBindingFreshness(environment({ issuedAt: "not-a-time" })),
      ),
    ).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
  });
});

describe("task binding evaluation", () => {
  const subject = { taskId: "T-1", status: "In Progress" };

  const expectedKeys = [
    "contract",
    "selectedVersion",
    "requestId",
    "taskId",
    "repositoryId",
    "holder",
    "taskState",
    "relationshipKind",
    "relationshipId",
    "relationshipState",
    "baseRef",
    "settlementRef",
    "issuedAt",
    "expiresAt",
  ];

  test("produces the exact closed public key set for a correlation binding", () => {
    const response = evaluateTaskBindingV1({
      request,
      subject,
      identity: "corr-1",
      record,
      environment: environment(),
    });
    expect(Object.keys(response).sort()).toEqual([...expectedKeys].sort());
    expect(response).toEqual({
      contract: "opum-agent-workflow",
      selectedVersion: 1,
      requestId: "a".repeat(32),
      taskId: "T-1",
      repositoryId: "/repo/common",
      holder: "agent-1",
      taskState: "in_progress",
      relationshipKind: "correlation",
      relationshipId: "corr-1",
      relationshipState: "accepted",
      baseRef: "origin/dev",
      settlementRef: "origin/dev",
      issuedAt: "2026-08-24T00:00:00.000Z",
      expiresAt: "2026-08-24T00:05:00.000Z",
    });
  });

  test("deterministic output across repeated evaluations", () => {
    const first = evaluateTaskBindingV1({
      request,
      subject,
      identity: "corr-1",
      record,
      environment: environment(),
    });
    const second = evaluateTaskBindingV1({
      request,
      subject,
      identity: "corr-1",
      record,
      environment: environment(),
    });
    expect(first).toEqual(second);
  });

  test("live claims bind through the current generation with lease holder identity", () => {
    const response = evaluateTaskBindingV1({
      request,
      subject,
      identity: "evt-1",
      record: { ...record, id: "evt-1", kind: "claim", holder: undefined },
      claim: {
        anomalous: false,
        live: true,
        hasLease: true,
        holderId: "agent-1",
        generationBound: true,
      },
      environment: environment({ requestedHolder: "agent-1" }),
    });
    expect(response.relationshipKind).toBe("claim");
    expect(response.relationshipState).toBe("active");
    expect(response.relationshipId).toBe("evt-1");
    expect(response.holder).toBe("agent-1");
  });

  test("expired, reclaimed, anomalous, and unbound generations are STATE", () => {
    for (const claim of [
      {
        anomalous: false,
        live: false,
        hasLease: true,
        holderId: "agent-1",
        generationBound: true,
      },
      {
        anomalous: false,
        live: false,
        hasLease: false,
        holderId: null,
        generationBound: false,
      },
      {
        anomalous: true,
        live: true,
        hasLease: true,
        holderId: "agent-1",
        generationBound: true,
      },
      {
        anomalous: false,
        live: true,
        hasLease: true,
        holderId: "agent-1",
        generationBound: false,
      },
    ]) {
      expect(
        codeOf(() =>
          evaluateTaskBindingV1({
            request,
            subject,
            identity: "corr-1",
            record: { ...record, kind: "claim", holder: undefined },
            claim,
            environment: environment(),
          }),
        ),
      ).toBe("OPUM_WORKFLOW_QUEST_STATE");
    }
  });

  test("terminal relationship states are STATE rejections", () => {
    for (const state of [
      "cancelled",
      "rejected",
      "expired",
      "superseded",
      "done",
    ]) {
      expect(
        codeOf(() =>
          evaluateTaskBindingV1({
            request,
            subject,
            identity: "corr-1",
            record: { ...record, state },
            environment: environment(),
          }),
        ),
      ).toBe("OPUM_WORKFLOW_QUEST_STATE");
    }
  });

  test("missing relationship records are ABSENT", () => {
    expect(
      codeOf(() =>
        evaluateTaskBindingV1({
          request,
          subject,
          identity: "corr-1",
          environment: environment(),
        }),
      ),
    ).toBe("OPUM_WORKFLOW_QUEST_ABSENT");
  });

  test("non-in-progress tasks are STATE rejections", () => {
    expect(
      codeOf(() =>
        evaluateTaskBindingV1({
          request,
          subject: { taskId: "T-1", status: "Done" },
          identity: "corr-1",
          record,
          environment: environment(),
        }),
      ),
    ).toBe("OPUM_WORKFLOW_QUEST_STATE");
  });

  test("foreign repository, holder, base, and settlement are INCOMPATIBLE", () => {
    for (const overrides of [
      { requestedRepositoryId: "/repo/other" },
      { requestedHolder: "agent-2" },
      { requestedBaseRef: "origin/main" },
      { requestedSettlementRef: "origin/main" },
    ]) {
      expect(
        codeOf(() =>
          evaluateTaskBindingV1({
            request,
            subject,
            identity: "corr-1",
            record,
            environment: environment(overrides),
          }),
        ),
      ).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
    }
  });

  test("records bound to a different task are INCOMPATIBLE", () => {
    expect(
      codeOf(() =>
        evaluateTaskBindingV1({
          request,
          subject,
          identity: "corr-1",
          record: { ...record, taskId: "T-9" },
          environment: environment(),
        }),
      ),
    ).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
  });
});

test("status normalization maps Quest lifecycle labels to snake_case", () => {
  expect(normalizedTaskState("In Progress")).toBe("in_progress");
  expect(normalizedTaskState("in-progress")).toBe("in_progress");
  expect(normalizedTaskState("To Do")).toBe("to_do");
});

test("a cross-wired record can never authorize another identity", () => {
  // Deliberately cross-wired: the record belongs to a different relationship.
  const crossWired = { ...record, id: "other-identity" };
  expect(
    codeOf(() =>
      evaluateTaskBindingV1({
        request,
        subject: { taskId: "T-1", status: "In Progress" },
        identity: "corr-1",
        record: crossWired,
        environment: environment(),
      }),
    ),
  ).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
});
