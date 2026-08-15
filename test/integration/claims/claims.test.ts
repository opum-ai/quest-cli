import { expect, test } from "bun:test";

import {
  type ClaimRepository,
  ClaimService,
} from "../../../src/application/claims/claims.ts";
import {
  claimLeasePolicy,
  evaluateClaim,
  replayClaimHistory,
} from "../../../src/domain/claims/claims.ts";

const actors = [
  { id: "human", kind: "human" as const, roles: [] },
  {
    id: "agent",
    kind: "delegated-agent" as const,
    accountableHumanId: "human",
    roles: [],
  },
];

class MemoryClaims implements ClaimRepository {
  private revision = "r-1";
  readonly events = [] as Parameters<ClaimRepository["append"]>[0]["event"][];
  constructor(
    private readonly tasks = [{ id: "T-1" as const, aliases: ["first"] }],
    private readonly declaredActors = actors,
  ) {}
  async read() {
    return {
      revision: this.revision,
      tasks: this.tasks,
      actors: this.declaredActors,
      events: this.events,
    };
  }
  async append(request: Parameters<ClaimRepository["append"]>[0]) {
    if (request.expectedRevision !== this.revision)
      return {
        kind: "conflict" as const,
        expectedRevision: request.expectedRevision,
        actualRevision: this.revision,
        operationId: request.operationId,
        ownedPaths: request.ownedPaths,
      };
    this.events.push(request.event);
    this.revision = `r-${this.events.length + 1}`;
    return { kind: "success" as const, revision: this.revision };
  }
}

const at = (minute: number) =>
  new Date(`2026-01-01T00:${String(minute).padStart(2, "0")}:00.000Z`);

test("default lease configuration is 30 minutes with a five-minute heartbeat", () => {
  expect(claimLeasePolicy()).toEqual({
    leaseDurationMs: 30 * 60_000,
    heartbeatIntervalMs: 5 * 60_000,
  });
  expect(() => claimLeasePolicy({ heartbeatIntervalMs: 0 })).toThrow(
    "claim_lease_configuration_invalid",
  );
  expect(() =>
    claimLeasePolicy({ leaseDurationMs: 1_000, heartbeatIntervalMs: 2_000 }),
  ).toThrow("claim_lease_configuration_invalid");
});

test("an alias resolves before claim lookup, leaving one canonical live lease", async () => {
  const store = new MemoryClaims();
  const service = new ClaimService(store);
  await expect(
    service.claim({
      reference: "first",
      actorId: "human",
      generation: "g-1",
      eventId: "e-1",
      operationId: "op-1",
      at: at(0),
    }),
  ).resolves.toMatchObject({ kind: "success", event: { taskId: "T-1" } });
  await expect(
    service.claim({
      reference: "T-1",
      actorId: "human",
      generation: "g-2",
      eventId: "e-2",
      operationId: "op-2",
      at: at(1),
    }),
  ).rejects.toThrow("claim_live");
  expect(store.events).toHaveLength(1);
});

test("heartbeat and delegation are generation-scoped, preserving accountable human", async () => {
  const store = new MemoryClaims();
  const service = new ClaimService(store);
  await service.claim({
    reference: "T-1",
    actorId: "human",
    generation: "g-1",
    eventId: "e-1",
    operationId: "op-1",
    at: at(0),
  });
  await service.delegate({
    reference: "first",
    accountableHumanId: "human",
    delegatedActorId: "agent",
    generation: "g-1",
    eventId: "e-2",
    operationId: "op-2",
    at: at(1),
  });
  await expect(
    service.heartbeat({
      reference: "T-1",
      actorId: "human",
      generation: "g-1",
      eventId: "e-3",
      operationId: "op-3",
      at: at(2),
    }),
  ).rejects.toThrow("claim_heartbeat_stale_generation");
  await service.heartbeat({
    reference: "T-1",
    actorId: "agent",
    generation: "g-1",
    eventId: "e-4",
    operationId: "op-4",
    at: at(2),
  });
  expect(store.events.at(-1)).toMatchObject({
    kind: "renewed",
    holderId: "agent",
    accountableHumanId: "human",
  });
});

test("reclamation appends a fresh generation and retains expired holder history", async () => {
  const store = new MemoryClaims();
  const service = new ClaimService(store, {
    leaseDurationMs: 60_000,
    heartbeatIntervalMs: 30_000,
  });
  await service.claim({
    reference: "T-1",
    actorId: "human",
    generation: "g-1",
    eventId: "e-1",
    operationId: "op-1",
    at: at(0),
  });
  await service.claim({
    reference: "T-1",
    actorId: "agent",
    generation: "g-2",
    eventId: "e-2",
    operationId: "op-2",
    at: at(2),
  });
  await expect(
    service.heartbeat({
      reference: "T-1",
      actorId: "human",
      generation: "g-1",
      eventId: "e-stale",
      operationId: "op-stale",
      at: at(2),
    }),
  ).rejects.toThrow("claim_heartbeat_stale_generation");
  expect(store.events).toHaveLength(2);
  expect(store.events).toMatchObject([
    { kind: "claimed", holderId: "human", generation: "g-1" },
    { kind: "reclaimed", holderId: "agent", generation: "g-2" },
  ]);
  const history = replayClaimHistory(store.events, actors, {
    leaseDurationMs: 60_000,
    heartbeatIntervalMs: 30_000,
  });
  expect(evaluateClaim(history, at(2)).lease).toMatchObject({
    holderId: "agent",
    accountableHumanId: "human",
    generation: "g-2",
  });
});

test("concurrent CAS loss is reported deterministically and never called success", async () => {
  const stale: ClaimRepository = {
    read: async () => ({
      revision: "before",
      tasks: [{ id: "T-1", aliases: [] }],
      actors,
      events: [],
    }),
    append: async (request) => ({
      kind: "conflict",
      expectedRevision: request.expectedRevision,
      actualRevision: "after",
      operationId: request.operationId,
      ownedPaths: request.ownedPaths,
    }),
  };
  const result = await new ClaimService(stale).claim({
    reference: "T-1",
    actorId: "human",
    generation: "g-1",
    eventId: "e-1",
    operationId: "op-1",
    at: at(0),
  });
  expect(result).toEqual({
    kind: "conflict",
    expectedRevision: "before",
    actualRevision: "after",
    operationId: "op-1",
    ownedPaths: [".quest/claims/T-1.jsonl"],
  });
});
