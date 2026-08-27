import {
  type GateDefinition,
  type GateEvent,
  replayGateHistory,
  snapshotEvidenceActor,
} from "../../domain/gates/gates.ts";
import { type Actor, RecordValidationError } from "../../domain/records.ts";
import {
  findTask,
  type TaskGate,
  taskState,
} from "../../domain/tasks/tasks.ts";
import type { TaskMutationResult, TaskRepository } from "../tasks/tasks.ts";

export interface DefineGateCommand {
  readonly reference: string;
  readonly definition: GateDefinition;
  readonly eventId: string;
  readonly operationId: string;
}

export interface SubmitEvidenceCommand {
  readonly reference: string;
  readonly gateId: string;
  readonly evidenceId: string;
  readonly evidenceReference: string;
  readonly actorId: string;
  readonly submittedAt: Date;
  readonly eventId: string;
  readonly operationId: string;
}

function projectedGates(events: readonly GateEvent[]): readonly TaskGate[] {
  return replayGateHistory(events).gates.map((gate) => ({
    id: gate.id,
    title: gate.title,
    blocking: gate.blocking,
    state: gate.state,
    evidence: gate.evidence.map((evidence) => evidence.reference),
    ...(gate.satisfiedBy ? { satisfiedBy: gate.satisfiedBy } : {}),
  }));
}

/** Appends a gate event and persists its deterministic task projection in one CAS write. */
export class GateService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly actors: readonly Actor[],
    private readonly ownedPathFor = (taskId: string) =>
      `.quest/tasks/${taskId}.md`,
  ) {}

  private async append(
    reference: string,
    eventFor: (taskId: string, events: readonly GateEvent[]) => GateEvent,
  ): Promise<TaskMutationResult> {
    const snapshot = await this.repository.readAll();
    const task = findTask(snapshot.tasks, reference);
    const event = eventFor(task.id, task.gateEvents);
    const events = [...task.gateEvents, event];
    const next = taskState({
      ...task,
      gateEvents: events,
      gates: projectedGates(events),
    });
    const result = await this.repository.write({
      task: next,
      expectedRevision: snapshot.revision,
      operationId: event.operationId,
      ownedPaths: [this.ownedPathFor(task.id)],
    });
    return result.kind === "success"
      ? { kind: "success", task: next, revision: result.revision }
      : result;
  }

  async define(command: DefineGateCommand): Promise<TaskMutationResult> {
    return this.append(command.reference, (taskId) => ({
      eventId: command.eventId,
      operationId: command.operationId,
      taskId: taskId as GateEvent["taskId"],
      kind: "gate-defined",
      definition: command.definition,
    }));
  }

  async submitEvidence(
    command: SubmitEvidenceCommand,
  ): Promise<TaskMutationResult> {
    const actor = this.actors.find(
      (candidate) => candidate.id === command.actorId,
    );
    if (!actor)
      throw new RecordValidationError("gate_evidence_actor_not_declared");
    return this.append(command.reference, (taskId) => ({
      eventId: command.eventId,
      operationId: command.operationId,
      taskId: taskId as GateEvent["taskId"],
      kind: "evidence-submitted",
      gateId: command.gateId,
      evidence: {
        id: command.evidenceId,
        reference: command.evidenceReference,
        actor: snapshotEvidenceActor(actor),
        submittedAt: command.submittedAt.toISOString(),
      },
    }));
  }
}
