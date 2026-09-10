import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createAgentInstructionPort } from "../../src/cli/composition.ts";
import {
  type InitWizardInstructionFileOption,
  runInitWizard,
  writeInitInstructions,
} from "../../src/cli/main.ts";

function fakePrompts(answers: {
  readonly name?: string;
  readonly taskIdPrefix?: string;
  readonly targets?:
    | readonly ("claude" | "codex" | "antigravity")[]
    | undefined; // undefined = cancel
}) {
  const calls: unknown[] = [];
  return {
    prompts: {
      text: async (question: string, defaultValue: string) => {
        calls.push(["text", question, defaultValue]);
        if (question === "Project name") return answers.name ?? defaultValue;
        if (question === "Task ID prefix")
          return answers.taskIdPrefix ?? defaultValue;
        throw new Error(`unexpected text prompt: ${question}`);
      },
      selectInstructionFiles: async (
        options: readonly InitWizardInstructionFileOption[],
      ) => {
        calls.push(["selectInstructionFiles", options]);
        if ("targets" in answers) return answers.targets;
        return ["claude"] as const;
      },
    },
    calls,
  };
}

test("the wizard asks name, prefix, then a single multi-select listing all three supported files (QCLI-159/255)", async () => {
  const { prompts, calls } = fakePrompts({});
  const answers = await runInitWizard("quest-cli", prompts);
  expect(calls).toEqual([
    ["text", "Project name", "quest-cli"],
    ["text", "Task ID prefix", "T"],
    [
      "selectInstructionFiles",
      [
        { label: "CLAUDE.md — Claude Code", value: "claude" },
        {
          label:
            "AGENTS.md — Codex, Cursor, Zed, Warp, Aider, RooCode, OpenCode, pi, and other AGENTS.md-reading tools (Antigravity also reads this as an alternative to GEMINI.md)",
          value: "codex",
        },
        {
          label: "GEMINI.md — Google Antigravity, Gemini CLI",
          value: "antigravity",
        },
      ],
    ],
  ]);
  expect(answers).toEqual({
    name: "quest-cli",
    taskIdPrefix: "T",
    targets: ["claude"],
  });
});

test("selecting all three files returns all three, in the order chosen", async () => {
  const { prompts } = fakePrompts({
    targets: ["codex", "antigravity", "claude"],
  });
  expect((await runInitWizard("dirname", prompts))?.targets).toEqual([
    "codex",
    "antigravity",
    "claude",
  ]);
});

test("selecting nothing is a legal, deliberate answer -- not a cancellation", async () => {
  const { prompts } = fakePrompts({ targets: [] });
  const answers = await runInitWizard("dirname", prompts);
  expect(answers).not.toBeUndefined();
  expect(answers?.targets).toEqual([]);
});

test("cancelling the multi-select aborts the whole wizard -- the caller must not treat it as an empty selection", async () => {
  const { prompts } = fakePrompts({ targets: undefined });
  expect(await runInitWizard("dirname", prompts)).toBeUndefined();
});

test("the wizard returns exactly what was answered", async () => {
  const { prompts } = fakePrompts({
    name: "My Project",
    taskIdPrefix: "QCLI",
    targets: ["codex"],
  });
  expect(await runInitWizard("dirname", prompts)).toEqual({
    name: "My Project",
    taskIdPrefix: "QCLI",
    targets: ["codex"],
  });
});

test("a blank task ID prefix answer falls back to the default instead of an empty prefix", async () => {
  const { prompts } = fakePrompts({ taskIdPrefix: "   " });
  expect((await runInitWizard("dirname", prompts))?.taskIdPrefix).toBe("T");
});

// writeInitInstructions is only reachable through the interactive wizard,
// which needs a live TTY the CLI-process test harness cannot provide --
// extracted (QCLI-255) so its multi-target write path is directly testable
// against a real temp directory instead.
async function withTempRoot(
  body: (root: string) => Promise<void>,
): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "quest-init-instructions-"));
  try {
    await body(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("writeInitInstructions: a scripted single target (interactiveTargets undefined) keeps the original single-object shape (QCLI-255)", async () => {
  await withTempRoot(async (root) => {
    const port = createAgentInstructionPort(root);
    const result = await writeInitInstructions(
      port,
      undefined,
      "codex",
      undefined,
    );
    expect(result.instructions).toMatchObject({ state: "current" });
    expect(result.instructionsByTarget).toBeUndefined();
    expect(result.skill).toMatchObject({ state: "current" });
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toContain(
      "quest:agent-instructions",
    );
    await expect(readFile(join(root, "CLAUDE.md"), "utf8")).rejects.toThrow();
  });
});

test("writeInitInstructions: an interactive selection of exactly one file also keeps the single-object shape", async () => {
  await withTempRoot(async (root) => {
    const port = createAgentInstructionPort(root);
    const result = await writeInitInstructions(
      port,
      ["claude"],
      undefined,
      undefined,
    );
    expect(result.instructions).toMatchObject({ state: "current" });
    expect(result.instructionsByTarget).toBeUndefined();
    expect(await readFile(join(root, "CLAUDE.md"), "utf8")).toContain(
      "quest:agent-instructions",
    );
  });
});

test("writeInitInstructions: an interactive selection of exactly one file also keeps the single-object shape for the new antigravity target", async () => {
  await withTempRoot(async (root) => {
    const port = createAgentInstructionPort(root);
    const result = await writeInitInstructions(
      port,
      ["antigravity"],
      undefined,
      undefined,
    );
    expect(result.instructions).toMatchObject({ state: "current" });
    expect(result.instructionsByTarget).toBeUndefined();
    expect(await readFile(join(root, "GEMINI.md"), "utf8")).toContain(
      "quest:agent-instructions",
    );
  });
});

test("writeInitInstructions: an interactive selection of all three files writes all three, using the additive instructionsByTarget field (QCLI-159)", async () => {
  await withTempRoot(async (root) => {
    const port = createAgentInstructionPort(root);
    const result = await writeInitInstructions(
      port,
      ["claude", "codex", "antigravity"],
      undefined,
      undefined,
    );
    expect(result.instructions).toBeUndefined();
    expect(result.instructionsByTarget).toMatchObject({
      claude: { state: "current" },
      codex: { state: "current" },
      antigravity: { state: "current" },
    });
    expect(await readFile(join(root, "CLAUDE.md"), "utf8")).toContain(
      "quest:agent-instructions",
    );
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toContain(
      "quest:agent-instructions",
    );
    expect(await readFile(join(root, "GEMINI.md"), "utf8")).toContain(
      "quest:agent-instructions",
    );
    // The skill file is written once regardless of how many targets were
    // selected, not once per target (unchanged from QCLI-254).
    expect(result.skill).toMatchObject({ state: "current" });
  });
});

test("writeInitInstructions: --skill-source plugin given explicitly skips the skill write, for both the single- and multi-target shapes (QCLI-254 preserved)", async () => {
  await withTempRoot(async (root) => {
    const port = createAgentInstructionPort(root);
    const single = await writeInitInstructions(
      port,
      undefined,
      "codex",
      "plugin",
    );
    expect(single.skill).toBeUndefined();
    await expect(
      readFile(join(root, ".claude", "skills", "quest", "SKILL.md"), "utf8"),
    ).rejects.toThrow();

    const multi = await writeInitInstructions(
      port,
      ["claude", "codex"],
      undefined,
      "plugin",
    );
    expect(multi.skill).toBeUndefined();
  });
});
