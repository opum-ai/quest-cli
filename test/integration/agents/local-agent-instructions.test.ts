import { expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { LocalAgentInstructionPort } from "../../../src/adapters/agents/local-agent-instructions.ts";
import {
  AgentInstructionError,
  applyQuestAgentInstructions,
  checkQuestAgentInstructions,
  codexInstructionPath,
  inspectQuestAgentInstructions,
  inspectQuestSkillFile,
  questAgentInstructions,
  questSkillContent,
  questSkillPath,
  updateQuestAgentInstructions,
  updateQuestSkillFile,
} from "../../../src/application/agents/agent-instructions.ts";
import { QUEST_VERSION } from "../../../src/application/version.ts";

// The Backlog.md CLI installer's real managed block (QCLI-215), byte-for-byte
// as `backlog init` writes it -- not a simplified stand-in.
const BACKLOG_GUIDELINES_BLOCK = `<!-- BACKLOG.MD GUIDELINES START -->
<!-- backlog.md-instructions-version: 1.48.0 -->
<CRITICAL_INSTRUCTION>

## Backlog.md Workflow

This project uses Backlog.md for task and project management.

**For every user request in this project, run \`backlog instructions overview\` before answering or taking action.**

Use the overview to decide whether to search, read, create, or update Backlog tasks.

Before task lifecycle actions, read the matching detailed guide:
- \`backlog instructions task-creation\` before creating or splitting tasks
- \`backlog instructions task-execution\` before planning, changing status or assignee, adding a plan or implementation notes, or implementing task work
- \`backlog instructions task-finalization\` before checking acceptance criteria, writing final summaries, or moving tasks to terminal statuses

Use \`backlog <command> --help\` before running unfamiliar commands. Help shows options, fields, and examples.

Do not edit Backlog task, draft, document, decision, or milestone markdown files directly. Use the \`backlog\` CLI so metadata, relationships, and history stay consistent.

</CRITICAL_INSTRUCTION>
<!-- BACKLOG.MD GUIDELINES END -->
`;

test("managed instructions derive the runtime release version without hand-synced literals", () => {
  expect(questAgentInstructions).toContain(
    `This project uses Quest CLI ${QUEST_VERSION} for tracker operations.`,
  );
});

test("a version-only difference reports version-only, not drift, but genuine content drift still fails (QCLI-228)", () => {
  const versionOnly = questAgentInstructions
    .trimEnd()
    .replace(`Quest CLI ${QUEST_VERSION}`, "Quest CLI 0.0.0");
  expect(checkQuestAgentInstructions(versionOnly)).toEqual({
    state: "version-only",
    message: `Quest agent instruction block records Quest CLI 0.0.0; the installed CLI is ${QUEST_VERSION}. Content is otherwise current.`,
  });

  // A missing block is still missing, never "version-only".
  expect(checkQuestAgentInstructions(undefined)).toEqual({ state: "missing" });

  // Real prose drift -- even paired with a version bump -- still fails.
  const contentDrift = questAgentInstructions
    .trimEnd()
    .replace(
      `Quest CLI ${QUEST_VERSION} for tracker operations.`,
      "Quest CLI 0.0.0 for tracker operations, with an extra sentence.",
    );
  expect(checkQuestAgentInstructions(contentDrift)).toEqual({
    state: "drift",
    message: `Quest agent instruction block differs from version ${QUEST_VERSION}.`,
  });

  // Drift entirely unrelated to the version string is still drift.
  const unrelatedDrift = questAgentInstructions
    .trimEnd()
    .replace(
      "Quest writes require an explicit actor declaration",
      "Quest writes are anonymous",
    );
  expect(checkQuestAgentInstructions(unrelatedDrift)).toEqual({
    state: "drift",
    message: `Quest agent instruction block differs from version ${QUEST_VERSION}.`,
  });
});

test("agents --update-instructions still refreshes a version-only-stale block to the exact current bytes (QCLI-228)", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-agents-version-"));
  try {
    const file = join(root, codexInstructionPath);
    const versionOnly = questAgentInstructions.replace(
      `Quest CLI ${QUEST_VERSION}`,
      "Quest CLI 0.0.0",
    );
    await writeFile(file, versionOnly);
    const port = new LocalAgentInstructionPort(root);
    expect(await inspectQuestAgentInstructions(port)).toMatchObject({
      state: "version-only",
    });
    expect(await updateQuestAgentInstructions(port)).toEqual({
      state: "current",
    });
    expect(await readFile(file, "utf8")).toBe(questAgentInstructions);
    expect(await inspectQuestAgentInstructions(port)).toEqual({
      state: "current",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a leftover Backlog.md guidelines block is a real drift even when the Quest block is otherwise exact (QCLI-215)", () => {
  const withBacklogBlock = `${BACKLOG_GUIDELINES_BLOCK}\n${questAgentInstructions}`;
  expect(checkQuestAgentInstructions(withBacklogBlock)).toEqual({
    state: "drift",
    message:
      "This file still carries the Backlog.md installer's guidelines block, which the Quest migration this workspace completed is meant to retire. Run `quest agents --update-instructions` to remove it.",
  });
});

test("a version-only difference alongside a Backlog block still reports the Backlog contradiction, not version-only", () => {
  const versionOnly = questAgentInstructions.replace(
    `Quest CLI ${QUEST_VERSION}`,
    "Quest CLI 0.0.0",
  );
  const combined = `${BACKLOG_GUIDELINES_BLOCK}\n${versionOnly}`;
  expect(checkQuestAgentInstructions(combined).state).toBe("drift");
});

test("agents --update-instructions removes the Backlog block whether the Quest block was missing, current, or drifted (QCLI-215)", () => {
  // The exact motivating shape: a workspace fresh off `migration backlog
  // apply`, no Quest block installed yet at all.
  const freshMigration = `# My project\n\n${BACKLOG_GUIDELINES_BLOCK}`;
  const afterFreshMigration = applyQuestAgentInstructions(freshMigration);
  expect(afterFreshMigration).not.toContain("BACKLOG.MD GUIDELINES");
  expect(afterFreshMigration).toContain("# My project");
  expect(afterFreshMigration).toContain(questAgentInstructions.trimEnd());
  expect(checkQuestAgentInstructions(afterFreshMigration)).toEqual({
    state: "current",
  });

  // The Quest block is already exact -- only the Backlog block needs to go.
  const alreadyCurrent = `${BACKLOG_GUIDELINES_BLOCK}${questAgentInstructions}`;
  const afterAlreadyCurrent = applyQuestAgentInstructions(alreadyCurrent);
  expect(afterAlreadyCurrent).not.toContain("BACKLOG.MD GUIDELINES");
  expect(afterAlreadyCurrent).toBe(questAgentInstructions);

  // Both problems at once: a stale Quest block and a Backlog block.
  const bothDrifted = `${BACKLOG_GUIDELINES_BLOCK}${questAgentInstructions.replace(QUEST_VERSION, "0.0.0")}`;
  const afterBothDrifted = applyQuestAgentInstructions(bothDrifted);
  expect(afterBothDrifted).not.toContain("BACKLOG.MD GUIDELINES");
  expect(afterBothDrifted).toBe(questAgentInstructions);
});

test("Backlog block removal is bounded to the delimited block and preserves surrounding content byte-for-byte (QCLI-215)", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-agents-backlog-"));
  try {
    const file = join(root, codexInstructionPath);
    const authored = "# Local conventions\n\nKeep this text.\n";
    // No Quest block yet -- the exact fresh-migration shape -- alongside
    // hand-authored content on both sides of the Backlog block, to prove
    // the removal touches only its own delimited span.
    const content = `${authored}\n${BACKLOG_GUIDELINES_BLOCK}## Trailing section\n\nKeep this too.\n`;
    await writeFile(file, content);
    const port = new LocalAgentInstructionPort(root);
    expect(await inspectQuestAgentInstructions(port)).toMatchObject({
      state: "missing",
    });
    expect(await updateQuestAgentInstructions(port)).toEqual({
      state: "current",
    });
    const updated = await readFile(file, "utf8");
    expect(updated).not.toContain("BACKLOG.MD GUIDELINES");
    expect(updated).not.toContain("backlog instructions overview");
    expect(updated).toContain("# Local conventions\n\nKeep this text.");
    expect(updated).toContain("## Trailing section\n\nKeep this too.");
    expect(updated).toContain(questAgentInstructions.trimEnd());
    expect(await inspectQuestAgentInstructions(port)).toEqual({
      state: "current",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("opt-in Codex guidance preserves authored AGENTS content and remains idempotent", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-agents-"));
  try {
    const file = join(root, codexInstructionPath);
    const authored = "# Local conventions\n\nKeep this text.\n";
    await writeFile(file, authored);
    const port = new LocalAgentInstructionPort(root);

    expect(await inspectQuestAgentInstructions(port)).toEqual({
      state: "missing",
    });
    expect(await updateQuestAgentInstructions(port)).toEqual({
      state: "current",
    });
    expect(await readFile(file, "utf8")).toBe(
      `${authored}\n${questAgentInstructions}`,
    );
    expect(await updateQuestAgentInstructions(port)).toEqual({
      state: "current",
    });
    expect(await readFile(file, "utf8")).toBe(
      `${authored}\n${questAgentInstructions}`,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("drift inspection is read-only and update replaces only a complete managed block", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-agents-"));
  try {
    const file = join(root, codexInstructionPath);
    const drifted =
      "before\n<!-- quest:agent-instructions:begin -->\nold\n<!-- quest:agent-instructions:end -->\nafter\n";
    await writeFile(file, drifted);
    const port = new LocalAgentInstructionPort(root);
    expect(await inspectQuestAgentInstructions(port)).toMatchObject({
      state: "drift",
    });
    expect(await readFile(file, "utf8")).toBe(drifted);
    await updateQuestAgentInstructions(port);
    expect(await readFile(file, "utf8")).toBe(
      `before\n${questAgentInstructions.trimEnd()}\nafter\n`,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("the skill file is installed at its nested path, exact-match idempotent, and drift-detected wholesale", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-skill-"));
  try {
    const port = new LocalAgentInstructionPort(root);
    const file = join(root, questSkillPath);

    expect(await inspectQuestSkillFile(port)).toEqual({ state: "missing" });
    expect(await updateQuestSkillFile(port)).toEqual({ state: "current" });
    expect(await readFile(file, "utf8")).toBe(questSkillContent);
    expect(await inspectQuestSkillFile(port)).toEqual({ state: "current" });

    expect(await updateQuestSkillFile(port)).toEqual({ state: "current" });
    expect(await readFile(file, "utf8")).toBe(questSkillContent);

    await writeFile(file, "hand-edited\n");
    expect(await inspectQuestSkillFile(port)).toEqual({
      state: "drift",
      message: "Quest skill file differs from the bundled version.",
    });
    await updateQuestSkillFile(port);
    expect(await readFile(file, "utf8")).toBe(questSkillContent);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("skillSource=plugin: absent skill file is current, a present one is orphaned, and neither write nor propose happens (QCLI-236)", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-skill-plugin-"));
  try {
    const port = new LocalAgentInstructionPort(root);
    const file = join(root, questSkillPath);

    // Absent is the healthy state under skillSource=plugin: no write, no
    // "missing" complaint.
    expect(await inspectQuestSkillFile(port, questSkillPath, "plugin")).toEqual(
      { state: "current" },
    );
    expect(await updateQuestSkillFile(port, questSkillPath, "plugin")).toEqual({
      state: "current",
    });
    await expect(readFile(file, "utf8")).rejects.toThrow();

    // A byte-exact leftover (as if written before the repo opted in) is
    // reported orphaned, not silently accepted or removed without --force.
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, questSkillContent);
    const orphanedExact = await inspectQuestSkillFile(
      port,
      questSkillPath,
      "plugin",
    );
    expect(orphanedExact.state).toBe("orphaned");
    expect((orphanedExact as { message: string }).message).toContain(
      "opum-quest",
    );
    // A non-force update leaves it in place.
    expect(await updateQuestSkillFile(port, questSkillPath, "plugin")).toEqual(
      orphanedExact,
    );
    expect(await readFile(file, "utf8")).toBe(questSkillContent);

    // --force removes it only because it is byte-identical to the generated
    // content.
    expect(
      await updateQuestSkillFile(port, questSkillPath, "plugin", true),
    ).toEqual({ state: "current" });
    await expect(readFile(file, "utf8")).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("skillSource=plugin: --force never removes a hand-edited leftover, even though it still reports orphaned (QCLI-236)", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-skill-plugin-force-"));
  try {
    const port = new LocalAgentInstructionPort(root);
    const file = join(root, questSkillPath);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, "hand-edited, not the generated content\n");

    const check = await inspectQuestSkillFile(port, questSkillPath, "plugin");
    expect(check.state).toBe("orphaned");

    // Force still refuses: the bytes do not match what Quest would generate.
    expect(
      await updateQuestSkillFile(port, questSkillPath, "plugin", true),
    ).toEqual(check);
    expect(await readFile(file, "utf8")).toBe(
      "hand-edited, not the generated content\n",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("the skill file write rejects escaping through a symlinked intermediate directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-skill-escape-"));
  const outside = await mkdtemp(join(tmpdir(), "quest-skill-outside-"));
  try {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(root, ".claude"), { recursive: true });
    await symlink(outside, join(root, ".claude", "skills"));
    const port = new LocalAgentInstructionPort(root);
    await expect(updateQuestSkillFile(port)).rejects.toBeInstanceOf(
      AgentInstructionError,
    );
    await expect(
      readFile(join(outside, "quest", "SKILL.md"), "utf8"),
    ).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("the existing AGENTS.md path is unaffected by nested-path support", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-agents-flat-"));
  try {
    const port = new LocalAgentInstructionPort(root);
    expect(await port.read("AGENTS.md")).toBeUndefined();
    await port.write("AGENTS.md", "content\n");
    expect(await port.read("AGENTS.md")).toBe("content\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("malformed markers and symbolic files are rejected without overwrite", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-agents-"));
  const outside = await mkdtemp(join(tmpdir(), "quest-agents-outside-"));
  try {
    const port = new LocalAgentInstructionPort(root);
    await writeFile(
      join(root, codexInstructionPath),
      "<!-- quest:agent-instructions:begin -->\n",
    );
    await expect(updateQuestAgentInstructions(port)).rejects.toBeInstanceOf(
      AgentInstructionError,
    );
    await rm(join(root, codexInstructionPath));
    await symlink(join(outside, "AGENTS.md"), join(root, codexInstructionPath));
    await expect(inspectQuestAgentInstructions(port)).rejects.toBeInstanceOf(
      AgentInstructionError,
    );
    expect(checkQuestAgentInstructions(undefined)).toEqual({
      state: "missing",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
