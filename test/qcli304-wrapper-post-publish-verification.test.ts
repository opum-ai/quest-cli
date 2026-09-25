import { expect, test } from "bun:test";

import { verifyPublishedRelease } from "../scripts/publish-release.mjs";

/**
 * QCLI-304. The 0.7.1 publish printed "@opum-ai/quest 0.7.1 published and
 * verified (1 check)" and exited 0 while `npm install -g @opum-ai/quest@0.7.1`
 * failed with notarget: a plain read of the registry did not list the wrapper
 * for about another minute. These drive that on purpose, through the REAL
 * consumer gate and its REAL anonymous read -- only the network and the clock
 * are fakes -- so what passes here is the read an installer makes.
 */

const WRAPPER = "@opum-ai/quest";
const VERSION = "0.7.1";

function fakeClock() {
  let clock = 0;
  return {
    now: () => clock,
    sleep: async (ms: number) => {
      clock += ms;
    },
  };
}

type Init = { headers?: Record<string, string> };

/** A registry whose wrapper packument lists VERSION only after `lagReads`. */
function laggingRegistry(lagReads: number, events: string[]) {
  const inits: Init[] = [];
  let reads = 0;
  const fetchImpl = async (url: string, init: Init) => {
    inits.push(init);
    expect(url).toBe("https://registry.npmjs.org/@opum-ai%2fquest");
    reads += 1;
    if (reads <= lagReads) {
      events.push("read:absent");
      // The 0.7.1 shape: the packument is there, the new version is not.
      return {
        ok: true,
        status: 200,
        json: async () => ({ versions: { "0.7.0": {} }, time: {} }),
      };
    }
    events.push("read:public");
    return {
      ok: true,
      status: 200,
      json: async () => ({
        versions: { "0.7.0": {}, [VERSION]: {} },
        time: { [VERSION]: "2026-09-15T16:03:39.000Z" },
      }),
    };
  };
  return { fetchImpl, inits, reads: () => reads };
}

function baseOptions(events: string[]) {
  return {
    version: VERSION,
    receipt: {
      platforms: [
        { packageName: "@opum-ai/quest-darwin-arm64" },
        { packageName: "@opum-ai/quest-linux-x64" },
      ],
    },
    receiptPath: "receipt.json",
    wrapperName: WRAPPER,
    // Both earlier checks pass: the platforms match the receipt and npm's own
    // client reads every tarball's integrity. That is exactly the state in
    // which 0.7.1 said "verified".
    waitForReceipt: async () => ({ ok: true, attempts: 1, problems: [] }),
    verifyBundle: async () => ({ ok: true, problems: [] }),
    describeUnresolved: async (names: readonly string[]) => ({
      lines: names.map((name) => `  ${name}@${VERSION}: absent-or-staged`),
      states: {},
    }),
    log: (message: string) => events.push(`log:${message}`),
    logError: (message: string) => events.push(`error:${message}`),
  };
}

const isSuccessLine = (event: string) =>
  event.startsWith(`log:Published ${WRAPPER}@${VERSION}.`);

test("a wrapper whose write succeeded but whose public packument lacks the version is not verified until a plain read lists it", async () => {
  const events: string[] = [];
  const registry = laggingRegistry(3, events);
  const result = await verifyPublishedRelease({
    ...baseOptions(events),
    consumerOptions: { fetchImpl: registry.fetchImpl, ...fakeClock() },
  });

  expect(result).toEqual({ ok: true, stage: "verified" });
  const firstPublic = events.indexOf("read:public");
  const success = events.findIndex(isSuccessLine);
  expect(events.slice(0, firstPublic)).toEqual(
    expect.arrayContaining(["read:absent"]),
  );
  expect(firstPublic).toBeGreaterThan(-1);
  expect(success).toBeGreaterThan(firstPublic);
  expect(events.filter(isSuccessLine)).toHaveLength(1);
  // Three absent reads, the first public one, and the re-read after the
  // settle margin: the margin only counts if the version is still there.
  expect(registry.reads()).toBe(5);
  expect(events[success]).toContain(
    "resolves for an anonymous consumer (published 2026-09-15T16:03:39.000Z)",
  );
});

test("the wrapper read carries no credential -- it is a consumer's read, not the publisher's", async () => {
  const events: string[] = [];
  const registry = laggingRegistry(0, events);
  await verifyPublishedRelease({
    ...baseOptions(events),
    consumerOptions: { fetchImpl: registry.fetchImpl, ...fakeClock() },
  });

  expect(registry.inits.length).toBeGreaterThan(0);
  for (const init of registry.inits)
    expect(
      Object.keys(init.headers ?? {}).map((key) => key.toLowerCase()),
    ).not.toContain("authorization");
});

test("a wrapper that never resolves inside the window fails as not-yet-visible and prints no success line", async () => {
  const events: string[] = [];
  const registry = laggingRegistry(Number.POSITIVE_INFINITY, events);
  const result = await verifyPublishedRelease({
    ...baseOptions(events),
    consumerOptions: {
      fetchImpl: registry.fetchImpl,
      maxWaitMs: 60_000,
      ...fakeClock(),
    },
  });

  expect(result).toEqual({ ok: false, stage: "wrapper" });
  expect(events.some(isSuccessLine)).toBe(false);
  expect(events.some((event) => event.includes("published and verified"))).toBe(
    false,
  );
  const report = events
    .filter((event) => event.startsWith("error:"))
    .join("\n");
  expect(report).toContain(
    `${WRAPPER}@${VERSION} does not resolve for a consumer`,
  );
  expect(report).toContain("NOT a verified release yet");
  expect(report).toContain("Do NOT run npm unpublish");
  expect(report).toContain(`${WRAPPER}@${VERSION}: absent-or-staged`);
});

test("a read injected through consumerOptions cannot stand in for the real one", async () => {
  const events: string[] = [];
  const registry = laggingRegistry(Number.POSITIVE_INFINITY, events);
  const result = await verifyPublishedRelease({
    ...baseOptions(events),
    consumerOptions: {
      fetchImpl: registry.fetchImpl,
      maxWaitMs: 60_000,
      read: async () => ({
        state: "public",
        publishedAt: null,
        problem: null,
      }),
      ...fakeClock(),
    },
  });

  expect(result).toEqual({ ok: false, stage: "wrapper" });
  expect(registry.reads()).toBeGreaterThan(0);
  expect(events.some(isSuccessLine)).toBe(false);
});

test("an earlier check failing stops before the wrapper is read, and prints no success line", async () => {
  for (const [override, stage] of [
    [
      {
        waitForReceipt: async () => ({
          ok: false,
          attempts: 1,
          problems: ["digest mismatch"],
        }),
      },
      "receipt",
    ],
    [
      {
        verifyBundle: async () => ({
          ok: false,
          problems: ["integrity differs"],
        }),
      },
      "bundle",
    ],
  ] as const) {
    const events: string[] = [];
    const registry = laggingRegistry(0, events);
    const result = await verifyPublishedRelease({
      ...baseOptions(events),
      ...override,
      consumerOptions: { fetchImpl: registry.fetchImpl, ...fakeClock() },
    });
    expect(result).toEqual({ ok: false, stage });
    expect(registry.reads()).toBe(0);
    expect(events.some(isSuccessLine)).toBe(false);
  }
});
