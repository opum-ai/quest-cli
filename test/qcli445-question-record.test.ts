import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runQuest } from "../src/cli/main.ts";

/**
 * QCLI-445 / opum-doc seq 179(a): the `question` record and its ask/answer/
 * withdraw/list/view commands, as specified in opum-doc's
 * `docs/reference/operator-questions-in-quest-design.md`. The board-pane UI and
 * its forgery guard are QCLI-446; this suite covers the CLI half, including the
 * `via` field and the rule that an answer names a human actor.
 */

const OPERATOR = ["--actor", "operator-1", "--actor-kind", "human"];

async function withStore(
  body: (
    run: (argv: readonly string[]) => Promise<{
      exitCode: number;
      stdout: string;
      stderr: string;
    }>,
  ) => Promise<void>,
): Promise<void> {
  const store = await mkdtemp(join(tmpdir(), "quest-q445-"));
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

async function ask(
  run: (argv: readonly string[]) => Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }>,
  extra: readonly string[] = [],
) {
  return run([
    "question",
    "ask",
    "--title",
    "Ship it?",
    "--context",
    "the evidence and the trade-offs",
    "--option",
    "A=Yes:ship now",
    "--option",
    "B=No:wait",
    "--recommend",
    "A",
    ...OPERATOR,
    ...extra,
    "--json",
  ]);
}

test("ask allocates Q-N and stores the record the design specifies (QCLI-445)", async () => {
  await withStore(async (run) => {
    const asked = await ask(run);
    expect({ exitCode: asked.exitCode, stderr: asked.stderr }).toEqual({
      exitCode: 0,
      stderr: "",
    });
    const record = JSON.parse(asked.stdout).data;
    expect(record.id).toBe("Q-1");
    expect(record.status).toBe("open");
    expect(record.title).toBe("Ship it?");
    expect(record.context).toBe("the evidence and the trade-offs");
    expect(record.recommended).toBe("A");
    expect(record.options).toEqual([
      { key: "A", label: "Yes", description: "ship now" },
      { key: "B", label: "No", description: "wait" },
    ]);

    // A second ask allocates the next sequence.
    expect(JSON.parse((await ask(run)).stdout).data.id).toBe("Q-2");
  });
});

test("a --recommend that names no option key is refused (QCLI-445)", async () => {
  await withStore(async (run) => {
    const result = await run([
      "question",
      "ask",
      "--title",
      "T",
      "--option",
      "A=Yes:y",
      "--option",
      "B=No:n",
      "--recommend",
      "C",
      ...OPERATOR,
      "--json",
    ]);
    expect(result.exitCode).toBe(6);
    expect(JSON.parse(result.stderr).error_type).toBe("validation");
  });
});

test("ask/answer/view/list round-trip, and via records how the answer arrived (QCLI-445)", async () => {
  await withStore(async (run) => {
    await ask(run);

    const view = await run(["question", "view", "Q-1", "--json"]);
    expect(JSON.parse(view.stdout).data.id).toBe("Q-1");

    const open = await run(["question", "list", "--status", "open", "--json"]);
    expect(
      JSON.parse(open.stdout).data.map((r: { id: string }) => r.id),
    ).toEqual(["Q-1"]);

    const answered = await run([
      "question",
      "answer",
      "Q-1",
      "--choice",
      "A",
      "--via",
      "quest-board-pane",
      ...OPERATOR,
      "--json",
    ]);
    expect({ exitCode: answered.exitCode, stderr: answered.stderr }).toEqual({
      exitCode: 0,
      stderr: "",
    });
    const record = JSON.parse(answered.stdout).data;
    expect(record.status).toBe("answered");
    expect(record.answer.choice).toBe("A");
    expect(record.answer.actor).toBe("operator-1");
    expect(record.answer.via).toBe("quest-board-pane");
    expect(typeof record.answer.answeredAt).toBe("string");

    // The answered question leaves the open filter.
    const stillOpen = await run([
      "question",
      "list",
      "--status",
      "open",
      "--json",
    ]);
    expect(JSON.parse(stillOpen.stdout).data).toEqual([]);
    const answeredList = await run([
      "question",
      "list",
      "--status",
      "answered",
      "--json",
    ]);
    expect(
      JSON.parse(answeredList.stdout).data.map((r: { id: string }) => r.id),
    ).toEqual(["Q-1"]);
  });
});

test("an answer may carry free text instead of a choice (QCLI-445)", async () => {
  await withStore(async (run) => {
    await ask(run);
    const answered = await run([
      "question",
      "answer",
      "Q-1",
      "--text",
      "do the third thing instead",
      ...OPERATOR,
      "--json",
    ]);
    expect(answered.exitCode).toBe(0);
    expect(JSON.parse(answered.stdout).data.answer.text).toBe(
      "do the third thing instead",
    );
  });
});

test("an answer must record a human actor -- a delegated agent is refused (QCLI-445)", async () => {
  await withStore(async (run) => {
    await ask(run);
    const refused = await run([
      "question",
      "answer",
      "Q-1",
      "--choice",
      "A",
      "--actor",
      "agent-7",
      "--actor-kind",
      "delegated-agent",
      "--accountable-human",
      "operator-1",
      "--json",
    ]);
    expect(refused.exitCode).toBe(4);
    expect(JSON.parse(refused.stderr).error_type).toBe("denied");
    // The record is untouched: the question is still open.
    const view = await run(["question", "view", "Q-1", "--json"]);
    expect(JSON.parse(view.stdout).data.status).toBe("open");
  });
});

test("withdraw records its reason and is one of two terminal states (QCLI-445)", async () => {
  await withStore(async (run) => {
    await ask(run);
    const withdrawn = await run([
      "question",
      "withdraw",
      "Q-1",
      "--reason",
      "no longer relevant",
      ...OPERATOR,
      "--json",
    ]);
    expect(withdrawn.exitCode).toBe(0);
    const record = JSON.parse(withdrawn.stdout).data;
    expect(record.status).toBe("withdrawn");
    expect(record.withdrawal.reason).toBe("no longer relevant");
    expect(record.withdrawal.actor).toBe("operator-1");

    // Answering a question that is no longer open is a validation error.
    const late = await run([
      "question",
      "answer",
      "Q-1",
      "--choice",
      "A",
      ...OPERATOR,
      "--json",
    ]);
    expect(late.exitCode).toBe(6);
    expect(JSON.parse(late.stderr).error_type).toBe("validation");
  });
});

test("view of an unknown question is a not_found diagnostic on exit 3 (QCLI-445)", async () => {
  await withStore(async (run) => {
    const missing = await run(["question", "view", "Q-9", "--json"]);
    expect(missing.exitCode).toBe(3);
    expect(JSON.parse(missing.stderr).error_type).toBe("not_found");
  });
});

test("ask honours an explicit --id and refuses a duplicate (QCLI-445)", async () => {
  await withStore(async (run) => {
    const explicit = await ask(run, ["--id", "Q-42"]);
    expect(JSON.parse(explicit.stdout).data.id).toBe("Q-42");
    const duplicate = await ask(run, ["--id", "Q-42"]);
    expect(duplicate.exitCode).toBe(6);
    expect(JSON.parse(duplicate.stderr).error_type).toBe("validation");
  });
});
