import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  REQUIRED_PLATFORMS,
  parseArgs,
  platformPackageNames,
  requirePlatformVisibility,
} from "../scripts/qualification/require-platform-visibility.mjs";

/**
 * QCLI-300: CI must not publish the wrapper until a consumer-side read
 * confirms every platform package resolves.
 *
 * QCLI-299 fixed this in scripts/publish-release.mjs and left the CI path with
 * the identical defect -- a shell loop, then the wrapper on the next line. The
 * propagation loop that followed ran AFTER the wrapper was already published,
 * which makes it a confirmation rather than a gate.
 *
 * The acceptance criterion asks for the refusal to be DEMONSTRATED rather than
 * reasoned about from the YAML, so the failure path here runs against an
 * injected read and never touches the network.
 */

const workflowPath = join(
  import.meta.dir,
  "..",
  ".github",
  "workflows",
  "release.yml",
);

test("the gate refuses, reports per-package state, and does not report success", async () => {
  const logged: string[] = [];
  const errored: string[] = [];

  const result = await requirePlatformVisibility({
    version: "9.9.9",
    // One package never becomes visible. The gate must fail on exactly that.
    wait: async (names: readonly string[]) => ({
      ok: false,
      timedOut: true,
      attempts: 3,
      missing: ["@opum-ai/quest-win32-arm64"],
      settleMs: 0,
      lastSeen: Object.fromEntries(
        names.map((name) => [
          name,
          { state: "absent" as const, publishedAt: null, problem: null },
        ]),
      ),
    }),
    // "absent-or-staged", not "absent": from a consumer read the two are
    // genuinely indistinguishable, which is the distinction the report exists
    // to preserve rather than collapse.
    classify: async () => ({
      state: "absent-or-staged" as const,
      publishedAt: null,
      stageId: null,
      evidence: null,
    }),
    log: (line: string) => logged.push(line),
    error: (line: string) => errored.push(line),
  });

  expect(result.ok).toBe(false);

  const report = errored.join("\n");
  expect(report).toContain("THE WRAPPER WAS NOT PUBLISHED");
  // The actionable half: which package, and what the registry says about it.
  expect(report).toContain("@opum-ai/quest-win32-arm64");
  expect(report).toContain("Do NOT run npm unpublish");
  // A failed gate must never read as a completed release.
  expect(logged.join("\n")).not.toContain("Publishing the wrapper is now safe");
});

test("the gate passes only when every platform package resolves", async () => {
  const logged: string[] = [];
  const result = await requirePlatformVisibility({
    version: "9.9.9",
    wait: async () => ({
      ok: true,
      timedOut: false,
      attempts: 1,
      missing: [],
      settleMs: 0,
      lastSeen: {},
    }),
    log: (line: string) => logged.push(line),
    error: () => {},
  });

  expect(result.ok).toBe(true);
  expect(logged.join("\n")).toContain("Publishing the wrapper is now safe");
});

test("the gate covers all six platforms, matching the publish loop", () => {
  expect(REQUIRED_PLATFORMS).toHaveLength(6);
  expect(platformPackageNames()).toContain("@opum-ai/quest-win32-arm64");
});

test("release.yml gates the wrapper publish on the visibility check, in that order", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  const loopAt = workflow.indexOf("for target in darwin-arm64");
  const gateAt = workflow.indexOf("require-platform-visibility.mjs");
  const wrapperAt = workflow.indexOf("- name: Publish the wrapper");

  expect(loopAt).toBeGreaterThan(-1);
  expect(gateAt).toBeGreaterThan(-1);
  expect(wrapperAt).toBeGreaterThan(-1);

  // Order is the whole defect. A gate after the wrapper publish is the
  // confirmation-not-gate shape QCLI-299 removed from the local script.
  expect(gateAt).toBeGreaterThan(loopAt);
  expect(wrapperAt).toBeGreaterThan(gateAt);

  // The wrapper must no longer be published inside the platform-loop step.
  const platformStep = workflow.slice(loopAt, gateAt);
  expect(platformStep).not.toContain(
    'npm publish --access public $DRY\n          echo "::endgroup::"\n\n      # QCLI-300',
  );
});

test("the propagation step no longer diagnoses a timeout as lag", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  // It still exists -- AC 3 keeps it.
  expect(workflow).toContain("Verify the registry serves what was published");
  // But it must not assert the cause it can no longer justify.
  expect(workflow).not.toContain(
    "npm-side CDN/attestation-processing lag, the same class observed",
  );
  expect(workflow).toContain("DO NOT ASSUME THIS IS PROPAGATION LAG");
});

/**
 * The bounded-wait flags exist so the refusal can be run end to end. That run
 * is NOT a test here on purpose: classifyVersion shells out to `npm stage
 * list` to separate staged from never-landed, so an end-to-end invocation
 * needs the network and a credential, and would be flaky in CI for reasons
 * having nothing to do with this gate. The measured run is recorded on
 * QCLI-300 instead:
 *
 *   node scripts/qualification/require-platform-visibility.mjs 9.9.9 \
 *     --max-wait-ms 1 --registry http://127.0.0.1:9
 *   -> exit 1, "THE WRAPPER WAS NOT PUBLISHED. 6 of 6 ..."
 *
 * What stays testable hermetically is the argument parsing that run depends
 * on, so a typo in a flag name cannot silently turn the bounded wait back
 * into the 15-minute default.
 */
test("parseArgs reads the bounded-wait flags and leaves the version positional", () => {
  const parsed = parseArgs([
    "9.9.9",
    "--max-wait-ms",
    "1",
    "--registry",
    "http://127.0.0.1:9",
  ]);
  expect(parsed.version).toBe("9.9.9");
  expect(parsed.options.maxWaitMs).toBe(1);
  expect(parsed.options.registry).toBe("http://127.0.0.1:9");
});

test("parseArgs leaves both flags unset when they are not passed, as release.yml does", () => {
  const parsed = parseArgs([]);
  expect(parsed.version).toBeUndefined();
  expect(parsed.options.maxWaitMs).toBeUndefined();
  expect(parsed.options.registry).toBeUndefined();
});
