import {
  type Actor,
  type CanonicalId,
  canonicalId,
  declareActor,
  RecordConflictError,
  RecordValidationError,
} from "../records.ts";

export interface GateDefinition {
  readonly id: string;
  readonly title: string;
  readonly blocking: boolean;
  /** The person whose work must be independently reviewed, if any. */
  readonly separatedFromActorId?: string;
  /** A delegated agent is never eligible for this kind of evidence. */
  readonly requiresHumanJudgement: boolean;
  readonly requiredRole?: "reviewer" | "maintainer";
}

export interface EvidenceActorSnapshot {
  readonly id: string;
  readonly kind: "human" | "delegated-agent";
  readonly roles: readonly ("reviewer" | "maintainer")[];
  readonly accountableHumanId?: string;
}

export interface GateEvidence {
  readonly id: string;
  readonly reference: string;
  /** The immutable declaration used to decide eligibility at submission time. */
  readonly actor: EvidenceActorSnapshot;
  readonly submittedAt: string;
}

export type GateEvent =
  | {
      readonly eventId: string;
      readonly operationId: string;
      readonly taskId: CanonicalId;
      readonly kind: "gate-defined";
      readonly definition: GateDefinition;
    }
  | {
      readonly eventId: string;
      readonly operationId: string;
      readonly taskId: CanonicalId;
      readonly kind: "evidence-submitted";
      readonly gateId: string;
      readonly evidence: GateEvidence;
    };

export interface GateState {
  readonly id: string;
  readonly title: string;
  readonly blocking: boolean;
  readonly state: "pending" | "satisfied";
  readonly evidence: readonly GateEvidence[];
  readonly satisfiedBy?: string;
}

export interface GateHistory {
  readonly taskId: CanonicalId;
  readonly events: readonly GateEvent[];
  readonly gates: readonly GateState[];
}

function validText(value: string, reason: string): void {
  if (!value) throw new RecordValidationError(reason);
}

function definition(value: GateDefinition): GateDefinition {
  validText(value.id, "gate_definition_invalid");
  validText(value.title, "gate_definition_invalid");
  if (value.separatedFromActorId !== undefined)
    validText(value.separatedFromActorId, "gate_definition_invalid");
  return value;
}

/** Capture the declaration in the evidence event so later actor edits cannot rewrite history. */
export function snapshotEvidenceActor(actor: Actor): EvidenceActorSnapshot {
  return actor.kind === "human"
    ? { id: actor.id, kind: actor.kind, roles: [...actor.roles] }
    : {
        id: actor.id,
        kind: actor.kind,
        roles: [...actor.roles],
        accountableHumanId: actor.accountableHumanId,
      };
}

function evidence(value: GateEvidence): GateEvidence {
  validText(value.id, "gate_evidence_invalid");
  validText(value.reference, "gate_evidence_invalid");
  validText(value.submittedAt, "gate_evidence_invalid");
  const actor = declareActor(value.actor);
  if (
    actor.kind !== value.actor.kind ||
    (actor.kind === "delegated-agent" &&
      actor.accountableHumanId !== value.actor.accountableHumanId)
  )
    throw new RecordValidationError("gate_evidence_actor_invalid");
  return value;
}

function eligible(gate: GateDefinition, candidate: GateEvidence): boolean {
  const actor = candidate.actor;
  if (gate.separatedFromActorId === actor.id) return false;
  if (gate.requiresHumanJudgement && actor.kind !== "human") return false;
  return !gate.requiredRole || actor.roles.includes(gate.requiredRole);
}

/**
 * Replays one task's authored gate stream. Evidence is retained even when it
 * is ineligible, making rejected self-review auditable without satisfying a gate.
 */
export function replayGateHistory(events: readonly GateEvent[]): GateHistory {
  if (!events.length) throw new RecordValidationError("gate_history_empty");
  const taskId = events[0]?.taskId;
  if (!taskId) throw new RecordValidationError("gate_history_empty");
  canonicalId(taskId);
  const seenEvents = new Set<string>();
  const seenOperations = new Set<string>();
  const definitions = new Map<string, GateDefinition>();
  const evidenceByGate = new Map<string, GateEvidence[]>();
  for (const event of events) {
    canonicalId(event.taskId);
    if (event.taskId !== taskId)
      throw new RecordValidationError("gate_task_mismatch");
    validText(event.eventId, "gate_event_invalid");
    validText(event.operationId, "gate_event_invalid");
    if (seenEvents.has(event.eventId) || seenOperations.has(event.operationId))
      throw new RecordConflictError("gate_event_duplicate");
    seenEvents.add(event.eventId);
    seenOperations.add(event.operationId);
    if (event.kind === "gate-defined") {
      const next = definition(event.definition);
      if (definitions.has(next.id))
        throw new RecordConflictError("gate_definition_duplicate");
      definitions.set(next.id, next);
      continue;
    }
    if (!definitions.has(event.gateId))
      throw new RecordValidationError("gate_evidence_unknown_gate");
    const next = evidence(event.evidence);
    const current = evidenceByGate.get(event.gateId) ?? [];
    if (current.some((item) => item.id === next.id))
      throw new RecordConflictError("gate_evidence_duplicate");
    evidenceByGate.set(event.gateId, [...current, next]);
  }
  const gates = [...definitions.values()].map((gate) => {
    const evidence = evidenceByGate.get(gate.id) ?? [];
    const satisfying = evidence.find((item) => eligible(gate, item));
    return {
      id: gate.id,
      title: gate.title,
      blocking: gate.blocking,
      state: satisfying ? ("satisfied" as const) : ("pending" as const),
      evidence,
      ...(satisfying ? { satisfiedBy: satisfying.actor.id } : {}),
    };
  });
  return { taskId, events: [...events], gates };
}

export function blockingGatesSatisfied(gates: readonly GateState[]): boolean {
  return gates.every((gate) => !gate.blocking || gate.state === "satisfied");
}
