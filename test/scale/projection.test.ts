import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  SqliteProjectionStore,
  SqliteProjectionTaskReader,
} from "../../src/adapters/projection/sqlite-projection.ts";
import type { AuthoritativeProjectionSnapshot } from "../../src/application/projection/projection.ts";
import {
  EnrolledWorkspaceQueries,
  type EnrolledWorkspaceQueryMember,
  WorkspaceTaskQueries,
} from "../../src/application/queries/queries.ts";
import type { ClaimEvent } from "../../src/domain/claims/claims.ts";
import { createTask } from "../../src/domain/tasks/tasks.ts";

const taskCount = 10_000;
const eventsPerTask = 10;
const workspaceCount = 25;

function taskId(index: number): string {
  return `T-${index + 1}`;
}

function scaleTasks() {
  return Array.from({ length: taskCount }, (_, index) =>
    createTask(taskId(index), { title: `Representative task ${index + 1}` }),
  );
}

function scaleEvents(): readonly ClaimEvent[] {
  return Array.from({ length: taskCount * eventsPerTask }, (_, index) => {
    const taskIndex = Math.floor(index / eventsPerTask);
    const eventIndex = index % eventsPerTask;
    return {
      eventId: `claim-event-${index + 1}`,
      operationId: `claim-operation-${index + 1}`,
      taskId: taskId(taskIndex),
      kind: eventIndex === 0 ? "claimed" : "renewed",
      generation: "1",
      holderId: "operator",
      accountableHumanId: "operator",
      at: new Date(Date.UTC(2026, 7, 15, 0, 0, eventIndex)).toISOString(),
    };
  });
}

function scaleSnapshot(
  workspaceIndex: number,
): AuthoritativeProjectionSnapshot {
  return {
    workspaceId: `representative-workspace-${workspaceIndex + 1}`,
    checkpoint: {
      revision: `representative-revision-${workspaceIndex + 1}`,
      observedAt: "2026-08-15T00:00:00.000Z",
    },
    tasks: scaleTasks(),
    actors: [{ id: "operator", kind: "human", roles: [] }],
    claimEvents: scaleEvents(),
  };
}

test("rebuilds 10k tasks and 100k events within the accepted per-workspace budget", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-projection-scale-"));
  try {
    let source: AuthoritativeProjectionSnapshot | undefined;
    const startedAt = performance.now();
    const result = await new SqliteProjectionStore(
      join(root, "projection.sqlite"),
    ).rebuild({
      // Constructing this representative authoritative replay belongs in the
      // forced-full-rebuild measurement, rather than being precomputed.
      enumerate: async () => {
        source = scaleSnapshot(0);
        return source;
      },
    });
    const elapsedMs = performance.now() - startedAt;

    expect(result).toMatchObject({
      kind: "rebuilt",
      checkpoint: source?.checkpoint,
    });
    // The accepted design point is "low single-digit seconds". Five seconds
    // leaves the budget explicit without treating the target as a hard limit.
    expect(elapsedMs).toBeLessThan(5_000);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 15_000);

test("rebuilds and queries 25 enrolled representative workspaces within the aggregate budget", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-projection-scale-"));
  try {
    const members: EnrolledWorkspaceQueryMember[] = [];
    const startedAt = performance.now();
    for (let index = 0; index < workspaceCount; index += 1) {
      const databasePath = join(root, `workspace-${index + 1}.sqlite`);
      let source: AuthoritativeProjectionSnapshot | undefined;
      await new SqliteProjectionStore(databasePath).rebuild({
        enumerate: async () => {
          source = scaleSnapshot(index);
          return source;
        },
      });
      if (!source) throw new Error("scale_source_missing");
      const snapshot = source;
      members.push({
        workspace: {
          commonDirectory: `/repositories/${index + 1}`,
          worktreePath: `/worktrees/${index + 1}`,
          state: "present",
        },
        queries: new WorkspaceTaskQueries(
          snapshot.workspaceId,
          {
            readAll: async () => ({
              revision: snapshot.checkpoint.revision,
              tasks: snapshot.tasks,
            }),
          },
          new SqliteProjectionTaskReader(databasePath),
        ),
      });
    }
    const result = await new EnrolledWorkspaceQueries(members).search(
      "representative task 10000",
    );
    const elapsedMs = performance.now() - startedAt;

    expect(result.missing).toEqual([]);
    expect(result.workspaces).toHaveLength(workspaceCount);
    expect(
      result.workspaces.every(
        (workspace) =>
          workspace.source === "projection" &&
          workspace.projection === "matching" &&
          workspace.tasks.length === 1,
      ),
    ).toBe(true);
    // The accepted aggregate budget is low minutes. This measures 25 actual
    // SQLite rebuilds and read-only matching-projection queries end to end.
    expect(elapsedMs).toBeLessThan(120_000);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 135_000);
