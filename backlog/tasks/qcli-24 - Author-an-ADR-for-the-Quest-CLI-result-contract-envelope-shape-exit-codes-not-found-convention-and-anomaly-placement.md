---
id: QCLI-24
title: >-
  Author an ADR for the Quest CLI result contract: envelope shape, exit codes,
  not-found convention, and anomaly placement
status: To Do
assignee: []
created_date: '2026-08-05 22:37'
updated_date: '2026-08-05 22:38'
labels:
  - campaign
  - decisions
  - phase-1
  - adr
  - cli-contract
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
  - 'cluster:cli-contract'
dependencies: []
documentation:
  - >-
    docs/reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
type: docs
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-18 proposed the CLI result contract (envelope shape, exit-code table, Quest's own half of the not-found convention, and anomaly placement) but explicitly decided nothing, per that task's own scope. The component owner ruled on all four items in a live session on 2026-08-05, captured in the owning Story. This task records that ruling as an accepted ADR so Phase 1's 'JSON and exits' exit criteria can be closed truthfully.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An accepted ADR records: schemaVersion as the string "1"; two separate fields kind and outcome (not QCLI-18's recommended fused <command>_<outcome-class> form) — the deviation from the recommendation and the reason for it (Kubernetes/Stripe split-field alignment) are stated explicitly, not silently substituted
- [ ] #2 The ADR records payload keys result / decline / error, and the exit-code table 0 (success), 1 (decline/conflict), 2 (error), 3 (anomaly, conditional), 64 (usage error)
- [ ] #3 The ADR records the not-found convention as a JSON-first decline envelope with a structured reason discriminant, Quest's own side only, and explicitly states the lore-doc boundary half (whether a future Lore adapter accepts or requires the bare exit-code-and-empty-stdout pattern) remains open and unresolved by this ADR
- [ ] #4 The ADR records anomaly as a distinguishable fourth outcome value with its own exit code, and explicitly states that fully canonizing 'anomaly' as a product-wide outcome-vocabulary term remains a separate, already-routed quest-doc proposal not settled here
- [ ] #5 The ADR records that create and edit commands emit the JSON envelope uniformly with every other command
- [ ] #6 The ADR names QCLI-18's proposal and the owning Story as the ruling's provenance
- [ ] #7 lore validate --strict passes on the new ADR file
<!-- AC:END -->
