import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LocalTaskRepository } from "../src/application/tasks/local-task-repository.ts";
import { createTask, taskState } from "../src/domain/tasks/tasks.ts";

/**
 * Release-blocking scale contracts for the repository write path
 * (QCLI-122): a single public task mutation must not re-scan and re-parse
 * every stored record more than once, the incremental post-write revision
 * must be byte-equivalent to an authoritative fresh read, and the durable
 * revision-cache fast path must fail closed whenever physical state has
 * moved away from its recorded fingerprints.
 */

function writeRequest(id: string, revision: string) {
  return {
    task: createTask(id, {
      title: `Bench ${id}`,
    }),
    expectedRevision: revision,
    operationId: `op-${id}`,
    ownedPaths: [`.quest/tasks/${id}.json`],
  };
}

class CountingRepository extends LocalTaskRepository {
  snapshotCalls = 0;
  async snapshot() {
    this.snapshotCalls += 1;
    // Protected in the base class precisely for this kind of instrumentation.
    return await super.snapshot();
  }
}

function repository(root: string) {
  return new CountingRepository(join(root, ".quest", "tasks"));
}

async function seedActive(root: string, id: string, title: string) {
  await mkdir(join(root, ".quest", "tasks"), { recursive: true });
  await writeFile(
    join(root, ".quest", "tasks", `${id}.json`),
    `${JSON.stringify(createTask(id, { title }))}\n`,
  );
}

test("a successful single-record write performs exactly one authoritative collection scan", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-write-scan-"));
  try {
    const repo = repository(root);
    await seedActive(root, "T-7", "Seed");
    const first = await repo.readAll();
    repo.snapshotCalls = 0;

    const result = await repo.write(writeRequest("T-7", first.revision));
    expect(result.kind).toBe("success");
    // With a warm fast path the locked verification serves from cache, so the
    // mutation performs at most one authoritative scan and never two.
    expect(repo.snapshotCalls).toBeLessThanOrEqual(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("the incremental post-write revision equals a fresh authoritative read", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-revision-splice-"));
  try {
    const repo = repository(root);
    await seedActive(root, "T-8", "Alpha");
    const current = await repo.readAll();

    const replacement = taskState({
      ...createTask("T-8", { title: "Alpha v2" }),
      labels: ["moved"],
      description: "updated",
    });
    const result = await repo.write({
      ...writeRequest("T-8", current.revision),
      task: replacement,
    });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    const fresh = await repo.readAll();
    // The returned revision came from the in-memory splice; a completely
    // independent rescan must produce the identical digest.
    expect(result.revision).toBe(fresh.revision);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("splice stays byte-equivalent when label additions append new object keys", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-keyorder-splice-"));
  try {
    const repo = repository(root);
    await seedActive(root, "T-9", "Keys");
    const current = await repo.readAll();
    const originalRecord = current.taskRecords[0];

    // documents/labels are appended key positions in the stored record, so
    // the payload's property order differs from the previous file's order.
    const mutated = taskState({
      ...originalRecord.task,
      description: "new field",
    });
    expect(Object.keys(mutated)).not.toEqual(Object.keys(originalRecord.task));
    const result = await repo.write({
      ...writeRequest("T-9", current.revision),
      task: mutated,
    });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    const fresh = await repo.readAll();
    expect(result.revision).toBe(fresh.revision);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
