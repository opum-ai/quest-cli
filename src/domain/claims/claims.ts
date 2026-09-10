import {
  type Actor,
  aliasKey,
  type CanonicalId,
  canonicalId,
  declareActors,
  RecordConflictError,
  RecordValidationError,
} from "../records.ts";

export interface ClaimLeaseSettings {
  readonly leaseDurationMs?: number;
  readonly heartbeatIntervalMs?: number;
}

export interface ClaimLeasePolicy {
  readonly leaseDurationMs: number;
  readonly heartbeatIntervalMs: number;
}

export const defaultClaimLeasePolicy: ClaimLeasePolicy = {
  leaseDurationMs: 30 * 60 * 1_000,
  heartbeatIntervalMs: 5 * 60 * 1_000,
};

/** Validates the explicitly configurable lease timings, including their safe ordering. */
export function claimLeasePolicy(
  settings: ClaimLeaseSettings = {},
): ClaimLeasePolicy {
  const policy = { ...defaultClaimLeasePolicy, ...settings };
  if (
    !Number.isSafeInteger(policy.leaseDurationMs) ||
    policy.leaseDurationMs <= 0 ||
    !Number.isSafeInteger(policy.heartbeatIntervalMs) ||
    policy.heartbeatIntervalMs <= 0 ||
    policy.heartbeatIntervalMs > policy.leaseDurationMs
  ) {
    throw new RecordValidationError("claim_lease_configuration_invalid");
  }
  return policy;
}

export type ClaimEventKind = "claimed" | "renewed" | "reclaimed" | "delegated";

/** An immutable event; the live lease is derived by replaying this sequence. */
export interface ClaimEvent {
  readonly eventId: string;
  readonly operationId: string;
  readonly taskId: CanonicalId;
  readonly kind: ClaimEventKind;
  readonly generation: string;
  readonly holderId: string;
  readonly accountableHumanId: string;
  readonly at: string;
}

export interface Lease {
  readonly taskId: CanonicalId;
  readonly generation: string;
  readonly holderId: string;
  readonly accountableHumanId: string;
  readonly startedAt: string;
  readonly renewedAt: string;
  readonly expiresAt: string;
}

export interface ClaimHistory {
  readonly taskId: CanonicalId;
  readonly events: readonly ClaimEvent[];
  readonly lease?: Lease;
  readonly anomalies: readonly string[];
}

export type ClaimStatus = "unclaimed" | "live" | "reclaimable";
export interface ClaimEvaluation {
  readonly status: ClaimStatus;
  readonly lease?: Lease;
  /** Named deterministic findings; callers must return these rather than guessing. */
  readonly anomalies: readonly string[];
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed))
    throw new RecordValidationError("claim_timestamp_invalid");
  return parsed;
}

function actorById(actors: readonly Actor[], id: string): Actor {
  const found = actors.find((actor) => actor.id === id);
  if (!found) throw new RecordValidationError("claim_actor_not_declared");
  return found;
}

function assertAccountability(
  event: ClaimEvent,
  actors: readonly Actor[],
): void {
  const holder = actorById(actors, event.holderId);
  const accountable = actorById(actors, event.accountableHumanId);
  if (accountable.kind !== "human")
    throw new RecordValidationError("claim_accountable_actor_not_human");
  if (
    (holder.kind === "human" && holder.id !== accountable.id) ||
    (holder.kind === "delegated-agent" &&
      holder.accountableHumanId !== accountable.id)
  ) {
    throw new RecordValidationError("claim_accountability_invalid");
  }
}

function assertEvent(event: ClaimEvent, actors: readonly Actor[]): void {
  if (!event.eventId || !event.operationId || !event.generation)
    throw new RecordValidationError("claim_event_invalid");
  canonicalId(event.taskId);
  timestamp(event.at);
  assertAccountability(event, actors);
}

/**
 * Replays a task's append-only claim events. Invalid event ordering is a named
 * anomaly, so a damaged or concurrently assembled history is never normalized.
 */
export function replayClaimHistory(
  events: readonly ClaimEvent[],
  actors: readonly unknown[],
  policy: ClaimLeaseSettings = {},
): ClaimHistory {
  const declared = declareActors(actors);
  claimLeasePolicy(policy);
  if (!events.length) throw new RecordValidationError("claim_history_empty");
  const taskId = events[0]?.taskId;
  if (!taskId) throw new RecordValidationError("claim_history_empty");
  const seenEvents = new Set<string>();
  const seenOperations = new Set<string>();
  const generations = new Set<string>();
  const anomalies: string[] = [];
  let lease: Lease | undefined;
  let previousAt: number | undefined;
  for (const event of events) {
    assertEvent(event, declared);
    const eventAt = timestamp(event.at);
    if (previousAt !== undefined && eventAt < previousAt)
      anomalies.push("claim_history_clock_regressed");
    previousAt = eventAt;
    if (event.taskId !== taskId)
      throw new RecordValidationError("claim_task_mismatch");
    if (seenEvents.has(event.eventId) || seenOperations.has(event.operationId))
      throw new RecordConflictError("claim_event_duplicate");
    seenEvents.add(event.eventId);
    seenOperations.add(event.operationId);
    if (event.kind === "claimed" || event.kind === "reclaimed") {
      if (generations.has(event.generation))
        throw new RecordConflictError("claim_generation_reused");
      if (event.kind === "claimed" && lease)
        throw new RecordConflictError("claim_already_exists");
      if (event.kind === "reclaimed" && !lease)
        throw new RecordValidationError("claim_reclamation_without_history");
      if (
        event.kind === "reclaimed" &&
        lease &&
        eventAt < timestamp(lease.expiresAt)
      ) {
        anomalies.push("claim_reclamation_before_expiry");
      }
      generations.add(event.generation);
      lease = {
        taskId,
        generation: event.generation,
        holderId: event.holderId,
        accountableHumanId: event.accountableHumanId,
        startedAt: event.at,
        renewedAt: event.at,
        expiresAt: new Date(
          eventAt + claimLeasePolicy(policy).leaseDurationMs,
        ).toISOString(),
      };
      continue;
    }
    if (!lease || event.generation !== lease.generation)
      throw new RecordConflictError("claim_generation_stale");
    if (event.kind === "renewed") {
      if (
        event.holderId !== lease.holderId ||
        event.accountableHumanId !== lease.accountableHumanId
      )
        throw new RecordConflictError("claim_holder_stale");
      lease = {
        ...lease,
        renewedAt: event.at,
        expiresAt: new Date(
          eventAt + claimLeasePolicy(policy).leaseDurationMs,
        ).toISOString(),
      };
    } else {
      if (event.accountableHumanId !== lease.accountableHumanId)
        throw new RecordConflictError(
          "claim_delegation_accountability_changed",
        );
      lease = { ...lease, holderId: event.holderId };
    }
  }
  return { taskId, events: [...events], lease, anomalies };
}

/** Evaluates expiry only from persisted history and the caller-supplied clock. */
export function evaluateClaim(
  history: ClaimHistory | undefined,
  now: Date,
): ClaimEvaluation {
  if (!history?.lease)
    return { status: "unclaimed", anomalies: history?.anomalies ?? [] };
  const nowMs = now.getTime();
  if (Number.isNaN(nowMs))
    throw new RecordValidationError("claim_clock_invalid");
  const expiry = timestamp(history.lease.expiresAt);
  const renewed = timestamp(history.lease.renewedAt);
  const anomalies = [
    ...(history.anomalies ?? []),
    ...(renewed > expiry ? ["claim_clock_anomaly"] : []),
  ];
  return {
    status: expiry > nowMs ? "live" : "reclaimable",
    lease: history.lease,
    anomalies,
  };
}

export interface ClaimTaskReference {
  readonly id: CanonicalId;
  readonly aliases: readonly string[];
}

/** Resolves before claim lookup, preventing aliases from acquiring separate leases. */
export function resolveClaimTask(
  tasks: readonly ClaimTaskReference[],
  reference: string,
): CanonicalId {
  const target = aliasKey(reference);
  let resolved: CanonicalId | undefined;
  for (const task of tasks) {
    for (const candidate of [task.id, ...task.aliases]) {
      if (aliasKey(candidate) !== target) continue;
      if (resolved && resolved !== task.id)
        throw new RecordConflictError("claim_reference_ambiguous");
      resolved = task.id;
    }
  }
  if (!resolved) throw new RecordValidationError("claim_task_not_found");
  return resolved;
}
