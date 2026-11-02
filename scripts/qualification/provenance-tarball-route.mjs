// QCLI-555. The registry records no gitHead for a tarball publish, so
// release-provenance --post ties the served launcher to the released commit
// through the opum-cli-e2e receipt instead (DEC-251 a3): the receipt names the
// commit and the sha256 of the launcher tarball, the qualified bundle holds
// that tarball, and npm's served dist.integrity must be that tarball's sha512.
// The bundle file is the bridge between the receipt's sha256 and npm's sha512.
//
// The bundle's own `sourceCommit` is a self-asserted claim and is never the
// binding: requireQualification re-derives every digest from the files on disk
// and compares them with a receipt read from opum-cli-e2e's main, so a
// directory holding the served tarball plus a hand-written metadata file is
// refused.

import { registryHoldsTarball } from "./bundle-integrity.mjs";
import { describeOverride, requireQualification } from "./e2e-receipt.mjs";

/**
 * @param {object} options
 * @param {string} options.name the launcher package name
 * @param {string} options.bundleDir a downloaded quest-candidate-bundle
 * @param {string} options.version the release X (package.json)
 * @param {string} options.postVersion X itself, or the staged X-rc.N
 * @param {string} options.commit the released commit
 * @param {string} options.runId the prepublication-qualification run on the tag
 */
export async function verifyTarballRoute({
  name,
  bundleDir,
  version,
  postVersion,
  commit,
  runId,
  requireReceipt = requireQualification,
  registryHolds = registryHoldsTarball,
}) {
  let qualified;
  try {
    qualified = await requireReceipt({
      bundleDir,
      version,
      commit,
      releaseRunId: runId,
    });
  } catch (error) {
    return {
      ok: false,
      problems: [
        `the bundle at ${bundleDir} could not be read: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
  if (!qualified.ok)
    return {
      ok: false,
      problems: [
        `no opum-cli-e2e receipt binds this bundle to ${commit}:`,
        ...qualified.problems.map((problem) => `  - ${problem}`),
      ],
    };

  // The directory follows the version, never a search over both: the staged
  // rc is bound by the receipt's tarballs entry, the never-staged X launcher
  // by launcherSubstitution.finalTarball.
  const isFinal = postVersion === version;
  if (!isFinal && postVersion !== qualified.launcher.stagedVersion)
    return {
      ok: false,
      problems: [
        `the bundle stages the launcher at ${qualified.launcher.stagedVersion}, not ${postVersion}`,
      ],
    };
  const tarball = isFinal
    ? qualified.launcher.final.path
    : qualified.launcher.stagedTarball;

  const held = await registryHolds(name, postVersion, tarball);
  if (!held.ok)
    return {
      ok: false,
      problems: [
        `${name}@${postVersion} is not the receipt-bound tarball: the registry serves ${held.actual || "(unreadable)"}, the bundle holds ${held.expected}.`,
      ],
    };
  return {
    ok: true,
    problems: [],
    source: qualified.source,
    override: qualified.override
      ? describeOverride(qualified.override, qualified.source)
      : null,
  };
}
