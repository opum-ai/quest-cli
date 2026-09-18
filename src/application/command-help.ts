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
      'Initialize a Quest workspace in the current Git worktree. On a real terminal with no flags, prompts for project name, task ID prefix, then a multi-select listing supported instruction files (CLAUDE.md for Claude Code, AGENTS.md for Codex/OpenCode/pi/etc., GEMINI.md for Google Antigravity/Gemini CLI) -- tick zero, one, or more; nothing is pre-checked. --target claude/codex/antigravity writes exactly one non-interactively (requires --agent-instructions; the default target for a scripted --agent-instructions with no --target remains AGENTS.md, unchanged, so existing callers are unaffected -- only the interactive prompt changed). --skill-source takes "repo" (the default, unset: generate .claude/skills/quest/SKILL.md into this repository), "plugin" (the skill ships from the opum-quest Claude Code plugin instead), or "none" (this workspace generates no quest skill file and none ships from anywhere -- the value for a workspace that does not use Claude Code at all, so a Codex-only or Antigravity-only consumer need not declare "plugin", which would assert a plugin they do not have). "plugin" and "none" behave identically on every file operation and differ only in what they assert; given on the SAME call as --agent-instructions, either also skips writing the skill file this time ("explicit beats config" holds only against a persisted skillSource from an earlier call, not against an explicit --skill-source given in the same breath). Refuses if already initialized -- use `quest init --reconfigure` on an existing workspace instead of deleting .quest/ and starting over. --reconfigure accepts --name, --task-id-prefix and --skill-source, in any combination and at least one of the three; it persists --skill-source exactly as a first init does, which is how an already-initialized workspace opts out of the skill file after the fact.',
    usage:
      'quest init [--name "My Project"] [--task-id-prefix ABC] [--agent-instructions [--target claude|codex|antigravity]] [--skill-source repo|plugin|none] | quest init --reconfigure [--name ...] [--task-id-prefix ...] [--skill-source repo|plugin|none]',
    flags: [
      "--name",
      "--task-id-prefix",
      "--agent-instructions",
      "--target",
      "--skill-source",
    ],
  },
  "init --reconfigure": {
    summary:
      'Change the declared name, task ID prefix, and/or skill source on an existing workspace without deleting .quest/. The supported alternative to `rm -rf .quest && quest init`, which discards every task record --.quest/ is not always tracked in git. Fields not given keep their current value. --skill-source takes the same repo|plugin|none values a first init does and persists them the same way, so this is how an existing workspace opts out of .claude/skills/quest/SKILL.md after the fact ("none" for a workspace with no Claude Code at all; "plugin" only when the opum-quest Claude Code plugin really does ship the skill).',
    usage:
      'quest init --reconfigure [--name "My Project"] [--task-id-prefix ABC] [--skill-source repo|plugin|none]',
    flags: ["--name", "--task-id-prefix", "--skill-source", "--reconfigure"],
  },
  // The human-facing entry stays whole: `--list` is a flag of `quest
  // instructions`, and splitting it out would make `quest help instructions`
  // stop mentioning it. The two entries below exist so a MACHINE reading the
  // registry can find the envelope kind for each form (QCLI-151); they are not
  // separate commands.
  instructions: {
    summary:
      "Print the managed agent-instructions block (written to AGENTS.md by default, or CLAUDE.md/GEMINI.md via `quest agents --update-instructions --target claude|antigravity`), one workflow guide, or the guide index.",
    usage: "quest instructions [<guide>] [--list]",
    flags: ["--list"],
  },
  "instructions --list": {
    summary: "List the workflow guides with a one-line purpose each.",
    usage: "quest instructions --list",
    flags: ["--list"],
  },
  "instructions <guide>": {
    summary: "Print one workflow guide.",
    usage: "quest instructions <guide>",
    flags: [],
  },
  agents: {
    summary:
      'Check or update the managed agent-instructions block and the quest Claude Code skill. --target selects which file the instructions block targets: codex (AGENTS.md, the default when --target is omitted), claude (CLAUDE.md), or antigravity (GEMINI.md). A --check call must pass the same --target the block was written with -- it checks exactly one file per invocation, never more than one. The skill file (.claude/skills/quest/SKILL.md) is separate: when this workspace\'s agents.skill_source is "plugin" or "none" (set via `quest init --skill-source ...`, on a first init or a --reconfigure), it is neither written nor proposed -- a leftover reports as drift, and --force removes it only when its bytes exactly match what Quest would generate; a hand-edited file is never removed. "none" is the value for a workspace with no Claude Code at all: it behaves exactly as "plugin" does here, and says only that no skill file is generated, never that a plugin provides one. A block that differs from the installed CLI only in its one embedded version number reports "version-only" and does not fail --check (a routine patch/minor bump alone is not drift); any other difference, including a version bump paired with real content change, still reports drift and fails. --update-instructions always refreshes to the exact current bytes regardless, so the file never falls permanently behind. A leftover Backlog.md installer block (its own BACKLOG.MD GUIDELINES START/END markers) is a real contradiction, not silently ignored: --check reports drift even when the Quest block is otherwise exact, and --update-instructions removes it -- bounded to exactly that delimited block, touching nothing else.',
    usage:
      "quest agents --check [--require-installed] [--target claude|codex|antigravity] | --update-instructions [--target claude|codex|antigravity] [--force]",
    flags: [
      "--check",
      "--require-installed",
      "--update-instructions",
      "--target",
      "--force",
    ],
  },
  completion: {
    summary: "Print a shell completion script.",
    usage: "quest completion bash",
    flags: [],
  },
  "migration backlog preview": {
    summary:
      "Preview a Backlog.md-to-Quest migration without writing anything. " +
      "--preserve-source-ids keeps each record's own Backlog id instead of " +
      "renumbering positionally: it requires --source-family to select one " +
      "id family from the source (a backlog holding more than one, e.g. " +
      "LCLI and LORE, imports one family per run). A dotted subtask id " +
      "(ODOC-63.2) has no equivalent in Quest's flat canonical id, so it is " +
      "translated -- a fresh flat id in the family, its dotted spelling kept " +
      "as an alias, its parent threaded through -- rather than preserved " +
      "verbatim; the run refuses on an id collision or an unresolvable " +
      "parent, reporting every one in a single report. The output's " +
      "`renumbered` field (preservation mode only) isolates exactly the " +
      "mappings a translation actually changed, so a caller does not have " +
      "to diff the full `mappings` list by hand to find what is about to " +
      "change; `mappings` itself is unchanged, additive only.",
    usage:
      "quest migration backlog preview --source <project> [--backlog-dir <path>] [--preserve-source-ids --source-family <PREFIX>]",
    flags: [
      "--source",
      "--backlog-dir",
      "--preserve-source-ids",
      "--source-family",
    ],
  },
  "migration backlog apply": {
    summary:
      "Apply a previously previewed Backlog.md migration. Re-supply " +
      "--preserve-source-ids/--source-family exactly as given to preview.",
    usage:
      "quest migration backlog apply --source <project> --digest <digest> --actor <name> --actor-kind human [--backlog-dir <path>] [--preserve-source-ids --source-family <PREFIX>]",
    flags: [
      "--source",
      "--digest",
      "--backlog-dir",
      "--preserve-source-ids",
      "--source-family",
      ...ACTOR_FLAGS,
    ],
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
    summary:
      "Print the configured task status set, terminal statuses, and the paused status (if the workspace has one configured) reached only via `task pause`/`task start`.",
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
    summary:
      "List tasks, optionally filtered by status, label, readiness, assignee, milestone, parent, priority, type, unresolved-at-completion, or a search term. Completed tasks are included by default like any other status (QCLI-165); archived tasks need --include-archived. --unresolved-at-completion (QCLI-336) selects only tasks that completed with acceptance criteria or definition-of-done items still unchecked -- the persisted counterpart of the `unresolvedAtCompletion` field `task complete` adds to its own response (QCLI-252) -- so a sweep for 'what did we knowingly ship with open items' does not require reading every completed record by hand. SCOPE (QCLI-316): this reads the CHECKED-OUT ref's .quest/ and nothing else, so a result -- and an EMPTY result especially -- is a claim about that branch, not about the repository. A task filed on an unmerged branch is invisible here, which is exactly the task most likely to be forgotten. Every listing carries a `scope` field naming the branch it answered about; when the result is empty, scope also reports `unseenTaskIds`, the ids that exist on some other ref and not on this one (filenames only, one tree listing per ref, no record is read and no status is merged across refs). An empty list with an empty `unseenTaskIds` is load-bearing; an empty list naming ids is the check not having run on them. Before reporting that nothing is open, read `scope`, and cross-check an independent source such as `gh pr list`.",
    usage:
      'quest task list [--status "To Do"] [--exclude-status "Done"] [--label backend] [--ready] [--assignee person-1 | --unassigned] [--milestone M-1] [--parent T-1] [--priority high] [--type feature] [--unresolved-at-completion] [--search text] [--sort id[:asc|desc]] [--limit 20] [--include-archived]',
    flags: [
      "--status",
      "--exclude-status",
      "--label",
      "--ready",
      "--assignee",
      "--unassigned",
      "--milestone",
      "--parent",
      "--priority",
      "--type",
      "--unresolved-at-completion",
      "--search",
      "--sort",
      "--limit",
      "--include-archived",
    ],
  },
  "task view": {
    summary:
      "View one task by id or alias. The result carries a `revision` field " +
      "(QCLI-277) a caller can capture and later supply back as `task edit " +
      "--if-revision <revision>`'s precondition. --max-notes N caps " +
      "implementationNotes to the most recent N entries and adds a " +
      "notesOmitted count; omitted, the read is the full unbounded record, " +
      "unchanged. A task completed with acceptance criteria or " +
      "definition-of-done items still unchecked carries an " +
      "`unresolvedAtCompletion` field (QCLI-336) naming them, set once at " +
      "completion and never recomputed by a later edit; absent on any task " +
      "not completed that way.",
    usage: "quest task view <id> [--max-notes N]",
    flags: ["--max-notes"],
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
    summary:
      "Edit an existing task's fields, or append/remove list items. " +
      "Checklist positions are 1-based and reader-facing: --check-ac/--uncheck-ac/--remove-ac " +
      "and the --*-dod equivalents address an item by the `position` field `quest task view` " +
      "(and every other checklist-bearing command) prints on each acceptanceCriteria/" +
      "definitionOfDone entry -- pass that number back verbatim, no arithmetic required. Each " +
      "entry also keeps its 0-based `index` for programmatic addressing (position is always " +
      "index + 1); `index` is not what these flags take. Removing an item renumbers everything " +
      "after it, in both forms: re-read the task before addressing what you think is 'the next' " +
      "item rather than trusting a position computed before the removal. " +
      "--acceptance-criteria/--definition-of-done REPLACE the whole list, and take a JSON array " +
      "whose entries may be bare strings or " +
      '{"index":<0-based>,"text":"<string>","checked":<boolean>} objects (QCLI-313). Only the ' +
      "object form carries checked state, so it is the one to use when amending an entry on a " +
      "list that has anything ticked -- a bare string says nothing about the box and the edit " +
      "is refused with an exit-6 validation error naming this shape, rather than clearing it " +
      'silently as it did before. Pass the object form with "checked": false to reset a box ' +
      "deliberately. For a one-entry change prefer --check-ac/--uncheck-ac/--remove-ac, which " +
      "need no restatement of the list at all. " +
      "--comments/--add-comment take a JSON array of structured objects, not free text: each " +
      'entry needs {"id":"<string>","authorId":"<string>","body":"<string>","createdAt":"<ISO-8601 string>"}. ' +
      "--if-revision <revision> (QCLI-277) is an optional precondition: capture `revision` from an " +
      "earlier `task view --json`, and the edit is refused with an exit-5 conflict -- naming the " +
      "record's actual current revision -- if the record has moved since, instead of silently " +
      "applying over a change the caller never saw. Omitted, behavior is unchanged. " +
      "REMOVAL IS ONE VOCABULARY ADDRESSED TWO WAYS, and every removal fails loud on a miss " +
      "(QCLI-297). BY POSITION: --remove-ac/--check-ac/--uncheck-ac and the --*-dod equivalents " +
      "take a 1-based position; a position outside the list is an exit-6 validation error. " +
      "BY VALUE: --remove-label, --remove-plan, --remove-note, --remove-reference, " +
      "--remove-modified-file, --remove-assignee and --remove-dependency match the stored " +
      "entry's text EXACTLY -- including leading and trailing whitespace, and with no case " +
      "folding or trimming -- while --remove-comment matches a comment's `id`. A value matching " +
      "nothing is an exit-6 validation error naming the task id and echoing the value " +
      "JSON-delimited (so a miss caused by a trailing space or a tab is visible), and NOTHING is " +
      "removed -- not even the values in the same flag that did match. Every unmatched value in " +
      "one flag is reported together rather than one per round trip. This is deliberately not a " +
      "remove-if-present: a caller who wants that should read the record first and skip the " +
      "edit, which is also the only way to be sure the value it read is the one it removed.",
    usage:
      'quest task edit <id> --status "In Progress" --actor <name> --actor-kind human',
    flags: [
      "--status",
      "--title",
      "--priority",
      "--type",
      "--ordinal",
      "--summary",
      "--description",
      "--final-summary",
      "--clear-final-summary",
      "--append-final-summary",
      "--labels",
      "--add-label",
      "--remove-label",
      "--doc",
      "--plan",
      "--add-plan",
      "--remove-plan",
      "--notes",
      "--implementation-notes",
      "--add-note",
      "--remove-note",
      "--comments",
      "--add-comment",
      "--remove-comment",
      "--acceptance-criteria",
      "--definition-of-done",
      "--check-ac",
      "--uncheck-ac",
      "--remove-ac",
      "--clear-ac",
      "--check-dod",
      "--uncheck-dod",
      "--remove-dod",
      "--clear-dod",
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
      "--if-revision",
      ...ACTOR_FLAGS,
    ],
  },
  "task edit-batch": {
    summary:
      "Apply a batch of task edits from a JSONL operations file: one JSON object per line, " +
      'each {"reference":"<id-or-alias>","operationId":"<caller-chosen label>","patch":{...}} -- ' +
      "`patch` takes the same field vocabulary as `quest task edit`'s flags (e.g. " +
      '{"status":"In Progress"} or {"addLabels":["urgent"]}), by field name rather than flag ' +
      "spelling. `operationId` is optional (defaults to a positional label) but must be unique " +
      "within the file; each line's result reports success or a per-item error against it, so one " +
      "bad line never blocks the rest of the batch. Each item also takes an optional top-level " +
      '"ifRevision":"<revision>" (QCLI-277), the per-item counterpart of `task edit --if-revision`: ' +
      "a mismatch fails only that item (a per-item error, same as an unresolvable reference), " +
      "checked against the revision the whole batch is running against.",
    usage:
      "quest task edit-batch --file operations.jsonl --actor <name> --actor-kind human",
    flags: ["--file", ...ACTOR_FLAGS],
  },
  "task complete": {
    summary:
      "Move a task to its terminal complete status. Unchecked acceptance criteria and definition-of-done items do NOT block completion -- an honestly-unchecked item is advisory, not an error (QCLI-252) -- but completing with any left unchecked prints a stderr warning naming them and adds an `unresolvedAtCompletion` field to the JSON result, so the gap is reported rather than silent. That field is also PERSISTED on the record itself (QCLI-336), not just this one response -- `quest task view`/`task list --json` surface it afterward, and `task list --unresolved-at-completion` finds every completed task still carrying one, so the gap survives past this command's own output. --final-summary is optional and applies a plain replacement to the record as part of the same write (QCLI-270), so a final summary can be recorded and the task completed in one command instead of `task edit --final-summary` followed by `task complete`; `--clear-final-summary`/`--append-final-summary` stay edit-only.",
    usage:
      'quest task complete <id> [--final-summary "text"] --actor <name> --actor-kind human',
    flags: ["--final-summary", ...ACTOR_FLAGS],
  },
  "task archive": {
    summary:
      "Retire a task, preserving its record. This is the only way to remove a task from active listings: there is deliberately no `task delete`, unlike milestone and decision which carry both (DEC-8, QCLI-164). A task record is audit-significant in a way those two are not -- every write demands an explicit actor, and the record carries history, gateEvents and comments -- so it is retired rather than destroyed. A throwaway probe task is archived like any other; that cost is accepted rather than solved with a destructive verb. Deleting would not deliver clean removal in any case, since .quest/ is committed to Git and the record stays recoverable from history.",
    usage: "quest task archive <id> --actor <name> --actor-kind human",
    flags: [...ACTOR_FLAGS],
  },
  "task pause": {
    summary:
      'Pause an In Progress task to the configured paused status ("Paused" by default), recording that work was started rather than resetting it. The only way in; `task edit --status` cannot reach the paused status. Disabled if the workspace has no paused status configured.',
    usage: "quest task pause <id> --actor <name> --actor-kind human",
    flags: [...ACTOR_FLAGS],
  },
  "task start": {
    summary:
      'Move a task to In Progress from either To Do or the paused status. The only way out of the paused status -- including the retired pre-0.7.0 default "Blocked" on a record parked before the rename, when the workspace does not configure that literal itself (QCLI-302); nothing is migrated silently, and `quest doctor` names such records.',
    usage: "quest task start <id> --actor <name> --actor-kind human",
    flags: [...ACTOR_FLAGS],
  },
  "task demote": {
    summary:
      "Demote a task to an explicit earlier status (--to is required; omitting it is a usage error and nothing mutates). Also reaches back from Done/archived into an active status. Never reaches the paused status -- use `task start` to leave it.",
    usage:
      'quest task demote <id> --to "<status>" --actor <name> --actor-kind human',
    flags: ["--to", ...ACTOR_FLAGS],
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
    summary: "List milestones, excluding archived ones by default.",
    usage: "quest milestone list [--include-archived]",
    flags: ["--include-archived"],
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
    summary:
      "Edit a milestone's fields or its linked tasks. " +
      "--add-task/--remove-task adjust the current membership; --replace-task states it " +
      "outright and cannot be combined with either. --remove-task matches a linked task id " +
      "EXACTLY, the same rule `task edit`'s by-value removals follow: an id matching nothing " +
      "is an exit-6 validation error naming the milestone id and echoing the value " +
      "JSON-delimited, and nothing is removed (QCLI-297). It is not a remove-if-present.",
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
    summary: "Delete a milestone, destroying its record.",
    usage: "quest milestone delete <id> --actor <name> --actor-kind human",
    flags: [...ACTOR_FLAGS],
  },
  "milestone archive": {
    summary:
      "Retire a milestone, preserving its record and its task references.",
    usage: "quest milestone archive <id> --actor <name> --actor-kind human",
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
    summary:
      "Print a project-wide task overview. Task counts span every retention location -- .quest/tasks/, completed/ and archive/tasks/ -- so completing a task moves a count rather than removing the record from it; byLocation names how the total divides. Milestone counts report archived alongside open and closed: a retired milestone is neither open nor closed work, and is counted separately rather than silently dropped.",
    usage: "quest overview",
    flags: [],
  },
  board: {
    summary: "Print tasks grouped by status, like a kanban board.",
    usage: "quest board",
    flags: [],
  },
  "board export": {
    summary:
      "Write the board to a Markdown file, for pasting into a pull request or doc.",
    usage: "quest board export <file> [--force]",
    flags: ["--force"],
  },
  doctor: {
    summary:
      'Check the workspace for consistency problems: milestone references to unknown tasks, and active tasks parked at a status on neither the configured ladder nor the paused slot (for example the retired pre-0.7.0 paused literal "Blocked"), each with the command that repairs it.',
    usage: "quest doctor",
    flags: [],
  },
  cleanup: {
    summary: "Remove closed, unreferenced milestones and superseded decisions.",
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
