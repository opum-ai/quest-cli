---
id: QCLI-97.5
title: Establish and qualify the Lore CLI Quest tracker adapter
status: To Do
assignee: []
created_date: '2026-08-17 06:07'
updated_date: '2026-08-17 16:26'
labels:
  - quest-0.1
  - parity
  - lore-integration
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies:
  - QCLI-97.2
documentation:
  - docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
parent_task_id: QCLI-97
priority: high
type: feature
ordinal: 119000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make Quest a first-class, explicitly selected tracker backend for Lore CLI. This work spans the public adapter contract and requires coordinated, versioned conformance rather than a hidden local shim.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A versioned, owner-approved Lore-to-Quest tracker adapter contract defines backend selection, binary discovery, read/write result envelopes, actor declarations, and failure behavior
- [ ] #2 Lore can explicitly select an initialized Quest workspace without guessing from task identifiers or mutating an unrelated Backlog.md project
- [ ] #3 Real cross-product conformance tests prove Story-task linking, back-references, synchronization, reads, writes, and error handling against supported published Lore and Quest releases
- [ ] #4 The integration preserves Lore-managed regions and Quest-owned records, with no direct private-storage coupling
<!-- AC:END -->
