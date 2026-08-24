import type { ClaimReadSnapshot } from "./claims.ts";
import {
  evaluateClaim,
  replayClaimHistory,
} from "../../domain/claims/claims.ts";
import {
  evaluateTaskBindingV1,
  OpumAgentWorkflowError,
  OPUM_AGENT_WORKFLOW_MAX_LIFETIME_MS,
  parseTaskBindingRequestV1,
  type BindingRelationshipEvidence,
  type QuestTaskBindingV1,
} from "../../domain/claims/opum-agent-workflow.ts";

export { OpumAgentWorkflowError };

/** Minimal read projection of the bound task; canonical alias resolution happens upstream. */
export interface TaskBindingSubject {
  readonly id: string;
  readonly status: string;
  readonly references?: readonly string[];
}

export interface TaskBindingReadModel {
  /** Resolves the canonical alias and returns the task, or null when absent. */
  subject(reference: string): Promise<TaskBindingSubject | null>;
  /** Optional live claim store; when absent only correlations can bind. */
  claimSnapshot?(): Promise<ClaimReadSnapshot>;
  repositoryId(): Promise<string>;
}

export interface TaskBindingCommand {
  readonly contract: string;
  readonly taskId: string;
  readonly claimOrCorrelationId: string;
  readonly holder: string;
  readonly baseRef: string;
  readonly settlementRef: string;
  readonly requestId: string;
  readonly now?: Date;
}

export interface TaskBindingResponseV1 {
  readonly contract: "opum-agent-workflow";
  readonly requestId: string;
  readonly binding: QuestTaskBindingV1;
}

function relationshipFromClaims(
  snapshot: ClaimReadSnapshot,
  taskId: string,
  identity: string,
  now: Date,
): BindingRelationshipEvidence | undefined {
  const events = snapshot.events.filter(
    (event) =>
      event.taskId === taskId &&
      (event.eventId === identity ||
        event.operationId === identity ||
        event.holderId === identity),
  );
  if (events.length === 0) return undefined;
  const history = replayClaimHistory(events, snapshot.actors);
  const evaluation = evaluateClaim(history, now);
  if (!history?.lease) return undefined;
  return {
    kind: "claim",
    id: taskId,
    state:
      evaluation.status === "live"
        ? "active"
        : evaluation.status === "reclaimable"
          ? "expired"
          : "unclaimed",
  };
}

/**
 * Read-only application service assembling the public opum-agent-workflow/v1
 * binding from Quest's canonical alias resolution, claim liveness replay, and
 * the caller-declared environment. Performs no mutation of any kind.
 */
export class OpumAgentWorkflowBindingService {
  constructor(private readonly model: TaskBindingReadModel) {}

  async bind(command: TaskBindingCommand): Promise<TaskBindingResponseV1> {
    const now = command.now ?? new Date();
    const request = parseTaskBindingRequestV1({
      contract:
        command.contract === "opum-agent-workflow/v1"
          ? "opum-agent-workflow"
          : command.contract,
      supportedVersions: [1],
      requestId: command.requestId,
      taskId: command.taskId,
    });
    const subject = await this.model.subject(command.taskId);
    if (!subject || subject.id !== command.taskId) {
      throw new OpumAgentWorkflowError(
        "OPUM_WORKFLOW_QUEST_ABSENT",
        "No such task.",
      );
    }
    let relationship = relationshipFromClaims(
      (await this.model.claimSnapshot?.()) ?? {
        revision: "",
        tasks: [],
        actors: [],
        events: [],
      },
      subject.id,
      command.claimOrCorrelationId,
      now,
    );
    if (!relationship) {
      const accepted = subject.references?.includes(
        command.claimOrCorrelationId,
      );
      relationship = accepted
        ? { kind: "correlation", id: subject.id, state: "accepted" }
        : undefined;
    }
    const issuedAt = now.toISOString();
    const expiresAt = new Date(
      now.getTime() + OPUM_AGENT_WORKFLOW_MAX_LIFETIME_MS,
    ).toISOString();
    const binding = evaluateTaskBindingV1({
      request,
      subject: { taskId: subject.id, status: subject.status },
      relationship,
      environment: {
        issuedAt,
        expiresAt,
        observedAt: now,
        repositoryId: await this.model.repositoryId(),
        holder: command.holder,
        baseRef: command.baseRef,
        settlementRef: command.settlementRef,
      },
    });
    return {
      contract: "opum-agent-workflow",
      requestId: request.requestId,
      binding,
    };
  }
}
