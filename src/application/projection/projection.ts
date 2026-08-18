import type { ClaimEvent } from "../../domain/claims/claims.ts";
import type { Actor } from "../../domain/records.ts";
import type { TaskState } from "../../domain/tasks/tasks.ts";

/** A Git revision observed while enumerating authoritative workspace records. */
export interface GitCheckpoint {
  readonly revision: string;
  readonly observedAt: string;
}

/** An imported-system reference retained as an index, never as an authority. */
export interface SourceMapping {
  readonly taskId: string;
  readonly system: string;
  readonly reference: string;
  readonly importedAt?: string;
}

/**
 * The only input accepted by a projection rebuild. Callers must enumerate this
 * from one Git revision; SQLite is never consulted to fill a missing field.
 */
export interface AuthoritativeProjectionSnapshot {
  readonly workspaceId: string;
  readonly checkpoint: GitCheckpoint;
  readonly tasks: readonly TaskState[];
  readonly actors: readonly Actor[];
  readonly claimEvents: readonly ClaimEvent[];
  readonly sourceMappings?: readonly SourceMapping[];
  readonly checkpoints?: readonly GitCheckpoint[];
}

/** Read-only authority boundary used by rebuild and recovery paths. */
export interface AuthoritativeProjectionSource {
  enumerate(): Promise<AuthoritativeProjectionSnapshot>;
}

export interface ProjectionRebuildResult {
  readonly kind: "rebuilt";
  readonly checkpoint: GitCheckpoint;
}

export interface ProjectionReuseResult {
  readonly kind: "reused";
  readonly checkpoint: GitCheckpoint;
}

export type ProjectionRefreshResult =
  | ProjectionRebuildResult
  | ProjectionReuseResult;

/** Observable cache health.  This is advisory only; Git remains authoritative. */
export type ProjectionFreshness =
  | "fresh"
  | "stale"
  | "missing"
  | "corrupt"
  | "recovering";

export interface ProjectionStatus {
  readonly schemaVersion: number | undefined;
  readonly checkpoint: GitCheckpoint | undefined;
  readonly authoritativeCheckpoint: GitCheckpoint;
  readonly freshness: ProjectionFreshness;
  readonly corruption: boolean;
  readonly recovery: "none" | "sync" | "rebuild";
}

export interface ProjectionSyncResult {
  readonly kind: "caught_up" | "resumed" | "interrupted";
  readonly checkpoint: GitCheckpoint;
  readonly resumedFrom: number;
  readonly processed: number;
}

/**
 * Projection stores intentionally provide rebuilding and health detection only.
 * Gate evaluation, claim ownership, and authored conflict resolution stay in
 * their respective Git-backed application services.
 */
export interface ProjectionStore {
  rebuild(
    source: AuthoritativeProjectionSource,
  ): Promise<ProjectionRebuildResult>;
  rebuildIfNeeded(
    source: AuthoritativeProjectionSource,
  ): Promise<ProjectionRefreshResult>;
  status(source: AuthoritativeProjectionSource): Promise<ProjectionStatus>;
  synchronize(
    source: AuthoritativeProjectionSource,
  ): Promise<ProjectionSyncResult>;
}
