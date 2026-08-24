import { createHash } from "node:crypto";

import type { ClaimEvent } from "../../domain/claims/claims.ts";
import {
  replayClaimHistory,
  evaluateClaim,
} from "../../domain/claims/claims.ts";
import {
  evaluateTaskBindingV1,
  OpumAgentWorkflowError,
  OPUM_AGENT_WORKFLOW_CLOCK_SKEW_MS,
  OPUM_AGENT_WORKFLOW_MAX_LIFETIME_MS,
  parseTaskBindingRequestV1,
  type ClaimGenerationEvidence,
  type QuestTaskBindingV1Response,
  type RelationshipRecordEvidence,
} from "../../domain/claims/opum-agent-workflow.ts";
import type { Actor } from "../../domain/records.ts";
import type { TaskRelationshipRecord } from "../../ports/claims.ts";

export { OpumAgentWorkflowError };
export type { QuestTaskBindingV1Response };

/** Minimal read projection of the bound task; canonical alias resolution happens upstream. */
export interface TaskBindingSubject {
  readonly id: string;
  readonly status: string;
}

export interface TaskBindingReadModel {
  subject(reference: string): Promise<TaskBindingSubject | null>;
  /** Live claim evidence; required so claim bindings use real CAS replay. */
  claimEvents(taskId: string): Promise<readonly ClaimEvent[]>;
  actors(): Promise<readonly Actor[]>;
  relationship(id: string): Promise<TaskRelationshipRecord | null>;
  /** Derived from the exact Quest workspace, compared against the request. */
  repositoryId(): Promise<string>;
}

export interface TaskBindingCommand {
  readonly contract: string;
  readonly taskId: string;
  readonly claimOrCorrelationId: string;
  readonly holder: string;
  readonly repositoryId: string;
  readonly baseRef: string;
  readonly settlementRef: string;
  readonly requestId: string;
  readonly now?: Date;
}

function generationBound(
  events: readonly ClaimEvent[],
  identity: string,
  lease: { readonly generation: string } | undefined,
): boolean {
  if (!lease) return false;
  return events.some(
    (event) =>
      event.generation === lease.generation &&
      (event.eventId === identity || event.operationId === identity),
  );
}

/**
 * Read-only binding orchestration: canonical alias resolution, authoritative
 * relationship record lookup, full claim-history CAS/liveness replay, and
 * exact environment comparison. Performs no mutation of any kind.
 */
export class OpumAgentWorkflowBindingService {
  constructor(private readonly model: TaskBindingReadModel) {}

  async bind(command: TaskBindingCommand): Promise<QuestTaskBindingV1Response> {
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
    const record = await this.model.relationship(command.claimOrCorrelationId);
    let claim: ClaimGenerationEvidence | undefined;
    if (record?.kind === "claim") {
      try {
        const events = await this.model.claimEvents(subject.id);
        const actors = await this.model.actors();
        const history = events.length
          ? replayClaimHistory(events, actors)
          : undefined;
        const evaluation = evaluateClaim(history, now);
        claim = {
          anomalous:
            (evaluation.anomalies?.length ?? 0) > 0 ||
            (history?.anomalies.length ?? 0) > 0,
          live: evaluation.status === "live",
          hasLease: Boolean(history?.lease),
          holderId: history?.lease?.holderId ?? null,
          generationBound: generationBound(
            events,
            command.claimOrCorrelationId,
            history?.lease,
          ),
        };
      } catch (error) {
        if (error instanceof OpumAgentWorkflowError) throw error;
        // Corrupt or unordered authoritative claim evidence is never live.
        throw new OpumAgentWorkflowError(
          "OPUM_WORKFLOW_QUEST_STATE",
          "Claim history failed CAS replay.",
        );
      }
    }
    const issuedAt = now.toISOString();
    const expiresAt = new Date(
      now.getTime() +
        OPUM_AGENT_WORKFLOW_MAX_LIFETIME_MS -
        OPUM_AGENT_WORKFLOW_CLOCK_SKEW_MS,
    ).toISOString();
    return evaluateTaskBindingV1({
      request,
      subject: { taskId: subject.id, status: subject.status },
      identity: command.claimOrCorrelationId,
      record: record
        ? ({
            id: record.id,
            taskId: record.taskId,
            kind: record.kind,
            state: record.state,
            ...(record.holder === undefined ? {} : { holder: record.holder }),
            baseRef: record.baseRef,
            settlementRef: record.settlementRef,
          } satisfies RelationshipRecordEvidence)
        : undefined,
      claim,
      environment: {
        issuedAt,
        expiresAt,
        observedAt: now,
        derivedRepositoryId: await this.model.repositoryId(),
        requestedRepositoryId: command.repositoryId,
        requestedHolder: command.holder,
        requestedBaseRef: command.baseRef,
        requestedSettlementRef: command.settlementRef,
      },
    });
  }
}

/** Deterministic revision digest helper for snapshot-style stores. */
export function contentRevision(parts: readonly string[]): string {
  const hash = createHash("sha256");
  for (const part of parts) hash.update(part);
  return hash.digest("hex");
}
