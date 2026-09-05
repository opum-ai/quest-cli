import {
  AgentInstructionError,
  type AgentInstructionPort,
} from "../../ports/agent-instructions.ts";
import type { AgentSkillSource } from "../../ports/workspaces.ts";
import { QUEST_VERSION } from "../version.ts";

export { AgentInstructionError } from "../../ports/agent-instructions.ts";

export const codexInstructionPath = "AGENTS.md";
export const claudeInstructionPath = "CLAUDE.md";

/** Which agent's instruction file the managed block targets. Defaults to
 * "codex" (AGENTS.md) everywhere so existing callers are unaffected. */
export type AgentInstructionTarget = "claude" | "codex";

export function agentInstructionPathForTarget(
  target: AgentInstructionTarget = "codex",
): string {
  return target === "claude" ? claudeInstructionPath : codexInstructionPath;
}

const begin = "<!-- quest:agent-instructions:begin -->";
const end = "<!-- quest:agent-instructions:end -->";

/** The small, versioned contract which agents may rely on after opt-in. The
 * CI hint names the exact --target the reader needs, so a claude-target block
 * doesn't tell its reader to run the codex-target check. */
function questAgentInstructionsFor(
  target: AgentInstructionTarget = "codex",
): string {
  const targetFlag = target === "claude" ? " --target claude" : "";
  return `${begin}
# Quest agent instructions

This project uses Quest CLI ${QUEST_VERSION} for tracker operations. Run \`quest manifest --json\` to discover the supported command contract. Use \`quest instructions --json\` for the current versioned protocol. For Backlog tracker cutover, run \`quest migration backlog preview --source <project> --json\`, review its digest and mappings, then apply it with \`quest migration backlog apply --source <project> --digest <digest> --actor <id> --actor-kind human --json\`. Quest writes require an explicit actor declaration; do not edit Quest-authored records directly. CI should run \`quest agents --check --require-installed${targetFlag}\`: current instructions exit 0, while missing, drifted, or malformed managed instructions exit 6. Quest does not retry write conflicts automatically; callers should read the latest task state and perform their own bounded retry when a command returns conflict/exit 5.
${end}\n`;
}

/** Byte-identical to the pre-QCLI-227 constant, for callers (e.g. the bare
 * `quest instructions` command) that don't yet know about --target. */
export const questAgentInstructions = questAgentInstructionsFor("codex");

export type AgentInstructionCheck =
  | { readonly state: "missing" }
  | { readonly state: "current" }
  | { readonly state: "drift"; readonly message: string }
  | { readonly state: "orphaned"; readonly message: string };

function managedBlocks(content: string): readonly string[] {
  const blocks = content.match(
    /<!-- quest:agent-instructions:begin -->[\s\S]*?<!-- quest:agent-instructions:end -->/gu,
  );
  return blocks ?? [];
}

/** Checks the managed region without interpreting or normalizing user-authored text. */
export function checkQuestAgentInstructions(
  content: string | undefined,
  target: AgentInstructionTarget = "codex",
): AgentInstructionCheck {
  if (content === undefined) return { state: "missing" };
  const begins = content.split(begin).length - 1;
  const ends = content.split(end).length - 1;
  const blocks = managedBlocks(content);
  if (begins === 0 && ends === 0) return { state: "missing" };
  if (begins !== 1 || ends !== 1 || blocks.length !== 1) {
    return {
      state: "drift",
      message: "Quest agent instruction markers are malformed or duplicated.",
    };
  }
  if (`${blocks[0]}\n` !== questAgentInstructionsFor(target)) {
    return {
      state: "drift",
      message: `Quest agent instruction block differs from version ${QUEST_VERSION}.`,
    };
  }
  return { state: "current" };
}

/**
 * Adds or replaces exactly the Quest-owned block. Surrounding text is preserved
 * byte-for-byte; malformed existing markers are deliberately not overwritten.
 */
export function applyQuestAgentInstructions(
  content: string | undefined,
  target: AgentInstructionTarget = "codex",
): string {
  const expected = questAgentInstructionsFor(target);
  const check = checkQuestAgentInstructions(content, target);
  if (check.state === "current") return content ?? expected;
  if (check.state === "drift") {
    const blocks = managedBlocks(content ?? "");
    const [block] = blocks;
    if (blocks.length !== 1 || !block)
      throw new AgentInstructionError(check.message);
    return (content ?? "").replace(block, expected.trimEnd());
  }
  if (!content) return expected;
  return `${content}${content.endsWith("\n") ? "\n" : "\n\n"}${expected}`;
}

/** Writes the opt-in instruction file only when its managed block changes. */
export async function updateQuestAgentInstructions(
  port: AgentInstructionPort,
  path = codexInstructionPath,
  target: AgentInstructionTarget = "codex",
): Promise<AgentInstructionCheck> {
  const current = await port.read(path);
  const check = checkQuestAgentInstructions(current, target);
  if (check.state === "current") return check;
  await port.write(path, applyQuestAgentInstructions(current, target));
  return { state: "current" };
}

/** Reads the opt-in instruction file for a non-mutating drift check. */
export async function inspectQuestAgentInstructions(
  port: AgentInstructionPort,
  path = codexInstructionPath,
  target: AgentInstructionTarget = "codex",
): Promise<AgentInstructionCheck> {
  return checkQuestAgentInstructions(await port.read(path), target);
}

export const questSkillPath = ".claude/skills/quest/SKILL.md";

/** The bundled Quest skill, installed opt-in alongside the managed AGENTS.md
 * block. Entirely Quest-owned: unlike the managed block, the whole file is
 * either an exact match or drifted, never merged into surrounding content. */
export const questSkillContent = `---
name: quest
description: "Drive this repo's task tracker with the quest CLI instead of editing backlog/tracker state directly. Use whenever creating, listing, viewing, editing, completing, or archiving tasks, drafts, milestones, or decisions in a Quest-initialized workspace. Run \`quest instructions --list\` for the workflow guides and \`quest help [command]\` for full usage."
---

# quest — tracker CLI

This skill is a pointer, not a manual. The guidance ships inside the CLI, so it cannot
drift from the release you have installed:

- \`quest instructions --list\` — the workflow guides, one line each.
- \`quest instructions overview\` — start here.
- \`quest instructions\` — the versioned protocol block Quest manages in your instructions file (AGENTS.md or CLAUDE.md).
- \`quest help [command]\` — exact flags; \`quest manifest --json\` for the machine registry.

Drive tracker state through \`quest\`, never by editing \`.quest/\` by hand.
`;

/** Whole-file check: the skill is entirely Quest-owned, so any content other
 * than an exact match is drift, not something to merge. Under
 * skillSource "plugin", the skill ships from the opum-quest Claude Code
 * plugin instead of this repository: absence is the healthy state, and any
 * present file (byte-exact or not) is reported "orphaned" -- present when it
 * should not exist -- rather than "missing"/"current"/"drift". */
export function checkQuestSkillFile(
  content: string | undefined,
  skillSource: AgentSkillSource = "repo",
): AgentInstructionCheck {
  if (skillSource === "plugin") {
    if (content === undefined) return { state: "current" };
    return {
      state: "orphaned",
      message: `${questSkillPath} should not exist: this workspace's agents.skillSource is "plugin", so the quest skill ships from the opum-quest Claude Code plugin instead of this repository. Delete it, or run \`quest agents --force\` to remove it if it exactly matches the generated content.`,
    };
  }
  if (content === undefined) return { state: "missing" };
  if (content === questSkillContent) return { state: "current" };
  return {
    state: "drift",
    message: "Quest skill file differs from the bundled version.",
  };
}

/**
 * Writes the bundled skill file only when it differs from what is installed
 * (skillSource "repo"), or removes an orphaned one under skillSource
 * "plugin" -- but ONLY when force is given AND the on-disk bytes exactly
 * match what Quest itself would generate. A hand-edited or otherwise
 * differing file is never removed, force or not: it stays "orphaned" until
 * deleted by hand or restored to the exact generated bytes.
 */
export async function updateQuestSkillFile(
  port: AgentInstructionPort,
  path = questSkillPath,
  skillSource: AgentSkillSource = "repo",
  force = false,
): Promise<AgentInstructionCheck> {
  const current = await port.read(path);
  const check = checkQuestSkillFile(current, skillSource);
  if (skillSource === "plugin") {
    if (check.state === "orphaned" && force && current === questSkillContent) {
      await port.remove(path);
      return { state: "current" };
    }
    return check;
  }
  if (check.state === "current") return check;
  await port.write(path, questSkillContent);
  return { state: "current" };
}

/** Reads the installed skill file for a non-mutating drift check. */
export async function inspectQuestSkillFile(
  port: AgentInstructionPort,
  path = questSkillPath,
  skillSource: AgentSkillSource = "repo",
): Promise<AgentInstructionCheck> {
  return checkQuestSkillFile(await port.read(path), skillSource);
}
