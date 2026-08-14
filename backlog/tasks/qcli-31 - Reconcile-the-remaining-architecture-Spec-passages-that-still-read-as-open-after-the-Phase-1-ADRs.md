---
id: QCLI-31
title: >-
  Reconcile the remaining architecture-Spec passages that still read as open
  after the Phase 1 ADRs
status: Done
assignee:
  - '@jeremy.newhouse'
created_date: '2026-08-06 02:01'
updated_date: '2026-08-14 12:17'
labels:
  - 'cluster:architecture-spec'
  - campaign
  - wave-1
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
dependencies: []
references:
  - docs/specs/quest-cli-architecture.md
  - docs/reference/quest-cli-open-component-decisions.md
  - >-
    docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md
documentation:
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
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
- [x] #1 The Error taxonomy passage (~line 186) no longer states that anomaly's taxonomy placement is an open question for Phase 1; it cites `docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md` (`QCLI-24`) as having placed it, consistent with the Open Questions bullet at ~line 246
- [x] #2 The "Deferred by design" table's D3 row no longer reads "open, no owner" and matches the register's D3 owner cell (`docs/reference/quest-cli-open-component-decisions.md` line 83: Closed; Component — claimed by `QCLI-27`)
- [x] #3 The same table's rows for canonical identifier grammar (D4), authored-record layout, scale target (D5), and envelope shape / exit table are each either removed or annotated as closed with a citation to the ADR that closed them (`QCLI-25`, `QCLI-26`, `QCLI-24`) — while preserving as still-deferred the parts genuinely left open (projection storage or index engine, naming scheme, event schema, command vocabulary, flags)
- [x] #4 The D2 row is left unchanged (the runtime choice remains genuinely blocked)
- [x] #5 lore validate --strict passes
- [x] #6 No content changes beyond the Error taxonomy passage and the "Deferred by design" table; no edits to the register or any ADR, which are already correct
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirmed current state: docs/specs/quest-cli-architecture.md is 264 lines; Error taxonomy passage is now at lines 182-186, Deferred-by-design table at lines 216-225 (no line drift beyond a few lines from the ~ estimates). Register (docs/reference/quest-cli-open-component-decisions.md) confirms: D2 Blocked (leave unchanged per AC4); D3 Closed, Component - claimed by QCLI-27; D4 Closed by QCLI-25 ADR (canonical identifier grammar AND its authored-record layout); D5 Closed by QCLI-26 ADR (scale target). Contract-level table confirms envelope shape and exit-code table Closed by QCLI-24, while Git-mutation naming scheme/event schema, projection storage/index engine, and CLI command vocabulary/flags remain genuinely Open.
2. Edit the Error taxonomy passage (~line 184-186): replace the trailing clause 'and where it lands in the taxonomy is an open question for Phase 1' with a citation to the QCLI-24 ADR placing anomaly as a distinguishable fourth outcome value, phrased consistently with the Open Questions bullet at ~line 247.
3. Rework the Deferred-by-design table (~lines 216-225): leave the D2 row verbatim (AC4). Fix the D3 row to read closed/Component-claimed-by-QCLI-27 (AC2). Split the D4 row (canonical identifier grammar) and the authored-record-layout row so the now-closed pieces (grammar + authored-record layout, both closed by QCLI-25) are annotated as closed with a citation, while naming scheme and event schema remain listed as open under the Git mutation contract items (AC3). Split the D5 row similarly: scale target closed via QCLI-26 citation; projection storage/index engine kept as an open deferred item under the projection contract. Split the CLI row similarly: envelope shape/exit table closed via QCLI-24 citation; command vocabulary/flags kept open under the CLI contract items. Leave the D7a archival row and the locking-primitive/merge-strategy row unchanged (genuinely still open, not in scope).
4. Since this Spec file has no lore-managed <!-- lore:tasks:begin/end --> blocks (those only appear in Story concepts), edit the prose directly with the Edit tool per the lore skill's guidance to 'author prose outside lore-managed regions'; do not run lore sync (explicitly out of scope, deferred to QCLI-32).
5. Run lore validate --strict (and lore validate docs/specs/quest-cli-architecture.md --strict) to confirm the file still passes; re-diff to confirm only the two passages changed and no other file touched.
6. Record notes, commit with 'Refs: QCLI-31' trailer, push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented. Edited docs/specs/quest-cli-architecture.md in two places only, via direct prose edit (file has no lore-managed <!-- lore:tasks:begin/end --> blocks, so no lore CLI subcommand applies to non-managed prose per the lore skill/instructions):

1. Error taxonomy passage (now ~lines 182-187): replaced 'and where it lands in the taxonomy is an open question for Phase 1' with a citation to docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md (QCLI-24), matching the Open Questions bullet's phrasing.

2. 'Deferred by design' table (now ~lines 218-232): D2 row left byte-for-byte unchanged (AC4). D3 row rewritten to 'closed; Component, claimed by QCLI-27' matching the register's D3 owner cell (AC2). Split the D4 row into 'Canonical identifier grammar, authored-record layout' (closed, cites QCLI-25's ADR title which explicitly covers both) vs. a separate still-open 'Naming scheme, event schema' row under Git mutation contract open items. Split the old D5 row into a still-open 'Projection storage or index engine' row (Projection contract open items) vs. a closed 'Scale target' row citing QCLI-26's ADR. Split the old CLI row into a still-open 'Command vocabulary, flags' row (CLI contract open items) vs. a closed 'Envelope shape, exit table' row citing QCLI-24's ADR (AC3). Locking-primitive/merge-rebase row and Archival (D7a) row left unchanged — genuinely still open, out of scope.

Verification: lore validate --strict run against the whole bundle -> '47 files, 0 errors, 0 warnings, 6 skipped', exit 0. git diff confirms only docs/specs/quest-cli-architecture.md changed (plus this task file itself) — no edits to the register or any ADR (AC6).

Did not run lore sync (out of scope per dispatch, deferred to QCLI-32).

Out-of-scope finding for the dispatcher: none beyond what QCLI-31/32 already anticipated — the register and ADRs read as fully consistent with the Spec's new prose, no other drift observed while reading the Deferred-by-design/contract-level tables end to end.

Verified by reviewer (independent re-check, not on trust): lore validate --strict re-run in-worktree post-rebase -> 47 files, 0 errors, 0 warnings, 6 skipped, exit 0. All 6 ACs confirmed with file/line evidence against the actual diff, the register, and the cited ADRs. Merged as ccb68d1 (PR #47, squash-merged to dev).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reconciled docs/specs/quest-cli-architecture.md's Error taxonomy passage and 'Deferred by design' table with the ratified Phase 1 ADRs: the Error taxonomy passage now cites QCLI-24's ADR for anomaly placement (matching the Open Questions bullet), and the table's D3/D4/D5/envelope rows are split so closed items cite their ADR (QCLI-24/25/26) while genuinely-open items (naming scheme, event schema, projection storage/index engine, command vocabulary/flags) remain listed. D2 left byte-for-byte unchanged. Verified via lore validate --strict (0 errors/warnings) and independently re-confirmed by the reviewer. Two non-blocking findings deferred to the campaign doc's follow-up section, out of this task's AC6 scope fence.
<!-- SECTION:FINAL_SUMMARY:END -->
