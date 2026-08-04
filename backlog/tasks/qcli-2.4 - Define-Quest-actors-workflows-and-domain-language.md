---
id: QCLI-2.4
title: 'Define Quest CLI actors, workflows, and domain-language candidates'
status: To Do
assignee: []
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 06:00'
labels:
  - campaign
  - research
  - domain
  - workflows
  - ux
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:domain'
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
Define the Quest CLI component from human and agent perspectives before local schemas or commands are frozen. Cover component interactions with repositories, workspaces, accountable ownership, delegation, lifecycle gates, delivery evidence, and optional Lore links. Treat any product-wide vocabulary or actor-model change as a proposal to quest-doc.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A component glossary identifies the execution entities, lifecycle concepts, identities, claims, evidence, workspaces, and projections used by the CLI
- [ ] #2 Component actor responsibilities distinguish accountable humans, delegated agents, reviewers, maintainers, Lore, Git, and derived local projections
- [ ] #3 End-to-end CLI workflows identify authoritative writes, derived reads, human gates, failure recovery, and whether Lore is optional or required
- [ ] #4 Any product-wide vocabulary or actor-model change is routed to quest-doc and remains non-normative until accepted there
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-01 18:16
---
Authority audit: this task now produces component-contract candidates and routes Quest-wide language to quest-doc.
---
<!-- COMMENTS:END -->
