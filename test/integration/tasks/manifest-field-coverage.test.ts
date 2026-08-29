import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { commandManifest } from "../../../src/application/command-contract.ts";
import { runQuest } from "../../../src/cli/main.ts";

/**
 * QCLI-137 AC#4, generalized past its own defect.
 *
 * The manifest is a public contract: a consumer reads `fields` and provisions
 * for every name in it. QCLI-133 and QCLI-137 were both instances of the same
 * class — the manifest declared a task field the CLI never emitted, and only a
 * human comparing two outputs by hand noticed. This test is the machine that
 * notices instead. It creates one task with EVERY settable field populated, so
 * no declared field can be absent for the innocent reason that it was simply
 * never set, then asserts that each task-shaped command emits every field its
 * own manifest entry declares.
 *
 * If this fails, the fix is one of two things and never a third: emit the
 * field, or stop declaring it.
 */

const actor = ["--actor", "person-1", "--actor-kind", "human"];

async function withStore(
  body: (
    run: (argv: readonly string[]) => Promise<{
      exitCode: number;
      stdout: string;
      stderr: string;
    }>,
  ) => Promise<void>,
): Promise<void> {
  const store = await mkdtemp(join(tmpdir(), "quest-manifest-fields-"));
  const previous = process.env.QUEST_TASK_STORE;
  process.env.QUEST_TASK_STORE = store;
  try {
    await body((argv) => runQuest(argv, false));
  } finally {
    if (previous === undefined) delete process.env.QUEST_TASK_STORE;
    else process.env.QUEST_TASK_STORE = previous;
    await rm(store, { recursive: true, force: true });
  }
}

function declaredFields(name: string): readonly string[] {
  const entry = commandManifest.commands.find(
    (command) => command.name === name,
  );
  if (!entry) throw new Error(`manifest has no entry for ${name}`);
  const fields = entry.fields;
  if (!fields?.length)
    throw new Error(`manifest entry ${name} declares no fields`);
  return fields;
}

/** Every field the manifest declares must be a key of the emitted record. */
function expectDeclaredFieldsPresent(
  commandName: string,
  record: Record<string, unknown>,
): void {
  const missing = declaredFields(commandName).filter(
    (field) => !(field in record),
  );
  expect({ command: commandName, missing }).toEqual({
    command: commandName,
    missing: [],
  });
}

test("every task field the manifest declares is actually emitted (QCLI-137 AC#4)", async () => {
  await withStore(async (run) => {
    // A dependency target and a milestone must exist before the fully
    // populated task can point at them, or the declared parentId,
    // dependencies and milestoneId fields would be absent for a reason
    // unrelated to the contract under test.
    const base = await run([
      "task",
      "create",
      "Base",
      "--id",
      "T-1",
      ...actor,
      "--json",
    ]);
    expect(base.exitCode).toBe(0);
    const milestone = await run([
      "milestone",
      "create",
      "Sprint One",
      "--id",
      "M-1",
      ...actor,
      "--json",
    ]);
    expect(milestone.exitCode).toBe(0);

    const created = await run([
      "task",
      "create",
      "Fully populated task",
      "--id",
      "T-2",
      "--summary",
      "summary",
      "--description",
      "description",
      "--priority",
      "high",
      "--type",
      "feature",
      "--ordinal",
      "7",
      "--alias",
      "FULL",
      "--label",
      "label-a",
      "--doc",
      "docs/story.md",
      "--acceptance-criteria",
      '["works"]',
      "--definition-of-done",
      '["shipped"]',
      "--plan",
      '["step one"]',
      "--implementation-notes",
      '["note one"]',
      "--comments",
      '[{"id":"c-1","authorId":"person-1","body":"comment","createdAt":"2026-01-01T00:00:00.000Z"}]',
      "--assignee",
      "person-2",
      "--reference",
      "src/thing.ts",
      "--modified-file",
      "src/thing.ts",
      "--dependency",
      "T-1",
      "--parent",
      "T-1",
      "--milestone",
      "M-1",
      "--final-summary",
      "wrapped",
      ...actor,
      "--json",
    ]);
    if (created.exitCode !== 0) console.error(created.stderr);
    expect(created.exitCode).toBe(0);
    const createdData = (
      JSON.parse(created.stdout) as { data: Record<string, unknown> }
    ).data;
    expectDeclaredFieldsPresent("task create", createdData);

    const viewed = await run(["task", "view", "T-2", "--json"]);
    expect(viewed.exitCode).toBe(0);
    expectDeclaredFieldsPresent(
      "task view",
      (JSON.parse(viewed.stdout) as { data: Record<string, unknown> }).data,
    );

    const listed = await run(["task", "list", "--json"]);
    expect(listed.exitCode).toBe(0);
    const rows = (
      JSON.parse(listed.stdout) as { data: Record<string, unknown>[] }
    ).data;
    const listedRow = rows.find((row) => row.id === "T-2");
    expect(listedRow).toBeDefined();
    expectDeclaredFieldsPresent(
      "task list",
      listedRow as Record<string, unknown>,
    );

    const searched = await run(["search", "populated", "--json"]);
    expect(searched.exitCode).toBe(0);
    const hits = (
      JSON.parse(searched.stdout) as { data: Record<string, unknown>[] }
    ).data;
    const searchedRow = hits.find((row) => row.id === "T-2");
    expect(searchedRow).toBeDefined();
    expectDeclaredFieldsPresent(
      "search",
      searchedRow as Record<string, unknown>,
    );
  });
});
