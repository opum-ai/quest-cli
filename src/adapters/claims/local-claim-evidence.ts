import { createHash } from "node:crypto";
import type { GitPort } from "../../ports/git.ts";
import type { ClaimEvent } from "../../domain/claims/claims.ts";
import type { Actor, CanonicalId } from "../../domain/records.ts";
import { aliasKey } from "../../domain/records.ts";
import { taskState, type TaskState } from "../../domain/tasks/tasks.ts";
import { RecordValidationError } from "../../domain/records.ts";
import { OpumAgentWorkflowError } from "../../domain/claims/opum-agent-workflow.ts";
import type {
  ClaimEvidencePort,
  TaskRelationshipReader,
  TaskRelationshipRecord,
} from "../../ports/claims.ts";
import type { TaskRelationshipCasWriter } from "../../ports/claims.ts";

/**
 * Deterministic, collision-resistant mapping of an opaque public identity to
 * a fixed safe path. The identity never enters a filesystem or tree path.
 */
export function safeStorageName(identity: string): string {
  return `${createHash("sha256").update(identity, "utf8").digest("hex")}`;
}

function unreadable(): OpumAgentWorkflowError {
  return new OpumAgentWorkflowError(
    "OPUM_WORKFLOW_QUEST_INCOMPATIBLE",
    "Relationship evidence is unreadable.",
  );
}

function corruptClaimEvidence(): OpumAgentWorkflowError {
  return new OpumAgentWorkflowError(
    "OPUM_WORKFLOW_QUEST_STATE",
    "Claim history failed CAS replay.",
  );
}

const RELATIONSHIP_SCHEMA_KEYS = new Set([
  "schemaVersion",
  "id",
  "taskId",
  "kind",
  "state",
  "holder",
  "baseRef",
  "settlementRef",
]);
const RELATIONSHIP_KINDS = new Set(["claim", "correlation"]);
const RELATIONSHIP_STATES = new Set([
  "accepted",
  "delivered",
  "working",
  "cancelled",
  "rejected",
  "expired",
  "superseded",
  "done",
]);
const LIVE_CORRELATION_STATES = new Set(["accepted", "delivered", "working"]);

/**
 * Closed authoritative schema validation on Git-object content. Exact keys,
 * exact types, closed kind/state vocabularies, kind-appropriate holder rules,
 * and internal id agreement. Returns the validated record or throws a stable
 * redacted diagnostic.
 */
export function validateRelationshipRecord(
  value: unknown,
  requestedId: string,
): TaskRelationshipRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw unreadable();
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!RELATIONSHIP_SCHEMA_KEYS.has(key)) throw unreadable();
  }
  for (const key of [
    "schemaVersion",
    "id",
    "taskId",
    "kind",
    "state",
    "baseRef",
    "settlementRef",
  ]) {
    if (!(key in record)) throw unreadable();
  }
  if (record.schemaVersion !== 1) throw unreadable();
  if (typeof record.id !== "string" || record.id.length === 0)
    throw unreadable();
  if (record.id !== requestedId) {
    throw new OpumAgentWorkflowError(
      "OPUM_WORKFLOW_QUEST_INCOMPATIBLE",
      "Relationship record identity does not match the request.",
    );
  }
  if (typeof record.taskId !== "string" || record.taskId.length === 0) {
    throw unreadable();
  }
  if (typeof record.kind !== "string" || !RELATIONSHIP_KINDS.has(record.kind)) {
    throw unreadable();
  }
  if (
    typeof record.state !== "string" ||
    !RELATIONSHIP_STATES.has(record.state)
  ) {
    throw unreadable();
  }
  const declaresHolder =
    "holder" in record &&
    record.holder !== undefined &&
    typeof record.holder === "string";
  if ("holder" in record && record.holder !== undefined && !declaresHolder) {
    throw unreadable();
  }
  if (record.kind === "claim" && declaresHolder) {
    // Claim holder identity comes exclusively from the live lease.
    throw unreadable();
  }
  if (record.kind === "correlation" && !declaresHolder) {
    throw unreadable();
  }
  if (typeof record.baseRef !== "string" || record.baseRef.length === 0) {
    throw unreadable();
  }
  if (
    typeof record.settlementRef !== "string" ||
    record.settlementRef.length === 0
  ) {
    throw unreadable();
  }
  return {
    schemaVersion: 1,
    id: record.id,
    taskId: record.taskId,
    kind: record.kind as "claim" | "correlation",
    state: record.state as TaskRelationshipRecord["state"],
    ...(declaresHolder ? { holder: record.holder as string } : {}),
    baseRef: record.baseRef,
    settlementRef: record.settlementRef,
  };
}

/**
 * Revision-pinned evidence read over Git objects. Every read resolves content
 * at one immutable commit, so hostile worktree symlinks cannot affect what is
 * consumed; no worktree filesystem access occurs at all.
 */
export class GitSnapshotEvidence implements ClaimEvidencePort {
  constructor(
    private readonly git: GitPort,
    private readonly repositoryPath: string,
    /** The immutable revision every evidence object is read from. */
    readonly revision: string,
  ) {}

  private async blob(path: string): Promise<string | null> {
    return this.git.readBlob(this.repositoryPath, this.revision, path);
  }

  async events(taskId: CanonicalId): Promise<readonly ClaimEvent[]> {
    const text = await this.blob(`.quest/claims/${String(taskId)}.jsonl`);
    if (text === null) return [];
    const seen = new Set<string>();
    const events: ClaimEvent[] = [];
    for (const line of text.split("\n")) {
      if (line.trim().length === 0) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        throw corruptClaimEvidence();
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw corruptClaimEvidence();
      }
      const event = parsed as Record<string, unknown>;
      if (typeof event.eventId !== "string") throw corruptClaimEvidence();
      if (seen.has(event.eventId)) throw corruptClaimEvidence();
      seen.add(event.eventId);
      events.push(parsed as unknown as ClaimEvent);
    }
    return events;
  }

  async actors(): Promise<readonly Actor[]> {
    const text = await this.blob(".quest/claims/actors.json");
    if (text === null) return [];
    try {
      const parsed: unknown = JSON.parse(text);
      if (!Array.isArray(parsed)) throw corruptClaimEvidence();
      return parsed as Actor[];
    } catch (error) {
      if (error instanceof OpumAgentWorkflowError) throw error;
      throw corruptClaimEvidence();
    }
  }

  async relationship(id: string): Promise<TaskRelationshipRecord | null> {
    const text = await this.blob(
      `.quest/relationships/${safeStorageName(id)}.json`,
    );
    if (text === null) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw unreadable();
    }
    return validateRelationshipRecord(parsed, id);
  }

  /**
   * Resolves the bound task from the same pinned snapshot. Returns null when
   * absent so the caller maps it onto ABSENT.
   */
  async task(
    reference: string,
  ): Promise<{ id: string; status: string } | null> {
    const files = (
      await this.git.listFiles(
        this.repositoryPath,
        this.revision,
        ".quest/tasks",
      )
    )
      .filter((file) => file.endsWith(".json"))
      .sort();
    const tasks: TaskState[] = [];
    for (const file of files) {
      const text = await this.blob(file);
      if (text === null) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw unreadable();
      }
      // Authoritative domain validation: malformed committed records fail
      // closed instead of being skipped.
      let state: TaskState;
      try {
        state = taskState(parsed as TaskState);
      } catch {
        throw unreadable();
      }
      tasks.push(state);
    }
    const seen = new Set<string>();
    for (const task of tasks) {
      if (seen.has(task.id)) throw unreadable();
      seen.add(task.id);
    }
    const aliasOwners = new Map<string, string>();
    for (const task of tasks) {
      for (const alias of task.aliases) {
        const key = aliasKey(alias);
        const owner = aliasOwners.get(key);
        if (owner !== undefined && owner !== task.id) throw unreadable();
        aliasOwners.set(key, task.id);
      }
    }
    // Deterministic resolution with the repository's own reference semantics.
    let match: TaskState | undefined;
    for (const task of tasks) {
      if (
        ![task.id, ...task.aliases].some(
          (value) => aliasKey(value) === aliasKey(reference),
        )
      ) {
        continue;
      }
      if (match && match.id !== task.id) {
        throw new OpumAgentWorkflowError(
          "OPUM_WORKFLOW_QUEST_INCOMPATIBLE",
          "Task reference is ambiguous.",
        );
      }
      match ??= task;
    }
    return match ? { id: match.id, status: match.status } : null;
  }
}

/**
 * Production-owned CAS claim repository over the Git operation seam. Reads
 * return one snapshot's tasks/actors/events with the pinned revision; append
 * enforces expectedRevision + operationId + ownedPaths and commits atomically.
 */
export class LocalClaimRepository {
  constructor(
    private readonly git: GitPort,
    private readonly repositoryPath: string,
    private readonly targetRef = "HEAD",
  ) {}

  async read(): Promise<{
    revision: string;
    tasks: readonly { id: string; aliases: readonly string[] }[];
    actors: readonly Actor[];
    events: readonly ClaimEvent[];
  }> {
    const revision = await this.git.readRevision(
      this.repositoryPath,
      this.targetRef,
    );
    const evidence = new GitSnapshotEvidence(
      this.git,
      this.repositoryPath,
      revision,
    );
    const files = await this.git.listFiles(
      this.repositoryPath,
      revision,
      ".quest/tasks",
    );
    const tasks: { id: string; aliases: readonly string[] }[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const text = await this.git.readBlob(this.repositoryPath, revision, file);
      if (text === null) continue;
      try {
        const parsed = JSON.parse(text) as {
          id?: unknown;
          aliases?: unknown;
        };
        if (typeof parsed.id === "string") {
          tasks.push({
            id: parsed.id,
            aliases:
              Array.isArray(parsed.aliases) &&
              parsed.aliases.every((a) => typeof a === "string")
                ? (parsed.aliases as string[])
                : [],
          });
        }
      } catch {
        // Unreadable task metadata is not claim evidence; skip.
      }
    }
    const actorList = await evidence.actors();
    const allEvents: ClaimEvent[] = [];
    for (const file of await this.git.listFiles(
      this.repositoryPath,
      revision,
      ".quest/claims",
    )) {
      if (!file.endsWith(".jsonl")) continue;
      const text = await this.git.readBlob(this.repositoryPath, revision, file);
      if (text === null) continue;
      for (const line of text.split("\n")) {
        if (line.trim().length === 0) continue;
        allEvents.push(JSON.parse(line) as ClaimEvent);
      }
    }
    return { revision, tasks, actors: actorList, events: allEvents };
  }

  async append(request: {
    event: ClaimEvent;
    expectedRevision: string;
    operationId: string;
    ownedPaths: readonly string[];
  }): Promise<
    | { kind: "success"; revision: string }
    | {
        kind: "conflict";
        expectedRevision: string;
        actualRevision: string;
        operationId: string;
        ownedPaths: readonly string[];
      }
  > {
    // The sole authoritative path is derived internally from the validated
    // canonical event taskId; caller-selected paths are never trusted.
    const canonicalTaskId = String(request.event.taskId);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(canonicalTaskId)) {
      throw new RecordValidationError("claim_task_id_invalid");
    }
    const derivedPath = `.quest/claims/${canonicalTaskId}.jsonl`;
    const ownedPaths = [...request.ownedPaths];
    if (ownedPaths.length !== 1 || ownedPaths[0] !== derivedPath) {
      throw new RecordValidationError("claim_owned_path_mismatch");
    }
    const actual = await this.git.readRevision(
      this.repositoryPath,
      this.targetRef,
    );
    if (actual !== request.expectedRevision) {
      return {
        kind: "conflict",
        expectedRevision: request.expectedRevision,
        actualRevision: actual,
        operationId: request.operationId,
        ownedPaths,
      };
    }
    const existing =
      (await this.git.readBlob(this.repositoryPath, actual, derivedPath)) ?? "";
    // Blob reads are trimmed; re-add the line separator deterministically.
    const base = existing.length > 0 ? `${existing}\n` : "";
    const content = `${base}${JSON.stringify(request.event)}\n`;
    const result = await this.git.commit({
      repositoryPath: this.repositoryPath,
      targetRef: this.targetRef,
      expectedRevision: request.expectedRevision,
      operationId: request.operationId,
      message: `claim ${request.operationId}`,
      ownedPaths,
      changes: [{ path: derivedPath, content }],
    });
    return result.kind === "success"
      ? { kind: "success", revision: result.revision }
      : {
          kind: "conflict",
          expectedRevision: request.expectedRevision,
          actualRevision: result.actualRevision,
          operationId: request.operationId,
          ownedPaths,
        };
  }
}

/** CAS relationship writer over the Git operation seam (repository-owned). */
export class LocalTaskRelationshipCasWriter
  implements TaskRelationshipCasWriter
{
  constructor(
    private readonly git: GitPort,
    private readonly repositoryPath: string,
    private readonly targetRef = "HEAD",
  ) {}

  async write(request: {
    record: TaskRelationshipRecord;
    expectedRevision: string;
    operationId: string;
  }) {
    const actual = await this.git.readRevision(
      this.repositoryPath,
      this.targetRef,
    );
    if (actual !== request.expectedRevision) {
      return {
        kind: "conflict" as const,
        expectedRevision: request.expectedRevision,
        actualRevision: actual,
        operationId: request.operationId,
      };
    }
    const path = `.quest/relationships/${safeStorageName(request.record.id)}.json`;
    const result = await this.git.commit({
      repositoryPath: this.repositoryPath,
      targetRef: this.targetRef,
      expectedRevision: request.expectedRevision,
      operationId: request.operationId,
      message: `relationship ${request.operationId}`,
      ownedPaths: [path],
      changes: [
        { path, content: `${JSON.stringify(request.record, null, 2)}\n` },
      ],
    });
    return result.kind === "success"
      ? { kind: "success" as const, revision: result.revision }
      : {
          kind: "conflict" as const,
          expectedRevision: request.expectedRevision,
          actualRevision: result.actualRevision,
          operationId: request.operationId,
        };
  }
}
