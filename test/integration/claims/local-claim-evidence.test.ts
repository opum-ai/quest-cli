import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  GitSnapshotEvidence,
  LocalTaskRelationshipCasWriter,
  safeStorageName,
  validateRelationshipRecord,
} from "../../../src/adapters/claims/local-claim-evidence.ts";
import { LocalGitPort } from "../../../src/adapters/git/local-git.ts";
import { OpumAgentWorkflowError } from "../../../src/domain/claims/opum-agent-workflow.ts";

const validRecord = {
  schemaVersion: 1 as const,
  id: "corr-1",
  taskId: "T-1",
  kind: "correlation" as const,
  state: "accepted" as const,
  holder: "agent-1",
  baseRef: "origin/dev",
  settlementRef: "origin/dev",
};

let root = "";

async function git(args: string[], stdin?: string) {
  const child = Bun.spawn(["git", "-C", root, ...args], {
    stdin: stdin === undefined ? "ignore" : new TextEncoder().encode(stdin),
    stdout: "pipe",
    stderr: "pipe",
  });
  const code = await child.exited;
  const stdout = await new Response(child.stdout).text();
  const stderr = await new Response(child.stderr).text();
  if (code !== 0) throw new Error(stderr);
  return stdout.trim();
}

async function store() {
  root = await mkdtemp(join(tmpdir(), "quest-storage-"));
  await git(["init", "-q", "-b", "main"]);
  await git(["config", "user.email", "t@t"]);
  await git(["config", "user.name", "t"]);
  await git(["commit", "--allow-empty", "-m", "init"]);
}

async function teardown() {
  await rm(root, { recursive: true, force: true });
}

/**
 * Test-only fixture seeding through real Git commands (no production
 * backdoor). Builds a temporary index from the parent commit so previously
 * committed (possibly index-only) evidence is preserved.
 */
async function commitFiles(files: Record<string, string>): Promise<string> {
  const env = {
    GIT_INDEX_FILE: join(root, `.quest-fixture-${Date.now()}.index`),
  };
  const gitWithIndex = (args: string[]) => {
    const child = Bun.spawn(["git", "-C", root, ...args], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...Bun.env, ...env },
    });
    return child;
  };
  const parent = await git(["rev-parse", "HEAD"]);
  let child = gitWithIndex(["read-tree", parent]);
  if ((await child.exited) !== 0) throw new Error("read-tree failed");
  for (const [path, content] of Object.entries(files)) {
    const blob = await git(["hash-object", "-w", "--stdin"], content);
    child = gitWithIndex([
      "update-index",
      "--add",
      "--cacheinfo",
      `100644,${blob.trim()},${path}`,
    ]);
    if ((await child.exited) !== 0) throw new Error("update-index failed");
  }
  const treeChild = gitWithIndex(["write-tree"]);
  const code = await treeChild.exited;
  if (code !== 0) throw new Error("write-tree failed");
  const tree = await new Response(treeChild.stdout).text();
  const commit = await git([
    "commit-tree",
    tree.trim(),
    "-p",
    parent,
    "-m",
    "fixture",
  ]);
  await git(["update-ref", "HEAD", commit.trim()]);
  return commit.trim();
}

function codeOf(error: unknown): string | undefined {
  if (error instanceof OpumAgentWorkflowError) return error.code;
  return undefined;
}

describe("closed authoritative relationship schema (Git-object content)", () => {
  test("accepts the exact valid record", () => {
    expect(validateRelationshipRecord(validRecord, "corr-1")).toMatchObject({
      id: "corr-1",
      kind: "correlation",
    });
  });

  const defects: Record<string, Record<string, unknown>> = {
    extraField: { ...validRecord, extra: true },
    unknownKind: { ...validRecord, kind: "partnership" },
    unknownState: { ...validRecord, state: "pending" },
    missingBaseRef: (() => {
      const { baseRef: _drop, ...rest } = validRecord;
      return rest;
    })(),
    emptySettlementRef: { ...validRecord, settlementRef: "" },
    wrongIdType: { ...validRecord, id: 7 },
    mismatchedInternalId: { ...validRecord, id: "other" },
    emptyTaskId: { ...validRecord, taskId: "" },
    numericSchemaVersion: { ...validRecord, schemaVersion: "1" },
    claimWithHolder: { ...validRecord, kind: "claim" },
    correlationWithoutHolder: (() => {
      const { holder: _drop, ...rest } = validRecord;
      return rest;
    })(),
    malformedJsonText: undefined as never,
  };

  test.each(Object.entries(defects))(
    "rejects %s with INCOMPATIBLE",
    async (_name, defect) => {
      await store();
      try {
        const git = new LocalGitPort();
        // The reader addresses blobs by the SHA-256 of the requested identity
        // ("corr-1"); seed the defective content at exactly that path so only
        // the internal schema/id validation can reject it.
        const requestedId = "corr-1";
        const path = `.quest/relationships/${safeStorageName(requestedId)}.json`;
        const malformedRecord = _name === "malformedJsonText";
        const content = malformedRecord ? "{not json" : JSON.stringify(defect);

        // Seed the defective blob through fixture Git commands only.
        await commitFiles({ [path]: content });
        const revision = await git.readRevision(root, "HEAD");
        const snapshot = new GitSnapshotEvidence(git, root, revision);

        let thrown: unknown;
        try {
          await snapshot.relationship(requestedId);
        } catch (error) {
          thrown = error;
        }
        expect(codeOf(thrown)).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
      } finally {
        await teardown();
      }
    },
  );
});

describe("CAS relationship writer", () => {
  test("commits atomically and refuses stale revisions without lost updates", async () => {
    await store();
    const git = new LocalGitPort();
    const writer = new LocalTaskRelationshipCasWriter(git, root);
    const base = await git.readRevision(root, "HEAD");
    const first = await writer.write({
      record: validRecord,
      expectedRevision: base,
      operationId: "op-1",
    });
    expect(first.kind).toBe("success");
    const afterFirst = await git.readRevision(root, "HEAD");
    // A second write pinned to the same stale base must conflict.
    const stale = await writer.write({
      record: validRecord,
      expectedRevision: base,
      operationId: "op-2",
    });
    expect(stale).toMatchObject({
      kind: "conflict",
      actualRevision: afterFirst,
    });
    // The committed record remains readable and unmodified.
    const snapshot = new GitSnapshotEvidence(git, root, afterFirst);
    expect(await snapshot.relationship("corr-1")).toMatchObject({
      id: "corr-1",
    });
    await teardown();
  });

  test("write cannot escape the relationships tree", async () => {
    await store();
    const git = new LocalGitPort();
    const writer = new LocalTaskRelationshipCasWriter(git, root);
    const base = await git.readRevision(root, "HEAD");
    const escaped = await writer.write({
      record: { ...validRecord, id: "../../escape" },
      expectedRevision: base,
      operationId: "op-escape",
    });
    // The opaque id is hashed, so the escape attempt lands on a fixed
    // in-tree hashed path and never at the literal traversal location.
    expect(escaped.kind).toBe("success");
    const files = await git.listFiles(
      root,
      await git.readRevision(root, "HEAD"),
      ".quest/relationships",
    );
    expect(files.every((file) => !file.includes(".."))).toBe(true);
    await teardown();
  });
});

describe("hostile worktree symlinks are irrelevant to pinned reads", () => {
  test("symlinked evidence files do not affect snapshot reads or writes", async () => {
    await store();
    const git = new LocalGitPort();
    const writer = new LocalTaskRelationshipCasWriter(git, root);
    const base = await git.readRevision(root, "HEAD");
    await writer.write({
      record: validRecord,
      expectedRevision: base,
      operationId: "op-seed",
    });
    // Hostile worktree symlinks over every evidence location.
    await mkdir(join(root, ".quest", "relationships"), { recursive: true });
    const outside = join(root, "outside.json");
    await writeFile(outside, "outside-content");
    const recordPath = join(
      root,
      ".quest",
      "relationships",
      `${safeStorageName("corr-1")}.json`,
    );
    await rm(recordPath, { force: true });
    await symlink(outside, recordPath);
    const revision = await git.readRevision(root, "HEAD");
    const snapshot = new GitSnapshotEvidence(git, root, revision);
    expect(await snapshot.relationship("corr-1")).toMatchObject({
      id: "corr-1",
    });
    // Outside file untouched.
    expect(await Bun.file(outside).text()).toBe("outside-content");
    await teardown();
  });
});

import { LocalClaimRepository } from "../../../src/adapters/claims/local-claim-evidence.ts";
import { ClaimService } from "../../../src/domain/../application/claims/claims.ts";

describe("production ClaimRepository + ClaimService E2E", () => {
  test("claim, renewal, and binding seam agree on live identity semantics", async () => {
    await store();
    const git = new LocalGitPort();
    // Seed a full valid task record so the snapshot resolves the canonical id.
    const { taskState } = await import("../../../src/domain/tasks/tasks.ts");
    const taskRecord = taskState({
      id: "T-1",
      aliases: [],
      title: "Bound",
      status: "In Progress",
      acceptanceCriteria: [],
      definitionOfDone: [],
      plan: [],
      implementationNotes: [],
      comments: [],
      labels: [],
      documentation: [],
      dependencies: [],
      gateEvents: [],
      gates: [],
      blockers: [],
    });
    await commitFiles({
      ".quest/tasks/T-1.json": JSON.stringify(taskRecord),
      ".quest/claims/actors.json": JSON.stringify([
        { id: "human", kind: "human", roles: ["maintainer"] },
        {
          id: "agent-1",
          kind: "delegated-agent",
          accountableHumanId: "human",
          roles: [],
        },
      ]),
    });
    const repository = new LocalClaimRepository(git, root);
    const claims = new ClaimService(repository);
    const now = new Date();
    const claimed = await claims.claim({
      reference: "T-1",
      actorId: "agent-1",
      generation: "g1",
      eventId: "corr-e1",
      operationId: "op-1",
      at: now,
    });
    expect(claimed.kind).toBe("success");
    const postClaimRevision = await git.readRevision(root, "HEAD");

    // Renewal through the same production writer keeps the identity live.
    const renewed = await claims.heartbeat({
      reference: "T-1",
      actorId: "agent-1",
      generation: "g1",
      eventId: "corr-e2",
      operationId: "op-2",
      at: new Date(now.getTime() + 60_000),
    });
    expect(renewed.kind).toBe("success");

    // The public binding seam reads the committed snapshot.
    const postRenewal = await git.readRevision(root, "HEAD");
    const preSnapshot = new GitSnapshotEvidence(git, root, postRenewal);
    expect((await preSnapshot.events("T-1")).length).toBe(2);

    // Bind through the public seam from the committed snapshot. The
    // relationship is created by the production CAS writer, not fixtures.
    const relWriter = new LocalTaskRelationshipCasWriter(git, root);
    const relHead = await git.readRevision(root, "HEAD");
    const relResult = await relWriter.write({
      record: {
        schemaVersion: 1,
        id: "corr-e1",
        taskId: "T-1",
        kind: "claim",
        state: "accepted",
        baseRef: "origin/dev",
        settlementRef: "origin/dev",
      },
      expectedRevision: relHead,
      operationId: "rel-1",
    });
    expect(relResult.kind).toBe("success");
    const { OpumAgentWorkflowBindingService } = await import(
      "../../../src/application/claims/opum-agent-workflow.ts"
    );
    const revision = await git.readRevision(root, "HEAD");
    const evidence = new GitSnapshotEvidence(git, root, revision);
    const binding = new OpumAgentWorkflowBindingService({
      subject: (reference) => evidence.task(reference),
      claimEvents: (taskId) => evidence.events(taskId),
      actors: () => evidence.actors(),
      relationship: (id) => evidence.relationship(id),
      repositoryId: async () => "/repo/common",
    });
    const response = await binding.bind({
      contract: "opum-agent-workflow/v1",
      taskId: "T-1",
      claimOrCorrelationId: "corr-e1",
      holder: "agent-1",
      repositoryId: "/repo/common",
      baseRef: "origin/dev",
      settlementRef: "origin/dev",
      requestId: "a".repeat(32),
    });
    expect(Object.keys(response).sort()).toEqual(
      [
        "baseRef",
        "contract",
        "expiresAt",
        "holder",
        "issuedAt",
        "relationshipId",
        "relationshipKind",
        "relationshipState",
        "repositoryId",
        "requestId",
        "selectedVersion",
        "settlementRef",
        "taskId",
        "taskState",
      ].sort(),
    );
    expect(response).toMatchObject({
      contract: "opum-agent-workflow",
      selectedVersion: 1,
      taskId: "T-1",
      holder: "agent-1",
      taskState: "in_progress",
      relationshipKind: "claim",
      relationshipId: "corr-e1",
      relationshipState: "active",
    });

    // A stale expected revision conflicts instead of losing updates.
    const staleAppend = await repository.append({
      event: {
        eventId: "stale",
        operationId: "op-stale",
        taskId: "T-1",
        kind: "renewed",
        generation: "g1",
        holderId: "agent-1",
        accountableHumanId: "human",
        at: new Date().toISOString(),
      },
      expectedRevision: postClaimRevision,
      operationId: "op-stale",
      ownedPaths: [".quest/claims/T-1.jsonl"],
    });
    expect(staleAppend.kind).toBe("conflict");
    await teardown();
  });
});

describe("snapshot task resolution", () => {
  const fullTask = (overrides: Record<string, unknown>) => {
    const { taskState } = require("../../../src/domain/tasks/tasks.ts") as {
      taskState: (value: unknown) => unknown;
    };
    return taskState({
      id: "T-1",
      aliases: [],
      title: "Bound",
      status: "In Progress",
      acceptanceCriteria: [],
      definitionOfDone: [],
      plan: [],
      implementationNotes: [],
      comments: [],
      labels: [],
      documentation: [],
      dependencies: [],
      gateEvents: [],
      gates: [],
      blockers: [],
      ...overrides,
    });
  };

  test("malformed committed task records are INCOMPATIBLE, never skipped", async () => {
    await store();
    await commitFiles({
      ".quest/tasks/T-1.json": JSON.stringify({ id: "T-1" }),
    });
    const git = new LocalGitPort();
    const revision = await git.readRevision(root, "HEAD");
    const snapshot = new GitSnapshotEvidence(git, root, revision);
    let thrown: unknown;
    try {
      await snapshot.task("T-1");
    } catch (error) {
      thrown = error;
    }
    expect(codeOf(thrown)).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
    await teardown();
  });

  test("duplicate canonical ids and colliding aliases are rejected", async () => {
    await store();
    const record = fullTask({});
    const duplicate = fullTask({ id: "T-1", title: "Copy" });
    await commitFiles({
      ".quest/tasks/a.json": JSON.stringify(record),
      ".quest/tasks/b.json": JSON.stringify(duplicate),
    });
    let git = new LocalGitPort();
    let snapshot = new GitSnapshotEvidence(
      git,
      root,
      await git.readRevision(root, "HEAD"),
    );
    const repository = new LocalClaimRepository(git, root);
    // Duplicate canonical ids must fail closed in read() itself with the
    // discriminating validation message (proving the duplicate branch ran).
    let thrown: unknown;
    const { RecordValidationError } = await import(
      "../../../src/domain/records.ts"
    );
    try {
      await repository.read();
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(RecordValidationError);
    expect((thrown as Error).message).toBe("Duplicate canonical task id.");
    await teardown();

    await store();
    const aliasA = fullTask({ id: "T-1", aliases: ["dup"] });
    const aliasB = fullTask({ id: "T-2", aliases: ["dup"] });
    await commitFiles({
      ".quest/tasks/a.json": JSON.stringify(aliasA),
      ".quest/tasks/b.json": JSON.stringify(aliasB),
    });
    git = new LocalGitPort();
    snapshot = new GitSnapshotEvidence(
      git,
      root,
      await git.readRevision(root, "HEAD"),
    );
    const aliasRepository = new LocalClaimRepository(git, root);
    // Alias collision must be discriminated from other failures.
    let aliasThrown: unknown;
    try {
      await aliasRepository.read();
    } catch (error) {
      aliasThrown = error;
    }
    expect(aliasThrown).toBeInstanceOf(RecordValidationError);
    expect((aliasThrown as Error).message).toBe("Duplicate task alias.");
    // And through the binding seam as a stable workflow error.
    let workflowThrown: unknown;
    try {
      await snapshot.task("dup");
    } catch (error) {
      workflowThrown = error;
    }
    expect(codeOf(workflowThrown)).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
    await teardown();
  });

  test("hostile uncommitted or symlinked task records cannot influence binding", async () => {
    await store();
    const record = fullTask({});
    const commit = await commitFiles({
      ".quest/tasks/T-1.json": JSON.stringify(record),
    });
    // Hostile uncommitted replacement plus a symlink pointing outside.
    await mkdir(join(root, ".quest", "tasks"), { recursive: true });
    await writeFile(
      join(root, ".quest", "tasks", "T-1.json"),
      '{"id":"EVIL","status":"Done"}',
    );
    const outsideFile = join(root, "outside-task.json");
    await writeFile(outsideFile, '{"id":"EVIL","status":"Done"}');
    const { rm: rmPath, symlink } = await import("node:fs/promises");
    await rmPath(join(root, ".quest", "tasks", "T-1.json"), { force: true });
    await symlink(outsideFile, join(root, ".quest", "tasks", "T-1.json"));
    const git = new LocalGitPort();
    const snapshot = new GitSnapshotEvidence(git, root, commit);
    const resolved = await snapshot.task("T-1");
    expect(resolved).toEqual({ id: "T-1", status: "In Progress" });
    await teardown();
  });
});

describe("malicious claim owned paths", () => {
  test("append rejects any path other than the derived canonical path", async () => {
    await store();
    const git = new LocalGitPort();
    const writer = new LocalTaskRelationshipCasWriter(git, root);
    const seedRevision = await git.readRevision(root, "HEAD");
    const { taskState } = require("../../../src/domain/tasks/tasks.ts") as {
      taskState: (value: unknown) => unknown;
    };
    await commitFiles({
      ".quest/tasks/T-1.json": JSON.stringify(
        taskState({
          id: "T-1",
          aliases: [],
          title: "Bound",
          status: "In Progress",
          acceptanceCriteria: [],
          definitionOfDone: [],
          plan: [],
          implementationNotes: [],
          comments: [],
          labels: [],
          documentation: [],
          dependencies: [],
          gateEvents: [],
          gates: [],
          blockers: [],
        }),
      ),
    });
    const repository = new LocalClaimRepository(git, root);
    const event = {
      eventId: "corr-e1",
      operationId: "op-1",
      taskId: "T-1",
      kind: "claimed" as const,
      generation: "g1",
      holderId: "agent-1",
      accountableHumanId: "human",
      at: new Date().toISOString(),
    };
    const before = await git.readRevision(root, "HEAD");
    for (const ownedPaths of [
      ["AGENTS.md"],
      ["../../escape.jsonl"],
      [".quest/tasks/T-1.json"],
      [".quest/claims/T-1.jsonl", ".quest/claims/extra.jsonl"],
      [],
    ]) {
      let thrown: unknown;
      try {
        await repository.append({
          event,
          expectedRevision: before,
          operationId: "op-malicious",
          ownedPaths,
        });
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toMatch(/owned_path|task_id/);
    }
    // Revision unchanged: nothing was committed.
    expect(await git.readRevision(root, "HEAD")).toBe(before);
    void writer;
    void seedRevision;
    await teardown();
  });
});

describe("canonical authoritative-task and owned-path hardening", () => {
  test("append rejects invalid canonical ids and foreign owned paths, leaving the revision unchanged", async () => {
    await store();
    const git = new LocalGitPort();
    const { taskState } = await import("../../../src/domain/tasks/tasks.ts");
    await commitFiles({
      ".quest/tasks/T-1.json": JSON.stringify(
        taskState({
          id: "T-1",
          aliases: [],
          title: "Bound",
          status: "In Progress",
          acceptanceCriteria: [],
          definitionOfDone: [],
          plan: [],
          implementationNotes: [],
          comments: [],
          labels: [],
          documentation: [],
          dependencies: [],
          gateEvents: [],
          gates: [],
          blockers: [],
        }),
      ),
    });
    const before = await git.readRevision(root, "HEAD");
    const repository = new LocalClaimRepository(git, root);
    const at = new Date().toISOString();
    const cases: {
      taskId: unknown;
      ownedPaths: readonly string[];
    }[] = [
      { taskId: "AGENTS.md", ownedPaths: ["AGENTS.md"] },
      { taskId: "T-1", ownedPaths: ["AGENTS.md"] },
      { taskId: "T-1", ownedPaths: ["foo/arbitrary"] },
      { taskId: "T-0", ownedPaths: [".quest/claims/T-0.jsonl"] },
      { taskId: "T-01", ownedPaths: [".quest/claims/T-01.jsonl"] },
      { taskId: 7, ownedPaths: [".quest/claims/7.jsonl"] },
      { taskId: "T-1", ownedPaths: [".quest/claims/T-1.jsonl", "extra"] },
      { taskId: "T-1", ownedPaths: [] },
    ];
    for (const partial of cases) {
      let thrown: unknown;
      try {
        await repository.append({
          event: {
            eventId: `e-${Math.random()}`,
            operationId: "op-hardening",
            taskId: partial.taskId as string,
            kind: "claimed",
            generation: "g1",
            holderId: "agent-1",
            accountableHumanId: "human",
            at,
          },
          expectedRevision: before,
          operationId: "op-hardening",
          ownedPaths: partial.ownedPaths,
        });
      } catch (error) {
        thrown = error;
      }
      expect(thrown, JSON.stringify(partial)).toBeInstanceOf(Error);
    }
    expect(await git.readRevision(root, "HEAD")).toBe(before);
    // The tree is unchanged too: same file set as before the rejections.
    const filesBefore = await git.listFiles(root, before, ".quest");
    const filesAfter = await git.listFiles(
      root,
      await git.readRevision(root, "HEAD"),
      ".quest",
    );
    expect(filesAfter).toEqual(filesBefore);
    await teardown();
  });

  test("read rejects malformed task metadata, duplicate ids, and alias ambiguity via ClaimRepository.read", async () => {
    const seeds: Record<string, string>[] = [
      { ".quest/tasks/bad.json": '{"id":"T-9"}' },
      {
        ".quest/tasks/a.json": JSON.stringify({ id: "T-1", aliases: [] }),
        ".quest/tasks/b.json": JSON.stringify({ id: "T-1", aliases: [] }),
      },
      {
        ".quest/tasks/a.json": JSON.stringify({
          id: "T-1",
          aliases: ["x"],
          title: "t",
          status: "To Do",
        }),
        ".quest/tasks/b.json": JSON.stringify({
          id: "T-2",
          aliases: ["x"],
          title: "t",
          status: "To Do",
        }),
      },
    ];
    for (const seed of seeds) {
      await store();
      const git = new LocalGitPort();
      await commitFiles(seed);
      const repository = new LocalClaimRepository(git, root);
      let thrown: unknown;
      try {
        await repository.read();
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeInstanceOf(Error);
      await teardown();
    }
  });
});
