// Native-execution receipt tooling (QCLI-135).
//
// A native-execution receipt is the artifact downstream qualification binds to
// when it needs to attest that a published Quest release was EXECUTED on every
// platform it claims to support, not merely built for them. Its consumer is
// opum-cli-e2e, whose validator is fail-closed: a stale commit, a missing or
// failed platform job, an unexpected extra job, or a digest that disagrees with
// the package manifest all refuse the binding.
//
// The reason this file exists rather than a hand-written JSON blob: a receipt
// produced by hand after the fact describes whatever its author believed at the
// time. QCLI-135 was filed because exactly that happened - a receipt for one
// commit outlived the release it described, and six qualification rows moved
// from BLOCKED to FAIL, which is a worse evidential position than having no
// receipt at all.
//
// Two claims that are easy to conflate and are kept separate here on purpose:
//   "these bytes are what was published"  - provable from digests alone.
//   "these bytes ran on this platform"    - provable only from a CI run whose
//                                           per-target jobs executed them.
// A receipt that merges them issues a certificate it did not earn, so the
// emitted document states each separately and names what it does NOT claim.

import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

export const REQUIRED_PLATFORMS = Object.freeze([
  "darwin-arm64",
  "darwin-x64",
  "linux-arm64",
  "linux-x64",
  "win32-arm64",
  "win32-x64",
]);

/**
 * The source-gates job plus one job per platform. Every one of these must be
 * present and successful before a receipt can exist.
 *
 * The receipt records the run's jobs faithfully, with exactly one exclusion:
 * the job that emits it. That job cannot honestly appear in a document it is
 * itself writing — at the moment of writing it has not concluded, so recording
 * it as successful would be an assertion about the future rather than a record
 * of the past. Everything else in the run is recorded as it actually was.
 */
export const REQUIRED_JOBS = Object.freeze([
  "source-gates",
  ...REQUIRED_PLATFORMS,
]);

const SHA256_HEX = /^[0-9a-f]{64}$/;
const COMMIT_HEX = /^[0-9a-f]{40}$/;

export function executableFor(platform) {
  return platform.startsWith("win32-") ? "quest.exe" : "quest";
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Reads one platform's declared digest and independently re-derives it from the
 * tracked binary. A manifest that disagrees with the artifact beside it must
 * never reach a receipt: that disagreement is the defect the receipt exists to
 * rule out, so it is an error here rather than a value to be copied through.
 */
export async function platformEvidence(platform, { directory = root } = {}) {
  const packageDirectory = join(directory, "npm", `quest-${platform}`);
  const manifest = JSON.parse(
    await readFile(join(packageDirectory, "package.json"), "utf8"),
  );
  const declared = manifest.questBinarySha256;
  if (!SHA256_HEX.test(String(declared ?? "")))
    throw new Error(
      `${platform}: questBinarySha256 is not a lowercase sha256 hex digest`,
    );
  const binary = join(packageDirectory, "bin", executableFor(platform));
  const actual = sha256(await readFile(binary));
  if (actual !== declared)
    throw new Error(
      `${platform}: the tracked binary does not match its own manifest — manifest ${declared}, binary ${actual}`,
    );
  return {
    platform,
    packageName: manifest.name,
    executableSha256: declared,
    declaredIn: `npm/quest-${platform}/package.json#questBinarySha256`,
  };
}

/**
 * Builds the receipt document.
 *
 * `jobs` is the workflow run's real job list. Every required job must be
 * present and successful; anything else in the list is dropped rather than
 * recorded, because the emitting job is itself in that list.
 */
export async function buildReceipt({
  commit,
  version,
  runId,
  runUrl,
  runEvent,
  jobs,
  selfJobName = "native-execution-receipt",
  directory = root,
}) {
  if (!COMMIT_HEX.test(String(commit ?? "")))
    throw new Error(`source commit is not a 40-hex commit id: ${commit}`);
  if (!Number.isInteger(runId))
    throw new Error(`CI run id must be an integer, got ${runId}`);

  // Exclude only this job, for the reason given on REQUIRED_JOBS.
  const recorded = (jobs ?? []).filter((job) => job.name !== selfJobName);
  const byName = new Map(recorded.map((job) => [job.name, job]));
  const missing = REQUIRED_JOBS.filter((name) => !byName.has(name));
  if (missing.length)
    throw new Error(
      `the run did not execute every required job; missing: ${missing.join(", ")}`,
    );
  // Every recorded job, not merely the required ones: the list must not be
  // padded with a job that did not pass.
  const failed = recorded
    .filter((job) => job.conclusion !== "success")
    .map((job) => job.name);
  if (failed.length)
    throw new Error(
      `a receipt cannot describe a failed run; these jobs did not succeed: ${failed.join(", ")}`,
    );

  const platforms = [];
  for (const platform of REQUIRED_PLATFORMS)
    platforms.push(await platformEvidence(platform, { directory }));

  return {
    schemaVersion: 1,
    kind: "opum.native-execution-receipt.v1",
    source: {
      repository: "opum-ai/quest-cli",
      commit,
      ...(version ? { version } : {}),
    },
    ciRun: {
      id: runId,
      url:
        runUrl ?? `https://github.com/opum-ai/quest-cli/actions/runs/${runId}`,
      event: runEvent ?? "workflow_dispatch",
      headSha: commit,
      // Derived from the jobs the claim rests on, every one of which has
      // concluded successfully by the time this runs. The run's own conclusion
      // is still pending here precisely because the emitting job is part of it.
      conclusion: "success",
      jobs: recorded.map((job) => ({
        name: job.name,
        conclusion: job.conclusion,
      })),
    },
    platforms,
    coverageClaim: [
      "each listed GitHub Actions runner executed bun scripts/qualification/prepublish.mjs against the pinned commit on its own target and reported success;",
      "on a release ref each platform job additionally reproduced the digest committed at that ref, so the executed bytes are the bytes this receipt names;",
      "every executableSha256 below was re-derived from the tracked binary beside its manifest, not copied from the manifest alone.",
    ],
    notClaimed: [
      "byte identity between outer CI-repacked tarballs and any locally staged tarball family;",
      "execution of any artifact outside its own recorded runner;",
      "anything about a version other than the source commit named above.",
    ],
  };
}

/** Fetches the run's jobs through the GitHub API, for use inside Actions. */
async function fetchJobs(runId, token) {
  const response = await fetch(
    `https://api.github.com/repos/opum-ai/quest-cli/actions/runs/${runId}/jobs?per_page=100`,
    {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28",
      },
    },
  );
  if (!response.ok)
    throw new Error(
      `GitHub API returned ${response.status} listing jobs for run ${runId}`,
    );
  const body = await response.json();
  return (body.jobs ?? []).map((job) => ({
    name: job.name,
    conclusion: job.conclusion,
  }));
}

/**
 * AC#1, mechanised: asserts the receipt's digests are the bytes npm actually
 * serves. This is the check whose absence let a receipt describe a build nobody
 * had published, so it runs against the registry rather than against the repo.
 */
export async function verifyPublished(receipt, version) {
  const problems = [];
  const workspace = await mkdtemp(join(tmpdir(), "quest-receipt-verify-"));
  try {
    for (const entry of receipt.platforms) {
      const specifier = `${entry.packageName}@${version}`;
      let tarball;
      try {
        const { stdout } = await execFile("npm", [
          "view",
          specifier,
          "dist.tarball",
        ]);
        tarball = stdout.trim();
      } catch {
        problems.push(`${entry.platform}: ${specifier} is not published`);
        continue;
      }
      const response = await fetch(tarball);
      if (!response.ok) {
        problems.push(
          `${entry.platform}: could not download ${tarball} (${response.status})`,
        );
        continue;
      }
      const archive = join(workspace, `${entry.platform}.tgz`);
      await writeFile(archive, Buffer.from(await response.arrayBuffer()));
      const extracted = join(workspace, entry.platform);
      await execFile("mkdir", ["-p", extracted]);
      await execFile("tar", ["xzf", archive, "-C", extracted]);
      const binary = join(
        extracted,
        "package",
        "bin",
        executableFor(entry.platform),
      );
      const digest = sha256(await readFile(binary));
      if (digest !== entry.executableSha256)
        problems.push(
          `${entry.platform}: published bytes are ${digest}, receipt says ${entry.executableSha256}`,
        );
    }
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
  return { ok: problems.length === 0, problems };
}

/**
 * The AC#3 release gate: the reason a version cannot ship without a receipt.
 *
 * It deliberately re-derives everything rather than trusting the document. A
 * receipt is only evidence if the thing it describes is the thing being
 * published, so this checks the receipt against the working tree and the tag,
 * not against itself. The failure QCLI-135 was filed for - a receipt that
 * outlived its release - is exactly what the commit and version bindings here
 * refuse.
 */
export async function validateReceipt(
  doc,
  { commit, version, directory = root } = {},
) {
  const problems = [];
  if (!doc || typeof doc !== "object" || Array.isArray(doc))
    return { ok: false, problems: ["receipt is not a JSON object"] };
  if (doc.schemaVersion !== 1)
    problems.push(
      `schemaVersion must be 1, got ${JSON.stringify(doc.schemaVersion)}`,
    );
  if (doc.kind !== "opum.native-execution-receipt.v1")
    problems.push(
      `kind must be opum.native-execution-receipt.v1, got ${JSON.stringify(doc.kind)}`,
    );
  if (commit && doc.source?.commit !== commit)
    problems.push(
      `receipt describes commit ${doc.source?.commit}, but the release is ${commit}`,
    );
  if (version && doc.source?.version !== version)
    problems.push(
      `receipt describes version ${doc.source?.version}, but the release is ${version}`,
    );
  if (doc.ciRun?.headSha !== doc.source?.commit)
    problems.push("ciRun.headSha does not equal the source commit");
  if (doc.ciRun?.conclusion !== "success")
    problems.push("ciRun.conclusion must be success");

  const recorded = (doc.ciRun?.jobs ?? []).map((job) => job?.name);
  for (const name of REQUIRED_JOBS)
    if (!recorded.includes(name))
      problems.push(
        `no CI job named "${name}" — that target was never executed`,
      );
  // Extra jobs are allowed — a workflow may legitimately grow one — but every
  // recorded job must have succeeded, so the list cannot be padded.
  for (const job of doc.ciRun?.jobs ?? [])
    if (job?.conclusion !== "success")
      problems.push(`CI job "${job?.name}" did not succeed`);

  // Re-derive every digest from the artifact actually on disk. A receipt that
  // agrees only with itself proves nothing.
  for (const platform of REQUIRED_PLATFORMS) {
    const entry = (doc.platforms ?? []).find(
      (row) => row?.platform === platform,
    );
    if (!entry) {
      problems.push(`missing native receipt for platform ${platform}`);
      continue;
    }
    try {
      const evidence = await platformEvidence(platform, { directory });
      if (evidence.executableSha256 !== entry.executableSha256)
        problems.push(
          `${platform}: receipt says ${entry.executableSha256}, the artifact on disk is ${evidence.executableSha256}`,
        );
    } catch (error) {
      problems.push(`${platform}: ${error.message}`);
    }
  }
  return { ok: problems.length === 0, problems };
}

/**
 * The release-ref reproduction gate.
 *
 * Without this the receipt's execution claim does not reach the published
 * bytes. Each platform job runs `bun run build:packages`, which REBUILDS the
 * binary and overwrites the tracked one, so a green run otherwise proves only
 * "a binary built from this source executes on this target" — not "the bytes
 * we are about to publish execute on this target". Comparing the rebuild
 * against the digest committed at this ref closes that gap, and it is enforced
 * only on a release ref because ordinary development pushes legitimately carry
 * a stale committed digest.
 */
export async function verifyReproduction(target, { directory = root } = {}) {
  if (!REQUIRED_PLATFORMS.includes(target))
    throw new Error(`unknown platform target: ${target}`);
  const { stdout } = await execFile(
    "git",
    ["show", `HEAD:npm/quest-${target}/package.json`],
    { cwd: directory },
  );
  const committed = JSON.parse(stdout).questBinarySha256;
  const built = sha256(
    await readFile(
      join(directory, "npm", `quest-${target}`, "bin", executableFor(target)),
    ),
  );
  return {
    ok: committed === built,
    committed,
    built,
    target,
  };
}

async function main(argv) {
  const flag = (name) => {
    const index = argv.indexOf(name);
    return index === -1 ? undefined : argv[index + 1];
  };

  if (argv.includes("--verify-reproduction")) {
    const target = flag("--verify-reproduction");
    const result = await verifyReproduction(target);
    if (!result.ok) {
      console.error(
        `${target}: this build does not reproduce the digest committed at this ref.`,
      );
      console.error(`  committed: ${result.committed}`);
      console.error(`  built:     ${result.built}`);
      console.error(
        "  A receipt built on this run would claim the published bytes were executed when they were not.",
      );
      process.exit(1);
    }
    console.log(
      `${target}: build reproduces the committed digest ${result.built}.`,
    );
    return;
  }

  if (argv.includes("--require")) {
    const receiptPath = flag("--receipt");
    if (!receiptPath) {
      console.error(
        "Refusing to publish: no native-execution receipt was supplied (--receipt).",
      );
      process.exit(1);
    }
    const version = JSON.parse(
      await readFile(join(root, "package.json"), "utf8"),
    ).version;
    const commit = (
      await execFile("git", ["rev-parse", "HEAD"], { cwd: root })
    ).stdout.trim();
    let doc;
    try {
      doc = JSON.parse(await readFile(receiptPath, "utf8"));
    } catch (error) {
      console.error(
        `Refusing to publish: ${receiptPath} is unreadable — ${error.message}`,
      );
      process.exit(1);
    }
    const structural = await validateReceipt(doc, { commit, version });
    if (!structural.ok) {
      console.error(`Refusing to publish ${version} at ${commit.slice(0, 7)}:`);
      for (const problem of structural.problems)
        console.error(`  - ${problem}`);
      process.exit(1);
    }
    console.log(
      `Native-execution receipt binds ${version} at ${commit.slice(0, 7)} across all six platforms.`,
    );
    return;
  }

  if (argv.includes("--verify-published")) {
    const version = flag("--verify-published");
    const receipt = JSON.parse(
      await readFile(flag("--receipt") ?? "receipt.json", "utf8"),
    );
    const result = await verifyPublished(receipt, version);
    if (!result.ok) {
      console.error(
        `Receipt does not describe the bytes published as ${version}:`,
      );
      for (const problem of result.problems) console.error(`  - ${problem}`);
      process.exit(1);
    }
    console.log(
      `Receipt matches every platform package published as ${version}.`,
    );
    return;
  }

  const commit =
    flag("--commit") ??
    process.env.GITHUB_SHA ??
    (await execFile("git", ["rev-parse", "HEAD"], { cwd: root })).stdout.trim();
  const runId = Number(flag("--run-id") ?? process.env.GITHUB_RUN_ID);
  const token = process.env.GITHUB_TOKEN;
  const jobs = flag("--jobs")
    ? JSON.parse(await readFile(flag("--jobs"), "utf8"))
    : await fetchJobs(runId, token);
  const version = JSON.parse(
    await readFile(join(root, "package.json"), "utf8"),
  ).version;

  const receipt = await buildReceipt({
    commit,
    version,
    runId,
    runUrl: process.env.GITHUB_SERVER_URL
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${runId}`
      : undefined,
    runEvent: process.env.GITHUB_EVENT_NAME,
    jobs,
    selfJobName: process.env.GITHUB_JOB ?? "native-execution-receipt",
  });
  const out =
    flag("--out") ??
    join(root, `quest-${commit.slice(0, 7)}-native-receipts.json`);
  await writeFile(out, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(
    `Wrote native-execution receipt for ${commit.slice(0, 7)} to ${out}`,
  );
}

if (import.meta.main) await main(process.argv.slice(2));
