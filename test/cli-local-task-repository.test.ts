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
