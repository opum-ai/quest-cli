---
id: QCLI-2.6
title: 'Model Quest Git, filesystem, and concurrency threats'
status: In Progress
assignee: []
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 16:41'
labels:
  - campaign
  - research
  - threat-model
  - git
  - concurrency
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:threat-model'
  - wave-4
dependencies:
  - QCLI-2.2
  - QCLI-2.3
  - QCLI-2.4
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create an implementation-independent threat model for authoritative task and event records coordinated through Git across local worktrees and multiple clones. Derive observable safety and recovery requirements without selecting a physical storage design.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The model covers dirty worktrees, partial writes, retries, duplicate events, aliases, clocks and leases, races, divergence, hostile paths, encoding, case sensitivity, subdirectories, and repository removal
- [ ] #2 Mutation invariants require atomicity, idempotency, conflict detection, operation-owned staging and commits, and zero mutation from read-only commands
- [ ] #3 Real-clone and fault-injection scenarios are specified without inheriting prototype layouts or algorithms
<!-- AC:END -->
