import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { flagParameter } from "../src/application/command-parameters.ts";
import { commandHelp } from "../src/application/command-help.ts";
import { runQuest } from "../src/cli/main.ts";

/**
 * QCLI-313 / DEC-5. `quest task edit --acceptance-criteria '["a","b"]'` over a
 * list with boxes ticked silently unticked them: exit 0, empty stderr,
 * `kind=task.updated`. `--definition-of-done` did the same, measured, not
 * inferred. The lossless `{index,text,checked}` form existed and appeared
 * nowhere in the CLI's output except the usage error for an object array
 * missing `index`, while `quest manifest --json` advertised only `json-array`.
 *
 * Three independent agent callers reached for the string form within hours on
 * 2026-09-15 -- this repository's session, opum-agent, and opum-cli-e2e -- none
 * knowing the object form existed, all three having read the manifest. Zero
 * actual losses, all three by the same accident: the criteria happened to be
 * unchecked. One caller reaching for the destructive path is a caller mistake;
 * three is the DISCOVERABLE path being the destructive one.
 *
 * THE RULE UNDER TEST is about what the replacement CARRIES, not about the
 * outcome: a currently-checked position replaced by a BARE STRING is refused,
 * because a bare string says nothing about the box. An entry that says
 * `checked: false` has stated its intent and is honoured.
 *
 * That distinction is the whole escape hatch, and the first implementation got
 * it wrong in a way that read as obviously correct -- it refused whenever a
 * ticked box ended up unticked, which also refuses the deliberate reset and
 * leaves no way to express one. It was caught by RUNNING the deliberate-reset
 * case, not by re-reading the rule. Hence `a deliberate reset ... is honoured`
 * below: it is the regression test for the fix to the fix.
 */

async function withStore<T>(run: () => Promise<T>): Promise<T> {
  const store = await mkdtemp(join(tmpdir(), "quest-checklist-"));
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

/** Reads the record BACK, which is the only thing that proves a mutation. */
async function criteria(field: "acceptanceCriteria" | "definitionOfDone") {
  const view = JSON.parse(
    (await runQuest(["task", "view", "T-1", "--json"], false)).stdout,
  );
  return view.data[field] as { text: string; checked: boolean }[];
}

async function seed() {
  await quest(
    "task",
    "create",
    "Checklist probe",
    "--acceptance-criteria",
    '["one","two","three"]',
  );
  await quest("task", "edit", "T-1", "--check-ac", "1", "--check-ac", "3");
}

test("a string-array replacement over a checked list is REFUSED, and changes nothing", async () => {
  await withStore(async () => {
    await seed();
    const before = await criteria("acceptanceCriteria");
    expect(before.map((item) => item.checked)).toEqual([true, false, true]);

    const result = await quest(
      "task",
      "edit",
      "T-1",
      "--acceptance-criteria",
      '["one","two-amended","three"]',
    );

    // Exit 6 (validation), NOT 2 (usage): the command line is well-formed and
    // the conflict is with the record's current state -- the identical call
    // succeeds against a list with nothing ticked, which the test below
    // proves. A caller can tell the two apart by exit code alone.
    expect(result.exitCode).toBe(6);
    const error = JSON.parse(result.stderr);
    expect(error.error_type).toBe("validation");
    // The refusal has to name the shape that works, because the one moment
    // the caller is certainly reading is the moment they are refused.
    expect(error.hint).toContain("{");
    expect(error.hint).toContain("checked");
    expect(error.hint).toContain("--check-ac");

    // The point of the whole task: read the record back rather than trusting
    // the exit code. A refusal that still wrote would be the original defect
    // wearing a new message.
    const after = await criteria("acceptanceCriteria");
    expect(after).toEqual(before);
  });
});

test("an object-array replacement amends one entry and preserves every other checked state", async () => {
  await withStore(async () => {
    await seed();
    const result = await quest(
      "task",
      "edit",
      "T-1",
      "--acceptance-criteria",
      '[{"index":0,"text":"one","checked":true},' +
        '{"index":1,"text":"two-amended","checked":false},' +
        '{"index":2,"text":"three","checked":true}]',
    );
    expect(result.exitCode).toBe(0);

    const after = await criteria("acceptanceCriteria");
    expect(after.map((item) => item.text)).toEqual([
      "one",
      "two-amended",
      "three",
    ]);
    expect(after.map((item) => item.checked)).toEqual([true, false, true]);
  });
});

test("a deliberate reset with checked:false is honoured, not swept up by the refusal", async () => {
  await withStore(async () => {
    await seed();
    const result = await quest(
      "task",
      "edit",
      "T-1",
      "--acceptance-criteria",
      '[{"index":0,"text":"one","checked":false},' +
        '{"index":1,"text":"two","checked":false},' +
        '{"index":2,"text":"three","checked":false}]',
    );
    expect(result.exitCode).toBe(0);
    expect(
      (await criteria("acceptanceCriteria")).map((item) => item.checked),
    ).toEqual([false, false, false]);
  });
});

test("a string-array replacement is still accepted when nothing is checked", async () => {
  await withStore(async () => {
    await quest(
      "task",
      "create",
      "Checklist probe",
      "--acceptance-criteria",
      '["one","two","three"]',
    );
    // No loss is possible here, so there is nothing to refuse. This is the
    // half that keeps the change from breaking every existing caller -- and
    // it is exactly the state all three reported callers were in, which is
    // why none of them actually lost anything.
    const result = await quest(
      "task",
      "edit",
      "T-1",
      "--acceptance-criteria",
      '["one","two-amended","three"]',
    );
    expect(result.exitCode).toBe(0);
    const after = await criteria("acceptanceCriteria");
    expect(after.map((item) => item.text)).toEqual([
      "one",
      "two-amended",
      "three",
    ]);
  });
});

test("--definition-of-done is governed by the same rule, measured rather than assumed", async () => {
  await withStore(async () => {
    await quest("task", "create", "Checklist probe");
    await quest("task", "edit", "T-1", "--definition-of-done", '["d1","d2"]');
    await quest("task", "edit", "T-1", "--check-dod", "1");

    const refused = await quest(
      "task",
      "edit",
      "T-1",
      "--definition-of-done",
      '["d1","d2-amended"]',
    );
    expect(refused.exitCode).toBe(6);
    expect((await criteria("definitionOfDone")).map((item) => item.checked)) //
      .toEqual([true, false]);

    const accepted = await quest(
      "task",
      "edit",
      "T-1",
      "--definition-of-done",
      '[{"index":0,"text":"d1","checked":true},' +
        '{"index":1,"text":"d2-amended","checked":false}]',
    );
    expect(accepted.exitCode).toBe(0);
    const after = await criteria("definitionOfDone");
    expect(after.map((item) => item.text)).toEqual(["d1", "d2-amended"]);
    expect(after.map((item) => item.checked)).toEqual([true, false]);
  });
});

/**
 * The discoverability half. A refusal makes the trap visible at the moment it
 * fires; the manifest is what makes the right form findable BEFORE a caller
 * hits anything. Both, not either -- which is the correction opum-cli-e2e
 * made to an earlier framing that treated the manifest fix as sufficient.
 */
test("the object form is discoverable from the machine contract, not only from a failure", async () => {
  for (const flag of ["--acceptance-criteria", "--definition-of-done"]) {
    const parameter = flagParameter(flag, "task edit");
    // `value` deliberately UNCHANGED: a consumer switching on it is
    // unaffected. Widening the union would have been the tidier-looking
    // change and would break anyone matching it exhaustively.
    expect(parameter.value).toBe("json-array");
    expect(parameter.items).toContain("index");
    expect(parameter.items).toContain("checked");
  }
  // `--plan` shares `json-array` and is NOT a checklist: it holds no checked
  // state, so claiming the object shape there would be a false advertisement.
  expect(flagParameter("--plan", "task edit").items).toBeUndefined();

  const summary = commandHelp["task edit"]?.summary ?? "";
  expect(summary).toContain("checked");
  expect(summary).toContain("index");
});
