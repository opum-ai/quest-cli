---
id: QCLI-126
title: >-
  quest init has no interactive setup for project name, project ID, or
  CLAUDE.md/AGENTS.md
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-28 18:50'
updated_date: '2026-08-28 21:32'
labels:
  - cli
  - init
  - onboarding
  - ux
dependencies: []
references:
  - src/cli/main.ts
priority: medium
type: feature
ordinal: 158000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Unlike backlog init and lore init, quest init (src/cli/main.ts, init branch) only accepts --agent-instructions, --json, and --plain. It writes .quest/workspace.toml but never prompts for a project name or project ID, and only touches CLAUDE.md/AGENTS.md when the caller already knows to pass --agent-instructions. New adopters get an unconfigured project with no onboarding path comparable to the other two CLIs in this toolchain.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Running quest init interactively (TTY, no --json/--plain) prompts for the information needed to configure the project, at minimum a project name and project ID.
- [x] #2 quest init offers to create or update CLAUDE.md and AGENTS.md with the Quest managed instructions block without requiring the caller to already know about --agent-instructions.
- [x] #3 Non-interactive usage (--json, --plain, or no TTY) skips prompts and keeps today scriptable, flag-only behavior.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Workspace config schema + read/write (src/ports/workspaces.ts,
   src/adapters/workspaces/local-workspaces.ts, src/application/workspaces/workspaces.ts):
   add WorkspaceConfiguration {schemaVersion, name?, taskIdPrefix?}; initializeWorkspace
   accepts optional {name, taskIdPrefix} and writes them into workspace.toml; add
   readConfiguration(path) to the port, hand-rolled minimal TOML read/write (no new
   dependency - format is fully controlled by us), defaulting taskIdPrefix to "T" and
   name to undefined when absent so every existing/legacy workspace.toml (just
   "schemaVersion = 1") keeps working unchanged.
2. Thread the resolved prefix into nextTaskId's two call sites (task create, draft
   promote) in src/cli/main.ts, defaulting to "T" when QUEST_TASK_STORE bypasses
   workspace resolution entirely or the field is absent. nextDraftId's "D-" prefix is
   out of scope (not part of the approved plan).
3. Add a minimal injectable prompt helper (node:readline/promises against real
   process.stdin/stdout by default) and a separately-testable wizard function that
   takes the prompt function and returns {name, taskIdPrefix, writeInstructions}, so
   the wizard's question order/defaults are unit-testable without a real TTY.
4. Wire into the init branch: new --name and --task-id-prefix flags for scripted use;
   wizard triggers only when stdin+stdout are both TTY and none of --name,
   --task-id-prefix, --agent-instructions, or --json were passed. Any explicit flag
   (or non-TTY, or --json) skips the wizard entirely and keeps today's exact behavior.
5. Update src/application/command-help.ts's "init" entry for the two new flags.
6. Tests: config read/write incl. legacy-file backward compatibility; wizard function
   with a fake prompt; CLI-level flag-driven (non-interactive) path end to end.
7. bun run typecheck / lint / layer:check / format:check / test before opening the PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BLOCKED mid-implementation: task-ID prefix is validated against a hardcoded domain-layer regex, canonicalIdPattern = /^T-[1-9][0-9]*$/ in src/domain/records.ts:14, used across 6 files (domain/records.ts, domain/gates/gates.ts, domain/tasks/tasks.ts, domain/claims/claims.ts, application/tasks/local-task-repository.ts, adapters/claims/local-claim-evidence.ts). Fixing nextTaskId's generation-side prefix (done, working) is NOT sufficient: a task actually created with a custom prefix (e.g. QCLI-1) is then rejected by this validator with 'Invalid canonical id: QCLI-1' on the very next read/write. Confirmed live: quest init --task-id-prefix QCLI then quest task create fails validation. Making the prefix truly configurable needs threading a per-workspace pattern through all 6 files, not a CLI/workspace-config-layer change as scoped. Name prompting and CLAUDE.md/AGENTS.md prompting are implemented and working; only the task-ID-prefix piece is blocked. Paused for user direction before touching the domain layer.

SCOPE ADJUSTED (user-approved): shipped name prompting + CLAUDE.md/AGENTS.md prompting only. Dropped --task-id-prefix flag and wizard question after finding the domain-layer canonicalIdPattern blocker (see prior note); filed QCLI-132 for that separately. AC3 (task-ID prefix at minimum) intentionally left unchecked and out of scope for this task now - superseded by QCLI-132's AC4, which restores it once the domain layer supports it.

Correction to my own bookkeeping: AC1 (name AND project ID/prefix, 'at minimum') is only partially met - name is done, project ID/prefix is not (see the blocker note above) - so AC1 is correctly left unchecked, not AC3. AC3 (non-interactive usage keeps today's exact flag-only behavior) is fully verified by the --name flag end-to-end test and the legacy no-flags test, so it is checked.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
quest init on a real terminal with no flags now prompts for project name (default: current directory name) and whether to write CLAUDE.md/AGENTS.md, then proceeds unchanged. Any explicit flag, --json, --plain, or non-TTY skips the wizard - verified via a --name-flag end-to-end test and the legacy no-flags test, both unaffected. Wizard logic (question order, defaults) is unit tested via an injectable fake prompt (test/contract/init-wizard.test.ts) rather than a real TTY. Workspace config (name, taskIdPrefix) read/write added to the workspace port with backward-compatible defaults for every pre-existing workspace.toml. Task-ID-prefix configurability (the third original ask) is intentionally NOT included - found mid-implementation that the domain layer hardcodes canonicalIdPattern = /^T-[1-9][0-9]*$/ across 6 files, confirmed live that a custom prefix breaks task create; user approved shipping the safe subset now and splitting the domain-layer work into QCLI-132. Merged via PR #165; all 7 CI checks passed.
<!-- SECTION:FINAL_SUMMARY:END -->
