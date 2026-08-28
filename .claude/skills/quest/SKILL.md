---
name: quest
description: "Drive this repo's task tracker with the quest CLI instead of editing backlog/tracker state directly. Use whenever creating, listing, viewing, editing, completing, or archiving tasks, drafts, milestones, or decisions in a Quest-initialized workspace. Run `quest instructions` for the versioned agent protocol and `quest help [command]` for full usage."
---

# quest — tracker CLI

`quest` is a deterministic, envelope-based tracker CLI: task/draft/milestone/decision CRUD, an
explicit actor requirement on every write, and machine-stable exit codes. This skill is a thin
pointer — **`quest instructions` is the source of truth for the versioned agent protocol**, and
**`quest help [command]`** is the source of truth for exact flags.

## When to use it

Reach for `quest` — not a raw editor on `.quest/` — whenever you create, read, edit, or complete
tracker state in a Quest-initialized workspace, so writes stay actor-attributed and consistent.
Run `quest doctor` if something in the workspace looks inconsistent before working around it by hand.

## Start here

1. Confirm the workspace is initialized: look for `.quest/workspace.toml`. If it is missing, run
   `quest init` — on a real terminal with no flags it prompts for a project name and whether to
   write this managed instructions block; pass `--json` or any flag to skip straight to the
   default, scriptable behavior.
2. Run `quest instructions --json` once per session for the current actor/exit-code/conflict-retry
   protocol — it is short and versioned to the installed release.
3. Run `quest help` for full human-readable usage, or `quest help <command>` to scope it (for
   example `quest help task`). `quest manifest --json` is the same command registry without the
   prose, for scripting.
4. Every write requires an explicit actor: append `--actor <id> --actor-kind human` (or
   `delegated-agent` with `--accountable-human <id>`). Quest never edits Quest-authored records
   without one.

## Commands

- `init`                       Initialize a Quest workspace in the current Git worktree
- `instructions`                Print the managed agent-instructions block Quest maintains in CLAUDE.md/AGENTS.md
- `agents`                      Check or update the managed agent-instructions block
- `help` / `manifest`           Human-readable help, or the machine command registry
- `task list` / `task view`     List or view tasks
- `task create` / `task edit`   Create or edit a task
- `task edit-batch`             Apply a batch of task edits from a JSONL operations file
- `task complete` / `archive` / `demote`   Move a task through its terminal or prior status
- `task status-flow`            Print the configured task status set and terminal statuses
- `task binding`                Bind an agent to a task under the Opum workflow contract
- `draft create/list/view/promote/archive`   Draft lifecycle (an idea not yet promoted to a task)
- `milestone list/view/create/edit/delete`   Milestone lifecycle
- `decision list/view/create/edit/delete`    Decision-record lifecycle
- `search [--all]`              Search tasks, or tasks + milestones + decisions together
- `overview` / `board` / `doctor`   Project overview, kanban-style board, or consistency check
- `cleanup`                     Archive or delete completed tasks past their retention window
- `migration backlog preview/apply/status/rollback`   Backlog.md-to-Quest migration lifecycle
- `browser`                     Start a local read-only web server showing the overview and board
- `completion bash`             Print a shell completion script

Full flags for every command: `quest help <command>` (or `quest manifest --json` for the raw
registry, which also carries writable/mutation metadata per command).

## Machine contract

Every command supports `--json` (the `{schemaVersion, kind, data, principal}` envelope) and
`--plain` (human-readable, auto-selected off a TTY). Branch on the semantic exit code, never on
prose: `0` ok · `2` usage · `3` not_found · `4` denied · `5` conflict · `6` validation/drift.

Quest does not retry write conflicts automatically. On exit `5`, re-read the latest task state and
perform your own bounded retry rather than resubmitting the same stale write.
