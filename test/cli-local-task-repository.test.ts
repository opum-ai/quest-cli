import { expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LocalTaskRepository } from "../src/application/tasks/local-task-repository.ts";
import { TaskService } from "../src/application/tasks/tasks.ts";
import { createTask } from "../src/domain/tasks/tasks.ts";
import { LocalPlanningRepository } from "../src/adapters/planning/local-planning-repository.ts";

function request(id: string, revision: string) {
  return {
    task: createTask(id, { title: id }),
    expectedRevision: revision,
    operationId: id,
    ownedPaths: [`.quest/tasks/${id}.md`],
  };
}

test("local repository serializes stale concurrent writes into one structured conflict", async () => {
  const directory = join(await mkdtemp(join(tmpdir(), "quest-lock-")), "tasks");
  try {
    const one = new LocalTaskRepository(directory);
    const two = new LocalTaskRepository(directory);
    const first = await one.readAll();
    const second = await two.readAll();
    const results = await Promise.all([
      one.write(request("T-1", first.revision)),
      two.write(request("T-2", second.revision)),
    ]);
    expect(results.filter((result) => result.kind === "success")).toHaveLength(
      1,
    );
    expect(results.filter((result) => result.kind === "conflict")).toHaveLength(
      1,
    );
  } finally {
    await rm(join(directory, ".."), { recursive: true, force: true });
  }
});

test("local repository does not remove stale-looking locks and bounds them as conflicts", async () => {
  const directory = join(await mkdtemp(join(tmpdir(), "quest-lock-")), "tasks");
  try {
    const repository = new LocalTaskRepository(directory);
    const snapshot = await repository.readAll();
    const lock = join(directory, ".write.lock");
    await mkdir(lock, { recursive: true });
    const stale = new Date(Date.now() - 2_000);
    await utimes(lock, stale, stale);
    const started = performance.now();
    await expect(
      repository.write(request("T-1", snapshot.revision)),
    ).resolves.toMatchObject({ kind: "conflict" });
    expect(performance.now() - started).toBeLessThan(1_000);
    expect((await stat(lock)).isDirectory()).toBe(true);
  } finally {
    await rm(join(directory, ".."), { recursive: true, force: true });
  }
});

test("lifecycle moves retain one canonical task identity and drafts promote atomically", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-lifecycle-"));
  try {
    const service = new TaskService(
      new LocalTaskRepository(join(root, ".quest", "tasks")),
    );
    await service.create("T-1", { title: "retain me" }, "create");
    await service.transition("T-1", "In Progress", "progress");
    await service.complete("T-1", "complete");
    expect((await service.list()).map((task) => task.id)).toEqual([]);
    expect((await service.view("T-1")).status).toBe("Done");
    await service.demote("T-1", "demote");
    expect((await service.view("T-1")).status).toBe("To Do");
    await service.archive("T-1", "archive");
    await expect(
      service.create("T-1", { title: "reuse" }, "reuse"),
    ).rejects.toThrow("task_already_exists");
    await service.createDraft(
      "D-1",
      { title: "draft", labels: ["draft"] },
      "draft-create",
    );
    expect(
      (await service.listDrafts()).map((record) => record.draft.id),
    ).toEqual(["D-1"]);
    await service.promoteDraft("D-1", "T-2", "promote");
    expect((await service.view("T-2")).title).toBe("draft");
    await service.createDraft(
      "D-2",
      { title: "archive draft" },
      "draft-create-2",
    );
    await service.archiveDraft("D-2", "draft-archive");
    expect(
      (await service.listDrafts()).map((record) => record.draft.id),
    ).toEqual([]);
    expect(
      (await service.listDrafts(true)).map((record) => record.location),
    ).toEqual(["archive/drafts"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a durable lifecycle journal resumes a destination-first task move after interruption", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-lifecycle-recovery-"));
  try {
    const repository = new LocalTaskRepository(join(root, ".quest", "tasks"));
    const service = new TaskService(repository);
    await service.create("T-1", { title: "recover me" }, "create");
    const snapshot = await repository.readAll();
    const task = await service.view("T-1");
    await writeFile(
      join(root, ".quest", "tasks", ".lifecycle.journal.json"),
      JSON.stringify({
        expectedRevision: snapshot.revision,
        operationId: "archive",
        ownedPaths: [".quest/tasks/T-1.json", ".quest/archive/tasks/T-1.json"],
        taskChanges: [
          { taskId: "T-1", location: "tasks", remove: true },
          { task, location: "archive/tasks" },
        ],
        draftChanges: [],
      }),
      "utf8",
    );
    await repository.writeLifecycle({
      expectedRevision: snapshot.revision,
      operationId: "next-write",
      ownedPaths: [],
      taskChanges: [],
      draftChanges: [],
    });
    expect((await repository.readAll()).taskRecords).toEqual([
      { task, location: "archive/tasks" },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a corrupt recovery journal preserves existing records without applying any deletion", async () => {
  const root = await mkdtemp(
    join(tmpdir(), "quest-lifecycle-corrupt-journal-"),
  );
  try {
    const repository = new LocalTaskRepository(join(root, ".quest", "tasks"));
    const service = new TaskService(repository);
    await service.create("T-1", { title: "retain me" }, "create");
    const snapshot = await repository.readAll();
    const task = await service.view("T-1");
    const journal = join(root, ".quest", "tasks", ".lifecycle.journal.json");
    await writeFile(
      journal,
      JSON.stringify({
        expectedRevision: snapshot.revision,
        operationId: "corrupt",
        ownedPaths: [],
        taskChanges: [
          { taskId: "../../outside", location: "tasks", remove: true },
          { task, location: "archive/tasks" },
        ],
        draftChanges: [],
      }),
      "utf8",
    );
    await expect(
      repository.writeLifecycle({
        expectedRevision: snapshot.revision,
        operationId: "next-write",
        ownedPaths: [],
        taskChanges: [],
        draftChanges: [],
      }),
    ).rejects.toThrow("Invalid canonical id");
    expect(await service.view("T-1")).toEqual(task);
    expect(await readFile(journal, "utf8")).toContain("../../outside");
    await expect(stat(join(root, "outside.json"))).rejects.toHaveProperty(
      "code",
      "ENOENT",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("applyTransaction atomically applies task and milestone changes with reciprocal closure", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-txn-"));
  try {
    const planning = new LocalPlanningRepository(root);
    const repo = new LocalTaskRepository(
      join(root, ".quest", "tasks"),
      planning,
    );

    const t1 = createTask("T-1", { title: "one", milestoneId: "M-1" });
    const t2 = createTask("T-2", { title: "two", milestoneId: "M-1" });
    const m1 = {
      id: "M-1" as `M-${number}`,
      title: "Release",
      status: "open" as const,
      taskIds: ["T-1", "T-2"] as string[],
    };

    const before = await repo.readAll();
    const planningBefore = await planning.read();

    const result = await repo.applyTransaction({
      expectedTaskRevision: before.revision,
      expectedPlanningRevision: planningBefore.revision,
      operationId: "txn-1",
      ownedPaths: [
        ".quest/tasks/T-1.json",
        ".quest/tasks/T-2.json",
        ".quest/planning.json",
      ],
      taskChanges: [
        { task: t1, location: "tasks" },
        { task: t2, location: "tasks" },
      ],
      milestones: [m1],
      decisions: [],
    });

    expect(result.kind).toBe("success");
    const after = await repo.readAll();
    expect(after.taskRecords.map((r) => r.task.id).sort()).toEqual([
      "T-1",
      "T-2",
    ]);
    const planningAfter = await planning.read();
    expect(planningAfter.milestones).toHaveLength(1);
    expect(planningAfter.milestones[0].id).toBe("M-1");
    expect(planningAfter.milestones[0].taskIds).toEqual(["T-1", "T-2"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("applyTransaction returns conflict on stale task revision and leaves no half graph", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-txn-conflict-"));
  try {
    const planning = new LocalPlanningRepository(root);
    const repo = new LocalTaskRepository(
      join(root, ".quest", "tasks"),
      planning,
    );

    const t1 = createTask("T-1", { title: "one", milestoneId: "M-1" });
    const m1 = {
      id: "M-1" as `M-${number}`,
      title: "Release",
      status: "open" as const,
      taskIds: ["T-1"] as string[],
    };

    const before = await repo.readAll();
    const planningBefore = await planning.read();

    // Mutate the store to change the revision
    await repo.write({
      task: createTask("T-99", { title: "interloper" }),
      expectedRevision: before.revision,
      operationId: "interloper",
      ownedPaths: [".quest/tasks/T-99.json"],
    });

    const result = await repo.applyTransaction({
      expectedTaskRevision: before.revision,
      expectedPlanningRevision: planningBefore.revision,
      operationId: "txn-stale",
      ownedPaths: [".quest/tasks/T-1.json", ".quest/planning.json"],
      taskChanges: [{ task: t1, location: "tasks" }],
      milestones: [m1],
      decisions: [],
    });

    expect(result.kind).toBe("conflict");
    const after = await repo.readAll();
    const ids = after.taskRecords.map((r) => r.task.id).sort();
    expect(ids).toEqual(["T-99"]);
    const planningAfter = await planning.read();
    expect(planningAfter.milestones).toHaveLength(0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("applyTransaction is idempotent when re-applied with same operationId and unchanged state", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-txn-idem-"));
  try {
    const planning = new LocalPlanningRepository(root);
    const repo = new LocalTaskRepository(
      join(root, ".quest", "tasks"),
      planning,
    );

    const t1 = createTask("T-1", { title: "one", milestoneId: "M-1" });
    const m1 = {
      id: "M-1" as `M-${number}`,
      title: "Release",
      status: "open" as const,
      taskIds: ["T-1"] as string[],
    };

    const before = await repo.readAll();
    const planningBefore = await planning.read();

    const request = {
      expectedTaskRevision: before.revision,
      expectedPlanningRevision: planningBefore.revision,
      operationId: "txn-idem",
      ownedPaths: [".quest/tasks/T-1.json", ".quest/planning.json"],
      taskChanges: [{ task: t1, location: "tasks" as const }],
      milestones: [m1],
      decisions: [] as import("../src/domain/planning/planning.ts").Decision[],
    };

    const first = await repo.applyTransaction(request);
    expect(first.kind).toBe("success");

    // Re-apply with the new revisions; since the task already exists with the same fingerprint,
    // the transaction should still succeed (idempotent upsert).
    const afterFirst = await repo.readAll();
    const planningAfterFirst = await planning.read();
    const second = await repo.applyTransaction({
      ...request,
      expectedTaskRevision: afterFirst.revision,
      expectedPlanningRevision: planningAfterFirst.revision,
    });
    expect(second.kind).toBe("success");
    const afterSecond = await repo.readAll();
    expect(afterSecond.taskRecords.map((r) => r.task.id)).toEqual(["T-1"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("applyTransaction rollback removes only unchanged migration-created records and names survivors", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-txn-rollback-"));
  try {
    const planning = new LocalPlanningRepository(root);
    const repo = new LocalTaskRepository(
      join(root, ".quest", "tasks"),
      planning,
    );

    const t1 = createTask("T-1", { title: "one", milestoneId: "M-1" });
    const t2 = createTask("T-2", { title: "two", milestoneId: "M-1" });
    const m1 = {
      id: "M-1" as `M-${number}`,
      title: "Release",
      status: "open" as const,
      taskIds: ["T-1", "T-2"] as string[],
    };

    const before = await repo.readAll();
    const planningBefore = await planning.read();

    const result = await repo.applyTransaction({
      expectedTaskRevision: before.revision,
      expectedPlanningRevision: planningBefore.revision,
      operationId: "txn-rb",
      ownedPaths: [
        ".quest/tasks/T-1.json",
        ".quest/tasks/T-2.json",
        ".quest/planning.json",
      ],
      taskChanges: [
        { task: t1, location: "tasks" },
        { task: t2, location: "tasks" },
      ],
      milestones: [m1],
      decisions: [],
    });
    expect(result.kind).toBe("success");

    // Mutate T-2 so it no longer matches the migration-created fingerprint
    const current = await repo.readAll();
    const t2Record = current.taskRecords.find((r) => r.task.id === "T-2");
    if (!t2Record) throw new Error("T-2 not found");
    const mutatedT2 = { ...t2Record.task, title: "modified" };
    await repo.write({
      task: mutatedT2,
      expectedRevision: current.revision,
      operationId: "mutate-t2",
      ownedPaths: [".quest/tasks/T-2.json"],
    });

    // Now rollback via a reverse transaction: remove T-1 and T-2, restore milestones
    const afterMutate = await repo.readAll();
    const planningAfterMutate = await planning.read();
    const rbResult = await repo.applyTransaction({
      expectedTaskRevision: afterMutate.revision,
      expectedPlanningRevision: planningAfterMutate.revision,
      operationId: "txn-rb-rollback",
      ownedPaths: [
        ".quest/tasks/T-1.json",
        ".quest/tasks/T-2.json",
        ".quest/planning.json",
      ],
      taskChanges: [
        { taskId: "T-1", location: "tasks", remove: true },
        { taskId: "T-2", location: "tasks", remove: true },
      ],
      milestones: [],
      decisions: [],
    });
    expect(rbResult.kind).toBe("success");

    const final = await repo.readAll();
    expect(final.taskRecords.map((r) => r.task.id)).toEqual([]);
    const planningFinal = await planning.read();
    expect(planningFinal.milestones).toHaveLength(0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
