import { expect, test } from "bun:test";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runQuest } from "../../../src/cli/main.ts";

/**
 * QCLI-137: Quest stamps `createdAt` on creation and advances `updatedAt` on
 * every write. Records authored before this landed carry neither; they are
 * deliberately NOT backfilled, because inventing a creation time is worse than
 * admitting there isn't one. The sort contract has to cope with both.
 */

const actor = ["--actor", "person-1", "--actor-kind", "human"];

async function withStore(
  body: (
    run: (argv: readonly string[]) => Promise<{
      exitCode: number;
      stdout: string;
      stderr: string;
    }>,
    store: string,
  ) => Promise<void>,
): Promise<void> {
  const store = await mkdtemp(join(tmpdir(), "quest-timestamps-"));
  const previous = process.env.QUEST_TASK_STORE;
  process.env.QUEST_TASK_STORE = store;
  try {
    await body((argv) => runQuest(argv, false), store);
  } finally {
    if (previous === undefined) delete process.env.QUEST_TASK_STORE;
    else process.env.QUEST_TASK_STORE = previous;
    await rm(store, { recursive: true, force: true });
  }
}

function data(result: { stdout: string }): Record<string, unknown> {
  return (JSON.parse(result.stdout) as { data: Record<string, unknown> }).data;
}

function rows(result: { stdout: string }): Record<string, unknown>[] {
  return (JSON.parse(result.stdout) as { data: Record<string, unknown>[] })
    .data;
}

test("create stamps both timestamps and every write advances updatedAt", async () => {
  await withStore(async (run) => {
    const created = await run([
      "task",
      "create",
      "Stamped",
      ...actor,
      "--json",
    ]);
    expect(created.exitCode).toBe(0);
    const createdAt = data(created).createdAt as string;
    const firstUpdatedAt = data(created).updatedAt as string;
    // A record is created and last-updated at the same instant.
    expect(createdAt).toBe(firstUpdatedAt);
    expect(Number.isNaN(Date.parse(createdAt))).toBe(false);
    expect(createdAt).toBe(new Date(createdAt).toISOString());

    const viewed = await run(["task", "view", "T-1", "--json"]);
    expect(data(viewed).createdAt).toBe(createdAt);
    expect(data(viewed).updatedAt).toBe(firstUpdatedAt);

    const edited = await run([
      "task",
      "edit",
      "T-1",
      "--summary",
      "changed",
      ...actor,
      "--json",
    ]);
    expect(edited.exitCode).toBe(0);
    // createdAt is immutable; updatedAt never moves backwards.
    expect(data(edited).createdAt).toBe(createdAt);
    expect(Date.parse(data(edited).updatedAt as string)).toBeGreaterThanOrEqual(
      Date.parse(firstUpdatedAt),
    );

    const listed = await run(["task", "list", "--json"]);
    const row = rows(listed).find((task) => task.id === "T-1");
    expect(row?.createdAt).toBe(createdAt);
    expect(row?.updatedAt).toBe(data(edited).updatedAt);
  });
});

test("a lifecycle move is a write and advances updatedAt", async () => {
  await withStore(async (run) => {
    const created = await run(["task", "create", "Moved", ...actor, "--json"]);
    const createdAt = data(created).createdAt as string;
    const before = data(created).updatedAt as string;

    await run([
      "task",
      "edit",
      "T-1",
      "--status",
      "In Progress",
      ...actor,
      "--json",
    ]);
    const completed = await run([
      "task",
      "complete",
      "T-1",
      ...actor,
      "--json",
    ]);
    expect(completed.exitCode).toBe(0);
    // `task complete` nests the record under data.task, unlike view/create.
    const moved = (data(completed) as { task: Record<string, unknown> }).task;
    expect(moved.createdAt).toBe(createdAt);
    // Not strict: two writes can land in the same millisecond. The strict
    // advance is proven with an injected clock in tasks.test.ts.
    expect(Date.parse(moved.updatedAt as string)).toBeGreaterThanOrEqual(
      Date.parse(before),
    );
  });
});

test("task list sorts by timestamp, and a record written before QCLI-137 sorts last ascending", async () => {
  await withStore(async (run, store) => {
    await run(["task", "create", "First", "--id", "T-1", ...actor, "--json"]);
    await run(["task", "create", "Second", "--id", "T-2", ...actor, "--json"]);

    // A pre-QCLI-137 record: valid, but carrying no timestamps at all. Written
    // directly because no supported command can produce one any more.
    const files = await readdir(join(store, ".quest", "tasks"));
    const seed = files.find((name) => name.startsWith("T-1"));
    expect(seed).toBeDefined();
    const raw = JSON.parse(
      await readFile(join(store, ".quest", "tasks", seed as string), "utf8"),
    ) as Record<string, unknown>;
    const legacy: Record<string, unknown> = {
      ...raw,
      id: "T-3",
      title: "Legacy",
      aliases: [],
    };
    delete legacy.createdAt;
    delete legacy.updatedAt;
    await writeFile(
      join(store, ".quest", "tasks", "T-3.json"),
      `${JSON.stringify(legacy, null, 2)}\n`,
    );

    // T-1 and T-2 are created microseconds apart and can share a millisecond,
    // which would make the ordering depend on the id tie-break rather than on
    // the timestamps under test. Backdate T-1 so the two are unambiguous.
    await writeFile(
      join(store, ".quest", "tasks", seed as string),
      `${JSON.stringify(
        {
          ...raw,
          createdAt: "2020-01-01T00:00:00.000Z",
          updatedAt: "2020-01-01T00:00:00.000Z",
        },
        null,
        2,
      )}\n`,
    );

    const ascending = await run([
      "task",
      "list",
      "--sort",
      "createdAt:asc",
      "--json",
    ]);
    expect(ascending.exitCode).toBe(0);
    // Absent is "unknown", not "oldest": T-3 sorts after both stamped rows.
    expect(rows(ascending).map((task) => task.id)).toEqual([
      "T-1",
      "T-2",
      "T-3",
    ]);

    const descending = await run([
      "task",
      "list",
      "--sort",
      "createdAt:desc",
      "--json",
    ]);
    // Descending mirrors it exactly: unknown first, then newest to oldest.
    expect(rows(descending).map((task) => task.id)).toEqual([
      "T-3",
      "T-2",
      "T-1",
    ]);

    const byUpdated = await run([
      "task",
      "list",
      "--sort",
      "updatedAt:asc",
      "--json",
    ]);
    expect(byUpdated.exitCode).toBe(0);
    expect(rows(byUpdated).map((task) => task.id)).toEqual([
      "T-1",
      "T-2",
      "T-3",
    ]);
  });
});

test("a promoted draft is born stamped, not looking like a legacy record", async () => {
  await withStore(async (run) => {
    const draft = await run([
      "draft",
      "create",
      "Promoted",
      ...actor,
      "--json",
    ]);
    expect(draft.exitCode).toBe(0);
    const promoted = await run([
      "draft",
      "promote",
      "D-1",
      "--task-id",
      "T-9",
      ...actor,
      "--json",
    ]);
    expect(promoted.exitCode).toBe(0);

    const viewed = await run(["task", "view", "T-9", "--json"]);
    expect(viewed.exitCode).toBe(0);
    const createdAt = data(viewed).createdAt as string;
    // Without this, a brand-new task would sort last under --sort createdAt as
    // though it predated timestamps entirely.
    expect(typeof createdAt).toBe("string");
    expect(createdAt).toBe(new Date(createdAt).toISOString());
    expect(data(viewed).updatedAt).toBe(createdAt);
  });
});

test("createdAt is immutable through the public edit surface", async () => {
  await withStore(async (run) => {
    const created = await run(["task", "create", "Fixed", ...actor, "--json"]);
    const createdAt = data(created).createdAt as string;

    // Nothing in the CLI edit vocabulary can reach createdAt, and a status
    // change must not disturb it.
    const edited = await run([
      "task",
      "edit",
      "T-1",
      "--status",
      "In Progress",
      ...actor,
      "--json",
    ]);
    expect(edited.exitCode).toBe(0);
    expect(data(edited).createdAt).toBe(createdAt);
  });
});
