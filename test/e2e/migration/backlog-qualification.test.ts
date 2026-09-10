import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  assertNoBacklogCrossFolderCollisions,
  BacklogImporter,
} from "../../../src/adapters/migration/backlog/importer.ts";
import { RecordConflictError } from "../../../src/domain/records.ts";

const folders = [
  ["tasks", "active"],
  ["completed", "completed"],
  ["drafts", "draft"],
  ["archive/tasks", "archive/tasks"],
  ["archive/drafts", "archive/drafts"],
] as const;

function markdown(id: string, title: string, extra = ""): string {
  return `---
id: ${id}
title: ${title}
status: In Progress
type: decision
parent_task_id: OPS-0001
dependencies: [OPS-0002]
documentation: [docs/guides/\u00fcberblick.md]
references: [https://example.test/decision]
modified_files: [docs/decisions/${id}.md]
labels: [migration, unicode]
---

<!-- AC:BEGIN -->
- [x] #1 Preserve the approved relationship
<!-- AC:END -->

<!-- COMMENTS:BEGIN -->
author: @zo\u00eb
created: 2026-08-15T00:00:00Z
---
Comment for ${title}: \u00e5ngstr\u00f6m \ud83d\ude80
---
<!-- COMMENTS:END -->
${extra}`;
}

test("custom Backlog roots preserve lifecycle, padded IDs, Unicode, comments, documentation, and relationships", async () => {
  const root = await mkdtemp(join(tmpdir(), "qcli-backlog-qualification-"));
  try {
    for (const [directory] of folders)
      await mkdir(join(root, ".backlog", directory), { recursive: true });
    for (const [directory, lifecycle] of folders) {
      const id =
        lifecycle === "archive/tasks" || lifecycle === "completed"
          ? "OPS-0007"
          : `OPS-${lifecycle}`;
      await writeFile(
        join(root, ".backlog", directory, `${lifecycle.replace("/", "-")}.md`),
        markdown(id, `Lifecycle ${lifecycle}`),
      );
    }

    const snapshot = await new BacklogImporter(root, {
      backlogDirectory: ".backlog",
    }).readSnapshot();

    expect(snapshot.records.map((record) => record.lifecycleFolder)).toEqual([
      "active",
      "archive/drafts",
      "archive/tasks",
      "completed",
      "draft",
    ]);
    expect(snapshot.records).toHaveLength(5);
    expect(snapshot.crossFolderDuplicateIds).toEqual(["OPS-0007"]);
    const archived = snapshot.records.find(
      (record) => record.lifecycleFolder === "archive/tasks",
    );
    expect(archived).toMatchObject({
      sourceIdentifier: "OPS-0007",
      parentTaskId: "OPS-0001",
      dependencies: ["OPS-0002"],
      documentation: ["docs/guides/\u00fcberblick.md"],
      modifiedFiles: ["docs/decisions/OPS-0007.md"],
      comments: [
        {
          author: "@zo\u00eb",
          body: "Comment for Lifecycle archive/tasks: \u00e5ngstr\u00f6m \ud83d\ude80",
        },
      ],
    });
    expect(archived?.acceptanceCriteria).toEqual([
      { index: 1, text: "Preserve the approved relationship", checked: true },
    ]);
    await expect(
      Promise.resolve().then(() =>
        assertNoBacklogCrossFolderCollisions(snapshot),
      ),
    ).rejects.toBeInstanceOf(RecordConflictError);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a source change during scanning produces an immutable captured snapshot and a new later fingerprint", async () => {
  const root = await mkdtemp(join(tmpdir(), "qcli-backlog-fingerprint-"));
  const originalBunFile = Bun.file;
  try {
    const source = join(root, "backlog", "tasks", "A-OPS-0007.md");
    const laterSource = join(root, "backlog", "tasks", "Z-OPS-0008.md");
    const initial = markdown("OPS-0007", "Initial decision");
    const changed = markdown("OPS-0007", "Changed during scan");
    await mkdir(join(root, "backlog", "tasks"), { recursive: true });
    await writeFile(source, initial);
    await writeFile(laterSource, markdown("OPS-0008", "Later decision"));
    const importer = new BacklogImporter(root);
    const first = await importer.readSnapshot();
    const repeat = await importer.readSnapshot();
    expect(repeat).toEqual(first);
    expect(await Bun.file(source).text()).toBe(initial);

    let mutatedDuringScan = false;
    Bun.file = ((path: string | URL) => {
      const file = originalBunFile(path);
      if (!String(path).endsWith("A-OPS-0007.md") || mutatedDuringScan)
        return file;
      return {
        ...file,
        async arrayBuffer() {
          const bytes = await file.arrayBuffer();
          await writeFile(source, changed);
          mutatedDuringScan = true;
          return bytes;
        },
      };
    }) as typeof Bun.file;

    const captured = await importer.readSnapshot();
    expect(mutatedDuringScan).toBeTrue();
    expect(captured).toEqual(first);
    expect(await Bun.file(source).text()).toBe(changed);

    const after = await importer.readSnapshot();
    expect(after.fingerprint).not.toBe(first.fingerprint);
    expect(after.records[0]?.title).toBe("Changed during scan");
  } finally {
    Bun.file = originalBunFile;
    await rm(root, { recursive: true, force: true });
  }
});
