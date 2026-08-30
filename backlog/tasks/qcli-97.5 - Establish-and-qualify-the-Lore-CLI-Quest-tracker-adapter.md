---
id: QCLI-97.5
title: Establish and qualify the Lore CLI Quest tracker adapter
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-17 06:07'
updated_date: '2026-08-30 14:03'
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
- [x] #3 Real cross-product conformance tests prove Story-task linking, back-references, synchronization, reads, writes, and error handling against supported published Lore and Quest releases
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

AC3 CLOSED. Real cross-product conformance now exists against SUPPORTED PUBLISHED releases of both products, which is what this criterion asked for and what no earlier run could provide.

opum-cli-e2e rank 1, quest 0.3.0 installed from the registry: 403 rows, 403 PASS, 0 FAIL, 0 BLOCKED. Story-task linking, back-references, synchronization, reads, writes and error handling all covered - contract/lore 39, contract/quest 40, cross-product 20, parity/backlog 39, packaging 42, identity, and the lore lifecycle/retrieval/workspace surfaces.

Both halves are published: @opum-ai/quest 0.3.0 and @opum-ai/lore 0.3.5, each carrying a provenance attestation confirming an OIDC publish.

Scope limits recorded rather than dropped: one host (darwin-arm64); packaging is one target executed plus six artifacts digest-bound, with the native-execution receipt covering execution on the other five; and none of it is soak. AC3 asked for conformance against published releases, not for time-in-use, so it closes on this - but the distinction should not be lost when this run is cited.
<!-- SECTION:NOTES:END -->
