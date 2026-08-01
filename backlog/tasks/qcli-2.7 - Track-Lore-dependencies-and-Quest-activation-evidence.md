---
id: QCLI-2.7
title: Track Lore dependencies and Quest activation evidence
status: To Do
assignee: []
created_date: '2026-08-01 17:10'
updated_date: '2026-08-01 18:16'
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
Maintain the Quest CLI dependency-status and evidence-consumer matrix for choices that depend on Lore. Link the Lore-wide gate policy in lore-doc and read implementation or immutable release evidence from the owning Lore component, currently lore-cli for the package and command. Observe owners without modifying them or copying their mutable gate criteria.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The matrix links the canonical lore-doc gate and names the owning Lore task, specification, runbook, or immutable evidence for every component dependency
- [ ] #2 Each Quest CLI choice is classified evidence-complete, provisionally researchable, blocked on a named owner result, or requiring owner input
- [ ] #3 The handover requires live owner verification before implementation activation and does not restate the Lore gate
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-01 18:16
---
Authority audit: lore-doc owns gate policy, owning Lore components hold implementation/release evidence, and this task only consumes and maps that evidence.
---
<!-- COMMENTS:END -->
