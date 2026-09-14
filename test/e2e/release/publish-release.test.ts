import { expect, test } from "bun:test";

import {
  isPublished,
  isValidGranularTokenShape,
  resolveToken,
  tokenShape,
} from "../../../scripts/publish-release.mjs";

/**
 * QCLI-285. These attack the two things that made a sibling repo's own
 * release costly tonight: a malformed stored credential reading as a
 * permissions problem, and a partial-publish rerun erroring on work that
 * already landed.
 */

test("tokenShape reports length, prefix, and whitespace without ever echoing the value", () => {
  const shape = tokenShape("npm_abcdefghijklmnopqrstuvwxyz0123456789");
  expect(shape).toEqual({ length: 40, prefix: "npm_", hasWhitespace: false });
  expect(JSON.stringify(shape)).not.toContain("abcdefgh");
});

test("a correctly shaped granular token passes", () => {
  const shape = tokenShape("npm_abcdefghijklmnopqrstuvwxyz0123456789");
  expect(isValidGranularTokenShape(shape)).toBe(true);
});

test("a token with the wrong prefix, wrong length, or internal whitespace fails the shape check", () => {
  expect(isValidGranularTokenShape(tokenShape("shortvalue"))).toBe(false);
  expect(
    isValidGranularTokenShape(tokenShape("a".repeat(40))), // right length, wrong prefix
  ).toBe(false);
  expect(
    isValidGranularTokenShape(
      tokenShape("npm_abcde fghijklmnopqrstuvwxyz012345"), // right length/prefix, has a space
    ),
  ).toBe(false);
});

test("resolveToken prefers the Keychain over NPM_TOKEN when both are present", async () => {
  const result = await resolveToken({
    env: { NPM_TOKEN: "npm_envtoken00000000000000000000000000" },
    findKeychainPassword: async () => "npm_keychaintoken0000000000000000000000",
  });
  expect(result).toEqual({
    token: "npm_keychaintoken0000000000000000000000",
    source: "Keychain (npm-opum-ai-publish)",
  });
});

test("resolveToken falls back to NPM_TOKEN when the Keychain has nothing", async () => {
  const result = await resolveToken({
    env: { NPM_TOKEN: "npm_envtoken00000000000000000000000000" },
    findKeychainPassword: async () => null,
  });
  expect(result).toEqual({
    token: "npm_envtoken00000000000000000000000000",
    source: "NPM_TOKEN",
  });
});

test("resolveToken returns no token, not an error, when neither mechanism has one", async () => {
  const result = await resolveToken({
    env: {},
    findKeychainPassword: async () => null,
  });
  expect(result).toEqual({ token: null, source: null });
});

test("isPublished is true when npm view resolves the exact version, false on any failure", async () => {
  const calls: unknown[] = [];
  const publishedResult = await isPublished(
    "@opum-ai/quest-linux-x64",
    "0.6.2",
    {
      execFile: async (...args: unknown[]) => {
        calls.push(args);
        return { stdout: "0.6.2\n", stderr: "" };
      },
    },
  );
  expect(publishedResult).toBe(true);
  expect(calls).toEqual([
    ["npm", ["view", "@opum-ai/quest-linux-x64@0.6.2", "version"]],
  ]);

  const unpublishedResult = await isPublished(
    "@opum-ai/quest-linux-x64",
    "0.6.2",
    {
      execFile: async () => {
        throw new Error("npm ERR! 404 Not Found");
      },
    },
  );
  expect(unpublishedResult).toBe(false);
});
