import { expect, test } from "bun:test";

import { deriveBuildVersion } from "../scripts/derive-build-version.ts";

/**
 * QCLI-296. A dev checkout must report a version distinguishable from the last
 * published one, derived at build time from `git describe` -- adding zero new
 * hand-edited version sites. The derivation is pure, so the mapping from
 * `git describe` evidence to a version string is exercised here directly.
 */

test("commits beyond the release tag yield X.Y.Z-dev.N.gSHA", () => {
  expect(
    deriveBuildVersion({
      baseVersion: "0.12.0",
      describeLong: "v0.12.0-60-gd49cb95e",
      exactMatch: false,
    }),
  ).toBe("0.12.0-dev.60.gd49cb95e");
});

test("an exact-tag describe (N == 0) yields the bare version", () => {
  expect(
    deriveBuildVersion({
      baseVersion: "0.12.0",
      describeLong: "v0.12.0-0-gabc1234",
      exactMatch: false,
    }),
  ).toBe("0.12.0");
});

test("an exact-tag match yields the bare version regardless of describe", () => {
  expect(
    deriveBuildVersion({
      baseVersion: "0.12.0",
      describeLong: "v0.12.0-60-gd49cb95e",
      exactMatch: true,
    }),
  ).toBe("0.12.0");
});

test("a describe that failed (no reachable tag) yields the bare version", () => {
  expect(
    deriveBuildVersion({
      baseVersion: "0.12.0",
      describeLong: null,
      exactMatch: false,
    }),
  ).toBe("0.12.0");
});

test("a non-semver describe string falls back to the bare version", () => {
  expect(
    deriveBuildVersion({
      baseVersion: "0.12.0",
      describeLong: "no-semver-here",
      exactMatch: false,
    }),
  ).toBe("0.12.0");
});

test("the leading v of the describe tag is optional", () => {
  expect(
    deriveBuildVersion({
      baseVersion: "0.12.0",
      describeLong: "0.12.0-3-gabc1234",
      exactMatch: false,
    }),
  ).toBe("0.12.0-dev.3.gabc1234");
});
