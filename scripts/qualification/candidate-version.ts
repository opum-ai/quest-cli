/**
 * The candidate-version predicate the release gate applies to a built binary's
 * `--version` output (QCLI-296).
 *
 * It lives here, imported by both `scripts/qualification/prepublish.mjs` and
 * the derivation test, so the gate and the assertion that a signalled release
 * build satisfies it can never drift into two copies of the same regex.
 */

/** A bare `X.Y.Z` candidate version, with no pre-release or dev suffix. */
const CANDIDATE_RELEASE_VERSION = /^\d+\.\d+\.\d+$/;

/**
 * True when `version` is the bare `X.Y.Z` a release candidate must report. A
 * dev build's `<base>-dev.<N>.g<sha>` suffix fails this, which is exactly what
 * makes `QUEST_RELEASE_BUILD=1` load-bearing for the candidate build.
 */
export function isCandidateReleaseVersion(version: string): boolean {
  return CANDIDATE_RELEASE_VERSION.test(version);
}
