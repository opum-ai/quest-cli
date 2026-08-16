import { expect, test } from "bun:test";

import {
  MigrationService,
  type MigrationSource,
  type MigrationStateStore,
  type MigrationTarget,
} from "../../../src/application/migration/migration.ts";
import {
  type MigrationState,
  migrationDigest,
  previewMigration,
} from "../../../src/domain/migration/migration.ts";
import {
  RecordConflictError,
  RecordValidationError,
} from "../../../src/domain/records.ts";

class Source implements MigrationSource {
  fingerprint = "source-a";
  reads = 0;
  reverseTraversal = false;
  beforeApply: (() => Promise<void>) | undefined;
  async readSnapshot() {
    this.reads += 1;
    const records = [
      {
        sourceInstance: "backlog:/example",
        sourceFolder: "archive",
        sourceIdentifier: "TASK-2",
        contentFingerprint: "archive-2",
      },
      {
        sourceInstance: "backlog:/example",
        sourceFolder: "active",
        sourceIdentifier: "TASK-2",
        contentFingerprint: "active-2",
      },
    ];
    return {
      sourceInstance: "backlog:/example",
      fingerprint: this.fingerprint,
      records: this.reverseTraversal ? records.reverse() : records,
    };
  }
  async runIfFingerprint<T>(
    expectedFingerprint: string,
    operation: () => Promise<T>,
  ) {
    await this.beforeApply?.();
    if (this.fingerprint !== expectedFingerprint)
      return { kind: "conflict" as const };
    return { kind: "success" as const, value: await operation() };
  }
}

class Target implements MigrationTarget {
  fingerprint = "target-a";
  sourceFingerprint = "source-a";
  readonly records = new Map<string, string>();
  readonly applied = new Map<
    string,
    readonly { targetIdentifier: string; fingerprint: string }[]
  >();
  proposals = 0;
  applyCalls = 0;
  changeTargetBeforeApply = false;
  changeSourceBeforeApply = false;
  proposedFor: readonly string[] = [];
  ordinaryWrites = 0;
  stateRevision: (() => string) | undefined;
  beforeOrdinary: (() => Promise<void>) | undefined;
  beforeApply: (() => Promise<void>) | undefined;
  beforeRefresh: (() => void) | undefined;
  now: (() => Date) | undefined;
  async readFingerprint() {
    return this.fingerprint;
  }
  async proposeIdentifiers(
    records: Parameters<MigrationTarget["proposeIdentifiers"]>[0],
  ) {
    this.proposals += 1;
    this.proposedFor = records.map(
      (record) => `${record.sourceFolder}/${record.sourceIdentifier}`,
    );
    return ["T-2", "T-1"];
  }
  async applyIfApproved(
    request: Parameters<MigrationTarget["applyIfApproved"]>[0],
  ) {
    this.applyCalls += 1;
    await this.beforeApply?.();
    if (
      this.stateRevision?.() !== request.guard.revision ||
      request.guard.phase !== "applying"
    )
      return { kind: "conflict" as const };
    const existing = this.applied.get(request.digest);
    if (existing) return { kind: "success" as const, mappings: existing };
    if (this.changeTargetBeforeApply) this.fingerprint = "target-raced";
    if (this.changeSourceBeforeApply) this.sourceFingerprint = "source-raced";
    if (
      request.expectedSourceFingerprint !== this.sourceFingerprint ||
      request.expectedTargetFingerprint !== this.fingerprint
    )
      return { kind: "conflict" as const };
    const mappings = request.plan.entries.map((entry) => {
      const fingerprint = `created-${entry.targetIdentifier}`;
      this.records.set(entry.targetIdentifier, fingerprint);
      return { targetIdentifier: entry.targetIdentifier, fingerprint };
    });
    this.applied.set(request.digest, mappings);
    this.fingerprint = `target-after-${request.digest}`;
    return { kind: "success" as const, mappings };
  }
  async readFingerprintFor(identifier: string) {
    return this.records.get(identifier);
  }
  async removeUnchanged(identifier: string, expected: string) {
    if (this.records.get(identifier) !== expected) return false;
    this.records.delete(identifier);
    return true;
  }
  async refreshIfCurrent(
    request: Parameters<NonNullable<MigrationTarget["refreshIfCurrent"]>>[0],
  ) {
    this.beforeRefresh?.();
    if (this.stateRevision?.() !== request.guard.revision)
      return { kind: "conflict" as const };
    if (
      !request.shadowDeadline ||
      (this.now?.().getTime() ?? 0) >= Date.parse(request.shadowDeadline)
    )
      return { kind: "conflict" as const };
    const mappings = request.mappings.map((mapping) => {
      const fingerprint = this.records.get(mapping.targetIdentifier);
      if (!fingerprint) throw new Error("missing target");
      return { targetIdentifier: mapping.targetIdentifier, fingerprint };
    });
    return { kind: "success" as const, mappings };
  }
  async writeOrdinaryIfState(
    command: {
      readonly identifier: string;
      readonly contentFingerprint: string;
    },
    guard: { readonly revision: string },
  ) {
    await this.beforeOrdinary?.();
    if (this.stateRevision?.() !== guard.revision)
      return { kind: "conflict" as const };
    this.ordinaryWrites += 1;
    this.records.set(command.identifier, command.contentFingerprint);
    return { kind: "success" as const };
  }
}

class Store implements MigrationStateStore {
  revision = "r-1";
  state: MigrationState | undefined;
  writes = 0;
  conflictAfterWrites: number | undefined;
  async read() {
    return { revision: this.revision, state: this.state };
  }
  async write(request: {
    readonly expectedRevision: string;
    readonly state: MigrationState;
  }) {
    if (
      this.conflictAfterWrites !== undefined &&
      this.writes >= this.conflictAfterWrites
    ) {
      this.conflictAfterWrites = undefined;
      return { kind: "conflict" as const, actualRevision: this.revision };
    }
    if (request.expectedRevision !== this.revision)
      return { kind: "conflict" as const, actualRevision: this.revision };
    this.state = request.state;
    this.writes += 1;
    this.revision = `r-${this.writes + 1}`;
    return { kind: "success" as const, revision: this.revision };
  }
}

function fixture() {
  const source = new Source();
  const target = new Target();
  const store = new Store();
  target.stateRevision = () => store.revision;
  const clock = { now: new Date("2026-01-01T00:00:00Z") };
  target.now = () => clock.now;
  return {
    source,
    target,
    store,
    clock,
    service: new MigrationService(source, target, store, () => clock.now),
  };
}

test("preview is deterministic, read-only, and uses folder-qualified source mappings", async () => {
  const { service, source, target, store } = fixture();
  const first = await service.preview();
  source.reverseTraversal = true;
  const second = await service.preview();
  expect(first).toEqual(second);
  expect(first).toMatchObject({ exitCode: 0, requiresApproval: true });
  expect(
    first.plan.entries.map((entry) => [
      entry.sourceFolder,
      entry.sourceIdentifier,
    ]),
  ).toEqual([
    ["active", "TASK-2"],
    ["archive", "TASK-2"],
  ]);
  expect(first.digest).toBe(migrationDigest(first.plan));
  expect(target.proposedFor).toEqual(["active/TASK-2", "archive/TASK-2"]);
  expect(source.reads).toBe(2);
  expect(target.applyCalls).toBe(0);
  expect(store.writes).toBe(0);
});

test("apply requires the exact review digest and current source and target bases", async () => {
  const { service, source, target } = fixture();
  const preview = await service.preview();
  await expect(service.apply(preview, "not-the-digest")).rejects.toBeInstanceOf(
    RecordValidationError,
  );
  source.fingerprint = "source-changed";
  await expect(service.apply(preview, preview.digest)).rejects.toBeInstanceOf(
    RecordConflictError,
  );
  source.fingerprint = "source-a";
  target.fingerprint = "target-changed";
  await expect(service.apply(preview, preview.digest)).rejects.toBeInstanceOf(
    RecordConflictError,
  );
  target.fingerprint = "target-a";
  const tampered = structuredClone(preview);
  (
    tampered.plan.entries[0] as { contentFingerprint: string }
  ).contentFingerprint = "changed after review";
  await expect(service.apply(tampered, tampered.digest)).rejects.toBeInstanceOf(
    RecordValidationError,
  );
  const targetRace = fixture();
  const racePreview = await targetRace.service.preview();
  targetRace.target.changeTargetBeforeApply = true;
  await expect(
    targetRace.service.apply(racePreview, racePreview.digest),
  ).resolves.toMatchObject({ kind: "conflict" });
  expect(targetRace.target.records).toHaveLength(0);
  const sourceRace = fixture();
  const sourceRacePreview = await sourceRace.service.preview();
  sourceRace.target.changeSourceBeforeApply = true;
  await expect(
    sourceRace.service.apply(sourceRacePreview, sourceRacePreview.digest),
  ).resolves.toMatchObject({ kind: "conflict" });
  expect(sourceRace.target.records).toHaveLength(0);
  const sourceLeaseRace = fixture();
  const sourceLeasePreview = await sourceLeaseRace.service.preview();
  sourceLeaseRace.source.beforeApply = async () => {
    sourceLeaseRace.source.fingerprint = "source-mutated-under-lease";
  };
  await expect(
    sourceLeaseRace.service.apply(
      sourceLeasePreview,
      sourceLeasePreview.digest,
    ),
  ).resolves.toMatchObject({ kind: "conflict" });
  expect(sourceLeaseRace.target.records).toHaveLength(0);
});

test("shadow has a UTC deadline, guards ordinary writes, and requires explicit cutover", async () => {
  const { service, store, target } = fixture();
  const preview = await service.preview();
  await service.apply(preview, preview.digest);
  await expect(
    service.shadow("2026-01-02T00:00:00+00:00"),
  ).rejects.toBeInstanceOf(RecordValidationError);
  const shadow = await service.shadow("2026-01-02T00:00:00Z");
  expect(shadow.phase).toBe("shadow");
  await expect(
    service.writeOrdinary({
      identifier: "T-other",
      contentFingerprint: "ordinary",
    }),
  ).rejects.toBeInstanceOf(RecordConflictError);
  expect(target.ordinaryWrites).toBe(0);
  expect((await service.refresh()).phase).toBe("shadow");
  expect((await service.cutover()).phase).toBe("cutover");
  await service.writeOrdinary({
    identifier: "T-other",
    contentFingerprint: "ordinary",
  });
  expect(target.ordinaryWrites).toBe(1);
  expect(store.state?.phase).toBe("cutover");
});

test("refresh rejects once the explicit shadow deadline expires", async () => {
  const { service, clock } = fixture();
  const preview = await service.preview();
  await service.apply(preview, preview.digest);
  await service.shadow("2026-01-02T00:00:00Z");
  clock.now = new Date("2026-01-02T00:00:00Z");
  await expect(service.refresh()).rejects.toBeInstanceOf(RecordConflictError);
});

test("target refresh rechecks its own clock against the carried shadow deadline", async () => {
  const { service, target, clock } = fixture();
  const preview = await service.preview();
  await service.apply(preview, preview.digest);
  await service.shadow("2026-01-02T00:00:00Z");
  target.beforeRefresh = () => {
    clock.now = new Date("2026-01-02T00:00:00Z");
  };
  await expect(service.refresh()).rejects.toBeInstanceOf(RecordConflictError);
});

test("apply automatically resumes an idempotent target side effect after state CAS loss", async () => {
  const { service, target, store } = fixture();
  const preview = await service.preview();
  store.conflictAfterWrites = 1;
  await expect(service.apply(preview, preview.digest)).resolves.toMatchObject({
    kind: "success",
    state: { phase: "applied" },
  });
  expect(target.applyCalls).toBe(2);
  expect(target.records.get("T-2")).toBe("created-T-2");
});

test("refresh automatically replays its idempotent target side effect after state CAS loss", async () => {
  const { service, store } = fixture();
  const preview = await service.preview();
  await service.apply(preview, preview.digest);
  await service.shadow("2026-01-02T00:00:00Z");
  store.conflictAfterWrites = store.writes;
  await expect(service.refresh()).resolves.toMatchObject({ phase: "shadow" });
});

test("ordinary write rejects when shadow commits between its check and target mutation", async () => {
  const { service, target } = fixture();
  const preview = await service.preview();
  await service.apply(preview, preview.digest);
  target.beforeOrdinary = async () => {
    await service.shadow("2026-01-02T00:00:00Z");
  };
  await expect(
    service.writeOrdinary({
      identifier: "T-race",
      contentFingerprint: "ordinary",
    }),
  ).rejects.toBeInstanceOf(RecordConflictError);
  expect(target.ordinaryWrites).toBe(0);
});

test("apply target mutation rejects when rollback commits after applying state is persisted", async () => {
  const { service, target, store } = fixture();
  const preview = await service.preview();
  target.beforeApply = async () => {
    await service.rollback();
  };
  await expect(service.apply(preview, preview.digest)).resolves.toMatchObject({
    kind: "conflict",
  });
  expect(store.state?.phase).toBe("rolled-back");
  expect(target.records).toHaveLength(0);
});

test("rollback only removes unchanged migration records and names post-cutover edits", async () => {
  const { service, target } = fixture();
  const preview = await service.preview();
  await service.apply(preview, preview.digest);
  await service.shadow("2026-01-02T00:00:00Z");
  await service.cutover();
  target.records.set("T-2", "edited-after-cutover");
  const rollback = await service.rollback();
  expect(rollback).toEqual({ removed: ["T-1"], manualReconciliation: ["T-2"] });
  expect(target.records.get("T-2")).toBe("edited-after-cutover");
});

test("duplicate source identity or target identity cannot receive an ambiguous approval", () => {
  expect(() =>
    previewMigration({
      sourceInstance: "source",
      sourceFingerprint: "s",
      targetFingerprint: "t",
      entries: [
        {
          sourceInstance: "source",
          sourceFolder: "active",
          sourceIdentifier: "1",
          contentFingerprint: "a",
          targetIdentifier: "T-1",
        },
        {
          sourceInstance: "source",
          sourceFolder: "active",
          sourceIdentifier: "1",
          contentFingerprint: "b",
          targetIdentifier: "T-2",
        },
      ],
    }),
  ).toThrow(RecordConflictError);
});
