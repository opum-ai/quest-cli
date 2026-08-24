/**
 * Public, read-only task-binding contract for the opum-doc control plane
 * (ODOC-71.8, `opum-agent-workflow` v1).
 *
 * Pure module: exact request/response envelopes, strict diagnostics, and the
 * freshness gate. Never touches private storage, Lore, worktrees, or writes.
 */

export const OPUM_AGENT_WORKFLOW_CONTRACT = "opum-agent-workflow" as const;

/** The only supported contract version; requests never fall back. */
export const OPUM_AGENT_WORKFLOW_SUPPORTED_VERSIONS = [1] as const;

/** Stable, redacted diagnostic codes surfaced to control-plane consumers. */
export type OpumAgentWorkflowFailureCode =
  | "OPUM_WORKFLOW_QUEST_ABSENT"
  | "OPUM_WORKFLOW_QUEST_STALE"
  | "OPUM_WORKFLOW_QUEST_INCOMPATIBLE"
  | "OPUM_WORKFLOW_QUEST_STATE";

export class OpumAgentWorkflowError extends Error {
  constructor(
    readonly code: OpumAgentWorkflowFailureCode,
    message: string,
  ) {
    super(message);
  }
}

/** Maximum accepted binding lifetime; longer lifetimes are stale by definition. */
export const OPUM_AGENT_WORKFLOW_MAX_LIFETIME_MS = 5 * 60 * 1_000;
/** Clock-skew allowance before `issuedAt`. */
export const OPUM_AGENT_WORKFLOW_CLOCK_SKEW_MS = 60 * 1_000;

export interface TaskBindingRequestV1 {
  readonly contract: typeof OPUM_AGENT_WORKFLOW_CONTRACT;
  readonly supportedVersions: readonly [1];
  /** 32 lowercase hex characters. */
  readonly requestId: string;
  readonly taskId: string;
}

/**
 * The exact public v1 response body printed on stdout. Closed key set:
 * contract, selectedVersion, requestId, taskId, plus the ten record fields.
 */
export interface QuestTaskBindingV1Response {
  readonly contract: typeof OPUM_AGENT_WORKFLOW_CONTRACT;
  readonly selectedVersion: 1;
  readonly requestId: string;
  readonly taskId: string;
  readonly repositoryId: string;
  readonly holder: string;
  readonly taskState: "in_progress";
  readonly relationshipKind: "claim" | "correlation";
  readonly relationshipId: string;
  readonly relationshipState: "active" | "accepted" | "delivered" | "working";
  readonly baseRef: string;
  readonly settlementRef: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

const REQUEST_ID_PATTERN = /^[0-9a-f]{32}$/;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const TERMINAL_RELATIONSHIP_STATES = new Set([
  "cancelled",
  "rejected",
  "expired",
  "superseded",
  "done",
]);
const ACCEPTABLE_CORRELATION_STATES = new Set([
  "accepted",
  "delivered",
  "working",
]);

function fail(code: OpumAgentWorkflowFailureCode, message: string): never {
  throw new OpumAgentWorkflowError(code, message);
}

function incompatible(message: string): never {
  return fail("OPUM_WORKFLOW_QUEST_INCOMPATIBLE", message);
}

function finiteTime(value: string): number {
  if (!ISO_TIMESTAMP_PATTERN.test(value)) {
    incompatible(
      `Timestamp ${JSON.stringify(value)} is not a UTC ISO instant.`,
    );
  }
  return Date.parse(value);
}

/**
 * Validates the exact request envelope. Unknown fields, wrong contract or
 * version, and malformed request ids all fail closed with INCOMPATIBLE.
 */
export function parseTaskBindingRequestV1(
  value: unknown,
): TaskBindingRequestV1 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    incompatible("Binding request must be an object.");
  }
  const record = value as Record<string, unknown>;
  const allowed = new Set([
    "contract",
    "supportedVersions",
    "requestId",
    "taskId",
  ]);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) incompatible(`Unknown binding field ${key}.`);
  }
  if (record.contract !== OPUM_AGENT_WORKFLOW_CONTRACT) {
    incompatible("Unsupported binding contract.");
  }
  const versions = record.supportedVersions;
  if (
    !Array.isArray(versions) ||
    versions.length !== OPUM_AGENT_WORKFLOW_SUPPORTED_VERSIONS.length ||
    versions.some(
      (version, index) =>
        version !== OPUM_AGENT_WORKFLOW_SUPPORTED_VERSIONS[index],
    )
  ) {
    incompatible("Unsupported binding contract version set.");
  }
  if (
    typeof record.requestId !== "string" ||
    !REQUEST_ID_PATTERN.test(record.requestId)
  ) {
    incompatible("requestId must be 32 lowercase hex characters.");
  }
  if (typeof record.taskId !== "string" || record.taskId.length === 0) {
    incompatible("taskId must be a non-empty string.");
  }
  return record as unknown as TaskBindingRequestV1;
}

/**
 * Authoritative relationship record resolved from repository-owned public
 * state. The caller-declared identity selects it; its contents are trusted
 * only because they are repository-native, never because they were echoed.
 */
export interface RelationshipRecordEvidence {
  readonly id: string;
  readonly taskId: string;
  readonly kind: "claim" | "correlation";
  readonly state: string;
  /** Declared holder for correlations; claims verify against the live lease. */
  readonly holder?: string;
  readonly baseRef: string;
  readonly settlementRef: string;
}

/**
 * Live claim evidence produced by replaying the task's full event history
 * under the repository's CAS/liveness semantics.
 */
export interface ClaimGenerationEvidence {
  readonly anomalous: boolean;
  readonly live: boolean;
  readonly hasLease: boolean;
  readonly holderId: string | null;
  /**
   * True when the supplied opaque identity binds the CURRENT claim
   * generation. Stable rule: the identity matches the eventId or operationId
   * of an event whose generation equals the live lease's generation, so
   * renewals after the original identity stay live while superseded
   * generations fall away.
   */
  readonly generationBound: boolean;
}

export interface BindingEnvironmentInput {
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly observedAt: Date;
  /** Derived from the exact Quest workspace; compared against the request. */
  readonly derivedRepositoryId: string;
  readonly requestedRepositoryId: string;
  readonly requestedHolder: string;
  readonly requestedBaseRef: string;
  readonly requestedSettlementRef: string;
}

export interface BindingSubjectEvidence {
  readonly taskId: string;
  readonly status: string;
}

/**
 * Freshness gate: rejects non-finite or future-time bypasses, enforces the
 * skew window `issuedAt - 60s <= now < expiresAt`, and caps lifetime at 5m.
 */
export function validateBindingFreshness(
  environment: Pick<
    BindingEnvironmentInput,
    "issuedAt" | "expiresAt" | "observedAt"
  >,
): void {
  const issued = finiteTime(environment.issuedAt);
  const expires = finiteTime(environment.expiresAt);
  const now = environment.observedAt.getTime();
  if (!Number.isFinite(now)) {
    fail("OPUM_WORKFLOW_QUEST_STALE", "Observation instant is not finite.");
  }
  if (Number.isNaN(issued) || Number.isNaN(expires)) {
    fail(
      "OPUM_WORKFLOW_QUEST_STALE",
      "Binding lifetime timestamps are not finite instants.",
    );
  }
  if (now < issued - OPUM_AGENT_WORKFLOW_CLOCK_SKEW_MS) {
    fail(
      "OPUM_WORKFLOW_QUEST_STALE",
      "Binding observation precedes issuance beyond clock tolerance.",
    );
  }
  if (now >= expires) {
    fail("OPUM_WORKFLOW_QUEST_STALE", "Binding has expired.");
  }
  if (expires - issued > OPUM_AGENT_WORKFLOW_MAX_LIFETIME_MS) {
    fail(
      "OPUM_WORKFLOW_QUEST_STALE",
      "Binding lifetime exceeds the five-minute maximum.",
    );
  }
  if (expires <= issued) {
    fail("OPUM_WORKFLOW_QUEST_STALE", "Binding lifetime is not positive.");
  }
}

/** Normalizes a Quest lifecycle status into the contract's snake_case form. */
export function normalizedTaskState(status: string): string {
  return status
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/gu, "_");
}

/**
 * Pure v1 evaluation producing the exact public response. Every field source
 * is authoritative: subject from the canonical alias resolution, relationship
 * from the repository-owned record, claim liveness from CAS replay, and the
 * repository identifier from the workspace itself. Caller assertions are only
 * ever compared, never trusted.
 */
export function evaluateTaskBindingV1(input: {
  readonly request: TaskBindingRequestV1;
  readonly subject: BindingSubjectEvidence;
  /** The exact opaque identity the caller bound; must match the record. */
  readonly identity: string;
  readonly record?: RelationshipRecordEvidence;
  readonly claim?: ClaimGenerationEvidence;
  readonly environment: BindingEnvironmentInput;
}): QuestTaskBindingV1Response {
  validateBindingFreshness(input.environment);
  const record = input.record;
  if (!record) {
    fail(
      "OPUM_WORKFLOW_QUEST_ABSENT",
      "No repository relationship record binds this identity.",
    );
  }
  // Domain-level binding guard: a record for one relationship must never
  // authorize or emit another identity, even if an adapter is faulty.
  if (record.id !== input.identity || input.identity.length === 0) {
    incompatible("Relationship record identity does not match the request.");
  }
  if (record.taskId !== input.subject.taskId) {
    incompatible("Relationship record is bound to a different task.");
  }
  if (normalizedTaskState(input.subject.status) !== "in_progress") {
    fail("OPUM_WORKFLOW_QUEST_STATE", "Bound task is not in progress.");
  }
  if (TERMINAL_RELATIONSHIP_STATES.has(record.state)) {
    fail(
      "OPUM_WORKFLOW_QUEST_STATE",
      `Relationship state ${record.state} is terminal.`,
    );
  }
  let relationshipState: QuestTaskBindingV1Response["relationshipState"];
  let holder: string;
  if (record.kind === "claim") {
    const claim = input.claim;
    if (!claim)
      fail(
        "OPUM_WORKFLOW_QUEST_STATE",
        "No claim history is available for this task.",
      );
    if (claim.anomalous)
      fail("OPUM_WORKFLOW_QUEST_STATE", "Claim history failed CAS replay.");
    if (!claim.hasLease || !claim.live) {
      fail(
        "OPUM_WORKFLOW_QUEST_STATE",
        "The claim lease is not live (expired, reclaimed, or superseded).",
      );
    }
    if (!claim.generationBound) {
      fail(
        "OPUM_WORKFLOW_QUEST_STATE",
        "Identity does not bind the current claim generation.",
      );
    }
    holder = claim.holderId ?? "";
    relationshipState = "active";
  } else {
    if (!ACCEPTABLE_CORRELATION_STATES.has(record.state)) {
      fail(
        "OPUM_WORKFLOW_QUEST_STATE",
        `Relationship state ${record.state} is not acceptable.`,
      );
    }
    holder = record.holder ?? "";
    relationshipState = record.state as "accepted" | "delivered" | "working";
  }
  if (
    input.environment.requestedHolder !== holder ||
    input.environment.derivedRepositoryId !==
      input.environment.requestedRepositoryId ||
    record.baseRef !== input.environment.requestedBaseRef ||
    record.settlementRef !== input.environment.requestedSettlementRef ||
    record.baseRef.length === 0 ||
    record.settlementRef.length === 0 ||
    holder.length === 0
  ) {
    incompatible(
      "Holder, repository, base, or settlement does not match the authoritative record.",
    );
  }
  return {
    contract: OPUM_AGENT_WORKFLOW_CONTRACT,
    selectedVersion: 1,
    requestId: input.request.requestId,
    taskId: input.subject.taskId,
    repositoryId: input.environment.derivedRepositoryId,
    holder,
    taskState: "in_progress",
    relationshipKind: record.kind,
    relationshipId: record.id,
    relationshipState,
    baseRef: record.baseRef,
    settlementRef: record.settlementRef,
    issuedAt: input.environment.issuedAt,
    expiresAt: input.environment.expiresAt,
  };
}
