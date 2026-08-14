import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CURRENT_MARKER = /^\*\*Lifecycle\*\*:\s*executable-current\s*$/im;
const HISTORICAL_MARKER = /^\*\*Lifecycle\*\*:\s*historical-non-executable\s*$/im;
const PASTE_READY_HEADING = /^##\s+Paste-ready prompt\s*$/im;
const GROUNDED_LINE = /^\*\*Grounded against\*\*:\s*.+\b[0-9a-f]{40}\b.*$/im;
const TRACKER_LINE = /^\*\*Tracker\*\*:\s*doc-[0-9]+\b.+$/im;
const MODE_LINE = /^\*\*Mode\*\*:\s*autonomous-docs\s*$/im;
const STOP_CLASS_LINE = /^\*\*Stop class\*\*:\s*(human-decision|session-renewal)\s*$/im;
const STATE_COUNTS = ["Resolved", "In flight", "Blocked", "Ready"];
const IN_FLIGHT_HEADING = /^##\s+In flight\s*$/im;
const RETAINED_HEADING = /^##\s+Retained artifacts\s*$/im;
const DECISION_HEADING = /^##\s+Decision required\s*$/im;
const NEXT_ACTION_HEADING = /^##\s+Next action\s*$/im;
const DECISION_LINE = /^- Decision:\s*(.+)$/im;
const NEXT_ACTION_LINE = /^- Action:\s*(.+)$/im;
const MAX_ACTIVE_LINES = 120;
const MAX_ACTIVE_BYTES = 16 * 1024;
const RUNNABLE_SIGNALS = [
  ["paste-ready prompt", PASTE_READY_HEADING],
  ["continue directive", /^(?:Continue|Resume) (?:this|the) backlog campaign\b/im],
  ["task resume directive", /^Resume [A-Z][A-Z0-9]*-[0-9]+(?:\.[0-9]+)*\b/im],
  ["safe-resume sequence", /^(?:##\s+Safe[- ]resume\b|Safe resume(?: sequence)?:)/im],
  ["backlog-handover invocation", /\$backlog-handover(?:\s+(?:init|restore|write|status))?\b/i],
];

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultDirectory = resolve(scriptDir, "../../../..", ".claude/handovers");
const completeMode = process.argv.includes("--complete");
const directoryArgument = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
const handoverDirectory = resolve(directoryArgument ?? defaultDirectory);
const failures = [];

if (!existsSync(handoverDirectory)) {
  if (!completeMode) failures.push(`handover directory is missing: ${handoverDirectory}`);
} else {
  const files = readdirSync(handoverDirectory)
    .filter((name) => name.endsWith(".md"))
    .sort();

  if (completeMode && files.includes("active.md")) {
    failures.push("completed campaign retains active.md");
  } else if (!completeMode && !files.includes("active.md")) {
    failures.push("active.md is missing");
  }

  const executableFiles = [];
  for (const name of files) {
    const body = readFileSync(resolve(handoverDirectory, name), "utf8");
    const current = CURRENT_MARKER.test(body);
    const signals = RUNNABLE_SIGNALS.filter(([, pattern]) => pattern.test(body)).map(([label]) => label);
    const executable = current || signals.length > 0;
    if (executable) executableFiles.push(name);

    if (name === "active.md") {
      if (completeMode) continue;
      if (!current) failures.push("active.md lacks **Lifecycle**: executable-current");
      if (!PASTE_READY_HEADING.test(body)) failures.push("active.md lacks a Paste-ready prompt section");
      if (!GROUNDED_LINE.test(body)) failures.push("active.md lacks a Grounded against line with a full SHA");
      if (!TRACKER_LINE.test(body)) failures.push("active.md lacks a concrete doc-N Tracker line");
      if (!MODE_LINE.test(body)) failures.push("active.md lacks **Mode**: autonomous-docs");

      const stopMatch = body.match(STOP_CLASS_LINE);
      if (!stopMatch) failures.push("active.md lacks a valid Stop class");
      if (!IN_FLIGHT_HEADING.test(body)) failures.push("active.md lacks an In flight section");
      if (!RETAINED_HEADING.test(body)) failures.push("active.md lacks a Retained artifacts section");
      if (!DECISION_HEADING.test(body)) failures.push("active.md lacks a Decision required section");
      if (!NEXT_ACTION_HEADING.test(body)) failures.push("active.md lacks a Next action section");
      for (const label of STATE_COUNTS) {
        if (!new RegExp(`^- ${label}:\\s*[0-9]+(?:\\s|$)`, "im").test(body)) {
          failures.push(`active.md lacks a numeric ${label} state count`);
        }
      }

      const decision = body.match(DECISION_LINE)?.[1]?.trim();
      const nextAction = body.match(NEXT_ACTION_LINE)?.[1]?.trim();
      if (!nextAction || nextAction.startsWith("<")) failures.push("active.md lacks an exact next action");
      if (stopMatch?.[1] === "human-decision") {
        if (!decision || decision.startsWith("<") || /^none\b/i.test(decision)) {
          failures.push("human-decision cursor lacks the exact decision or blocker");
        }
      }
      if (stopMatch?.[1] === "session-renewal") {
        if (!/^none\s+[—-]\s+session renewal$/i.test(decision ?? "")) {
          failures.push("session-renewal cursor must state that no human decision is required");
        }
        const renewalSignals = [
          ["/clear", /\/clear\b/i],
          ["a new quest-cli session", /start a new session in [`']?quest-cli[`']?/i],
          ["$backlog-handover restore", /\$backlog-handover\s+restore\b/i],
          ["without reconfirmation", /without reconfirmation/i],
        ];
        for (const [label, pattern] of renewalSignals) {
          if (!pattern.test(body)) failures.push(`session-renewal cursor lacks ${label}`);
        }
      }
      const lineCount = body.split(/\r?\n/).length;
      const byteCount = Buffer.byteLength(body, "utf8");
      if (lineCount > MAX_ACTIVE_LINES) {
        failures.push(`active.md exceeds ${MAX_ACTIVE_LINES} lines: ${lineCount}`);
      }
      if (byteCount > MAX_ACTIVE_BYTES) {
        failures.push(`active.md exceeds ${MAX_ACTIVE_BYTES} bytes: ${byteCount}`);
      }
      continue;
    }

    if (current) failures.push(`${name} incorrectly carries the executable-current marker`);
    if (signals.length > 0) failures.push(`${name} contains runnable signal(s): ${signals.join(", ")}`);
    if (!HISTORICAL_MARKER.test(body)) {
      failures.push(`${name} lacks **Lifecycle**: historical-non-executable`);
    }
  }

  const expectedExecutableCount = completeMode ? 0 : 1;
  if (
    executableFiles.length !== expectedExecutableCount ||
    (!completeMode && executableFiles[0] !== "active.md")
  ) {
    failures.push(
      `expected ${completeMode ? "no executable handover" : "active.md to be the sole executable handover"}; found ${executableFiles.length}: ${
        executableFiles.join(", ") || "none"
      }`,
    );
  }
}

if (failures.length > 0) {
  process.stderr.write(`handover lifecycle audit failed:\n- ${failures.join("\n- ")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    completeMode
      ? "handover lifecycle audit passed: completed campaign has no executable cursor\n"
      : "handover lifecycle audit passed: active.md is the sole grounded executable cursor\n",
  );
}
