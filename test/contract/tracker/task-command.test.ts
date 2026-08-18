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
