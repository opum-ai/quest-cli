---
id: QCLI-97.3
title: Restore Quest planning and operations parity commands
status: To Do
assignee: []
created_date: '2026-08-17 06:06'
updated_date: '2026-08-17 06:07'
labels:
  - quest-0.1
  - parity
  - operations
  - 'doc:stories/deliver-quest-cli-0-1-0'
dependencies: []
documentation:
  - docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md
  - docs/stories/deliver-quest-cli-0-1-0.md
parent_task_id: QCLI-97
priority: high
type: feature
ordinal: 117000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Restore the missing Backlog.md planning, diagnostics, and operator command groups under the agreed parity boundary, excluding only separate document management.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Quest implements or owner-explicitly excludes milestones, decisions, board, overview, doctor, cleanup, browser, and complete search coverage excluding separate document CRUD
- [ ] #2 Each delivered command has deterministic JSON/plain behavior, safe mutation boundaries, and CLI conformance tests
- [ ] #3 Search includes the non-document records promised by the accepted parity boundary and distinguishes unsupported queries explicitly
- [ ] #4 Operational commands preserve unrelated worktree state and provide dry-run or confirmation behavior where mutations are material
<!-- AC:END -->
