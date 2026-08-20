---
id: QCLI-97.5
title: Establish and qualify the Lore CLI Quest tracker adapter
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-17 06:07'
updated_date: '2026-08-19 03:36'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Ground the published Lore and Quest adapter contracts plus current Quest integration surface.
2. Implement only repository-owned adapter/conformance changes and add focused coverage.
3. Run Quest checks and required Lore gates, then produce a package candidate; do not publish.
4. Independently review, integrate to dev, record evidence, and recompute QCLI-97.6 readiness.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Wave A execution started under FMC correlation df87b7e0b26e46109279e10cab14aa49; campaign tracker doc-22. Direct user authorizes eventual npm release, but this correlation defers publication until the later Controller gate.

2026-08-19 live grounding: Quest's public tracker client conformance test passes (3/3). The versioned dependency evidence identifies an external Lore-side blocker: published Lore 0.1.0 has only BacklogAdapter; Quest cannot unilaterally define Lore's Quest binary selection, probe sequence, or write-response handling. QCLI-97.5 therefore stops at a cross-repository owner decision/implementation edge; QCLI-97.6 remains dependency-gated and QCLI-97 cannot settle.
<!-- SECTION:NOTES:END -->
