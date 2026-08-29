/**
 * The workflow guides `quest instructions <guide>` serves.
 *
 * These are the single home for Quest's agent-facing workflow guidance. The
 * bundled skill (`questSkillContent`) deliberately points here instead of
 * restating any of it: two copies of the same guidance drift, and the drift is
 * invisible because both look authoritative. A test asserts the two share no
 * substantive sentence.
 *
 * Loading is just-in-time by design, which is why there is no `all` guide:
 * bundling them defeats the point of splitting them, and `--list` already
 * covers discovery.
 */
export interface QuestGuide {
  readonly name: string;
  /** One line, shown by `--list`. */
  readonly summary: string;
  readonly content: string;
}

const overview = `# Quest overview

Quest is a deterministic, envelope-based tracker CLI: task, draft, milestone and
decision records, an explicit actor on every write, and machine-stable exit
codes. Reach for it rather than a raw editor on \`.quest/\` whenever you create,
read, edit or complete tracker state, so writes stay attributed and consistent.

## Before you act

1. Confirm the workspace is initialized: look for \`.quest/workspace.toml\`. If it
   is missing, see \`quest instructions workspace\`.
2. Search before you create, and read before you change. \`quest search "<query>"\`
   and \`quest task view <id> --json\` cost far less than a duplicate record.
3. Every write needs \`--actor <id> --actor-kind human\`, or \`delegated-agent\` with
   \`--accountable-human <id>\`.
4. Run \`quest doctor\` when the workspace looks inconsistent, rather than working
   around it by hand.

## Commands

- \`init\`                       Initialize a Quest workspace in the current Git worktree
- \`instructions\`                Print the managed agent-instructions block, a workflow guide, or \`--list\`
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
- \`cleanup\`                     Remove closed, unreferenced milestones and superseded decisions
- \`migration backlog preview/apply/status/rollback\`   Backlog.md-to-Quest migration lifecycle
- \`browser\`                     Start a local read-only web server showing the overview and board
- \`completion bash\`             Print a shell completion script

Exact flags for any of them: \`quest help <command>\`, or \`quest manifest --json\`
for the same registry without the prose.

## Machine contract

Every command supports \`--json\` (the \`{schemaVersion, kind, data, principal}\`
envelope) and \`--plain\` (human-readable, auto-selected off a TTY). Branch on the
semantic exit code, never on prose: \`0\` ok, \`2\` usage, \`3\` not_found, \`4\` denied,
\`5\` conflict, \`6\` validation or drift.

Quest never retries a write conflict for you. On exit \`5\`, re-read the latest
record and perform your own bounded retry rather than resubmitting a stale write.

## Other guides

\`quest instructions --list\` enumerates them. Read the one that matches what you
are about to do, not all of them.
`;

const taskCreation = `# Creating tasks

Create a task when the work needs planning, a decision, or a handoff note. If
you would not have to think about how to do it, just do it.

## Search first

\`quest search "<query>" --json\` covers task ids, titles, summaries, descriptions,
aliases and labels; add \`--all\` to include milestones and decisions. Reading one
likely match with \`quest task view <id> --json\` is cheaper than discovering the
duplicate later.

## Then scope it

Ask whether the work lands in one reviewable change. If it does not, create the
parent first and hang subtasks off it with \`--parent <id>\`; if the pieces belong
to different components, prefer separate tasks joined by \`--dependency <id>\`.
Dependencies are what \`quest task list --ready\` reads, so an honest edge here is
what lets the next agent pick work safely.

## Create it

\`\`\`
quest task create "<title>" --actor <id> --actor-kind human --json \\
  --description "<why this exists>" \\
  --acceptance-criteria '["<observable outcome>"]' \\
  --label <label> --dependency <id>
\`\`\`

Write acceptance criteria as outcomes someone else could verify without asking
you what you meant. An id is allocated for you; pass \`--id\` only to reserve a
specific one.

Use \`quest draft create\` instead when the idea is not yet committed work;
\`quest draft promote\` turns it into a task when it is.
`;

const taskExecution = `# Working a task

## Before you touch code

Read the task: \`quest task view <id> --json\`. Confirm it is eligible, its
dependencies are satisfied, and its scope still matches what was asked. Do not
trust an approach proposed when the task was filed; the code has moved since.

Claim it, then record the plan you actually intend to follow:

\`\`\`
quest task edit <id> --status "In Progress" --actor <id> --actor-kind human --json
quest task edit <id> --plan '["1. ...", "2. ..."]' --actor <id> --actor-kind human --json
\`\`\`

## While you work

Work in short loops: one focused slice, then the checks that prove it. Record
what a later reader would need and could not reconstruct from the diff — a
decision and its reason, a blocker, a validation result:

\`\`\`
quest task edit <id> --add-note "<what changed and why>" --actor <id> --actor-kind human --json
\`\`\`

Checkbox edits are index-addressed, so two editors do not overwrite each other:
\`--check-ac 2\`, \`--uncheck-dod 1\`, \`--remove-ac 3\`. Prefer them over replacing a
whole list.

## If the scope moves

Work you discover outside the acceptance criteria is a new task, not a silent
addition to this one. File it and say so.
`;

const taskFinalization = `# Finishing a task

## Verify before you check anything

Check an acceptance criterion only when you have evidence that proves it: a test
that fails without the change, command output, an observed result. Code being
present is not evidence, and neither is intent.

\`\`\`
quest task edit <id> --check-ac 1 --check-ac 2 --actor <id> --actor-kind human --json
\`\`\`

An acceptance criterion you cannot prove stays unchecked, and the reason belongs
in the notes. A criterion checked on faith is worse than one left open, because
it stops anyone else from looking.

## Then summarize and close

Record what someone deciding whether to trust this work would need: what
changed, why, and how it was verified.

\`\`\`
quest task edit <id> --add-note "<what changed, why, how it was verified>" \\
  --actor <id> --actor-kind human --json
quest task complete <id> --actor <id> --actor-kind human --json
\`\`\`

\`--final-summary\` is currently accepted only by \`task create\`, so on an existing
task the closing summary goes in a note.

\`quest task complete\` moves the record to its terminal status; \`quest task
archive\` retires it afterwards, and \`quest task demote\` walks it back if closing
turns out to be wrong. None of the three destroys a task: an archived task stays
readable, and nothing in Quest deletes tasks on its own. (\`quest cleanup\` is
unrelated to tasks — it removes closed, unreferenced milestones and superseded
decisions.)
`;

const workspace = `# Workspace setup

## Initializing

\`quest init\` requires an existing Git worktree; it does not create one. On a
real terminal with no flags it prompts for a project name, a task-id prefix, and
whether to write the managed instructions block. Pass \`--json\` or any flag to
skip the prompts and take scriptable defaults.

The result is \`.quest/workspace.toml\` plus the record directories. If a command
reports that the workspace is missing, run \`quest init\` rather than creating the
files by hand.

## Managed agent instructions

\`quest agents --update-instructions\` writes a small versioned block into
AGENTS.md and installs the Quest skill at \`.claude/skills/quest/SKILL.md\`. The
block is delimited and merged into surrounding content; the skill file is
Quest-owned in full, so any edit to it reads as drift.

\`quest agents --check\` exits 0 when the block is current and 6 when it is
missing, drifted or malformed. Add \`--require-installed\` and run it in CI to
catch a Quest upgrade that moved the contract out from under a consumer.

## Coming from Backlog.md

\`quest migration backlog preview --source <project> --json\` reports a digest and
the record mappings without writing. Review both, then pass the digest back to
\`quest migration backlog apply\`. \`status\` and \`rollback\` cover the rest of the
lifecycle.
`;

/** Ordered: `--list` prints them in this sequence. */
export const questGuides: readonly QuestGuide[] = [
  {
    name: "overview",
    summary: "What Quest is, the command set, and the machine contract",
    content: overview,
  },
  {
    name: "task-creation",
    summary: "How to search, scope, and create tasks",
    content: taskCreation,
  },
  {
    name: "task-execution",
    summary: "How to plan, record, and work through a task",
    content: taskExecution,
  },
  {
    name: "task-finalization",
    summary: "How to verify, summarize, and finish a task",
    content: taskFinalization,
  },
  {
    name: "workspace",
    summary: "Initializing a workspace, managed instructions, and migration",
    content: workspace,
  },
];

export function findQuestGuide(name: string): QuestGuide | undefined {
  return questGuides.find((guide) => guide.name === name);
}
