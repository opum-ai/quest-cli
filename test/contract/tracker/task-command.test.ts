import { expect, test } from "bun:test";

import {
  type TaskRepository,
  TaskService,
} from "../../../src/application/tasks/tasks.ts";
import { dispatchTrackerTaskCommand } from "../../../src/cli/commands/task/index.ts";
import type { TaskState } from "../../../src/domain/tasks/tasks.ts";

class MemoryTasks implements TaskRepository {
  readonly tasks: TaskState[] = [];

  async readAll() {
    return { revision: "one", tasks: this.tasks };
  }

  async write(request: Parameters<TaskRepository["write"]>[0]) {
    const index = this.tasks.findIndex((task) => task.id === request.task.id);
    if (index < 0) this.tasks.push(request.task);
    else this.tasks[index] = request.task;
    return { kind: "success" as const, revision: "two" };
  }
}

test("task command mapping preserves read records and requires actor declarations only for writes", async () => {
  const service = new TaskService(new MemoryTasks());
  const actor = { id: "person-1", kind: "human" as const };
  const created = await dispatchTrackerTaskCommand(service, {
    command: "create",
    id: "T-1",
    operationId: "op-1",
    actor,
    input: {
      title: "Track it",
      labels: ["doc:story"],
      documentation: ["docs/stories/example.md"],
      description: "Unchanged public task detail.",
    },
  });
  expect(created).toMatchObject({
    schemaVersion: 1,
    kind: "task.created",
    data: { id: "T-1", labels: ["doc:story"] },
  });
  await expect(
    dispatchTrackerTaskCommand(service, {
      command: "list",
      labels: ["doc:story"],
    }),
  ).resolves.toMatchObject({ kind: "task.list", data: [{ id: "T-1" }] });
  await expect(
    dispatchTrackerTaskCommand(service, { command: "view", reference: "T-1" }),
  ).resolves.toMatchObject({
    kind: "task.view",
    data: { description: "Unchanged public task detail." },
  });
  await expect(
    dispatchTrackerTaskCommand(service, {
      command: "edit",
      reference: "T-1",
      operationId: "op-2",
      actor: {
        id: "agent-1",
        kind: "delegated-agent",
        accountableHumanId: "person-1",
      },
      patch: { documentation: ["docs/stories/replaced.md"] },
    }),
  ).resolves.toMatchObject({
    kind: "task.updated",
    data: { documentation: ["docs/stories/replaced.md"] },
  });
});

test("task list composes --ready with every other selection filter", async () => {
  const service = new TaskService(new MemoryTasks());
  const actor = { id: "person-1", kind: "human" as const };
  async function create(
    id: string,
    overrides: Partial<Parameters<TaskService["create"]>[1]> = {},
  ) {
    await dispatchTrackerTaskCommand(service, {
      command: "create",
      id,
      operationId: `op-${id}`,
      actor,
      input: {
        title: id,
        labels: [],
        documentation: [],
        ...overrides,
      },
    });
  }
  await create("T-1", {
    labels: ["backend"],
    priority: "high",
    type: "feature",
    assignees: ["person-2"],
    milestoneId: undefined,
  });
  await create("T-2", {
    labels: ["frontend"],
    priority: "low",
    type: "bug",
    dependencies: ["T-1"],
  });
  await create("T-3", { labels: ["backend"], priority: "high" });
  await dispatchTrackerTaskCommand(service, {
    command: "edit",
    reference: "T-1",
    operationId: "op-t1-parent",
    actor,
    patch: {},
  });

  // --ready: T-2 depends on T-1 (still "To Do"), so only T-1 and T-3 are ready.
  await expect(
    dispatchTrackerTaskCommand(service, { command: "list", ready: true }),
  ).resolves.toMatchObject({
    kind: "task.list",
    data: [{ id: "T-1" }, { id: "T-3" }],
  });

  // --ready composed with --label narrows further.
  await expect(
    dispatchTrackerTaskCommand(service, {
      command: "list",
      ready: true,
      labels: ["backend"],
    }),
  ).resolves.toMatchObject({
    kind: "task.list",
    data: [{ id: "T-1" }, { id: "T-3" }],
  });

  // --exclude-status drops Done/etc; here nothing is Done yet so all remain,
  // but composed with --priority it narrows to the high-priority tasks.
  await expect(
    dispatchTrackerTaskCommand(service, {
      command: "list",
      priority: "high",
    }),
  ).resolves.toMatchObject({
    kind: "task.list",
    data: [{ id: "T-1" }, { id: "T-3" }],
  });

  await expect(
    dispatchTrackerTaskCommand(service, {
      command: "list",
      type: "bug",
    }),
  ).resolves.toMatchObject({ kind: "task.list", data: [{ id: "T-2" }] });

  await expect(
    dispatchTrackerTaskCommand(service, {
      command: "list",
      assignees: ["person-2"],
    }),
  ).resolves.toMatchObject({ kind: "task.list", data: [{ id: "T-1" }] });

  await expect(
    dispatchTrackerTaskCommand(service, {
      command: "list",
      unassigned: true,
    }),
  ).resolves.toMatchObject({
    kind: "task.list",
    data: [{ id: "T-2" }, { id: "T-3" }],
  });

  await expect(
    dispatchTrackerTaskCommand(service, {
      command: "list",
      search: "T-2",
    }),
  ).resolves.toMatchObject({ kind: "task.list", data: [{ id: "T-2" }] });

  await expect(
    dispatchTrackerTaskCommand(service, {
      command: "list",
      excludeStatuses: ["To Do"],
    }),
  ).resolves.toMatchObject({ kind: "task.list", data: [] });

  // Lexicographic descending on the string "priority" field: "low" sorts
  // after "high" alphabetically, so it comes first in descending order;
  // ties ("high"/"high") always break by ascending id, regardless of
  // sort direction.
  await expect(
    dispatchTrackerTaskCommand(service, {
      command: "list",
      sort: { field: "priority", direction: "desc" },
    }),
  ).resolves.toMatchObject({
    kind: "task.list",
    data: [{ id: "T-2" }, { id: "T-1" }, { id: "T-3" }],
  });

  await expect(
    dispatchTrackerTaskCommand(service, {
      command: "list",
      limit: 1,
    }),
  ).resolves.toMatchObject({ kind: "task.list", data: [{ id: "T-1" }] });
});

test("task list --milestone and --parent filter on the exact reference", async () => {
  const service = new TaskService(new MemoryTasks());
  const actor = { id: "person-1", kind: "human" as const };
  await dispatchTrackerTaskCommand(service, {
    command: "create",
    id: "T-1",
    operationId: "op-1",
    actor,
    input: { title: "Parent", labels: [], documentation: [] },
  });
  await dispatchTrackerTaskCommand(service, {
    command: "create",
    id: "T-2",
    operationId: "op-2",
    actor,
    input: {
      title: "Child",
      labels: [],
      documentation: [],
      parentId: "T-1",
      milestoneId: undefined,
    },
  });
  await expect(
    dispatchTrackerTaskCommand(service, {
      command: "list",
      parentId: "T-1",
    }),
  ).resolves.toMatchObject({ kind: "task.list", data: [{ id: "T-2" }] });
  await expect(
    dispatchTrackerTaskCommand(service, {
      command: "list",
      milestoneId: "M-1",
    }),
  ).resolves.toMatchObject({ kind: "task.list", data: [] });
});
