---
id: QCLI-2.3
title: Turn prototype failures into Quest black-box scenarios
status: In Progress
assignee: []
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 14:59'
labels:
  - campaign
  - research
  - regressions
  - prototype
  - clean-room
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:scenarios'
  - wave-3
dependencies:
  - QCLI-2.1
  - QCLI-2.2
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Convert approved prototype dogfood and review findings into independently authored, implementation-neutral Quest acceptance scenarios describing observable inputs, interleavings, results, repository effects, and recovery.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenarios cover lease and heartbeat failures, human gates, read-only purity, recovery, hostile paths, dirty worktrees, canonical IDs, and operation-owned Git effects
- [ ] #2 Each scenario defines preconditions, action or concurrency interleaving, structured result and exit, allowed effects, and recovery checks
- [ ] #3 No prototype test, fixture, source organization, or algorithm is copied or treated as normative
<!-- AC:END -->
