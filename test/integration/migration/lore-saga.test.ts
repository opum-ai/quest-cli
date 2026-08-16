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
  digest:
    "sha256:b4734ba2a7829512df65642011022fa73b774eab532a965cd83608c41061c3fe",
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
  rollbackFails = false;
  statusFails = false;
  previewSourceType: string | undefined;
  previewSourceDigest: string | undefined;
  createdPath: string | undefined;
  async run(argv: readonly string[]) {
    this.calls.push([...argv]);
    const operation = argv[3];
    if (operation === "preview")
      return {
        exitCode: 0,
        stderr: "",
        stdout: envelope("backlog.adoption.preview", {
          ...lorePreview,
          records: lorePreview.records.map((record) => ({
            ...record,
            source: {
              ...record.source,
              ...(this.previewSourceType
                ? { type: this.previewSourceType }
                : {}),
              ...(this.previewSourceDigest
                ? { digest: this.previewSourceDigest }
                : {}),
            },
          })),
        }),
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
              path: this.createdPath ?? "docs/adr/adopted-decision.md",
              contentDigest: "sha256:concept",
              removed: false,
            },
          ],
        }),
      };
    }
    if (operation === "rollback" && this.rollbackFails)
      return { exitCode: 6, stderr: "rollback denied", stdout: "" };
    if (operation === "status" && this.statusFails)
      return { exitCode: 6, stderr: "status denied", stdout: "" };
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

test("a Quest conflict is blocked without risking rollback of an unrelated Quest migration", async () => {
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
  expect(result).toMatchObject({
    kind: "blocked-incomplete",
    survivors: ["quest:rollback-unknown"],
    compensationEvidence: ["quest:rollback-not-owned", "lore:rollback-receipt"],
  });
  expect(target.calls).toEqual(["preview", "apply"]);
  expect(runner.calls.map((call) => call.slice(1, 4))).toEqual([
    ["backlog", "adopt", "preview"],
    ["backlog", "adopt", "apply"],
    ["backlog", "adopt", "rollback"],
  ]);
});

test("a stale preview source or receipt mapping cannot be applied", async () => {
  const typeRunner = new Runner();
  typeRunner.previewSourceType = "unsupported";
  const typeSaga = new BacklogLoreMigrationSaga(
    quest().service as never,
    new LoreBacklogCli(typeRunner),
  );
  const knowledge = [
    {
      id: source.id,
      path: source.path,
      content: "# Decision",
      kind: "decision" as const,
    },
  ];
  await expect(
    typeSaga.previewFull(".quest/adoption.json", knowledge),
  ).rejects.toThrow("unknown Backlog knowledge type");

  const digestRunner = new Runner();
  digestRunner.previewSourceDigest = "sha256:stale";
  const digestSaga = new BacklogLoreMigrationSaga(
    quest().service as never,
    new LoreBacklogCli(digestRunner),
  );
  await expect(
    digestSaga.previewFull(".quest/adoption.json", knowledge),
  ).rejects.toThrow("lore_knowledge_preview_source_mismatch");

  const receiptRunner = new Runner();
  receiptRunner.createdPath = "docs/adr/tampered.md";
  const target = quest();
  const receiptSaga = new BacklogLoreMigrationSaga(
    target.service as never,
    new LoreBacklogCli(receiptRunner),
  );
  const preview = await receiptSaga.previewFull(
    ".quest/adoption.json",
    knowledge,
  );
  await expect(
    receiptSaga.applyFull(preview, preview.digest, ".quest/adoption.json"),
  ).resolves.toMatchObject({ kind: "compensated", survivors: [] });
  expect(target.calls).toEqual(["preview"]);
});

test("unknown rollback and status boundaries remain blocked with explicit evidence", async () => {
  const runner = new Runner();
  runner.rollbackFails = true;
  runner.statusFails = true;
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
  await expect(
    saga.applyFull(preview, preview.digest, ".quest/adoption.json"),
  ).resolves.toMatchObject({
    kind: "blocked-incomplete",
    survivors: [
      "lore:adr/adopted-decision",
      "lore:rollback-unknown",
      "quest:rollback-unknown",
    ],
    compensationEvidence: ["quest:rollback-not-owned", "lore:rollback-unknown"],
  });
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
