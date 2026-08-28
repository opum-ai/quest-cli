import type { CommandManifestEntry } from "./command-contract.ts";

/** Human-facing help content for one manifest command, kept separate from
 * commandManifest so `quest manifest` stays byte-identical. */
export interface CommandHelpEntry {
  readonly summary: string;
  readonly usage: string;
  readonly flags: readonly string[];
}

const ACTOR_FLAGS = ["--actor", "--actor-kind", "--accountable-human"] as const;

export const commandHelp: Record<
  CommandManifestEntry["name"],
  CommandHelpEntry
> = {
  manifest: {
    summary: "Print the versioned public command registry.",
    usage: "quest manifest",
    flags: [],
  },
  version: {
    summary: "Print the installed Quest version.",
    usage: "quest --version",
    flags: [],
  },
  help: {
    summary: "Print this command reference, optionally scoped to one topic.",
    usage: "quest help [topic]",
    flags: [],
  },
  init: {
    summary:
      "Initialize a Quest workspace in the current Git worktree. On a real terminal with no flags, prompts for project name and whether to write CLAUDE.md/AGENTS.md instead of doing nothing.",
    usage: 'quest init [--name "My Project"] [--agent-instructions]',
    flags: ["--name", "--agent-instructions"],
  },
  instructions: {
    summary:
      "Print the managed agent-instructions block Quest maintains in CLAUDE.md/AGENTS.md.",
    usage: "quest instructions",
    flags: [],
  },
  agents: {
    summary: "Check or update the managed agent-instructions block.",
    usage: "quest agents --check [--require-installed] | --update-instructions",
    flags: ["--check", "--require-installed", "--update-instructions"],
  },
  completion: {
    summary: "Print a shell completion script.",
    usage: "quest completion bash",
    flags: [],
  },
  "migration backlog preview": {
    summary:
      "Preview a Backlog.md-to-Quest migration without writing anything.",
    usage:
      "quest migration backlog preview --source <project> [--backlog-dir <path>]",
    flags: ["--source", "--backlog-dir"],
  },
  "migration backlog apply": {
    summary: "Apply a previously previewed Backlog.md migration.",
    usage:
      "quest migration backlog apply --source <project> --digest <digest> --actor <name> --actor-kind human",
    flags: ["--source", "--digest", "--backlog-dir", ...ACTOR_FLAGS],
  },
  "migration backlog status": {
    summary: "Report the status of a Backlog.md migration by digest.",
    usage: "quest migration backlog status --digest <digest>",
    flags: ["--digest"],
  },
  "migration backlog rollback": {
    summary: "Roll back a previously applied Backlog.md migration.",
    usage:
      "quest migration backlog rollback --digest <digest> --actor <name> --actor-kind human",
    flags: ["--digest", ...ACTOR_FLAGS],
  },
  "task status-flow": {
    summary: "Print the configured task status set and terminal statuses.",
    usage: "quest task status-flow",
    flags: [],
  },
  "task binding": {
    summary:
      "Bind an agent to a task under the Opum workflow contract (flags, or a piped stdin request envelope).",
    usage:
      "quest task binding --contract <name> --task <id> --claim-or-correlation <id> --holder <id> --repository <id> --base <ref> --settlement <ref>",
    flags: [
      "--contract",
      "--task",
      "--claim-or-correlation",
      "--holder",
      "--repository",
      "--base",
      "--settlement",
    ],
  },
  "task list": {
    summary: "List tasks, optionally filtered by status or label.",
    usage: 'quest task list [--status "To Do"] [--label backend]',
    flags: ["--status", "--label"],
  },
  "task view": {
    summary: "View one task by id or alias.",
    usage: "quest task view <id>",
    flags: [],
  },
  search: {
    summary: "Search tasks by title and description.",
    usage: 'quest search "query"',
    flags: [],
  },
  "search --all": {
    summary: "Search tasks, milestones, and decisions together.",
    usage: 'quest search "query" --all',
    flags: ["--all"],
  },
  "task create": {
    summary: "Create a task.",
    usage:
      'quest task create "<title>" --actor <name> --actor-kind human [--priority High] [--type bug]',
    flags: [
      "--id",
      "--summary",
      "--description",
      "--label",
      "--doc",
      "--priority",
      "--type",
      "--ordinal",
      "--alias",
      "--acceptance-criteria",
      "--definition-of-done",
      "--plan",
      "--implementation-notes",
      "--comments",
      "--assignee",
      "--reference",
      "--modified-file",
      "--dependency",
      "--parent",
      "--milestone",
      "--final-summary",
      ...ACTOR_FLAGS,
    ],
  },
  "task edit": {
    summary: "Edit an existing task's fields, or append/remove list items.",
    usage:
      'quest task edit <id> --status "In Progress" --actor <name> --actor-kind human',
    flags: [
      "--status",
      "--summary",
      "--description",
      "--labels",
      "--add-label",
      "--remove-label",
      "--doc",
      "--plan",
      "--add-plan",
      "--remove-plan",
      "--notes",
      "--add-note",
      "--remove-note",
      "--comments",
      "--add-comment",
      "--remove-comment",
      "--acceptance-criteria",
      "--definition-of-done",
      "--add-dependency",
      "--remove-dependency",
      "--parent",
      "--clear-parent",
      "--milestone",
      "--clear-milestone",
      "--add-assignee",
      "--remove-assignee",
      "--add-reference",
      "--remove-reference",
      "--add-modified-file",
      "--remove-modified-file",
      ...ACTOR_FLAGS,
    ],
  },
  "task edit-batch": {
    summary: "Apply a batch of task edits from a JSONL operations file.",
    usage:
      "quest task edit-batch --file operations.jsonl --actor <name> --actor-kind human",
    flags: ["--file", ...ACTOR_FLAGS],
  },
  "task complete": {
    summary: "Move a task to its terminal complete status.",
    usage: "quest task complete <id> --actor <name> --actor-kind human",
    flags: [...ACTOR_FLAGS],
  },
  "task archive": {
    summary: "Archive a task.",
    usage: "quest task archive <id> --actor <name> --actor-kind human",
    flags: [...ACTOR_FLAGS],
  },
  "task demote": {
    summary: "Demote a task back to an earlier status.",
    usage: "quest task demote <id> --actor <name> --actor-kind human",
    flags: [...ACTOR_FLAGS],
  },
  "draft create": {
    summary: "Create a draft (a task idea not yet promoted into the tracker).",
    usage: 'quest draft create "<title>" --actor <name> --actor-kind human',
    flags: ["--id", "--description", "--label", "--doc", ...ACTOR_FLAGS],
  },
  "draft list": {
    summary: "List drafts.",
    usage: "quest draft list [--include-archived]",
    flags: ["--include-archived"],
  },
  "draft view": {
    summary: "View one draft by id.",
    usage: "quest draft view <id>",
    flags: [],
  },
  "draft promote": {
    summary: "Promote a draft into a task.",
    usage: "quest draft promote <id> --actor <name> --actor-kind human",
    flags: ["--task-id", ...ACTOR_FLAGS],
  },
  "draft archive": {
    summary: "Archive a draft.",
    usage: "quest draft archive <id> --actor <name> --actor-kind human",
    flags: [...ACTOR_FLAGS],
  },
  "milestone list": {
    summary: "List milestones.",
    usage: "quest milestone list",
    flags: [],
  },
  "milestone view": {
    summary: "View one milestone by id.",
    usage: "quest milestone view <id>",
    flags: [],
  },
  "milestone create": {
    summary: "Create a milestone.",
    usage:
      'quest milestone create "<title>" --actor <name> --actor-kind human [--task <id>]',
    flags: ["--id", "--status", "--description", "--task", ...ACTOR_FLAGS],
  },
  "milestone edit": {
    summary: "Edit a milestone's fields or its linked tasks.",
    usage:
      'quest milestone edit <id> --title "<title>" --actor <name> --actor-kind human',
    flags: [
      "--title",
      "--status",
      "--description",
      "--add-task",
      "--remove-task",
      "--replace-task",
      ...ACTOR_FLAGS,
    ],
  },
  "milestone delete": {
    summary: "Delete a milestone.",
    usage: "quest milestone delete <id> --actor <name> --actor-kind human",
    flags: [...ACTOR_FLAGS],
  },
  "decision list": {
    summary: "List decisions.",
    usage: "quest decision list",
    flags: [],
  },
  "decision view": {
    summary: "View one decision by id.",
    usage: "quest decision view <id>",
    flags: [],
  },
  "decision create": {
    summary: "Create a decision record.",
    usage:
      'quest decision create "<title>" --actor <name> --actor-kind human [--outcome "..."]',
    flags: [
      "--id",
      "--status",
      "--description",
      "--context",
      "--outcome",
      ...ACTOR_FLAGS,
    ],
  },
  "decision edit": {
    summary: "Edit a decision's fields.",
    usage:
      'quest decision edit <id> --outcome "..." --actor <name> --actor-kind human',
    flags: ["--title", "--status", "--context", "--outcome", ...ACTOR_FLAGS],
  },
  "decision delete": {
    summary: "Delete a decision.",
    usage: "quest decision delete <id> --actor <name> --actor-kind human",
    flags: [...ACTOR_FLAGS],
  },
  overview: {
    summary: "Print a project-wide task overview.",
    usage: "quest overview",
    flags: [],
  },
  board: {
    summary: "Print tasks grouped by status, like a kanban board.",
    usage: "quest board",
    flags: [],
  },
  doctor: {
    summary: "Check the workspace for consistency problems.",
    usage: "quest doctor",
    flags: [],
  },
  cleanup: {
    summary: "Archive or delete completed tasks past their retention window.",
    usage: "quest cleanup --confirm --actor <name> --actor-kind human",
    flags: ["--dry-run", "--confirm", ...ACTOR_FLAGS],
  },
  browser: {
    summary:
      "Start a local read-only web server showing the overview and board.",
    usage: "quest browser [--port 4173]",
    flags: ["--port"],
  },
};
