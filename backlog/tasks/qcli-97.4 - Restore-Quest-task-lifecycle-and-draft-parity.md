---
id: QCLI-97.4
title: Restore Quest task lifecycle and draft parity
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-17 06:06'
updated_date: '2026-08-17 06:44'
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
- [ ] #1 Quest supports the promised task lifecycle surface, including archive, terminal completion handling, and draft create/list/view/promote/archive behavior
- [ ] #2 Task read/write fields, filters, status transitions, and diagnostics have a documented compatibility map against Backlog.md, with actor requirements preserved where intentionally stronger
- [ ] #3 Archival and retention behavior is decided by the owner or explicitly scoped as a documented compatibility exclusion before implementation
- [ ] #4 Contract, integration, fault, and migration tests prove record preservation and safe recovery
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the record model and repository snapshot with active, completed, archived, and draft lifecycle locations while retaining global canonical task identity. 2. Implement atomic archive, terminal completion, demotion, and draft create/list/view/promote/archive operations under the existing CAS safety model. 3. Add lifecycle-aware command dispatch and manifest entries after serial core integration. 4. Verify move atomicity, retention, ID collision resistance, actor rules, fault recovery, and Backlog migration compatibility.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner approved product-code implementation on 2026-08-17, including Backlog-compatible archival and retention behavior; initial design exploration is underway.

Owner approved Backlog-compatible archival and retention. Exploration recommends stronger global T-N identity with distinct D-N drafts and lifecycle-qualified directories, never Backlog's unsafe cross-folder ID reuse.
<!-- SECTION:NOTES:END -->
