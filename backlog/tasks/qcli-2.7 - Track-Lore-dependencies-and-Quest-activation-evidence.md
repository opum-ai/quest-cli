---
id: QCLI-2.7
title: Track Lore dependencies and Quest activation evidence
status: To Do
assignee: []
created_date: '2026-08-01 17:10'
updated_date: '2026-08-01 17:23'
labels:
  - campaign
  - research
  - lore
  - evidence
  - activation-gate
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
dependencies:
  - QCLI-2.1
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Maintain the evidence matrix for Quest decisions that depend on the unfinished Lore CLI release, including LadybugDB lifecycle and packaging, graph projection, JSON contracts, task links, release targets, and supported platforms. Observe Lore without modifying it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The matrix names current Lore tasks, specifications, runbooks, and immutable release evidence for every dependency
- [ ] #2 Each Quest decision is classified evidence-complete, provisionally researchable, blocked on a named Lore result, or requiring owner input
- [ ] #3 The handover defines exact live checks before any Quest implementation task can activate
<!-- AC:END -->
