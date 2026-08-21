---
id: QCLI-97.11.3
title: Complete Quest create/edit/list/view/search and status-flow semantics
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-21 19:45'
updated_date: '2026-08-21 21:24'
labels:
  - odoc-63.2
dependencies:
  - QCLI-97.11.2
  - QCLI-97.11.6
parent_task_id: QCLI-97.11
priority: high
type: feature
ordinal: 150000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the complete create/edit/list/view/search/status-flow command semantics for quest-cli: replace/add/remove/clear field operations, deterministic ordering, case-insensitive configured statuses, actor-required atomic writes, stable versioned JSON diagnostics, and fail-loud compatibility behavior. Scope boundary (review-correction ad7dd9c69be34f12bcc1208e0215f9d9 finding 5): this child owns CLI argument parsing, command dispatch, and command-facing diagnostics only; it must not claim relationship persistence/writes (those belong to QCLI-97.11.2); the schema/projection/manifest contract belongs to QCLI-97.11.2; migration mapping/provenance/closure belongs to QCLI-97.11.4.

Ownership (feature-wayfinding gate feature-wayfinding-v2, correlation 1cdd200728ec4d8c8e3342f8a2d235c4):
- quest-cli:src/application/tasks
- quest-cli:src/application/mutations
- quest-cli:test/cli-local-task-repository.test.ts
- quest-cli:test/integration/tasks/cli-semantics.test.ts
- quest-cli:test/contract/cli-process.test.ts
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Edit operations support replace/add/remove/clear with deterministic ordering in results
- [x] #2 Status flow accepts configured statuses case-insensitively and rejects unknown statuses with stable versioned JSON diagnostics
- [x] #3 All writes require an actor and apply atomically; compatibility failures are loud, not silent
- [x] #4 Focused tests cover each semantic group including negative cases
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend dispatchTrackerTaskCommand: full TrackerEditPatch (replace/add/remove/clear with deterministic merge order), case-insensitive configured status resolution for edit/list, unknown-status validation diagnostics, policy-sourced status-flow via new TaskService.lifecycle accessor. 2. Wire the complete advertised flag set in src/cli/main.ts create/edit (boundary finding: CLI parsing lives in src/cli, outside owned surfaces; minimal edits required to make the advertised contract executable). 3. Add test/integration/tasks/cli-semantics.test.ts (new) driving runQuest against a temp QUEST_TASK_STORE; extend cli-process.test.ts flag tables and cli-local-task-repository.test.ts write semantics. 4. bun run check green.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ownership corrected per Controller JIT payload a19bf67e0c5f41f7801c13af10459a4e: .3 now owns src/cli/main.ts and src/cli/commands/task/index.ts (added) in addition to existing src/application/tasks, src/application/mutations, test/cli-local-task-repository.test.ts, test/integration/tasks/cli-semantics.test.ts, test/contract/cli-process.test.ts. New dependency QCLI-97.11.6 (corrective contract closure) added; .3 blocked until .6 settles.

Pre-correction .3 implementation bytes (tasks.ts lifecycle accessor, commands/task dispatch patch builder, main.ts flag wiring, cli-process flag tables, cli-semantics.test.ts) preserved in git stash 'QCLI-97.11.3 pre-correction work' (stash@{0}) on branch feat/qcli-97.10-odoc-63.2-parity-migration; untracked test/integration/tasks/cli-semantics.test.ts retained in worktree. To be reconciled against the corrected contract after QCLI-97.11.6 settles.

QCLI-97.11.6 settled Done at commit cdfe2d5 (settlement 39712bb, feature map delivery 48b0139). .3 is now unblocked: reconcile preserved bytes (stash@{0} + untracked test/integration/tasks/cli-semantics.test.ts) against the corrected contract, then implement the now-complete contract in src/cli/main.ts + src/cli/commands/task/index.ts.

Implementation commit on feat/qcli-97.10-odoc-63.2-parity-migration (base 2d3bdd7). Reconciled preserved pre-correction bytes (former stash@{0}, dropped after reconciliation) against the corrected QCLI-97.11.6 contract: full advertised create/edit flag vocabulary, deterministic replace/add/remove/clear folding, case-insensitive configured statuses routed through the application layer (layer boundary respected), configured-policy status-flow, actor-required writes, stable versioned diagnostics. Verification: bun run check fully green (typecheck, lint, format, layer boundary, 187 pass / 0 fail across 30 files) including the new test/integration/tasks/cli-semantics.test.ts semantic suite.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Quest create/edit/list/view/search and status-flow semantics complete: the CLI now accepts exactly the advertised schema-1 field set with JSON list/check-list/comment/ordinal parsing, folds replace/add/remove/clear deterministically, resolves configured statuses case-insensitively through the application layer, reports the configured lifecycle policy, requires actors for writes, and fails loud with stable versioned JSON diagnostics; concurrent edits serialize into structured conflicts without silent loss.
<!-- SECTION:FINAL_SUMMARY:END -->
