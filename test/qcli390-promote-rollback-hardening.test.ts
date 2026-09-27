import { expect, test } from "bun:test";

import {
  checkRollbackState,
  type PromotionRecord,
  promote,
  RELEASE_PACKAGES,
  validateRecord,
} from "../scripts/promote-release.mjs";

/**
 * QCLI-390, from lore-cli's adversarial review of its mirror of
 * promote-release.mjs: a rollback moves `latest` with no receipt, so it may
 * only undo THIS record's promotion (S1), and a tag move that failed after
 * the registry applied it must still be restored (S2).
 */

const V = "9.9.9";
const PRIOR = "9.8.0";
const record: PromotionRecord = {
  schemaVersion: 1,
  kind: "quest.promotion-record.v1",
  version: V,
  recordedAt: "2026-09-27T00:00:00.000Z",
  packages: RELEASE_PACKAGES.map((name) => ({ name, priorLatest: PRIOR })),
};
const withPrior = (priorLatest: string) => ({
  ...record,
  packages: record.packages.map((entry) => ({ ...entry, priorLatest })),
});

test("S1: a prior latest that is a tag name, not a version, is refused", () => {
  expect(validateRecord(withPrior("release-candidate")).ok).toBe(false);
  expect(validateRecord(withPrior("v9.8.0")).ok).toBe(false);
  expect(validateRecord(withPrior("9.8")).ok).toBe(false);
});

test("S1: a prior latest equal to the release version is refused", () => {
  expect(validateRecord(withPrior(V)).ok).toBe(false);
});

test("S1: a well-formed record still validates", () => {
  expect(validateRecord(record, { version: V })).toEqual({
    ok: true,
    problems: [],
  });
});

const registry =
  (latest: (name: string) => string) => async (name: string) => ({
    latest: latest(name),
    "release-candidate": V,
  });

test("S1: rollback is allowed while every latest is the version or its prior (full or partial promotion)", async () => {
  expect(
    (await checkRollbackState({ record, readTags: registry(() => V) })).ok,
  ).toBe(true);
  const partial = registry((name) => (name.endsWith("linux-x64") ? V : PRIOR));
  expect((await checkRollbackState({ record, readTags: partial })).ok).toBe(
    true,
  );
});

test("S1: rolling back an old record after latest moved on is refused, naming the package", async () => {
  const movedOn = registry((name) =>
    name === "@opum-ai/quest" ? "9.10.0" : V,
  );
  const state = await checkRollbackState({ record, readTags: movedOn });
  expect(state.ok).toBe(false);
  expect(state.problems).toHaveLength(1);
  expect(state.problems[0]).toContain("@opum-ai/quest:");
});

test("S1: an unreadable tag set refuses the rollback", async () => {
  const state = await checkRollbackState({
    record,
    readTags: async () => {
      throw new Error("503");
    },
  });
  expect(state.ok).toBe(false);
  expect(state.problems).toHaveLength(RELEASE_PACKAGES.length);
});

test("S2: a tag move that errors AFTER the registry applied it is still restored", async () => {
  const tags = new Map(RELEASE_PACKAGES.map((name) => [name, PRIOR]));
  const flaky = "@opum-ai/quest-linux-arm64";
  const setTag = async (name: string, version: string) => {
    tags.set(name, version);
    // The write landed, then the client saw a timeout.
    if (name === flaky && version === V) throw new Error("ETIMEDOUT");
  };
  const outcome = await promote({ record, setTag });
  expect(outcome.ok).toBe(false);
  if (outcome.ok) return;
  expect(outcome.failed).toBe(flaky);
  expect(outcome.restored.ok).toBe(true);
  expect([...tags.values()].every((value) => value === PRIOR)).toBe(true);
});
