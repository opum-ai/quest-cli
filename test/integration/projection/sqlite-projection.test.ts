import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { SqliteProjectionStore } from "../../../src/adapters/projection/sqlite-projection.ts";
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
    acceptanceCriteria: [],
    definitionOfDone: [],
    plan: [],
    implementationNotes: [],
    comments: [],
    labels: [],
    documentation: [],
    parentId: undefined,
    dependencies: [],
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

async function databasePath(): Promise<string> {
  return join(
    await mkdtemp(join(tmpdir(), "quest-projection-")),
    "projection.sqlite",
  );
}

test("atomic rebuild projects every indexed record family from authoritative enumeration", async () => {
  const path = await databasePath();
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
        (
          db.query(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
            count: number;
          }
        ).count,
      ).toBe(expected);
    }
  } finally {
    db.close();
  }
});

test("missing or corrupt SQLite is replaced from Git-derived input without touching it", async () => {
  const path = await databasePath();
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
});

test("a valid SQLite file with deleted data or a missing table is rebuilt from Git", async () => {
  const path = await databasePath();
  const source = snapshot();
  const store = new SqliteProjectionStore(path);
  await store.rebuild({ enumerate: async () => source });

  const deletedData = new Database(path);
  deletedData.exec("DELETE FROM tasks WHERE id = 'T-2'");
  deletedData.close();
  expect(
    await store.rebuildIfNeeded({ enumerate: async () => source }),
  ).toMatchObject({ kind: "rebuilt" });

  const missingTable = new Database(path);
  missingTable.exec("DROP TABLE aliases");
  missingTable.close();
  expect(
    await store.rebuildIfNeeded({ enumerate: async () => source }),
  ).toMatchObject({ kind: "rebuilt" });
  const rebuilt = new Database(path, { readonly: true });
  try {
    expect(
      (
        rebuilt.query("SELECT COUNT(*) AS count FROM tasks").get() as {
          count: number;
        }
      ).count,
    ).toBe(2);
    expect(
      (
        rebuilt.query("SELECT COUNT(*) AS count FROM aliases").get() as {
          count: number;
        }
      ).count,
    ).toBe(2);
  } finally {
    rebuilt.close();
  }
});

test("failed validation leaves the prior projection in place", async () => {
  const path = await databasePath();
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
      (
        db.query("SELECT title FROM tasks WHERE id = 'T-1'").get() as {
          title: string;
        }
      ).title,
    ).toBe("One");
  } finally {
    db.close();
  }
});

test("SQLite changes cannot satisfy authored gates or release authored claims", async () => {
  const path = await databasePath();
  const source = snapshot();
  await new SqliteProjectionStore(path).rebuild({
    enumerate: async () => source,
  });
  const db = new Database(path);
  db.exec("UPDATE gates SET state = 'pending'; DELETE FROM claims;");
  db.close();

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
