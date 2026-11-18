import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runQuest } from "../src/cli/main.ts";
import type { QuestionStatus } from "../src/domain/questions/questions.ts";
import {
  type BlockerEvent,
  createTask,
  evaluateReadySet,
} from "../src/domain/tasks/tasks.ts";

/**
 * QCLI-448 / opum-doc's operator-questions design, step 7: a task names a
 * QUESTION id as its blocker, and the block clears when that question
 * resolves -- derived at READ time, with no second task write.
 *
 * The measurement this builds on is recorded on QCLI-448: `blockers` is an
 * append-only `{kind, blockId, actorId, at, reason?, evidence?}` array whose
 * `blockId` is an untyped string, and readiness already excludes any active
 * blocker with `explicitly_blocked`. Nothing validated a `Q-N` reference or
 * resolved it; this suite pins both directions of that derivation and the
 * write path that authors the reference.
 */

const OPERATOR = ["--actor", "operator-1", "--actor-kind", "human"] as const;

interface RunResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

type Run = (argv: readonly string[]) => Promise<RunResult>;

async function withStore(
  body: (run: Run, store: string) => Promise<void>,
): Promise<void> {
  const store = await mkdtemp(join(tmpdir(), "quest-q448-"));
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

async function createTaskCli(run: Run, title: string): Promise<string> {
  const created = await run(["task", "create", title, ...OPERATOR, "--json"]);
  expect(created.exitCode).toBe(0);
  return (JSON.parse(created.stdout) as { data: { id: string } }).data.id;
}

async function ask(run: Run, title = "Ship it?"): Promise<string> {
  const asked = await run([
    "question",
    "ask",
    "--title",
    title,
    "--option",
    "A=Yes:ship now",
    "--option",
    "B=No:wait",
    "--recommend",
    "A",
    ...OPERATOR,
    "--json",
  ]);
  expect(asked.exitCode).toBe(0);
  return (JSON.parse(asked.stdout) as { data: { id: string } }).data.id;
}

async function readyIds(run: Run): Promise<readonly string[]> {
  const listed = await run(["task", "list", "--ready", "--json"]);
  expect(listed.exitCode).toBe(0);
  return (
    JSON.parse(listed.stdout) as { data: readonly { id: string }[] }
  ).data.map((task) => task.id);
}

function taskPath(store: string, id: string): string {
  return join(store, ".quest", "tasks", `${id}.json`);
}

test("a question blocker excludes the task from --ready while the question is open and returns it when answered, with no second task write (QCLI-448)", async () => {
  await withStore(async (run, store) => {
    const taskId = await createTaskCli(run, "Wait on the answer");
    const questionId = await ask(run);

    // Baseline: an unblocked task is ready.
    expect(await readyIds(run)).toContain(taskId);

    const blocked = await run([
      "task",
      "block",
      taskId,
      "--question",
      questionId,
      "--reason",
      "the answer decides the scope",
      ...OPERATOR,
      "--json",
    ]);
    expect({ exitCode: blocked.exitCode, stderr: blocked.stderr }).toEqual({
      exitCode: 0,
      stderr: "",
    });
    const blockedTask = (
      JSON.parse(blocked.stdout) as {
        data: { blockers: readonly BlockerEvent[] };
      }
    ).data;
    expect(blockedTask.blockers).toHaveLength(1);
    expect(blockedTask.blockers[0]).toMatchObject({
      kind: "opened",
      blockId: questionId,
      actorId: "operator-1",
      reason: "the answer decides the scope",
    });
    expect(typeof blockedTask.blockers[0]?.at).toBe("string");

    // Blocked while the question is open.
    expect(await readyIds(run)).not.toContain(taskId);

    // Answering the question is the WHOLE fix: no task command runs between
    // these two file reads, so identical bytes prove there was no second
    // task write -- the clear is derived, not authored.
    const before = await readFile(taskPath(store, taskId), "utf8");
    const answered = await run([
      "question",
      "answer",
      questionId,
      "--choice",
      "A",
      ...OPERATOR,
      "--json",
    ]);
    expect(answered.exitCode).toBe(0);
    expect(await readFile(taskPath(store, taskId), "utf8")).toBe(before);

    // ...and the task returns to ready.
    expect(await readyIds(run)).toContain(taskId);

    // The opened event is still the record's only blocker event: the derived
    // clear rewrote nothing.
    const view = await run(["task", "view", taskId, "--json"]);
    expect(
      (JSON.parse(view.stdout) as { data: { blockers: readonly unknown[] } })
        .data.blockers,
    ).toHaveLength(1);
  });
});

test("withdrawing the question also returns the task, with the task record untouched (QCLI-448)", async () => {
  await withStore(async (run, store) => {
    const taskId = await createTaskCli(
      run,
      "Wait on a question that is retired",
    );
    const questionId = await ask(run, "Retired question");
    const blocked = await run([
      "task",
      "block",
      taskId,
      "--question",
      questionId,
      "--reason",
      "needs the ruling",
      ...OPERATOR,
      "--json",
    ]);
    expect(blocked.exitCode).toBe(0);
    expect(await readyIds(run)).not.toContain(taskId);

    const before = await readFile(taskPath(store, taskId), "utf8");
    const withdrawn = await run([
      "question",
      "withdraw",
      questionId,
      "--reason",
      "no longer relevant",
      ...OPERATOR,
      "--json",
    ]);
    expect(withdrawn.exitCode).toBe(0);
    expect(await readFile(taskPath(store, taskId), "utf8")).toBe(before);
    expect(await readyIds(run)).toContain(taskId);
  });
});

test("task unblock clears a question blocker early, appending a cleared event (QCLI-448)", async () => {
  await withStore(async (run) => {
    const taskId = await createTaskCli(run, "Stop waiting early");
    const questionId = await ask(run);
    expect(
      (
        await run([
          "task",
          "block",
          taskId,
          "--question",
          questionId,
          "--reason",
          "needs the ruling",
          ...OPERATOR,
          "--json",
        ])
      ).exitCode,
    ).toBe(0);
    expect(await readyIds(run)).not.toContain(taskId);

    const unblocked = await run([
      "task",
      "unblock",
      taskId,
      "--question",
      questionId,
      "--reason",
      "the task can proceed without it",
      ...OPERATOR,
      "--json",
    ]);
    expect({ exitCode: unblocked.exitCode, stderr: unblocked.stderr }).toEqual({
      exitCode: 0,
      stderr: "",
    });
    const blockers = (
      JSON.parse(unblocked.stdout) as {
        data: { blockers: readonly BlockerEvent[] };
      }
    ).data.blockers;
    // Append-only: the opened event and its reason survive beside the clear.
    expect(blockers.map((event) => event.kind)).toEqual(["opened", "cleared"]);
    expect(blockers[1]).toMatchObject({
      kind: "cleared",
      blockId: questionId,
      actorId: "operator-1",
      reason: "the task can proceed without it",
    });

    // Ready again while the question is STILL open.
    expect(await readyIds(run)).toContain(taskId);
    const question = await run(["question", "view", questionId, "--json"]);
    expect(
      (JSON.parse(question.stdout) as { data: { status: string } }).data.status,
    ).toBe("open");
  });
});

test("the write path validates the question id, the question's existence, and its state (QCLI-448)", async () => {
  await withStore(async (run) => {
    const taskId = await createTaskCli(run, "Validated blockers");
    const questionId = await ask(run);

    // Not a question id at all.
    const notAQid = await run([
      "task",
      "block",
      taskId,
      "--question",
      "scope-1",
      "--reason",
      "x",
      ...OPERATOR,
      "--json",
    ]);
    expect(notAQid.exitCode).toBe(6);
    expect(
      (JSON.parse(notAQid.stderr) as { error_type: string }).error_type,
    ).toBe("validation");

    // A syntactically valid id naming no question record.
    const missing = await run([
      "task",
      "block",
      taskId,
      "--question",
      "Q-9",
      "--reason",
      "x",
      ...OPERATOR,
      "--json",
    ]);
    expect(missing.exitCode).toBe(3);
    expect(
      (JSON.parse(missing.stderr) as { error_type: string }).error_type,
    ).toBe("not_found");

    // A question that already resolved: a block opened on it would be
    // inactive the moment it was read, so it is refused, not written.
    expect(
      (
        await run([
          "question",
          "answer",
          questionId,
          "--choice",
          "A",
          ...OPERATOR,
          "--json",
        ])
      ).exitCode,
    ).toBe(0);
    const resolved = await run([
      "task",
      "block",
      taskId,
      "--question",
      questionId,
      "--reason",
      "x",
      ...OPERATOR,
      "--json",
    ]);
    expect(resolved.exitCode).toBe(6);
    expect((JSON.parse(resolved.stderr) as { message: string }).message).toBe(
      "question_not_open",
    );

    // Nothing above wrote a blocker.
    const view = await run(["task", "view", taskId, "--json"]);
    expect(
      (JSON.parse(view.stdout) as { data: { blockers: readonly unknown[] } })
        .data.blockers,
    ).toEqual([]);
  });
});

test("a duplicate open and an unknown clear are refused by the event-history rules (QCLI-448)", async () => {
  await withStore(async (run) => {
    const taskId = await createTaskCli(run, "Duplicate and unknown");
    const questionId = await ask(run);
    const block = () =>
      run([
        "task",
        "block",
        taskId,
        "--question",
        questionId,
        "--reason",
        "waiting",
        ...OPERATOR,
        "--json",
      ]);
    expect((await block()).exitCode).toBe(0);
    const duplicate = await block();
    expect(duplicate.exitCode).toBe(6);
    expect((JSON.parse(duplicate.stderr) as { message: string }).message).toBe(
      "blocker_duplicate_open",
    );

    const unknown = await run([
      "task",
      "unblock",
      taskId,
      "--question",
      "Q-9",
      "--reason",
      "not blocked on it",
      ...OPERATOR,
      "--json",
    ]);
    expect(unknown.exitCode).toBe(6);
    expect((JSON.parse(unknown.stderr) as { message: string }).message).toBe(
      "blocker_unknown_or_repeat_clear",
    );
  });
});

test("--question and --reason are both required, and a refusal writes nothing (QCLI-448)", async () => {
  await withStore(async (run) => {
    const taskId = await createTaskCli(run, "Missing flags");
    const noReason = await run([
      "task",
      "block",
      taskId,
      "--question",
      "Q-1",
      ...OPERATOR,
      "--json",
    ]);
    expect(noReason.exitCode).toBe(2);
    const noQuestion = await run([
      "task",
      "block",
      taskId,
      "--reason",
      "x",
      ...OPERATOR,
      "--json",
    ]);
    expect(noQuestion.exitCode).toBe(2);
    const view = await run(["task", "view", taskId, "--json"]);
    expect(
      (JSON.parse(view.stdout) as { data: { blockers: readonly unknown[] } })
        .data.blockers,
    ).toEqual([]);
  });
});

/**
 * The derivation itself, at the domain seam every readiness consumer shares:
 * a `Q-N` block id is active only while that question is `open`, an id with no
 * record fails CLOSED, and an ordinary block id is unaffected.
 */
test("readiness derives question blockers from question status and fails closed on a dangling id (QCLI-448)", () => {
  const blocker = (blockId: string): BlockerEvent => ({
    kind: "opened",
    blockId,
    actorId: "actor-1",
    at: "2026-11-18T00:00:00.000Z",
    reason: "waiting",
  });
  const task = (blockers: readonly BlockerEvent[]) =>
    createTask("T-1", { title: "Wait", blockers });
  const statuses = (
    entries: readonly (readonly [string, QuestionStatus])[],
  ): ReadonlyMap<string, QuestionStatus> => new Map(entries);
  const now = new Date("2026-11-18T12:00:00.000Z");

  const open = evaluateReadySet(
    [task([blocker("Q-7")])],
    now,
    undefined,
    statuses([["Q-7", "open"]]),
  );
  expect(open.ready).toEqual([]);
  expect(open.excluded).toEqual([
    { taskId: "T-1", reason: "explicitly_blocked" },
  ]);

  for (const status of ["answered", "withdrawn"] as const) {
    expect(
      evaluateReadySet(
        [task([blocker("Q-7")])],
        now,
        undefined,
        statuses([["Q-7", status]]),
      ),
    ).toEqual({ ready: ["T-1"], excluded: [] });
  }

  // Dangling reference: no question record, so nothing resolved it.
  expect(
    evaluateReadySet([task([blocker("Q-7")])], now, undefined, statuses([])),
  ).toEqual({
    ready: [],
    excluded: [{ taskId: "T-1", reason: "explicitly_blocked" }],
  });

  // An ordinary (non-question) blocker keeps its authored-history meaning.
  expect(
    evaluateReadySet(
      [task([blocker("vendor-wait")])],
      now,
      undefined,
      statuses([["Q-7", "answered"]]),
    ),
  ).toEqual({
    ready: [],
    excluded: [{ taskId: "T-1", reason: "explicitly_blocked" }],
  });

  // An authored clear still wins over a still-open question.
  expect(
    evaluateReadySet(
      [
        task([
          blocker("Q-7"),
          {
            kind: "cleared",
            blockId: "Q-7",
            actorId: "actor-1",
            at: "2026-11-18T01:00:00.000Z",
            reason: "no longer needed",
          },
        ]),
      ],
      now,
      undefined,
      statuses([["Q-7", "open"]]),
    ),
  ).toEqual({ ready: ["T-1"], excluded: [] });
});
