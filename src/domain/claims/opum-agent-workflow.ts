/**
 * Public, read-only task-binding contract for the opum-doc control plane
 * (ODOC-71.8, `opum-agent-workflow` v1).
 *
 * This module is pure: it defines the exact request envelope, the minimal
 * binding record, and strict diagnostics. It never reads private storage,
 * never calls Lore, never acquires worktrees, and never mutates anything.
 */

export const OPUM_AGENT_WORKFLOW_CONTRACT = "opum-agent-workflow" as const;

/** The only supported contract version; requests never fall back. */
export const OPUM_AGENT_WORKFLOW_SUPPORTED_VERSIONS = [1] as const;
export type OpumAgentWorkflowVersion =
  (typeof OPUM_AGENT_WORKFLOW_SUPPORTED_VERSIONS)[number];

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

export interface QuestTaskBindingV1 {
  readonly selectedVersion: 1;
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

function incompatible(message: string): never {
  throw new OpumAgentWorkflowError("OPUM_WORKFLOW_QUEST_INCOMPATIBLE", message);
}

function absent(message: string): never {
  throw new OpumAgentWorkflowError("OPUM_WORKFLOW_QUEST_ABSENT", message);
}

function stale(message: string): never {
  throw new OpumAgentWorkflowError("OPUM_WORKFLOW_QUEST_STALE", message);
}

function stateRejected(message: string): never {
  throw new OpumAgentWorkflowError("OPUM_WORKFLOW_QUEST_STATE", message);
}

function finiteTime(value: string): number {
  if (!ISO_TIMESTAMP_PATTERN.test(value)) {
    incompatible(
      `Timestamp ${JSON.stringify(value)} is not a UTC ISO instant.`,
    );
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return Number.NaN;
  return parsed;
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

export interface BindingEnvironmentInput {
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly observedAt: Date;
  readonly repositoryId: string;
  readonly holder: string;
  readonly baseRef: string;
  readonly settlementRef: string;
}

export interface BindingRelationshipEvidence {
  readonly kind: "claim" | "correlation";
  readonly id: string;
  readonly state: string;
}

export interface BindingSubjectEvidence {
  readonly taskId: string;
  /** Canonical Quest lifecycle status of the resolved task. */
  readonly status: string;
  readonly terminalStatuses?: readonly string[];
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
  if (!Number.isFinite(now)) stale("Observation instant is not finite.");
  if (Number.isNaN(issued) || Number.isNaN(expires)) {
    stale("Binding lifetime timestamps are not finite instants.");
  }
  if (now < issued - OPUM_AGENT_WORKFLOW_CLOCK_SKEW_MS) {
    stale("Binding observation precedes issuance beyond clock tolerance.");
  }
  if (now >= expires) stale("Binding has expired.");
  if (expires - issued > OPUM_AGENT_WORKFLOW_MAX_LIFETIME_MS) {
    stale("Binding lifetime exceeds the five-minute maximum.");
  }
  if (expires <= issued) stale("Binding lifetime is not positive.");
}

/** Normalizes a Quest lifecycle status into the contract's snake_case form. */
export function normalizedTaskState(status: string): string {
  return status
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/gu, "_");
}

/**
 * Pure v1 evaluation: subject, relationship, and environment must all be
 * exactly acceptable, otherwise a stable coded diagnostic is thrown.
 */
export function evaluateTaskBindingV1(input: {
  readonly request: TaskBindingRequestV1;
  readonly subject: BindingSubjectEvidence;
  readonly relationship?: BindingRelationshipEvidence;
  readonly environment: BindingEnvironmentInput;
}): QuestTaskBindingV1 {
  validateBindingFreshness(input.environment);
  if (input.subject.taskId !== input.request.taskId) {
    absent("Resolved task does not match the requested identifier.");
  }
  if (normalizedTaskState(input.subject.status) !== "in_progress") {
    const terminal = input.subject.terminalStatuses?.some(
      (candidate) =>
        normalizedTaskState(candidate) ===
        normalizedTaskState(input.subject.status),
    );
    stateRejected(
      terminal
        ? "Bound task is in a terminal state."
        : "Bound task is not in progress.",
    );
  }
  const relationship = input.relationship;
  if (!relationship || relationship.id !== input.request.taskId) {
    absent("No active claim or accepted correlation binds this task.");
  }
  if (relationship.kind === "claim") {
    if (relationship.state !== "active") {
      stateRejected(`Claim relationship is ${relationship.state}.`);
    }
  } else if (
    relationship.state !== "accepted" &&
    relationship.state !== "delivered" &&
    relationship.state !== "working"
  ) {
    stateRejected(`Correlation relationship is ${relationship.state}.`);
  }
  const environment = input.environment;
  if (
    environment.repositoryId.length === 0 ||
    environment.holder.length === 0 ||
    environment.baseRef.length === 0 ||
    environment.settlementRef.length === 0
  ) {
    incompatible("Repository, holder, base, and settlement are required.");
  }
  return {
    selectedVersion: 1,
    taskId: input.subject.taskId,
    repositoryId: environment.repositoryId,
    holder: environment.holder,
    taskState: "in_progress",
    relationshipKind: relationship.kind,
    relationshipId: relationship.id,
    relationshipState:
      relationship.kind === "claim" ? "active" : relationship.state,
    baseRef: environment.baseRef,
    settlementRef: environment.settlementRef,
    issuedAt: environment.issuedAt,
    expiresAt: environment.expiresAt,
  };
}
