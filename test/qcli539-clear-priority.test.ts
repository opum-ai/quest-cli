import { afterAll, expect, test } from "bun:test";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCommand } from "./helpers/spawn.ts";

/**
 * QCLI-539: `quest task edit --priority ""` must CLEAR the priority, not store
 * an empty string. resolveVocabularyValue has always documented an empty value
 * as the clear; the edit fold wrote it verbatim, leaving `"priority":""` (a key
 * outside every configured set) and no way back through quest.
 */

const MAIN = new URL("../src/cli/main.ts", import.meta.url).pathname;
const ACTOR = ["--actor", "person-1", "--actor-kind", "human"] as const;
const roots: string[] = [];

afterAll(async () => {
  for (const root of roots) await rm(root, { recursive: true, force: true });
});

function quest(cwd: string, args: readonly string[]) {
  return runCommand([process.execPath, MAIN, ...args], { cwd });
}

// realpath'd because macOS tmpdir() sits behind the /var symlink (QCLI-404).
async function workspace(): Promise<string> {
  const root = await realpath(await mkdtemp(join(tmpdir(), "qcli539-")));
  roots.push(root);
  await Bun.spawn(["git", "init", "-q"], { cwd: root }).exited;
  // Positive control: every case below depends on init having run.
  expect(quest(root, ["init", "--json"]).exitCode).toBe(0);
  return root;
}

const edit = (root: string, ...args: string[]) =>
  quest(root, ["task", "edit", "T-1", ...args, ...ACTOR, "--json"]);

async function stored(root: string): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(join(root, ".quest", "tasks", "T-1.json"), "utf8"),
  );
}

test("AC1 AC3: set-then-clear round trip leaves no priority key and views as null", async () => {
  const root = await workspace();
  expect(
    quest(root, ["task", "create", "a", ...ACTOR, "--json"]).exitCode,
  ).toBe(0);
  expect(edit(root, "--priority", "high").exitCode).toBe(0);
  // Control: the set really landed, so the clear below is observed, not assumed.
  expect((await stored(root)).priority).toBe("high");

  const cleared = edit(root, "--priority", "");
  expect(cleared.exitCode).toBe(0);
  expect(await stored(root)).not.toHaveProperty("priority");
  // View omits an absent key, and --fields projects it as null (never a
  // dropped key). Assert both, so absent and null cannot be confused.
  const view = quest(root, ["task", "view", "T-1", "--json"]);
  expect(JSON.parse(view.stdout).data).not.toHaveProperty("priority");
  const projected = quest(root, [
    "task",
    "view",
    "T-1",
    "--fields",
    "id,priority",
    "--json",
  ]);
  expect(JSON.parse(projected.stdout).data.priority).toBeNull();
});

test("AC2 AC3: an empty priority is treated as the clear on a task that never had one", async () => {
  const root = await workspace();
  expect(
    quest(root, ["task", "create", "a", ...ACTOR, "--json"]).exitCode,
  ).toBe(0);
  expect(await stored(root)).not.toHaveProperty("priority");
  expect(edit(root, "--priority", "").exitCode).toBe(0);
  expect(await stored(root)).not.toHaveProperty("priority");
});

test("a non-empty out-of-set priority is still refused and the clear does not weaken the check", async () => {
  const root = await workspace();
  expect(
    quest(root, [
      "task",
      "create",
      "a",
      "--priority",
      "low",
      ...ACTOR,
      "--json",
    ]).exitCode,
  ).toBe(0);
  expect(edit(root, "--priority", "urgent").exitCode).toBe(6);
  expect((await stored(root)).priority).toBe("low");
});

test("task edit-batch clears an empty priority the same way, because it shares the fold", async () => {
  const root = await workspace();
  expect(
    quest(root, [
      "task",
      "create",
      "a",
      "--priority",
      "high",
      ...ACTOR,
      "--json",
    ]).exitCode,
  ).toBe(0);
  expect((await stored(root)).priority).toBe("high");
  const operations = join(root, "ops.jsonl");
  await writeFile(
    operations,
    JSON.stringify({
      reference: "T-1",
      operationId: "o1",
      patch: { priority: "" },
    }),
  );
  const result = quest(root, [
    "task",
    "edit-batch",
    "--file",
    operations,
    ...ACTOR,
    "--json",
  ]);
  expect(result.exitCode).toBe(0);
  expect(await stored(root)).not.toHaveProperty("priority");
});
