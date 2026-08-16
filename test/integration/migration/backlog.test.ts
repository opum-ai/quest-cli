import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  BacklogImporter,
  assertNoBacklogCrossFolderCollisions,
} from "../../../src/adapters/migration/backlog/importer.ts";
import { RecordConflictError } from "../../../src/domain/records.ts";

const fixture = join(import.meta.dir, "../../fixtures/backlog/source");

async function git(
  directory: string,
  ...args: readonly string[]
): Promise<void> {
  const process = Bun.spawn(["git", "-C", directory, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  await process.exited;
  if (process.exitCode !== 0)
    throw new Error(await new Response(process.stderr).text());
}

test("inventories every lifecycle folder, preserves the public task fields, and reports cross-folder collisions", async () => {
  const snapshot = await new BacklogImporter(fixture).readSnapshot();
  expect(
    snapshot.records.map((record) => [
      record.sourceFolder,
      record.sourceIdentifier,
    ]),
  ).toEqual([
    ["active", "TASK-1"],
    ["archive/drafts", "DRAFT-2"],
    ["archive/tasks", "TASK-1"],
    ["completed", "TASK-2"],
    ["draft", "DRAFT-1"],
  ]);
  expect(snapshot.crossFolderDuplicateIds).toEqual(["TASK-1"]);
  await expect(
    Promise.resolve().then(() =>
      assertNoBacklogCrossFolderCollisions(snapshot),
    ),
  ).rejects.toBeInstanceOf(RecordConflictError);

  const active = snapshot.records.find(
    (record) => record.sourceFolder === "active",
  );
  expect(active).toMatchObject({
    title: "Active parent",
    status: "In Progress",
    priority: "high",
    type: "feature",
    assignees: ["@ada"],
    labels: ["migration", "urgent"],
    ordinal: 7,
    dependencies: ["TASK-9"],
    milestone: "m-1",
    references: ["https://example.test/reference"],
    documentation: ["docs/reference.md"],
    modifiedFiles: ["src/a.ts"],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  });
  expect(active?.acceptanceCriteria).toEqual([
    { index: 1, text: "Preserve the active record", checked: true },
    { index: 2, text: "Preserve pending state", checked: false },
  ]);
  expect(active?.implementationPlan).toBe("Plan text");
  expect(active?.implementationNotes).toBe("Notes text");
  expect(active?.finalSummary).toBe("Summary text");
  expect(active?.comments).toEqual([
    {
      index: 1,
      author: "@ada",
      createdAt: "2026-01-02T00:00:00Z",
      body: "Comment body",
    },
  ]);
  expect(active?.aliases).toHaveLength(1);
  expect(
    snapshot.records.find((record) => record.sourceIdentifier === "TASK-2")
      ?.aliases,
  ).toContain("TASK-2");
});

test("is byte-identical while unchanged, observes drift, and never changes the source", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcli-backlog-import-"));
  try {
    const source = join(directory, "backlog", "tasks", "task.md");
    await mkdir(join(directory, "backlog", "tasks"), { recursive: true });
    await Bun.write(
      source,
      await Bun.file(join(fixture, "backlog/tasks/task-1.md")).arrayBuffer(),
    );
    const before = await readFile(source);
    const importer = new BacklogImporter(directory);
    const first = await importer.readSnapshot();
    const second = await importer.readSnapshot();
    expect(second).toEqual(first);
    expect(await readFile(source)).toEqual(before);
    await writeFile(source, `${await Bun.file(source).text()}\n`);
    expect((await importer.readSnapshot()).fingerprint).not.toBe(
      first.fingerprint,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("preserves the Git commit and tracked blob without replaying source history", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcli-backlog-git-"));
  try {
    const source = join(directory, "backlog", "tasks", "task.md");
    await mkdir(join(directory, "backlog", "tasks"), { recursive: true });
    await Bun.write(
      source,
      await Bun.file(join(fixture, "backlog/tasks/task-1.md")).arrayBuffer(),
    );
    await git(directory, "init");
    await git(directory, "add", "backlog/tasks/task.md");
    await git(
      directory,
      "-c",
      "user.email=quest@example.test",
      "-c",
      "user.name=Quest Test",
      "commit",
      "-m",
      "source snapshot",
    );
    const record = (await new BacklogImporter(directory).readSnapshot())
      .records[0];
    expect(record?.git.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(record?.git.blob).toMatch(/^[0-9a-f]{40}$/);
    expect(record?.rawMarkdown).toContain("Active parent");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
