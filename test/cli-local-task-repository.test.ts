import { mkdir, mkdtemp, rm, stat, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "bun:test";

import { LocalTaskRepository } from "../src/application/tasks/local-task-repository.ts";
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
