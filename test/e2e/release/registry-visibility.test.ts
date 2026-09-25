import { expect, test } from "bun:test";

import type { ConsumerVersionState } from "../../../scripts/qualification/registry-visibility.d.mts";
import {
  classifyPublishError,
  classifyVersion,
  describeVersionState,
  packumentUrl,
  PUBLISHER_EARLY_LAG_MS,
  readConsumerVersion,
  waitForConsumerVisibility,
} from "../../../scripts/qualification/registry-visibility.mjs";

/**
 * QCLI-299. The 0.7.0 publish reported success while one of seven packages
 * sat non-public for twelve minutes past the wrapper, so these attack the
 * three claims the old path could not support: that a write landing means a
 * consumer can resolve it, that the publisher can see what it published, and
 * that a timeout is lag rather than a failed release.
 */

type FakeResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

const packument = (versions: string[], time: Record<string, string> = {}) =>
  ({
    ok: true,
    status: 200,
    json: async () => ({
      versions: Object.fromEntries(versions.map((v) => [v, { version: v }])),
      time,
    }),
  }) satisfies FakeResponse;

test("a consumer read escapes the scope separator and sends no credential", async () => {
  expect(packumentUrl("@opum-ai/quest-darwin-x64")).toBe(
    "https://registry.npmjs.org/@opum-ai%2fquest-darwin-x64",
  );

  const seen: { url: string; init: RequestInit }[] = [];
  const result = await readConsumerVersion(
    "@opum-ai/quest-darwin-x64",
    "0.7.0",
    {
      fetchImpl: async (url: string, init: RequestInit) => {
        seen.push({ url, init });
        return packument(["0.7.0"], { "0.7.0": "2026-09-15T13:16:58.797Z" });
      },
    },
  );

  expect(result).toEqual({
    state: "public",
    publishedAt: "2026-09-15T13:16:58.797Z",
    problem: null,
  });
  expect(seen).toHaveLength(1);
  const headers = seen[0]?.init.headers as Record<string, string>;
  expect(Object.keys(headers).map((key) => key.toLowerCase())).not.toContain(
    "authorization",
  );
});

test("a version missing from the packument is absent; a read that failed is unreadable, not absent", async () => {
  const missing = await readConsumerVersion("@opum-ai/quest", "0.7.0", {
    fetchImpl: async () => packument(["0.6.2"]),
  });
  expect(missing.state).toBe("absent");

  const notFound = await readConsumerVersion("@opum-ai/quest", "0.7.0", {
    fetchImpl: async () => ({ ok: false, status: 404, json: async () => ({}) }),
  });
  expect(notFound.state).toBe("absent");

  const serverError = await readConsumerVersion("@opum-ai/quest", "0.7.0", {
    fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) }),
  });
  expect(serverError.state).toBe("unreadable");

  const offline = await readConsumerVersion("@opum-ai/quest", "0.7.0", {
    fetchImpl: async () => {
      throw new Error("ENOTFOUND registry.npmjs.org");
    },
  });
  expect(offline.state).toBe("unreadable");
  expect(offline.problem).toContain("ENOTFOUND");
});

/** A virtual clock, so the settle margin is asserted rather than waited out. */
function fakeClock() {
  let clock = 0;
  const slept: number[] = [];
  return {
    now: () => clock,
    slept,
    sleep: async (ms: number) => {
      slept.push(ms);
      clock += ms;
    },
  };
}

test("the gate holds the measured publisher-early-lag margin after the last package appears, then re-reads", async () => {
  const { now, sleep, slept } = fakeClock();
  const reads: string[] = [];

  const result = await waitForConsumerVisibility(
    ["@opum-ai/quest-darwin-arm64", "@opum-ai/quest-linux-x64"],
    "0.7.0",
    {
      now,
      sleep,
      read: async (name: string) => {
        reads.push(name);
        return { state: "public", publishedAt: null, problem: null };
      },
    },
  );

  expect(result.ok).toBe(true);
  expect(slept).toEqual([PUBLISHER_EARLY_LAG_MS]);
  // Two packages read twice: once to become visible, once after the margin.
  expect(reads).toHaveLength(4);
  expect(result.attempts).toBe(2);
});

test("a package that resolves and then stops resolving goes back to not-visible instead of counting", async () => {
  const { now, sleep } = fakeClock();
  const states: ConsumerVersionState[] = [
    "public",
    "absent",
    "public",
    "public",
  ];
  let index = 0;

  const result = await waitForConsumerVisibility(["@opum-ai/quest"], "0.7.0", {
    now,
    sleep,
    read: async () => ({
      state: states[index++] ?? "public",
      publishedAt: null,
      problem: null,
    }),
  });

  expect(result.ok).toBe(true);
  // Four reads: visible, regressed, visible again, and the post-margin recheck.
  expect(index).toBe(4);
});

test("the gate times out reporting exactly which packages a consumer cannot resolve", async () => {
  const { now, sleep } = fakeClock();

  const result = await waitForConsumerVisibility(
    ["@opum-ai/quest-darwin-x64", "@opum-ai/quest-linux-x64"],
    "0.7.0",
    {
      now,
      sleep,
      maxWaitMs: 60_000,
      read: async (name: string) => ({
        state: name.endsWith("darwin-x64") ? "absent" : "public",
        publishedAt: null,
        problem: null,
      }),
    },
  );

  expect(result.ok).toBe(false);
  expect(result.timedOut).toBe(true);
  expect(result.missing).toEqual(["@opum-ai/quest-darwin-x64"]);
});

test("classifyVersion names staged when the stage list can see it", async () => {
  const classification = await classifyVersion("@opum-ai/quest", "0.7.0", {
    read: async () => ({ state: "absent", publishedAt: null, problem: null }),
    stageList: async () => ({
      supported: true,
      entries: [{ version: "0.7.0", id: "stage_123" }],
      problem: null,
    }),
  });

  expect(classification.state).toBe("staged");
  expect(classification.stageId).toBe("stage_123");
});

test("an empty stage list is reported as undetermined, not as absent -- the publisher is blind to its own stage", async () => {
  const classification = await classifyVersion("@opum-ai/quest", "0.7.0", {
    read: async () => ({ state: "absent", publishedAt: null, problem: null }),
    stageList: async () => ({ supported: true, entries: [], problem: null }),
  });

  expect(classification.state).toBe("absent-or-staged");
  expect(classification.evidence).toContain("does not rule staging out");
});

test("a staged package reports the operator action and never calls itself lag", async () => {
  const staged = describeVersionState("@opum-ai/quest-darwin-x64", "0.7.0", {
    state: "staged",
    publishedAt: null,
    stageId: "stage_abc",
    evidence: "npm stage list names 0.7.0 as staged",
  }).join("\n");

  expect(staged).toContain("npm stage approve stage_abc");
  expect(staged).toContain("2FA");
  expect(staged).toContain("release token cannot do it");
  expect(staged).not.toContain("lag");
  expect(staged).not.toContain("not a failed release");

  const undetermined = describeVersionState("@opum-ai/quest", "0.7.0", {
    state: "absent-or-staged",
    publishedAt: null,
    stageId: null,
    evidence: "public packument does not list 0.7.0",
  }).join("\n");
  expect(undetermined).toContain("--diagnose-staged");
});

/**
 * QCLI-350. On 0.9.0 quest-linux-arm64 showed the 0.7.0 staged signature --
 * absent from versions and time, time.modified unchanged -- and had in fact
 * landed; it was only slow. A two-way "staged or never-landed" pointed the
 * operator confidently at the wrong one of three.
 */
test("an undetermined package names SLOW beside staged and never-landed, and says to re-read before probing", () => {
  const undetermined = describeVersionState(
    "@opum-ai/quest-linux-arm64",
    "0.9.0",
    {
      state: "absent-or-staged",
      publishedAt: null,
      stageId: null,
      evidence: "public packument does not list 0.9.0",
    },
  ).join("\n");

  expect(undetermined).toContain("THREE states");
  expect(undetermined).toContain("SLOW");
  expect(undetermined).toContain("STAGED");
  expect(undetermined).toContain("NEVER LANDED");
  expect(undetermined).toContain("2026-09-18");
  expect(undetermined.indexOf("Re-read first")).toBeGreaterThan(-1);
  expect(undetermined.indexOf("Re-read first")).toBeLessThan(
    undetermined.indexOf("--diagnose-staged"),
  );
  expect(undetermined).not.toContain(
    "Staged and never-landed are not distinguishable",
  );
});

test("classifyPublishError separates the 409 that means staged from the conflict that means already public", () => {
  expect(
    classifyPublishError({
      stderr:
        'npm error 409 Conflict - Cannot publish over previously staged version "0.7.0".',
    }),
  ).toBe("staged");
  expect(
    classifyPublishError({
      stderr:
        "npm error code EPUBLISHCONFLICT\nnpm error You cannot publish over the previously published versions",
    }),
  ).toBe("public");
  expect(classifyPublishError({ stderr: "npm error code E404" })).toBe(
    "unauthorized-or-absent",
  );
  expect(classifyPublishError({ message: "socket hang up" })).toBe("unknown");
});
