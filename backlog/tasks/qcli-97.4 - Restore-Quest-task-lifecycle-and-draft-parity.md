---
id: QCLI-97.4
title: Restore Quest task lifecycle and draft parity
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 06:06'
updated_date: '2026-08-17 14:11'
labels:
  - quest-0.1
  - parity
  - lifecycle
  - drafts
  - 'doc:stories/deliver-quest-cli-0-1-0'
dependencies: []
documentation:
  - docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md
  - docs/stories/deliver-quest-cli-0-1-0.md
parent_task_id: QCLI-97
priority: high
type: feature
ordinal: 118000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Restore the missing task lifecycle and draft command groups required for Backlog.md parity while preserving Quest's actor and integrity model.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Quest supports the promised task lifecycle surface, including archive, terminal completion handling, and draft create/list/view/promote/archive behavior
- [x] #2 Task read/write fields, filters, status transitions, and diagnostics have a documented compatibility map against Backlog.md, with actor requirements preserved where intentionally stronger
- [x] #3 Archival and retention behavior is decided by the owner or explicitly scoped as a documented compatibility exclusion before implementation
- [x] #4 Contract, integration, fault, and migration tests prove record preservation and safe recovery
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the record model and repository snapshot with active, completed, archived, and draft lifecycle locations while retaining global canonical task identity. 2. Implement atomic archive, terminal completion, demotion, and draft create/list/view/promote/archive operations under the existing CAS safety model. 3. Add lifecycle-aware command dispatch and manifest entries after serial core integration. 4. Verify move atomicity, retention, ID collision resistance, actor rules, fault recovery, and Backlog migration compatibility.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner approved product-code implementation on 2026-08-17, including Backlog-compatible archival and retention behavior; initial design exploration is underway.

Owner approved Backlog-compatible archival and retention. Exploration recommends stronger global T-N identity with distinct D-N drafts and lifecycle-qualified directories, never Backlog's unsafe cross-folder ID reuse.

Lifecycle/draft core committed at fd73ade8ec85f58000d76e6b7a7bd6ad251ca516. Full npm test suite passed: 128 tests, 0 failures. Public CLI and manifest routing remain pending serialized integration.

Independent review found lifecycle source-delete/destination-write Promise.all was not crash-safe. The journaled recovery fix committed at d1c2d6254908f8cf65b3ae520ac5e0bd5dccce1b writes destinations first and resumes a valid interrupted operation; focused recovery tests, typecheck, and formatting checks passed. Public lifecycle commands and broader fault coverage remain required.

Integrated lifecycle recovery hardening at dev 7765f15: corrupt journals are validated before replay, retained without deletion, and excluded from record scans. Public lifecycle/draft CLI routing remains serialized.

Independent review corrected public lifecycle and draft actor enforcement at dev 6ceed83: delegated agents now require accountable-human declarations. Route-level conformance coverage remains before finalization.

Final validation: the lifecycle compatibility map now documents implemented routes, deliberately stronger actor and identity rules, and remaining parent-level metadata parity debt. Lifecycle/draft subprocess and repository recovery tests passed; prior full-suite, all-platform package, Lore strict, and diff checks remain valid for unchanged source.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented and qualified canonical task lifecycle and draft parity, including archive, completion, demotion, promotion, retention, actor enforcement, and journaled recovery. The published compatibility map records intentional safety differences and remaining parent-level field gaps.
<!-- SECTION:FINAL_SUMMARY:END -->
