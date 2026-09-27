import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  PROMOTE_TAG,
  type PromotionRecord,
  planPromotion,
  promote,
  RELEASE_PACKAGES,
  rollback,
  validateRecord,
  verifyTags,
} from "../scripts/promote-release.mjs";
import { publishArgs, STAGE_TAG } from "../scripts/publish-release.mjs";

/**
 * QCLI-385, constitution Article 3 clause 5: a release is STAGED under the
 * release-candidate dist-tag, and `latest` moves only as a separate,
 * recorded, reversible step after opum-cli-e2e qualifies the staged pair.
 * `npm publish` with no `--tag` moves `latest` as a side effect, so the
 * tests below fail on any publish path that could.
 */

const repo = join(import.meta.dir, "..");
const VERSION = "9.9.9";
const PRIOR = "9.8.0";

test("the stage tag is release-candidate, never latest", () => {
  expect(STAGE_TAG).toBe("release-candidate");
  expect(PROMOTE_TAG).toBe("latest");
});

test("publishArgs always carries --tag release-candidate, dry run and OTP included", () => {
  for (const options of [{}, { dryRun: true }, { otp: "123456" }]) {
    const args = publishArgs("x.tgz", options);
    expect(args.slice(0, 2)).toEqual(["publish", "x.tgz"]);
    expect(args[args.indexOf("--tag") + 1]).toBe("release-candidate");
  }
});

test("every npm publish in the local publisher goes through publishArgs", async () => {
  const source = await readFile(
    join(repo, "scripts", "publish-release.mjs"),
    "utf8",
  );
  // The literal appears once, inside publishArgs itself. A second one is a
  // publish call spelling its own argument list, which is how a tagless
  // publish would come back.
  expect(source.match(/"publish",/g)?.length).toBe(1);
  expect(source.match(/publishArgs\(/g)?.length).toBeGreaterThanOrEqual(3);
});

test("every npm publish in release.yml stages under release-candidate", async () => {
  const workflow = await readFile(
    join(repo, ".github", "workflows", "release.yml"),
    "utf8",
  );
  const publishes = workflow
    .split("\n")
    .filter((line) => /^\s*npm publish /.test(line));
  // Read the count, so a refactor that removes the lines cannot pass vacuously.
  expect(publishes.length).toBe(2);
  for (const line of publishes)
    expect(line).toContain("--tag release-candidate");
});

const staged = (latest: string) => async () => ({
  "release-candidate": VERSION,
  latest,
});

test("planPromotion records every prior latest when all seven are staged", async () => {
  const plan = await planPromotion({
    version: VERSION,
    readTags: staged(PRIOR),
    now: () => new Date("2026-09-27T00:00:00Z"),
  });
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  expect(plan.record.packages.map((entry) => entry.name)).toEqual([
    ...RELEASE_PACKAGES,
  ]);
  expect(
    plan.record.packages.every((entry) => entry.priorLatest === PRIOR),
  ).toBe(true);
  expect(RELEASE_PACKAGES.at(-1)).toBe("@opum-ai/quest");
  expect(validateRecord(plan.record, { version: VERSION }).ok).toBe(true);
});

test("planPromotion refuses when any one package is not staged at the version", async () => {
  const plan = await planPromotion({
    version: VERSION,
    readTags: async (name) =>
      name === "@opum-ai/quest-win32-arm64"
        ? { "release-candidate": "0.2.9", latest: PRIOR }
        : { "release-candidate": VERSION, latest: PRIOR },
  });
  expect(plan.ok).toBe(false);
  if (plan.ok) return;
  expect(plan.problems).toHaveLength(1);
  expect(plan.problems[0]).toContain("@opum-ai/quest-win32-arm64");
});

test("planPromotion refuses an unreadable tag set rather than treating it as empty", async () => {
  const plan = await planPromotion({
    version: VERSION,
    readTags: async () => {
      throw new Error("503");
    },
  });
  expect(plan.ok).toBe(false);
  if (plan.ok) return;
  expect(plan.problems).toHaveLength(RELEASE_PACKAGES.length);
});

test("a rerun reusing the first record accepts packages already promoted", async () => {
  const plan = await planPromotion({
    version: VERSION,
    readTags: staged(VERSION),
    resuming: true,
  });
  expect(plan.ok).toBe(true);
});

test("planPromotion refuses to record the new version as the prior one", async () => {
  const plan = await planPromotion({
    version: VERSION,
    readTags: staged(VERSION),
  });
  expect(plan.ok).toBe(false);
});

const record: PromotionRecord = {
  schemaVersion: 1,
  kind: "quest.promotion-record.v1",
  version: VERSION,
  recordedAt: "2026-09-27T00:00:00.000Z",
  packages: RELEASE_PACKAGES.map((name) => ({ name, priorLatest: PRIOR })),
};

function fakeRegistry(failOn?: string) {
  const tags = new Map(RELEASE_PACKAGES.map((name) => [name, PRIOR]));
  const writes: string[] = [];
  const setTag = async (name: string, version: string, tag: string) => {
    if (tag !== "latest") throw new Error(`unexpected tag ${tag}`);
    if (name === failOn && version === VERSION) throw new Error("E403");
    writes.push(`${name}=${version}`);
    tags.set(name, version);
  };
  return { tags, writes, setTag };
}

test("promote moves latest on all seven, platforms first and the wrapper last", async () => {
  const registry = fakeRegistry();
  const outcome = await promote({ record, setTag: registry.setTag });
  expect(outcome.ok).toBe(true);
  expect(registry.writes.at(-1)).toBe(`@opum-ai/quest=${VERSION}`);
  expect([...registry.tags.values()].every((value) => value === VERSION)).toBe(
    true,
  );
});

test("a failure part way through restores exactly the tags that run moved", async () => {
  const registry = fakeRegistry("@opum-ai/quest-linux-x64");
  const outcome = await promote({ record, setTag: registry.setTag });
  expect(outcome.ok).toBe(false);
  if (outcome.ok) return;
  expect(outcome.failed).toBe("@opum-ai/quest-linux-x64");
  expect(outcome.moved.length).toBeGreaterThan(0);
  expect(outcome.restored.ok).toBe(true);
  // Nothing is left on the new version, and the wrapper was never touched.
  expect([...registry.tags.values()].every((value) => value === PRIOR)).toBe(
    true,
  );
  expect(
    registry.writes.some((write) => write.startsWith("@opum-ai/quest=")),
  ).toBe(false);
});

test("rollback restores every recorded prior value after a full promotion", async () => {
  const registry = fakeRegistry();
  await promote({ record, setTag: registry.setTag });
  const outcome = await rollback({ record, setTag: registry.setTag });
  expect(outcome.ok).toBe(true);
  expect([...registry.tags.values()].every((value) => value === PRIOR)).toBe(
    true,
  );
});

test("validateRecord rejects a record for another release or package set", () => {
  expect(validateRecord(record, { version: "1.0.0" }).ok).toBe(false);
  expect(
    validateRecord({ ...record, packages: record.packages.slice(1) }).ok,
  ).toBe(false);
  expect(
    validateRecord({
      ...record,
      packages: record.packages.map((entry) => ({
        ...entry,
        priorLatest: undefined,
      })),
    }).ok,
  ).toBe(false);
});

test("verifyTags waits for the registry read to catch up, and fails if it never does", async () => {
  let reads = 0;
  const lagging = async () => ({ latest: ++reads > 7 ? VERSION : PRIOR });
  const caught = await verifyTags({
    expected: { "@opum-ai/quest": VERSION },
    readTags: lagging,
    delayMs: 0,
    sleep: async () => {},
  });
  expect(caught.ok).toBe(true);
  expect(caught.attempts).toBe(8);

  const never = await verifyTags({
    expected: { "@opum-ai/quest": VERSION },
    readTags: async () => ({ latest: PRIOR }),
    attempts: 3,
    delayMs: 0,
    sleep: async () => {},
  });
  expect(never.ok).toBe(false);
  expect(never.wrong).toHaveLength(1);
});
