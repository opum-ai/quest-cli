/**
 * Derives the Quest CLI's build version from `git describe` evidence (QCLI-296).
 *
 * `scripts/build-platform-packages.mjs` gathers the evidence with real `git`
 * calls and passes it here, so the mapping from a `git describe --tags --long`
 * string to the version a build reports is a pure function and unit-testable.
 */

/** `git describe --tags --long` output: `vX.Y.Z-N-gSHA`, leading `v` optional. */
const DESCRIBE_LONG = /^v?(\d+\.\d+\.\d+)-(\d+)-g([0-9a-f]+)$/i;

export interface BuildVersionEvidence {
  /** Root `package.json` `.version` -- the bare release version. */
  readonly baseVersion: string;
  /**
   * Trimmed stdout of `git describe --tags --long`, or `null` when that command
   * failed (no reachable tag).
   */
  readonly describeLong: string | null;
  /** Whether `git describe --tags --exact-match HEAD` succeeded. */
  readonly exactMatch: boolean;
}

/**
 * Returns the version a build should report.
 *
 * Off an exact tag, the `<distance>-g<sha>` suffix `git describe` reports is
 * rewritten to `-dev.<distance>.g<sha>`; on an exact tag, or when the describe
 * evidence is missing or unparseable, the bare `baseVersion` is returned
 * unchanged so a release build reports exactly the published version.
 */
export function deriveBuildVersion({
  baseVersion,
  describeLong,
  exactMatch,
}: BuildVersionEvidence): string {
  if (exactMatch || describeLong === null) return baseVersion;
  const match = DESCRIBE_LONG.exec(describeLong.trim());
  if (!match) return baseVersion;
  const [, base, distance, sha] = match;
  const distanceNumber = Number(distance);
  if (distanceNumber === 0) return baseVersion;
  return `${base}-dev.${distanceNumber}.g${sha}`;
}
