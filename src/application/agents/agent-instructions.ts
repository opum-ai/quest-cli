import {
  AgentInstructionError,
  type AgentInstructionPort,
} from "../../ports/agent-instructions.ts";
import { QUEST_VERSION } from "../version.ts";

export { AgentInstructionError } from "../../ports/agent-instructions.ts";

export const codexInstructionPath = "AGENTS.md";

const begin = "<!-- quest:agent-instructions:begin -->";
const end = "<!-- quest:agent-instructions:end -->";

/** The small, versioned contract which agents may rely on after opt-in. */
export const questAgentInstructions = `${begin}
# Quest agent instructions

This project uses Quest CLI ${QUEST_VERSION} for tracker operations. Run \`quest manifest --json\` to discover the supported command contract. Use \`quest instructions --json\` for the current versioned protocol. For Backlog tracker cutover, run \`quest migration backlog preview --source <project> --json\`, review its digest and mappings, then apply it with \`quest migration backlog apply --source <project> --digest <digest> --actor <id> --actor-kind human --json\`. Quest writes require an explicit actor declaration; do not edit Quest-authored records directly. CI should run \`quest agents --check --require-installed\`: current instructions exit 0, while missing, drifted, or malformed managed instructions exit 6. Quest does not retry write conflicts automatically; callers should read the latest task state and perform their own bounded retry when a command returns conflict/exit 5.
${end}\n`;

export type AgentInstructionCheck =
  | { readonly state: "missing" }
  | { readonly state: "current" }
  | { readonly state: "drift"; readonly message: string };

function managedBlocks(content: string): readonly string[] {
  const blocks = content.match(
    /<!-- quest:agent-instructions:begin -->[\s\S]*?<!-- quest:agent-instructions:end -->/gu,
  );
  return blocks ?? [];
}

/** Checks the managed region without interpreting or normalizing user-authored text. */
export function checkQuestAgentInstructions(
  content: string | undefined,
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
  if (`${blocks[0]}\n` !== questAgentInstructions) {
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
): string {
  const check = checkQuestAgentInstructions(content);
  if (check.state === "current") return content ?? questAgentInstructions;
  if (check.state === "drift") {
    const blocks = managedBlocks(content ?? "");
    const [block] = blocks;
    if (blocks.length !== 1 || !block)
      throw new AgentInstructionError(check.message);
    return (content ?? "").replace(block, questAgentInstructions.trimEnd());
  }
  if (!content) return questAgentInstructions;
  return `${content}${content.endsWith("\n") ? "\n" : "\n\n"}${questAgentInstructions}`;
}

/** Writes the opt-in instruction file only when its managed block changes. */
export async function updateQuestAgentInstructions(
  port: AgentInstructionPort,
  path = codexInstructionPath,
): Promise<AgentInstructionCheck> {
  const current = await port.read(path);
  const check = checkQuestAgentInstructions(current);
  if (check.state === "current") return check;
  await port.write(path, applyQuestAgentInstructions(current));
  return { state: "current" };
}

/** Reads the opt-in instruction file for a non-mutating drift check. */
export async function inspectQuestAgentInstructions(
  port: AgentInstructionPort,
  path = codexInstructionPath,
): Promise<AgentInstructionCheck> {
  return checkQuestAgentInstructions(await port.read(path));
}

export const questSkillPath = ".claude/skills/quest/SKILL.md";

/** The bundled Quest skill, installed opt-in alongside the CLAUDE.md/AGENTS.md
 * block. Entirely Quest-owned: unlike the managed block, the whole file is
 * either an exact match or drifted, never merged into surrounding content. */
export const questSkillContent = `---
name: quest
description: "Drive this repo's task tracker with the quest CLI instead of editing backlog/tracker state directly. Use whenever creating, listing, viewing, editing, completing, or archiving tasks, drafts, milestones, or decisions in a Quest-initialized workspace. Run \`quest instructions --list\` for the workflow guides and \`quest help [command]\` for full usage."
---

# quest — tracker CLI

\`quest\` is a deterministic, envelope-based tracker CLI. This skill is a pointer, not a
manual: the guidance lives in the CLI so it cannot drift from the release you have installed.

- \`quest instructions --list\` — the workflow guides, with a one-line purpose each. Read the
  one that matches what you are about to do.
- \`quest instructions overview\` — start here if you have not used Quest in this workspace.
- \`quest instructions\` — the versioned agent protocol block Quest manages in CLAUDE.md and
  AGENTS.md.
- \`quest help [command]\` — exact flags. \`quest manifest --json\` is the same registry
  without the prose.

Use \`quest\` rather than editing \`.quest/\` by hand, so every write carries an actor.
`;

/** Whole-file check: the skill is entirely Quest-owned, so any content other
 * than an exact match is drift, not something to merge. */
export function checkQuestSkillFile(
  content: string | undefined,
): AgentInstructionCheck {
  if (content === undefined) return { state: "missing" };
  if (content === questSkillContent) return { state: "current" };
  return {
    state: "drift",
    message: "Quest skill file differs from the bundled version.",
  };
}

/** Writes the bundled skill file only when it differs from what is installed. */
export async function updateQuestSkillFile(
  port: AgentInstructionPort,
  path = questSkillPath,
): Promise<AgentInstructionCheck> {
  const current = await port.read(path);
  const check = checkQuestSkillFile(current);
  if (check.state === "current") return check;
  await port.write(path, questSkillContent);
  return { state: "current" };
}

/** Reads the installed skill file for a non-mutating drift check. */
export async function inspectQuestSkillFile(
  port: AgentInstructionPort,
  path = questSkillPath,
): Promise<AgentInstructionCheck> {
  return checkQuestSkillFile(await port.read(path));
}
