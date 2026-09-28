import { expect, test } from "bun:test";

import {
  PROMOTE_TAG,
  planPromotion,
  RELEASE_PACKAGES,
  validateRecord,
} from "../scripts/promote-release.mjs";

/**
 * QCLI-402, twin of lore-cli LCLI-631. opum-doc ADR
 * refuse-a-lore-quest-promotion-that-would-move-npm-latest-backwards,
 * with Amendment 1. A fresh plan refuses a version older than any package's
 * current latest, and a version that is not plain X.Y.Z. Both are refused by
 * validating plan.record with {version} before the first write, so resume
 * and rollback never meet a record they would refuse.
 */

const LAUNCHER = "@opum-ai/quest";

/** Every package staged at `version` (the launcher at its rc), latest at `latest`. */
const registry =
  (version: string, latest: string | ((name: string) => string)) =>
  async (name: string) => ({
    "release-candidate": name === LAUNCHER ? `${version}-rc.1` : version,
    latest: typeof latest === "function" ? latest(name) : latest,
  });

const plan = (version: string, latest: Parameters<typeof registry>[1]) =>
  planPromotion({
    version,
    launcherVersion: `${version}-rc.1`,
    readTags: registry(version, latest),
  });

test("a version older than latest is refused, naming both versions and the backport carve-out", async () => {
  for (const [version, latest] of [
    ["9.9.8", "9.9.9"],
    ["9.8.0", "9.9.0"],
    ["0.9.0", "0.10.0"],
  ]) {
    const result = await plan(version, latest);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems[0]).toContain(
      `${version} is older than the current ${PROMOTE_TAG} ${latest}`,
    );
    expect(result.problems[0]).toContain(
      "Backports are not a promote use case",
    );
  }
});

test("one package whose latest is newer is enough to refuse, and it is named", async () => {
  const result = await plan("9.9.9", (name) =>
    name === LAUNCHER ? "9.10.0" : "9.9.8",
  );
  expect(result.ok).toBe(false);
  if (result.ok) return;
  const older = result.problems.filter((problem) =>
    problem.includes("is older than the current"),
  );
  expect(older).toHaveLength(1);
  expect(older[0]).toContain(`${LAUNCHER}: 9.9.9 is older than the current`);
});

test("a prerelease or build-metadata version is refused as not a release", async () => {
  for (const version of ["9.9.9-beta.1", "1.0.0-rc.2", "9.9.9+build.5"]) {
    const result = await plan(version, "9.9.8");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems[0]).toContain(
      `${version} is not a plain X.Y.Z release`,
    );
    expect(result.problems[0]).toContain(
      `belongs on a non-${PROMOTE_TAG} dist-tag through a separate path that is not built`,
    );
  }
});

test("newer versions are unaffected, in numeric rather than lexical order", async () => {
  for (const [version, latest] of [
    ["9.9.9", "9.9.8"],
    ["0.10.0", "0.9.0"],
    ["10.0.0", "9.99.99"],
    ["0.0.9007199254740993", "0.0.9007199254740992"],
  ])
    expect(await plan(version, latest)).toMatchObject({ ok: true });
});

test("equal to latest keeps its existing behaviour: refused fresh, accepted on resume", async () => {
  const fresh = await plan("9.9.9", "9.9.9");
  expect(fresh.ok).toBe(false);
  if (fresh.ok) return;
  expect(fresh.problems[0]).toContain(`${PROMOTE_TAG} already reads 9.9.9`);
  const resumed = await planPromotion({
    version: "9.9.9",
    launcherVersion: "9.9.9-rc.1",
    readTags: registry("9.9.9", "9.9.9"),
    resuming: true,
  });
  expect(resumed.ok).toBe(true);
});

test("the plan's verdict is validateRecord's verdict on the record it would write", async () => {
  // Amendment 1: one gate, not a parallel check. On every fresh input where
  // the registry facts are fine, a plan refuses exactly when validating its
  // record with {version} would.
  const versions = [
    "9.9.9",
    "9.9.8",
    "9.10.0",
    "0.9.0",
    "0.10.0",
    "9.9.9-rc.1",
  ];
  let read = 0;
  for (const version of versions)
    for (const latest of versions.filter((v) => !v.includes("-"))) {
      if (latest === version) continue;
      read++;
      const result = await plan(version, latest);
      const record = {
        kind: "quest.promotion-record.v1",
        version,
        packages: RELEASE_PACKAGES.map((name) => ({
          name,
          priorLatest: latest,
        })),
      };
      expect({ version, latest, ok: result.ok }).toEqual({
        version,
        latest,
        ok: validateRecord(record, { version }).ok,
      });
    }
  expect(read).toBe(25);
});
