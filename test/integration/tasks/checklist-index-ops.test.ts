import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runQuest } from "../../../src/cli/main.ts";

const actor = ["--actor", "person-1", "--actor-kind", "human"];

type Run = (argv: readonly string[]) => Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}>;

async function withStore(body: (run: Run, store: string) => Promise<void>) {
  const store = await mkdtemp(join(tmpdir(), "quest-checklist-index-"));
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

function diagnostic(result: { stderr: string }): Record<string, unknown> {
  return JSON.parse(result.stderr) as Record<string, unknown>;
}

function item(text: string, checked: boolean, index: number) {
  return { index, text, checked };
}

async function seed(
  run: Run,
  criteria: readonly string[],
  dod: readonly string[] = [],
): Promise<string> {
  const created = await run([
    "task",
    "create",
    "Checklist task",
    "--acceptance-criteria",
    JSON.stringify(criteria),
    "--definition-of-done",
    JSON.stringify(dod),
    ...actor,
    "--json",
  ]);
  expect(created.exitCode).toBe(0);
  return data(created).id as string;
}

test("index-addressed check, uncheck, remove and clear apply to acceptance criteria", async () => {
  await withStore(async (run) => {
    const id = await seed(run, ["first", "second", "third"]);

    const checked = await run([
      "task",
      "edit",
      id,
      "--check-ac",
      "1",
      "--check-ac",
      "3",
      ...actor,
      "--json",
    ]);
    expect(checked.exitCode).toBe(0);
    expect(data(checked).acceptanceCriteria).toEqual([
      item("first", true, 0),
      item("second", false, 1),
      item("third", true, 2),
    ]);

    const unchecked = await run([
      "task",
      "edit",
      id,
      "--uncheck-ac",
      "3",
      ...actor,
      "--json",
    ]);
    expect(data(unchecked).acceptanceCriteria).toEqual([
      item("first", true, 0),
      item("second", false, 1),
      item("third", false, 2),
    ]);

    // Removing the middle entry re-indexes the survivors and preserves the
    // checkmark that was never addressed.
    const removed = await run([
      "task",
      "edit",
      id,
      "--remove-ac",
      "2",
      ...actor,
      "--json",
    ]);
    expect(data(removed).acceptanceCriteria).toEqual([
      item("first", true, 0),
      item("third", false, 1),
    ]);

    const cleared = await run([
      "task",
      "edit",
      id,
      "--clear-ac",
      ...actor,
      "--json",
    ]);
    expect(data(cleared).acceptanceCriteria).toEqual([]);
  });
});

test("the same operations address definition of done independently", async () => {
  await withStore(async (run) => {
    const id = await seed(run, ["ac one"], ["dod one", "dod two"]);

    const edited = await run([
      "task",
      "edit",
      id,
      "--check-dod",
      "2",
      ...actor,
      "--json",
    ]);
    expect(edited.exitCode).toBe(0);
    expect(data(edited).definitionOfDone).toEqual([
      item("dod one", false, 0),
      item("dod two", true, 1),
    ]);
    // The acceptance-criteria list is untouched by a definition-of-done edit.
    expect(data(edited).acceptanceCriteria).toEqual([item("ac one", false, 0)]);

    const cleared = await run([
      "task",
      "edit",
      id,
      "--clear-dod",
      ...actor,
      "--json",
    ]);
    expect(data(cleared).definitionOfDone).toEqual([]);
    expect(data(cleared).acceptanceCriteria).toEqual([
      item("ac one", false, 0),
    ]);
  });
});

test("two editors working from one stale read both keep their checkmarks", async () => {
  await withStore(async (run) => {
    const id = await seed(run, ["first", "second"]);

    // The read both editors share. Neither sees the other's write.
    const stale = data(await run(["task", "view", id, "--json"]))
      .acceptanceCriteria as {
      index: number;
      text: string;
      checked: boolean;
    }[];
    expect(stale).toEqual([item("first", false, 0), item("second", false, 1)]);

    const wholesale = (position: number) =>
      JSON.stringify(
        stale.map((entry, offset) =>
          offset === position ? { ...entry, checked: true } : entry,
        ),
      );

    // Wholesale replacement is read-modify-write: the second writer ships the
    // whole list it computed from the stale read, so the first check is gone.
    await run([
      "task",
      "edit",
      id,
      "--acceptance-criteria",
      wholesale(0),
      ...actor,
      "--json",
    ]);
    const lost = await run([
      "task",
      "edit",
      id,
      "--acceptance-criteria",
      wholesale(1),
      ...actor,
      "--json",
    ]);
    expect(data(lost).acceptanceCriteria).toEqual([
      item("first", false, 0),
      item("second", true, 1),
    ]);

    // Index-addressed edits carry only the position each editor touched, so
    // both survive even though both were computed from the same stale read.
    await run(["task", "edit", id, "--clear-ac", ...actor, "--json"]);
    await run([
      "task",
      "edit",
      id,
      "--acceptance-criteria",
      JSON.stringify(["first", "second"]),
      ...actor,
      "--json",
    ]);
    await run(["task", "edit", id, "--check-ac", "1", ...actor, "--json"]);
    const kept = await run([
      "task",
      "edit",
      id,
      "--check-ac",
      "2",
      ...actor,
      "--json",
    ]);
    expect(data(kept).acceptanceCriteria).toEqual([
      item("first", true, 0),
      item("second", true, 1),
    ]);
  });
});

test("wholesale acceptance-criteria and definition-of-done replacement is unchanged", async () => {
  await withStore(async (run) => {
    const id = await seed(run, ["original"], ["original dod"]);

    const replaced = await run([
      "task",
      "edit",
      id,
      "--acceptance-criteria",
      '[{"index":0,"text":"rewritten","checked":true}]',
      "--definition-of-done",
      '["plain"]',
      ...actor,
      "--json",
    ]);
    expect(replaced.exitCode).toBe(0);
    expect(data(replaced).acceptanceCriteria).toEqual([
      item("rewritten", true, 0),
    ]);
    expect(data(replaced).definitionOfDone).toEqual([item("plain", false, 0)]);

    // An authored index that does not match its position is still rejected by
    // the domain rather than silently renumbered.
    const misindexed = await run([
      "task",
      "edit",
      id,
      "--acceptance-criteria",
      '[{"index":3,"text":"wrong slot","checked":false}]',
      ...actor,
      "--json",
    ]);
    expect(misindexed.exitCode).toBe(6);
    expect(diagnostic(misindexed)).toMatchObject({
      error_type: "validation",
      message: "check_item_index_mismatch",
    });
  });
});

test("index operations reject out-of-range positions, bad values, and conflicting requests", async () => {
  await withStore(async (run) => {
    const id = await seed(run, ["only"]);

    const outOfRange = await run([
      "task",
      "edit",
      id,
      "--check-ac",
      "2",
      ...actor,
      "--json",
    ]);
    expect(outOfRange.exitCode).toBe(6);
    expect(diagnostic(outOfRange)).toMatchObject({
      error_type: "validation",
      message: "check_index_out_of_range",
    });

    for (const bad of ["0", "-1", "two", "1.5"]) {
      const rejected = await run([
        "task",
        "edit",
        id,
        `--check-ac=${bad}`,
        ...actor,
        "--json",
      ]);
      expect(rejected.exitCode).toBe(2);
      expect(diagnostic(rejected)).toMatchObject({ error_type: "usage" });
    }

    const bothWays = await run([
      "task",
      "edit",
      id,
      "--check-ac",
      "1",
      "--uncheck-ac",
      "1",
      ...actor,
      "--json",
    ]);
    expect(bothWays.exitCode).toBe(6);
    expect(diagnostic(bothWays)).toMatchObject({
      message: "check_index_conflict",
    });

    const mixed = await run([
      "task",
      "edit",
      id,
      "--check-ac",
      "1",
      "--acceptance-criteria",
      '["replacement"]',
      ...actor,
      "--json",
    ]);
    expect(mixed.exitCode).toBe(6);
    expect(diagnostic(mixed)).toMatchObject({
      message: "check_operation_conflict",
    });

    const clearAndCheck = await run([
      "task",
      "edit",
      id,
      "--clear-ac",
      "--check-ac",
      "1",
      ...actor,
      "--json",
    ]);
    expect(clearAndCheck.exitCode).toBe(6);
    expect(diagnostic(clearAndCheck)).toMatchObject({
      message: "check_operation_conflict",
    });

    // The task survived every rejection untouched.
    expect(
      data(await run(["task", "view", id, "--json"])).acceptanceCriteria,
    ).toEqual([item("only", false, 0)]);
  });
});

test("edit-batch applies the same index operations through the shared fold", async () => {
  await withStore(async (run, store) => {
    const first = await seed(run, ["a", "b", "c"]);
    const second = await seed(run, ["x"], ["y", "z"]);
    const operations = join(store, "operations.jsonl");

    await writeFile(
      operations,
      [
        JSON.stringify({
          reference: first,
          operationId: "op-1",
          patch: {
            checkAcceptanceCriteria: [1],
            removeAcceptanceCriteria: [2],
          },
        }),
        JSON.stringify({
          reference: second,
          operationId: "op-2",
          patch: { checkDefinitionOfDone: [2], clearAcceptanceCriteria: true },
        }),
      ].join("\n"),
    );

    const batch = await run([
      "task",
      "edit-batch",
      "--file",
      operations,
      ...actor,
      "--json",
    ]);
    expect(batch.exitCode).toBe(0);

    expect(
      data(await run(["task", "view", first, "--json"])).acceptanceCriteria,
    ).toEqual([item("a", true, 0), item("c", false, 1)]);
    const secondView = data(await run(["task", "view", second, "--json"]));
    expect(secondView.acceptanceCriteria).toEqual([]);
    expect(secondView.definitionOfDone).toEqual([
      item("y", false, 0),
      item("z", true, 1),
    ]);
  });
});

test("edit-batch rejects malformed index positions before any mutation", async () => {
  await withStore(async (run, store) => {
    const id = await seed(run, ["a"]);
    const operations = join(store, "bad.jsonl");
    await writeFile(
      operations,
      JSON.stringify({
        reference: id,
        operationId: "op-1",
        patch: { checkAcceptanceCriteria: ["1"] },
      }),
    );

    const batch = await run([
      "task",
      "edit-batch",
      "--file",
      operations,
      ...actor,
      "--json",
    ]);
    expect(batch.exitCode).toBe(2);
    expect(diagnostic(batch)).toMatchObject({ error_type: "usage" });
    expect(diagnostic(batch).message as string).toContain(
      "checkAcceptanceCriteria",
    );

    expect(
      data(await run(["task", "view", id, "--json"])).acceptanceCriteria,
    ).toEqual([item("a", false, 0)]);
  });
});
