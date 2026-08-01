---
id: QCLI-2.4
title: 'Define Quest actors, workflows, and domain language'
status: To Do
assignee: []
created_date: '2026-08-01 17:10'
updated_date: '2026-08-01 17:23'
labels:
  - campaign
  - research
  - domain
  - workflows
  - ux
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
dependencies:
  - QCLI-2.2
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Define Quest from human and agent perspectives before schemas or commands are frozen, including standalone repositories, explicit multi-repository workspaces, accountable ownership, delegation, lifecycle gates, delivery evidence, and optional Lore links.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A shared glossary defines the execution-graph entities, lifecycle concepts, identities, claims, evidence, workspaces, and projections
- [ ] #2 Actor responsibilities distinguish accountable humans, delegated agents, reviewers, maintainers, Lore, Git, and derived local projections
- [ ] #3 End-to-end workflows identify authoritative writes, derived reads, human gates, failure recovery, and whether Lore is optional or required
<!-- AC:END -->
