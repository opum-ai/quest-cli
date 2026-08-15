import { expect, test } from "bun:test";

import {
  createTask,
  evaluateReadySet,
  transitionTask,
} from "../../../src/domain/tasks/tasks.ts";
import {
  TaskService,
  type TaskRepository,
} from "../../../src/application/tasks/tasks.ts";
import { RecordValidationError } from "../../../src/domain/records.ts";

function task(
  id: string,
  overrides: Partial<ReturnType<typeof createTask>> = {},
) {
  return createTask(id, { title: `Task ${id}`, ...overrides });
}

class MemoryTasks implements TaskRepository {
  reads = 0;
  writes = 0;
  constructor(private tasks: ReturnType<typeof createTask>[] = []) {}
  async readAll() {
    this.reads += 1;
    return this.tasks;
  }
  async write(next: ReturnType<typeof createTask>) {
    this.writes += 1;
    this.tasks = this.tasks.filter((item) => item.id !== next.id).concat(next);
  }
}

test("CRUD retains all authored task fields and reads never write", async () => {
  const store = new MemoryTasks();
  const tasks = new TaskService(store);
  const created = await tasks.create(
    "T-1",
    {
      title: 'Unicode "quotes" ✓',
      summary: "short",
      description: "long narrative",
      priority: "high",
      type: "feature",
      ordinal: 7,
      aliases: ["ONE"],
      acceptanceCriteria: ["works"],
      definitionOfDone: ["verified"],
      plan: ["build"],
      implementationNotes: ["note"],
      comments: [{ id: "c-1", authorId: "a", body: "hello", createdAt: "now" }],
      labels: ["core"],
      documentation: ["docs/spec.md"],
      source: { system: "backlog", reference: "QCLI-80" },
    },
    "create-1",
  );
  expect(created.title).toBe('Unicode "quotes" ✓');
  expect((await tasks.view("one")).source?.reference).toBe("QCLI-80");
  expect((await tasks.search("narrative"))[0]?.id).toBe("T-1");
  expect(store.writes).toBe(1);
  await tasks.list();
  await tasks.ready(new Date("2026-01-01T00:00:00Z"));
  expect(store.writes).toBe(1);
  const edited = await tasks.edit(
    "T-1",
    { labels: ["core", "ready"], parentId: undefined },
    "edit-1",
  );
  expect(edited.labels).toEqual(["core", "ready"]);
});

test("lifecycle only moves through its configured order and retains done records", () => {
  const todo = task("T-1");
  const progress = transitionTask(todo, "In Progress");
  expect(transitionTask(progress, "Done").status).toBe("Done");
  expect(() => transitionTask(todo, "Done")).toThrow(RecordValidationError);
  expect(() => transitionTask(progress, "To Do")).toThrow(
    RecordValidationError,
  );
});

test("ready evaluation is deterministic and distinguishes completion, blockers, claims, and expiry", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  const complete = task("T-1", { status: "Done" });
  const ready = task("T-2", { dependencies: ["T-1"] });
  const blocked = task("T-3", {
    blockers: [
      {
        kind: "opened",
        blockId: "b",
        actorId: "a",
        at: "then",
        reason: "waiting",
      },
    ],
  });
  const live = task("T-4", {
    claim: {
      holderId: "a",
      leaseGeneration: "1",
      expiresAt: "2026-01-02T00:00:00Z",
    },
  });
  const expired = task("T-5", {
    claim: {
      holderId: "a",
      leaseGeneration: "1",
      expiresAt: "2025-12-31T00:00:00Z",
    },
  });
  expect(
    evaluateReadySet([live, blocked, expired, ready, complete], now),
  ).toEqual({
    ready: ["T-2", "T-5"],
    excluded: [
      { taskId: "T-1", reason: "lifecycle_ineligible" },
      { taskId: "T-3", reason: "explicitly_blocked" },
      { taskId: "T-4", reason: "live_claim" },
    ],
  });
});

test("aliases are canonicalized before rejecting duplicate edges, cycles, and invalid blockers", () => {
  const first = task("T-1", { aliases: ["first"] });
  const duplicate = task("T-2", { dependencies: ["T-1", "FIRST"] });
  expect(() => evaluateReadySet([first, duplicate], new Date())).toThrow(
    "dependency_duplicate_edge",
  );
  const a = task("T-3", { dependencies: ["T-4"] });
  const b = task("T-4", { dependencies: ["T-3"] });
  const isolated = task("T-5");
  expect(() => evaluateReadySet([a, b, isolated], new Date())).toThrow(
    "dependency_cycle",
  );
  const invalidBlockers = task("T-6", {
    blockers: [
      { kind: "cleared", blockId: "missing", actorId: "a", at: "now" },
    ],
  });
  expect(() => evaluateReadySet([invalidBlockers], new Date())).toThrow(
    "blocker_unknown_or_repeat_clear",
  );
});

test("invalid references, hierarchy cycles, and blocker histories fail before application writes", async () => {
  const store = new MemoryTasks();
  const service = new TaskService(store);
  await expect(
    service.create("T-1", { title: "bad", dependencies: ["missing"] }, "op"),
  ).rejects.toThrow("dependency_target_not_found");
  expect(store.writes).toBe(0);
  const one = task("T-1", { parentId: "T-2" });
  const two = task("T-2", { parentId: "T-1" });
  expect(() => evaluateReadySet([one, two], new Date())).toThrow(
    "parent_cycle",
  );
  const openedThenClearedWithoutEvidence = task("T-3", {
    blockers: [
      { kind: "opened", blockId: "b", actorId: "a", at: "then", reason: "x" },
      { kind: "cleared", blockId: "b", actorId: "a", at: "now" },
    ],
  });
  expect(() =>
    evaluateReadySet([openedThenClearedWithoutEvidence], new Date()),
  ).toThrow("blocker_clear_requires_evidence");
});
