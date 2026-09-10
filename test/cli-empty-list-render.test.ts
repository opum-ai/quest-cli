import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runQuest } from "../src/cli/main.ts";
import { renderHumanPayload } from "../src/cli/render.ts";

test("the generic human renderer emits intentional output for empty collections", () => {
  expect(renderHumanPayload([])).toBe("(empty)\n");
  expect(renderHumanPayload({ tasks: [] })).toContain("(empty)");
  // Empty objects keep their established deterministic rendering.
  expect(renderHumanPayload({})).toBe("{}\n");
});

test("an empty task list renders human output in every mode without changing JSON", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-empty-list-"));
  const previousStore = process.env.QUEST_TASK_STORE;
  try {
    await Bun.spawn(["git", "init", "--quiet", store], {
      stdout: "ignore",
      stderr: "ignore",
    }).exited;
    process.env.QUEST_TASK_STORE = store;

    // The harness drives `task list` against an uninitialized-but-empty
    // store in this scenario; no explicit init is required for reads.

    const json = await runQuest(["task", "list", "--json"], false);
    expect(json.exitCode).toBe(0);
    expect(JSON.parse(json.stdout)).toMatchObject({
      schemaVersion: 1,
      kind: "task.list",
      data: [],
    });

    const plain = await runQuest(["task", "list", "--plain"], false);
    expect(plain.exitCode).toBe(0);
    expect(plain.stderr).toBe("");
    expect(plain.stdout).not.toBe("[]\n");
    expect(() => JSON.parse(plain.stdout)).toThrow();
    expect(plain.stdout).toContain("(empty)");
    expect(plain.stdout.includes(String.fromCharCode(27))).toBe(false);

    // Non-TTY default auto-selects plain with no flag.
    expect(await runQuest(["task", "list"], false)).toEqual(plain);

    // TTY stdout selects pretty mode and stays human-readable.
    const pretty = await runQuest(["task", "list"], true);
    expect(pretty.exitCode).toBe(0);
    expect(pretty.stdout).not.toBe("[]\n");
    expect(pretty.stdout).toContain("(empty)");
  } finally {
    if (previousStore === undefined) delete process.env.QUEST_TASK_STORE;
    else process.env.QUEST_TASK_STORE = previousStore;
    await rm(store, { recursive: true, force: true });
  }
});
