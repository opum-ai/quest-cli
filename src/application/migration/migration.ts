import {
  assertApprovedMigration,
  assertOrdinaryTargetWriteAllowed,
  assertShadowRefreshAllowed,
  cutoverMigration,
  type MigrationMapping,
  type MigrationPhase,
  type MigrationSourceRecord,
  type MigrationState,
  migrationPlan,
  previewMigration,
  startShadowMigration,
} from "../../domain/migration/migration.ts";
import { RecordConflictError } from "../../domain/records.ts";

export interface MigrationSourceSnapshot {
  readonly sourceInstance: string;
  readonly fingerprint: string;
  readonly records: readonly MigrationSourceRecord[];
}

/** Read-only by contract: source adapters expose no mutation method to this engine. */
export interface MigrationSource {
  readSnapshot(): Promise<MigrationSourceSnapshot>;
}

export interface MigrationTarget {
  readFingerprint(): Promise<string>;
  /** Planning must not reserve or write IDs; it is called only by preview. */
  proposeIdentifiers(
    records: readonly MigrationSourceRecord[],
  ): Promise<readonly string[]>;
  /**
   * Atomically verifies the approved target basis and applying-state guard, then
   * creates (or idempotently resumes) the operation identified by digest.
   */
  applyIfApproved(
    request: MigrationApplyRequest,
  ): Promise<MigrationTargetApplyResult>;
  readFingerprintFor(identifier: string): Promise<string | undefined>;
  /** Target adapter atomically compares creation fingerprint and migration state. */
  removeUnchangedIfState(
    identifier: string,
    expectedFingerprint: string,
    guard: MigrationStateGuard,
  ): Promise<
    | { readonly kind: "removed" }
    | { readonly kind: "already-removed" }
    | { readonly kind: "not-unchanged" }
    | { readonly kind: "state-conflict" }
  >;
  /** The sole target mutation permitted during shadow; must be idempotent. */
  refreshIfCurrent?(
    request: MigrationRefreshRequest,
  ): Promise<MigrationTargetRefreshResult>;
  /** All non-migration target writes must enter through this guarded seam. */
  writeOrdinaryIfState(
    command: MigrationTargetWrite,
    guard: MigrationStateGuard,
  ): Promise<{ readonly kind: "success" } | { readonly kind: "conflict" }>;
}

export interface MigrationApplyRequest {
  readonly digest: string;
  readonly plan: MigrationState["plan"];
  readonly expectedTargetFingerprint: string;
  /** Must match the authoritative persisted applying state at target mutation time. */
  readonly guard: MigrationStateGuard;
}
export interface MigrationTargetFingerprint {
  readonly targetIdentifier: string;
  readonly fingerprint: string;
}
export type MigrationTargetApplyResult =
  | {
      readonly kind: "success";
      readonly mappings: readonly MigrationTargetFingerprint[];
    }
  | { readonly kind: "conflict" };
export type MigrationTargetRefreshResult =
  | {
      readonly kind: "success";
      readonly mappings: readonly MigrationTargetFingerprint[];
    }
  | { readonly kind: "conflict" };
export interface MigrationStateGuard {
  readonly revision: string;
  readonly phase: MigrationPhase | undefined;
}
export interface MigrationRefreshRequest {
  readonly digest: string;
  readonly mappings: readonly MigrationMapping[];
  readonly guard: MigrationStateGuard;
  readonly shadowDeadline: string;
  /** Service admission time; target must also compare its own clock to deadline. */
  readonly observedAt: string;
}

export interface MigrationTargetWrite {
  readonly identifier: string;
  readonly contentFingerprint: string;
}

export interface MigrationStateStore {
  read(): Promise<{
    readonly revision: string;
    readonly state?: MigrationState;
  }>;
  write(request: {
    readonly expectedRevision: string;
    readonly state: MigrationState;
  }): Promise<
    | { readonly kind: "success"; readonly revision: string }
    | { readonly kind: "conflict"; readonly actualRevision: string }
  >;
}

export interface MigrationApplyResult {
  readonly kind: "success" | "conflict";
  readonly state?: MigrationState;
  readonly actualRevision?: string;
  /** Protected target edits discovered during source-drift compensation. */
  readonly manualReconciliation?: readonly string[];
}

/** Coordinates immutable preview evidence with target-side creation and persisted rollback state. */
export class MigrationService {
  constructor(
    private readonly source: MigrationSource,
    private readonly target: MigrationTarget,
    private readonly store: MigrationStateStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async preview() {
    const source = await this.source.readSnapshot();
    const targetFingerprint = await this.target.readFingerprint();
    const records = [...source.records].sort(
      (left, right) =>
        [
          left.sourceInstance.localeCompare(right.sourceInstance),
          left.sourceFolder.localeCompare(right.sourceFolder),
          left.sourceIdentifier.localeCompare(right.sourceIdentifier),
        ].find((result) => result !== 0) ?? 0,
    );
    const ids = await this.target.proposeIdentifiers(records);
    if (ids.length !== records.length)
      throw new RecordConflictError(
        "migration_target_identifier_count_mismatch",
      );
    return previewMigration(
      migrationPlan({
        sourceInstance: source.sourceInstance,
        sourceFingerprint: source.fingerprint,
        targetFingerprint,
        entries: records.map((record, index) => ({
          ...record,
          targetIdentifier: ids[index] ?? "",
        })),
      }),
    );
  }

  async apply(
    preview: Awaited<ReturnType<MigrationService["preview"]>>,
    approvedDigest: string,
  ): Promise<MigrationApplyResult> {
    const source = await this.source.readSnapshot();
    const targetFingerprint = await this.target.readFingerprint();
    assertApprovedMigration(
      preview,
      approvedDigest,
      source.fingerprint,
      targetFingerprint,
    );
    const stored = await this.store.read();
    if (stored.state) throw new RecordConflictError("migration_already_exists");
    const createdAt = this.now().toISOString();
    // Store all identities before the first target mutation. A target or CAS
    // failure can therefore leave an incomplete migration, never an orphan.
    const state: MigrationState = {
      digest: preview.digest,
      plan: preview.plan,
      phase: "applying",
      mappings: preview.plan.entries.map((entry) => ({ ...entry, createdAt })),
    };
    const begun = await this.store.write({
      expectedRevision: stored.revision,
      state,
    });
    if (begun.kind === "conflict")
      return { kind: "conflict", actualRevision: begun.actualRevision };
    const completed = await this.completeApply(state, begun.revision);
    // The target operation is idempotently keyed by the digest. One CAS loss
    // after its side effect therefore safely resumes from the durable map.
    if (
      completed.kind !== "conflict" ||
      completed.manualReconciliation !== undefined
    )
      return completed;
    const current = await this.store.read();
    return current.state?.phase === "applying"
      ? await this.resume()
      : { kind: "conflict", actualRevision: current.revision };
  }

  private async completeApply(
    applying: MigrationState,
    revision: string,
  ): Promise<MigrationApplyResult> {
    const target = await this.target.applyIfApproved({
      digest: applying.digest,
      plan: applying.plan,
      expectedTargetFingerprint: applying.plan.targetFingerprint,
      guard: { revision, phase: applying.phase },
    });
    if (target.kind === "conflict") return { kind: "conflict" };
    const fingerprints = new Map(
      target.mappings.map((mapping) => [
        mapping.targetIdentifier,
        mapping.fingerprint,
      ]),
    );
    if (
      fingerprints.size !== applying.mappings.length ||
      applying.mappings.some(
        (mapping) => !fingerprints.has(mapping.targetIdentifier),
      )
    )
      throw new RecordConflictError("migration_target_apply_mapping_mismatch");
    const state: MigrationState = {
      ...applying,
      phase: "applied",
      mappings: applying.mappings.map((mapping) => ({
        ...mapping,
        createdTargetFingerprint: fingerprints.get(mapping.targetIdentifier),
      })),
    };
    const result = await this.store.write({
      expectedRevision: revision,
      state,
    });
    if (result.kind === "conflict")
      return { kind: "conflict", actualRevision: result.actualRevision };
    // Backlog-like sources have no honest write lease. Detect drift after the
    // target transaction and compensate from the persisted mapping instead.
    const postflight = await this.source.readSnapshot();
    if (postflight.fingerprint === applying.plan.sourceFingerprint)
      return { kind: "success", state };
    const compensation = await this.rollback();
    return {
      kind: "conflict",
      manualReconciliation: compensation.manualReconciliation,
    };
  }

  /** Continue a durable partial apply; the target must resume the same digest idempotently. */
  async resume(): Promise<MigrationApplyResult> {
    const stored = await this.store.read();
    if (!stored.state) throw new RecordConflictError("migration_not_found");
    if (stored.state.phase !== "applying")
      throw new RecordConflictError("migration_resume_not_available");
    return this.completeApply(stored.state, stored.revision);
  }

  async shadow(deadline: string): Promise<MigrationState> {
    const stored = await this.store.read();
    if (!stored.state) throw new RecordConflictError("migration_not_found");
    const state = startShadowMigration(stored.state, deadline, this.now());
    const result = await this.store.write({
      expectedRevision: stored.revision,
      state,
    });
    if (result.kind === "conflict")
      throw new RecordConflictError("migration_state_conflict");
    return state;
  }

  async refresh(retried = false): Promise<MigrationState> {
    const stored = await this.store.read();
    const state = stored.state;
    if (!state) throw new RecordConflictError("migration_not_found");
    assertShadowRefreshAllowed(state, this.now());
    if (!this.target.refreshIfCurrent)
      throw new RecordConflictError("migration_shadow_refresh_unsupported");
    const refreshed = await this.target.refreshIfCurrent({
      digest: state.digest,
      mappings: state.mappings,
      guard: { revision: stored.revision, phase: state.phase },
      shadowDeadline: state.shadowDeadline ?? "",
      observedAt: this.now().toISOString(),
    });
    if (refreshed.kind === "conflict")
      throw new RecordConflictError("migration_shadow_refresh_target_conflict");
    const fingerprints = new Map(
      refreshed.mappings.map((mapping) => [
        mapping.targetIdentifier,
        mapping.fingerprint,
      ]),
    );
    if (
      fingerprints.size !== state.mappings.length ||
      state.mappings.some(
        (mapping) => !fingerprints.has(mapping.targetIdentifier),
      )
    )
      throw new RecordConflictError(
        "migration_shadow_refresh_mapping_mismatch",
      );
    const next = {
      ...state,
      mappings: state.mappings.map((mapping) => ({
        ...mapping,
        createdTargetFingerprint: fingerprints.get(mapping.targetIdentifier),
      })),
    };
    const result = await this.store.write({
      expectedRevision: stored.revision,
      state: next,
    });
    if (result.kind === "conflict") {
      // `refreshIfCurrent` is explicitly idempotent. One bounded replay persists
      // the already-applied target refresh or observes a transitioned state.
      if (!retried) return this.refresh(true);
      throw new RecordConflictError("migration_state_conflict");
    }
    return next;
  }

  async cutover(): Promise<MigrationState> {
    const stored = await this.store.read();
    if (!stored.state) throw new RecordConflictError("migration_not_found");
    const state = cutoverMigration(stored.state, this.now());
    const result = await this.store.write({
      expectedRevision: stored.revision,
      state,
    });
    if (result.kind === "conflict")
      throw new RecordConflictError("migration_state_conflict");
    return state;
  }

  async rollback(): Promise<{
    readonly removed: readonly string[];
    readonly manualReconciliation: readonly string[];
  }> {
    const stored = await this.store.read();
    if (!stored.state) throw new RecordConflictError("migration_not_found");
    let state = stored.state;
    let revision = stored.revision;
    if (state.phase !== "rolling-back") {
      const reserved: MigrationState = {
        ...state,
        phase: "rolling-back",
        rollbackRemoved: state.rollbackRemoved ?? [],
      };
      const reservation = await this.store.write({
        expectedRevision: revision,
        state: reserved,
      });
      if (reservation.kind === "conflict")
        throw new RecordConflictError(
          "migration_rollback_reservation_conflict",
        );
      state = reserved;
      revision = reservation.revision;
    }
    const completed = new Set(state.rollbackRemoved ?? []);
    const removed: string[] = [];
    const manual: string[] = [];
    for (const mapping of state.mappings) {
      if (completed.has(mapping.targetIdentifier)) continue;
      const expected = mapping.createdTargetFingerprint;
      if (expected === undefined) {
        manual.push(mapping.targetIdentifier);
        continue;
      }
      const result = await this.target.removeUnchangedIfState(
        mapping.targetIdentifier,
        expected,
        { revision, phase: state.phase },
      );
      if (result.kind === "state-conflict")
        throw new RecordConflictError("migration_rollback_state_conflict");
      if (result.kind === "removed" || result.kind === "already-removed") {
        removed.push(mapping.targetIdentifier);
        completed.add(mapping.targetIdentifier);
        state = { ...state, rollbackRemoved: [...completed].sort() };
        const progress = await this.store.write({
          expectedRevision: revision,
          state,
        });
        if (progress.kind === "conflict")
          throw new RecordConflictError("migration_rollback_progress_conflict");
        revision = progress.revision;
      } else manual.push(mapping.targetIdentifier);
    }
    state = { ...state, phase: "rolled-back" };
    const result = await this.store.write({
      expectedRevision: revision,
      state,
    });
    if (result.kind === "conflict")
      throw new RecordConflictError("migration_state_conflict");
    return { removed, manualReconciliation: manual.sort() };
  }

  /** The application-owned writer seam enforces the shadow one-writer rule. */
  async writeOrdinary(command: MigrationTargetWrite): Promise<void> {
    const stored = await this.store.read();
    if (stored.state) assertOrdinaryTargetWriteAllowed(stored.state);
    const result = await this.target.writeOrdinaryIfState(command, {
      revision: stored.revision,
      phase: stored.state?.phase,
    });
    if (result.kind === "conflict")
      throw new RecordConflictError("migration_ordinary_write_state_conflict");
  }
}
