import { expect, test } from "bun:test";
import {
  decodeAuthoredRecord,
  encodeAuthoredRecord,
} from "../../src/adapters/records/codec.ts";
import {
  alias,
  allocateCanonicalId,
  allocateCanonicalIdFromGit,
  appendTaskEvent,
  assertAliasesAvailable,
  assertReplayMatches,
  canonicalId,
  declareActor,
  declareActors,
  materializeTask,
  RecordConflictError,
  RecordValidationError,
  type TaskEvent,
  taskEventSchema,
} from "../../src/domain/records.ts";

const created: TaskEvent = {
  schemaVersion: 1,
  eventId: "e-1",
  operationId: "op-1",
  taskId: "T-42",
  actorId: "human-a",
  basis: null,
  patch: { title: "Draft", status: "open" },
};

test("canonical IDs allocate unpadded decimals from one revision-guarded counter", () => {
  expect(
    allocateCanonicalId(
      { schemaVersion: 1, revision: "abc", nextSequence: "42" },
      "abc",
    ),
  ).toEqual({
    id: "T-42",
    replacement: { schemaVersion: 1, revision: "abc", nextSequence: "43" },
  });
  expect(() => canonicalId("t-042")).toThrow(RecordValidationError);
  expect(() =>
    allocateCanonicalId(
      { schemaVersion: 1, revision: "abc", nextSequence: "42" },
      "old",
    ),
  ).toThrow(RecordConflictError);
});

test("canonical IDs commit through the global Git counter CAS boundary", async () => {
  const calls: unknown[] = [];
  const result = await allocateCanonicalIdFromGit({
    read: async () => ({
      schemaVersion: 1,
      revision: "git-a",
      nextSequence: "42",
    }),
    compareAndSwap: async (expected, replacement) => {
      calls.push({ expected, replacement });
      return { revision: "git-b" };
    },
  });
  expect(result).toEqual({ id: "T-42", revision: "git-b" });
  expect(calls).toEqual([
    {
      expected: "git-a",
      replacement: { schemaVersion: 1, revision: "git-a", nextSequence: "43" },
    },
  ]);
});

test("aliases preserve display spelling while NFC/default-fold collisions stop before writes", () => {
  expect(alias("Cafe\u0301")).toEqual({ display: "Cafe\u0301", key: "café" });
  expect(() => assertAliasesAvailable(["STRASSE"], [alias("Straße")])).toThrow(
    RecordConflictError,
  );
  expect(() => assertAliasesAvailable(["A", "a"], [])).toThrow(
    RecordConflictError,
  );
  expect(() => assertAliasesAvailable(["ᾀ"], [alias("ᾈ")])).toThrow(
    RecordConflictError,
  );
  // U+0345 folds to iota, a mapping outside the previous exception table.
  expect(() => assertAliasesAvailable(["ι"], [alias("\u0345")])).toThrow(
    RecordConflictError,
  );
});

test("actors are opaque, distinguish kinds, and require accountable humans for delegation", () => {
  expect(
    declareActor({
      id: "agent",
      kind: "delegated-agent",
      accountableHumanId: "human",
      roles: ["reviewer"],
    }),
  ).toMatchObject({ kind: "delegated-agent", accountableHumanId: "human" });
  expect(
    declareActor({ id: "human", kind: "human", roles: ["maintainer"] }),
  ).toMatchObject({ kind: "human" });
  expect(() =>
    declareActor({
      id: "agent",
      kind: "delegated-agent",
      accountableHumanId: "agent",
    }),
  ).toThrow(RecordValidationError);
  expect(() =>
    declareActors([
      { id: "agent", kind: "delegated-agent", accountableHumanId: "missing" },
    ]),
  ).toThrow(RecordValidationError);
  expect(
    declareActors([
      { id: "human", kind: "human" },
      { id: "agent", kind: "delegated-agent", accountableHumanId: "human" },
    ]),
  ).toHaveLength(2);
});

test("events are append-only, idempotent by operation, and replay exactly", () => {
  const stream = appendTaskEvent([], created);
  expect(appendTaskEvent(stream, created)).toBe(stream);
  const completed = appendTaskEvent(stream, {
    ...created,
    eventId: "e-2",
    operationId: "op-2",
    basis: "e-1",
    patch: { status: "done" },
  });
  const materialized = materializeTask(completed);
  expect(materialized).toEqual({
    schemaVersion: 1,
    taskId: "T-42",
    events: ["e-1", "e-2"],
    state: { title: "Draft", status: "done" },
  });
  assertReplayMatches(completed, materialized);
  expect(() =>
    assertReplayMatches(completed, {
      ...materialized,
      state: { status: "open" },
    }),
  ).toThrow(RecordConflictError);
  expect(() =>
    appendTaskEvent(stream, { ...created, patch: { title: "changed" } }),
  ).toThrow(RecordConflictError);
  expect(() =>
    appendTaskEvent(stream, {
      ...created,
      eventId: "e-3",
      operationId: "op-3",
      basis: "missing",
    }),
  ).toThrow(RecordConflictError);
  expect(() => materializeTask([created, created])).toThrow(
    RecordConflictError,
  );
});

test("record codec fails closed on corrupt bytes and schemas without mutating callers", () => {
  expect(
    decodeAuthoredRecord(
      encodeAuthoredRecord(created, taskEventSchema),
      taskEventSchema,
    ),
  ).toEqual(created);
  expect(() =>
    decodeAuthoredRecord(new Uint8Array([0xc3, 0x28]), taskEventSchema),
  ).toThrow(RecordValidationError);
  expect(() =>
    decodeAuthoredRecord(
      new TextEncoder().encode('{"schemaVersion":2}'),
      taskEventSchema,
    ),
  ).toThrow(RecordValidationError);
  expect(() =>
    decodeAuthoredRecord(
      new TextEncoder().encode('{"schemaVersion":1,"eventId":"e"}'),
      taskEventSchema,
    ),
  ).toThrow(RecordValidationError);
});

test("canonical ids accept any well-formed prefix while keeping every prior rejection", () => {
  // Structural validity only: which prefix a workspace *generates* is
  // configuration (taskIdPrefix), not a domain-replay concern.
  for (const accepted of [
    "T-1",
    "T-42",
    "T-9007199254740991",
    "QCLI-125",
    "DEMO-7",
    "A1-3",
    "lower-5",
  ]) {
    expect(canonicalId(accepted)).toBe(accepted);
  }

  // Everything the fixed T- pattern rejected for structural reasons still throws.
  for (const rejected of [
    "",
    "T",
    "T-",
    "-1",
    "T-0",
    "T-01",
    "t-042",
    "T-1.4",
    "T-1a",
    "1T-1",
    "-T-1",
    "T--1",
    "A-B-1",
    "T 1",
    "T-١",
  ]) {
    expect(() => canonicalId(rejected)).toThrow(RecordValidationError);
  }
});

test("allocation honours a configured prefix and rejects a malformed one", () => {
  const counter = {
    schemaVersion: 1,
    revision: "abc",
    nextSequence: "7",
  } as const;
  expect(allocateCanonicalId(counter, "abc", "QCLI").id).toBe("QCLI-7");
  // Default stays T-, so an existing caller is byte-identical.
  expect(allocateCanonicalId(counter, "abc").id).toBe("T-7");
  for (const bad of ["", "-", "1ABC", "A-B", "A B"]) {
    expect(() => allocateCanonicalId(counter, "abc", bad)).toThrow(
      RecordValidationError,
    );
  }
});
