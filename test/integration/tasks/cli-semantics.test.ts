import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runQuest } from "../../../src/cli/main.ts";

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
  const store = await mkdtemp(join(tmpdir(), "quest-cli-semantics-"));
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

function json(result: { stdout: string }): Record<string, unknown> {
  return JSON.parse(result.stdout) as Record<string, unknown>;
}

function diagnostic(result: { stderr: string }): Record<string, unknown> {
  return JSON.parse(result.stderr) as Record<string, unknown>;
}

test("status-flow reports the configured policy and list matches statuses case-insensitively", async () => {
  await withStore(async (run) => {
    const flow = await run(["task", "status-flow", "--json"]);
    expect(flow.exitCode).toBe(0);
    expect(json(flow)).toEqual({
      schemaVersion: 1,
      kind: "task.status-flow",
      data: {
        statuses: ["To Do", "In Progress", "Done"],
        terminalStatuses: ["Done"],
      },
      principal: null,
    });

    await run([
      "task",
      "create",
      "Case task",
      ...actor,
      "--label",
      "case",
      "--json",
    ]);
    for (const spelling of ["to do", "TO DO", "To Do"]) {
      const listed = await run([
        "task",
        "list",
        "--status",
        spelling,
        "--json",
      ]);
      expect(listed.exitCode).toBe(0);
      expect(json(listed).data).toEqual([
        expect.objectContaining({ id: "T-1", status: "To Do" }),
      ]);
    }
    const unknown = await run([
      "task",
      "list",
      "--status",
      "Blocked",
      "--json",
    ]);
    expect(unknown.exitCode).toBe(6);
    expect(unknown.stdout).toBe("");
    expect(diagnostic(unknown)).toEqual({
      error_type: "validation",
      message: "Task status is not configured.",
      principal: null,
    });
  });
});

test("edit resolves case-insensitive configured statuses and rejects unknown or illegal transitions loudly", async () => {
  await withStore(async (run) => {
    await run(["task", "create", "Flow task", ...actor, "--json"]);
    const advanced = await run([
      "task",
      "edit",
      "T-1",
      "--status",
      "in progress",
      ...actor,
      "--json",
    ]);
    expect(advanced.exitCode).toBe(0);
    expect(json(advanced).data).toEqual(
      expect.objectContaining({ id: "T-1", status: "In Progress" }),
    );
    // The legal next step from In Progress is Done: case-insensitive spelling accepted.
    const completed = await run([
      "task",
      "edit",
      "T-1",
      "--status",
      "done",
      ...actor,
      "--json",
    ]);
    expect(completed.exitCode).toBe(0);
    expect(json(completed).data).toEqual(
      expect.objectContaining({ id: "T-1", status: "Done" }),
    );
    // A backward transition is illegal and fails loud.
    const demoted = await run([
      "task",
      "create",
      "Backward",
      ...actor,
      "--json",
    ]);
    expect(demoted.exitCode).toBe(0);
    await run([
      "task",
      "edit",
      "T-2",
      "--status",
      "In Progress",
      ...actor,
      "--json",
    ]);
    const skipped = await run([
      "task",
      "edit",
      "T-2",
      "--status",
      "to do",
      ...actor,
      "--json",
    ]);
    expect(skipped.exitCode).toBe(6);
    expect(diagnostic(skipped)).toMatchObject({
      error_type: "validation",
      message: "Illegal task transition: In Progress -> To Do.",
    });
    const unknown = await run([
      "task",
      "edit",
      "T-2",
      "--status",
      "Blocked",
      ...actor,
      "--json",
    ]);
    expect(unknown.exitCode).toBe(6);
    expect(diagnostic(unknown)).toEqual({
      error_type: "validation",
      message: "Task status is not configured.",
      principal: null,
    });
  });
});

test("create accepts the full advertised field set and stores it losslessly", async () => {
  await withStore(async (run) => {
    // A dangling milestone reference must be rejected before any mutation.
    const withoutMilestone = await run([
      "task",
      "create",
      "Full create",
      "--id",
      "T-9",
      "--milestone",
      "M-1",
      ...actor,
      "--json",
    ]);
    expect(withoutMilestone.exitCode).toBe(6);
    const milestoneCreate = await run([
      "milestone",
      "create",
      "Sprint One",
      "--id",
      "M-1",
      ...actor,
      "--json",
    ]);
    if (milestoneCreate.exitCode !== 0) console.error(milestoneCreate.stderr);
    const created = await run([
      "task",
      "create",
      "Full create",
      "--id",
      "T-9",
      "--priority",
      "high",
      "--type",
      "feature",
      "--ordinal",
      "7",
      "--alias",
      "FULL",
      "--acceptance-criteria",
      '["works"]',
      "--definition-of-done",
      '[{"index":0,"text":"shipped","checked":false}]',
      "--plan",
      '["step one"]',
      "--implementation-notes",
      '["note one"]',
      "--assignee",
      "person-2",
      "--reference",
      "docs/story.md",
      "--modified-file",
      "src/app.ts",
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
    // T-1 does not exist yet, so the dependency is rejected before any mutation.
    expect(created.exitCode).toBe(6);
    expect(created.stdout).toBe("");
    expect(diagnostic(created)).toMatchObject({
      error_type: "validation",
      message: "dependency_target_not_found",
    });

    await run(["task", "create", "Base", ...actor, "--json"]);
    const full = await run([
      "task",
      "create",
      "Full create",
      "--id",
      "T-9",
      "--priority",
      "high",
      "--type",
      "feature",
      "--ordinal",
      "7",
      "--alias",
      "FULL",
      "--acceptance-criteria",
      '["works"]',
      "--definition-of-done",
      '[{"index":0,"text":"shipped","checked":false}]',
      "--plan",
      '["step one"]',
      "--implementation-notes",
      '["note one"]',
      "--assignee",
      "person-2",
      "--reference",
      "docs/story.md",
      "--modified-file",
      "src/app.ts",
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
    expect(full.exitCode).toBe(0);
    expect(json(full).data).toEqual({
      // QCLI-137 stamps every write; the values are clock-dependent.
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      acceptanceCriteria: [{ index: 0, text: "works", checked: false }],
      aliases: ["FULL"],
      assignees: ["person-2"],
      blockers: [],
      comments: [],
      definitionOfDone: [{ index: 0, text: "shipped", checked: false }],
      dependencies: ["T-1"],
      documentation: [],
      finalSummary: "wrapped",
      gates: [],
      gateEvents: [],
      id: "T-9",
      implementationNotes: ["note one"],
      labels: [],
      milestoneId: "M-1",
      modifiedFiles: ["src/app.ts"],
      ordinal: 7,
      parentId: "T-1",
      plan: ["step one"],
      priority: "high",
      references: ["docs/story.md"],
      status: "To Do",
      title: "Full create",
      type: "feature",
    } as Record<string, unknown>);

    const badJson = await run([
      "task",
      "create",
      "Broken",
      "--plan",
      "{not json",
      ...actor,
      "--json",
    ]);
    expect(badJson.exitCode).toBe(2);
    expect(diagnostic(badJson)).toMatchObject({
      error_type: "usage",
      message: "--plan must be a JSON array of strings.",
    });
    const badOrdinal = await run([
      "task",
      "create",
      "Broken ordinal",
      "--ordinal",
      "high",
      ...actor,
      "--json",
    ]);
    expect(badOrdinal.exitCode).toBe(2);
    expect(diagnostic(badOrdinal)).toMatchObject({
      error_type: "usage",
      message: "--ordinal must be an integer.",
    });
  });
});

test("edit replace add remove clear operations keep deterministic ordering", async () => {
  await withStore(async (run) => {
    await run(["task", "create", "Base", ...actor, "--json"]);
    const seeded = await run([
      "task",
      "create",
      "Merge task",
      "--id",
      "T-2",
      "--label",
      "keep",
      "--label",
      "drop",
      "--plan",
      '["keep","drop"]',
      "--implementation-notes",
      '["keep-note","drop-note"]',
      "--assignee",
      "person-2",
      "--assignee",
      "person-3",
      "--reference",
      "ref-a",
      "--modified-file",
      "a.ts",
      ...actor,
      "--json",
    ]);
    expect(seeded.exitCode).toBe(0);

    const updated = await run([
      "task",
      "edit",
      "T-2",
      "--add-label",
      "new",
      "--remove-label",
      "drop",
      "--plan",
      '["replaced"]',
      "--notes",
      '["replaced-note"]',
      "--acceptance-criteria",
      '[{"index":0,"text":"ac","checked":true}]',
      "--definition-of-done",
      '["done-check"]',
      "--add-dependency",
      "T-99",
      "--clear-milestone",
      "--add-assignee",
      "person-4",
      "--remove-assignee",
      "person-3",
      "--add-reference",
      "ref-b",
      "--remove-reference",
      "ref-a",
      "--add-modified-file",
      "b.ts",
      "--remove-modified-file",
      "a.ts",
      ...actor,
      "--json",
    ]);
    // --add-dependency T-99 names a missing task: fail loud, no mutation.
    expect(updated.exitCode).toBe(6);
    expect(diagnostic(updated)).toMatchObject({
      error_type: "validation",
      message: "dependency_target_not_found",
    });

    const applied = await run([
      "task",
      "edit",
      "T-2",
      "--add-label",
      "new",
      "--remove-label",
      "drop",
      "--plan",
      '["replaced"]',
      "--notes",
      '["replaced-note"]',
      "--acceptance-criteria",
      '[{"index":0,"text":"ac","checked":true}]',
      "--definition-of-done",
      '["done-check"]',
      "--clear-milestone",
      "--add-assignee",
      "person-4",
      "--remove-assignee",
      "person-3",
      "--add-reference",
      "ref-b",
      "--remove-reference",
      "ref-a",
      "--add-modified-file",
      "b.ts",
      "--remove-modified-file",
      "a.ts",
      ...actor,
      "--json",
    ]);
    expect(applied.exitCode).toBe(0);
    expect(json(applied).data).toEqual({
      // QCLI-137 stamps every write; the values are clock-dependent.
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      acceptanceCriteria: [{ index: 0, text: "ac", checked: true }],
      aliases: [],
      assignees: ["person-2", "person-4"],
      blockers: [],
      comments: [],
      definitionOfDone: [{ index: 0, text: "done-check", checked: false }],
      dependencies: [],
      documentation: [],
      gates: [],
      gateEvents: [],
      id: "T-2",
      implementationNotes: ["replaced-note"],
      labels: ["keep", "new"],
      modifiedFiles: ["b.ts"],
      plan: ["replaced"],
      references: ["ref-b"],
      status: "To Do",
      title: "Merge task",
    } as Record<string, unknown>);
    // JSON.stringify omits undefined keys: cleared fields are absent, not null.
    const appliedData = json(applied).data as object;
    expect("milestoneId" in appliedData).toBe(false);
  });
});

test("edit composes a wholesale list replacement with an add in the same command instead of discarding the add (QCLI-150)", async () => {
  await withStore(async (run) => {
    const seeded = await run([
      "task",
      "create",
      "Compose task",
      "--label",
      "stale",
      "--plan",
      '["stale-step"]',
      "--implementation-notes",
      '["stale-note"]',
      "--comments",
      '[{"id":"c-1","authorId":"person-1","body":"stale comment","createdAt":"2026-01-01T00:00:00.000Z"}]',
      ...actor,
      "--json",
    ]);
    expect(seeded.exitCode).toBe(0);
    const id = (json(seeded).data as { id: string }).id;

    const updated = await run([
      "task",
      "edit",
      id,
      "--labels",
      '["fresh"]',
      "--add-label",
      "extra",
      "--plan",
      '["fresh-step"]',
      "--add-plan",
      "extra-step",
      "--notes",
      '["fresh-note"]',
      "--add-note",
      "extra-note",
      "--comments",
      '[{"id":"c-2","authorId":"person-1","body":"fresh comment","createdAt":"2026-01-02T00:00:00.000Z"}]',
      "--add-comment",
      '[{"id":"c-3","authorId":"person-1","body":"extra comment","createdAt":"2026-01-03T00:00:00.000Z"}]',
      ...actor,
      "--json",
    ]);
    expect(updated.exitCode).toBe(0);
    const data = json(updated).data as Record<string, unknown>;
    // Each family composes: the replacement supplies the base, and the add
    // in the same command still lands on top of it rather than being
    // silently discarded.
    expect(data.labels).toEqual(["fresh", "extra"]);
    expect(data.plan).toEqual(["fresh-step", "extra-step"]);
    expect(data.implementationNotes).toEqual(["fresh-note", "extra-note"]);
    expect(
      (data.comments as { id: string }[]).map((comment) => comment.id),
    ).toEqual(["c-2", "c-3"]);
  });
});

test("list sees completed tasks by default and archived tasks behind --include-archived (QCLI-165)", async () => {
  await withStore(async (run) => {
    const active = await run(["task", "create", "Active", ...actor, "--json"]);
    const activeId = (json(active).data as { id: string }).id;

    const completed = await run([
      "task",
      "create",
      "Completed",
      ...actor,
      "--json",
    ]);
    const completedId = (json(completed).data as { id: string }).id;
    await run([
      "task",
      "edit",
      completedId,
      "--status",
      "In Progress",
      ...actor,
      "--json",
    ]);
    const completeResult = await run([
      "task",
      "complete",
      completedId,
      ...actor,
      "--json",
    ]);
    expect(completeResult.exitCode).toBe(0);

    const archived = await run([
      "task",
      "create",
      "Archived",
      ...actor,
      "--json",
    ]);
    const archivedId = (json(archived).data as { id: string }).id;
    const archiveResult = await run([
      "task",
      "archive",
      archivedId,
      ...actor,
      "--json",
    ]);
    expect(archiveResult.exitCode).toBe(0);

    // view already resolves any location; confirms the fixtures landed where expected.
    expect(
      (
        json(await run(["task", "view", completedId, "--json"])).data as {
          status: string;
        }
      ).status,
    ).toBe("Done");
    expect(
      (
        json(await run(["task", "view", archivedId, "--json"])).data as {
          status: string;
        }
      ).status,
    ).toBe("To Do");

    const ids = (result: { stdout: string }): string[] =>
      (json(result).data as { id: string }[]).map((task) => task.id).sort();

    // Default: active + completed, never archived.
    expect(ids(await run(["task", "list", "--json"]))).toEqual(
      [activeId, completedId].sort(),
    );
    // Explicit terminal-status filter reaches the completed task.
    expect(
      ids(await run(["task", "list", "--status", "Done", "--json"])),
    ).toEqual([completedId]);
    // Excluding Done leaves only the still-active task.
    expect(
      ids(await run(["task", "list", "--exclude-status", "Done", "--json"])),
    ).toEqual([activeId]);
    // --include-archived adds the archived task on top of the default set.
    expect(
      ids(await run(["task", "list", "--include-archived", "--json"])),
    ).toEqual([activeId, archivedId, completedId].sort());
  });
});

test("writes without an actor are denied and unknown flags fail loud as usage", async () => {
  await withStore(async (run) => {
    const noActor = await run(["task", "create", "No actor", "--json"]);
    expect(noActor.exitCode).toBe(4);
    expect(noActor.stdout).toBe("");
    expect(diagnostic(noActor)).toEqual({
      error_type: "denied",
      message: "Tracker writes require an explicit actor declaration.",
      principal: null,
    });
    const delegated = await run([
      "task",
      "create",
      "No human",
      "--actor",
      "bot-1",
      "--actor-kind",
      "delegated-agent",
      "--json",
    ]);
    expect(delegated.exitCode).toBe(4);
    expect(diagnostic(delegated)).toEqual({
      error_type: "denied",
      message: "Tracker writes require an explicit actor declaration.",
      principal: null,
    });
    const unknownFlag = await run([
      "task",
      "create",
      "Unknown flag",
      "--bogus",
      "value",
      ...actor,
      "--json",
    ]);
    expect(unknownFlag.exitCode).toBe(2);
    expect(diagnostic(unknownFlag)).toMatchObject({
      error_type: "usage",
      message: "task create received invalid arguments.",
    });
    const empty = await run(["task", "list", "--json"]);
    expect(empty.exitCode).toBe(0);
    expect(json(empty).data).toEqual([]);
  });
});

test("concurrent edits serialize into a structured conflict without silent loss", async () => {
  await withStore(async (run) => {
    await run([
      "task",
      "create",
      "Contention",
      "--label",
      "base",
      ...actor,
      "--json",
    ]);
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, writer) =>
        run([
          "task",
          "edit",
          "T-1",
          "--add-label",
          `writer-${writer}`,
          ...actor,
          "--json",
        ]),
      ),
    );
    const failures = results.filter((result) => result.exitCode !== 0);
    expect(failures.length).toBeGreaterThan(0);
    for (const result of failures) {
      expect(result).toMatchObject({ exitCode: 5, stdout: "" });
      expect(diagnostic(result)).toMatchObject({
        error_type: "conflict",
        message:
          "Task state changed concurrently; the operation was not applied.",
      });
    }
    const listed = await run(["task", "list", "--json"]);
    const rows = json(listed).data as readonly {
      labels: readonly string[];
    }[];
    // Surviving writers are unique and ordered; no duplicate merge, no silent loss.
    expect(rows).toHaveLength(1);
    const labels = rows[0]?.labels ?? [];
    expect(labels[0]).toBe("base");
    const writers = labels.filter((label) => label.startsWith("writer-"));
    expect(writers).toEqual([...writers].sort());
    expect(new Set(writers).size).toBe(writers.length);
  });
});

test("task edit --milestone closes forward and back references atomically", async () => {
  await withStore(async (run) => {
    await run([
      "milestone",
      "create",
      "Sprint One",
      "--id",
      "M-1",
      ...actor,
      "--json",
    ]);
    await run([
      "milestone",
      "create",
      "Sprint Two",
      "--id",
      "M-2",
      ...actor,
      "--json",
    ]);
    await run(["task", "create", "Linked", "--id", "T-1", ...actor, "--json"]);

    const link = await run([
      "task",
      "edit",
      "T-1",
      "--milestone",
      "M-1",
      ...actor,
      "--json",
    ]);
    expect(link.exitCode).toBe(0);
    expect(JSON.parse(link.stdout).data.milestoneId).toBe("M-1");
    expect(
      JSON.parse((await run(["milestone", "view", "M-1", "--json"])).stdout)
        .data.taskIds,
    ).toEqual(["T-1"]);

    const move = await run([
      "task",
      "edit",
      "T-1",
      "--milestone",
      "M-2",
      ...actor,
      "--json",
    ]);
    expect(move.exitCode).toBe(0);
    expect(
      JSON.parse((await run(["milestone", "view", "M-1", "--json"])).stdout)
        .data.taskIds,
    ).toEqual([]);
    expect(
      JSON.parse((await run(["milestone", "view", "M-2", "--json"])).stdout)
        .data.taskIds,
    ).toEqual(["T-1"]);

    const clear = await run([
      "task",
      "edit",
      "T-1",
      "--clear-milestone",
      ...actor,
      "--json",
    ]);
    expect(clear.exitCode).toBe(0);
    expect(JSON.parse(clear.stdout).data.milestoneId).toBeUndefined();
    expect(
      JSON.parse((await run(["milestone", "view", "M-2", "--json"])).stdout)
        .data.taskIds,
    ).toEqual([]);

    const dangling = await run([
      "task",
      "edit",
      "T-1",
      "--milestone",
      "M-99",
      ...actor,
      "--json",
    ]);
    expect(dangling.exitCode).toBe(6);
    expect(diagnostic(dangling).message).toBe("milestone_reference_dangling");
  });
});
