import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LocalAgentInstructionPort } from "../../../src/adapters/agents/local-agent-instructions.ts";
import {
  AgentInstructionError,
  checkQuestAgentInstructions,
  codexInstructionPath,
  inspectQuestAgentInstructions,
  questAgentInstructions,
  updateQuestAgentInstructions,
} from "../../../src/application/agents/agent-instructions.ts";

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
