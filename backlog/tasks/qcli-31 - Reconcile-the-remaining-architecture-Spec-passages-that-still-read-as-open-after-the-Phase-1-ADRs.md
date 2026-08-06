---
id: QCLI-31
title: >-
  Reconcile the remaining architecture-Spec passages that still read as open
  after the Phase 1 ADRs
status: To Do
assignee: []
created_date: '2026-08-06 02:01'
labels:
  - 'cluster:architecture-spec'
dependencies: []
references:
  - docs/specs/quest-cli-architecture.md
  - docs/reference/quest-cli-open-component-decisions.md
  - >-
    docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md
priority: high
type: docs
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-30 rewrote `docs/specs/quest-cli-architecture.md`'s Open Questions to record that QCLI-24's ADR resolved anomaly placement, but its AC5 scope fence confined it to three named passages. Two passages elsewhere in the same file still assert the pre-ratification state, and the file now contradicts itself: the Error taxonomy section (line ~186) still calls anomaly's placement "an open question for Phase 1" while Open Questions (line ~246) calls it resolved, and the "Deferred by design" table (lines ~217-225) still lists D3 as "open, no owner" plus other items QCLI-24/25/26 have since closed. The register and the ADRs are authoritative and already correct; only this Spec's prose lags. `lore validate --strict` passes over the contradiction because it is semantic, not structural. Proposed by wave 1's integration review of the doc-cleanup campaign (recorded in backlog/docs/campaigns/doc-5).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The Error taxonomy passage (~line 186) no longer states that anomaly's taxonomy placement is an open question for Phase 1; it cites `docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md` (`QCLI-24`) as having placed it, consistent with the Open Questions bullet at ~line 246
- [ ] #2 The "Deferred by design" table's D3 row no longer reads "open, no owner" and matches the register's D3 owner cell (`docs/reference/quest-cli-open-component-decisions.md` line 83: Closed; Component — claimed by `QCLI-27`)
- [ ] #3 The same table's rows for canonical identifier grammar (D4), authored-record layout, scale target (D5), and envelope shape / exit table are each either removed or annotated as closed with a citation to the ADR that closed them (`QCLI-25`, `QCLI-26`, `QCLI-24`) — while preserving as still-deferred the parts genuinely left open (projection storage or index engine, naming scheme, event schema, command vocabulary, flags)
- [ ] #4 The D2 row is left unchanged (the runtime choice remains genuinely blocked)
- [ ] #5 lore validate --strict passes
- [ ] #6 No content changes beyond the Error taxonomy passage and the "Deferred by design" table; no edits to the register or any ADR, which are already correct
<!-- AC:END -->
