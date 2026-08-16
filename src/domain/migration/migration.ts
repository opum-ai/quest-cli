import { createHash } from "node:crypto";

import { RecordConflictError, RecordValidationError } from "../records.ts";

export type MigrationFolder = string;

/** A source identity deliberately includes the source installation: IDs are not global. */
export interface MigrationSourceIdentity {
  readonly sourceInstance: string;
  readonly sourceFolder: MigrationFolder;
  readonly sourceIdentifier: string;
}

export interface MigrationSourceRecord extends MigrationSourceIdentity {
  /** Immutable source representation selected by the source adapter. */
  readonly contentFingerprint: string;
}

export interface MigrationPlanEntry extends MigrationSourceRecord {
  /** A Quest identifier proposed by the target namespace; never copied from the source. */
  readonly targetIdentifier: string;
}

export interface MigrationPlan {
  readonly sourceInstance: string;
  readonly sourceFingerprint: string;
  readonly targetFingerprint: string;
  readonly entries: readonly MigrationPlanEntry[];
}

export interface MigrationPreview {
  readonly exitCode: 0;
  readonly requiresApproval: true;
  readonly digest: string;
  readonly plan: MigrationPlan;
}

export interface MigrationMapping extends MigrationPlanEntry {
  /** Fingerprint immediately after Quest created the record, used for safe rollback. */
  readonly createdTargetFingerprint?: string;
  readonly createdAt: string;
}

export type MigrationPhase =
  | "applying"
  | "applied"
  | "shadow"
  | "cutover"
  | "rolled-back";

export interface MigrationState {
  readonly digest: string;
  readonly plan: MigrationPlan;
  readonly phase: MigrationPhase;
  readonly mappings: readonly MigrationMapping[];
  readonly shadowDeadline?: string;
}

function text(value: string, name: string): void {
  if (!value) throw new RecordValidationError(`migration_${name}_invalid`);
}

function utc(value: string, name: string): void {
  text(value, name);
  // A literal Z is intentional: local offsets make an operational deadline ambiguous.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value))
    throw new RecordValidationError(`migration_${name}_must_be_utc`);
  if (Number.isNaN(Date.parse(value)))
    throw new RecordValidationError(`migration_${name}_invalid`);
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function compareEntry(
  left: MigrationPlanEntry,
  right: MigrationPlanEntry,
): number {
  return (
    [
      left.sourceInstance.localeCompare(right.sourceInstance),
      left.sourceFolder.localeCompare(right.sourceFolder),
      left.sourceIdentifier.localeCompare(right.sourceIdentifier),
      left.targetIdentifier.localeCompare(right.targetIdentifier),
    ].find((result) => result !== 0) ?? 0
  );
}

function validateEntry(entry: MigrationPlanEntry): void {
  text(entry.sourceInstance, "source_instance");
  text(entry.sourceFolder, "source_folder");
  text(entry.sourceIdentifier, "source_identifier");
  text(entry.contentFingerprint, "source_record_fingerprint");
  text(entry.targetIdentifier, "target_identifier");
}

/**
 * Produces the canonical, source-neutral plan representation used for both review
 * and apply. Sorting here, rather than in an adapter, prevents filesystem order
 * from becoming approval-relevant.
 */
export function migrationPlan(plan: MigrationPlan): MigrationPlan {
  text(plan.sourceInstance, "source_instance");
  text(plan.sourceFingerprint, "source_fingerprint");
  text(plan.targetFingerprint, "target_fingerprint");
  const entries = [...plan.entries].map((entry) => ({ ...entry }));
  entries.forEach(validateEntry);
  if (entries.some((entry) => entry.sourceInstance !== plan.sourceInstance))
    throw new RecordValidationError("migration_source_instance_mismatch");
  entries.sort(compareEntry);
  const sourceKeys = new Set<string>();
  const targets = new Set<string>();
  for (const entry of entries) {
    const sourceKey = `${entry.sourceInstance}\u0000${entry.sourceFolder}\u0000${entry.sourceIdentifier}`;
    if (sourceKeys.has(sourceKey))
      throw new RecordConflictError("migration_duplicate_source_identity");
    if (targets.has(entry.targetIdentifier))
      throw new RecordConflictError("migration_duplicate_target_identity");
    sourceKeys.add(sourceKey);
    targets.add(entry.targetIdentifier);
  }
  return { ...plan, entries };
}

/** Digest exactly the immutable reviewed plan, not display formatting or clock time. */
export function migrationDigest(plan: MigrationPlan): string {
  return createHash("sha256")
    .update(canonical(migrationPlan(plan)))
    .digest("hex");
}

/** Preview has no state parameter and cannot mutate either side by construction. */
export function previewMigration(plan: MigrationPlan): MigrationPreview {
  const normalized = migrationPlan(plan);
  return {
    exitCode: 0,
    requiresApproval: true,
    digest: migrationDigest(normalized),
    plan: normalized,
  };
}

/** Separates bad caller input (validation) from a once-valid basis becoming stale (conflict). */
export function assertApprovedMigration(
  preview: MigrationPreview,
  approvedDigest: string,
  currentSourceFingerprint: string,
  currentTargetFingerprint: string,
): void {
  text(approvedDigest, "approved_digest");
  // `readonly` is a TypeScript promise, not runtime immutability. Rebuild the
  // digest at the authorization boundary so nested plan mutation cannot bypass review.
  const reviewedDigest = migrationDigest(preview.plan);
  if (preview.digest !== reviewedDigest || approvedDigest !== reviewedDigest)
    throw new RecordValidationError("migration_approval_digest_mismatch");
  if (currentSourceFingerprint !== preview.plan.sourceFingerprint)
    throw new RecordConflictError("migration_source_fingerprint_conflict");
  if (currentTargetFingerprint !== preview.plan.targetFingerprint)
    throw new RecordConflictError("migration_target_fingerprint_conflict");
}

export function startShadowMigration(
  state: MigrationState,
  deadline: string,
  now: Date,
): MigrationState {
  if (state.phase !== "applied" && state.phase !== "shadow")
    throw new RecordConflictError("migration_shadow_not_available");
  utc(deadline, "shadow_deadline");
  if (Date.parse(deadline) <= now.getTime())
    throw new RecordValidationError("migration_shadow_deadline_not_future");
  if (state.phase === "shadow" && state.shadowDeadline !== deadline)
    throw new RecordConflictError("migration_shadow_deadline_immutable");
  return { ...state, phase: "shadow", shadowDeadline: deadline };
}

/** During shadow, only the migration's idempotent refresh path may change target records. */
export function assertOrdinaryTargetWriteAllowed(state: MigrationState): void {
  if (state.phase === "shadow")
    throw new RecordConflictError(
      "migration_shadow_ordinary_target_write_rejected",
    );
}

export function cutoverMigration(
  state: MigrationState,
  now: Date,
): MigrationState {
  if (state.phase !== "shadow")
    throw new RecordConflictError("migration_cutover_requires_shadow");
  if (!state.shadowDeadline || now.getTime() > Date.parse(state.shadowDeadline))
    throw new RecordConflictError("migration_shadow_deadline_elapsed");
  return { ...state, phase: "cutover" };
}

/** A shadow deadline also bounds refresh: no target write may extend its window. */
export function assertShadowRefreshAllowed(
  state: MigrationState,
  now: Date,
): void {
  if (state.phase !== "shadow")
    throw new RecordConflictError("migration_refresh_requires_shadow");
  if (
    !state.shadowDeadline ||
    now.getTime() >= Date.parse(state.shadowDeadline)
  )
    throw new RecordConflictError("migration_shadow_deadline_elapsed");
}

export interface RollbackDecision {
  readonly delete: readonly MigrationMapping[];
  readonly manualReconciliation: readonly MigrationMapping[];
}

/** Never delete a record that has changed since the migration created it. */
export function planSafeRollback(
  state: MigrationState,
  currentTargetFingerprints: ReadonlyMap<string, string | undefined>,
): RollbackDecision {
  if (
    state.phase !== "applying" &&
    state.phase !== "applied" &&
    state.phase !== "shadow" &&
    state.phase !== "cutover"
  )
    throw new RecordConflictError("migration_rollback_not_available");
  const deleteEntries: MigrationMapping[] = [];
  const manualReconciliation: MigrationMapping[] = [];
  for (const mapping of state.mappings) {
    if (
      mapping.createdTargetFingerprint !== undefined &&
      currentTargetFingerprints.get(mapping.targetIdentifier) ===
        mapping.createdTargetFingerprint
    )
      deleteEntries.push(mapping);
    else manualReconciliation.push(mapping);
  }
  return { delete: deleteEntries, manualReconciliation };
}
