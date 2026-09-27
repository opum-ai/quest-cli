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
// Usage:
//   node scripts/promote-release.mjs --record <path>             # dry run
//   node scripts/promote-release.mjs --record <path> --promote   # move latest
//   node scripts/promote-release.mjs --rollback <path>           # restore it
//
// Auth is the publisher's: a stored granular token (Keychain, then
// NPM_TOKEN) in a temp npmrc, else the interactive login with --otp.

import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  describeKeychainState,
  isValidGranularTokenShape,
  resolveToken,
  STAGE_TAG,
  tokenShape,
} from "./publish-release.mjs";
import { describeOverride } from "./qualification/e2e-receipt.mjs";
import { REQUIRED_PLATFORMS } from "./qualification/native-execution-receipt.mjs";
import { requirePairQualification } from "./qualification/pair-receipt.mjs";

const execFile = promisify(execFileCallback);
const root = dirname(dirname(fileURLToPath(import.meta.url)));

export const PROMOTE_TAG = "latest";
export const RECORD_KIND = "quest.promotion-record.v1";

/** Platforms first, wrapper last: the same order the publisher writes in. */
export const RELEASE_PACKAGES = Object.freeze([
  ...REQUIRED_PLATFORMS.map((platform) => `@opum-ai/quest-${platform}`),
  "@opum-ai/quest",
]);

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
    if (tags[STAGE_TAG] !== version)
      problems.push(
        `${name}: ${STAGE_TAG} is ${JSON.stringify(tags[STAGE_TAG] ?? null)}, not ${version}; stage it with scripts/publish-release.mjs first`,
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
  for (const entry of record?.packages ?? [])
    if (typeof entry?.priorLatest !== "string")
      problems.push(`record has no prior ${PROMOTE_TAG} for ${entry?.name}`);
  return { ok: problems.length === 0, problems };
}

/**
 * Moves `latest` to the version, in record order. On the first failure it
 * restores every tag it already moved to the recorded prior value and stops,
 * so a half-promoted release is not left behind by this run.
 */
export async function promote({ record, setTag, log = () => {} }) {
  const moved = [];
  for (const { name } of record.packages) {
    try {
      await setTag(name, record.version, PROMOTE_TAG);
      moved.push(name);
      log(`${name}: ${PROMOTE_TAG} -> ${record.version}`);
    } catch (error) {
      log(`${name}: FAILED to move ${PROMOTE_TAG} (${error.message})`);
      const restored = await rollback({
        record: {
          ...record,
          packages: record.packages.filter((entry) =>
            moved.includes(entry.name),
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
  const act = argv.includes("--promote") || rollbackPath !== undefined;
  if (!rollbackPath && !recordPath)
    throw new Error(
      "--record <path> is required: it is where every prior latest is written before any tag moves, and what --rollback reads",
    );

  const version = JSON.parse(
    await readFile(join(root, "package.json"), "utf8"),
  ).version;

  let record;
  if (rollbackPath) {
    record = JSON.parse(await readFile(rollbackPath, "utf8"));
    const valid = validateRecord(record);
    if (!valid.ok) {
      console.error(`Refusing to roll back from ${rollbackPath}:`);
      for (const problem of valid.problems) console.error(`  - ${problem}`);
      process.exit(1);
    }
  } else {
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
    const plan = await planPromotion({ version, resuming: Boolean(existing) });
    if (!plan.ok) {
      console.error(`Refusing to promote ${version}:`);
      for (const problem of plan.problems) console.error(`  - ${problem}`);
      process.exit(1);
    }
    record ??= plan.record;
    console.log(
      `${version} is staged under ${STAGE_TAG} on all ${record.packages.length} packages. Prior ${PROMOTE_TAG}:`,
    );
    for (const entry of record.packages)
      console.log(`  ${entry.name}  ${entry.priorLatest}`);

    // QCLI-388, promote only: opum-cli-e2e's verdict on the STAGED pair,
    // installed from the registry, read here rather than relayed. Dry runs
    // too, so a dry run answers "would this promote". --rollback never
    // reaches this branch: restoring prior tags must always be possible.
    const pair = await requirePairQualification({
      version,
      packages: RELEASE_PACKAGES,
    });
    if (!pair.ok) {
      console.error(
        `Refusing to promote ${version}: no opum-cli-e2e pair receipt qualifies the staged pair as npm serves it now.`,
      );
      for (const problem of pair.problems) console.error(`  - ${problem}`);
      process.exit(1);
    }
    if (pair.override)
      console.log(describeOverride(pair.override, pair.source));
    console.log(
      `Pair receipt ${pair.source} qualifies quest ${version} with lore ${version}, and all ${RELEASE_PACKAGES.length} tarballs npm serves match it.`,
    );
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

    console.log(
      `\nMoving ${PROMOTE_TAG} to ${record.version}, platforms first:`,
    );
    const outcome = await promote({ record, setTag, log });
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
    console.log(
      `\nPromoted: ${PROMOTE_TAG} reads ${record.version} on all ${record.packages.length} packages (anonymous registry read, ${check.attempts} check${check.attempts === 1 ? "" : "s"}). Rollback: --rollback ${recordPath}`,
    );
  } finally {
    if (npmrcDir) await rm(npmrcDir, { recursive: true, force: true });
  }
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
