import { expect, test } from "bun:test";

import {
  createTask,
  defaultLifecyclePolicy,
  evaluateReadySet,
  taskState,
  transitionTask,
} from "../../../src/domain/tasks/tasks.ts";
import {
  replayGateHistory,
  type GateEvent,
} from "../../../src/domain/gates/gates.ts";
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

function gatedTask(id: string, satisfied = false) {
  const events: readonly GateEvent[] = [
    {
      eventId: `${id}-gate`,
      operationId: `${id}-define`,
      taskId: id as `T-${number}`,
      kind: "gate-defined",
      definition: {
        id: "review",
        title: "Review",
        blocking: true,
        requiresHumanJudgement: false,
      },
    },
    ...(satisfied
      ? [
          {
            eventId: `${id}-evidence`,
            operationId: `${id}-evidence-op`,
            taskId: id as `T-${number}`,
            kind: "evidence-submitted" as const,
            gateId: "review",
            evidence: {
              id: "evidence",
              reference: "https://evidence",
              actor: { id: "reviewer", kind: "human" as const, roles: [] },
              submittedAt: "2026-01-01T00:00:00Z",
            },
          },
        ]
      : []),
  ];
  const gates = replayGateHistory(events).gates.map((gate) => ({
    id: gate.id,
    title: gate.title,
    blocking: gate.blocking,
    state: gate.state,
    evidence: gate.evidence.map((evidence) => evidence.reference),
    ...(gate.satisfiedBy ? { satisfiedBy: gate.satisfiedBy } : {}),
  }));
  return taskState({ ...task(id), gateEvents: events, gates });
}

class MemoryTasks implements TaskRepository {
  reads = 0;
  writes = 0;
  private revision = "r-1";
  constructor(private tasks: ReturnType<typeof createTask>[] = []) {}
  async readAll() {
    this.reads += 1;
    return { revision: this.revision, tasks: this.tasks };
  }
  async write(request: Parameters<TaskRepository["write"]>[0]) {
    if (request.expectedRevision !== this.revision)
      return {
        kind: "conflict" as const,
        expectedRevision: request.expectedRevision,
        actualRevision: this.revision,
        operationId: request.operationId,
        ownedPaths: request.ownedPaths,
      };
    this.writes += 1;
    this.tasks = this.tasks
      .filter((item) => item.id !== request.task.id)
      .concat(request.task);
    this.revision = `r-${this.writes + 1}`;
    return { kind: "success" as const, revision: this.revision };
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
  expect(created).toMatchObject({
    kind: "success",
    task: { title: 'Unicode "quotes" ✓' },
  });
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
  expect(edited).toMatchObject({
    kind: "success",
    task: { labels: ["core", "ready"] },
  });
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

test("lifecycle policy accepts a configured ordered vocabulary and terminal definition", () => {
  const policy = {
    statuses: ["Queued", "Working", "Closed"],
    terminalStatuses: ["Closed"],
  };
  const queued = createTask(
    "T-1",
    { title: "queued", status: "Queued" },
    policy,
  );
  expect(transitionTask(queued, "Working", policy).status).toBe("Working");
  expect(
    transitionTask(transitionTask(queued, "Working", policy), "Closed", policy)
      .status,
  ).toBe("Closed");
  expect(defaultLifecyclePolicy.statuses).toEqual([
    "To Do",
    "In Progress",
    "Done",
  ]);
  expect(() => transitionTask(queued, "Closed", policy)).toThrow(
    RecordValidationError,
  );
});

test("service creation uses its lifecycle start status and rejects unconfigured input without writing", async () => {
  const policy = {
    statuses: ["Queued", "Working", "Closed"],
    terminalStatuses: ["Closed"],
  };
  const store = new MemoryTasks();
  const service = new TaskService(store, policy);
  const created = await service.create("T-1", { title: "queued" }, "create");
  expect(created).toMatchObject({
    kind: "success",
    task: { status: "Queued" },
  });
  expect((await service.ready(new Date())).ready).toEqual(["T-1"]);
  await expect(
    service.create("T-2", { title: "bad", status: "Done" }, "bad-create"),
  ).rejects.toThrow("Task status is not configured");
  expect(store.writes).toBe(1);
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

test("service canonicalizes alias links, rejects status jumps without a write, and gates exclude readiness", async () => {
  const first = task("T-1", { aliases: ["first"] });
  const store = new MemoryTasks([first]);
  const service = new TaskService(store);
  const created = await service.create(
    "T-2",
    { title: "linked", dependencies: ["FIRST"], parentId: "first" },
    "create",
  );
  expect(created).toMatchObject({
    kind: "success",
    task: { dependencies: ["T-1"], parentId: "T-1" },
  });
  await expect(service.edit("T-2", { status: "Done" }, "jump")).rejects.toThrow(
    "Illegal task transition",
  );
  expect(store.writes).toBe(1);
  const pending = gatedTask("T-3");
  expect(evaluateReadySet([pending], new Date())).toEqual({
    ready: [],
    excluded: [{ taskId: "T-3", reason: "pending_gate" }],
  });
  const satisfied = gatedTask("T-4", true);
  expect(evaluateReadySet([satisfied], new Date()).ready).toEqual(["T-4"]);
});

test("a repository CAS conflict includes its observed basis and never reports a lost write as success", async () => {
  const stale: TaskRepository = {
    readAll: async () => ({ revision: "before", tasks: [] }),
    write: async (request) => ({
      kind: "conflict",
      expectedRevision: request.expectedRevision,
      actualRevision: "after",
      operationId: request.operationId,
      ownedPaths: request.ownedPaths,
    }),
  };
  const result = await new TaskService(stale).create(
    "T-1",
    { title: "raced" },
    "operation-1",
  );
  expect(result).toEqual({
    kind: "conflict",
    expectedRevision: "before",
    actualRevision: "after",
    operationId: "operation-1",
    ownedPaths: [".quest/tasks/T-1.md"],
  });
});
