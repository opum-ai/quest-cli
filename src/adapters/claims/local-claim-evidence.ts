import { createHash } from "node:crypto";
import { join } from "node:path";
import { lstat } from "node:fs/promises";
import { realpath } from "node:fs/promises";
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

/**
 * Symlink-safe containment. The trusted workspace root is canonicalized once;
 * every path component from the root down is checked with lstat and any
 * symlink (directory or file) fails closed before anything is read. The final
 * evidence file itself must also be a regular non-symlink entry. Within this
 * boundary no read can be redirected outside the workspace by a symlinked
 * .quest, claims/, relationships/, or evidence file.
 */
async function containedPath(
  canonicalRoot: string,
  components: readonly string[],
): Promise<string> {
  let current = canonicalRoot;
  let complete = true;
  for (const component of components) {
    current = join(current, component);
    if (!complete) continue;
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) throw unreadable();
    } catch (error) {
      if (
        error instanceof OpumAgentWorkflowError ||
        (error as { code?: string })?.code !== "ENOENT"
      ) {
        throw error;
      }
      // Missing component: keep building the final path for the caller.
      complete = false;
    }
  }
  if (!complete) return current;
  const resolvedParent = await realpath(
    join(canonicalRoot, ...components.slice(0, -1)),
  );
  const resolvedCandidate = join(resolvedParent, components.at(-1) ?? "");
  const resolvedRoot = canonicalRoot.endsWith("/")
    ? canonicalRoot
    : `${canonicalRoot}/`;
  if (!resolvedCandidate.startsWith(resolvedRoot)) throw unreadable();
  return resolvedCandidate;
}

async function regularFile(path: string): Promise<boolean> {
  try {
    const info = await lstat(path);
    return info.isFile();
  } catch {
    return false;
  }
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
 * Read-only claim evidence over the authoritative ClaimService/CAS layout:
 * `.quest/claims/<canonical taskId>.jsonl` (see
 * src/application/claims/claims.ts ownedPathFor) plus an optional
 * `actors.json`. The canonical taskId is already validated, so it keys the
 * file directly — no hashing. External consumers never read these files.
 */
export class LocalClaimEvidence implements ClaimEvidencePort {
  #canonicalRoot: string | undefined;

  constructor(private readonly root: string) {}

  private async canonicalize(): Promise<string> {
    this.#canonicalRoot ??= await realpath(this.root);
    return this.#canonicalRoot;
  }

  private async containedFile(
    directory: string,
    name: string,
  ): Promise<string | null> {
    const canonicalRoot = await this.canonicalize();
    const path = await containedPath(canonicalRoot, [
      ".quest",
      directory,
      name,
    ]);
    return (await regularFile(path)) ? path : null;
  }

  async events(taskId: CanonicalId): Promise<readonly ClaimEvent[]> {
    const path = await this.containedFile("claims", `${String(taskId)}.jsonl`);
    if (!path) return [];
    let text: string;
    try {
      text = await Bun.file(path).text();
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
    const path = await this.containedFile("claims", "actors.json");
    if (!path) return [];
    try {
      const parsed: unknown = await Bun.file(path).json();
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
 * versioned JSON document per SHA-256-addressed opaque identity. Reads and the
 * internal write seam share the same symlink-safe containment boundary.
 * `write` is repository-owned; external consumers only ever get reads.
 */
export class LocalTaskRelationshipRepository implements TaskRelationshipPort {
  #canonicalRoot: string | undefined;

  constructor(private readonly root: string) {}

  private async canonicalize(): Promise<string> {
    this.#canonicalRoot ??= await realpath(this.root);
    return this.#canonicalRoot;
  }

  private async path(id: string): Promise<string> {
    const canonicalRoot = await this.canonicalize();
    return containedPath(canonicalRoot, [
      ".quest",
      "relationships",
      `${safeStorageName(id)}.json`,
    ]);
  }

  async find(id: string): Promise<TaskRelationshipRecord | null> {
    const path = await this.path(id);
    if (!(await regularFile(path))) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await Bun.file(path).text());
    } catch {
      throw unreadable();
    }
    return validateRelationshipRecord(parsed, id);
  }

  async write(record: TaskRelationshipRecord): Promise<void> {
    if (record.schemaVersion !== RELATIONSHIP_SCHEMA_VERSION) {
      throw new Error("Unsupported relationship record schema.");
    }
    // The writer passes through the same symlink-safe containment boundary.
    const path = await this.path(record.id);
    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(await this.canonicalize(), ".quest", "relationships"), {
      recursive: true,
    });
    await Bun.write(path, `${JSON.stringify(record, null, 2)}\n`);
  }
}
