import {
  MigrationService,
  type MigrationSource,
  type MigrationStateStore,
  type MigrationTarget,
} from "../application/migration/migration.ts";

type MigrationState = Parameters<MigrationStateStore["write"]>[0]["state"];

class SmokeSource implements MigrationSource {
  async readSnapshot() {
    return {
      sourceInstance: "quest:compiled-smoke",
      fingerprint: "source:stable",
      records: [
        {
          sourceInstance: "quest:compiled-smoke",
          sourceFolder: "migration-smoke",
          sourceIdentifier: "SMOKE-1",
          contentFingerprint: "record:stable",
        },
      ],
    };
  }
}

class SmokeStore implements MigrationStateStore {
  revision = "0";
  state: MigrationState | undefined;
  async read() {
    return { revision: this.revision, state: this.state };
  }
  async write(request: {
    readonly expectedRevision: string;
    readonly state: MigrationState;
  }) {
    if (request.expectedRevision !== this.revision)
      return { kind: "conflict" as const, actualRevision: this.revision };
    this.state = request.state;
    this.revision = String(Number(this.revision) + 1);
    return { kind: "success" as const, revision: this.revision };
  }
}

class SmokeTarget implements MigrationTarget {
  readonly records = new Map<string, string>();
  readonly applied = new Map<
    string,
    readonly {
      readonly targetIdentifier: string;
      readonly fingerprint: string;
    }[]
  >();
  constructor(private readonly store: SmokeStore) {}
  async readFingerprint() {
    return this.records.size === 0 ? "target:empty" : "target:populated";
  }
  async proposeIdentifiers(
    records: Parameters<MigrationTarget["proposeIdentifiers"]>[0],
  ) {
    return records.map((_, index) => `Q-SMOKE-${index + 1}`);
  }
  async applyIfApproved(
    request: Parameters<MigrationTarget["applyIfApproved"]>[0],
  ) {
    if (
      request.guard.revision !== this.store.revision ||
      request.guard.phase !== "applying" ||
      request.expectedTargetFingerprint !== (await this.readFingerprint())
    )
      return { kind: "conflict" as const };
    const existing = this.applied.get(request.digest);
    if (existing) return { kind: "success" as const, mappings: existing };
    const mappings = request.plan.entries.map((entry) => {
      const fingerprint = `created:${entry.targetIdentifier}`;
      this.records.set(entry.targetIdentifier, fingerprint);
      return { targetIdentifier: entry.targetIdentifier, fingerprint };
    });
    this.applied.set(request.digest, mappings);
    return { kind: "success" as const, mappings };
  }
  async readFingerprintFor(identifier: string) {
    return this.records.get(identifier);
  }
  async removeUnchangedIfState(
    identifier: string,
    expectedFingerprint: string,
    guard: Parameters<MigrationTarget["removeUnchangedIfState"]>[2],
  ) {
    if (
      guard.revision !== this.store.revision ||
      guard.phase !== "rolling-back"
    )
      return { kind: "state-conflict" as const };
    const current = this.records.get(identifier);
    if (current === undefined) return { kind: "already-removed" as const };
    if (current !== expectedFingerprint)
      return { kind: "not-unchanged" as const };
    this.records.delete(identifier);
    return { kind: "removed" as const };
  }
  async writeOrdinaryIfState() {
    return { kind: "success" as const };
  }
}

/** Exercises preview, approved application, and safe rollback in the compiled binary. */
export async function migrationSmokeResult() {
  const store = new SmokeStore();
  const target = new SmokeTarget(store);
  const service = new MigrationService(new SmokeSource(), target, store);
  const preview = await service.preview();
  const applied = await service.apply(preview, preview.digest);
  if (applied.kind !== "success" || applied.state?.phase !== "applied")
    throw new Error("migration_smoke_apply_failed");
  const rollback = await service.rollback();
  if (
    rollback.manualReconciliation.length !== 0 ||
    rollback.removed.length !== 1 ||
    target.records.size !== 0 ||
    (await store.read()).state?.phase !== "rolled-back"
  )
    throw new Error("migration_smoke_rollback_failed");
  return {
    schemaVersion: 1,
    kind: "migration.smoke",
    data: { digest: preview.digest, removed: rollback.removed.length },
  };
}
