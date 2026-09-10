import { expect, test } from "bun:test";
import {
  EnrolledWorkspaceQueries,
  type ProjectionTaskReader,
  WorkspaceTaskQueries,
} from "../../src/application/queries/queries.ts";
import type { TaskReader } from "../../src/application/tasks/tasks.ts";
import { createTask } from "../../src/domain/tasks/tasks.ts";

const task = (id: string, title = `Task ${id}`) => createTask(id, { title });

class AuthoritativeTasks implements TaskReader {
  reads = 0;
  constructor(
    readonly revision: string,
    readonly tasks: readonly ReturnType<typeof task>[],
  ) {}
  async readAll() {
    this.reads += 1;
    return { revision: this.revision, tasks: this.tasks };
  }
}

class ReadOnlyProjection implements ProjectionTaskReader {
  reads = 0;
  constructor(
    private readonly snapshot: Awaited<
      ReturnType<ProjectionTaskReader["readAll"]>
    >,
  ) {}
  async readAll() {
    this.reads += 1;
    return this.snapshot;
  }
}

test("a matching projection is read-only and serves a workspace query", async () => {
  const authoritative = new AuthoritativeTasks("r-1", [
    task("T-2"),
    task("T-1"),
  ]);
  const projection = new ReadOnlyProjection({
    workspaceId: "workspace-a",
    revision: "r-1",
    tasks: [task("T-2"), task("T-1")],
  });
  const queries = new WorkspaceTaskQueries(
    "workspace-a",
    authoritative,
    projection,
  );

  await expect(queries.search("task t-1")).resolves.toMatchObject({
    source: "projection",
    projection: "matching",
    tasks: [{ id: "T-1" }],
  });
  expect(authoritative.reads).toBe(1);
  expect(projection.reads).toBe(1);
});

test("stale and unreadable projections fall back without a repair capability", async () => {
  const authoritative = new AuthoritativeTasks("r-2", [
    task("T-1", "Authoritative"),
  ]);
  const stale = new ReadOnlyProjection({
    workspaceId: "workspace-a",
    revision: "r-1",
    tasks: [task("T-1", "Stale")],
  });
  await expect(
    new WorkspaceTaskQueries("workspace-a", authoritative, stale).list(),
  ).resolves.toMatchObject({
    source: "authoritative",
    projection: "stale",
    tasks: [{ title: "Authoritative" }],
  });

  const unavailable: ProjectionTaskReader = {
    readAll: async () => {
      throw new Error("corrupt");
    },
  };
  await expect(
    new WorkspaceTaskQueries("workspace-a", authoritative, unavailable).list(),
  ).resolves.toMatchObject({
    source: "authoritative",
    projection: "unavailable",
  });

  const tampered = new ReadOnlyProjection({
    workspaceId: "workspace-a",
    revision: "r-2",
    tasks: [task("T-1", "Tampered")],
  });
  await expect(
    new WorkspaceTaskQueries("workspace-a", authoritative, tampered).list(),
  ).resolves.toMatchObject({
    source: "authoritative",
    projection: "stale",
    tasks: [{ title: "Authoritative" }],
  });
});

test("cross-workspace queries exclude un-enrolled members and report enrolled absences", async () => {
  const present = new WorkspaceTaskQueries(
    "workspace-a",
    new AuthoritativeTasks("r-1", [task("T-1", "find me")]),
  );
  const queries = new EnrolledWorkspaceQueries([
    {
      workspace: {
        commonDirectory: "/repo-a",
        worktreePath: "/worktree-a",
        state: "present",
      },
      queries: present,
    },
    {
      workspace: {
        commonDirectory: "/repo-b",
        worktreePath: "/worktree-b",
        state: "missing",
      },
    },
    {
      workspace: {
        commonDirectory: "/repo-c",
        worktreePath: "/worktree-c",
        state: "invalid",
      },
    },
  ]);

  await expect(queries.search("find")).resolves.toMatchObject({
    workspaces: [
      { workspace: { worktreePath: "/worktree-a" }, tasks: [{ id: "T-1" }] },
    ],
    missing: [
      { workspace: { worktreePath: "/worktree-b" }, reason: "missing" },
      { workspace: { worktreePath: "/worktree-c" }, reason: "invalid" },
    ],
  });
});
