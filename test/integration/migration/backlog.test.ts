import { expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  assertNoBacklogCrossFolderCollisions,
  BacklogImporter,
} from "../../../src/adapters/migration/backlog/importer.ts";
import {
  MigrationService,
  type MigrationStateStore,
  type MigrationTarget,
} from "../../../src/application/migration/migration.ts";
import type { MigrationState } from "../../../src/domain/migration/migration.ts";
import {
  RecordConflictError,
  RecordValidationError,
} from "../../../src/domain/records.ts";

const fixture = join(import.meta.dir, "../../fixtures/backlog/source");

async function git(
  directory: string,
  ...args: readonly string[]
): Promise<void> {
  const process = Bun.spawn(["git", "-C", directory, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  await process.exited;
  if (process.exitCode !== 0)
    throw new Error(await new Response(process.stderr).text());
}

class Store implements MigrationStateStore {
  revision = "r-1";
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
    this.revision = `r-${Number(this.revision.slice(2)) + 1}`;
    return { kind: "success" as const, revision: this.revision };
  }
}

class Target implements MigrationTarget {
  fingerprint = "target-before";
  readonly records = new Map<string, string>();
  readonly applied = new Map<
    string,
    readonly { targetIdentifier: string; fingerprint: string }[]
  >();
  afterApply: (() => Promise<void>) | undefined;

  constructor(private readonly store: Store) {}

  async readFingerprint() {
    return this.fingerprint;
  }

  async proposeIdentifiers(
    records: Parameters<MigrationTarget["proposeIdentifiers"]>[0],
  ) {
    return records.map((_, index) => `T-${index + 1}`);
  }

  async applyIfApproved(
    request: Parameters<MigrationTarget["applyIfApproved"]>[0],
  ) {
    if (
      request.guard.revision !== this.store.revision ||
      request.guard.phase !== "applying" ||
      request.expectedTargetFingerprint !== this.fingerprint
    )
      return { kind: "conflict" as const };
    const existing = this.applied.get(request.digest);
    if (existing) return { kind: "success" as const, mappings: existing };
    const mappings = request.plan.entries.map((entry) => {
      const fingerprint = `created-${entry.targetIdentifier}`;
      this.records.set(entry.targetIdentifier, fingerprint);
      return { targetIdentifier: entry.targetIdentifier, fingerprint };
    });
    this.applied.set(request.digest, mappings);
    this.fingerprint = `target-after-${request.digest}`;
    await this.afterApply?.();
    return { kind: "success" as const, mappings };
  }

  async readFingerprintFor(identifier: string) {
    return this.records.get(identifier);
  }

  async removeUnchangedIfState(
    identifier: string,
    expectedFingerprint: string,
    guard: {
      readonly revision: string;
      readonly phase: MigrationState["phase"];
    },
  ) {
    if (
      guard.revision !== this.store.revision ||
      guard.phase !== "rolling-back"
    )
      return { kind: "state-conflict" as const };
    if (!this.records.has(identifier))
      return { kind: "already-removed" as const };
    if (this.records.get(identifier) !== expectedFingerprint)
      return { kind: "not-unchanged" as const };
    this.records.delete(identifier);
    return { kind: "removed" as const };
  }

  async refreshIfCurrent(
    request: Parameters<NonNullable<MigrationTarget["refreshIfCurrent"]>>[0],
  ) {
    if (
      request.guard.revision !== this.store.revision ||
      request.guard.phase !== "shadow"
    )
      return { kind: "conflict" as const };
    return {
      kind: "success" as const,
      mappings: request.mappings.map((mapping) => ({
        targetIdentifier: mapping.targetIdentifier,
        fingerprint: this.records.get(mapping.targetIdentifier) ?? "",
      })),
    };
  }

  async writeOrdinaryIfState() {
    return { kind: "success" as const };
  }
}

async function isolatedSource(backlogDirectory = "backlog"): Promise<{
  readonly directory: string;
  readonly path: string;
}> {
  const directory = await mkdtemp(join(tmpdir(), "qcli-backlog-engine-"));
  const path = join(directory, backlogDirectory, "tasks", "task.md");
  await mkdir(join(directory, backlogDirectory, "tasks"), { recursive: true });
  await Bun.write(
    path,
    await Bun.file(join(fixture, "backlog/tasks/task-1.md")).arrayBuffer(),
  );
  return { directory, path };
}

test("inventories every lifecycle folder, preserves the public task fields, and reports cross-folder collisions", async () => {
  const snapshot = await new BacklogImporter(fixture).readSnapshot();
  expect(
    snapshot.records.map((record) => [
      record.sourceFolder,
      record.sourceIdentifier,
    ]),
  ).toEqual([
    ["active", "TASK-1"],
    ["archive/drafts", "DRAFT-2"],
    ["archive/tasks", "TASK-1"],
    ["completed", "TASK-2"],
    ["draft", "DRAFT-1"],
  ]);
  expect(snapshot.crossFolderDuplicateIds).toEqual(["TASK-1"]);
  await expect(
    Promise.resolve().then(() =>
      assertNoBacklogCrossFolderCollisions(snapshot),
    ),
  ).rejects.toBeInstanceOf(RecordConflictError);

  const active = snapshot.records.find(
    (record) => record.sourceFolder === "active",
  );
  expect(active).toMatchObject({
    title: "Active parent",
    status: "In Progress",
    priority: "high",
    type: "feature",
    assignees: ["@ada"],
    labels: ["migration", "urgent"],
    ordinal: 7,
    dependencies: ["TASK-9"],
    milestone: "m-1",
    references: ["https://example.test/reference"],
    documentation: ["docs/reference.md"],
    modifiedFiles: ["src/a.ts"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  });
  expect(active?.acceptanceCriteria).toEqual([
    { index: 1, text: "Preserve the active record", checked: true },
    { index: 2, text: "Preserve pending state", checked: false },
  ]);
  expect(active?.implementationPlan).toBe("Plan text");
  expect(active?.implementationNotes).toBe("Notes text");
  expect(active?.finalSummary).toBe("Summary text");
  expect(active?.comments).toEqual([
    {
      index: 1,
      author: "@ada",
      createdAt: "2026-01-02T00:00:00Z",
      body: "Comment body",
    },
  ]);
  expect(active?.aliases).toHaveLength(1);
  expect(
    snapshot.records.find((record) => record.sourceIdentifier === "TASK-2")
      ?.aliases,
  ).toContain("TASK-2");
});

test("is byte-identical while unchanged, observes drift, and never changes the source", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcli-backlog-import-"));
  try {
    const source = join(directory, "backlog", "tasks", "task.md");
    await mkdir(join(directory, "backlog", "tasks"), { recursive: true });
    await Bun.write(
      source,
      await Bun.file(join(fixture, "backlog/tasks/task-1.md")).arrayBuffer(),
    );
    const before = await readFile(source);
    const importer = new BacklogImporter(directory);
    const first = await importer.readSnapshot();
    const second = await importer.readSnapshot();
    expect(second).toEqual(first);
    expect(await readFile(source)).toEqual(before);
    await writeFile(source, `${await Bun.file(source).text()}\n`);
    expect((await importer.readSnapshot()).fingerprint).not.toBe(
      first.fingerprint,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("preserves the Git commit and tracked blob without replaying source history", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcli-backlog-git-"));
  try {
    const source = join(directory, "backlog", "tasks", "task.md");
    await mkdir(join(directory, "backlog", "tasks"), { recursive: true });
    await Bun.write(
      source,
      await Bun.file(join(fixture, "backlog/tasks/task-1.md")).arrayBuffer(),
    );
    await git(directory, "init");
    await git(directory, "add", "backlog/tasks/task.md");
    await git(
      directory,
      "-c",
      "user.email=quest@example.test",
      "-c",
      "user.name=Quest Test",
      "commit",
      "-m",
      "source snapshot",
    );
    const record = (await new BacklogImporter(directory).readSnapshot())
      .records[0];
    expect(record?.git.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(record?.git.blob).toMatch(/^[0-9a-f]{40}$/);
    expect(record?.rawMarkdown).toContain("Active parent");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("requires explicit public configuration for a non-default Backlog directory", async () => {
  const source = await isolatedSource(".backlog");
  try {
    await expect(
      new BacklogImporter(source.directory).readSnapshot(),
    ).rejects.toBeInstanceOf(RecordValidationError);
    const importer = new BacklogImporter(source.directory, {
      backlogDirectory: ".backlog",
    });
    const first = await importer.readSnapshot();
    const second = await importer.readSnapshot();
    expect(second.fingerprint).toBe(first.fingerprint);
    expect(first.records[0]).toMatchObject({
      sourcePath: ".backlog/tasks/task.md",
      sourceIdentifier: "TASK-1",
    });
    const store = new Store();
    const service = new MigrationService(importer, new Target(store), store);
    const preview = await service.preview();
    expect(preview.plan.entries).toHaveLength(1);
    await writeFile(source.path, `${await Bun.file(source.path).text()}\n`);
    expect((await importer.readSnapshot()).fingerprint).not.toBe(
      first.fingerprint,
    );
  } finally {
    await rm(source.directory, { recursive: true, force: true });
  }
});

test("rejects a configured Backlog directory symlink that escapes the source project", async () => {
  const external = await isolatedSource();
  const project = await mkdtemp(join(tmpdir(), "qcli-backlog-project-"));
  try {
    await symlink(
      join(external.directory, "backlog"),
      join(project, "backlog"),
    );
    await expect(
      new BacklogImporter(project).readSnapshot(),
    ).rejects.toBeInstanceOf(RecordValidationError);
  } finally {
    await rm(project, { recursive: true, force: true });
    await rm(external.directory, { recursive: true, force: true });
  }
});

test("rejects a lifecycle directory symlink that escapes the source project", async () => {
  const external = await isolatedSource();
  const project = await mkdtemp(join(tmpdir(), "qcli-backlog-project-"));
  try {
    await mkdir(join(project, "backlog"), { recursive: true });
    await symlink(
      join(external.directory, "backlog", "tasks"),
      join(project, "backlog", "tasks"),
    );
    await expect(
      new BacklogImporter(project).readSnapshot(),
    ).rejects.toBeInstanceOf(RecordValidationError);
  } finally {
    await rm(project, { recursive: true, force: true });
    await rm(external.directory, { recursive: true, force: true });
  }
});

test("rejects a task-file symlink that escapes the source project", async () => {
  const external = await isolatedSource();
  const project = await mkdtemp(join(tmpdir(), "qcli-backlog-project-"));
  try {
    await mkdir(join(project, "backlog", "tasks"), { recursive: true });
    await symlink(external.path, join(project, "backlog", "tasks", "task.md"));
    await expect(
      new BacklogImporter(project).readSnapshot(),
    ).rejects.toBeInstanceOf(RecordValidationError);
  } finally {
    await rm(project, { recursive: true, force: true });
    await rm(external.directory, { recursive: true, force: true });
  }
});

test("uses the Backlog snapshot for preview, direct apply, shadow refresh, cutover, and rollback", async () => {
  const source = await isolatedSource();
  try {
    const store = new Store();
    const target = new Target(store);
    const service = new MigrationService(
      new BacklogImporter(source.directory),
      target,
      store,
      () => new Date("2026-01-01T00:00:00Z"),
    );
    const preview = await service.preview();
    expect(preview.plan.entries).toHaveLength(1);
    expect(preview.plan.entries[0]).toMatchObject({
      sourceFolder: "active",
      sourceIdentifier: "TASK-1",
      targetIdentifier: "T-1",
    });
    await expect(service.apply(preview, preview.digest)).resolves.toMatchObject(
      {
        kind: "success",
        state: { phase: "applied" },
      },
    );
    expect((await service.shadow("2026-01-02T00:00:00Z")).phase).toBe("shadow");
    expect((await service.refresh()).phase).toBe("shadow");
    expect((await service.cutover()).phase).toBe("cutover");
    await expect(service.rollback()).resolves.toEqual({
      removed: ["T-1"],
      manualReconciliation: [],
    });
    expect(target.records).toHaveLength(0);
    expect(store.state?.phase).toBe("rolled-back");
  } finally {
    await rm(source.directory, { recursive: true, force: true });
  }
});

test("detects post-apply Backlog drift and compensates unchanged migration-owned targets", async () => {
  const source = await isolatedSource();
  try {
    const store = new Store();
    const target = new Target(store);
    target.afterApply = async () => {
      await writeFile(source.path, `${await Bun.file(source.path).text()}\n`);
    };
    const service = new MigrationService(
      new BacklogImporter(source.directory),
      target,
      store,
    );
    const preview = await service.preview();
    await expect(service.apply(preview, preview.digest)).resolves.toEqual({
      kind: "conflict",
      manualReconciliation: [],
    });
    expect(target.records).toHaveLength(0);
    expect(store.state?.phase).toBe("rolled-back");
  } finally {
    await rm(source.directory, { recursive: true, force: true });
  }
});

test("reports a changed target for manual reconciliation during Backlog drift compensation", async () => {
  const source = await isolatedSource();
  try {
    const store = new Store();
    const target = new Target(store);
    target.afterApply = async () => {
      target.records.set("T-1", "edited-after-migration");
      await writeFile(source.path, `${await Bun.file(source.path).text()}\n`);
    };
    const service = new MigrationService(
      new BacklogImporter(source.directory),
      target,
      store,
    );
    const preview = await service.preview();
    await expect(service.apply(preview, preview.digest)).resolves.toEqual({
      kind: "conflict",
      manualReconciliation: ["T-1"],
    });
    expect(target.records.get("T-1")).toBe("edited-after-migration");
    expect(store.state?.phase).toBe("rolled-back");
  } finally {
    await rm(source.directory, { recursive: true, force: true });
  }
});
