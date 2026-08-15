import { expect, test } from "bun:test";

import {
  alias,
  appendTaskEvent,
  assertAliasesAvailable,
  assertReplayMatches,
  allocateCanonicalId,
  canonicalId,
  declareActor,
  materializeTask,
  RecordConflictError,
  RecordValidationError,
  type TaskEvent,
} from "../../src/domain/records.ts";
import {
  decodeAuthoredRecord,
  encodeAuthoredRecord,
} from "../../src/adapters/records/codec.ts";

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
});

test("record codec fails closed on corrupt bytes and schemas without mutating callers", () => {
  const original = { schemaVersion: 1, aliases: ["One"] };
  expect(decodeAuthoredRecord(encodeAuthoredRecord(original))).toEqual(
    original,
  );
  expect(() => decodeAuthoredRecord(new Uint8Array([0xc3, 0x28]))).toThrow(
    RecordValidationError,
  );
  expect(() =>
    decodeAuthoredRecord(new TextEncoder().encode('{"schemaVersion":2}')),
  ).toThrow(RecordValidationError);
  expect(original).toEqual({ schemaVersion: 1, aliases: ["One"] });
});
