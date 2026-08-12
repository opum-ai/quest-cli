---
id: QCLI-69
title: Reconcile the Quest result-contract ADR with the frozen Opum command contract
status: To Do
assignee: []
created_date: '2026-08-12 13:46'
labels: []
dependencies: []
references:
  - >-
    docs/adr/ratify-the-quest-cli-result-contract-envelope-shape-exit-codes-not-found-and-anomaly.md
  - docs/reference/quest-cli-opum-command-contract-local-obligation.md
  - >-
    https://github.com/opum-ai/opum-doc/blob/dev/docs/specs/opum-command-contract.md
  - QCLI-68
  - opum-doc ODOC-22
type: docs
ordinal: 88000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Before quest-cli implements its result layer, reconcile or explicitly ratify the difference between its accepted Quest-specific result-contract ADR and the shared command contract frozen by opum-doc ODOC-22. The local ADR currently fixes a string schema version, separate kind/outcome fields, outcome-specific payload keys, and a 0/1/2/3/64 exit table; the shared contract freezes a numeric schema version, the {schemaVersion, kind, data, principal} pattern, its shared exit taxonomy, a live kind-registry pattern, and structured diagnostics. QCLI-68 commits the future implementation to the shared pattern, so the two records cannot remain silently inconsistent. This task records a deliberate resolution and its authority; it does not presume whether alignment or an explicitly approved divergence is correct.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The exact differences between the accepted Quest result-contract ADR and the frozen Opum command contract are enumerated across envelope fields and types, payload placement, exit-code meanings, kind registry, diagnostics, and reserved principal handling.
- [ ] #2 A durable, authority-backed ruling either aligns the Quest contract to the shared pattern or explicitly ratifies each retained divergence and identifies the required opum-doc contract amendment or exception; no difference remains implicit.
- [ ] #3 The accepted ADR and every derived Quest contract document affected by the ruling are reconciled consistently, with supersession or amendment provenance preserved rather than silently rewriting history.
- [ ] #4 QCLI-68 remains truthful after reconciliation: before any result-layer implementation ships, quest-cli has one unambiguous contract for its result envelope, exit codes, live kind registry, diagnostics, and reserved wire-form `principal: null`.
- [ ] #5 Principal establishment and authorization enforcement remain explicitly outside this reconciliation unless separately authorized; the task settles only the reserved command-contract field.
- [ ] #6 The future quest-cli conformance-test obligation is updated to enforce the resolved contract, and strict Lore validation/check plus repository diff checks pass.
<!-- AC:END -->
