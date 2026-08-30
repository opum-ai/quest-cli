import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const executable = join(import.meta.dir, "../../../src/cli/main.ts");

async function quest(store: string, argv: readonly string[]) {
  const child = Bun.spawn(["bun", executable, ...argv], {
    cwd: store,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...Bun.env, QUEST_TASK_STORE: store },
  });
  return {
    exitCode: await child.exited,
    stdout: await new Response(child.stdout).text(),
    stderr: await new Response(child.stderr).text(),
  };
}

async function sourceFixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "quest-lore-backlog-source-"));
  const tasks = join(root, "backlog", "tasks");
  await mkdir(tasks, { recursive: true });
  for (const [id, title] of [
    ["TASK-1", "Legacy task"],
    ["LCLI-315.4", "Lore dotted subtask"],
    ["TASK-2.1", "Backlog dotted subtask"],
  ]) {
    await writeFile(
      join(tasks, `${id}.md`),
      `---\nid: ${id}\ntitle: ${title}\nstatus: To Do\nlabels: [lore-cutover]\n---\n\nSource-only fixture.\n`,
    );
  }
  return root;
}

test("the public Backlog migration contract preserves Lore-facing aliases and durable receipts", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-backlog-public-"));
  const source = await sourceFixture();
  try {
    const preview = await quest(store, [
      "migration",
      "backlog",
      "preview",
      "--source",
      source,
      "--json",
    ]);
    expect(preview.exitCode).toBe(0);
    const previewEnvelope = JSON.parse(preview.stdout);
    expect(previewEnvelope).toMatchObject({
      schemaVersion: 1,
      kind: "migration.backlog-preview",
      data: {
        requiresApproval: true,
        mappings: [
          { sourceIdentifier: "LCLI-315.4", targetIdentifier: "T-1" },
          { sourceIdentifier: "TASK-1", targetIdentifier: "T-2" },
          { sourceIdentifier: "TASK-2.1", targetIdentifier: "T-3" },
        ],
      },
    });
    const apply = await quest(store, [
      "migration",
      "backlog",
      "apply",
      "--source",
      source,
      "--digest",
      previewEnvelope.data.digest,
      "--actor",
      "migration-owner",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(apply.exitCode).toBe(0);
    expect(JSON.parse(apply.stdout)).toMatchObject({
      kind: "migration.backlog-applied",
      data: { state: "applied", survivors: ["T-1", "T-2", "T-3"] },
    });
    for (const [reference, id] of [
      ["TASK-1", "T-2"],
      ["LCLI-315.4", "T-1"],
      ["TASK-2.1", "T-3"],
    ]) {
      const viewed = await quest(store, ["task", "view", reference, "--json"]);
      expect(JSON.parse(viewed.stdout)).toMatchObject({
        kind: "task.view",
        data: { id, source: { system: "backlog", reference } },
      });
    }
    const repeated = await quest(store, [
      "migration",
      "backlog",
      "apply",
      "--source",
      source,
      "--digest",
      previewEnvelope.data.digest,
      "--actor",
      "migration-owner",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(JSON.parse(repeated.stdout).data).toEqual(
      JSON.parse(apply.stdout).data,
    );
    const rollback = await quest(store, [
      "migration",
      "backlog",
      "rollback",
      "--digest",
      previewEnvelope.data.digest,
      "--actor",
      "migration-owner",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(JSON.parse(rollback.stdout)).toMatchObject({
      kind: "migration.backlog-rolled-back",
      data: { state: "rolled-back", survivors: [] },
    });
  } finally {
    await rm(store, { recursive: true, force: true });
    await rm(source, { recursive: true, force: true });
  }
});

test("migration closes milestone references transactionally and rollback keeps closure", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-backlog-milestone-"));
  const source = await mkdtemp(join(tmpdir(), "quest-backlog-milestone-src-"));
  try {
    const tasks = join(source, "backlog", "tasks");
    await mkdir(tasks, { recursive: true });
    await writeFile(
      join(tasks, "TASK-M1.md"),
      `---\nid: TASK-M1\ntitle: Milestoned task\nstatus: To Do\nmilestone: Sprint One\n---\n\nBody.\n`,
    );
    const preview = await quest(store, [
      "migration",
      "backlog",
      "preview",
      "--source",
      source,
      "--json",
    ]);
    expect(preview.exitCode).toBe(0);
    const digest = JSON.parse(preview.stdout).data.digest;
    const apply = await quest(store, [
      "migration",
      "backlog",
      "apply",
      "--source",
      source,
      "--digest",
      digest,
      "--actor",
      "migration-owner",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(apply.exitCode).toBe(0);
    expect(JSON.parse(apply.stdout).data.state).toBe("applied");

    const viewed = await quest(store, ["task", "view", "TASK-M1", "--json"]);
    expect(JSON.parse(viewed.stdout).data.milestoneId).toBe("M-1");
    const milestone = await quest(store, [
      "milestone",
      "view",
      "M-1",
      "--json",
    ]);
    expect(milestone.exitCode).toBe(0);
    expect(JSON.parse(milestone.stdout).data).toMatchObject({
      id: "M-1",
      title: "Sprint One",
      taskIds: ["T-1"],
    });

    const rollback = await quest(store, [
      "migration",
      "backlog",
      "rollback",
      "--digest",
      digest,
      "--actor",
      "migration-owner",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(rollback.exitCode).toBe(0);
    expect(JSON.parse(rollback.stdout).data.state).toBe("rolled-back");
    const milestoneAfter = await quest(store, [
      "milestone",
      "view",
      "M-1",
      "--json",
    ]);
    expect(JSON.parse(milestoneAfter.stdout).data.taskIds).toEqual([]);
    const viewedAfter = await quest(store, [
      "task",
      "view",
      "TASK-M1",
      "--json",
    ]);
    expect(viewedAfter.exitCode).not.toBe(0);
  } finally {
    await rm(store, { recursive: true, force: true });
    await rm(source, { recursive: true, force: true });
  }
});

test("imported Backlog timestamps are normalised to ISO-8601 UTC (QCLI-152)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-backlog-timestamps-"));
  const source = await mkdtemp(join(tmpdir(), "quest-backlog-ts-source-"));
  try {
    const tasks = join(source, "backlog", "tasks");
    await mkdir(tasks, { recursive: true });
    // Backlog's three real shapes, plus one that is not a date at all.
    const fixtures: readonly (readonly [string, string, string])[] = [
      ["TASK-1", "2024-03-04 05:06", "2024-05-06 07:08"],
      ["TASK-2", "2024-03-05", "2024-03-05"],
      ["TASK-3", "2024-03-06T07:08:09.123Z", "2024-03-06T07:08:09.123Z"],
      ["TASK-4", "not a date", "also not a date"],
    ];
    for (const [id, created, updated] of fixtures)
      await writeFile(
        join(tasks, `${id}.md`),
        `---\nid: ${id}\ntitle: Dated ${id}\nstatus: To Do\ncreated_date: '${created}'\nupdated_date: '${updated}'\n---\n\nDated fixture.\n`,
      );

    const preview = await quest(store, [
      "migration",
      "backlog",
      "preview",
      "--source",
      source,
      "--json",
    ]);
    expect(preview.exitCode).toBe(0);
    const digest = JSON.parse(preview.stdout).data.digest;
    const applied = await quest(store, [
      "migration",
      "backlog",
      "apply",
      "--source",
      source,
      "--digest",
      digest,
      "--actor",
      "migration-owner",
      "--actor-kind",
      "human",
      "--json",
    ]);
    if (applied.exitCode !== 0) console.error(applied.stderr);
    expect(applied.exitCode).toBe(0);

    const read = async (reference: string) => {
      const viewed = await quest(store, ["task", "view", reference, "--json"]);
      expect(viewed.exitCode).toBe(0);
      return JSON.parse(viewed.stdout).data;
    };

    // Zone-less input reads as UTC, so the same file imports to the same
    // instant on every machine rather than following the host's chair.
    expect((await read("TASK-1")).createdAt).toBe("2024-03-04T05:06:00.000Z");
    expect((await read("TASK-1")).updatedAt).toBe("2024-05-06T07:08:00.000Z");
    // A bare date becomes midnight UTC: the canonical instant for that day.
    expect((await read("TASK-2")).createdAt).toBe("2024-03-05T00:00:00.000Z");
    // An already-canonical value survives unchanged.
    expect((await read("TASK-3")).createdAt).toBe("2024-03-06T07:08:09.123Z");

    // Unparseable input is dropped rather than becoming a wrong date — and is
    // not lost: the raw source form is still in the provenance blob.
    const unparseable = await read("TASK-4");
    expect(unparseable.createdAt).toBeUndefined();
    expect(unparseable.updatedAt).toBeUndefined();
    expect(JSON.parse(unparseable.summary).backlog.createdAt).toBe(
      "not a date",
    );

    // The point of all of the above: a mixed corpus sorts by time, not by
    // format. Ascending, the unparseable record sorts last as unknown.
    const listed = await quest(store, [
      "task",
      "list",
      "--sort",
      "createdAt:asc",
      "--json",
    ]);
    expect(listed.exitCode).toBe(0);
    const order = JSON.parse(listed.stdout).data.map(
      (task: { title: string }) => task.title,
    );
    expect(order).toEqual([
      "Dated TASK-1",
      "Dated TASK-2",
      "Dated TASK-3",
      "Dated TASK-4",
    ]);
  } finally {
    await rm(store, { recursive: true, force: true });
    await rm(source, { recursive: true, force: true });
  }
});
