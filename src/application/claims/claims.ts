import {
  type ClaimEvent,
  type ClaimLeaseSettings,
  type ClaimTaskReference,
  claimLeasePolicy,
  evaluateClaim,
  replayClaimHistory,
  resolveClaimTask,
} from "../../domain/claims/claims.ts";
import { type Actor, RecordConflictError } from "../../domain/records.ts";

export interface ClaimReadSnapshot {
  readonly revision: string;
  readonly tasks: readonly ClaimTaskReference[];
  readonly actors: readonly Actor[];
  readonly events: readonly ClaimEvent[];
}
export interface ClaimReader {
  read(): Promise<ClaimReadSnapshot>;
}
export interface ClaimWriteRequest {
  readonly event: ClaimEvent;
  readonly expectedRevision: string;
  readonly operationId: string;
  readonly ownedPaths: readonly string[];
}
export interface ClaimWriteSuccess {
  readonly kind: "success";
  readonly revision: string;
}
export interface ClaimWriteConflict {
  readonly kind: "conflict";
  readonly expectedRevision: string;
  readonly actualRevision: string;
  readonly operationId: string;
  readonly ownedPaths: readonly string[];
}
export type ClaimWriteResult = ClaimWriteSuccess | ClaimWriteConflict;
export interface ClaimWriter {
  append(request: ClaimWriteRequest): Promise<ClaimWriteResult>;
}
export interface ClaimRepository extends ClaimReader, ClaimWriter {}
export type ClaimMutationResult =
  | {
      readonly kind: "success";
      readonly event: ClaimEvent;
      readonly revision: string;
    }
  | ClaimWriteConflict;

export interface ClaimCommand {
  readonly reference: string;
  readonly actorId: string;
  readonly generation: string;
  readonly eventId: string;
  readonly operationId: string;
  readonly at: Date;
}

export interface HeartbeatCommand extends ClaimCommand {}
export interface DelegationCommand {
  readonly reference: string;
  readonly accountableHumanId: string;
  readonly delegatedActorId: string;
  readonly generation: string;
  readonly eventId: string;
  readonly operationId: string;
  readonly at: Date;
}

function taskEvents(
  events: readonly ClaimEvent[],
  taskId: string,
): readonly ClaimEvent[] {
  return events.filter((event) => event.taskId === taskId);
}

/** Coordinates one CAS-protected, append-only lease event at a time. */
export class ClaimService {
  constructor(
    private readonly repository: ClaimRepository,
    private readonly policy: ClaimLeaseSettings = {},
    private readonly ownedPathFor = (taskId: string) =>
      `.quest/claims/${taskId}.jsonl`,
  ) {
    claimLeasePolicy(policy);
  }

  private async append(
    snapshot: ClaimReadSnapshot,
    event: ClaimEvent,
  ): Promise<ClaimMutationResult> {
    const result = await this.repository.append({
      event,
      expectedRevision: snapshot.revision,
      operationId: event.operationId,
      ownedPaths: [this.ownedPathFor(event.taskId)],
    });
    return result.kind === "success"
      ? { kind: "success", event, revision: result.revision }
      : result;
  }

  async claim(command: ClaimCommand): Promise<ClaimMutationResult> {
    const snapshot = await this.repository.read();
    const taskId = resolveClaimTask(snapshot.tasks, command.reference);
    const historyEvents = taskEvents(snapshot.events, taskId);
    const history = historyEvents.length
      ? replayClaimHistory(historyEvents, snapshot.actors, this.policy)
      : undefined;
    const current = evaluateClaim(history, command.at);
    if (current.anomalies.length)
      throw new RecordConflictError(current.anomalies.join(","));
    if (current.status === "live") throw new RecordConflictError("claim_live");
    const actor = snapshot.actors.find(
      (candidate) => candidate.id === command.actorId,
    );
    if (!actor) throw new RecordConflictError("claim_actor_not_declared");
    return this.append(snapshot, {
      eventId: command.eventId,
      operationId: command.operationId,
      taskId,
      kind: current.status === "unclaimed" ? "claimed" : "reclaimed",
      generation: command.generation,
      holderId: actor.id,
      accountableHumanId:
        actor.kind === "human" ? actor.id : actor.accountableHumanId,
      at: command.at.toISOString(),
    });
  }

  async heartbeat(command: HeartbeatCommand): Promise<ClaimMutationResult> {
    const snapshot = await this.repository.read();
    const taskId = resolveClaimTask(snapshot.tasks, command.reference);
    const history = replayClaimHistory(
      taskEvents(snapshot.events, taskId),
      snapshot.actors,
      this.policy,
    );
    const current = evaluateClaim(history, command.at);
    if (current.status !== "live" || !current.lease)
      throw new RecordConflictError("claim_heartbeat_not_live");
    if (
      current.lease.generation !== command.generation ||
      current.lease.holderId !== command.actorId
    )
      throw new RecordConflictError("claim_heartbeat_stale_generation");
    return this.append(snapshot, {
      eventId: command.eventId,
      operationId: command.operationId,
      taskId,
      kind: "renewed",
      generation: command.generation,
      holderId: current.lease.holderId,
      accountableHumanId: current.lease.accountableHumanId,
      at: command.at.toISOString(),
    });
  }

  async delegate(command: DelegationCommand): Promise<ClaimMutationResult> {
    const snapshot = await this.repository.read();
    const taskId = resolveClaimTask(snapshot.tasks, command.reference);
    const history = replayClaimHistory(
      taskEvents(snapshot.events, taskId),
      snapshot.actors,
      this.policy,
    );
    const current = evaluateClaim(history, command.at);
    const delegate = snapshot.actors.find(
      (actor) => actor.id === command.delegatedActorId,
    );
    if (
      current.status !== "live" ||
      !current.lease ||
      current.lease.generation !== command.generation ||
      current.lease.accountableHumanId !== command.accountableHumanId ||
      delegate?.kind !== "delegated-agent" ||
      delegate.accountableHumanId !== command.accountableHumanId
    )
      throw new RecordConflictError("claim_delegation_invalid");
    return this.append(snapshot, {
      eventId: command.eventId,
      operationId: command.operationId,
      taskId,
      kind: "delegated",
      generation: command.generation,
      holderId: delegate.id,
      accountableHumanId: command.accountableHumanId,
      at: command.at.toISOString(),
    });
  }
}
