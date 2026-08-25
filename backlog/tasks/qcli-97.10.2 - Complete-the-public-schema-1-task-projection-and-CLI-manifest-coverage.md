---
id: QCLI-97.10.2
title: Complete the public schema-1 task projection and CLI/manifest coverage
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-21 19:06'
updated_date: '2026-08-21 19:21'
labels:
  - odoc-63.2
dependencies:
  - QCLI-97.10.1
parent_task_id: QCLI-97.10
priority: high
ordinal: 149000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the complete public schema-1 task projection for quest-cli: IDs/aliases/lifecycle/status, title/description, labels/assignees, priority/type/ordinal/dates, parent/dependencies/milestone with atomic forward/back references, ordered checked AC/DoD, plan/notes/comments/final summary, references/modified files, and Lore documentation references only (no Quest document store). The schema-1 manifest must advertise every supported public command accurately.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The schema-1 projection covers every field in the ODOC-63.2 outcome list with deterministic ordering
- [ ] #2 Parent/dependency/milestone mutations write forward and back references atomically
- [ ] #3 The manifest and help surface advertise all supported commands; no Quest document store is introduced
- [ ] #4 Focused tests cover each projection field group and atomic reference closure
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend TaskState (src/domain/tasks/tasks.ts): add assignees, references, modifiedFiles, createdAt, updatedAt, finalSummary; convert acceptanceCriteria/definitionOfDone to ordered {index,text,checked} items; keep plan/implementationNotes as ordered string items. 2. Update taskSchema zod + createTask defaults + taskState uniqueness checks. 3. Extend public tracker contract (src/contract/tracker/index.ts) TrackerTask/TrackerSummary/TrackerEditPatch + validData + fixtures (src/contract/tracker/fixtures.ts, fixtures/tracker/v1/conformance.json). 4. Extend CLI dispatch (src/cli/commands/task/index.ts) to pass through new fields with replace/add/remove/clear semantics for list fields. 5. Manifest (src/application/command-contract.ts): advertise new fields/filters on task commands. 6. Migration mapping (src/application/migration/backlog-public.ts): map checked AC/DoD, finalSummary as distinct section, assignees/references/modifiedFiles/dates first-class; stop concatenating finalSummary into implementationNotes. 7. Milestone atomic forward/back refs: task.milestoneId <-> milestone.taskIds written atomically with dangling-edge diagnostics (domain planning + application planning + CLI). 8. Case-insensitive configured status matching in status-flow/list/edit via aliasKey-style case folding. 9. Tests: update test/integration/migration/backlog.test.ts, test/e2e/migration/backlog-qualification.test.ts, test/integration/tasks/tasks.test.ts, test/integration/projection/sqlite-projection.test.ts, test/contract/tracker/*; add focused tests for checked-state round-trip, milestone back-refs, case-insensitive status, clear semantics.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-21: implementation-planner child launch rejected at host permission layer (second occurrence across the campaign; first was lore-context under predecessor correlation). No FMC approval row created; reporting once per capability-mismatch rule. Proceeding with direct bounded reads + primary-applied targeted diffs in the leased worktree; independent two-axis review (standards-reviewer + spec-reviewer) and verify will still run as separate children before delivery.
<!-- SECTION:NOTES:END -->
