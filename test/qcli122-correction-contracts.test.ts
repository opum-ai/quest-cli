import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LocalTaskRepository } from "../src/application/tasks/local-task-repository.ts";
import {
  createTask,
  createTaskLinkSession,
} from "../src/domain/tasks/tasks.ts";

/**
 * QCLI-122 post-merge correction: red-first contracts for each reviewed
 * defect (FMC 05fe52e8). Every block below must fail against the corrected
 * implementation's absence and pass once fixed.
 */

function repository(root: string) {
  return new LocalTaskRepository(join(root, ".quest", "tasks"));
}

async function seed(root: string, id: string, title: string, deps?: string[]) {
  await mkdir(join(root, ".quest", "tasks"), { recursive: true });
  const base = createTask(id, { title });
  const record = {
    ...base,
    dependencies: [...base.dependencies, ...(deps ?? [])],
  } as typeof base;
  return writeFile(
    join(root, ".quest", "tasks", `${id}.json`),
    `${JSON.stringify(record)}\n`,
  );
}

test("link session seeds the complete existing dependency graph", () => {
  // Defect #5 red state: session previously stored every initial row's
  // dependencies as [].
  const a = {
    ...createTask("T-1", { title: "A" }),
    dependencies: ["T-2"],
  } as ReturnType<typeof createTask>;
  const b = createTask("T-2", { title: "B" });
  const session = createTaskLinkSession([a, b]);
  // A cycle introduced by re-pointing B at A through its own row must be
  // rejected even though the pre-existing edge lives on A.
  const bChanged = { ...b, dependencies: ["T-1"] } as unknown as typeof a;
  expect(() => session.apply(bChanged)).toThrow();
});

test("beginTaskBatch releases the owned lock on revision conflict and error exits", async () => {
  const root = await mkdtemp(join(tmpdir(), "qcli122-lock-"));
  try {
    const repo = repository(root);
    await seed(root, "T-1", "Lock probe");
    const snapshot = await repo.readAll();
    const staleRevision = snapshot.revision;

    const foreignWrite = await repo.write({
      task: { ...snapshot.tasks[0], description: "external" },
      expectedRevision: snapshot.revision,
      operationId: "foreign",
      ownedPaths: [],
    });
    expect(foreignWrite.kind).toBe("success");

    const result = await repo.beginTaskBatch(staleRevision);
    expect(result.kind).toBe("conflict");
    if (result.kind !== "conflict") return;
    // The lock must NOT remain held: an immediate fresh batch attempt with
    // the correct revision succeeds instead of hitting a leaked lock.
    const reopened = await repo.beginTaskBatch((await repo.readAll()).revision);
    expect(reopened.kind).toBe("locked");
    if (reopened.kind === "locked") await reopened.session.finish();

    void result;
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 20_000);
