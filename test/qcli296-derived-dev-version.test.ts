import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

import { deriveBuildVersion } from "../scripts/derive-build-version.ts";
import { isCandidateReleaseVersion } from "../scripts/qualification/candidate-version.ts";

/**
 * QCLI-296. A dev checkout must report a version distinguishable from the last
 * published one, derived at build time from `git describe` -- adding zero new
 * hand-edited version sites. The derivation is pure, so the mapping from
 * `git describe` evidence to a version string is exercised here directly. The
 * one release discriminator is `QUEST_RELEASE_BUILD === "1"`; a distance of
 * zero on a describe string is still a dev build.
 */

/** The real root version, so the release-gate assertion is tied to what ships. */
const pkgVersion = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
).version as string;

test("a release build embeds exactly the bare base version", () => {
  expect(
    deriveBuildVersion({
      baseVersion: "0.13.0",
      describeLong: "v0.12.0-60-gd49cb95e",
      releaseBuild: true,
    }),
  ).toBe("0.13.0");
});

test("a release build embeds an rc base version as written", () => {
  expect(
    deriveBuildVersion({
      baseVersion: "0.13.0-rc.1",
      describeLong: "v0.12.0-60-gd49cb95e",
      releaseBuild: true,
    }),
  ).toBe("0.13.0-rc.1");
});

test("a non-release build bases the suffix on package.json, not the tag", () => {
  expect(
    deriveBuildVersion({
      baseVersion: "0.13.0",
      describeLong: "v0.12.0-60-gd49cb95e",
      releaseBuild: false,
    }),
  ).toBe("0.13.0-dev.60.gd49cb95e");
});

test("an irregular rc tag is ignored; N and sha are read from the right", () => {
  expect(
    deriveBuildVersion({
      baseVersion: "0.12.0",
      describeLong: "v0.13.0-rc.1-5-gabc1234",
      releaseBuild: false,
    }),
  ).toBe("0.12.0-dev.5.gabc1234");
});

test("a failed describe (no reachable tag) falls back to the bare base", () => {
  expect(
    deriveBuildVersion({
      baseVersion: "0.12.0",
      describeLong: null,
      releaseBuild: false,
    }),
  ).toBe("0.12.0");
});

test("an unparseable describe falls back to the bare base", () => {
  expect(
    deriveBuildVersion({
      baseVersion: "0.12.0",
      describeLong: "no-semver-here",
      releaseBuild: false,
    }),
  ).toBe("0.12.0");
});

test("N === 0 is still a dev build; the env signal is the only discriminator", () => {
  expect(
    deriveBuildVersion({
      baseVersion: "0.12.0",
      describeLong: "v0.12.0-0-gabc1234",
      releaseBuild: false,
    }),
  ).toBe("0.12.0-dev.0.gabc1234");
});

test("the signalled release build is accepted by the release gate, a dev build is not", () => {
  const releaseVersion = deriveBuildVersion({
    baseVersion: pkgVersion,
    describeLong: "v0.12.0-60-gabc1234",
    releaseBuild: true,
  });
  // The SAME predicate prepublish.mjs applies to the candidate's --version.
  expect(isCandidateReleaseVersion(releaseVersion)).toBe(true);

  // Negative control: without the release signal the gate would refuse it,
  // which is why QUEST_RELEASE_BUILD=1 is load-bearing rather than cosmetic.
  const devVersion = deriveBuildVersion({
    baseVersion: pkgVersion,
    describeLong: "v0.12.0-60-gabc1234",
    releaseBuild: false,
  });
  expect(isCandidateReleaseVersion(devVersion)).toBe(false);
});
