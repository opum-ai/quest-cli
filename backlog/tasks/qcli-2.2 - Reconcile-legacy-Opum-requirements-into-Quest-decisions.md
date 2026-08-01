---
id: QCLI-2.2
title: Reconcile legacy Opum requirements into Quest decisions
status: To Do
assignee: []
created_date: '2026-08-01 17:10'
updated_date: '2026-08-01 17:23'
labels:
  - campaign
  - research
  - requirements
  - legacy
  - clean-room
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
dependencies:
  - QCLI-2.1
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extract product-owned functional intent from approved legacy Opum decisions and task narratives, then classify what survives, changes, or is deferred in Quest. Work only from admitted authored requirements and observable narratives; do not inspect or port legacy implementation source or tests.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A source-attributed matrix covers every admitted legacy decision, specification, guide, task narrative, and prototype review used
- [ ] #2 Each candidate requirement is classified reusable, adapted, superseded, deferred, or rejected against the current Quest, Lore, and Opum boundaries
- [ ] #3 The result preserves supported execution-graph invariants while explicitly rejecting the former product name, repository home, and command namespace
<!-- AC:END -->
