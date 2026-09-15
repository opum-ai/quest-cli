import { expect, test } from "bun:test";

import {
  describeUnresolvedPackages,
  diagnoseStaged,
  isPublished,
  isValidGranularTokenShape,
  publishPlatformsThenWrapper,
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

/**
 * QCLI-299. The 0.7.0 failure, made to happen on purpose: a platform package
 * whose write succeeded but which a consumer cannot resolve yet must stop the
 * wrapper, because a wrapper on the registry advertising an
 * optionalDependency that does not resolve installs SUCCESSFULLY and leaves
 * no binary.
 */

const PLATFORMS = [
  { name: "@opum-ai/quest-darwin-arm64", cwd: "/npm/quest-darwin-arm64" },
  { name: "@opum-ai/quest-darwin-x64", cwd: "/npm/quest-darwin-x64" },
];
const WRAPPER = { name: "@opum-ai/quest", cwd: "/" };

test("a published-but-not-yet-visible platform package blocks the wrapper publish", async () => {
  const published: string[] = [];

  const outcome = await publishPlatformsThenWrapper({
    platforms: PLATFORMS,
    wrapper: WRAPPER,
    publish: async (target: { name: string }) => {
      published.push(target.name);
    },
    alreadyPublished: async () => false,
    // Every write above returned success; the consumer-side read has not
    // caught up for one of them. That is exactly the 0.7.0 shape.
    gate: async () => ({
      ok: false,
      timedOut: true,
      attempts: 9,
      missing: ["@opum-ai/quest-darwin-x64"],
    }),
  });

  expect(outcome.ok).toBe(false);
  expect(outcome.wrapperPublished).toBe(false);
  expect(published).toEqual([
    "@opum-ai/quest-darwin-arm64",
    "@opum-ai/quest-darwin-x64",
  ]);
  expect(published).not.toContain("@opum-ai/quest");
});

test("the wrapper is published only after the gate confirms every platform package resolves", async () => {
  const order: string[] = [];

  const outcome = await publishPlatformsThenWrapper({
    platforms: PLATFORMS,
    wrapper: WRAPPER,
    publish: async (target: { name: string }) => {
      order.push(target.name);
    },
    alreadyPublished: async () => false,
    gate: async (names: readonly string[]) => {
      order.push(`gate(${names.length})`);
      return { ok: true, timedOut: false, attempts: 2, missing: [] };
    },
  });

  expect(outcome.ok).toBe(true);
  expect(outcome.wrapperPublished).toBe(true);
  expect(order).toEqual([
    "@opum-ai/quest-darwin-arm64",
    "@opum-ai/quest-darwin-x64",
    "gate(2)",
    "@opum-ai/quest",
  ]);
});

test("a rerun skips what already landed and still gates before the wrapper", async () => {
  const published: string[] = [];

  await publishPlatformsThenWrapper({
    platforms: PLATFORMS,
    wrapper: WRAPPER,
    publish: async (target: { name: string }) => {
      published.push(target.name);
    },
    alreadyPublished: async (name: string) =>
      name === "@opum-ai/quest-darwin-arm64",
    gate: async () => ({ ok: true, timedOut: false, attempts: 1, missing: [] }),
  });

  expect(published).toEqual(["@opum-ai/quest-darwin-x64", "@opum-ai/quest"]);
});

test("a staged package produces the staged outcome with its operator action, not a lag message", async () => {
  const { lines, states } = await describeUnresolvedPackages(
    ["@opum-ai/quest-darwin-x64"],
    "0.7.0",
    {
      classify: async () => ({
        state: "staged",
        publishedAt: null,
        stageId: "stage_0715",
        evidence: "npm stage list names 0.7.0 as staged",
      }),
    },
  );

  const text = lines.join("\n");
  expect(states).toEqual({ "@opum-ai/quest-darwin-x64": "staged" });
  expect(text).toContain("staged");
  expect(text).toContain("npm stage approve stage_0715");
  expect(text).not.toContain("read-after-write lag");
  expect(text).not.toContain("not a failed release");
});

test("the staged probe reads a 409 as staged and a success as never-landed", async () => {
  const staged = await diagnoseStaged(
    { name: "@opum-ai/quest-darwin-x64", cwd: "/npm/quest-darwin-x64" },
    {
      publish: async () => {
        throw Object.assign(new Error("publish failed"), {
          stderr:
            'npm error 409 Conflict - Cannot publish over previously staged version "0.7.0".',
        });
      },
    },
  );
  expect(staged.state).toBe("staged");

  const neverLanded = await diagnoseStaged(
    { name: "@opum-ai/quest-darwin-x64", cwd: "/npm/quest-darwin-x64" },
    { publish: async () => "+ @opum-ai/quest-darwin-x64@0.7.0" },
  );
  expect(neverLanded.state).toBe("was-absent-now-published");
});
