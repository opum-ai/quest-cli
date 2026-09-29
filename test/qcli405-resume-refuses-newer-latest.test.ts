import { expect, test } from "bun:test";

import {
  PROMOTE_TAG,
  planPromotion,
  RELEASE_PACKAGES,
} from "../scripts/promote-release.mjs";

/**
 * QCLI-405, twin of lore-cli LCLI-638 (rule read at lore 2b97082c).
 *
 * QCLI-402's backwards-promotion gate is fresh-only: it validates the record
 * the run would write, and a RESUME keeps the record the first run wrote. So
 * nothing compared a package's CURRENT `latest` with --version, and on a
 * registry that moved ahead between the two runs the resume would move
 * `latest` backwards.
 *
 * The refusal is the agreed rule, matched by verdict with lore: on a resume,
 * a CURRENT `latest` strictly newer than --version refuses, naming the package
 * and both versions. Equal-to-version is the partial state a resume exists for
 * and stays accepted; older resumes normally. A CURRENT `latest` that is not a
 * plain X.Y.Z cannot be ordered numerically and is ACCEPTED on resume by both
 * sides -- the residual LCLI-638 names deliberately, pinned below so the
 * acceptance is a recorded verdict rather than an omission.
 */

const LAUNCHER = "@opum-ai/quest";

const VERSION = "9.9.9";
const NEWER = "9.9.10";
const EQUAL = VERSION;
const OLDER = "9.9.8";
const NON_PLAIN = "9.9.9-rc.1";

/** Every package staged at `version` (the launcher at its rc), latest as given. */
const registry =
  (version: string, latest: string | ((name: string) => string)) =>
  async (name: string) => ({
    "release-candidate": name === LAUNCHER ? `${version}-rc.1` : version,
    latest: typeof latest === "function" ? latest(name) : latest,
  });

const plan = (
  version: string,
  latest: Parameters<typeof registry>[1],
  resuming: boolean,
) =>
  planPromotion({
    version,
    launcherVersion: `${version}-rc.1`,
    readTags: registry(version, latest),
    resuming,
  });

test("a resume refuses a strictly newer current latest, naming the package and both versions", async () => {
  const result = await plan(VERSION, NEWER, true);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  const refusals = result.problems.filter((problem) =>
    problem.includes("resuming would move"),
  );
  expect(refusals).toHaveLength(RELEASE_PACKAGES.length);
  for (const name of RELEASE_PACKAGES) {
    const refusal = refusals.find((problem) => problem.startsWith(`${name}:`));
    expect(refusal).toContain(
      `${name}: ${VERSION} is older than the current ${PROMOTE_TAG} ${NEWER}`,
    );
    expect(refusal).toContain(
      `so resuming would move ${PROMOTE_TAG} backwards`,
    );
    expect(refusal).toContain(
      `${PROMOTE_TAG} has moved on since the record was written`,
    );
  }
});

test("one package whose current latest is newer is enough to refuse, and it is named", async () => {
  for (const differing of [
    RELEASE_PACKAGES[0],
    RELEASE_PACKAGES[3],
    LAUNCHER,
  ]) {
    const result = await plan(
      VERSION,
      (name) => (name === differing ? NEWER : OLDER),
      true,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const refusals = result.problems.filter((problem) =>
      problem.includes("resuming would move"),
    );
    expect(refusals).toHaveLength(1);
    expect(refusals[0]).toContain(
      `${differing}: ${VERSION} is older than the current ${PROMOTE_TAG} ${NEWER}`,
    );
  }
});

test("a resume proceeds when packages already read --version or an older release", async () => {
  // Uniform older: nothing moved yet on the registry side.
  expect(await plan(VERSION, OLDER, true)).toMatchObject({ ok: true });
  // Uniform equal: every tag already moved, the state a completed promotion
  // would be re-verified from.
  expect(await plan(VERSION, EQUAL, true)).toMatchObject({ ok: true });
  // The partial state resume exists for: some packages already read --version
  // and the rest an older release -- the launcher included, since it is staged
  // at its rc but its `latest` moves to --version like everyone's.
  const partial = await plan(
    VERSION,
    (name) => ([LAUNCHER, RELEASE_PACKAGES[0]].includes(name) ? EQUAL : OLDER),
    true,
  );
  expect(partial.ok).toBe(true);
  if (!partial.ok) return;
  expect(partial.record.packages).toHaveLength(RELEASE_PACKAGES.length);
});

test("a non-plain current latest is accepted on resume: the residual, mirrored from LCLI-638", async () => {
  // compareReleaseVersions cannot order these, and the agreed rule refuses
  // only a STRICTLY NEWER current latest. Pinned so both sides' grids agree.
  for (const latest of [NON_PLAIN, "10.0.0-rc.1", "9.9.9+build.5"])
    expect(await plan(VERSION, latest, true)).toMatchObject({ ok: true });
});

test("the fresh-run refusals from QCLI-402 are unchanged", async () => {
  const fresh = (latest: string | ((name: string) => string)) =>
    plan(VERSION, latest, false);
  const newer = await fresh(NEWER);
  expect(newer.ok).toBe(false);
  if (newer.ok) return;
  expect(newer.problems[0]).toContain(
    `${VERSION} is older than the current ${PROMOTE_TAG} ${NEWER}`,
  );
  expect(newer.problems[0]).toContain("Backports are not a promote use case");
  const equal = await fresh(EQUAL);
  expect(equal.ok).toBe(false);
  if (equal.ok) return;
  expect(equal.problems[0]).toContain(
    `${PROMOTE_TAG} already reads ${VERSION}`,
  );
  expect(await fresh(OLDER)).toMatchObject({ ok: true });
});

test("a fresh run whose current latest is not a plain release names the registry, not a record", async () => {
  // LCLI-638's second half, mirrored: nothing has been RECORDED yet, so
  // validateRecord's "recorded prior latest ..." wording names an artifact
  // that does not exist. Verdict unchanged (still refused).
  const result = await plan(VERSION, NON_PLAIN, false);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.problems[0]).toContain(
    `${RELEASE_PACKAGES[0]}: its current ${PROMOTE_TAG} is ${JSON.stringify(NON_PLAIN)}, not a plain X.Y.Z release`,
  );
  expect(result.problems[0]).toContain("--rollback would restore");
  expect(
    result.problems.some((problem) => problem.includes("not a version")),
  ).toBe(true);
});

/**
 * The pairing grid, from lore-cli's shared recipe (LCLI-638): deterministic
 * rows both sides run through their own planPromotion, so the two verdict
 * columns diff row for row at both final heads (QCLI-405 AC4). Ordinals index
 * this side's own RELEASE_PACKAGES; the LAST ordinal is the launcher.
 */
const GRID = {
  version: "5.6.7",
  launcherVersion: "5.6.7-rc.1",
  relations: {
    newer: "5.7.0",
    equal: "5.6.7",
    older: "5.6.6",
    "not-plain": "5.7.0-rc.1",
  },
  shapes: {
    uniform: () => true,
    platform0: (ordinal: number) => ordinal === 0,
    platform2: (ordinal: number) => ordinal === 2,
    launcher: (ordinal: number) => ordinal === RELEASE_PACKAGES.length - 1,
    first4: (ordinal: number) => ordinal < 4,
  },
} as const;

const gridPlan = (
  resuming: boolean,
  relation: keyof typeof GRID.relations,
  shape: keyof typeof GRID.shapes,
) =>
  planPromotion({
    version: GRID.version,
    launcherVersion: GRID.launcherVersion,
    readTags: async (name: string) => {
      const ordinal = RELEASE_PACKAGES.indexOf(name);
      return {
        "release-candidate":
          name === LAUNCHER ? GRID.launcherVersion : GRID.version,
        latest: GRID.shapes[shape](ordinal)
          ? GRID.relations[relation]
          : GRID.relations.older,
      };
    },
    resuming,
  });

test("the pairing grid: resuming x relation x shape verdicts, 20 of 40 accepted", async () => {
  const expected = {
    false: { newer: false, equal: false, older: true, "not-plain": false },
    true: { newer: false, equal: true, older: true, "not-plain": true },
  } as const;
  const rows: string[] = [];
  let accepted = 0;
  for (const resuming of [false, true] as const)
    for (const relation of Object.keys(
      GRID.relations,
    ) as (keyof typeof GRID.relations)[])
      for (const shape of Object.keys(
        GRID.shapes,
      ) as (keyof typeof GRID.shapes)[]) {
        const result = await gridPlan(resuming, relation, shape);
        if (result.ok) accepted++;
        const row = `resuming=${resuming} relation=${relation} shape=${shape}`;
        rows.push(row);
        expect({ row, ok: result.ok }).toEqual({
          row,
          ok: expected[resuming ? "true" : "false"][relation],
        });
      }
  expect(rows).toHaveLength(40);
  expect(accepted).toBe(20);
});
