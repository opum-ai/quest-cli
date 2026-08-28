---
id: QCLI-97.11.7
title: Provide revision-guarded atomic task and milestone migration transaction
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-21 23:04'
updated_date: '2026-08-22 00:50'
labels:
  - odoc-63.2
dependencies:
  - QCLI-97.11.3
parent_task_id: QCLI-97.11
priority: high
type: feature
ordinal: 154000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Provide a revision-guarded atomic operation spanning .quest/tasks/** and .quest/planning.json. Bind an immutable operation ID, idempotency, and exact task/milestone fingerprints. Apply task and milestone projections atomically with reciprocal task-to-milestone closure; conflict leaves no half graph. Rollback removes only unchanged migration-created records and names every survivor/conflict. Do not parse Backlog source, map source IDs, or generate user-facing summaries here; those remain QCLI-97.11.4. Focused transaction/conflict/idempotency/rollback tests plus full bun run check pass.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Revision-guarded operation spanning .quest/tasks/** and .quest/planning.json
- [x] #2 Immutable operation ID, idempotency, and exact task/milestone fingerprints
- [x] #3 Atomic task and milestone projection with reciprocal task-to-milestone closure; conflict leaves no half graph
- [x] #4 Rollback removes only unchanged migration-created records and names every survivor/conflict
- [x] #5 No Backlog source parsing, source ID mapping, or user-facing summary generation (deferred to QCLI-97.11.4)
- [x] #6 Focused transaction/conflict/idempotency/rollback tests plus full bun run check pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add MigrationTransactionRepository port to src/ports/backlog-import.ts spanning task + planning revisions. 2. Implement atomic apply/rollback in src/application/tasks/local-task-repository.ts with journal-based recovery. 3. Extend src/adapters/planning/local-planning-repository.ts for transactional participation. 4. Wire in src/cli/composition.ts. 5. Add colocated tests for transaction/conflict/idempotency/rollback. 6. Run bun run check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented MigrationTransactionRepository port and applyTransaction in LocalTaskRepository with atomic task+planning writes, revision guards, and rollback-on-planning-conflict. Added focused tests for atomic apply, conflict, idempotency, and rollback. Full bun run check passes (191 tests).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented MigrationTransactionRepository port and applyTransaction in LocalTaskRepository with atomic task+planning writes, revision guards, and rollback-on-planning-conflict. Added focused tests for atomic apply, conflict, idempotency, and rollback. Full bun run check passes (191 tests).
<!-- SECTION:FINAL_SUMMARY:END -->
