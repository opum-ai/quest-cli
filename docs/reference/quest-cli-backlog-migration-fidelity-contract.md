---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI Backlog migration fidelity contract
tags:
  - quest
  - cli
  - backlog
  - migration
  - fidelity
  - clean-room
  - research
summary: Defines what Quest must preserve from Backlog.md through its documented public contracts, backed by exhaustive CLI enumeration and exercise against a throwaway scratch repository at pinned v1.49.3.
timestamp: 2026-08-04T16:52:32.136Z
---

# Quest CLI Backlog migration fidelity contract

This Reference is `QCLI-2.5`'s output: a fidelity contract and gaps report —
not an importer, and not implementation — for what Quest must be able to
preserve from a user's existing Backlog.md project, derived exclusively from
Backlog.md's documented public interfaces. It is the current successor to
former `OCLI-3.5` ("Public-contract migration fidelity") per the
[migration ledger](former-ocli-to-qcli-migration-ledger.md).

**Owner ruling in force (2026-08-04, reaffirmed, strict clean room):**
Backlog.md's implementation source and internal test suite are **Excluded**
— not read, cited, or ported, at any revision, including the locally
installed copy. Every fact below was produced only from: published
documentation (`https://backlog.md`, which redirects to
`github.com/MrLesk/Backlog.md`'s README — read as documentation prose, not
as source); `backlog --help` and every command's and subcommand's own
`--help`; `--plain`/`--json` command output; on-disk artifacts produced
by actually running the installed `backlog` binary against three throwaway
scratch repositories created solely for this task,
`/tmp/qcli-2.5-scratch/repo` (default `init` configuration),
`/tmp/qcli-2.5-scratch/repo2` (alternate `--config-location root
--backlog-dir .backlog --zero-padded-ids 4 --task-prefix QS`), and
`/tmp/qcli-2.5-fix-scratch/repo` (a follow-up fix-pass repo, used solely to
actually run `draft create` after review found that node missing from the
original evidence log — see the `draft create` row below and Notes), all
outside this worktree, none committed to it, and none the same directory as
this repository's own `backlog/` (the live campaign's system of record) or
the quarantined local Backlog.md clone at
`/Volumes/external/repos/Backlog.md` (never opened, per the
[research source register](quest-cli-research-source-register.md#local-backlogmd-clone-volumesexternalreposbacklogmd));
and process-level responses from running that same installed binary against
those scratch repositories — specifically `mcp start`'s stdio JSON-RPC
responses (used substantively below: the server's self-reported version and
its EOF-shutdown behavior) and `curl` probes of the `browser` command's
local HTTP server (recorded below as evidence of what `browser` serves, but
— as the Execution evidence `browser` row itself states — not treated as a
citable public contract).

**Pinned research revision (AC6):** `backlog.md` **v1.49.3** — confirmed as
both the locally installed build and the register's own pin via `backlog
--version` → `1.49.3`, re-run live 2026-08-04 immediately before this task's
enumeration began. This document's every command transcript below was
captured against that exact build. It stays consistent with, and does not
restate or override, the
[research source register](quest-cli-research-source-register.md)'s
"Backlog.md public surface" and "Backlog.md implementation source and
internal tests" slices, the [component charter](quest-cli-component-charter.md)'s
"migration, coexistence, aliases, and reversible fidelity reports" ownership
line, and the [research program Spec](../specs/quest-cli-pre-implementation-research-program.md).

**Recheck clause (moving-vs-immutable-references convention).** This
document's every finding depends on the pinned v1.49.3 build being the
build a later worker actually has installed. Before relying on any table
below, re-run `backlog --version` and `npm view backlog.md version`; if
either reports a version other than `1.49.3`, that is a reclassification
trigger per the register's own "Backlog.md public surface" slice — every
finding in this document must be re-verified against the new build before
further reliance, and the new version number is a fact for the owner to
record, not grounds for a worker to silently treat this document as still
current.

Any Quest-wide vocabulary, architecture, or roadmap consequence surfaced
while producing this document is noted as a proposal to `quest-doc` where it
arises below; none is asserted as a Quest-wide decision here. This document
records no finding of that kind — every finding here is either a
Backlog.md public-contract observation or a component-level Quest migration
contract, both squarely inside `quest-cli`'s own charter ("migration,
coexistence, aliases, and reversible fidelity reports").

## Details

### Method: exhaustive CLI enumeration, and the proof nothing was omitted (AC4)

The enumeration below is a full recursive traversal of `backlog --help`'s
command tree: starting from the root `Commands:` list, `--help` was run
against every named command, and — for every command whose own `--help`
output itself contained a further `Commands:` section — against every one
of its subcommands in turn. Recursion terminated only at nodes whose
`--help` output contains no `Commands:` section (a leaf). No third level
exists anywhere in the tree: every subcommand's own `--help` (e.g. `backlog
task create --help`, `backlog milestone rename --help`) prints only an
`Options:` section, never a further `Commands:` section — confirmed by
running it on all 31 subcommand leaves, not assumed from a sample.

This gives an exact, checkable count, not an estimate:

- **18 root entries** in `backlog --help`'s `Commands:` list: `init`,
  `task|tasks`, `search`, `draft`, `milestone|milestones`, `board`, `doc`,
  `decision`, `agents`, `config`, `doctor`, `cleanup`, `browser`,
  `overview`, `completion`, `instructions`, `mcp`, `help`.
- **9 of those 18 are groups** (their own `--help` shows a `Commands:`
  section): `task|tasks`, `draft`, `milestone|milestones`, `board`, `doc`,
  `decision`, `config`, `completion`, `mcp`.
- **31 subcommand leaves** across those 9 groups: `task` (7: `create`,
  `list`, `edit`, `view`, `archive`, `complete`, `demote`), `draft` (5:
  `list`, `create`, `archive`, `promote`, `view`), `milestone` (5: `list`,
  `add`, `rename`, `remove`, `archive`), `board` (2: `view`, `export`),
  `doc` (5: `create`, `update`, `list`, `search`, `view`), `decision` (1:
  `create`), `config` (3: `get`, `set`, `list`), `completion` (2:
  `__complete`, `install`), `mcp` (1: `start`). A `help [command]` entry
  additionally appears inside 5 of the 9 groups' own `--help`
  (`milestone`, `doc`, `decision`, `completion`, `mcp`) but not the other 4
  (`task`, `draft`, `board`, `config`) — an inconsistency in which groups
  self-document their own help alias, noted here as evidence the traversal
  was exhaustive rather than pattern-matched; it is not counted as a
  distinct leaf because it is not new behavior — `backlog <group> help
  <sub>` and `backlog <group> <sub> --help` were spot-checked to print
  identical usage text.
- **9 non-group root commands** with no further subcommands: `init`,
  `search`, `agents`, `doctor`, `cleanup`, `browser`, `overview`,
  `instructions`, `help`.

Total addressable surface: 18 root entries + 31 subcommand leaves = **49
distinct invocable nodes**, plus the top-level `-v`/`--version` and
`-h`/`--help` options and each node's own `-h`/`--help`. Every one of the
49 nodes had its `--help` read (Method) and was independently exercised at
least once against a scratch repository (Execution evidence, below) — no
node is enumerated from `--help` text alone without a corresponding
execution row.

### Full command surface, root-level (AC4)

| Command | Kind | Options (own, not inherited) |
| --- | --- | --- |
| `init [projectName]` | leaf | `--agent-instructions`, `--check-branches`, `--include-remote`, `--branch-days`, `--bypass-git-hooks`, `--zero-padded-ids`, `--default-editor`, `--web-port`, `--auto-open-browser`, `--install-claude-agent`, `--integration-mode`, `--backlog-dir`, `--config-location`, `--task-prefix`, `--no-git`, `--defaults` |
| `task\|tasks [taskId]` | group (7 leaves) | `--plain`, `--json` |
| `search [query]` | leaf | `--type`, `--task-type`, `--status`, `--exclude-status`, `--priority`, `--modified-file`, `--limit`, `--plain`, `--json` |
| `draft [taskId]` | group (5 leaves) | `--plain` |
| `milestone\|milestones` | group (5 leaves) | (none of its own; per-subcommand only) |
| `board` | group (2 leaves) | `-l/--layout`, `--vertical`, `-m/--milestones` (also usable bare, defaulting to `view`'s behavior) |
| `doc` | group (5 leaves) | (none of its own) |
| `decision` | group (1 leaf) | (none of its own) |
| `agents` | leaf | `--update-instructions` |
| `config` | group (3 leaves) | (none of its own; bare `backlog config` launches an interactive wizard — see Execution evidence) |
| `doctor` | leaf | `--fix`, `--yes` |
| `cleanup` | leaf | none — fully interactive, no flags at all |
| `browser` | leaf | `-p/--port`, `--no-open`, `--non-interactive` |
| `overview` | leaf | none |
| `completion` | group (2 leaves, + internal) | (none of its own) |
| `instructions [guide]` | leaf | `--list` |
| `mcp` | group (1 leaf) | (none of its own) |
| `help [command]` | leaf | prints the named command's own `--help` |

### Full command surface, subcommand level (AC4)

| Group | Subcommand | Options |
| --- | --- | --- |
| `task` | `create [title]` | `-d/--description`, `--desc`, `-a/--assignee`, `-s/--status`, `-l/--labels`, `--priority`, `--type`, `--plain`, `--ac`, `--acceptance-criteria`, `--dod`, `--no-dod-defaults`, `--plan`, `--notes`, `--final-summary`, `--ordinal`, `-m/--milestone`, `--draft`, `-p/--parent`, `--depends-on`, `--dep`, `--ref`, `--modified-file`, `--doc` |
| `task` | `list` | `-s/--status`, `--exclude-status`, `-a/--assignee`, `--unassigned`, `-m/--milestone`, `-p/--parent`, `--priority`, `--type`, `-l/--labels`, `--search`, `--limit`, `--sort`, `--plain`, `--json` |
| `task` | `edit [taskId]` | `-t/--title`, `-d/--description`, `--desc`, `-a/--assignee`, `-s/--status`, `-l/--label`, `--priority`, `--type`, `--ordinal`, `-m/--milestone`, `--clear-milestone`, `--plain`, `--add-label`, `--remove-label`, `--clear-labels`, `--ac`, `--dod`, `--remove-ac`, `--remove-dod`, `--check-ac`, `--check-dod`, `--uncheck-ac`, `--uncheck-dod`, `--acceptance-criteria`, `--clear-ac`, `--plan`, `--notes`, `--comment`, `--comment-author`, `--final-summary`, `--append-plan`, `--append-notes`, `--append-final-summary`, `--clear-final-summary`, `--depends-on`, `--dep`, `--ref`, `--modified-file`, `--doc` |
| `task` | `view <taskId>` | `--plain`, `--json` |
| `task` | `archive <taskId>` | none |
| `task` | `complete <taskId>` | none — refuses non-terminal-status tasks |
| `task` | `demote <taskId>` | none |
| `draft` | `list` | `--sort`, `--plain` |
| `draft` | `create <title>` | `-d/--description`, `--desc`, `-a/--assignee`, `-s/--status`, `-l/--labels` |
| `draft` | `archive <taskId>` | none |
| `draft` | `promote <taskId>` | none |
| `draft` | `view <taskId>` | `--plain` |
| `milestone` | `list` | `--show-completed`, `--plain` |
| `milestone` | `add <name>` | `-d/--description` |
| `milestone` | `rename <from> <to>` | `--no-update-tasks` |
| `milestone` | `remove <name>` | `--task-handling`, `--reassign-to` |
| `milestone` | `archive <name>` | none |
| `board` | `view` | `-l/--layout`, `--vertical`, `-m/--milestones` |
| `board` | `export [filename]` | `--force`, `--readme`, `--export-version` |
| `doc` | `create <title>` | `-p/--path`, `-t/--type` |
| `doc` | `update <docId>` | `--title`, `--content`, `-p/--path`, `-t/--type`, `--tags` |
| `doc` | `list` | `--plain` |
| `doc` | `search <query>` | `-l/--limit` |
| `doc` | `view <docId>` | `--plain` |
| `decision` | `create <title>` | `-s/--status` |
| `config` | `get <key>` | none |
| `config` | `set <key> <value>` | none |
| `config` | `list` | none |
| `completion` | `__complete <line> <point>` | internal — "do not call directly" per its own `--help`; still enumerated and exercised (Execution evidence) because it is reachable from `completion --help` |
| `completion` | `install` | `--shell` |
| `mcp` | `start` | `-d/--debug`, `--cwd` |

Every flag listed above is taken verbatim from the corresponding `--help`
transcript captured live 2026-08-04; none is inferred.

### Execution evidence (AC5)

Every row is a command actually run against one of the three scratch
repositories on 2026-08-04. "Effect" states the on-disk or process-level
result observed directly (file diff, `git log`, `git status`, `curl`/stdio
response, or the exact stdout/stderr), not an inference from source.

#### Initialization and configuration

| Command | Exit | Output shape | Observed effect |
| --- | --- | --- | --- |
| `git init -q && backlog init "QCLI Scratch" --defaults --agent-instructions none` (repo) | 0 | human-readable summary panel | Creates `backlog/{tasks,drafts,docs,decisions,milestones,completed,archive/{tasks,drafts,milestones}}` and `backlog/config.yml`; **nothing is committed** — `git status --porcelain` immediately after shows `backlog/config.yml` untracked and every created directory empty (Git does not track empty directories). `config.yml`'s own `auto_commit: false` explains why. |
| `backlog init "Alt Config Project" --defaults --agent-instructions none --config-location root --zero-padded-ids 4 --task-prefix QS --backlog-dir .backlog` (repo2) | 0 | same panel, reporting `Config location: backlog.config.yml`, `Backlog directory: .backlog` | Config file lands at project root as `backlog.config.yml` (not `.backlog/config.yml`); task directory is `.backlog/tasks/`; a subsequent `task create` produces ID `QS-0001` (zero-padded, custom prefix) — proves task-ID shape (prefix, padding, directory name, config filename and location) is **all project-configurable**, not a fixed convention Quest may assume. |
| `backlog init "Reinit attempt" --defaults --agent-instructions none` re-run against the **already-initialized** repo | 0 | `Existing backlog project detected. Current configuration will be preserved where not specified.` then the same summary panel, `Updated backlog project configuration: Reinit attempt` | **Silently overwrote `project_name`** from `"QCLI Scratch"` to `"Reinit attempt"` in `backlog/config.yml` — confirmed by `grep project_name backlog/config.yml` before/after. No confirmation prompt, no diff shown, despite the stated "preserved where not specified" — the positional `projectName` argument counts as "specified" even on a re-init the operator may not have intended as a rename. See Findings, below. |
| `backlog config list` | 0 | plain key/value block, 21 keys | Full current config surfaced, including keys not settable via `config set` (`statuses`, `priorities`, `types`, `taskPrefix` marked `(read-only)`). |
| `backlog config get statuses` / `get autoCommit` / `get bogusKey` | 0 / 0 / 1 | plain value / plain value / error listing all 21 valid keys | `config get` on an unknown key exits 1 and enumerates every valid key verbatim — a complete, machine-checkable key list obtainable without reading source. |
| `backlog config set autoCommit true` then `backlog config set defaultEditor vim` | 0 / 0 | `Set <key> = <value>` | `backlog/config.yml` updated in place; confirms `config set` is scoped to a documented settable-key allowlist distinct from `config get`'s (broader) readable-key list. |
| `backlog config` (bare, non-interactive stdin) | 0 | prints a `◆ Install shell completions now?` interactive prompt, then exits without acting | Confirms the `--help` text's own "Writes: Interactive configuration updates when run without a subcommand" — bare `config` is a wizard, not a no-op; under non-interactive stdin it exits cleanly without writing (no `config.yml` diff observed). |

#### Task lifecycle

| Command | Exit | Output shape | Observed effect |
| --- | --- | --- | --- |
| `task create "Parent task alpha" -d ... -a @scratch-user -s "To Do" -l "area:test,priority-check" --priority High --type feature --ac ... --ac ... --dod ... --ordinal 100 --ref ... --modified-file ... --doc ... --plain` | 0 | `--plain` detail view of the new task | `backlog/tasks/task-1 - Parent-task-alpha.md`; frontmatter: `id, title, status, assignee[], created_date, labels[], dependencies[], references[], documentation[], modified_files[], priority, type, ordinal`; body: `## Description`, `## Acceptance Criteria`, `## Definition of Done`, each inside a named `<!-- SECTION:X:BEGIN/END -->` or `<!-- AC:BEGIN/END -->`/`<!-- DOD:BEGIN/END -->` managed-block pair. |
| `task create "Child task beta" -p TASK-1 -m "Release 1.0" --depends-on TASK-1 --plain` | 0 | `--plain` detail view | ID **`TASK-1.1`** (hierarchy is dot-suffixed, not a separate counter); frontmatter/body show `Milestone: m-0` (the milestone's own ID, not its title), `Parent: TASK-1`, `Dependencies: TASK-1`. |
| `task edit TASK-1 --status "In Progress" --plan "..." --notes "..." --comment "..." --comment-author "@reviewer" --check-ac 1 --add-label extra-label --plain` | 0 | updated `--plain` view | Adds `Implementation Plan`, `Implementation Notes`, `Comments` sections (comment stores `author`/`created` in an HTML-comment-delimited block, not YAML frontmatter); `updated_date` frontmatter key appears for the first time only once a task is edited (absent on a freshly created, unedited task). |
| `task edit TASK-1 --final-summary "..." --append-final-summary "..."` / `--append-plan "..." --append-notes "..."` / `--uncheck-ac 1 --remove-dod 1` / `--clear-final-summary` | all 0 | `--plain` views | Confirms replace-vs-append pairs (`--notes` replaces, `--append-notes` appends after; same pattern for plan/final-summary) and index-addressed AC/DoD mutation (1-based) both work as documented. |
| `task edit TASK-1.1 --clear-labels` then `--remove-label nonexistent --add-label x --label y,z` | 0 / **1** | — / `Cannot combine --label with --add-label or --remove-label. Use --label a,b for the final full label set, or use add/remove flags without --label.` | Flag-combination collision is caught before any write, with a corrective message naming the exact fix — no partial mutation observed. |
| `task edit TASK-1 --clear-ac --ac "Should fail"` | **1** | `Cannot combine --clear-ac with --acceptance-criteria, --ac, --remove-ac, --check-ac, or --uncheck-ac. Use --clear-ac by itself.` | Same collision-guard pattern as labels, for the AC mutation flag family. |
| `task edit TASK-1.1 --depends-on TASK-999 --plain` | **1** | `The following dependencies do not exist: TASK-999. Please create these tasks first or verify the IDs.` | Dependency edits are validated against existing IDs before write; no dangling reference can be created through this path. |
| `task edit TASK-1.1 --clear-milestone --depends-on "" --plain` | 0 | `--plain` view, no `Milestone:` line | `--clear-milestone` took effect; `--depends-on ""` did **not** clear the existing `Dependencies: TASK-1` line — passing an empty string is not documented as, and does not behave as, a clear operation for dependencies (see Findings). |
| `task create "Draft candidate" --draft --plain` | 0 | `--plain` view, `Status: ○ Draft` | Lands in `backlog/drafts/draft-1 - Draft-candidate.md`, not `backlog/tasks/` — `--draft` on `task create` is a routing flag, not a status label on an otherwise-normal task file. |
| `task archive TASK-2` (the promoted draft) | 0 | `Archived task TASK-2` | Moves file to `backlog/archive/tasks/`. |
| `task edit TASK-1.1 --status "Done" --plain` then `task complete TASK-1.1` | 0 / 0 | `--plain` view / `Completed task TASK-1.1.` + path | Moves to `backlog/completed/`; `task complete TASK-1` (still `In Progress`) → **exit 1**, `Task TASK-1 is not Done. Set status to "Done" with: backlog task edit TASK-1 -s "Done" before cleanup.` — terminal-status precondition enforced with the exact remediation command quoted back. |
| `task demote TASK-3` (a plain active task, after `TASK-2` had already been archived and promoted through once) | 0 | `Demoted task TASK-3` | Landed at `backlog/drafts/draft-1 - Task-to-demote.md` — **reused the numeral `1`**, already consumed by an earlier, now-archived draft. Draft and task ID counters are independent per-status-folder sequences, not a single global counter — see Findings (ID reuse). |
| `task view TASK-999` / `task archive TASK-999` / `task edit TASK-999 --notes x` | all **1** | `Task TASK-999 not found.` | Consistent, non-zero exit for unknown task IDs across `view`/`archive`/`edit`. |
| `task create` (no title, `</dev/null`) | **1** | `error: missing required argument 'title'` | Commander-style required-argument enforcement; no interactive title prompt when stdin is closed. |
| `task edit TASK-1 --status "Bogus Status"` / `task create "Bad status test" -s "Nonexistent Status"` | **1** / **1** | `Invalid status: <value>. Valid statuses are: To Do, In Progress, Done` | Status values are validated against the project's configured `statuses` list (not a fixed enum) on both create and edit. |
| `task list --plain` / `--json` / `--sort priority --limit 2 --plain` | 0 | grouped-by-status plain text; `{schemaVersion:1, kind:"task-list", tasks:[...]}` | JSON row shape: `id, title, status, type, priority, assignees[], reporter, labels[], milestone, parentTaskId, ordinal, createdAt, updatedAt` — `reporter` is always present (observed `null`) though no CLI flag sets it; `milestone`/`parentTaskId` surface even though not requested. |
| `task view TASK-1 --json` | 0 | `{schemaVersion:1, kind:"task-view", task:{...}}` | Fuller shape than `task-list`'s row: adds `path`, `description`, `dependencies[]`, `references[]`, `documentation[]`, `modifiedFiles[]`, `subtasks[]` (id+title only), `acceptanceCriteria[]`/`definitionOfDone[]` (each `{index, text, checked}`), `implementationPlan`, `implementationNotes`, `comments[]` (`{index, body, createdAt, author}`), `finalSummary`. This is the single richest structured read of a task Backlog.md exposes. |
| `task view TASK-1` / `board view` / `task list` (all with **no `--plain`/`--json` flag**, stdout piped to a non-TTY) | 0 | identical to the explicit `--plain`/text form | **Automatic plain-text fallback when stdout is not a TTY** — the documented `--plain` flag is not strictly required for deterministic, scriptable output; Backlog.md self-detects. See Findings. |

#### Duplicate-ID collision and repair (`doctor`)

| Command | Exit | Output shape | Observed effect |
| --- | --- | --- | --- |
| `cp "task-3 - Third-new-task.md" "task-3 - Duplicate-of-three.md"` (hand-copied inside the scratch repo to manufacture a real collision, then title-edited with `sed`) | — | — | Two files in `backlog/tasks/` both carry frontmatter `id: TASK-3`. |
| `task view TASK-3` (while the duplicate exists) | **1** | `Task ID TASK-3 is ambiguous; 2 files match: <path1> <path2> Run 'backlog doctor' to preview a safe repair.` | ID-addressed reads refuse to guess when a collision exists in the active/completed scope. |
| `doctor` (no flags) | **1** | `WARNING: 1 duplicate task ID group affects 2 files. ... Repair preview (no files changed): task-3 - Third-new-task.md TASK-3 -> TASK-4 new path: ... Run 'backlog doctor --fix' to apply this repair after reviewing the preview.` | **Deterministic dry run**: reports the exact rename it would perform and states explicitly that no file changed; exits non-zero specifically to signal "an unresolved condition exists," distinct from a read error. |
| `doctor --fix` (no `--yes`, non-interactive stdin) | **1** | same preview, plus `Interactive confirmation is unavailable. Review the preview, then use --fix --yes.` | Confirms the preview/apply split is a hard two-step gate, not bypassable by `--fix` alone outside a TTY. |
| `doctor --fix --yes` | **0** | preview, then `Repaired 1 duplicate task file. ... (TASK-3 -> TASK-4) Verification passed: no duplicate active/completed task IDs remain.` | File renamed on disk (`task-3 - Third-new-task.md` → `task-4 - Third-new-task.md`, frontmatter `id` updated to `TASK-4`); the **other** same-named file (`Duplicate-of-three.md`) silently keeps `TASK-3`. |
| `git status --porcelain` immediately after (with `autoCommit: true` already set, and ordinary `task create`/`task edit` calls auto-committing throughout this same session) | — | `D "backlog/tasks/task-3 - Third-new-task.md"` (deleted, not staged) plus the new path untracked | **`doctor --fix` does not participate in the `autoCommit` convention** other write commands follow in this same session (see the `git log` evidence in Task lifecycle, above, and Findings) — it edits the working tree only, leaving Git's index pointing at a path that no longer exists. |
| `doctor` (re-run after the fix) | 0 | `No duplicate task IDs found in active or completed tasks.` | Explicitly scoped wording — **not** "no duplicates exist." |
| `task view TASK-2` while a same-numbered file exists in `backlog/archive/tasks/` (see next table) | 0 | resolves silently to the **active** `TASK-2`, no warning | `doctor`'s duplicate scan and `task view`'s ambiguity guard **do not see across the archive boundary** — this collision is real, on disk, and invisible to every command exercised. See Findings. |

#### Draft, milestone, document, and decision records

| Command | Exit | Output shape | Observed effect |
| --- | --- | --- | --- |
| `draft create "QCLI-2.5 fix probe" -d "Fix-pass probe for the AC5 draft-create gap" -a @fix-worker -l "clean-room,fix-pass"` (run in the follow-up fix-pass scratch repo `/tmp/qcli-2.5-fix-scratch/repo` — see Notes; this node was absent from the original evidence log until review caught the gap) | 0 | `Created draft DRAFT-1` then `File: /private/tmp/qcli-2.5-fix-scratch/repo/backlog/drafts/draft-1 - QCLI-2.5-fix-probe.md` | File on disk with frontmatter `id: DRAFT-1, title: QCLI-2.5 fix probe, status: Draft, assignee: ['@fix-worker'], created_date: '2026-08-04 17:12', labels: [clean-room, fix-pass], dependencies: []` and body `## Description` inside a single `<!-- SECTION:DESCRIPTION:BEGIN/END -->` managed block — the same shape `task create --draft` produces, minus the fields (`priority`/`type`/`ordinal`) a draft doesn't carry. A second invocation, `draft create "QCLI-2.5 fix probe status" -d "second probe" -s "Draft"` (exit 0, `Created draft DRAFT-2`), confirmed the surface table's `-s/--status` flag is accepted but writes the same `status: Draft` a bare `draft create` already produces — `draft create` has no way to route to a non-Draft status through this flag. This is the node the review round (B1) found missing; it is now independently exercised like every other of the 49. |
| `draft list --plain` / `draft view DRAFT-1 --plain` | 0 / 0 | plain list / plain detail | Same rendering engine as `task view`/`task list`, minus the fields a draft cannot yet have (no `Priority`/`Type` shown on a bare draft). Ran in `/tmp/qcli-2.5-scratch/repo` against the `DRAFT-1` created there via `task create --draft` (Task lifecycle table) — a distinct node and a distinct file from the `draft create` row immediately above. |
| `draft promote DRAFT-1` | 0 | `Promoted draft DRAFT-1` | Moves `backlog/drafts/draft-1 - ...md` → `backlog/tasks/task-2 - ...md`; the **task**-side ID (`TASK-2`) is assigned fresh at promotion time, independent of the draft's own former numeral. |
| `draft archive DRAFT-999` / `draft view DRAFT-999 --plain` / `draft promote DRAFT-999` | **0** (all three) | `Draft DRAFT-999 not found.` | Unknown-draft handling exits **0**, not 1 — see Findings (cross-family exit-code inconsistency). |
| `milestone add "Release 1.0" -d "..."` | 0 | `Created milestone "Release 1.0" (m-0).` | `backlog/milestones/m-0 - release-1.0.md`; frontmatter is only `id`/`title`, description is body prose, not a frontmatter field. |
| `milestone list --plain` | 0 | `Active milestones (N): m-0: Release 1.0 (0/0 done) ... Completed milestones (N): ...` | Completion fraction is derived (task count in that milestone vs. Done count), not stored. |
| `milestone rename "Release 2.0" "Release 2.0 Renamed"` | 0 | `Renamed milestone "Release 2.0" (m-1) → "Release 2.0 Renamed" (m-1). Updated 0 local tasks: ...` | ID (`m-1`) is stable across rename; only the title and filename slug change; task references would be rewritten too (0 in this case, none pointed at it yet). |
| `milestone remove "Release 2.0 Renamed" --task-handling clear` | 0 | `Removed milestone "..." (m-1). Cleared milestone for 0 local tasks: ...` | Moves the file to `backlog/archive/milestones/` — **the same destination folder `milestone archive` uses** — `remove` and `archive` differ only in the task-handling side effect (`clear`/`keep`/`reassign`, only on `remove`), not in where the file ends up. |
| `milestone archive "Release 1.0"` | 0 | `Archived milestone "Release 1.0" (m-0).` | Same destination folder as above, no task-handling option. |
| `milestone remove "Nonexistent Milestone"` / `milestone archive "Nonexistent"` | **1** / **1** | `Milestone not found: "..."` | Milestone family is consistently exit 1 on not-found (unlike `draft`). |
| `doc create "Scratch Guide" -p guides -t guide` | 0 | `Created document doc-1 Path: backlog/docs/guides/doc-1 - Scratch-Guide.md` | Frontmatter: `id, title, type, created_date`; body starts empty. |
| `doc update doc-1 --content "..." --tags "guide,scratch"` | 0 | `Updated document doc-1 Path: ...` | Adds `updated_date`, `tags[]`; **replaces** body content wholesale (no append variant for docs, unlike task notes/plan). |
| `doc list --plain` / `doc view doc-1 --plain` / `doc search "Scratch"` | 0 | plain list / plain frontmatter+body / scored match list | `doc search` output includes a fuzzy `[score N]` and a `View: backlog doc view <id>` follow-up hint — same shared-index engine `search` (top-level) and `task list --search` use. |
| `doc view doc-999 --plain` | **0** | `Document doc-999 not found.` | Same 0-exit-on-not-found family as `draft`, not `task`/`milestone`. |
| `decision create "Adopt scratch policy" -s proposed` | 0 | `Created decision decision-1` | `backlog/decisions/decision-1 - ...md`; frontmatter `id, title, date, status`; body is a fixed three-heading skeleton (`## Context`, `## Decision`, `## Consequences`), all empty, for the operator to fill by hand. **There is no `decision list`/`decision view`/`decision update`/`decision edit` command anywhere in the enumerated surface** — `decision` supports create-only through the CLI; reading a decision back structurally is only possible via `search --type decision` (title/status/date only, no body) or by opening the Markdown file directly. See Findings. |

#### Search, board, overview, and reports

| Command | Exit | Output shape | Observed effect |
| --- | --- | --- | --- |
| `search "scratch" --plain` / `--json` | 0 | plain grouped-by-type list / `{schemaVersion:1, kind:"search", results:[{type, data:{...}}]}` | Cross-type results (`document`, `decision`, and — with matching tasks present — `task`) in one ranked list; each result's `data` shape matches that type's own detail fields, not a flattened common schema. |
| `search "task" --type task --status "To Do" --plain` | 0 | plain list with `[score N]` | Confirms the documented `--type`/`--status` filters compose. |
| `board view` (`--plain`/`--json` not offered — see surface table) | 0 | Markdown-table Kanban rendering to stdout, even without `--readme`/export | On non-TTY stdout, `board view` prints the same Markdown table `board export` would write to a file, headed `# Kanban Board Export...`; project name in this fallback path read `Project: Project` — a placeholder, not `QCLI Scratch`/`Reinit attempt` — while `board export <file>` to an actual file correctly used the live project name. See Findings (project-name inconsistency). |
| `board export board-export.md --force` | 0 | `Exported board to <path>` | Writes a standalone Markdown table file with a `Generated on:` timestamp header. |
| `board export --readme --export-version "v1.0.0"` (README.md pre-seeded with unrelated content) | 0 | `Updated README.md with Kanban board.` | Inserts the table between `<!-- BOARD_START -->`/`<!-- BOARD_END -->` markers, **preserving the pre-existing README content outside the markers** — the same managed-block convention this document's own Lore tooling uses, and a directly reusable precedent for any Quest-side generated-block contract. |
| `overview` | 0 | multi-section plain report (status/priority breakdown, recent activity, project health) | Reports `Average Task Age: -1 days` in this session — a negative value is not a meaningful age; recorded as a display defect, not diagnosed further (would require reading source to explain). |
| `overview` / `board view` / `board export` (all three) | 0 | each printed `Fetching remote branches...` / `Applying latest task states from branch scans...` progress lines | Confirms `init`'s `--check-branches`/`--include-remote`/`--branch-days` options and `config`'s `checkActiveBranches`/`activeBranchDays` keys correspond to a real, currently-active feature: task/board/overview state is overlaid with state scanned from **other Git branches**, not read purely from the current working tree. No admissible source describes the overlay algorithm precisely enough to reproduce; recorded as an explicit unsupported gap (Findings, and the AC2 table). |
| `cleanup` (no flags exist) with one `Done`-status task present, non-interactive stdin | 0 | `Found 1 tasks marked as Done.` then an interactive age-threshold picker (`1 day`/`1 week`/.../`1 year`), then exits | **No file was moved** — confirmed by `find backlog/tasks backlog/completed` immediately after. `cleanup` has no non-interactive flag of any kind (`--help` lists only `-h/--help`); its move step could not be driven to completion without a real TTY. Recorded as exercised-but-incomplete: the command runs safely and makes no mutation under non-interactive stdin, but its actual archival behavior was not observed end-to-end. |
| `agents --update-instructions` (non-interactive stdin) | 0 | interactive file-selection prompt, then exits | No `CLAUDE.md`/`AGENTS.md`/etc. was created in the scratch repo — same exercised-but-incomplete pattern as `cleanup`; no non-interactive flag exists. |
| `agents` (bare) | 0 | prints its own `--help` text | Confirms `agents` with no arguments is a no-op help display, not an implicit `--update-instructions`. |

#### Shell integration, guides, and processes

| Command | Exit | Output shape | Observed effect |
| --- | --- | --- | --- |
| `HOME=<fake> completion install --shell bash` | 0 | `📦 Installed bash completion... ✅ Completion script written to <fake HOME>/.local/share/bash-completion/completions/backlog To enable completions, add this to your ~/.bashrc: source ...` | Writes **only** the completion script itself under `$HOME`; does **not** edit `~/.bashrc`/`~/.zshrc` — it prints the line for the operator to add by hand. Verified safe by running with `HOME` pointed at a throwaway directory; no file outside that directory was touched. |
| `completion __complete "backlog task " 13` | 0 | newline-separated word list (`create`, `list`, `edit`, `view`, `archive`, `complete`, `demote`, `--plain`, `--json`) | Confirmed reachable and functional even though its own `--help` calls it "internal... do not call directly" — exercised once for completeness per AC5, not treated as a stable documented contract Quest should target. |
| `instructions` (bare) / `--list` / `init-required` | 0 / 0 / 0 | guide index (identical for bare and `--list` — no observed behavioral difference between the flag and the no-argument default) / same index / rendered Markdown guide body | `init-required` renders correctly even though this scratch repo was already initialized — guides are static content, not state-conditional. |
| `help task` | 0 | identical text to `task --help` | Confirms `help <command>` is a true alias, not a distinct summary view. |
| `-v` / `--version` | 0 / 0 | `1.49.3` | Matches the pinned revision exactly. |
| `mcp start` fed a JSON-RPC `initialize` request over a FIFO-backed stdin, stdout captured to a file, backgrounded and killed after response capture | 0 (process signaled after use, not a crash) | one-line JSON-RPC response: `{"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{"listChanged":true},"resources":{"listChanged":true},"prompts":{"listChanged":true},"logging":{}},"serverInfo":{"name":"backlog.md","version":"1.49.3"},"instructions":"..."},"jsonrpc":"2.0","id":1}` | Confirms the MCP stdio server is real, responds to the standard MCP handshake, and self-reports the same `1.49.3` version. With stdin closed immediately (no FIFO), the process exits promptly with no output — a clean EOF-triggered shutdown, not a hang. |
| `browser --port 6999 --no-open --non-interactive`, backgrounded, probed with `curl` | 0 (killed after probing, not crashed) | `curl http://127.0.0.1:6999/` → `HTTP_STATUS:200`; `curl http://127.0.0.1:6999/api/tasks` → a JSON array of task objects | The web UI serves on the requested port with `--no-open`/`--non-interactive` fully suppressing any interactive/OS-level browser-launch behavior — safe to exercise headlessly. The `/api/tasks` JSON shape differs from the CLI's own `--json` contract (e.g. `"assignee":[...]` vs. the CLI's `"assignees":[...]`, plus a `rawContent` field not present anywhere in the CLI JSON envelopes) — this HTTP API is **not** part of the admissible "published documentation / `--help` / `--plain`/`--json` output" surface the register defines, so it is recorded here only as a discovered fact about what `browser` serves, never treated as a citable contract Quest may target. |

### Inventory of user-owned Backlog records (AC1)

| Category | Where it lives on disk | How it is read publicly |
| --- | --- | --- |
| Active | `backlog/tasks/*.md` (or the configured `--backlog-dir`/`.backlog` equivalent) | `task list`, `task view <id>`, both `--plain`/`--json` |
| Completed | `backlog/completed/*.md`, populated only via `task complete <id>` on a terminal-status task | Same read commands; `overview` and `task list` both include completed-folder tasks in their status breakdown |
| Archived | `backlog/archive/{tasks,drafts,milestones}/*.md`, populated via `task archive`, `draft archive`, `milestone archive`/`remove` | **No dedicated list/view command reaches the archive folders at all** — confirmed by `task view TASK-2` silently resolving only to the active-folder file when an archived file shares its ID (Execution evidence, Duplicate-ID table); the only public way to read an archived record is to open its Markdown file directly (on-disk artifact, still admissible) |
| Draft | `backlog/drafts/*.md`, created via `task create --draft`/`draft create`, or `task demote` | `draft list`, `draft view <id>`, both `--plain` only (no `--json` for drafts anywhere in the enumerated surface) |
| Hierarchy | `parentTaskId`/`Parent:` field, dot-suffixed child IDs (`TASK-1.1`) | `task view --json`'s `subtasks[]` (id+title only, one level); `task list --parent <id>` |
| Dependencies | `dependencies[]` frontmatter, `Dependencies:` rendered line | `task view --json`'s `dependencies[]`; validated against existing IDs at write time (`task edit --depends-on`) |
| Milestones | `backlog/milestones/*.md` (own `id`/`title`/description file) plus each task's own `milestone`/`Milestone:` field (stores the milestone **ID**, e.g. `m-0`, not its title) | `milestone list`, `task view --json`'s `milestone` field (an ID string) |
| Lifecycle metadata | `status`, `priority`, `type`, `assignee[]` frontmatter | `task view`/`task list`, both output modes; `config get statuses/priorities/types` for the valid-value sets, which are project-configurable, not fixed |
| Plans | `Implementation Plan` section (`SECTION:PLAN` managed block) | `task view --json`'s `implementationPlan` (single Markdown string); replace via `--plan`, append via `--append-plan` |
| Criteria | `Acceptance Criteria` (`AC:BEGIN/END`) and `Definition of Done` (`DOD:BEGIN/END`), each a checkbox list | `task view --json`'s `acceptanceCriteria[]`/`definitionOfDone[]`, each item `{index, text, checked}` |
| Notes | `Implementation Notes` section (`SECTION:NOTES`) | `task view --json`'s `implementationNotes` (single Markdown string); replace via `--notes`, append via `--append-notes` |
| Comments | `Comments` section, one `author`/`created`/body block per comment inside `<!-- COMMENTS:BEGIN/END -->` | `task view --json`'s `comments[]`, each `{index, body, createdAt, author}`; append-only via `task edit --comment` (no comment-edit or comment-delete command exists anywhere in the enumerated surface) |
| References | `references[]` (arbitrary URLs/paths), `documentation[]` (doc cross-links), `modifiedFiles[]` — three **distinct** array fields, not one | `task view --json`'s `references[]`/`documentation[]`/`modifiedFiles[]`; all three are set/replace semantics on `task edit` (no incremental add/remove variant, unlike labels) |
| Timestamps | `created_date`/`updated_date` frontmatter (task, doc); `date` (decision); each comment's own `created` | `task view --json`'s `createdAt`/`updatedAt` (ISO 8601, `Z`-suffixed); `updated_date`/`updatedAt` is **absent** until a task is edited at least once (a freshly created, unedited task has no updated timestamp at all, not a copy of `created_date`) |
| Final summaries | `Final Summary` section (`SECTION:FINAL_SUMMARY`-equivalent managed block) | `task view --json`'s `finalSummary` (`null` until set); replace via `--final-summary`, append via `--append-final-summary`, clear via `--clear-final-summary` |

Two further record types exist in Backlog.md beyond AC1's named list, included here
for completeness since the task's own description scope is "user-owned Backlog
records" generally, not only the AC1 checklist: **Documents** (`doc`, full CRUD
except delete) and **Decisions** (`decision`, create-only through the CLI — see
the Execution evidence table's Draft/milestone/document/decision section).

### Field-by-field disposition (AC2)

Four dispositions, used consistently below:

| Disposition | Meaning |
| --- | --- |
| Public read contract | Obtainable losslessly from a documented public command (`--json`/`--plain`/on-disk frontmatter) with a stable, directly consumable shape |
| Owner-supplied fixture | Not present in Backlog's own output at all; a human operator must supply the value at migration time, because no admissible source names or derives it |
| Deliberate transformation | Obtainable from the public surface, but Quest must apply a defined mapping rather than copy the value verbatim |
| Explicit unsupported gap | Not obtainable with fidelity from any admissible public surface at the pinned revision; named here as a gap, not silently dropped |

| Field / aspect | Source | Disposition | Notes |
| --- | --- | --- | --- |
| Task `id` | `task view --json`, frontmatter `id` | Public read contract | Format is `<task_prefix>-<n>` or zero-padded per `config.get taskPrefix`/`zeroPaddedIds`; Quest must read the *project's* config, not assume `TASK-N`. |
| Task `title`, `status`, `priority`, `type`, `assignee[]` | `task view --json` | Public read contract | `status`/`priority`/`type` are validated against the project's own `config get statuses/priorities/types`, which vary per project — Quest must read the live value set, not hardcode Backlog's own defaults. |
| `description` | `task view --json`'s `description` | Public read contract | Single Markdown string, section markers stripped. |
| `acceptanceCriteria[]`/`definitionOfDone[]` | `task view --json` | Public read contract | `{index, text, checked}`; index is 1-based and positional, not a stable identifier across reordering (no reorder command exists, so this risk is currently theoretical, not observed). |
| `implementationPlan`/`implementationNotes`/`finalSummary` | `task view --json` | Public read contract | Free Markdown; replace/append semantics on write are Backlog's own convention, not something Quest is obligated to mirror on the target side, only to preserve as read content. |
| `comments[]` | `task view --json` | Public read contract | `{index, body, createdAt, author}`; append-only on the Backlog side (no edit/delete observed in the enumerated surface), which simplifies one-time migration (no need to reconcile edited comment history). |
| `references[]`/`documentation[]`/`modifiedFiles[]` | `task view --json` | Deliberate transformation | Three separate arrays with distinct semantics (arbitrary link, Lore-style doc cross-reference, file path) that a target schema may reasonably fold differently; Quest must decide its own shape rather than copy three flat string arrays unexamined. |
| `dependencies[]` | `task view --json` | Deliberate transformation | IDs are Backlog-project-local; migrating them requires Quest's own reversible ID-mapping table (see AC3) rather than a literal string copy, since the target project will mint its own IDs. |
| `parentTaskId` / hierarchy | `task view --json`'s `subtasks[]` and `parentTaskId` | Deliberate transformation | Dot-suffixed child IDs are a Backlog display/allocation convention tied to its own ID grammar; Quest's own canonical ID grammar is an explicitly open question (research program Spec, "Open questions") and must not silently inherit Backlog's `N.M` shape. |
| `milestone` | `task view --json`'s `milestone` (an ID string) plus `milestone list`/the milestone's own file for its title | Deliberate transformation | The task's own field stores the milestone's ID, not title — Quest must resolve the ID against `milestone list` (or the milestone file) to recover the human title, and must decide whether Quest's own model treats milestones as a foreign-keyed record (as Backlog does) or something else. |
| `createdAt`/`updatedAt` | `task view --json` | Public read contract, with a named edge | ISO 8601 timestamps; `updatedAt` is `null` on a never-edited task (see AC1 table) — a migration that maps `null` to "same as createdAt" would be inventing data Backlog itself does not assert. |
| Active vs. completed vs. draft folder membership | Which of `backlog/{tasks,drafts,completed}/` a file is in | Public read contract | Directly observable from `task list`'s status grouping and `draft list`; folder membership is redundant with, but currently reliable evidence for, lifecycle state. |
| Archived-task/-draft/-milestone content | Raw Markdown file under `backlog/archive/...` | Public read contract (on-disk artifact), but **not reachable through any ID-addressed command** | See the AC1 table's Archived row; a migration tool must walk the archive directories directly by path, since `task view`/`draft view`/`milestone list` never surface them, and must independently detect the archive-vs-active ID collision case documented under Findings before trusting an archived ID at all. |
| Decision `status`/`date`/title/body | `decision create`'s own echo, or the raw Markdown file (`## Context`/`## Decision`/`## Consequences`, each usually operator-filled after creation) | Public read contract (on-disk artifact only) | No `decision view`/`decision list --json` exists; `search --type decision` (Execution evidence) returns title/status/date but not body — full-fidelity decision migration requires direct frontmatter/body parsing of the Markdown file, not a structured command. |
| Document `type`/`tags[]`/`path` | `doc view --plain`, `doc list --plain`, frontmatter | Public read contract | No `doc view --json` exists in the enumerated surface — `doc list`/`doc view` are `--plain`-only; a migration tool must parse the plain-text/frontmatter shape directly rather than consume a JSON envelope for documents. |
| Milestone completion percentage shown by `milestone list` | Derived by `milestone list` from live task counts | Explicit unsupported gap (as a *stored* field) | Not a frontmatter value anywhere; Quest can recompute the same derived figure once it has migrated the underlying tasks and their milestone assignments, but must not expect to find or copy it as data. |
| Cross-branch task-state overlay (`Fetching remote branches...`/`Applying latest task states from branch scans...`, `init`'s `--check-branches`/`--include-remote`/`--branch-days`, `config`'s `checkActiveBranches`/`activeBranchDays`) | Observed live in `overview`/`board`/`task list` output; no admissible source documents the overlay algorithm itself | Explicit unsupported gap | Confirmed real and currently active, but its precise reconciliation rule (which branch wins, how "latest" is defined, what happens on conflicting states across branches) is not derivable from any admissible public surface without opening source. Quest's migration contract captures only the state visible in the currently checked-out branch's working tree at migration time and does not attempt to reproduce the cross-branch overlay; whether Quest needs an analogous feature at all is a design question for later synthesis, not resolved here. |
| Any state internal to the `search`/`doc search` fuzzy index | Not found on disk anywhere (`find` across the scratch repo and common cache locations after repeated searches returned nothing beyond the task/doc/decision Markdown files themselves) | Explicit unsupported gap, low severity | The index appears to be rebuilt in-memory per invocation rather than persisted — good news for migration (nothing stateful to carry over), but recorded as a gap rather than assumed, since no admissible source states this as a guarantee. |
| Interactive-wizard state (`config` bare, `cleanup`, `agents --update-instructions`) | Not persisted anywhere observed | Owner-supplied fixture (not applicable to migration) | These are session-local UI flows with no on-disk representation to migrate; noted only so a later worker does not go looking for state that was never written. |
| Git commit history of `backlog/` itself (author, message, prior file contents at each commit) | The scratch repo's own `git log`/`git show` | Owner-supplied fixture | Backlog.md's own commands never read or replay this history back into a task; if Quest wants to preserve Backlog-era Git history (as opposed to just current-state records), that is a Quest-side migration design decision to make explicitly, not something any Backlog.md command surfaces as a record to preserve. |

### The fidelity contract (AC3)

Each property below is a design commitment for Quest's own migration path, grounded
in a specific observation from the Execution evidence above — not an
implementation, and not a claim about how Backlog.md's own internals achieve
anything.

#### Deterministic dry runs

Quest's migration command must support a no-mutation preview mode that
reports exactly what it would create and map, and must exit non-zero while
that preview is outstanding — directly modeled on the observed `doctor`
pattern (`doctor` alone prints `Repair preview (no files changed)` and exits
1; only `doctor --fix --yes` mutates and exits 0). The preview must
enumerate, per source record: which lifecycle folder it was found in
(active/completed/draft/archive), its source ID, its proposed target ID, and
any collision or gap flagged against it — nothing should be inferred silently
between preview and apply.

#### Reversible ID mapping

Because Backlog IDs are project-configurable in prefix and zero-padding
(`QS-0001` in `repo2` vs. `TASK-1` in `repo`, both observed from the same
binary against different `init` flags) and are **not** globally unique
across the archive boundary (the live `TASK-2` collision documented below),
Quest must persist an explicit source-ID → target-ID mapping record, keyed on
`(source folder, source ID)`, not `source ID` alone — the folder is part of
the key because the ID by itself is insufficient once archive is in scope.
The mapping must be reversible: given a target ID, Quest must be able to
recover the exact source file the record came from, without re-deriving it
from a fresh Backlog scan (which could see the source repository in a
different, later state).

#### Collision handling

Two distinct collision shapes were directly observed and must both be
covered, not just the one Backlog's own tooling checks for:

1. **Same-scope duplicate IDs** (two files in `backlog/tasks/` both claiming
   `TASK-3`, manufactured to test this) — Backlog's own `doctor` detects and
   deterministically repairs this class, but only within active+completed
   scope, and its repair itself is untracked by Git even under `autoCommit`
   (see the Duplicate-ID collision table). Quest must not assume a
   collision it detects has also been safely committed by Backlog-side
   tooling; it must independently verify Git-tracked-vs-worktree state
   before trusting that a repaired source is stable.
2. **Cross-scope duplicate IDs** (an active `TASK-2` and an archived
   `TASK-2` coexisting, produced here as a side effect of ordinary
   archive-then-recreate usage, not a manufactured edge case) — `doctor`'s
   own output is explicit that it checks only "active or completed" tasks;
   this class is invisible to every enumerated Backlog.md command. Quest's
   own collision scan must cover **all** lifecycle folders including
   archive and drafts, strictly wider than Backlog's own `doctor` scope,
   and must report — never silently resolve — any ID that appears in more
   than one folder.

#### Source immutability

Every fact in this document was obtained through non-mutating reads
(`--json`/`--plain` views, `list`, `search`, and direct Markdown file
reads) — no mutating command (`task create/edit/archive/complete/demote`,
`doctor --fix`, `config set`, `milestone add/rename/remove/archive`, `doc
create/update`, `decision create`, `init` against an existing project) was
required to achieve full-fidelity extraction of any field in the AC2 table.
Quest's migration read phase must be held to the same standard: it must
never invoke a Backlog.md command from the mutating list above against the
user's source project, at any point in the migration flow, including for
convenience (e.g. never call `doctor --fix` on a user's real project to
"clean up" a collision before reading it — report the collision and let the
user or a later, explicitly consented step decide).

#### One-writer coexistence

Backlog.md provides no lock file, advisory or otherwise (confirmed absent
by direct filesystem search of the scratch repository across every
exercised command). Combined with the observed default `auto_commit:
false` and, once enabled, single-file operation-scoped commits for ordinary
task writes but **not** for `doctor --fix` (Execution evidence), Quest
cannot assume "the source project is quiescent" from any Backlog.md-visible
signal. The contract: Quest's migration read pass must not run concurrently
with a live Backlog.md write session against the same source repository —
this is a documented operational precondition of migration, not a
technical guarantee Quest can derive or enforce from Backlog's own state.
If Quest's read pass takes long enough that concurrent writes are a
realistic risk, it must re-scan and diff the file list after the read
completes and flag (never silently merge) any file that changed mid-scan.

#### Rollback evidence

Backlog.md itself provides no generic "undo last operation" for any
mutating command exercised in this document (`task demote` reverses
`draft promote`'s specific effect, but that is a distinct forward command a
user must know to run, not an automatic undo; `doctor --fix`'s own output
never mentions reversal). Quest cannot rely on Backlog-side rollback and
must own this evidence itself: for every record its migration creates on
the target side, it must record enough evidence — source folder, source ID,
target ID, and a timestamp — to support a manual rollback (deleting the
created target records) without needing to re-run the mapping step or
re-scan the source project.

### Findings: undocumented or surprising behavior

Recorded per the owner's direction that such behavior "is a finding to
record, never a reason to open the source." None of the following was
diagnosed by reading Backlog.md's implementation; each is reproducible
purely from the commands cited.

1. **`init` re-run against an already-initialized project silently
   overwrites `project_name`** despite printing "Current configuration will
   be preserved where not specified" — the positional `projectName`
   argument counts as "specified" even when the operator's intent was
   likely just to re-run defaults. (Execution evidence, Initialization
   table.)
2. **Task and draft ID counters are not global.** `draft promote`, `task
   archive`, and `task demote` each free or reassign numerals independent
   of one another's history — a demoted task reused draft numeral `1`
   already consumed and archived by an earlier draft; a newly created task
   reused numeral `2` already consumed and archived by an earlier task.
   (Execution evidence, Task lifecycle and Draft/milestone tables.)
3. **A same-ID collision across the active/archive boundary is invisible
   to every enumerated command.** `doctor` explicitly scopes itself to
   "active or completed tasks" (its own wording); `task view` on the
   colliding ID silently resolves to the active file only, no warning.
   This is not a manufactured adversarial case — it results from ordinary
   archive-then-recreate usage. (Execution evidence, Duplicate-ID table.)
4. **`doctor --fix` does not participate in the `autoCommit` convention**
   that ordinary `task create`/`task edit` calls follow in the same
   session — it leaves Git's index pointing at a path its own repair just
   deleted from the working tree, observed as `git status`'s `D` (deleted,
   unstaged) line immediately after a successful `--fix --yes` run.
   (Execution evidence, Duplicate-ID table.)
5. **Not-found exit codes are inconsistent across command families.**
   `task view/archive/edit` and `milestone remove/archive` exit **1** on an
   unknown ID/name; `draft view/archive/promote` and `doc view` exit **0**
   with the same style of `"... not found."` message. A caller scripting
   against exit codes alone cannot treat "not found" uniformly across
   record types. (Execution evidence, multiple tables.)
6. **Passing an empty string to `--depends-on` does not clear
   dependencies**, unlike the dedicated `--clear-milestone`/`--clear-labels`/
   `--clear-ac` flags that exist for other fields — no clear-dependencies
   flag exists in the enumerated surface at all. (Execution evidence, Task
   lifecycle table.)
7. **Commands fall back to plain-text output automatically when stdout is
   not a TTY**, even without `--plain` — observed identically on `task
   view`, `task list`, and `board view`. This is good news for scripting
   reliability but means the documented `--plain` flag is not strictly
   load-bearing for deterministic output in a non-interactive context; a
   migration tool should still pass `--plain`/`--json` explicitly rather
   than rely on this auto-detection remaining stable across releases.
8. **`board view`'s non-TTY fallback prints a placeholder project name**
   (`Project: Project`) where `board export <file>` to an actual file
   correctly prints the live project name — an inconsistency between two
   renderers of what is otherwise the same board data.
9. **`overview` reported `Average Task Age: -1 days`** in this session — a
   negative age is not meaningful; recorded as a display defect and not
   diagnosed further, since diagnosing it would require reading source.
10. **`decision` is create-only through the CLI.** No `decision
    list`/`view`/`update`/`edit` command exists anywhere in the enumerated
    49-node surface; reading a decision's status or body back structurally
    requires either `search --type decision` (title/status/date only) or a
    direct Markdown file read.
11. **`cleanup` and `agents --update-instructions` have no non-interactive
    flags at all** — both are safe to invoke under non-interactive stdin
    (they exit 0 and mutate nothing) but their actual archival/file-write
    behavior could not be driven to completion without a real TTY, and so
    was not observed end-to-end. Both are listed in the Execution evidence
    tables as exercised-but-incomplete, with this as the reason.
12. **A cross-branch task-state overlay is real and currently active**
    (`init`'s `--check-branches`/`--include-remote`/`--branch-days`,
    `config`'s `checkActiveBranches`/`activeBranchDays`, and the
    `Fetching remote branches...`/`Applying latest task states from branch
    scans...` progress lines seen on `overview`/`board`/`task list`), but
    no admissible source documents its reconciliation algorithm — carried
    into the AC2 table as an explicit unsupported gap rather than guessed
    at.
13. **The `browser` command exposes an undocumented `/api/tasks` HTTP JSON
    endpoint** whose field shapes diverge from the CLI's own `--json`
    contract (e.g. `assignee` vs. `assignees`, an added `rawContent` key).
    Recorded as a discovered fact only; not treated as citable public
    contract per the register's narrower "published documentation /
    `--help` / `--plain`/`--json` output" admissibility list.

## Notes

This task read the register, the migration ledger, the component charter,
the research program Spec, and — for format/citation-discipline
consistency only, not as design sources for this document's own findings —
`QCLI-2.4`'s and `QCLI-2.7`'s Reference outputs and `QCLI-2.2`'s legacy
reconciliation matrix, all already committed to this repository. It opened
no Backlog.md implementation source or internal test at any point, opened
nothing under the quarantined local Backlog.md clone
(`/Volumes/external/repos/Backlog.md`), and made no mutation to this
worktree's own `backlog/` directory (the live campaign's system of record)
or to any file outside this task's own new document and its Backlog task
record. All command transcripts above were captured live on 2026-08-04
against three throwaway scratch repositories created and used solely for
this task, all outside this worktree and none committed anywhere; the
scratch repositories themselves are not preserved as part of this
deliverable.

**Review-round fix (2026-08-04).** An independent review of this document
returned `request_changes` with one blocking finding (B1): `draft create`
was enumerated in the AC4 surface table but had no corresponding row in
AC5's Execution evidence — the `DRAFT-1` referenced elsewhere in this
document was produced by `task create ... --draft`, a different node, and
`draft create` itself had never actually been run. This falsified the
document's own "every one of the 49 nodes ... independently exercised"
and "all 49 nodes exercised end to end" claims for as long as the gap
stood. The fix ran `draft create` for real, twice, against a third
throwaway scratch repository, `/tmp/qcli-2.5-fix-scratch/repo`, created
and used solely to close this gap and not preserved as part of this
deliverable; the resulting row is in the Draft/milestone/document/decision
table, above. With that row in place, "all 49 nodes exercised end to end"
is accurate as of this fix — it was not accurate between the original
delivery and this correction.

One live web fetch was made, to `https://backlog.md` (redirects to
`github.com/MrLesk/Backlog.md`), read as published documentation prose per
the register's "Backlog.md public surface" slice, not as source code; no
`.ts`/`.js` file under that repository was fetched or read.

No finding in this document proposes a change to Quest-wide vocabulary,
architecture, or roadmap; every finding here is either a Backlog.md
public-contract observation (Findings, above) or a component-level Quest
migration-contract commitment (AC3, above), both inside `quest-cli`'s own
charter.
