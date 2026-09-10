<!-- QUEST GUIDELINES START -->
<CRITICAL_INSTRUCTION>

## Quest Workflow

This project cut its tracker of record over from Backlog.md to Quest (`quest`,
`@opum-ai/quest` 0.3.1) on 2026-09-03 (`QCLI-160`/`QCLI-169`).

**For every user request in this project, run `quest instructions overview` before answering or taking action.**

Use the overview to decide whether to search, read, create, or update Quest tasks.

Before task lifecycle actions, read the matching detailed guide:
- `quest instructions task-creation` before creating or splitting tasks
- `quest instructions task-execution` before planning, changing status or assignee, adding a plan or implementation notes, or implementing task work
- `quest instructions task-finalization` before checking acceptance criteria, writing final summaries, or moving tasks to terminal statuses
- `quest instructions workspace` before workspace initialization or migration work

Use `quest help <command>` before running unfamiliar commands. Help shows options, fields, and examples.

Every write needs an explicit actor: `--actor <id> --actor-kind human`, or
`--actor-kind delegated-agent --accountable-human <id>` when the actor performing the
write is an agent rather than the human it is accountable to.

Do not edit `.quest/` task, draft, document, decision, or milestone JSON files directly.
Use the `quest` CLI so metadata, relationships, and history stay consistent. `.quest/` is
tracked in Git and must never be gitignored.

**`backlog/` no longer exists in this repository.** Every record it held (214 tasks,
0 excluded) has a counterpart in `.quest/tasks/`; it was removed as pure duplication
once the migration was verified, not archived elsewhere. Its full pre-removal content
is still in Git history — `git log -- backlog/` finds it, and the removal itself is a
single ordinary commit, revertible like any other. Do not recreate `backlog/` or a
`.backlog/` directory as a tracker; `quest` is the only tracker of record. Migration
renumbered Backlog's dotted subtask ids (e.g. `QCLI-97.11.1`) to flat Quest ids; the old
dotted spelling survives as a resolving alias (`quest task view QCLI-97.11.1` still
resolves), so a dotted id in older prose or commit messages is pre-cutover history, not
a broken reference. A Story's `<!-- lore:tasks -->` block rendering bare task ids
(`QCLI-1`) instead of hyperlinks into `backlog/` is expected post-cutover behavior —
already observed and reported to `lore-cli` — not local breakage.

- **Skill:** `.claude/skills/quest/SKILL.md` — how to drive quest.

</CRITICAL_INSTRUCTION>
<!-- QUEST GUIDELINES END -->

<!-- lore:agents:begin -->
This repo uses **lore** — an OKF-native documentation CLI — for the docs bundle under `docs/`.
When working on documentation, drive it through `lore` (not a plain editor) so Story <-> Task
coupling, managed blocks, and cross-links stay coherent.

- **Skill:** installed from the `opum-lore` Claude Code plugin, not this repository — how to drive lore.
- **Just-in-time detail:** run `lore instructions` for the canonical agent loop, then
  `lore instructions <topic>` (`linking`, `sync`, `check`, `validation`, `workspace`).
<!-- lore:agents:end -->

## Repository role

`quest-cli` is the Quest tracker CLI: the deterministic, LLM-free task record layer
(package `@opum-ai/quest`, binary `quest`). This repository owns the CLI's implementation,
component contracts, formats, Git/filesystem behavior, tests, migration, packaging,
releases, and local operations.

@~/.claude/opum-fleet-operating.md

<!-- quest:agent-instructions:begin -->
# Quest agent instructions

This project uses Quest CLI 0.6.0 for tracker operations. Run `quest manifest --json` to discover the supported command contract. Use `quest instructions --json` for the current versioned protocol. For Backlog tracker cutover, run `quest migration backlog preview --source <project> --json`, review its digest and mappings, then apply it with `quest migration backlog apply --source <project> --digest <digest> --actor <id> --actor-kind human --json`. Quest writes require an explicit actor declaration; do not edit Quest-authored records directly. CI should run `quest agents --check --require-installed --target claude`: current instructions exit 0, while missing, drifted, or malformed managed instructions exit 6. Quest does not retry write conflicts automatically; callers should read the latest task state and perform their own bounded retry when a command returns conflict/exit 5.
<!-- quest:agent-instructions:end -->
