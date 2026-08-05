---
id: QCLI-24
title: >-
  Author an ADR for the Quest CLI result contract: envelope shape, exit codes,
  not-found convention, and anomaly placement
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 22:37'
updated_date: '2026-08-05 22:52'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Scaffold a new ADR concept via `lore new adr "Ratify the Quest CLI result contract: envelope, exit codes, not-found, and anomaly"` (tags: quest, cli, json, exit-codes, not-found, anomaly, phase-1, cli-contract) so lore generates a conformant frontmatter/section skeleton, mirroring the structure of the existing accepted ADR emit-three-categorical-command-outcomes-over-a-versioned-envelope.md (Status / Context / Decision / Consequences).
2. Write Status: Accepted, citing this Story (owning ruling) and QCLI-18's proposal doc as provenance (AC6).
3. Write Context: summarize QCLI-18's four open items and its own explicit non-decision, and the Kubernetes/Stripe precedent for split kind/outcome fields (grounds AC1's deviation rationale).
4. Write Decision, covering exactly the AC-required content:
   - schemaVersion as literal string \"1\" (AC1)
   - kind and outcome as two separate fields, explicitly deviating from QCLI-18's recommended fused <command>_<outcome-class> form, with the Kubernetes/Stripe split-field alignment stated as the reason (AC1)
   - payload keys result/decline/error (AC2)
   - exit-code table 0/1/2/3(conditional)/64 with meanings (AC2)
   - not-found convention: JSON-first decline envelope with a structured `reason` discriminant, explicitly scoped as Quest's own side only, with the lore-doc boundary half (bare exit-code-and-empty-stdout compatibility) explicitly called out as open/unresolved by this ADR (AC3)
   - anomaly as a distinguishable fourth outcome value with its own exit code (3), explicitly noting that canonizing \"anomaly\" as a product-wide outcome-vocabulary term is a separate, already-routed quest-doc proposal not settled here (AC4)
   - create/edit commands emit the JSON envelope uniformly with every other command (AC5)
5. Write Consequences: knock-on effects (e.g. envelope now has 4 possible payload keys once anomaly is included, exit table finalized for Phase 2 command design, what stays open: lore-doc boundary, D2/D6/D7a/D7b, quest-doc anomaly-vocabulary proposal).
6. Do NOT touch the open component decisions register, contracts graph, roadmap, or D2/D6/D7a/D7b — reconciliation is QCLI-28's job.
7. Verify: `lore validate --strict` on the new file (and bundle) must pass; re-read the file against every AC line-by-line.
8. Run `lore sync` if needed to keep managed blocks (adr/index.md, Story tasks block) coherent, then `lore check` to confirm no drift.
9. Record notes on the interpretation call for AC1's Kubernetes/Stripe justification (brief, factual: split status/type-like dual fields is a documented pattern in both APIs) since the task said not to hunt for more source material.
10. Commit (small logical commits, `Refs: QCLI-24` trailer) and push the branch.
<!-- SECTION:PLAN:END -->
