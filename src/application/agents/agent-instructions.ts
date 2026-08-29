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
description: "Drive this repo's task tracker with the quest CLI instead of editing backlog/tracker state directly. Use whenever creating, listing, viewing, editing, completing, or archiving tasks, drafts, milestones, or decisions in a Quest-initialized workspace. Run \`quest instructions\` for the versioned agent protocol and \`quest help [command]\` for full usage."
---

# quest — tracker CLI

\`quest\` is a deterministic, envelope-based tracker CLI: task/draft/milestone/decision CRUD, an
explicit actor requirement on every write, and machine-stable exit codes. This skill is a thin
pointer — **\`quest instructions\` is the source of truth for the versioned agent protocol**, and
**\`quest help [command]\`** is the source of truth for exact flags.

## When to use it

Reach for \`quest\` — not a raw editor on \`.quest/\` — whenever you create, read, edit, or complete
tracker state in a Quest-initialized workspace, so writes stay actor-attributed and consistent.
Run \`quest doctor\` if something in the workspace looks inconsistent before working around it by hand.

## Start here

1. Confirm the workspace is initialized: look for \`.quest/workspace.toml\`. If it is missing, run
   \`quest init\` — on a real terminal with no flags it prompts for a project name and whether to
   write this managed instructions block; pass \`--json\` or any flag to skip straight to the
   default, scriptable behavior.
2. Run \`quest instructions --json\` once per session for the current actor/exit-code/conflict-retry
   protocol — it is short and versioned to the installed release.
3. Run \`quest help\` for full human-readable usage, or \`quest help <command>\` to scope it (for
   example \`quest help task\`). \`quest manifest --json\` is the same command registry without the
   prose, for scripting.
4. Every write requires an explicit actor: append \`--actor <id> --actor-kind human\` (or
   \`delegated-agent\` with \`--accountable-human <id>\`). Quest never edits Quest-authored records
   without one.

## Commands

- \`init\`                       Initialize a Quest workspace in the current Git worktree
- \`instructions\`                Print the managed agent-instructions block Quest maintains in CLAUDE.md/AGENTS.md
- \`agents\`                      Check or update the managed agent-instructions block
- \`help\` / \`manifest\`           Human-readable help, or the machine command registry
- \`task list\` / \`task view\`     List or view tasks
- \`task create\` / \`task edit\`   Create or edit a task
- \`task edit-batch\`             Apply a batch of task edits from a JSONL operations file
- \`task complete\` / \`archive\` / \`demote\`   Move a task through its terminal or prior status
- \`task status-flow\`            Print the configured task status set and terminal statuses
- \`task binding\`                Bind an agent to a task under the Opum workflow contract
- \`draft create/list/view/promote/archive\`   Draft lifecycle (an idea not yet promoted to a task)
- \`milestone list/view/create/edit/archive/delete\`   Milestone lifecycle
- \`decision list/view/create/edit/delete\`    Decision-record lifecycle
- \`search [--all]\`              Search tasks, or tasks + milestones + decisions together
- \`overview\` / \`board\` / \`doctor\`   Project overview, kanban-style board, or consistency check
- \`cleanup\`                     Archive or delete completed tasks past their retention window
- \`migration backlog preview/apply/status/rollback\`   Backlog.md-to-Quest migration lifecycle
- \`browser\`                     Start a local read-only web server showing the overview and board
- \`completion bash\`             Print a shell completion script

Full flags for every command: \`quest help <command>\` (or \`quest manifest --json\` for the raw
registry, which also carries writable/mutation metadata per command).

## Machine contract

Every command supports \`--json\` (the \`{schemaVersion, kind, data, principal}\` envelope) and
\`--plain\` (human-readable, auto-selected off a TTY). Branch on the semantic exit code, never on
prose: \`0\` ok · \`2\` usage · \`3\` not_found · \`4\` denied · \`5\` conflict · \`6\` validation/drift.

Quest does not retry write conflicts automatically. On exit \`5\`, re-read the latest task state and
perform your own bounded retry rather than resubmitting the same stale write.
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
