// The opum-cli-e2e qualification gate on publication (QCLI-366).
//
// Binding record: opum-doc docs/adr/harden-fleet-ci-against-a-single-runner-
// outage-and-unqualified-publication.md, ruling 3, at main 9222079. The
// publisher HARD-REFUSES without a qualification receipt from opum-cli-e2e
// unless an explicit override is written to the record it reads. A
// warning-only mode was considered there and rejected: lore 0.9.0 shipped over
// a recorded NOT QUALIFIED result.
//
// The receipt format is opum-cli-e2e's, agreed with lore-cli on LCLI-578 and
// deliberately not redesigned here. It lives at receipts/quest/<version>.json
// on opum-cli-e2e's main and binds version, commit, releaseRunId and the
// sha256 of every tarball.
//
// For quest, "the release run" is the prepublication-qualification run on the
// tag that uploaded quest-candidate-bundle, because that is the run whose
// tarballs opum-cli-e2e qualifies (--quest-candidate). release.yml builds no
// tarballs of its own. The gate only means something if those exact files are
// what npm receives, so the publishers publish the bundle's .tgz files
// byte-for-byte rather than repacking the working tree -- the repack is how
// the win32 packages came to differ from the qualified bytes (QCLI-368).
//
// This file never decides that a missing receipt is fine. A 404, a 403 (the
// repository is private, so an unprivileged token gets one), a network error
// and a malformed document all read as NO RECEIPT, and no receipt refuses.

import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { REQUIRED_PLATFORMS } from "./native-execution-receipt.mjs";

const execFile = promisify(execFileCallback);

export const RECEIPT_KIND = "opum.qualification-receipt.v1";
export const RECEIPT_REPOSITORY = "opum-ai/opum-cli-e2e";
export const PRODUCT = "quest";

const COMMIT_HEX = /^[0-9a-f]{40}$/;
const SHA256_HEX = /^[0-9a-f]{64}$/;

export function receiptPath(version) {
  return `receipts/${PRODUCT}/${version}.json`;
}

/** The seven archives a quest release consists of, named as `npm pack` names them. */
export function expectedTarballNames(version) {
  return [
    `opum-ai-quest-${version}.tgz`,
    ...REQUIRED_PLATFORMS.map(
      (platform) => `opum-ai-quest-${platform}-${version}.tgz`,
    ),
  ];
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Reads a downloaded quest-candidate-bundle and re-derives every tarball
 * digest from the bytes on disk. The bundle's own sha256.txt is not consulted:
 * a document agreeing with itself proves nothing about the files beside it.
 */
export async function readBundle(bundleDir) {
  const metadata = JSON.parse(
    await readFile(
      join(bundleDir, "evidence", "package-metadata.json"),
      "utf8",
    ),
  );
  const directory = join(bundleDir, "tarballs");
  const tarballs = {};
  for (const name of (await readdir(directory)).sort())
    if (name.endsWith(".tgz"))
      tarballs[name] = sha256(await readFile(join(directory, name)));
  return { metadata, directory, tarballs };
}

/**
 * Pure verdict over a receipt and the facts of the release about to happen.
 *
 * The override waives the VERDICT and nothing else. A receipt still has to be
 * about these bytes: an override written for a different commit or a
 * different tarball set is not an override for this one.
 */
export function evaluateReceipt(
  doc,
  { version, commit, releaseRunId, tarballs },
) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc))
    return {
      ok: false,
      problems: ["receipt is not a JSON object"],
      override: null,
    };
  const problems = [];
  if (doc.schemaVersion !== 1)
    problems.push(
      `schemaVersion must be 1, got ${JSON.stringify(doc.schemaVersion)}`,
    );
  if (doc.kind !== RECEIPT_KIND)
    problems.push(
      `kind must be ${RECEIPT_KIND}, got ${JSON.stringify(doc.kind)}`,
    );
  if (doc.product !== PRODUCT)
    problems.push(
      `receipt is for product ${JSON.stringify(doc.product)}, not ${PRODUCT}`,
    );
  if (doc.version !== version)
    problems.push(
      `receipt describes version ${JSON.stringify(doc.version)}, the release is ${version}`,
    );
  if (!COMMIT_HEX.test(String(doc.commit ?? "")) || doc.commit !== commit)
    problems.push(
      `receipt describes commit ${JSON.stringify(doc.commit)}, the release is ${commit}`,
    );
  if (
    doc.releaseRunId === undefined ||
    doc.releaseRunId === null ||
    String(doc.releaseRunId) !== String(releaseRunId)
  )
    problems.push(
      `receipt describes run ${JSON.stringify(doc.releaseRunId)}, the tarballs come from run ${releaseRunId}`,
    );

  // Set equality, in both directions. A receipt that omits a tarball did not
  // qualify it; one that names an extra describes a different release.
  const recorded =
    doc.tarballs &&
    typeof doc.tarballs === "object" &&
    !Array.isArray(doc.tarballs)
      ? doc.tarballs
      : {};
  if (recorded !== doc.tarballs)
    problems.push("receipt has no tarballs object");
  for (const [name, digest] of Object.entries(tarballs)) {
    if (!(name in recorded))
      problems.push(`${name}: not in the receipt, so it was never qualified`);
    else if (!SHA256_HEX.test(String(recorded[name])))
      problems.push(`${name}: receipt digest is not a sha256 hex digest`);
    else if (recorded[name] !== digest)
      problems.push(
        `${name}: receipt says ${recorded[name]}, the file being published is ${digest}`,
      );
  }
  for (const name of Object.keys(recorded))
    if (!(name in tarballs))
      problems.push(
        `${name}: named in the receipt but not part of this release`,
      );

  const override =
    doc.override && typeof doc.override === "object" ? doc.override : null;
  if (doc.override !== undefined && !override)
    problems.push("override is present but is not an object");
  // The key is verdict alone. The harness summary line can read NOT QUALIFIED
  // for reasons the verdict field already accounts for (opum-cli-e2e TASK-107).
  if (doc.verdict !== "QUALIFIED" && !override)
    problems.push(
      `verdict is ${JSON.stringify(doc.verdict)}, not "QUALIFIED", and the receipt carries no override`,
    );
  return { ok: problems.length === 0, problems, override };
}

/**
 * Reads the receipt from opum-cli-e2e's main. Every failure is returned as
 * `doc: null` with the reason, never thrown and never retried into a pass.
 */
export async function fetchReceipt(
  version,
  { execFile: execFileFn = execFile } = {},
) {
  const path = receiptPath(version);
  try {
    const { stdout } = await execFileFn(
      "gh",
      [
        "api",
        "-H",
        "Accept: application/vnd.github.raw",
        `repos/${RECEIPT_REPOSITORY}/contents/${path}?ref=main`,
      ],
      { maxBuffer: 8 * 1024 * 1024 },
    );
    return {
      doc: JSON.parse(stdout),
      source: `${RECEIPT_REPOSITORY}@main:${path}`,
    };
  } catch (error) {
    const detail = String(error?.stderr || error?.message || error)
      .trim()
      .split("\n")[0];
    return {
      doc: null,
      source: `${RECEIPT_REPOSITORY}@main:${path}`,
      error: detail,
    };
  }
}

/**
 * The whole gate: the bundle must be a release bundle of this commit and
 * version, carry exactly the seven archives, and match a receipt.
 */
export async function requireQualification({
  bundleDir,
  version,
  commit,
  releaseRunId,
  fetch = (v) => fetchReceipt(v),
}) {
  const problems = [];
  const bundle = await readBundle(bundleDir);
  if (bundle.metadata.sourceCommit !== commit)
    problems.push(
      `bundle was built from ${bundle.metadata.sourceCommit}, the release is ${commit}`,
    );
  if (bundle.metadata.version !== version)
    problems.push(
      `bundle is version ${bundle.metadata.version}, the release is ${version}`,
    );
  if (bundle.metadata.artifactProvenance !== "committed")
    problems.push(
      `bundle provenance is ${JSON.stringify(bundle.metadata.artifactProvenance)}; only a bundle of the committed binaries can be published`,
    );
  const expected = expectedTarballNames(version);
  const present = Object.keys(bundle.tarballs);
  for (const name of expected)
    if (!present.includes(name)) problems.push(`bundle is missing ${name}`);
  for (const name of present)
    if (!expected.includes(name))
      problems.push(`bundle carries an unexpected archive ${name}`);

  const fetched = await fetch(version);
  if (!fetched.doc) {
    problems.push(
      `no opum-cli-e2e qualification receipt at ${fetched.source} (${fetched.error ?? "unreadable"})`,
    );
    return {
      ok: false,
      problems,
      override: null,
      bundle,
      source: fetched.source,
    };
  }
  const verdict = evaluateReceipt(fetched.doc, {
    version,
    commit,
    releaseRunId,
    tarballs: bundle.tarballs,
  });
  problems.push(...verdict.problems);
  return {
    ok: problems.length === 0,
    problems,
    override: verdict.override,
    bundle,
    source: fetched.source,
  };
}

/** Printed verbatim whenever an override is what let a publish proceed. */
export function describeOverride(override, source) {
  return [
    "",
    "!!! QUALIFICATION OVERRIDE IN USE !!!",
    `The receipt at ${source} does not record QUALIFIED. It carries this override, printed verbatim:`,
    JSON.stringify(override, null, 2),
    "",
  ].join("\n");
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
  if (!argv.includes("--require"))
    throw new Error(
      "usage: e2e-receipt.mjs --require --bundle <dir> --run-id <id> --commit <sha> --version <v>",
    );
  const bundleDir = flag("--bundle");
  const releaseRunId = flag("--run-id");
  const commit = flag("--commit");
  const version = flag("--version");
  if (!bundleDir || !releaseRunId || !commit || !version)
    throw new Error(
      "--bundle, --run-id, --commit and --version are all required",
    );
  const gate = await requireQualification({
    bundleDir,
    version,
    commit,
    releaseRunId,
  });
  if (!gate.ok) {
    console.error(
      `Refusing to publish ${version} at ${commit.slice(0, 7)}: no opum-cli-e2e qualification receipt binds these bytes.`,
    );
    for (const problem of gate.problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  if (gate.override) console.log(describeOverride(gate.override, gate.source));
  console.log(
    `opum-cli-e2e receipt ${gate.source} binds ${version} at ${commit.slice(0, 7)}, run ${releaseRunId}, and all ${Object.keys(gate.bundle.tarballs).length} tarballs.`,
  );
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
