import { expect, test } from "bun:test";

import { questGuides } from "../src/application/agents/guides.ts";
import { commandManifest } from "../src/application/command-contract.ts";
import { commandHelp } from "../src/application/command-help.ts";

/**
 * Task records are archive-only by design (DEC-8, QCLI-164).
 *
 * The absence of `task delete` is the easy half to assert and the easy half to
 * re-introduce: it reads as an oversight next to `milestone delete` and
 * `decision delete`, which is exactly how QCLI-164 was filed in the first
 * place. So the guard is not only that the verb is absent, but that BOTH
 * surfaces an agent would consult still carry the reason -- otherwise the next
 * reader finds a gap with no rationale attached and re-files it, which is the
 * specific outcome the decision was recorded to prevent.
 *
 * Asserting absence alone would pass just as happily against a repository that
 * had silently dropped the explanation, so the paired documentation assertions
 * below are the load-bearing ones.
 */

// Deliberately widened to string. The manifest's own `name` union does not
// contain "task delete", so a narrowly-typed Set makes the absence assertion
// below a COMPILE error rather than a runtime check -- tsc refuses the literal.
// That is a real second guard worth knowing about (adding the verb to the
// manifest is what would make this line type-check at all), but a guard that
// cannot be executed cannot be seen to fail, so the runtime assertion is kept
// and the type is widened to let it run.
const commandNames: ReadonlySet<string> = new Set<string>(
  commandManifest.commands.map((entry) => entry.name),
);

test("no task delete verb exists, while milestone and decision keep theirs", () => {
  expect(commandNames.has("task delete")).toBe(false);
  // The asymmetry is the point: if these two ever lose delete, the decision
  // this test guards has been overtaken and the reasoning needs re-reading
  // rather than this line being updated to match.
  expect(commandNames.has("milestone delete")).toBe(true);
  expect(commandNames.has("decision delete")).toBe(true);
});

test("task archive help explains why there is no delete, not just what archive does", () => {
  const summary = commandHelp["task archive"]?.summary ?? "";
  expect(summary).toContain("task delete");
  expect(summary).toContain("QCLI-164");
  // The reason, not merely a cross-reference to it: an agent reading help
  // should not have to go fetch DEC-8 to learn why.
  expect(summary).toContain("audit-significant");
});

test("the task-finalization guide carries the same decision", () => {
  const guide = questGuides.find((entry) => entry.name === "task-finalization");
  expect(guide).toBeDefined();
  const body = guide?.content ?? "";
  expect(body).toContain("task delete");
  expect(body).toContain("QCLI-164");
  // Behaviour alone ("nothing deletes tasks") reads as "no AUTOMATIC deletion"
  // and was the pre-QCLI-164 wording; the guide has to say it is deliberate.
  expect(body).toMatch(/not an omission but a decision/);
});
