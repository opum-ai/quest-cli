# Changelog

Records start here, at 0.5.0. Earlier releases are documented in
`docs/reference/quest-cli-release-truth.md` and in each release's own PR
history; this file is the forward-looking record.

## 0.6.0

Lockstep with `@opum-ai/lore` 0.6.0, same pairing convention as every release
since 0.5.0. Minor, not patch: new instruction-file targets and a changed
interactive default are user-visible capability, not a breaking change to any
existing flag, envelope shape, or manifest entry -- every scripted
`--target`/`--agent-instructions` path stays byte-identical to 0.5.0,
verified by the existing test suite needing zero edits across all of it.

### Fixed

- `task list --ready` no longer throws `dependency_target_not_found` for the
  whole workspace when a task's `parentId` or dependency points at an
  archived task. `TasksService.listFilteredLocated`'s readiness computation,
  and the standalone `TasksService.ready()`, now resolve the dependency
  graph across every task location (including `archive/tasks`) while still
  respecting the existing archive exclusion for what `--ready` actually
  returns (QCLI-249).
- `task create`'s `--label`/`--doc`/`--alias`/`--assignee`/`--reference`/
  `--modified-file`/`--dependency`, and their `--add-*`/`--remove-*`
  counterparts on `task edit` (plus `--remove-comment`), now reject a
  JSON-array-shaped value as a usage error instead of silently storing the
  whole array string as one malformed entry (QCLI-250).
- `quest init`'s interactive path now presents a multi-select listing every
  supported instruction file -- CLAUDE.md for Claude Code, AGENTS.md for
  Codex/OpenCode/pi/etc., GEMINI.md for Google Antigravity/Gemini CLI --
  instead of hardcoding AGENTS.md with no way to discover `--target claude`.
  A caller can tick zero, one, or more, with nothing pre-checked -- a bare
  Enter writes nothing (QCLI-254 added the initial claude/codex prompt;
  QCLI-255 replaced it with a multi-select per direct user request and
  reversed the initial pre-check-claude default to nothing pre-checked once
  the multi-select removed the forcing function that default was reasoned
  from; QCLI-159 widened the target set to three, confirming against each
  tool's own docs that pi and OpenCode need no dedicated file while
  Antigravity's GEMINI.md genuinely does). `--skill-source plugin` given on
  the same command line as `--agent-instructions` now skips the skill-file
  write, rather than being silently overridden by it; `--target`'s own
  unset default for scripted callers stays `codex`, unchanged, and the
  non-interactive `--target claude|codex|antigravity` flag path is
  untouched by any of this (QCLI-254, QCLI-255, QCLI-159).
- `quest instructions` and `quest agents --update-instructions` deliberately
  stay single-target, recorded rather than left as an unstated gap: `init`
  is the interactive onboarding path; these are maintenance commands driven
  by scripts and CI that already know their target via `--target` (QCLI-159).
- `migration backlog preview`/`apply`'s id-collision error now names both
  causes it can mean -- a positional-renumbering shift (a dotted subtask's
  flattening landing a fresh id on an unrelated sibling's), where
  `--preserve-source-ids --source-family <PREFIX>` genuinely resolves it,
  and a genuine dual claim (the destination workspace already holds the
  exact id an incoming record also claims), where that flag cannot help --
  and says so directly instead of repeating advice that already failed
  (QCLI-256).

## 0.5.0

**The jump from 0.4.x to 0.5.0 is a lockstep version sync with `@opum-ai/lore`
0.5.0, not a breaking change.** From this release on, Quest and Lore move
together at every stacked release: one version number naming the pair. Nothing
in Quest's public contract (envelope shape, manifest, command surface) changed
in a way that would otherwise call for a minor bump on its own.

### Fixed

- `task edit-batch` now reaches completed and archived records instead of
  reporting the misleading `task_not_found` (QCLI-243), closing the same gap
  QCLI-219 fixed for the single-item `task edit` path.
- `task edit` reaches completed and archived records instead of
  `task_not_found` (QCLI-219).
- `quest agents --check` no longer fails CI on a version skew alone: a block
  that differs from the installed CLI only in its embedded version number now
  reports `"version-only"` and exits 0 rather than failing closed on a routine
  patch/minor bump (QCLI-228).
- `quest agents --update-instructions` now removes a leftover Backlog.md
  guidelines block instead of leaving it alongside the current Quest block
  (QCLI-215).

### Added

- Isolated `renumbered` field on `migration backlog preview`'s output
  (`--preserve-source-ids` mode): exactly the mappings a dotted-subtask
  translation actually changed, so a caller no longer has to diff the full
  `mappings` list by hand to see what a migration is about to do (QCLI-168).
- `.github/workflows/promotion-guardrails.yml`: `promotion-is-manual` and
  `main-is-fast-forward-of-dev` back this repository's fast-forward-only
  `dev` → `main` promotion procedure with active CI detection (QCLI-244).

### Documented

- Status and on-disk location are independent by design: `task edit --status
  <terminal>` does not relocate a record, only `task complete`/`task
  archive`/`task demote` do (QCLI-221).
- `task create`'s forward-dependency validation (`dependency_target_not_found`)
  is documented as deliberate, fail-closed behavior (QCLI-62), with a
  two-pass create-then-`--add-dependency` workaround now shown in the
  task-creation guide and hinted at from the CLI error itself (QCLI-163).
- `quest help task edit` now explains 1-based CLI checklist positions versus
  the JSON envelope's 0-based `index`, that removal renumbers everything
  after it, and the exact JSON shapes `--comments`/`--add-comment` and `task
  edit-batch` expect (QCLI-226).
- Closed out the Backlog.md tracker-surface parity triage register: all
  decided gaps re-verified against current source with no drift, and the
  `doc`/`config`/`mcp` exclusion policy now has a citable source (QCLI-134).
