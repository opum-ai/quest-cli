---
id: QCLI-69
title: Reconcile the Quest result-contract ADR with the frozen Opum command contract
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-12 13:46'
updated_date: '2026-08-13 16:40'
labels:
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
dependencies: []
references:
  - >-
    docs/adr/ratify-the-quest-cli-result-contract-envelope-shape-exit-codes-not-found-and-anomaly.md
  - docs/reference/quest-cli-opum-command-contract-local-obligation.md
  - >-
    https://github.com/opum-ai/opum-doc/blob/dev/docs/specs/opum-command-contract.md
  - QCLI-68
  - opum-doc ODOC-22
documentation:
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve the 2026-08-05 Quest-specific ruling as historical provenance and append a dated QCLI-69 amendment that explicitly yields every conflicting wire-contract surface to the frozen ODOC-22 Opum command contract. 2. Reconcile each derived Quest document that currently treats the old schemaVersion, kind/outcome, payload, or exit mapping as live; retain the earlier proposal and historical Story claims as historical records while adding explicit amendment provenance. 3. Strengthen the QCLI-68 local obligation so the future quest-cli conformance test covers the numeric {schemaVersion, kind, data, principal} result envelope, structured diagnostic envelopes, frozen exit taxonomy, live dotted kind registry, output/stream discipline, null principal slot, and deliberate-violation cases without entering principal establishment or authorization enforcement. 4. Couple QCLI-69 to the Phase 1 decision Story, run Lore sync, inspect the complete diff adversarially against all six acceptance criteria and the local ODOC-22 Spec, then run strict Lore validation/check and repository diff checks. 5. Record exact evidence and finalize only if every criterion and gate passes; make local commits only, leaving push, PR, merge, and cleanup for separate authorization.
<!-- SECTION:PLAN:END -->
