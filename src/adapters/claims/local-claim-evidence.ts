import { createHash } from "node:crypto";
import { join } from "node:path";
import type { Actor, CanonicalId } from "../../domain/records.ts";
import type { ClaimEvent } from "../../domain/claims/claims.ts";
import { OpumAgentWorkflowError } from "../../domain/claims/opum-agent-workflow.ts";
import type {
  ClaimEvidencePort,
  TaskRelationshipPort,
  TaskRelationshipRecord,
} from "../../ports/claims.ts";

/**
 * Deterministic, collision-resistant mapping of an opaque public identity to
 * a fixed safe filename. The identity never enters a filesystem path.
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

/** Enforce that the resolved candidate stays beneath the resolved root. */
function assertContained(candidate: string, root: string): void {
  const resolvedRoot = root.endsWith("/") ? root : `${root}/`;
  if (!candidate.startsWith(resolvedRoot)) throw unreadable();
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
 * Closed authoritative schema validation at the adapter boundary. Exact keys,
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
  if (typeof record.taskId !== "string" || record.taskId.length === 0)
    throw unreadable();
  if (typeof record.kind !== "string" || !RELATIONSHIP_KINDS.has(record.kind)) {
    throw unreadable();
  }
  if (
    typeof record.state !== "string" ||
    !RELATIONSHIP_STATES.has(record.state)
  ) {
    throw unreadable();
  }
  if ("holder" in record && record.holder !== undefined) {
    if (typeof record.holder !== "string" || record.holder.length === 0) {
      throw unreadable();
    }
  }
  const declaresHolder =
    "holder" in record &&
    record.holder !== undefined &&
    typeof record.holder === "string";
  if (record.kind === "claim" && declaresHolder) {
    // Claim holder identity comes exclusively from the live lease.
    throw unreadable();
  }
  if (record.kind === "correlation") {
    if (!declaresHolder) throw unreadable();
    if (!LIVE_CORRELATION_STATES.has(record.state)) {
      // Terminal correlations still carry their holder; nothing extra needed.
    }
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
 * Read-only claim evidence over Quest's own `.quest/claims` layout. Identity
 * files are addressed by SHA-256 of the exact UTF-8 id; external consumers
 * never touch these files.
 */
export class LocalClaimEvidence implements ClaimEvidencePort {
  constructor(private readonly root: string) {}

  private containedPath(directory: string, name: string): string {
    const directoryPath = join(this.root, ".quest", directory);
    const candidate = join(directoryPath, name);
    assertContained(candidate, directoryPath);
    return candidate;
  }

  async events(taskId: CanonicalId): Promise<readonly ClaimEvent[]> {
    const path = this.containedPath(
      "claims",
      `${safeStorageName(String(taskId))}.jsonl`,
    );
    const file = Bun.file(path);
    if (!(await file.exists())) return [];
    let text: string;
    try {
      text = await file.text();
    } catch {
      throw corruptClaimEvidence();
    }
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
    const path = this.containedPath("claims", "actors.json");
    const file = Bun.file(path);
    if (!(await file.exists())) return [];
    try {
      const parsed: unknown = await file.json();
      if (!Array.isArray(parsed)) throw corruptClaimEvidence();
      return parsed as Actor[];
    } catch (error) {
      if (error instanceof OpumAgentWorkflowError) throw error;
      throw corruptClaimEvidence();
    }
  }
}

const RELATIONSHIP_SCHEMA_VERSION = 1;

/**
 * Repository-native relationship records under `.quest/relationships`, one
 * versioned JSON document per SHA-256-addressed identity. `write` is the
 * repository-owned update seam; external consumers only ever get reads.
 */
export class LocalTaskRelationshipRepository implements TaskRelationshipPort {
  constructor(private readonly root: string) {}

  private path(id: string): string {
    return this.containedPath("relationships", `${safeStorageName(id)}.json`);
  }

  private containedPath(directory: string, name: string): string {
    const directoryPath = join(this.root, ".quest", directory);
    const candidate = join(directoryPath, name);
    assertContained(candidate, directoryPath);
    return candidate;
  }

  async find(id: string): Promise<TaskRelationshipRecord | null> {
    const file = Bun.file(this.path(id));
    if (!(await file.exists())) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw unreadable();
    }
    return validateRelationshipRecord(parsed, id);
  }

  async write(record: TaskRelationshipRecord): Promise<void> {
    if (record.schemaVersion !== RELATIONSHIP_SCHEMA_VERSION) {
      throw new Error("Unsupported relationship record schema.");
    }
    await Bun.write(
      this.path(record.id),
      `${JSON.stringify(record, null, 2)}\n`,
    );
  }
}
