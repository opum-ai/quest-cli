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
 * Strict stdin-envelope scanner and parser: decodes every member name
 * (including \uXXXX escapes) and refuses duplicate keys — escaped-equivalent
 * names such as "requestId" versus "\u0072equestId" are detected before any
 * semantic validation.
 */
export function parseStrictJson(text: string): unknown {
  let position = 0;

  const fail = (message: string): never => {
    throw new OpumAgentWorkflowError(
      "OPUM_WORKFLOW_QUEST_INCOMPATIBLE",
      message,
    );
  };

  const skipWhitespace = (): void => {
    while (position < text.length && /\s/.test(text[position] ?? "")) {
      position += 1;
    }
  };

  const decodeString = (): string => {
    position += 1; // opening quote
    let value = "";
    while (position < text.length) {
      const character = text[position] ?? "";
      if (character === '"') {
        position += 1;
        return value;
      }
      if (character !== "\\") {
        value += character;
        position += 1;
        continue;
      }
      const escapeChar = text[position + 1] ?? "";
      position += 2;
      switch (escapeChar) {
        case '"':
          value += '"';
          break;
        case "\\":
          value += "\\";
          break;
        case "/":
          value += "/";
          break;
        case "b":
          value += "\b";
          break;
        case "f":
          value += "\f";
          break;
        case "n":
          value += "\n";
          break;
        case "r":
          value += "\r";
          break;
        case "t":
          value += "\t";
          break;
        case "u": {
          const hex = text.slice(position, position + 4);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            fail("Invalid unicode escape in key.");
          }
          value += String.fromCharCode(Number.parseInt(hex, 16));
          position += 4;
          break;
        }
        default:
          fail("Invalid escape in key.");
      }
    }
    return fail("Unterminated string in request envelope.");
  };

  const memberNames = new Map<object, Set<string>>();

  const recordMember = (container: object, name: string): void => {
    let names = memberNames.get(container);
    if (!names) {
      names = new Set();
      memberNames.set(container, names);
    }
    if (names.has(name)) fail("Duplicate key in request envelope.");
    names.add(name);
  };

  const scanValue = (): unknown => {
    skipWhitespace();
    const character = text[position] ?? "";
    if (character === "{") {
      position += 1;
      const obj: Record<string, unknown> = {};
      skipWhitespace();
      if ((text[position] ?? "") === "}") {
        position += 1;
        return obj;
      }
      for (;;) {
        skipWhitespace();
        if ((text[position] ?? "") !== '"') fail("Expected member name.");
        const name = decodeString();
        recordMember(obj, name);
        skipWhitespace();
        if ((text[position] ?? "") !== ":") fail('Expected ":".');
        position += 1;
        skipWhitespace();
        obj[name] = scanValue();
        skipWhitespace();
        const separator = text[position] ?? "";
        if (separator === ",") {
          position += 1;
          continue;
        }
        if (separator === "}") {
          position += 1;
          return obj;
        }
        fail('Expected "," or "}".');
      }
    }
    if (character === "[") {
      position += 1;
      const array: unknown[] = [];
      skipWhitespace();
      if ((text[position] ?? "") === "]") {
        position += 1;
        return array;
      }
      for (;;) {
        array.push(scanValue());
        skipWhitespace();
        const separator = text[position] ?? "";
        if (separator === ",") {
          position += 1;
          continue;
        }
        if (separator === "]") {
          position += 1;
          return array;
        }
        fail('Expected "," or "]".');
      }
    }
    if (character === '"') return decodeString();
    const literalStart = position;
    while (position < text.length && !/[,}\]\s]/u.test(text[position] ?? "")) {
      position += 1;
    }
    const literal = text.slice(literalStart, position);
    if (
      !/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)$/u.test(
        literal,
      )
    ) {
      fail("Invalid literal in request envelope.");
    }
    return literal;
  };
  scanValue();
  // Require the scan to consume the entire input (trailing whitespace only).
  skipWhitespace();
  if (position < text.length) {
    fail("Unexpected trailing content after request envelope.");
  }
  // Native value types come from JSON.parse.
  position = 0;
  return JSON.parse(text);
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
