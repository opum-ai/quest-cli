import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  LocalClaimEvidence,
  LocalTaskRelationshipRepository,
  safeStorageName,
} from "../../../src/adapters/claims/local-claim-evidence.ts";
import { OpumAgentWorkflowError } from "../../../src/domain/claims/opum-agent-workflow.ts";

async function store() {
  const root = await mkdtemp(join(tmpdir(), "quest-storage-"));
  const relationships = join(root, ".quest", "relationships");
  const claims = join(root, ".quest", "claims");
  await mkdir(relationships, { recursive: true });
  await mkdir(claims, { recursive: true });
  return { root, relationships, claims };
}

function codeOf(error: unknown): string | undefined {
  if (error instanceof OpumAgentWorkflowError) return error.code;
  return undefined;
}

const validRecord = {
  schemaVersion: 1,
  id: "corr-1",
  taskId: "T-1",
  kind: "correlation",
  state: "accepted",
  holder: "agent-1",
  baseRef: "origin/dev",
  settlementRef: "origin/dev",
};

describe("opaque identity storage containment", () => {
  const hostileIds = [
    "../escape",
    "/absolute/path",
    "..\\windows",
    "a//slash//id",
    "idé-Ω-🔥",
    "../../.quest/relationships/corr-1",
  ];

  test("maps hostile identities to hashed names and never reads outside", async () => {
    const { root, relationships, cleanupRoot } = await (async () => ({
      ...(await store()),
      cleanupRoot: root0(),
    }))();
    function root0() {
      return "";
    }
    void cleanupRoot;
    // A decoy outside the relationship root that traversal would resolve to.
    const outside = join(root, ".quest", "escape.json");
    await writeFile(outside, JSON.stringify(validRecord));
    const repository = new LocalTaskRelationshipRepository(root);
    for (const id of hostileIds) {
      expect(await repository.find(id)).toBeNull();
    }
    // The decoy is untouched and no file was created outside the root.
    expect(await Bun.file(outside).text()).toBe(JSON.stringify(validRecord));
    expect(
      await Array.fromAsync(
        new Bun.Glob("*").scan({ cwd: root, onlyFiles: false }),
      ),
    ).toBeDefined();
    await rm(root, { recursive: true, force: true });
    void relationships;
  });

  test("round-trips non-ASCII identities through the hashed name", async () => {
    const { root } = await store();
    const repository = new LocalTaskRelationshipRepository(root);
    const record = { ...validRecord, id: "idé-Ω-🔥" } as typeof validRecord & {
      readonly id: string;
    };
    await repository.write(record as never);
    expect(await repository.find("idé-Ω-🔥")).toMatchObject({ id: "idé-Ω-🔥" });
    await rm(root, { recursive: true, force: true });
  });

  test("claim event files use the same hashed addressing", async () => {
    const { root, claims } = await store();
    const evidence = new LocalClaimEvidence(root);
    expect(await evidence.events("T-1")).toEqual([]);
    await writeFile(join(claims, `${safeStorageName("../T-1")}.jsonl`), "");
    expect(await evidence.events("../T-1")).toEqual([]);
    await rm(root, { recursive: true, force: true });
  });
});

describe("closed authoritative relationship schema", () => {
  test("malformed relationship JSON is INCOMPATIBLE", async () => {
    const { root, relationships } = await store();
    await writeFile(
      join(relationships, `${safeStorageName("bad")}.json`),
      "{not json",
    );
    const repository = new LocalTaskRelationshipRepository(root);
    let thrown: unknown;
    try {
      await repository.find("bad");
    } catch (error) {
      thrown = error;
    }
    expect(codeOf(thrown)).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
    expect((thrown as Error).message).not.toContain("{not json");
    await rm(root, { recursive: true, force: true });
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
  };

  test.each(Object.entries(defects))(
    "rejects %s with INCOMPATIBLE",
    async (name, defect) => {
      void name;
      const { root, relationships } = await store();
      await writeFile(
        join(relationships, `${safeStorageName("corr-1")}.json`),
        JSON.stringify(defect),
      );
      const repository = new LocalTaskRelationshipRepository(root);
      let thrown: unknown;
      try {
        await repository.find("corr-1");
      } catch (error) {
        thrown = error;
      }
      expect(codeOf(thrown)).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
      await rm(root, { recursive: true, force: true });
    },
  );

  test("malformed claim JSONL is STATE-class corruption", async () => {
    const { root, claims } = await store();
    await writeFile(join(claims, "T-1.jsonl"), "{oops\n");
    const evidence = new LocalClaimEvidence(root);
    let thrown: unknown;
    try {
      await evidence.events("T-1");
    } catch (error) {
      thrown = error;
    }
    expect(codeOf(thrown)).toBe("OPUM_WORKFLOW_QUEST_STATE");
    expect((thrown as Error).message).not.toContain("{oops");
    await rm(root, { recursive: true, force: true });
  });

  test("duplicate claim events are STATE-class corruption", async () => {
    const { root, claims } = await store();
    const event = {
      eventId: "e1",
      operationId: "op",
      taskId: "T-1",
      kind: "claimed",
      generation: "g1",
      holderId: "agent-1",
      accountableHumanId: "human",
      at: new Date().toISOString(),
    };
    await writeFile(
      join(claims, "T-1.jsonl"),
      `${JSON.stringify(event)}\n${JSON.stringify(event)}`,
    );
    const evidence = new LocalClaimEvidence(root);
    let thrown: unknown;
    try {
      await evidence.events("T-1");
    } catch (error) {
      thrown = error;
    }
    expect(codeOf(thrown)).toBe("OPUM_WORKFLOW_QUEST_STATE");
    await rm(root, { recursive: true, force: true });
  });

  test("undeclared actors surface as replay corruption, not raw errors", async () => {
    const { root, claims } = await store();
    await writeFile(join(claims, "actors.json"), "[]");
    const event = {
      eventId: "e1",
      operationId: "op",
      taskId: "T-1",
      kind: "claimed",
      generation: "g1",
      holderId: "agent-9",
      accountableHumanId: "human",
      at: new Date().toISOString(),
    };
    await writeFile(join(claims, "T-1.jsonl"), JSON.stringify(event));
    const evidence = new LocalClaimEvidence(root);
    expect((await evidence.events("T-1")).length).toBe(1);
    await rm(root, { recursive: true, force: true });
  });
});

describe("symlink-safe containment", () => {
  test("rejects a symlinked .quest directory", async () => {
    const { root } = await store();
    const outside = await mkdtemp(join(tmpdir(), "quest-outside-"));
    await mkdir(join(outside, "relationships"), { recursive: true });
    await Bun.write(
      join(outside, "relationships", `${safeStorageName("corr-1")}.json`),
      JSON.stringify(validRecord),
    );
    const { rm: rmfs, symlink } = await import("node:fs/promises");
    await rmfs(join(root, ".quest"), { recursive: true, force: true });
    await symlink(join(outside), join(root, ".quest"));
    const repository = new LocalTaskRelationshipRepository(root);
    let thrown: unknown;
    try {
      await repository.find("corr-1");
    } catch (error) {
      thrown = error;
    }
    expect(codeOf(thrown)).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
    // Outside content untouched.
    expect(
      await Bun.file(
        join(outside, "relationships", `${safeStorageName("corr-1")}.json`),
      ).text(),
    ).toBe(JSON.stringify(validRecord));
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  });

  test("rejects a symlinked final relationship file pointing outside", async () => {
    const { root, relationships } = await store();
    const outside = await mkdtemp(join(tmpdir(), "quest-outside-"));
    const target = join(outside, "leak.json");
    await writeFile(target, JSON.stringify(validRecord));
    const { symlink } = await import("node:fs/promises");
    await symlink(
      target,
      join(relationships, `${safeStorageName("corr-1")}.json`),
    );
    const repository = new LocalTaskRelationshipRepository(root);
    let thrown: unknown;
    try {
      await repository.find("corr-1");
    } catch (error) {
      thrown = error;
    }
    expect(codeOf(thrown)).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
    // Outside content untouched.
    expect(await Bun.file(target).text()).toBe(JSON.stringify(validRecord));
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  });

  test("rejects symlinked claim event and actor files", async () => {
    const { root, claims } = await store();
    const outside = await mkdtemp(join(tmpdir(), "quest-outside-"));
    const leakEvents = join(outside, "events.jsonl");
    const leakActors = join(outside, "actors.json");
    await writeFile(leakEvents, '{"eventId":"x"}');
    await writeFile(leakActors, "[]");
    const { symlink } = await import("node:fs/promises");
    await symlink(leakEvents, join(claims, "T-1.jsonl"));
    await symlink(leakActors, join(claims, "actors.json"));
    const evidence = new LocalClaimEvidence(root);
    for (const read of [
      () => evidence.events("T-1"),
      () => evidence.actors(),
    ]) {
      let thrown: unknown;
      try {
        await read();
      } catch (error) {
        thrown = error;
      }
      expect(codeOf(thrown)).toBe("OPUM_WORKFLOW_QUEST_INCOMPATIBLE");
    }
    expect(await Bun.file(leakEvents).text()).toBe('{"eventId":"x"}');
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  });

  test("ClaimService-compatible claim layout drives the binding seam end-to-end", async () => {
    const { root, claims } = await store();
    const actors = [
      { id: "human", kind: "human", roles: ["maintainer"] },
      {
        id: "agent-1",
        kind: "delegated-agent",
        accountableHumanId: "human",
        roles: [],
      },
    ];
    await writeFile(join(claims, "actors.json"), JSON.stringify(actors));
    // Written through the production-owned ClaimService path convention:
    // .quest/claims/<canonical taskId>.jsonl.
    const claimed = {
      eventId: "corr-e1",
      operationId: "op-1",
      taskId: "T-1",
      kind: "claimed",
      generation: "g1",
      holderId: "agent-1",
      accountableHumanId: "human",
      at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    };
    await writeFile(join(claims, "T-1.jsonl"), JSON.stringify(claimed));
    const evidence = new LocalClaimEvidence(root);
    const history = (await evidence.events("T-1")).length;
    expect(history).toBe(1);
    await rm(root, { recursive: true, force: true });
  });
});
