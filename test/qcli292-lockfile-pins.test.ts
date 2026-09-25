import { expect, test } from "bun:test";

import {
  checkLockfilePins,
  lockfilePinProblems,
  parseBunLock,
} from "../scripts/check-lockfile-pins.mjs";

/**
 * QCLI-292. bun.lock kept its platform pins at the previous version through a
 * bump. CI's `bun install --frozen-lockfile` passes that at bump time, because
 * the new version is unpublished and an unresolvable optional dependency is
 * skipped. It fails only after publish, on an unrelated PR. The first test is
 * the gate: it runs on the bump pull request itself.
 */

const PLATFORMS = [
  "darwin-arm64",
  "darwin-x64",
  "linux-arm64",
  "linux-x64",
  "win32-arm64",
  "win32-x64",
];

function lockWith(pins: Record<string, string>, packages = {}) {
  return {
    lockfileVersion: 1,
    workspaces: { "": { name: "@opum-ai/quest", optionalDependencies: pins } },
    packages,
  };
}

const pinsAt = (version: string) =>
  Object.fromEntries(PLATFORMS.map((p) => [`@opum-ai/quest-${p}`, version]));

test("this repository's bun.lock pins every platform package at the package.json version", async () => {
  const { problems, pinsRead, expected } = await checkLockfilePins();
  // Positive control: a clean answer only counts if all six pins were read.
  expect(expected).toBe(6);
  expect(pinsRead).toBe(expected);
  expect(problems).toEqual([]);
});

test("a bump that left bun.lock's pins behind is reported, naming each package and both versions", () => {
  const { problems, pinsRead } = lockfilePinProblems(
    { version: "0.10.1" },
    lockWith(pinsAt("0.10.0")),
  );
  expect(pinsRead).toBe(6);
  expect(problems).toHaveLength(6);
  expect(problems).toContain(
    "@opum-ai/quest-linux-arm64: bun.lock pins 0.10.0, package.json is 0.10.1",
  );
});

test("a lockfile that carries no pins fails rather than passing on nothing read", () => {
  const { problems, pinsRead } = lockfilePinProblems(
    { version: "0.10.1" },
    lockWith({}),
  );
  expect(pinsRead).toBe(0);
  expect(problems).toHaveLength(6);
  expect(problems[0]).toContain(
    "no pin in bun.lock's root optionalDependencies",
  );
});

test("a resolved packages entry at the wrong version is caught even when the workspace pin is right", () => {
  const { problems } = lockfilePinProblems(
    { version: "0.10.1" },
    lockWith(pinsAt("0.10.1"), {
      "@opum-ai/quest-darwin-x64": ["@opum-ai/quest-darwin-x64@0.10.0", "", {}],
    }),
  );
  expect(problems).toEqual([
    "@opum-ai/quest-darwin-x64: bun.lock resolves @opum-ai/quest-darwin-x64@0.10.0, package.json is 0.10.1",
  ]);
});

test("pins and resolved entries at the package.json version are clean", () => {
  const { problems, pinsRead } = lockfilePinProblems(
    { version: "0.10.1" },
    lockWith(pinsAt("0.10.1"), {
      "@opum-ai/quest-darwin-x64": ["@opum-ai/quest-darwin-x64@0.10.1", "", {}],
    }),
  );
  expect(pinsRead).toBe(6);
  expect(problems).toEqual([]);
});

test("parseBunLock reads bun's trailing-comma format", () => {
  expect(
    parseBunLock('{\n  "a": {\n    "b": "1",\n  },\n  "c": ["x", "y",],\n}\n'),
  ).toEqual({ a: { b: "1" }, c: ["x", "y"] });
});
