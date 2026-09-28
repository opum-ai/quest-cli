// Moves `latest` to a staged release, as a separate, recorded, reversible
// step (QCLI-385, constitution Article 3 clause 5).
//
// scripts/publish-release.mjs STAGES a release under the release-candidate
// dist-tag and leaves `latest` where it was. opum-cli-e2e then qualifies the
// staged lore/quest pair from clean registry installs, and only after that
// does `latest` move -- Quest first, then Lore. This script is that move.
//
// Registry publication is irreversible, so a failed promotion is never
// repaired by unpublishing. What rolls back is the dist-tags: every prior
// `latest` is written to a record file BEFORE any tag moves, a failure part
// way through restores the tags this run already moved, and `--rollback
// <record>` restores all of them later (for instance when the Lore side's
// promotion fails after Quest's succeeded). The record is written once and
// reused on a rerun, never re-read from the registry: after a partial move
// the registry's current `latest` is the NEW version, and recording that as
// the prior value would make the rollback a no-op.
//
// Promotion also refuses without opum-cli-e2e's pair receipt for this
// version (QCLI-388, scripts/qualification/pair-receipt.mjs): the verdict on
// the staged pair is read from the record, never taken from a message.
// --rollback is deliberately not gated on it.
//
// QCLI-399 (constitution Article 3 clause 5 as amended by ODOC-302, read at
// opum-doc f322cff): the six platform packages still reach `latest` by a
// dist-tag move, but the root launcher does not. It stages as X-rc.N and
// reaches `latest` by a FRESH PUBLISH of X, because only a publish onto
// `latest` makes npm derive the packument readme. The X published is the
// never-staged launcher in the qualified candidate bundle's final/, fetched
// here from --qualification-run and gated on the pass-1 receipt again. The
// order, agreed with lore-cli (LCLI-621) and opum-cli-e2e (TASK-126):
//   1. the pair receipt, the launcher entry read at launcherVersion
//   2. the rc npm serves is the bundle's rc, and X is that rc with only its
//      version substituted -- checked against the registry's bytes
//   3. the platforms move `latest` by dist-tag
//   4. the same check again, immediately before the publish
//   5. `npm publish final/<X>.tgz --tag latest`, the one publish in this
//      pipeline that does not stage (test/qcli385 holds it to exactly one)
//   6. `latest` reads X on all seven, and npm serves X as the bundle's bytes
// A failure restores every `latest` this run moved by dist-tag, the
// launcher's included. Nothing is unpublished; retry at the same version.
//
// Once `latest` is verified moved, the same run cuts the GitHub Release for
// v<version> from CHANGELOG.md (QCLI-398, scripts/github-release.mjs): GitHub
// had stopped at v0.6.0 because no step did. A missing CHANGELOG section
// refuses before any tag moves, dry runs included. --rollback leaves
// releases alone.
//
// Usage:
//   node scripts/promote-release.mjs --record <path> --qualification-run <id>             # dry run
//   node scripts/promote-release.mjs --record <path> --qualification-run <id> --promote   # move latest
//   node scripts/promote-release.mjs --rollback <path>                                    # restore it
//
// Auth is the publisher's: a stored granular token (Keychain, then
// NPM_TOKEN) in a temp npmrc, else the interactive login with --otp.

import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { rmSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { ensureGitHubRelease, releaseNotesFor } from "./github-release.mjs";
import {
  describeKeychainState,
  isPublished,
  isValidGranularTokenShape,
  qualifyBundle,
  registryHoldsTarball,
  resolveToken,
  STAGE_TAG,
  tokenShape,
} from "./publish-release.mjs";
import { describeOverride, LAUNCHER } from "./qualification/e2e-receipt.mjs";
import { checkLauncherEquivalence } from "./qualification/launcher-equivalence.mjs";
import { REQUIRED_PLATFORMS } from "./qualification/native-execution-receipt.mjs";
import {
  requirePairQualification,
  resolveTagCommit,
} from "./qualification/pair-receipt.mjs";

const execFile = promisify(execFileCallback);
const root = dirname(dirname(fileURLToPath(import.meta.url)));

export const PROMOTE_TAG = "latest";
export const RECORD_KIND = "quest.promotion-record.v1";

/** Platforms first, wrapper last: the same order the publisher writes in. */
export const RELEASE_PACKAGES = Object.freeze([
  ...REQUIRED_PLATFORMS.map((platform) => `@opum-ai/quest-${platform}`),
  LAUNCHER,
]);

/**
 * The one `npm publish` in this pipeline that does not stage (QCLI-399): the
 * bundle's final X launcher, straight onto `latest`. Every other publish goes
 * through publish-release.mjs's publishArgs and stages under release-candidate.
 */
export function launcherPublishArgs(tarball, { otp } = {}) {
  return [
    "publish",
    tarball,
    "--access",
    "public",
    "--tag",
    PROMOTE_TAG,
    ...(otp ? ["--otp", otp] : []),
  ];
}

/**
 * An anonymous read of one package's dist-tags. Throws on anything but a
 * 200 with an object body: an unreadable tag set is not an empty one.
 */
export async function readDistTags(name, { fetchFn = fetch } = {}) {
  const url = `https://registry.npmjs.org/-/package/${name.replace("/", "%2f")}/dist-tags`;
  const response = await fetchFn(url, { cache: "no-store" });
  if (!response.ok)
    throw new Error(`${url} answered ${response.status}, not 200`);
  const tags = await response.json();
  if (!tags || typeof tags !== "object" || Array.isArray(tags))
    throw new Error(`${url} did not return a dist-tag object`);
  return tags;
}

/**
 * Reads every package's tags and builds the record, or says why not. Refuses
 * unless the version is staged under release-candidate on ALL of them: moving
 * `latest` on a subset would pair a qualified wrapper with a platform package
 * nobody staged.
 */
export async function planPromotion({
  version,
  // QCLI-399: the launcher is staged at its rc version, not at X.
  launcherVersion,
  packages = RELEASE_PACKAGES,
  readTags = readDistTags,
  now = () => new Date(),
  // A rerun that reuses the first run's record: some packages may already
  // read the new version, which is exactly what the record is for.
  resuming = false,
}) {
  const problems = [];
  const entries = [];
  for (const name of packages) {
    let tags;
    try {
      tags = await readTags(name);
    } catch (error) {
      problems.push(`${name}: dist-tags unreadable (${error.message})`);
      continue;
    }
    const staged = name === LAUNCHER ? launcherVersion : version;
    if (!staged || tags[STAGE_TAG] !== staged)
      problems.push(
        `${name}: ${STAGE_TAG} is ${JSON.stringify(tags[STAGE_TAG] ?? null)}, not ${staged ?? `${version}-rc.<N>`}; stage it with scripts/publish-release.mjs first`,
      );
    if (typeof tags[PROMOTE_TAG] !== "string")
      problems.push(
        `${name}: has no ${PROMOTE_TAG} to record as the prior value`,
      );
    else if (tags[PROMOTE_TAG] === version && !resuming)
      // Only a lost record reaches here: a fresh record would name the new
      // version as the prior one, and a rollback from it would restore nothing.
      problems.push(
        `${name}: ${PROMOTE_TAG} already reads ${version}; a new record would store that as the prior value -- pass the record written by the first run`,
      );
    entries.push({ name, priorLatest: tags[PROMOTE_TAG] ?? null });
  }
  if (problems.length) return { ok: false, problems };
  return {
    ok: true,
    record: {
      schemaVersion: 1,
      kind: RECORD_KIND,
      version,
      recordedAt: now().toISOString(),
      packages: entries,
    },
  };
}

/** Rejects a record that is not one this script wrote for this release. */
export function validateRecord(
  record,
  { version, packages = RELEASE_PACKAGES } = {},
) {
  const problems = [];
  if (record?.kind !== RECORD_KIND)
    problems.push(
      `record kind is ${JSON.stringify(record?.kind)}, not ${RECORD_KIND}`,
    );
  if (version !== undefined && record?.version !== version)
    problems.push(
      `record is for ${JSON.stringify(record?.version)}, the release is ${version}`,
    );
  const names = (record?.packages ?? []).map((entry) => entry?.name);
  if (JSON.stringify(names) !== JSON.stringify(packages))
    problems.push(
      `record names ${JSON.stringify(names)}, expected ${JSON.stringify(packages)}`,
    );
  // QCLI-391 (paired with lore-cli LCLI-617): the less-than rule below
  // compares against record.version, and --rollback validates without
  // {version}, so its shape is checked here rather than assumed.
  const comparable = STRICT_SEMVER.test(record?.version ?? "");
  if (!comparable)
    problems.push(
      `record's version is ${JSON.stringify(record?.version)}, not a plain X.Y.Z release`,
    );
  // QCLI-390 (S1, from lore-cli's review of its mirror): a rollback sets
  // `latest` to exactly these values with no receipt, so each must be a
  // real version that is not the one being rolled back -- never a tag name
  // or an arbitrary number written into the file by hand.
  for (const entry of record?.packages ?? [])
    if (typeof entry?.priorLatest !== "string")
      problems.push(`record has no prior ${PROMOTE_TAG} for ${entry?.name}`);
    else if (!STRICT_SEMVER.test(entry.priorLatest))
      problems.push(
        `record's prior ${PROMOTE_TAG} for ${entry.name} is ${JSON.stringify(entry.priorLatest)}, not a version`,
      );
    else if (entry.priorLatest === record.version)
      problems.push(
        `record's prior ${PROMOTE_TAG} for ${entry.name} is the release version itself`,
      );
    // QCLI-391: promotion never moves `latest` backwards, so a genuine
    // record's prior is always older. A newer one ("5.7.0" in a 5.6.7
    // record) passes every check above and checkRollbackState, and would
    // move `latest` onto a version no receipt qualified.
    else if (
      comparable &&
      compareReleaseVersions(entry.priorLatest, record.version) > 0
    )
      problems.push(
        `record's prior ${PROMOTE_TAG} for ${entry.name} is ${entry.priorLatest}, newer than the release ${record.version}; a rollback may only move ${PROMOTE_TAG} backwards`,
      );
  return { ok: problems.length === 0, problems };
}

const STRICT_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/**
 * Orders two STRICT_SEMVER versions: negative, zero or positive. Each
 * component compares by length, then lexically -- exact numeric order at any
 * size, since the grammar forbids leading zeros; Number() would not be past
 * 2^53. The same comparison as lore-cli's LCLI-617, so the pair's verdicts
 * cannot diverge on a large component.
 */
export function compareReleaseVersions(a, b) {
  const [left, right] = [a.split("."), b.split(".")];
  for (let i = 0; i < 3; i++) {
    if (left[i].length !== right[i].length)
      return left[i].length - right[i].length;
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
  }
  return 0;
}

/**
 * QCLI-390 (S1): a rollback may only UNDO this record's promotion. Every
 * package's current `latest` must be the record's version (moved) or its
 * recorded prior value (never moved, or already restored). Anything else
 * means `latest` has moved on since -- rolling an old record back would
 * silently downgrade it. An unreadable tag set refuses.
 */
export async function checkRollbackState({ record, readTags = readDistTags }) {
  const problems = [];
  for (const { name, priorLatest } of record.packages) {
    let tags;
    try {
      tags = await readTags(name);
    } catch (error) {
      problems.push(`${name}: dist-tags unreadable (${error.message})`);
      continue;
    }
    const current = tags[PROMOTE_TAG];
    if (current !== record.version && current !== priorLatest)
      problems.push(
        `${name}: ${PROMOTE_TAG} is ${JSON.stringify(current ?? null)}, neither ${record.version} nor the recorded prior ${priorLatest}; this record no longer describes the registry`,
      );
  }
  return { ok: problems.length === 0, problems };
}

/**
 * Moves `latest` to the version, in record order. On the first failure it
 * restores every tag it already moved to the recorded prior value and stops,
 * so a half-promoted release is not left behind by this run.
 *
 * QCLI-399: the launcher, last in the record, is not tag-moved but handed to
 * `publishLauncher`, which publishes X onto `latest`. Its failure rolls back
 * exactly like a tag failure, the launcher's own `latest` included.
 */
export async function promote({
  record,
  setTag,
  publishLauncher,
  log = () => {},
}) {
  const moved = [];
  for (const { name } of record.packages) {
    try {
      if (name === LAUNCHER) {
        if (!publishLauncher)
          throw new Error(
            "the launcher reaches latest by a publish of X, and no publisher was given",
          );
        const how = await publishLauncher();
        moved.push(name);
        log(`${name}: ${PROMOTE_TAG} -> ${record.version} (${how})`);
        continue;
      }
      await setTag(name, record.version, PROMOTE_TAG);
      moved.push(name);
      log(`${name}: ${PROMOTE_TAG} -> ${record.version}`);
    } catch (error) {
      log(`${name}: FAILED to move ${PROMOTE_TAG} (${error.message})`);
      const restored = await rollback({
        record: {
          ...record,
          // The failed package too (QCLI-390, S2): a write that errored
          // may still have been applied (a timeout after the registry
          // accepted it), and restoring a tag that never moved is a no-op.
          packages: record.packages.filter(
            (entry) => moved.includes(entry.name) || entry.name === name,
          ),
        },
        setTag,
        log,
      });
      return { ok: false, moved, failed: name, restored };
    }
  }
  return { ok: true, moved };
}

/**
 * Restores every package's `latest` to its recorded prior value. Keeps going
 * past a failure so one stuck package does not strand the rest, and reports
 * each one.
 */
export async function rollback({ record, setTag, log = () => {} }) {
  const failed = [];
  for (const { name, priorLatest } of record.packages) {
    try {
      await setTag(name, priorLatest, PROMOTE_TAG);
      log(`${name}: ${PROMOTE_TAG} restored to ${priorLatest}`);
    } catch (error) {
      failed.push(name);
      log(
        `${name}: FAILED to restore ${PROMOTE_TAG} to ${priorLatest} (${error.message})`,
      );
    }
  }
  return { ok: failed.length === 0, failed };
}

function sha256File(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Downloads exactly what the registry serves for one package version, into
 * `into`, and returns the file's path. `npm pack <spec>` fetches the
 * published tarball and checks it against npm's own integrity.
 */
export async function downloadServedTarball(
  spec,
  into,
  { execFile: execFileFn = execFile } = {},
) {
  const { stdout } = await execFileFn(
    "npm",
    ["pack", spec, "--pack-destination", into, "--json", "--prefer-online"],
    { maxBuffer: 32 * 1024 * 1024 },
  );
  const parsed = JSON.parse(stdout);
  const entry = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0];
  if (!entry?.filename) throw new Error(`npm pack ${spec} produced no archive`);
  return join(into, entry.filename);
}

/**
 * Pair-reader step 6 (opum-cli-e2e receipts/README.md blob 241ac885): what the
 * registry serves at launcherVersion right now must be the rc the bundle
 * qualified, and the X about to be published must be that rc with only its
 * version substituted. Re-derived from the registry's bytes each time it is
 * called, never from a recorded verdict. Every failure is returned.
 */
export async function checkServedLauncher({
  version,
  launcherVersion,
  qualifiedRc,
  finalTarball,
  download = (spec, into) => downloadServedTarball(spec, into),
  checkEquivalence = checkLauncherEquivalence,
}) {
  const scratch = await mkdtemp(join(tmpdir(), "quest-served-launcher-"));
  try {
    let served;
    try {
      served = await download(`${LAUNCHER}@${launcherVersion}`, scratch);
    } catch (error) {
      return {
        ok: false,
        problems: [
          `${LAUNCHER}@${launcherVersion} could not be downloaded from the registry (${String(error?.message ?? error).split("\n")[0]})`,
        ],
      };
    }
    const problems = [];
    const [servedDigest, qualifiedDigest] = [
      sha256File(await readFile(served)),
      sha256File(await readFile(qualifiedRc)),
    ];
    if (servedDigest !== qualifiedDigest)
      problems.push(
        `npm serves ${LAUNCHER}@${launcherVersion} as sha256 ${servedDigest}; the qualified bundle's rc is ${qualifiedDigest}`,
      );
    const equivalence = await checkEquivalence({
      rcTarball: served,
      finalTarball,
      rcVersion: launcherVersion,
      version,
    });
    problems.push(...equivalence.problems);
    return { ok: problems.length === 0, problems };
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

/**
 * Whether X is already on npm, and if so whether as the qualified final
 * launcher. Throws on a foreign X, on an X whose integrity cannot be read,
 * and on a registry that cannot say whether X exists at all. Run before any
 * tag moves, so a foreign X refuses with nothing written (as lore-cli's
 * LCLI-621 does), and again at the publish, which a concurrent write could
 * still race.
 */
export async function checkFinalLauncherSlot({
  version,
  finalTarball,
  alreadyPublished = (name, v) => isPublished(name, v),
  holds = (name, v, tarball) => registryHoldsTarball(name, v, tarball),
}) {
  if (!(await alreadyPublished(LAUNCHER, version))) return "absent";
  const held = await holds(LAUNCHER, version, finalTarball);
  // An unreadable integrity is lag or a failed read, not a mismatch: the
  // remedy is a rerun at the same version (Article 3 clause 5).
  if (!held.ok && held.actual == null)
    throw new Error(
      `${LAUNCHER}@${version} is on the registry but its dist.integrity could not be read; re-run the promotion at the same version`,
    );
  if (!held.ok)
    throw new Error(
      `${LAUNCHER}@${version} is already on the registry as ${held.actual}, not the qualified ${held.expected}; this needs a new version, not a rerun`,
    );
  return "qualified";
}

/**
 * Publishes the final X launcher onto `latest`, or -- on a rerun after it
 * already landed -- confirms npm holds exactly those bytes and moves the tag.
 * Step 6 runs first, every time, so nothing irreversible happens on a
 * re-derivation that no longer holds.
 */
export async function publishFinalLauncher({
  version,
  finalTarball,
  recheck,
  publish,
  setTag,
  alreadyPublished = (name, v) => isPublished(name, v),
  holds = (name, v, tarball) => registryHoldsTarball(name, v, tarball),
}) {
  const again = await recheck();
  if (!again.ok)
    throw new Error(
      `the launcher substitution check no longer holds against the registry: ${again.problems.join("; ")}`,
    );
  const slot = await checkFinalLauncherSlot({
    version,
    finalTarball,
    alreadyPublished,
    holds,
  });
  if (slot === "qualified") {
    await setTag(LAUNCHER, version, PROMOTE_TAG);
    return "already published as the qualified bytes; tag moved";
  }
  await publish(finalTarball);
  return "published";
}

/**
 * Pair-reader step 7's integrity half: npm serves X as the bundle's final
 * tarball. The tag half is verifyTags. An unreadable integrity is retried,
 * because the registry's read lags a publish; a different one is not.
 */
export async function verifyFinalLauncher({
  version,
  finalTarball,
  holds = (name, v, tarball) => registryHoldsTarball(name, v, tarball),
  attempts = 10,
  delayMs = 15_000,
  sleep = (ms) => new Promise((done) => setTimeout(done, ms)),
}) {
  let held;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    held = await holds(LAUNCHER, version, finalTarball);
    if (held.ok || held.actual != null) break;
    if (attempt < attempts) await sleep(delayMs);
  }
  return held.ok
    ? { ok: true, problems: [] }
    : {
        ok: false,
        problems: [
          held.actual == null
            ? `${LAUNCHER}@${version}: npm returned no dist.integrity`
            : `${LAUNCHER}@${version}: npm serves ${held.actual}, the qualified final launcher is ${held.expected}`,
        ],
      };
}

/**
 * Confirms the registry now serves the expected `latest` for every package.
 * A tag write returning success is not the registry serving it, so this
 * re-reads, with a bounded wait for the read to catch up.
 */
export async function verifyTags({
  expected,
  readTags = readDistTags,
  attempts = 10,
  delayMs = 15_000,
  sleep = (ms) => new Promise((done) => setTimeout(done, ms)),
}) {
  let wrong = [];
  for (let attempt = 1; attempt <= attempts; attempt++) {
    wrong = [];
    for (const [name, value] of Object.entries(expected)) {
      const tags = await readTags(name).catch(() => ({}));
      if (tags[PROMOTE_TAG] !== value)
        wrong.push(
          `${name}: ${PROMOTE_TAG} reads ${JSON.stringify(tags[PROMOTE_TAG] ?? null)}, expected ${value}`,
        );
    }
    if (!wrong.length) return { ok: true, attempts: attempt, wrong };
    if (attempt < attempts) await sleep(delayMs);
  }
  return { ok: false, attempts, wrong };
}

async function main(argv) {
  const flag = (name) => {
    const index = argv.indexOf(name);
    if (index === -1) return undefined;
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`${name} requires a value`);
    return value;
  };
  const rollbackPath = flag("--rollback");
  const recordPath = flag("--record");
  const otp = flag("--otp");
  const qualificationRun = flag("--qualification-run");
  const act = argv.includes("--promote") || rollbackPath !== undefined;
  if (!rollbackPath && !recordPath)
    throw new Error(
      "--record <path> is required: it is where every prior latest is written before any tag moves, and what --rollback reads",
    );

  const version = JSON.parse(
    await readFile(join(root, "package.json"), "utf8"),
  ).version;

  let record;
  let release;
  let qualified;
  let bundleDir;
  let launcherVersion;
  if (rollbackPath) {
    record = JSON.parse(await readFile(rollbackPath, "utf8"));
    const valid = validateRecord(record);
    const state = valid.ok
      ? await checkRollbackState({ record })
      : { ok: true, problems: [] };
    if (!valid.ok || !state.ok) {
      console.error(`Refusing to roll back from ${rollbackPath}:`);
      for (const problem of [...valid.problems, ...state.problems])
        console.error(`  - ${problem}`);
      process.exit(1);
    }
  } else {
    // QCLI-399: the X launcher that reaches latest is the qualified bundle's
    // final/ tarball, so the bundle is fetched from the run and gated on the
    // pass-1 receipt again -- against the commit the v<version> tag peels to.
    if (!qualificationRun)
      throw new Error(
        "--qualification-run <id> is required: the prepublication-qualification run whose quest-candidate-bundle was staged, and whose final/ launcher is what publishes to latest",
      );
    const peeled = await resolveTagCommit(version);
    if (!peeled.commit) {
      console.error(`Refusing to promote ${version}: ${peeled.error}`);
      process.exit(1);
    }
    bundleDir = await mkdtemp(join(tmpdir(), "quest-promote-bundle-"));
    // On every exit, the refusals' process.exit included, which skips finally.
    process.once("exit", () =>
      rmSync(bundleDir, { recursive: true, force: true }),
    );
    qualified = await qualifyBundle({
      runId: qualificationRun,
      commit: peeled.commit,
      version,
      into: bundleDir,
    });
    if (!qualified.ok) {
      console.error(
        `Refusing to promote ${version}: the bundle from run ${qualificationRun} is not the qualified release of ${peeled.commit.slice(0, 7)}.`,
      );
      for (const problem of qualified.problems) console.error(`  - ${problem}`);
      process.exit(1);
    }
    launcherVersion = qualified.launcher.stagedVersion;
    console.log(
      `Bundle from run ${qualificationRun} is the qualified ${version} at ${peeled.commit.slice(0, 7)} (${qualified.source}); launcher staged as ${launcherVersion}, ${qualified.launcher.final.filename} sha256 ${qualified.launcher.final.sha256}.`,
    );

    // QCLI-388, promote only: opum-cli-e2e's verdict on the STAGED pair,
    // installed from the registry, read here rather than relayed. Dry runs
    // too, so a dry run answers "would this promote". --rollback never
    // reaches this branch: restoring prior tags must always be possible.
    const pair = await requirePairQualification({
      version,
      packages: RELEASE_PACKAGES,
    });
    if (pair.ok && pair.launcherVersion !== launcherVersion)
      pair.problems.push(
        `the pair receipt qualified launcher ${pair.launcherVersion}, the bundle staged ${launcherVersion}`,
      );
    if (!pair.ok || pair.problems.length) {
      console.error(
        `Refusing to promote ${version}: no opum-cli-e2e pair receipt qualifies the staged pair as npm serves it now.`,
      );
      for (const problem of pair.problems) console.error(`  - ${problem}`);
      process.exit(1);
    }
    if (pair.override)
      console.log(describeOverride(pair.override, pair.source));
    console.log(
      `Pair receipt ${pair.source} qualifies quest ${version} with lore ${version}, and all ${RELEASE_PACKAGES.length} staged tarballs npm serves match it (launcher at ${launcherVersion}).`,
    );

    const existing = await readFile(recordPath, "utf8").catch(() => null);
    if (existing) {
      record = JSON.parse(existing);
      const valid = validateRecord(record, { version });
      if (!valid.ok) {
        console.error(`Refusing to reuse ${recordPath}:`);
        for (const problem of valid.problems) console.error(`  - ${problem}`);
        process.exit(1);
      }
      console.log(
        `Reusing the record at ${recordPath} (written ${record.recordedAt}); prior values are NOT re-read.`,
      );
    }
    // The staging precondition is checked on every run, a reused record
    // included: it is a fact about the registry now, not about the record.
    const plan = await planPromotion({
      version,
      launcherVersion,
      resuming: Boolean(existing),
    });
    if (!plan.ok) {
      console.error(`Refusing to promote ${version}:`);
      for (const problem of plan.problems) console.error(`  - ${problem}`);
      process.exit(1);
    }
    record ??= plan.record;
    console.log(
      `${version} is staged under ${STAGE_TAG} on all ${record.packages.length} packages (the launcher as ${launcherVersion}). Prior ${PROMOTE_TAG}:`,
    );
    for (const entry of record.packages)
      console.log(`  ${entry.name}  ${entry.priorLatest}`);

    // Step 6, before any tag moves; it runs again just before the publish.
    const served = await checkServedLauncher({
      version,
      launcherVersion,
      qualifiedRc: qualified.launcher.stagedTarball,
      finalTarball: qualified.launcher.final.path,
    });
    if (!served.ok) {
      console.error(
        `Refusing to promote ${version}: the ${version} launcher is not the rc npm serves with only its version substituted (Article 3 clause 5).`,
      );
      for (const problem of served.problems) console.error(`  - ${problem}`);
      process.exit(1);
    }
    console.log(
      `npm serves ${LAUNCHER}@${launcherVersion} as the qualified rc, and ${qualified.launcher.final.filename} differs from it only by the version string.`,
    );
    // Before any tag moves: an X already on npm must be the qualified final
    // launcher, or the platforms' `latest` would move and then roll back.
    try {
      const slot = await checkFinalLauncherSlot({
        version,
        finalTarball: qualified.launcher.final.path,
      });
      console.log(
        slot === "absent"
          ? `${LAUNCHER}@${version} is not on npm yet; promotion publishes it.`
          : `${LAUNCHER}@${version} is already on npm as the qualified final launcher; promotion moves its tag.`,
      );
    } catch (error) {
      console.error(`Refusing to promote ${version}: ${error.message}.`);
      process.exit(1);
    }

    // QCLI-398: the GitHub Release is cut after `latest` moves, so its notes
    // must exist BEFORE anything moves; finding no section afterwards would
    // leave a promoted version with no release.
    release = await releaseNotesFor(version);
    if (!release) {
      console.error(
        `Refusing to promote ${version}: CHANGELOG.md has no non-empty "## ${version}" section for its GitHub Release.`,
      );
      process.exit(1);
    }
    // A read of the release, on --promote as well as the dry run: a gh that
    // is missing, logged out or offline refuses here, before any tag moves,
    // instead of being found after `latest` has already moved.
    const planned = await ensureGitHubRelease({
      version,
      ...release,
      dryRun: true,
    });
    console.log(`GitHub Release: ${planned.detail}.`);
    if (!planned.ok) {
      console.error(
        `Refusing to promote ${version}: the GitHub Release step could not be checked, so it would fail after ${PROMOTE_TAG} moves.`,
      );
      process.exit(1);
    }
    if (!act) {
      console.log(
        `\nDry run only. Re-run with --promote to write ${recordPath} and move ${PROMOTE_TAG}.`,
      );
      return;
    }
    if (!existing) {
      await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, {
        flag: "wx",
      });
      console.log(`Recorded to ${recordPath} before moving anything.`);
    }
  }

  const { token, source, keychain } = await resolveToken();
  let npmrcDir;
  const env = { ...process.env };
  if (token) {
    if (!isValidGranularTokenShape(tokenShape(token)))
      throw new Error(
        `Refusing: the credential from ${source} does not look like an npm granular access token.`,
      );
    npmrcDir = await mkdtemp(join(tmpdir(), "quest-promote-npmrc-"));
    await writeFile(
      join(npmrcDir, ".npmrc"),
      `//registry.npmjs.org/:_authToken=${token}\n`,
    );
    env.npm_config_userconfig = join(npmrcDir, ".npmrc");
    // The token file must not outlive a process.exit inside the try below.
    process.once("exit", () =>
      rmSync(npmrcDir, { recursive: true, force: true }),
    );
    console.log(`Auth: using a token from ${source}.`);
  } else {
    console.log(`Auth: no token -- ${describeKeychainState(keychain)}.`);
    if (!otp)
      throw new Error(
        "--otp <code> is required when no token is configured; the account has 2FA",
      );
  }
  const setTag = (name, target, tag) =>
    execFile(
      "npm",
      [
        "dist-tag",
        "add",
        `${name}@${target}`,
        tag,
        ...(!token && otp ? ["--otp", otp] : []),
      ],
      { env },
    );

  try {
    const log = (line) => console.log(`  ${line}`);
    if (rollbackPath) {
      console.log(
        `Restoring ${PROMOTE_TAG} from ${rollbackPath} (release ${record.version}):`,
      );
      const outcome = await rollback({ record, setTag, log });
      if (!outcome.ok) {
        console.error(
          `NOT restored: ${outcome.failed.join(", ")}. Re-run --rollback; it is idempotent.`,
        );
        process.exit(1);
      }
      const expected = Object.fromEntries(
        record.packages.map((entry) => [entry.name, entry.priorLatest]),
      );
      const check = await verifyTags({ expected });
      for (const line of check.wrong) console.error(`  ${line}`);
      if (!check.ok) process.exit(1);
      console.log(
        `Rolled back: every ${PROMOTE_TAG} reads its recorded prior value.`,
      );
      return;
    }

    const final = qualified.launcher.final;
    const publishLauncher = () =>
      publishFinalLauncher({
        version: record.version,
        finalTarball: final.path,
        // Step 6 again, immediately before the one irreversible write.
        recheck: () =>
          checkServedLauncher({
            version: record.version,
            launcherVersion,
            qualifiedRc: qualified.launcher.stagedTarball,
            finalTarball: final.path,
          }),
        publish: (tarball) =>
          execFile(
            "npm",
            launcherPublishArgs(tarball, { otp: !token ? otp : undefined }),
            { env, maxBuffer: 32 * 1024 * 1024 },
          ),
        setTag,
      });
    console.log(
      `\nMoving ${PROMOTE_TAG} to ${record.version}: the platforms by dist-tag, then ${LAUNCHER}@${record.version} published onto ${PROMOTE_TAG} from ${final.filename}:`,
    );
    const outcome = await promote({ record, setTag, publishLauncher, log });
    if (!outcome.ok) {
      console.error(
        `\nPROMOTION FAILED at ${outcome.failed}. The ${outcome.moved.length} tag(s) this run moved were ` +
          (outcome.restored.ok
            ? "restored to their recorded prior values."
            : `NOT all restored (${outcome.restored.failed.join(", ")}); run --rollback ${recordPath}.`) +
          " Retry at the same version; never skip to a different number (Article 3 clause 5).",
      );
      process.exit(1);
    }
    const expected = Object.fromEntries(
      record.packages.map((entry) => [entry.name, record.version]),
    );
    const check = await verifyTags({ expected });
    for (const line of check.wrong) console.error(`  ${line}`);
    if (!check.ok) {
      console.error(
        `The writes returned success but the registry does not serve ${PROMOTE_TAG} = ${record.version} everywhere after ${check.attempts} reads.`,
      );
      process.exit(1);
    }
    // Step 7: latest reads X (above), and X is the qualified final launcher.
    const bytes = await verifyFinalLauncher({
      version: record.version,
      finalTarball: final.path,
    });
    if (!bytes.ok) {
      for (const problem of bytes.problems) console.error(`  ${problem}`);
      console.error(
        `${PROMOTE_TAG} reads ${record.version} everywhere, but npm does not serve the qualified ${final.filename} as ${LAUNCHER}@${record.version}. Do NOT run npm unpublish.`,
      );
      process.exit(1);
    }
    console.log(
      `\nPromoted: ${PROMOTE_TAG} reads ${record.version} on all ${record.packages.length} packages (anonymous registry read, ${check.attempts} check${check.attempts === 1 ? "" : "s"}), and npm serves ${LAUNCHER}@${record.version} as the qualified ${final.filename}. Rollback: --rollback ${recordPath}`,
    );
  } finally {
    if (npmrcDir) await rm(npmrcDir, { recursive: true, force: true });
  }

  // QCLI-398: reached only after a verified promotion (every other path in
  // the try returns or exits). The release is cut after the finally, so the
  // npm token file is already gone: gh does not need it, and process.exit
  // below would skip a finally.
  const cut = await ensureGitHubRelease({
    version: record.version,
    ...release,
  });
  if (!cut.ok) {
    console.error(
      `\nGitHub Release NOT cut: ${cut.detail}. npm ${PROMOTE_TAG} moved and is verified -- do NOT roll back for this. Repair with: node scripts/github-release.mjs --version ${record.version} --create`,
    );
    process.exit(1);
  }
  console.log(`GitHub Release: ${cut.detail}.`);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}
