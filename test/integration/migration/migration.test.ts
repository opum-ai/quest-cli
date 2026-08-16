import { expect, test } from "bun:test";

import {
  MigrationService,
  type MigrationSource,
  type MigrationStateStore,
  type MigrationTarget,
} from "../../../src/application/migration/migration.ts";
import {
  assertOrdinaryTargetWriteAllowed,
  migrationDigest,
  previewMigration,
  type MigrationState,
} from "../../../src/domain/migration/migration.ts";
import {
  RecordConflictError,
  RecordValidationError,
} from "../../../src/domain/records.ts";

class Source implements MigrationSource {
  fingerprint = "source-a";
  reads = 0;
  async readSnapshot() {
    this.reads += 1;
    return {
      sourceInstance: "backlog:/example",
      fingerprint: this.fingerprint,
      records: [
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
      ],
    };
  }
}

class Target implements MigrationTarget {
  fingerprint = "target-a";
  readonly records = new Map<string, string>();
  proposals = 0;
  creates = 0;
  async readFingerprint() {
    return this.fingerprint;
  }
  async proposeIdentifiers() {
    this.proposals += 1;
    return ["T-2", "T-1"];
  }
  async create(mapping: { readonly targetIdentifier: string }) {
    this.creates += 1;
    const fingerprint = `created-${mapping.targetIdentifier}`;
    this.records.set(mapping.targetIdentifier, fingerprint);
    return { fingerprint };
  }
  async readFingerprintFor(identifier: string) {
    return this.records.get(identifier);
  }
  async removeUnchanged(identifier: string, expected: string) {
    if (this.records.get(identifier) !== expected) return false;
    this.records.delete(identifier);
    return true;
  }
  async refresh(mapping: { readonly targetIdentifier: string }) {
    const fingerprint = this.records.get(mapping.targetIdentifier);
    if (!fingerprint) throw new Error("missing target");
    return { fingerprint };
  }
}

class Store implements MigrationStateStore {
  revision = "r-1";
  state: MigrationState | undefined;
  writes = 0;
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
    this.writes += 1;
    this.revision = `r-${this.writes + 1}`;
    return { kind: "success" as const, revision: this.revision };
  }
}

function fixture() {
  const source = new Source();
  const target = new Target();
  const store = new Store();
  return {
    source,
    target,
    store,
    service: new MigrationService(
      source,
      target,
      store,
      () => new Date("2026-01-01T00:00:00Z"),
    ),
  };
}

test("preview is deterministic, read-only, and uses folder-qualified source mappings", async () => {
  const { service, source, target, store } = fixture();
  const first = await service.preview();
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
  expect(source.reads).toBe(2);
  expect(target.creates).toBe(0);
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
});

test("shadow has a UTC deadline, permits idempotent refresh, and requires explicit cutover", async () => {
  const { service, store } = fixture();
  const preview = await service.preview();
  await service.apply(preview, preview.digest);
  await expect(
    service.shadow("2026-01-02T00:00:00+00:00"),
  ).rejects.toBeInstanceOf(RecordValidationError);
  const shadow = await service.shadow("2026-01-02T00:00:00Z");
  expect(() => assertOrdinaryTargetWriteAllowed(shadow)).toThrow(
    RecordConflictError,
  );
  expect((await service.refresh()).phase).toBe("shadow");
  expect((await service.cutover()).phase).toBe("cutover");
  expect(store.state?.phase).toBe("cutover");
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
