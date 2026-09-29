import { expect, test } from "bun:test";

import { ensureGitHubRelease } from "../scripts/github-release.mjs";

/**
 * QCLI-410. Releases whose stored bodies are records written after their tags
 * differ from the section at the commit their tag peels to, so the re-sourced
 * comparison reports every one of them as differing. The ruling is to keep
 * those bodies and report the exception by name and reason: rewriting a record
 * to match an earlier one falsifies it.
 *
 * Only pre-change symbols are imported at module scope, so this file also
 * runs against the module as it was before the table existed and fails on its
 * verdicts rather than at import. `recordedLegacyReason` is imported inside
 * the test that needs it, for the same reason.
 */

/** The closed recorded set, ordered by version. Adding one is a deliberate edit. */
const RECORDED = ["0.6.0", "0.6.1", "0.6.2", "0.7.0", "0.8.0"];

const TAGGED_NOTES = "The bytes at the tagged commit.";
const STORED_BODY = "A body someone wrote after the tag.\n";

const ghWithRelease =
  (body: string, calls: string[][]) =>
  async (file: string, args: readonly string[]) => {
    calls.push([file, ...args]);
    if (args[0] === "release" && args[1] === "view")
      return {
        stdout: JSON.stringify({
          tagName: args[2],
          body,
          isDraft: false,
          isPrerelease: false,
        }),
      };
    return { stdout: "" };
  };

test("each recorded release is reported with its own reason, never edited, never marked latest", async () => {
  const details = new Map<string, string>();
  for (const version of RECORDED) {
    const calls: string[][] = [];
    const out = await ensureGitHubRelease({
      version,
      notes: TAGGED_NOTES,
      // NOT a dry run: this is the flag under which a mutating call could
      // happen at all, so the no-mutation claim is asserted where it can
      // fail. With dryRun the assertion below would be entailed by the flag.
      dryRun: false,
      execFile: ghWithRelease(STORED_BODY, calls),
    });
    expect(out.ok).toBe(true);
    expect(out.action).toBe("recorded-exception");
    expect(out.detail).toContain("BY RECORDED EXCEPTION");
    expect(out.detail).toContain(`"## ${version}"`);
    expect(out.detail).toContain("not marked latest");
    // The only call is the read: no edit, no mark-latest, no mutation of any
    // kind reaches a release whose body is a record.
    expect(calls).toHaveLength(1);
    expect(calls[0]?.slice(0, 3)).toEqual(["gh", "release", "view"]);
    details.set(version, out.detail);
  }
  // The two that were tagged and never published say so in their reason.
  expect(details.get("0.6.1")).toContain("never published");
  expect(details.get("0.8.0")).toContain("never published");
});

test("the recorded set is exactly the table, in both directions, and every reason is its own", async () => {
  // Imported here rather than at module scope: the symbols are part of this
  // change, and a module-scope import would kill the pre-change control run
  // at import time instead of letting it fail on an assertion.
  const { recordedLegacyReason, recordedLegacyVersions } = await import(
    "../scripts/github-release.mjs"
  );
  // Type checks first, so a control run against the pre-change module fails
  // on an assertion here rather than on a TypeError from calling a symbol
  // that did not exist yet.
  expect(typeof recordedLegacyReason).toBe("function");
  expect(typeof recordedLegacyVersions).toBe("function");
  // Set equality BOTH ways: the table's own keys are compared to RECORDED, so
  // an entry added to the table without being added here fails too.
  expect([...recordedLegacyVersions()].sort()).toEqual([...RECORDED].sort());
  const reasons = RECORDED.map((version) => recordedLegacyReason(version));
  expect(reasons.every((reason) => typeof reason === "string")).toBe(true);
  expect(recordedLegacyReason("9.9.9")).toBeUndefined();
  expect(recordedLegacyReason("0.11.0")).toBeUndefined();
  // Distinct REASONS, not distinct detail strings: every detail embeds its
  // version twice, so a shared sentence would still yield distinct details.
  expect(new Set(reasons).size).toBe(RECORDED.length);
});

test("a version NOT in the recorded set keeps the notes-differ refusal", async () => {
  for (const version of ["9.9.9", "1.2.3"]) {
    const calls: string[][] = [];
    const out = await ensureGitHubRelease({
      version,
      notes: TAGGED_NOTES,
      dryRun: false,
      execFile: ghWithRelease(STORED_BODY, calls),
    });
    expect(out.ok).toBe(false);
    expect(out.action).toBe("none");
    expect(out.detail).toContain("notes differ");
    expect(out.detail).toContain("make the release carry those bytes by hand");
  }
});

test("a recorded version whose stored body MATCHES is unchanged: the table moves only the mismatch verdict", async () => {
  const calls: string[][] = [];
  const out = await ensureGitHubRelease({
    version: "0.7.0",
    notes: TAGGED_NOTES,
    dryRun: true,
    execFile: ghWithRelease(TAGGED_NOTES, calls),
  });
  expect(out.ok).toBe(true);
  expect(out.action).toBe("would-mark-latest");
});
