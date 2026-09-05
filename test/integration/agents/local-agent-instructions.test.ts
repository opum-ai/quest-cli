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

test("managed instructions derive the runtime release version without hand-synced literals", () => {
  expect(questAgentInstructions).toContain(
    `This project uses Quest CLI ${QUEST_VERSION} for tracker operations.`,
  );
  const drifted = questAgentInstructions
    .trimEnd()
    .replace(`Quest CLI ${QUEST_VERSION}`, "Quest CLI 0.0.0");
  expect(checkQuestAgentInstructions(drifted)).toEqual({
    state: "drift",
    message: `Quest agent instruction block differs from version ${QUEST_VERSION}.`,
  });
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
