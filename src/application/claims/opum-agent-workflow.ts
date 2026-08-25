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
export { parseTaskBindingRequestV1 } from "../../domain/claims/opum-agent-workflow.ts";

/**
 * Strict stdin-envelope parser: refuses duplicate object keys before any
 * semantic validation, so silently-overwritten fields cannot slip through.
 */
/**
 * Strict stdin-envelope parser: refuses duplicate TOP-LEVEL object keys
 * before semantic parsing (JSON.parse alone silently overwrites them), then
 * defers to the exact-envelope validator.
 */
export function parseStrictJson(text: string): unknown {
  assertNoDuplicateTopLevelKeys(text);
  return JSON.parse(text);
}

function assertNoDuplicateTopLevelKeys(text: string): void {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return;
  const seen = new Set<string>();
  let index = 1;
  let depth = 0;
  while (index < trimmed.length - 1) {
    const character = trimmed[index];
    if (character === '"') {
      // Read a full JSON string.
      let cursor = index + 1;
      let escaped = false;
      let value = "";
      while (cursor < trimmed.length) {
        const c = trimmed[cursor];
        if (escaped) {
          value += c;
          escaped = false;
        } else if (c === "\\") {
          escaped = true;
        } else if (c === '"') {
          break;
        } else {
          value += c;
        }
        cursor += 1;
      }
      const afterQuote = trimmed.slice(cursor + 1).trimStart();
      const isKey = depth === 0 && afterQuote.startsWith(":");
      if (isKey) {
        if (seen.has(value)) {
          throw new OpumAgentWorkflowError(
            "OPUM_WORKFLOW_QUEST_INCOMPATIBLE",
            "Duplicate key in request envelope.",
          );
        }
        seen.add(value);
      }
      index = cursor + 1;
      continue;
    }
    if (character === "{" || character === "[") depth += 1;
    else if (character === "}" || character === "]") depth -= 1;
    index += 1;
  }
}
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
  /** Stdin transport: resolve the authoritative record for a task. */
  relationshipForTask?(taskId: string): Promise<TaskRelationshipRecord | null>;
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
  /**
   * Stdin transport mode: the facade supplies only contract/requestId/taskId,
   * so caller assertion inputs are absent and the authoritative relationship
   * record is the single source for holder/base/settlement comparisons.
   */
  readonly deriveAssertionsFromRecord?: boolean;
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
    // Resolve the raw reference entirely inside the immutable snapshot first;
    // the envelope is then validated against the canonical task id.
    const subject = await this.model.subject(command.taskId);
    if (!subject) {
      throw new OpumAgentWorkflowError(
        "OPUM_WORKFLOW_QUEST_ABSENT",
        "No such task.",
      );
    }
    const request = parseTaskBindingRequestV1({
      contract:
        command.contract === "opum-agent-workflow/v1"
          ? "opum-agent-workflow"
          : command.contract,
      supportedVersions: [1],
      requestId: command.requestId,
      taskId: subject.id,
    });
    const record =
      command.deriveAssertionsFromRecord && this.model.relationshipForTask
        ? ((await this.model.relationshipForTask(subject.id)) ??
          (await this.model.relationship(command.claimOrCorrelationId)))
        : await this.model.relationship(command.claimOrCorrelationId);
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
          // Stdin transport supplies no opaque identity; the live lease
          // itself is the authority, so generation binding cannot be
          // identity-proven and is satisfied by liveness alone.
          generationBound:
            command.deriveAssertionsFromRecord === true ||
            generationBound(
              events,
              command.claimOrCorrelationId,
              history?.lease,
            ),
        };
      } catch (error) {
        if (error instanceof OpumAgentWorkflowError) throw error;
        console.error("DBGREPLAY", String(error));
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
      // Stdin mode binds by task; the authoritative record's own id is the
      // accepted relationship identity emitted in the response.
      identity: command.deriveAssertionsFromRecord
        ? (record?.id ?? "")
        : command.claimOrCorrelationId,
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
        requestedRepositoryId: command.deriveAssertionsFromRecord
          ? await this.model.repositoryId()
          : command.repositoryId,
        requestedHolder: command.deriveAssertionsFromRecord
          ? (record?.holder ?? claim?.holderId ?? "")
          : command.holder,
        requestedBaseRef: command.deriveAssertionsFromRecord
          ? (record?.baseRef ?? "")
          : command.baseRef,
        requestedSettlementRef: command.deriveAssertionsFromRecord
          ? (record?.settlementRef ?? "")
          : command.settlementRef,
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
