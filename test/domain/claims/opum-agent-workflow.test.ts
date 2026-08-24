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

function environment(
  overrides: Partial<
    Parameters<typeof evaluateTaskBindingV1>[0]["environment"]
  > = {},
) {
  return {
    issuedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2026-08-24T00:05:00.000Z",
    observedAt: new Date("2026-08-24T00:01:00.000Z"),
    repositoryId: "/repo/common",
    holder: "agent-1",
    baseRef: "origin/dev",
    settlementRef: "origin/dev",
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
          environment({
            observedAt: new Date("2026-08-23T23:58:00.000Z"),
          }),
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
  const relationship = {
    kind: "claim" as const,
    id: "T-1",
    state: "active",
  };

  test("binds an in-progress task with a live claim", () => {
    const binding = evaluateTaskBindingV1({
      request,
      subject,
      relationship,
      environment: environment(),
    });
    expect(binding).toEqual({
      selectedVersion: 1,
      taskId: "T-1",
      repositoryId: "/repo/common",
      holder: "agent-1",
      taskState: "in_progress",
      relationshipKind: "claim",
      relationshipId: "T-1",
      relationshipState: "active",
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
      relationship,
      environment: environment(),
    });
    const second = evaluateTaskBindingV1({
      request,
      subject,
      relationship,
      environment: environment(),
    });
    expect(first).toEqual(second);
  });

  test("accepts correlation relationships only in accepted/delivered/working states", () => {
    const states = ["accepted", "delivered", "working"] as const;
    for (const state of states) {
      expect(
        evaluateTaskBindingV1({
          request,
          subject,
          relationship: { kind: "correlation", id: "T-1", state },
          environment: environment(),
        }).relationshipState,
      ).toBe(state);
    }
    expect(
      codeOf(() =>
        evaluateTaskBindingV1({
          request,
          subject,
          relationship: { kind: "correlation", id: "T-1", state: "rejected" },
          environment: environment(),
        }),
      ),
    ).toBe("OPUM_WORKFLOW_QUEST_STATE");
  });

  test("absent relationship is ABSENT", () => {
    expect(
      codeOf(() =>
        evaluateTaskBindingV1({
          request,
          subject,
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
          relationship,
          environment: environment(),
        }),
      ),
    ).toBe("OPUM_WORKFLOW_QUEST_STATE");
  });

  test("expired claims are STATE rejections", () => {
    expect(
      codeOf(() =>
        evaluateTaskBindingV1({
          request,
          subject,
          relationship: { kind: "claim", id: "T-1", state: "expired" },
          environment: environment(),
        }),
      ),
    ).toBe("OPUM_WORKFLOW_QUEST_STATE");
  });
});

test("status normalization maps Quest lifecycle labels to snake_case", () => {
  expect(normalizedTaskState("In Progress")).toBe("in_progress");
  expect(normalizedTaskState("in-progress")).toBe("in_progress");
  expect(normalizedTaskState("To Do")).toBe("to_do");
});
