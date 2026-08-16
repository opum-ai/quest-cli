import { expect, test } from "bun:test";

import {
  LoreBacklogCli,
  type LoreCliRunner,
} from "../../../src/adapters/lore/backlog-cli.ts";
import {
  BacklogLoreMigrationSaga,
  partitionBacklogRecords,
} from "../../../src/application/migration/backlog-knowledge.ts";
import type { MigrationPreview } from "../../../src/domain/migration/migration.ts";

const source = {
  id: "backlog/decisions/decision-1",
  type: "decision",
  path: "backlog/decisions/decision-1.md",
  digest: "sha256:source",
};

const lorePreview = {
  migration: "lore-migration-1",
  source: { id: "backlog:/repo", revision: "abc123" },
  records: [
    {
      source,
      type: "ADR",
      id: "adr/adopted-decision",
      path: "docs/adr/adopted-decision.md",
      contentDigest: "sha256:concept",
      collision: null,
      fidelityGap: null,
    },
  ],
  approval: {
    schema: "lore-backlog-adoption-plan/1",
    migration: "lore-migration-1",
    manifestDigest: "sha256:manifest",
    proposedArtifactDigest: "sha256:artifacts",
    digest: "sha256:approval",
  },
};

const questPreview: MigrationPreview = {
  exitCode: 0,
  requiresApproval: true,
  digest: "quest-approval",
  plan: {
    sourceInstance: "backlog:/repo",
    sourceFingerprint: "source-fingerprint",
    targetFingerprint: "quest-fingerprint",
    entries: [],
  },
};

function envelope(kind: string, data: unknown) {
  return JSON.stringify({ schemaVersion: 1, kind, data });
}

class Runner implements LoreCliRunner {
  readonly calls: string[][] = [];
  applyFails = false;
  async run(argv: readonly string[]) {
    this.calls.push([...argv]);
    const operation = argv[3];
    if (operation === "preview")
      return {
        exitCode: 0,
        stderr: "",
        stdout: envelope("backlog.adoption.preview", lorePreview),
      };
    if (operation === "apply") {
      if (this.applyFails)
        return { exitCode: 6, stderr: "write denied", stdout: "" };
      return {
        exitCode: 0,
        stderr: "",
        stdout: envelope("backlog.adoption.apply", {
          migration: "lore-migration-1",
          state: "applied",
          created: [
            {
              id: "adr/adopted-decision",
              path: "docs/adr/adopted-decision.md",
              contentDigest: "sha256:concept",
              removed: false,
            },
          ],
        }),
      };
    }
    return {
      exitCode: 0,
      stderr: "",
      stdout: envelope(`backlog.adoption.${operation}`, {
        migration: "lore-migration-1",
        state: "rolled-back",
        created: [
          {
            id: "adr/adopted-decision",
            path: "docs/adr/adopted-decision.md",
            contentDigest: "sha256:concept",
            removed: true,
          },
        ],
      }),
    };
  }
}

function quest(failure = false) {
  const calls: string[] = [];
  return {
    calls,
    service: {
      async preview() {
        calls.push("preview");
        return questPreview;
      },
      async apply() {
        calls.push("apply");
        return failure
          ? { kind: "conflict" as const }
          : { kind: "success" as const };
      },
      async rollback() {
        calls.push("rollback");
        return { removed: [], manualReconciliation: [] };
      },
    },
  };
}

test("issue-only adoption has no Lore dependency", async () => {
  const runner = new Runner();
  const target = quest();
  const saga = new BacklogLoreMigrationSaga(
    target.service as never,
    new LoreBacklogCli(runner),
  );
  await expect(saga.previewIssues()).resolves.toEqual(questPreview);
  await expect(
    saga.applyIssues(questPreview, "quest-approval"),
  ).resolves.toEqual({ kind: "success" });
  expect(runner.calls).toEqual([]);
});

test("full adoption is Lore-first, retains stable IDs, and rolls both products back on Quest failure", async () => {
  const runner = new Runner();
  const target = quest(true);
  const saga = new BacklogLoreMigrationSaga(
    target.service as never,
    new LoreBacklogCli(runner),
  );
  const knowledge = [
    {
      id: source.id,
      path: source.path,
      content: "# Decision",
      kind: "decision" as const,
    },
  ];
  const preview = await saga.previewFull(".quest/adoption.json", knowledge);
  const result = await saga.applyFull(
    preview,
    preview.digest,
    ".quest/adoption.json",
  );
  expect(result).toMatchObject({ kind: "compensated", survivors: [] });
  expect(target.calls).toEqual(["preview", "apply", "rollback"]);
  expect(runner.calls.map((call) => call.slice(1, 4))).toEqual([
    ["backlog", "adopt", "preview"],
    ["backlog", "adopt", "apply"],
    ["backlog", "adopt", "rollback"],
  ]);
});

test("a completed full adoption returns Lore's stable concept IDs for Quest linkage", async () => {
  const runner = new Runner();
  const target = quest();
  const saga = new BacklogLoreMigrationSaga(
    target.service as never,
    new LoreBacklogCli(runner),
  );
  const knowledge = [
    {
      id: source.id,
      path: source.path,
      content: "# Decision",
      kind: "decision" as const,
    },
  ];
  const preview = await saga.previewFull(".quest/adoption.json", knowledge);
  await expect(
    saga.applyFull(preview, preview.digest, ".quest/adoption.json"),
  ).resolves.toMatchObject({
    kind: "success",
    conceptLinks: [{ sourceId: source.id, conceptId: "adr/adopted-decision" }],
  });
});

test("partitioning validates knowledge independently and builds only released Lore source types", () => {
  const partition = partitionBacklogRecords(
    ["issue-1"],
    [
      {
        id: source.id,
        path: source.path,
        content: "# Decision",
        kind: "decision",
      },
    ],
  );
  expect(partition.issues).toEqual(["issue-1"]);
  expect(BacklogLoreMigrationSaga.manifestRecords(partition.knowledge)).toEqual(
    [
      {
        id: source.id,
        path: source.path,
        content: "# Decision",
        type: "decision",
      },
    ],
  );
  expect(() =>
    partitionBacklogRecords(
      [],
      [{ id: "bad", path: "../escape", content: "x", kind: "other" }],
    ),
  ).toThrow("backlog_knowledge_path_invalid");
});
