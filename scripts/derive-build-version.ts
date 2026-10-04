/**
 * Derives the Quest CLI's build version from `git describe` evidence (QCLI-296).
 *
 * `scripts/build-platform-packages.mjs` gathers the evidence with a real `git`
 * call and passes it here, so the mapping from a `git describe --tags --long`
 * string to the version a build reports is a pure function and unit-testable.
 */

/**
 * The tail of `git describe --tags --long` output: `-<N>-g<sha>`. The tag part,
 * which may itself contain hyphens (e.g. `v0.13.0-rc.1`), is deliberately not
 * matched -- only the distance and the abbreviated sha are read, from the
 * RIGHT, so an irregular tag cannot change the reported version.
 */
const DESCRIBE_DISTANCE = /-(\d+)-g([0-9a-f]+)$/i;

export interface BuildVersionEvidence {
  /** Root `package.json` `.version` -- the bare release version, and the base. */
  readonly baseVersion: string;
  /**
   * Trimmed stdout of `git describe --tags --long`, or `null` when that command
   * failed (no reachable tag).
   */
  readonly describeLong: string | null;
  /**
   * Whether this is a release build: `process.env.QUEST_RELEASE_BUILD === "1"`.
   * The environment signal is the ONLY release discriminator -- a distance of
   * zero on a describe string is still a dev build.
   */
  readonly releaseBuild: boolean;
}

/**
 * Returns the version a build should report.
 *
 * A release build, or one whose describe evidence is missing or unparseable,
 * reports the bare `baseVersion` unchanged, so a release build reports exactly
 * the published version. Every other build rewrites the `<N>-g<sha>` tail that
 * `git describe` reports into `<baseVersion>-dev.<N>.g<sha>`: the base is
 * always `baseVersion` (never the describe tag's own text), so a bump window
 * does not under-report and an irregular tag cannot drop the suffix.
 */
export function deriveBuildVersion({
  baseVersion,
  describeLong,
  releaseBuild,
}: BuildVersionEvidence): string {
  if (releaseBuild || describeLong === null) return baseVersion;
  const match = DESCRIBE_DISTANCE.exec(describeLong.trim());
  if (!match) return baseVersion;
  const [, distance, sha] = match;
  return `${baseVersion}-dev.${distance}.g${sha}`;
}
