import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { questGuides } from "../src/application/agents/guides.ts";
import { commandHelp } from "../src/application/command-help.ts";
import { runQuest } from "../src/cli/main.ts";

/**
 * QCLI-315. `quest instructions task-execution` said "Checkbox edits are
 * index-addressed" while `quest help task edit` said, at length, that the
 * flags take the 1-based `position` and that "`index` is not what these
 * flags take". Two documentation surfaces of the same CLI contradicted each
 * other, and the wrong one is the surface the agent protocol sends a caller
 * to first.
 *
 * WHY THE EXISTING GATE DID NOT CATCH IT. QCLI-148's guide test runs every
 * command a guide shows, and `--check-ac 2` runs fine -- only the word
 * describing it was wrong. A command that EXECUTES and a sentence that
 * DESCRIBES it correctly are different objects, and only the first was under
 * test. That is the whole defect class: the gate was real, it measured a
 * real thing, and the thing it measured was not the claim.
 *
 * AND IT IS A RESIDUAL OF A FIX, WHICH IS WHY THE GATE ITERATES EVERY GUIDE
 * RATHER THAN NAMING ONE. QCLI-269 fixed exactly this defect two days
 * earlier: it added the 1-based `position` field to every checklist entry,
 * corrected `command-help.ts`, and corrected the guide prose -- in
 * `task-creation`. `task-execution` says the same thing about the same flags
 * and was left saying "index-addressed". A fix applied at the sites where a
 * defect was reported is the easiest kind to under-apply, and a gate naming
 * the one surface that was missed would repeat the mistake the moment a
 * fourth surface appears.
 *
 * Reported by opum-doc, who found it by counting `checked: true` against the
 * criterion count before closing a task. Their loop over `0..4` -- the
 * natural loop when the field is called an index and the record prints a
 * 0-based `index` beside the position -- produced one error and four silent
 * successes that checked the wrong four items, leaving the LAST criterion
 * unchecked under a final summary claiming all of them met.
 *
 * So this test ties the prose to measured behaviour rather than asserting a
 * wording. The wording assertions below are the cheap half; the measurement
 * is what makes them mean anything.
 */
test("the guide's checklist-addressing prose matches what the flag actually does", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-guide-prose-"));
  const previous = process.env.QUEST_TASK_STORE;
  process.env.QUEST_TASK_STORE = store;
  try {
    await runQuest(
      [
        "task",
        "create",
        "Addressing probe",
        "--acceptance-criteria",
        '["first","second"]',
        "--actor",
        "seed",
        "--actor-kind",
        "human",
        "--json",
      ],
      false,
    );

    // MEASURED: 1 addresses the FIRST item, whose `index` is 0. If the flag
    // were index-addressed as the guide used to say, this would check the
    // second.
    const checked = await runQuest(
      [
        "task",
        "edit",
        "T-1",
        "--check-ac",
        "1",
        "--actor",
        "seed",
        "--actor-kind",
        "human",
        "--json",
      ],
      false,
    );
    expect(checked.exitCode).toBe(0);

    const view = JSON.parse(
      (await runQuest(["task", "view", "T-1", "--json"], false)).stdout,
    );
    const criteria = view.data.acceptanceCriteria;
    expect(criteria[0]).toMatchObject({ index: 0, position: 1, checked: true });
    expect(criteria[1]).toMatchObject({
      index: 1,
      position: 2,
      checked: false,
    });

    // MEASURED: the 0-based spelling of the same item is refused, and the
    // refusal names the base rather than merely rejecting the number. This is
    // the one signal opum-doc's loop did get, and it is worth keeping: a bare
    // "not found" would have read as a single bad call.
    const zero = await runQuest(
      [
        "task",
        "edit",
        "T-1",
        "--check-ac",
        "0",
        "--actor",
        "seed",
        "--actor-kind",
        "human",
        "--json",
      ],
      false,
    );
    expect(zero.exitCode).toBe(2);
    expect(zero.stderr).toContain("1-based");

    // The prose, now that the behaviour above is established. A guide that
    // calls this "index-addressed" is describing the flag that was refused.
    //
    // EVERY guide, not the one that was wrong. Naming `task-execution` here
    // would be the same under-application that produced this defect.
    expect(questGuides.length).toBeGreaterThan(0);
    for (const guide of questGuides)
      expect(`${guide.name}: ${guide.content}`).not.toContain(
        "index-addressed",
      );

    // A guide that merely SHOWS `--check-ac 1` in a recipe makes no claim
    // about addressing and is not required to explain it. One that talks
    // about addressing must get it right -- that is the claim under test.
    const explainers = questGuides.filter(
      (guide) =>
        guide.content.includes("--check-ac") &&
        guide.content.includes("address"),
    );
    expect(explainers.length).toBeGreaterThanOrEqual(2);
    for (const guide of explainers) {
      expect(`${guide.name}: ${guide.content}`).toContain("1-based");
      expect(`${guide.name}: ${guide.content}`).toContain("position");
    }

    // And the two surfaces must not disagree: `help task edit` already said
    // this correctly while the guide did not, which is what made the wrong
    // choice look reasonable at the call site.
    const help = JSON.stringify(commandHelp);
    expect(help).toContain("1-based");
    expect(help).toContain("position");
  } finally {
    if (previous === undefined) delete process.env.QUEST_TASK_STORE;
    else process.env.QUEST_TASK_STORE = previous;
    await rm(store, { recursive: true, force: true });
  }
});
