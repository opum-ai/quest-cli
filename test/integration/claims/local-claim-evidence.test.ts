import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

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

async function git(args: string[]) {
  const child = Bun.spawn(["git", "-C", root, ...args], {
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
  await git([
    "-c",
    "user.email=t@t",
    "-c",
    "user.name=t",
    "commit",
    "--allow-empty",
    "-m",
    "init",
  ]);
}

async function teardown() {
  await rm(root, { recursive: true, force: true });
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
        const parent = await git.readRevision(root, "HEAD");
        const malformed = defect === undefined;
        // The reader addresses blobs by the SHA-256 of the requested identity
        // ("corr-1"); seed the defective content at exactly that path so only
        // the internal schema/id validation can reject it.
        const requestedId = "corr-1";
        const path = `.quest/relationships/${safeStorageName(requestedId)}.json`;
        const content = malformed ? "{not json" : JSON.stringify(defect);

        // Seed the blob through the CAS writer's own commit seam.
        const writer = new LocalTaskRelationshipCasWriter(git, root);
        const result = await writer.writeRaw(parent, path, content);
        expect(result.kind).toBe("success");
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
    // Seed a task record so the claim snapshot can resolve the canonical id.
    const base = await git.readRevision(root, "HEAD");
    const writer = new LocalTaskRelationshipCasWriter(git, root);
    let seed = base;
    const taskSeed = await writer.writeRaw(
      seed,
      ".quest/tasks/T-1.json",
      JSON.stringify({ id: "T-1", aliases: [], status: "In Progress" }),
    );
    expect(taskSeed.kind).toBe("success");
    seed = (taskSeed as { kind: "success"; revision: string }).revision;
    const actorSeed = await writer.writeRaw(
      seed,
      ".quest/claims/actors.json",
      JSON.stringify([
        { id: "human", kind: "human", roles: ["maintainer"] },
        {
          id: "agent-1",
          kind: "delegated-agent",
          accountableHumanId: "human",
          roles: [],
        },
      ]),
    );
    expect(actorSeed.kind).toBe("success");
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
    const revision = await git.readRevision(root, "HEAD");
    const snapshot = new GitSnapshotEvidence(git, root, revision);
    const events = await snapshot.events("T-1");
    expect(events.length).toBe(2);

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
      expectedRevision: base,
      operationId: "op-stale",
      ownedPaths: [".quest/claims/T-1.jsonl"],
    });
    expect(staleAppend.kind).toBe("conflict");
    await teardown();
  });
});
