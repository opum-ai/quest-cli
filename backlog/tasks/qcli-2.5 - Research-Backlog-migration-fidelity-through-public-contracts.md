---
id: QCLI-2.5
title: Research Backlog migration fidelity through public contracts
status: To Do
assignee: []
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 06:00'
labels:
  - campaign
  - research
  - migration
  - backlog
  - clean-room
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:migration'
dependencies:
  - QCLI-2.1
  - QCLI-2.4
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Determine which user-owned Backlog records Quest must preserve and what documented public interfaces can export without inspecting Backlog implementation source or internal tests. Produce a fidelity contract and gaps report, not an importer.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The inventory covers active, completed, archived, draft, hierarchy, dependencies, milestones, lifecycle metadata, plans, criteria, notes, comments, references, timestamps, and final summaries
- [ ] #2 Every field maps to a public read contract, owner-supplied fixture, deliberate transformation, or explicit unsupported gap
- [ ] #3 The contract defines deterministic dry runs, reversible ID mapping, collision handling, source immutability, one-writer coexistence, and rollback evidence
<!-- AC:END -->
