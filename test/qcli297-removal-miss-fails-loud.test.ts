import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { commandHelp } from "../src/application/command-help.ts";
import { runQuest } from "../src/cli/main.ts";

/**
 * QCLI-297. Quest shipped TWO removal vocabularies with OPPOSITE behaviour on
 * a miss, in the same command:
 *
 * - ORDINAL-ADDRESSED (`--remove-ac`/`--check-ac`/`--uncheck-ac` and the
 *   `--*-dod` equivalents) threw `check_index_out_of_range` on a position
 *   outside the list -- exit 6, loud.
 * - TEXT- AND ID-ADDRESSED (eight `task edit` flags, plus `milestone edit
 *   --remove-task` through an entirely separate code path) filtered by exact
 *   equality and discarded a non-matching value silently -- exit 0,
 *   `kind=task.updated`, an unchanged list. An unremoved entry looked exactly
 *   like a removed one.
 *
 * Reported by opum-cli-e2e (via opum-agent) as one flag and one ordinal;
 * reproducing it here found eight, then nine across two commands. Both
 * downstream consumers -- opum-cli-e2e and lore-cli -- independently ruled for
 * the loud form, lore-cli against its own convenience: a silent no-op on the
 * only path they can reach (a read-then-remove race) is WORSE for them,
 * because lore would then report "removed" for an edit that removed nothing,
 * propagating the defect into their report rather than stopping at Quest's
 * boundary.
 *
 * WHY THE PAYLOAD COULD NOT HAVE CARRIED THIS INSTEAD, which is the argument
 * that decided the shape and is easy to lose: the natural defensive check on
 * the returned record -- "is the value I asked to remove absent from it?" --
 * returns TRUE on the whitespace case. It confirms the failure AS a success,
 * because a value that differs by a trailing space was never in the list under
 * any outcome. A defect that defeats the diligent caller and the careless one
 * identically is worse than one that only catches the careless.
 *
 * Hence `the miss is visible in the message`: the value is JSON-delimited, so
 * a trailing space is inside the quotes and a tab renders as `\t`.
 */

async function withStore<T>(run: () => Promise<T>): Promise<T> {
  const store = await mkdtemp(join(tmpdir(), "quest-removal-miss-"));
  const previous = process.env.QUEST_TASK_STORE;
  process.env.QUEST_TASK_STORE = store;
  try {
    return await run();
  } finally {
    if (previous === undefined) delete process.env.QUEST_TASK_STORE;
    else process.env.QUEST_TASK_STORE = previous;
    await rm(store, { recursive: true, force: true });
  }
}

const ACTOR = ["--actor", "seed", "--actor-kind", "human", "--json"] as const;

const quest = (...arguments_: readonly string[]) =>
  runQuest([...arguments_, ...ACTOR], false);

async function seed() {
  await quest("task", "create", "Removal probe");
  await quest("task", "create", "Dependency target");
  await quest(
    "task",
    "edit",
    "T-1",
    "--add-note",
    "note alpha",
    "--add-note",
    "note beta",
    "--add-plan",
    "plan one",
    "--add-label",
    "lab1",
    "--add-assignee",
    "someone",
    "--add-reference",
    "REF-1",
    "--add-modified-file",
    "f.ts",
    "--add-dependency",
    "T-2",
  );
}

async function task() {
  return JSON.parse(
    (await runQuest(["task", "view", "T-1", "--json"], false)).stdout,
  ).data as Record<string, unknown>;
}

/** Every by-value removal flag `task edit` accepts, with a seeded list behind
 * it. Enumerated rather than spot-checked because the whole finding was that
 * the reported flag was one of eight sharing one helper -- a test that covers
 * only `--remove-note` would have passed against the original defect for the
 * other seven. */
const BY_VALUE_FLAGS = [
  "--remove-note",
  "--remove-plan",
  "--remove-label",
  "--remove-assignee",
  "--remove-reference",
  "--remove-modified-file",
  "--remove-dependency",
  "--remove-comment",
] as const;

test("every by-value task edit removal fails loud on a value matching nothing, and changes nothing", async () => {
  await withStore(async () => {
    await seed();
    const before = JSON.stringify(await task());

    for (const flag of BY_VALUE_FLAGS) {
      const result = await quest("task", "edit", "T-1", flag, "NO-SUCH");
      expect({ flag, exitCode: result.exitCode }).toEqual({
        flag,
        exitCode: 6,
      });
      const error = JSON.parse(result.stderr) as {
        error_type: string;
        message: string;
      };
      expect({ flag, type: error.error_type }).toEqual({
        flag,
        type: "validation",
      });
      // Both halves of AC3 in one assertion per flag: the record id so a
      // single error line lifted into a multi-record report is
      // self-contained, and the delimited value so the miss is legible.
      expect(error.message).toContain("T-1");
      expect(error.message).toContain(flag);
      expect(error.message).toContain('"NO-SUCH"');
    }

    // Refused means refused: nothing in the record moved, for any of them.
    expect(JSON.stringify(await task())).toBe(before);
  });
});

test("the miss is visible in the message: a trailing space is inside the delimiters and a tab is escaped", async () => {
  await withStore(async () => {
    await seed();

    const trailing = await quest(
      "task",
      "edit",
      "T-1",
      "--remove-note",
      "note alpha ",
    );
    expect(trailing.exitCode).toBe(6);
    // The delimiters are what make this readable at all -- without them the
    // message renders as `no entry matches note alpha`, which is exactly the
    // stored value and reads as a tool defect rather than a caller typo.
    expect(JSON.parse(trailing.stderr).message).toContain('"note alpha "');

    const tabbed = await quest(
      "task",
      "edit",
      "T-1",
      "--remove-note",
      "note\talpha",
    );
    expect(tabbed.exitCode).toBe(6);
    expect(JSON.parse(tabbed.stderr).message).toContain('"note\\talpha"');

    // The whole point: the note is still there. The defensive check a careful
    // caller writes -- "is the value I passed absent from the record?" --
    // would have returned true for both of these while nothing was removed.
    expect((await task()).implementationNotes).toEqual([
      "note alpha",
      "note beta",
    ]);
  });
});

test("an exact match still removes, and structured input names the record, the flag and every unmatched value", async () => {
  await withStore(async () => {
    await seed();

    const hit = await quest(
      "task",
      "edit",
      "T-1",
      "--remove-note",
      "note beta",
    );
    expect(hit.exitCode).toBe(0);
    expect((await task()).implementationNotes).toEqual(["note alpha"]);

    // Several unmatched values in one flag are reported TOGETHER: failing on
    // the first would hand the caller one miss per round trip.
    const several = await quest(
      "task",
      "edit",
      "T-1",
      "--remove-label",
      "X",
      "--remove-label",
      "Y",
    );
    expect(several.exitCode).toBe(6);
    const error = JSON.parse(several.stderr) as {
      message: string;
      input: { record: string; flag: string; unmatched: string[] };
    };
    expect(error.message).toContain('"X", "Y"');
    expect(error.input).toEqual({
      record: "T-1",
      flag: "--remove-label",
      unmatched: ["X", "Y"],
    });
  });
});

test("a partially-matching removal removes NOTHING, not just the part that matched", async () => {
  await withStore(async () => {
    await seed();

    const partial = await quest(
      "task",
      "edit",
      "T-1",
      "--remove-note",
      "note alpha",
      "--remove-note",
      "NO-SUCH",
    );
    expect(partial.exitCode).toBe(6);
    // Only the value that missed is named -- the caller is told what was
    // wrong with their input, not handed back the part that was fine.
    expect(JSON.parse(partial.stderr).message).toContain('"NO-SUCH"');
    expect(JSON.parse(partial.stderr).message).not.toContain('"note alpha"');

    // An all-or-nothing refusal is what makes the exit code mean something:
    // a partial apply at exit 6 would leave the caller unable to tell which
    // half happened without the round trip the envelope exists to save.
    expect((await task()).implementationNotes).toEqual([
      "note alpha",
      "note beta",
    ]);
  });
});

test("the ordinal-addressed family is untouched: out of range still fails loud, in range still removes", async () => {
  await withStore(async () => {
    await quest(
      "task",
      "create",
      "Checklist probe",
      "--acceptance-criteria",
      '["ac one","ac two"]',
    );

    const outOfRange = await quest("task", "edit", "T-1", "--remove-ac", "9");
    expect(outOfRange.exitCode).toBe(6);
    // Its own message, not the by-value one: two ways of addressing the same
    // vocabulary, each diagnosing in its own terms.
    expect(JSON.parse(outOfRange.stderr).message).toBe(
      "A checklist position does not exist on this task.",
    );

    expect(
      (await quest("task", "edit", "T-1", "--remove-ac", "1")).exitCode,
    ).toBe(0);
    const criteria = (await task()).acceptanceCriteria as { text: string }[];
    expect(criteria.map((item) => item.text)).toEqual(["ac two"]);
  });
});

test("milestone edit --remove-task obeys the same rule through its own code path", async () => {
  await withStore(async () => {
    await quest("task", "create", "Linked");
    await quest("milestone", "create", "A milestone", "--task", "T-1");

    // This does NOT reach foldEditPatch's mergeList -- it has its own merge in
    // the CLI. Fixing edit-patch.ts alone leaves this silently broken with the
    // whole suite green, which is why the milestone half is asserted here
    // rather than assumed from the task half.
    const missing = await quest(
      "milestone",
      "edit",
      "M-1",
      "--remove-task",
      "NO-SUCH",
    );
    expect(missing.exitCode).toBe(6);
    const error = JSON.parse(missing.stderr) as {
      error_type: string;
      message: string;
    };
    expect(error.error_type).toBe("validation");
    expect(error.message).toContain("M-1");
    expect(error.message).toContain("--remove-task");
    expect(error.message).toContain('"NO-SUCH"');

    const spaced = await quest(
      "milestone",
      "edit",
      "M-1",
      "--remove-task",
      " T-1",
    );
    expect(spaced.exitCode).toBe(6);
    expect(JSON.parse(spaced.stderr).message).toContain('" T-1"');

    const milestone = JSON.parse(
      (await runQuest(["milestone", "view", "M-1", "--json"], false)).stdout,
    ).data as { taskIds?: string[] };
    expect(milestone.taskIds ?? []).toEqual(["T-1"]);

    expect(
      (await quest("milestone", "edit", "M-1", "--remove-task", "T-1"))
        .exitCode,
    ).toBe(0);
  });
});

test("help states, for both commands, what a removal matches and what a miss does", async () => {
  const taskEdit = commandHelp["task edit"]?.summary ?? "";
  // AC4: the two families are described as ONE vocabulary addressed two ways,
  // not as two unrelated flag groups that happen to share a verb.
  expect(taskEdit).toContain("REMOVAL IS ONE VOCABULARY ADDRESSED TWO WAYS");
  expect(taskEdit).toContain("1-based position");
  expect(taskEdit).toContain("EXACTLY");
  expect(taskEdit).toContain("leading and trailing whitespace");
  expect(taskEdit).toContain("exit-6 validation error");
  // --remove-comment matches an id, not text -- the one member of the
  // by-value family whose match target differs, so it is named separately.
  expect(taskEdit).toContain("--remove-comment matches a comment's `id`");
  for (const flag of BY_VALUE_FLAGS) expect(taskEdit).toContain(flag);

  const milestoneEdit = commandHelp["milestone edit"]?.summary ?? "";
  expect(milestoneEdit).toContain("--remove-task matches a linked task id");
  expect(milestoneEdit).toContain("EXACTLY");
  expect(milestoneEdit).toContain("exit-6 validation error");
});
