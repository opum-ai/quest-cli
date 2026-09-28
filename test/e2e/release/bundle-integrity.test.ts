import { expect, test } from "bun:test";

import {
  packageNames,
  verifyRegistryHoldsBundle,
} from "../../../scripts/qualification/bundle-integrity.mjs";

/**
 * QCLI-368 AC3: a release fails when any published tarball differs from its
 * CI-bundle file. The comparison itself (npm dist.integrity against the file's
 * sha512) is covered in e2e-receipt.test.ts; these cover what the release does
 * with seven answers.
 */

const held = { ok: true, expected: "sha512-x", actual: "sha512-x" };
const differs = { ok: false, expected: "sha512-x", actual: "sha512-y" };
const unread = { ok: false, expected: "sha512-x", actual: null };

test("all seven held passes, and reads each package once", async () => {
  const asked: string[] = [];
  const result = await verifyRegistryHoldsBundle({
    bundleDir: "/unused",
    version: "9.9.9",
    launcherVersion: "9.9.9-rc.2",
    check: async (name: string) => {
      asked.push(name);
      return held;
    },
    sleep: async () => {},
  });
  expect(result.ok).toBe(true);
  expect(asked).toEqual(packageNames());
});

test("QCLI-399: the launcher is read at its staged rc version and file, the platforms at X", async () => {
  const asked: string[] = [];
  await verifyRegistryHoldsBundle({
    bundleDir: "/b",
    version: "9.9.9",
    launcherVersion: "9.9.9-rc.2",
    check: async (name: string, version: string, tarball: string) => {
      asked.push(`${name}@${version} ${tarball}`);
      return held;
    },
    sleep: async () => {},
  });
  expect(asked[0]).toBe(
    "@opum-ai/quest@9.9.9-rc.2 /b/tarballs/opum-ai-quest-9.9.9-rc.2.tgz",
  );
  expect(asked.slice(1).every((line) => line.includes("@9.9.9 "))).toBe(true);
});

test("QCLI-399: a failed launcher read names the rc version it read", async () => {
  const result = await verifyRegistryHoldsBundle({
    bundleDir: "/unused",
    version: "9.9.9",
    launcherVersion: "9.9.9-rc.2",
    check: async (name: string) => (name === "@opum-ai/quest" ? differs : held),
    sleep: async () => {},
  });
  expect(result.problems).toEqual([
    "@opum-ai/quest@9.9.9-rc.2: npm serves sha512-y, the qualified bundle file is sha512-x",
  ]);
});

test("one different tarball fails at once, naming it, with no retry", async () => {
  let sleeps = 0;
  const result = await verifyRegistryHoldsBundle({
    bundleDir: "/unused",
    version: "9.9.9",
    launcherVersion: "9.9.9-rc.2",
    check: async (name: string) =>
      name === "@opum-ai/quest-win32-x64" ? differs : held,
    sleep: async () => {
      sleeps += 1;
    },
  });
  expect(result.ok).toBe(false);
  expect(sleeps).toBe(0);
  expect(result.problems).toEqual([
    "@opum-ai/quest-win32-x64@9.9.9: npm serves sha512-y, the qualified bundle file is sha512-x",
  ]);
});

test("an unreadable integrity is retried, then fails rather than passes", async () => {
  let sleeps = 0;
  const result = await verifyRegistryHoldsBundle({
    bundleDir: "/unused",
    version: "9.9.9",
    launcherVersion: "9.9.9-rc.2",
    attempts: 3,
    check: async (name: string) => (name === "@opum-ai/quest" ? unread : held),
    sleep: async () => {
      sleeps += 1;
    },
  });
  expect(sleeps).toBe(2);
  expect(result.ok).toBe(false);
  expect(result.problems[0]).toContain("no dist.integrity");
});

test("a package that becomes readable on retry passes", async () => {
  let calls = 0;
  const result = await verifyRegistryHoldsBundle({
    bundleDir: "/unused",
    version: "9.9.9",
    launcherVersion: "9.9.9-rc.2",
    check: async (name: string) => {
      if (name !== "@opum-ai/quest") return held;
      calls += 1;
      return calls < 2 ? unread : held;
    },
    sleep: async () => {},
  });
  expect(result.ok).toBe(true);
  expect(calls).toBe(2);
});
