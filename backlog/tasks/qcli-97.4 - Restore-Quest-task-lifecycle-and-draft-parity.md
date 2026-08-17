---
id: QCLI-97.4
title: Restore Quest task lifecycle and draft parity
status: To Do
assignee: []
created_date: '2026-08-17 06:06'
updated_date: '2026-08-17 06:07'
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
