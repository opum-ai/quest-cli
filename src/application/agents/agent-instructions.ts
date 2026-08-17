import {
  AgentInstructionError,
  type AgentInstructionPort,
} from "../../ports/agent-instructions.ts";

export { AgentInstructionError } from "../../ports/agent-instructions.ts";

export const codexInstructionPath = "AGENTS.md";

const begin = "<!-- quest:agent-instructions:begin -->";
const end = "<!-- quest:agent-instructions:end -->";

/** The small, versioned contract which agents may rely on after opt-in. */
export const questAgentInstructions = `${begin}
# Quest agent instructions

This project uses Quest CLI 0.2.1 for tracker operations. Run \`quest manifest --json\` to discover the supported command contract. Use \`quest instructions --json\` for the current versioned protocol. Quest writes require an explicit actor declaration; do not edit Quest-authored records directly.
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
      message: "Quest agent instruction block differs from version 0.2.1.",
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
