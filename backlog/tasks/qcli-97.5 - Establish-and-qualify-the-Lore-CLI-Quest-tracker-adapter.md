---
id: QCLI-97.5
title: Establish and qualify the Lore CLI Quest tracker adapter
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-17 06:07'
updated_date: '2026-08-26 03:10'
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
2026-08-26 exact-dev RC provenance build (correlation b7766e120c7346b6a0bacb284cda5992, lease 6f4625c4ed74bc6f0d22c305372a6d9e returned available): durable candidate staged at /Volumes/external/.opum-candidates/opum-doc-qualification-2026-08-26/final-quest-01456d7 from merged dev 01456d7d8c4fe74c1e413a84b5cfdd81c12a2779 — root + six 0.2.7 platform tarballs, self-consistent sha256.txt (shasum -c OK), package-metadata.json with computed npm integrity/shasum per tarball, manifest contract + status-flow evidence, isolated darwin-arm64 packed-install smoke. No npm publish, no tags, no PR (no source defect found). QCLI-97.5 remains nonterminal pending E2E rows #2-#4.
2026-08-26 supersession: post PR #148 the authoritative 0.2.7 candidate lineage moved to final-quest-11cb1a9 (merged dev 11cb1a9f5f054019e1e6aa67eeea49089c1f24cb); prior final-quest-01456d7 evidence retained for history.
<!-- SECTION:NOTES:END -->
