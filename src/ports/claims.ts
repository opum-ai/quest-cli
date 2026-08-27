import type { ClaimEvent } from "../domain/claims/claims.ts";
import type { Actor, CanonicalId } from "../domain/records.ts";

/** Read-only claim evidence used by the opum-agent-workflow binding service. */
export interface ClaimEvidencePort {
  /** Full immutable event history for one canonical task id. */
  events(taskId: CanonicalId): Promise<readonly ClaimEvent[]>;
  /** The declared actor roster referenced by claim events. */
  actors(): Promise<readonly Actor[]>;
}

/** Versioned, repository-native relationship record (ODOC-71.8). */
export interface TaskRelationshipRecord {
  readonly schemaVersion: 1;
  /** The exact accepted correlation or claim identity. */
  readonly id: string;
  readonly taskId: CanonicalId;
  readonly kind: "claim" | "correlation";
  readonly state:
    | "accepted"
    | "delivered"
    | "working"
    | "cancelled"
    | "rejected"
    | "expired"
    | "superseded"
    | "done";
  /** Correlations declare their holder; claims verify against the live lease. */
  readonly holder?: string;
  readonly baseRef: string;
  readonly settlementRef: string;
}

export interface TaskRelationshipReader {
  find(id: string): Promise<TaskRelationshipRecord | null>;
}

/**
 * Production-owned CAS relationship writer. Requires the expected snapshot
 * revision and an immutable operationId, commits through the repository's
 * Git operation seam, and never blind-overwrites.
 */
export interface TaskRelationshipCasWriter {
  write(request: {
    readonly record: TaskRelationshipRecord;
    readonly expectedRevision: string;
    readonly operationId: string;
  }): Promise<
    | { readonly kind: "success"; readonly revision: string }
    | {
        readonly kind: "conflict";
        readonly expectedRevision: string;
        readonly actualRevision: string;
        readonly operationId: string;
      }
  >;
}
