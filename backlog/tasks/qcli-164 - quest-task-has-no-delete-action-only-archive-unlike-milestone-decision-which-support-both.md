---
id: QCLI-164
title: >-
  quest task has no delete action -- only archive, unlike milestone/decision
  which support both
status: To Do
assignee: []
created_date: '2026-09-02 20:07'
labels:
  - cli
  - tasks
dependencies: []
references:
  - src/cli/main.ts
priority: medium
type: feature
ordinal: 193000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reported via opag/ISSUES.md, verified against source 2026-09-02: src/cli/main.ts's task command dispatch (line 1588) only recognizes complete/archive/demote as verbs; there is no task delete path anywhere in main.ts. milestone and decision, by contrast, both have a real delete action (main.ts:1203-1204, 1308) alongside archive. A probe/throwaway task currently has no way to be removed and must be archived instead, which is semantically wrong for a task that was never meant to persist (e.g. a test task) and pollutes archived history with noise. No ratified doc found deciding this asymmetry deliberately -- QCLI-140 only covers milestone archive rationale (retire without destroying), not why task specifically lacks the delete milestone/decision already have.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Decide and record whether task delete should exist, mirroring milestone/decision's delete semantics, or whether the asymmetry is intentional and should be documented as such (e.g. tasks are audit-significant in a way milestones/decisions are not)
- [ ] #2 If added, task delete follows the same actor/actor-kind declaration and non-mutating-on-failure pattern as milestone/decision delete
- [ ] #3 If declined, the reason is documented somewhere an agent hitting this gap would find it (command-help.ts task entry, or a guide) so the next report doesn't re-discover the same gap
<!-- AC:END -->
