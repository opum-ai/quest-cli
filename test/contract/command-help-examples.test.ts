import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runQuest } from "../../src/cli/main.ts";

const actor = ["--actor", "guide-runner", "--actor-kind", "human"];

/**
 * QCLI-226: `quest help task edit --json` documents the exact JSON shapes
 * `--comments`/`--add-comment` and `task edit-batch`'s JSONL records expect,
 * but prose describing a shape is not evidence the shape actually works.
 * These run the literal examples named in src/application/command-help.ts
 * against a real store, so a shape that drifts from the CLI fails here
 * rather than only being noticed by a caller who tried it.
 */

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
  const store = await mkdtemp(join(tmpdir(), "quest-help-examples-"));
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

test("the --add-comment JSON shape documented in help actually applies", async () => {
  await withStore(async (run) => {
    await run(["task", "create", "Commented", ...actor, "--json"]);
    const comment = {
      id: "C-1",
      authorId: "guide-runner",
      body: "matches the shape documented in `quest help task edit`",
      createdAt: "2026-09-07T00:00:00.000Z",
    };
    const edited = await run([
      "task",
      "edit",
      "T-1",
      "--add-comment",
      JSON.stringify([comment]),
      ...actor,
      "--json",
    ]);
    expect(edited.exitCode).toBe(0);
    const data = JSON.parse(edited.stdout).data;
    expect(data.comments).toEqual([comment]);
  });
});

test("the edit-batch JSONL patch shape documented in help actually applies", async () => {
  await withStore(async (run, store) => {
    await run(["task", "create", "Batched", ...actor, "--json"]);
    const file = join(store, "operations.jsonl");
    const record = {
      reference: "T-1",
      operationId: "op-1",
      patch: { status: "In Progress" },
    };
    await writeFile(file, `${JSON.stringify(record)}\n`);
    const result = await run([
      "task",
      "edit-batch",
      "--file",
      file,
      ...actor,
      "--json",
    ]);
    expect(result.exitCode).toBe(0);
    const envelope = JSON.parse(result.stdout);
    expect(envelope.data.applied).toBe(1);
    expect(envelope.data.items[0]).toMatchObject({
      kind: "updated",
      operationId: "op-1",
      task: { status: "In Progress" },
    });
  });
});
