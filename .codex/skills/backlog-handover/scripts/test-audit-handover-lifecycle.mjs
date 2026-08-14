import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const auditPath = join(scriptDirectory, "audit-handover-lifecycle.mjs");
const root = mkdtempSync(join(tmpdir(), "backlog-handover-lifecycle-"));
const sessionRenewal = [
  "# Campaign handover",
  "",
  "**Lifecycle**: executable-current",
  "**Grounded against**: quest-cli fix/qcli-96 @ 0123456789abcdef0123456789abcdef01234567; clean; origin/dev known",
  "**Tracker**: doc-17 - Autonomous loop",
  "**Mode**: autonomous-docs",
  "**Stop class**: session-renewal",
  "",
  "## Paste-ready prompt",
  "Run /clear, start a new session in `quest-cli`, then use $backlog-handover restore without reconfirmation.",
  "",
  "## State",
  "- Resolved: 1",
  "- In flight: 1",
  "- Blocked: 0",
  "- Ready: 2",
  "",
  "## In flight",
  "| Task | Worktree/branch | Last verified tree and stage | Blocker or next action |",
  "| QCLI-96 | fix/qcli-96 | 0123456789abcdef0123456789abcdef01234567, reviewed | Restore and deliver |",
  "",
  "## Retained artifacts",
  "| Artifact | Owner | Reason | Cleanup condition |",
  "| fix/qcli-96 | QCLI-96 | Session renewal | Merge to dev |",
  "",
  "## Decision required",
  "- Decision: None — session renewal",
  "",
  "## Next action",
  "- Action: Run /clear, start a new session in `quest-cli`, invoke $backlog-handover restore, and continue without reconfirmation.",
  "",
  "## Exceptions",
  "- None.",
  "",
].join("\n");
const humanDecision = sessionRenewal
  .replace("**Stop class**: session-renewal", "**Stop class**: human-decision")
  .replace("- Decision: None — session renewal", "- Decision: Choose whether the public format may change.")
  .replace(
    "- Action: Run /clear, start a new session in `quest-cli`, invoke $backlog-handover restore, and continue without reconfirmation.",
    "- Action: Supply the format-compatibility decision; the campaign will then restore and continue.",
  );
const historical = ["# Settled campaign", "", "**Lifecycle**: historical-non-executable", "", "Closed summary.", ""].join("\n");

function activeAtBoundary(lineCount, byteCount) {
  const lines = sessionRenewal.trimEnd().split("\n");
  while (lines.length < lineCount) lines.push("x");
  let body = lines.join("\n");
  const padding = byteCount - Buffer.byteLength(body, "utf8");
  if (padding < 0) throw new Error("requested active handover boundary is smaller than its fixture");
  body += "x".repeat(padding);
  return body;
}

function runCase(name, files, expectedStatus, expectedText, extraArguments = []) {
  const directory = join(root, name);
  mkdirSync(directory);
  for (const [file, body] of Object.entries(files)) writeFileSync(join(directory, file), body, { flag: "wx" });
  const result = spawnSync(process.execPath, [auditPath, directory, ...extraArguments], { encoding: "utf8" });
  const output = `${result.stdout}${result.stderr}`;
  if (result.status !== expectedStatus || !output.includes(expectedText)) {
    throw new Error(`${name}: expected ${expectedStatus}/${JSON.stringify(expectedText)}; received ${result.status}\n${output}`);
  }
}

try {
  const boundary = activeAtBoundary(120, 16 * 1024);
  const vagueRenewal = sessionRenewal
    .replace("Run /clear, start a new session in `quest-cli`, then use $backlog-handover restore without reconfirmation.", "Continue later.")
    .replace("- Action: Run /clear, start a new session in `quest-cli`, invoke $backlog-handover restore, and continue without reconfirmation.", "- Action: Continue later.");
  const cases = [
    ["valid-session-renewal", { "active.md": sessionRenewal, "settled.md": historical }, 0, "sole grounded executable cursor"],
    ["valid-human-decision", { "active.md": humanDecision, "settled.md": historical }, 0, "sole grounded executable cursor"],
    ["duplicate-cursor", { "active.md": sessionRenewal, "legacy.md": `${historical}\nUse $backlog-handover restore to continue.\n` }, 1, "legacy.md contains runnable signal(s): backlog-handover invocation"],
    ["historical-resume-qcli-71", { "active.md": sessionRenewal, "legacy.md": `${historical}\nResume QCLI-71\n` }, 1, "legacy.md contains runnable signal(s): task resume directive"],
    ["historical-resume-foreign-task", { "active.md": sessionRenewal, "legacy.md": `${historical}\nResume ODOC-54\n` }, 1, "legacy.md contains runnable signal(s): task resume directive"],
    ["missing-stop-class", { "active.md": sessionRenewal.replace(/^\*\*Stop class\*\*.*\n/m, "") }, 1, "active.md lacks a valid Stop class"],
    ["missing-grounding", { "active.md": sessionRenewal.replace(/^\*\*Grounded against\*\*.*\n/m, "") }, 1, "full SHA"],
    ["vague-session-renewal", { "active.md": vagueRenewal }, 1, "session-renewal cursor lacks /clear"],
    ["human-without-decision", { "active.md": humanDecision.replace("- Decision: Choose whether the public format may change.", "- Decision: None") }, 1, "human-decision cursor lacks"],
    ["exact-boundary", { "active.md": boundary, "settled.md": historical }, 0, "handover lifecycle audit passed"],
    ["line-overflow", { "active.md": `${boundary}\nextra` }, 1, "active.md exceeds 120 lines: 121"],
    ["byte-overflow", { "active.md": `${boundary}x` }, 1, "active.md exceeds 16384 bytes: 16385"],
    ["complete-no-cursor", { "settled.md": historical }, 0, "completed campaign has no executable cursor", ["--complete"]],
    ["complete-stale-cursor", { "active.md": sessionRenewal }, 1, "completed campaign retains active.md", ["--complete"]],
  ];
  for (const [name, files, status, text, extraArguments] of cases) {
    runCase(name, files, status, text, extraArguments);
  }
  process.stdout.write(`handover lifecycle fixtures passed: ${cases.length} cases\n`);
} finally {
  rmSync(root, { recursive: true, force: true });
}
