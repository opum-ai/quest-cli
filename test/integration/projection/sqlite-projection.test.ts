import { Database } from "bun:sqlite";
import {
  afterEach,
  beforeEach,
  expect,
  setDefaultTimeout,
  test,
} from "bun:test";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  SqliteProjectionStore,
  SqliteProjectionTaskReader,
} from "../../../src/adapters/projection/sqlite-projection.ts";
import type { AuthoritativeProjectionSnapshot } from "../../../src/application/projection/projection.ts";
import {
  type GateEvent,
  replayGateHistory,
} from "../../../src/domain/gates/gates.ts";
import {
  evaluateReadySet,
  taskState,
} from "../../../src/domain/tasks/tasks.ts";

function snapshot(): AuthoritativeProjectionSnapshot {
  const events: readonly GateEvent[] = [
    {
      eventId: "gate-1",
      operationId: "define-1",
      taskId: "T-1",
      kind: "gate-defined",
      definition: {
        id: "review",
        title: "Independent review",
        blocking: true,
        requiresHumanJudgement: true,
      },
    },
    {
      eventId: "evidence-1",
      operationId: "evidence-op-1",
      taskId: "T-1",
      kind: "evidence-submitted",
      gateId: "review",
      evidence: {
        id: "proof-1",
        reference: "https://example.test/proof",
        actor: { id: "reviewer", kind: "human", roles: ["reviewer"] },
        submittedAt: "2026-08-15T00:00:00Z",
      },
    },
  ];
  const gates = replayGateHistory(events).gates.map((gate) => ({
    id: gate.id,
    title: gate.title,
    blocking: gate.blocking,
    state: gate.state,
    evidence: gate.evidence.map((item) => item.reference),
    ...(gate.satisfiedBy ? { satisfiedBy: gate.satisfiedBy } : {}),
  }));
  const first = taskState({
    id: "T-1",
    aliases: ["one"],
    title: "One",
    status: "In Progress",
    acceptanceCriteria: [
      { index: 0, text: "round-trip", checked: false },
      { index: 1, text: "reviewed", checked: true },
    ],
    definitionOfDone: [{ index: 0, text: "verified", checked: true }],
    plan: ["build"],
    implementationNotes: ["note"],
    comments: [
      {
        id: "c-1",
        authorId: "reviewer",
        body: "hello",
        createdAt: "2026-08-15T00:00:00Z",
      },
    ],
    labels: ["core"],
    documentation: ["docs/spec.md"],
    parentId: undefined,
    dependencies: [],
    assignees: ["@quest-cli"],
    references: ["QCLI-97.11"],
    modifiedFiles: ["src/domain/tasks/tasks.ts"],
    createdAt: "2026-08-15T00:00:00Z",
    updatedAt: "2026-08-15T01:00:00Z",
    finalSummary: "settled",
    milestoneId: "M-1",
    ordinal: 7,
    priority: "high",
    type: "feature",
    blockers: [],
    gates,
    gateEvents: events,
    claim: {
      holderId: "worker",
      leaseGeneration: "1",
      expiresAt: "2026-08-16T00:00:00Z",
    },
    source: { system: "backlog", reference: "QCLI-1" },
  });
  const second = taskState({
    id: "T-2",
    aliases: ["two"],
    title: "Two",
    status: "To Do",
    acceptanceCriteria: [],
    definitionOfDone: [],
    plan: [],
    implementationNotes: [],
    comments: [],
    labels: [],
    documentation: [],
    parentId: undefined,
    dependencies: ["T-1"],
    blockers: [],
    gates: [],
    gateEvents: [],
  });
  return {
    workspaceId: "workspace-1",
    checkpoint: { revision: "git-a", observedAt: "2026-08-15T00:00:00Z" },
    checkpoints: [
      { revision: "git-parent", observedAt: "2026-08-14T00:00:00Z" },
    ],
    tasks: [first, second],
    actors: [
      { id: "reviewer", kind: "human", roles: ["reviewer"] },
      { id: "worker", kind: "human", roles: [] },
    ],
    claimEvents: [],
  };
}

let fixtureDirectory: string | undefined;

// The adapter retries 119 times after the first attempt at 100ms intervals.
// Bounds include that 11.9s window for fixture teardown plus 5s test overhead.
const fixtureReleaseAttempts = 120;
const releaseRetryWindowMs = 119 * 100;
const fixtureTeardownBudgetMs = releaseRetryWindowMs;
const recoveryTestOverheadMs = 5_000;
const fixtureTeardownTimeoutMs =
  fixtureTeardownBudgetMs + recoveryTestOverheadMs;
const rebuildFailureAndCleanupBudgetMs = releaseRetryWindowMs * 2;
const oneRebuildRecoveryTimeoutMs =
  rebuildFailureAndCleanupBudgetMs +
  fixtureTeardownBudgetMs +
  recoveryTestOverheadMs;
const twoRebuildRecoveryTimeoutMs =
  rebuildFailureAndCleanupBudgetMs * 2 +
  fixtureTeardownBudgetMs +
  recoveryTestOverheadMs;
const threeRebuildRecoveryTimeoutMs =
  rebuildFailureAndCleanupBudgetMs * 3 +
  fixtureTeardownBudgetMs +
  recoveryTestOverheadMs;
const resumedSyncRecoveryTimeoutMs =
  rebuildFailureAndCleanupBudgetMs * 3 +
  releaseRetryWindowMs +
  fixtureTeardownBudgetMs +
  recoveryTestOverheadMs;
const freshSyncRecoveryTimeoutMs =
  rebuildFailureAndCleanupBudgetMs * 3 +
  releaseRetryWindowMs +
  fixtureTeardownBudgetMs +
  recoveryTestOverheadMs;

function fixtureReleaseDiagnostic(
  state: "attempting" | "succeeded" | "failed",
  terminal: boolean,
  attempt: number,
  retryCount: number,
  startedAt: number,
  error?: unknown,
): void {
  if (process.env.QUEST_PROJECTION_RELEASE_DIAGNOSTICS !== "1") return;
  const filesystemError = error as
    | { code?: unknown; message?: unknown }
    | undefined;
  console.error(
    JSON.stringify({
      event: "quest_projection_file_release",
      operation: "fixture_teardown",
      phase: "cleanup",
      state,
      terminal,
      attempt,
      retryCount,
      elapsedMs: Date.now() - startedAt,
      ...(filesystemError
        ? {
            filesystemError: {
              code: filesystemError.code ?? "unknown",
              message: filesystemError.message ?? String(error),
            },
          }
        : {}),
    }),
  );
}

async function removeFixtureDirectory(directory: string): Promise<void> {
  const startedAt = Date.now();
  for (
    let retryCount = 0;
    retryCount < fixtureReleaseAttempts;
    retryCount += 1
  ) {
    fixtureReleaseDiagnostic(
      "attempting",
      false,
      retryCount + 1,
      retryCount,
      startedAt,
    );
    try {
      await rm(directory, { recursive: true, force: true });
      fixtureReleaseDiagnostic(
        "succeeded",
        true,
        retryCount + 1,
        retryCount,
        startedAt,
      );
      return;
    } catch (error) {
      const code = (error as { code?: unknown }).code;
      const terminal =
        (code !== "EBUSY" && code !== "EPERM") ||
        retryCount === fixtureReleaseAttempts - 1;
      fixtureReleaseDiagnostic(
        "failed",
        terminal,
        retryCount + 1,
        retryCount,
        startedAt,
        error,
      );
      if (terminal) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

beforeEach(async () => {
  fixtureDirectory = await mkdtemp(join(tmpdir(), "quest-projection-"));
});

// The teardown budget is applied as this file's default timeout rather than
// as an afterEach argument: bun 1.3.14 (the pinned CI runtime) accepts a
// per-hook timeout, but 1.2.23 rejects any second argument to afterEach, and
// the six-platform projection job genuinely needs the full window because
// Windows holds file locks through the retry loop. setDefaultTimeout covers
// hooks as well as tests and behaves the same on both runtimes; each test that
// needs more than the teardown budget still passes its own larger timeout.
setDefaultTimeout(fixtureTeardownTimeoutMs);

afterEach(async () => {
  if (fixtureDirectory) await removeFixtureDirectory(fixtureDirectory);
  fixtureDirectory = undefined;
});

function databasePath(): string {
  if (!fixtureDirectory)
    throw new Error("projection_fixture_directory_missing");
  return join(fixtureDirectory, "projection.sqlite");
}

async function expectRecoveryResidue(path: string): Promise<void> {
  expect(await readdir(dirname(path))).toEqual(["projection.sqlite"]);
}

function mutateDatabase(path: string, mutation: (db: Database) => void): void {
  const db = new Database(path);
  try {
    mutation(db);
  } finally {
    db.close(true);
  }
}

function readDatabaseRow<Row>(db: Database, sql: string): Row {
  const statement = db.prepare(sql);
  try {
    return statement.get() as Row;
  } finally {
    statement.finalize();
  }
}

test("atomic rebuild projects every indexed record family from authoritative enumeration", async () => {
  const path = databasePath();
  const source = snapshot();
  const result = await new SqliteProjectionStore(path).rebuild({
    enumerate: async () => source,
  });
  expect(result).toEqual({ kind: "rebuilt", checkpoint: source.checkpoint });

  const db = new Database(path, { readonly: true });
  try {
    for (const [table, expected] of Object.entries({
      tasks: 2,
      dependencies: 1,
      aliases: 2,
      actors: 2,
      claims: 1,
      gates: 1,
      evidence: 1,
      events: 2,
      source_mappings: 1,
      git_checkpoints: 2,
    })) {
      expect(
        readDatabaseRow<{ count: number }>(
          db,
          `SELECT COUNT(*) AS count FROM ${table}`,
        ).count,
      ).toBe(expected);
    }
  } finally {
    db.close(true);
  }
});

test(
  "missing or corrupt SQLite is replaced from Git-derived input without touching it",
  async () => {
    const path = databasePath();
    const source = snapshot();
    const authored = JSON.stringify(source);
    await writeFile(path, "not a sqlite database");

    const result = await new SqliteProjectionStore(path).rebuildIfNeeded({
      enumerate: async () => source,
    });
    expect(result.kind).toBe("rebuilt");
    expect(JSON.stringify(source)).toBe(authored);
    expect((await readFile(path)).subarray(0, 16).toString()).toBe(
      "SQLite format 3\u0000",
    );
    await expectRecoveryResidue(path);
  },
  oneRebuildRecoveryTimeoutMs,
);

test(
  "a valid SQLite file with deleted data or a missing table is rebuilt from Git",
  async () => {
    const path = databasePath();
    const source = snapshot();
    const store = new SqliteProjectionStore(path);
    await store.rebuild({ enumerate: async () => source });

    mutateDatabase(path, (db) => db.exec("DELETE FROM tasks WHERE id = 'T-2'"));
    expect(
      await store.rebuildIfNeeded({ enumerate: async () => source }),
    ).toMatchObject({ kind: "rebuilt" });

    mutateDatabase(path, (db) => db.exec("DROP TABLE aliases"));
    expect(
      await store.rebuildIfNeeded({ enumerate: async () => source }),
    ).toMatchObject({ kind: "rebuilt" });
    const rebuilt = new Database(path, { readonly: true });
    try {
      expect(
        readDatabaseRow<{ count: number }>(
          rebuilt,
          "SELECT COUNT(*) AS count FROM tasks",
        ).count,
      ).toBe(2);
      expect(
        readDatabaseRow<{ count: number }>(
          rebuilt,
          "SELECT COUNT(*) AS count FROM aliases",
        ).count,
      ).toBe(2);
    } finally {
      rebuilt.close(true);
    }
    await expectRecoveryResidue(path);
  },
  threeRebuildRecoveryTimeoutMs,
);

test(
  "same-count tampering across projection families is never reused",
  async () => {
    const path = databasePath();
    const source = snapshot();
    const store = new SqliteProjectionStore(path);
    await store.rebuild({ enumerate: async () => source });
    mutateDatabase(path, (db) =>
      db.exec(`
    UPDATE metadata SET value = 'other-workspace' WHERE key = 'workspace_id';
    UPDATE tasks SET title = 'tampered', status = 'Done', payload = '{}' WHERE id = 'T-1';
    UPDATE dependencies SET dependency_id = 'T-2';
    UPDATE aliases SET alias = 'tampered', alias_key = 'tampered';
    UPDATE actors SET payload = '{}' WHERE id = 'reviewer';
    UPDATE claims SET holder_id = 'other-worker';
    UPDATE gates SET state = 'pending';
    UPDATE evidence SET reference = 'tampered';
    UPDATE events SET payload = '{}';
    UPDATE source_mappings SET reference = 'tampered';
    UPDATE git_checkpoints SET observed_at = 'tampered';
  `),
    );

    expect(
      await store.rebuildIfNeeded({ enumerate: async () => source }),
    ).toMatchObject({ kind: "rebuilt" });
    const rebuilt = new Database(path, { readonly: true });
    try {
      expect(
        readDatabaseRow<{ title: string }>(
          rebuilt,
          "SELECT title FROM tasks WHERE id = 'T-1'",
        ).title,
      ).toBe("One");
      expect(
        readDatabaseRow<{ value: string }>(
          rebuilt,
          "SELECT value FROM metadata WHERE key = 'workspace_id'",
        ).value,
      ).toBe("workspace-1");
      expect(
        readDatabaseRow<{ reference: string }>(
          rebuilt,
          "SELECT reference FROM evidence",
        ).reference,
      ).toBe("https://example.test/proof");
    } finally {
      rebuilt.close(true);
    }
    await expectRecoveryResidue(path);
  },
  twoRebuildRecoveryTimeoutMs,
);

test("failed validation leaves the prior projection in place", async () => {
  const path = databasePath();
  const source = snapshot();
  const store = new SqliteProjectionStore(path);
  await store.rebuild({ enumerate: async () => source });
  await expect(
    store.rebuild({
      enumerate: async () => ({
        ...source,
        sourceMappings: [
          { taskId: "T-99", system: "foreign", reference: "missing" },
        ],
      }),
    }),
  ).rejects.toThrow("projection_source_mapping_unknown_task");
  const db = new Database(path, { readonly: true });
  try {
    expect(
      readDatabaseRow<{ title: string }>(
        db,
        "SELECT title FROM tasks WHERE id = 'T-1'",
      ).title,
    ).toBe("One");
  } finally {
    db.close(true);
  }
});

test("SQLite changes cannot satisfy authored gates or release authored claims", async () => {
  const path = databasePath();
  const source = snapshot();
  await new SqliteProjectionStore(path).rebuild({
    enumerate: async () => source,
  });
  mutateDatabase(path, (db) =>
    db.exec("UPDATE gates SET state = 'pending'; DELETE FROM claims;"),
  );

  // The evaluator receives only authoritative task records, never this database.
  const first = source.tasks[0];
  const gate = first?.gates[0];
  if (!first || !gate) throw new Error("fixture_task_missing");
  const pending = taskState({
    ...first,
    status: "To Do",
    gateEvents: first.gateEvents.slice(0, 1),
    gates: [
      {
        ...gate,
        state: "pending",
        evidence: [],
        satisfiedBy: undefined,
      },
    ],
  });
  const claimed = taskState({ ...first, status: "To Do" });
  expect(evaluateReadySet([pending], new Date("2026-08-15T12:00:00Z"))).toEqual(
    {
      ready: [],
      excluded: [{ taskId: "T-1", reason: "pending_gate" }],
    },
  );
  expect(evaluateReadySet([claimed], new Date("2026-08-15T12:00:00Z"))).toEqual(
    {
      ready: [],
      excluded: [{ taskId: "T-1", reason: "live_claim" }],
    },
  );
});

test("status is read-only and gives explicit recovery guidance", async () => {
  const path = databasePath();
  const source = snapshot();
  const store = new SqliteProjectionStore(path);
  expect(await store.status({ enumerate: async () => source })).toMatchObject({
    freshness: "missing",
    recovery: "rebuild",
    checkpoint: undefined,
    authoritativeCheckpoint: source.checkpoint,
  });
  expect(await Bun.file(path).exists()).toBe(false);

  await store.rebuild({ enumerate: async () => source });
  expect(await store.status({ enumerate: async () => source })).toMatchObject({
    freshness: "fresh",
    recovery: "none",
    checkpoint: source.checkpoint,
  });
});

test(
  "interrupted projection sync resumes its durable cursor and rebuilds from Git",
  async () => {
    const path = databasePath();
    const source = snapshot();
    const store = new SqliteProjectionStore(path);
    expect(
      await store.synchronize(
        { enumerate: async () => source },
        { interruptAfter: 1 },
      ),
    ).toMatchObject({ kind: "interrupted", resumedFrom: 0, processed: 1 });
    expect(await store.status({ enumerate: async () => source })).toMatchObject(
      {
        freshness: "recovering",
        recovery: "sync",
      },
    );
    expect(
      await store.synchronize({ enumerate: async () => source }),
    ).toMatchObject({
      kind: "resumed",
      resumedFrom: 1,
      processed: 1,
      checkpoint: source.checkpoint,
    });
    expect(await store.status({ enumerate: async () => source })).toMatchObject(
      {
        freshness: "fresh",
        recovery: "none",
      },
    );
    expect(await Bun.file(`${path}.sync.json`).exists()).toBe(false);
    await expectRecoveryResidue(path);
  },
  resumedSyncRecoveryTimeoutMs,
);

test(
  "invalid sync progress is discarded rather than wedging refresh",
  async () => {
    const path = databasePath();
    const source = snapshot();
    await writeFile(
      `${path}.sync.json`,
      JSON.stringify({ checkpoint: source.checkpoint, nextTask: -1 }),
    );
    await expect(
      new SqliteProjectionStore(path).synchronize({
        enumerate: async () => source,
      }),
    ).resolves.toMatchObject({ kind: "caught_up", resumedFrom: 0 });
    await expectRecoveryResidue(path);
  },
  freshSyncRecoveryTimeoutMs,
);

test("query reader opens an existing projection read-only", async () => {
  const path = databasePath();
  const source = snapshot();
  await new SqliteProjectionStore(path).rebuild({
    enumerate: async () => source,
  });
  await expect(new SqliteProjectionTaskReader(path).readAll()).resolves.toEqual(
    {
      workspaceId: source.workspaceId,
      revision: source.checkpoint.revision,
      tasks: source.tasks,
    },
  );
});

test("the schema-1 payload round-trips every projection field group", async () => {
  const path = databasePath();
  const source = snapshot();
  await new SqliteProjectionStore(path).rebuild({
    enumerate: async () => source,
  });
  const db = new Database(path, { readonly: true });
  try {
    const row = readDatabaseRow<{ payload: string }>(
      db,
      "SELECT payload FROM tasks WHERE id = 'T-1'",
    );
    const parsed = JSON.parse(row.payload) as Record<string, unknown>;
    expect(parsed.acceptanceCriteria).toEqual([
      { index: 0, text: "round-trip", checked: false },
      { index: 1, text: "reviewed", checked: true },
    ]);
    expect(parsed.definitionOfDone).toEqual([
      { index: 0, text: "verified", checked: true },
    ]);
    expect(parsed.assignees).toEqual(["@quest-cli"]);
    expect(parsed.references).toEqual(["QCLI-97.11"]);
    expect(parsed.modifiedFiles).toEqual(["src/domain/tasks/tasks.ts"]);
    expect(parsed.createdAt).toBe("2026-08-15T00:00:00Z");
    expect(parsed.updatedAt).toBe("2026-08-15T01:00:00Z");
    expect(parsed.finalSummary).toBe("settled");
    expect(parsed.milestoneId).toBe("M-1");
    expect(parsed.ordinal).toBe(7);
    expect(parsed.priority).toBe("high");
    expect(parsed.type).toBe("feature");
  } finally {
    db.close(true);
  }
});

test("legacy string checklists in the payload normalize to checked items on read", async () => {
  const path = databasePath();
  const source = snapshot();
  const [first, second] = source.tasks;
  if (!first || !second) throw new Error("fixture_task_missing");
  const legacy = taskState({
    ...first,
    acceptanceCriteria: ["legacy"] as readonly (string | never)[],
    definitionOfDone: [] as readonly (string | never)[],
  });
  await new SqliteProjectionStore(path).rebuild({
    enumerate: async () => ({ ...source, tasks: [legacy, second] }),
  });
  const raw = new Database(path);
  try {
    // Insert a genuinely legacy payload (bare strings) directly, bypassing
    // taskState(), to prove the read path normalizes pre-change artifacts.
    raw.exec(
      "INSERT INTO tasks (id, title, status, payload) VALUES ('T-9', 'Legacy', 'To Do', ?)",
      [
        JSON.stringify({
          ...legacy,
          id: "T-9",
          title: "Legacy",
          acceptanceCriteria: ["legacy"],
          gates: [],
          gateEvents: [],
        }),
      ],
    );
  } finally {
    raw.close(true);
  }
  const read = await new SqliteProjectionTaskReader(path).readAll();
  expect(read.tasks[0]?.acceptanceCriteria).toEqual([
    { index: 0, text: "legacy", checked: false },
  ]);
  const legacyRow = read.tasks.find((task) => task.id === "T-9");
  expect(legacyRow?.acceptanceCriteria).toEqual([
    { index: 0, text: "legacy", checked: false },
  ]);
});
