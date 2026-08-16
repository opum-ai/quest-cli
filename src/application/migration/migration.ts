import {
  assertApprovedMigration,
  cutoverMigration,
  migrationPlan,
  planSafeRollback,
  previewMigration,
  startShadowMigration,
  type MigrationMapping,
  type MigrationSourceRecord,
  type MigrationState,
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
  create(
    mapping: Omit<MigrationMapping, "createdTargetFingerprint" | "createdAt">,
  ): Promise<{ readonly fingerprint: string }>;
  readFingerprintFor(identifier: string): Promise<string | undefined>;
  /** Target adapter must compare the creation fingerprint before removing. */
  removeUnchanged(
    identifier: string,
    expectedFingerprint: string,
  ): Promise<boolean>;
  /** The sole target mutation permitted during shadow; must be idempotent. */
  refresh?(
    mapping: MigrationMapping,
  ): Promise<{ readonly fingerprint: string }>;
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
    const ids = await this.target.proposeIdentifiers(source.records);
    if (ids.length !== source.records.length)
      throw new RecordConflictError(
        "migration_target_identifier_count_mismatch",
      );
    return previewMigration(
      migrationPlan({
        sourceInstance: source.sourceInstance,
        sourceFingerprint: source.fingerprint,
        targetFingerprint,
        entries: source.records.map((record, index) => ({
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
    const mappings: MigrationMapping[] = [];
    for (const entry of preview.plan.entries) {
      const created = await this.target.create({ ...entry });
      mappings.push({
        ...entry,
        createdTargetFingerprint: created.fingerprint,
        createdAt,
      });
    }
    const state: MigrationState = {
      digest: preview.digest,
      plan: preview.plan,
      phase: "applied",
      mappings,
    };
    const result = await this.store.write({
      expectedRevision: stored.revision,
      state,
    });
    return result.kind === "success"
      ? { kind: "success", state }
      : { kind: "conflict", actualRevision: result.actualRevision };
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

  async refresh(): Promise<MigrationState> {
    const stored = await this.store.read();
    const state = stored.state;
    if (state?.phase !== "shadow")
      throw new RecordConflictError("migration_refresh_requires_shadow");
    if (!this.target.refresh)
      throw new RecordConflictError("migration_shadow_refresh_unsupported");
    const mappings = await Promise.all(
      state.mappings.map(async (mapping) => ({
        ...mapping,
        createdTargetFingerprint:
          (await this.target.refresh?.(mapping))?.fingerprint ??
          mapping.createdTargetFingerprint,
      })),
    );
    const next = { ...state, mappings };
    const result = await this.store.write({
      expectedRevision: stored.revision,
      state: next,
    });
    if (result.kind === "conflict")
      throw new RecordConflictError("migration_state_conflict");
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
    const fingerprints = new Map(
      await Promise.all(
        stored.state.mappings.map(
          async (mapping) =>
            [
              mapping.targetIdentifier,
              await this.target.readFingerprintFor(mapping.targetIdentifier),
            ] as const,
        ),
      ),
    );
    const decision = planSafeRollback(stored.state, fingerprints);
    const removed: string[] = [];
    const manual = decision.manualReconciliation.map(
      (mapping) => mapping.targetIdentifier,
    );
    for (const mapping of decision.delete) {
      if (
        await this.target.removeUnchanged(
          mapping.targetIdentifier,
          mapping.createdTargetFingerprint,
        )
      )
        removed.push(mapping.targetIdentifier);
      else manual.push(mapping.targetIdentifier);
    }
    const state: MigrationState = { ...stored.state, phase: "rolled-back" };
    const result = await this.store.write({
      expectedRevision: stored.revision,
      state,
    });
    if (result.kind === "conflict")
      throw new RecordConflictError("migration_state_conflict");
    return { removed, manualReconciliation: manual.sort() };
  }
}
