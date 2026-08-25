---
id: QCLI-97.10.3
title: Complete Quest create/edit/list/view/search and status-flow semantics
status: To Do
assignee: []
created_date: '2026-08-21 19:06'
updated_date: '2026-08-21 19:07'
labels:
  - odoc-63.2
dependencies:
  - QCLI-97.10.2
parent_task_id: QCLI-97.10
priority: high
ordinal: 150000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the complete create/edit/list/view/search/status-flow command semantics for quest-cli: replace/add/remove/clear field operations, deterministic ordering, case-insensitive configured statuses, actor-required atomic writes, stable versioned JSON diagnostics, and fail-loud compatibility behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Edit operations support replace/add/remove/clear with deterministic ordering in results
- [ ] #2 Status flow accepts configured statuses case-insensitively and rejects unknown statuses with stable versioned JSON diagnostics
- [ ] #3 All writes require an actor and apply atomically; compatibility failures are loud, not silent
- [ ] #4 Focused tests cover each semantic group including negative cases
<!-- AC:END -->
