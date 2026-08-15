import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "bun:test";

import { LocalTaskRepository } from "../src/application/tasks/local-task-repository.ts";
import { createTask } from "../src/domain/tasks/tasks.ts";

test("local repository serializes stale concurrent writes into one structured conflict", async () => {
  const directory = join(await mkdtemp(join(tmpdir(), "quest-lock-")), "tasks");
  try {
    const one = new LocalTaskRepository(directory);
    const two = new LocalTaskRepository(directory);
    const first = await one.readAll();
    const second = await two.readAll();
    const results = await Promise.all([
      one.write({
        task: createTask("T-1", { title: "one" }),
        expectedRevision: first.revision,
        operationId: "one",
        ownedPaths: [".quest/tasks/T-1.md"],
      }),
      two.write({
        task: createTask("T-2", { title: "two" }),
        expectedRevision: second.revision,
        operationId: "two",
        ownedPaths: [".quest/tasks/T-2.md"],
      }),
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
