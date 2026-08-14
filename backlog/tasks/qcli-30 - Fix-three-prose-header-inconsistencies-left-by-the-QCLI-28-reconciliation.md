---
id: QCLI-30
title: Fix three prose/header inconsistencies left by the QCLI-28 reconciliation
status: Done
assignee:
  - '@claude'
created_date: '2026-08-06 00:29'
updated_date: '2026-08-14 12:17'
labels:
  - campaign
  - 'cluster:reconciliation-cleanup'
  - wave-1
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
dependencies: []
references:
  - docs/reference/quest-cli-component-contracts-and-delivery-graph.md
  - docs/specs/quest-cli-delivery-roadmap.md
  - docs/specs/quest-cli-architecture.md
documentation:
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
priority: low
type: docs
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-28 reconciled the Quest CLI open component decisions register, contracts graph, and delivery roadmap against the Phase 1 ADRs, marking several items Closed. Its reviewer found three residual passages nearby that still read as if those items are open, contradicting the reconciliation that just landed next to them. Proposed by QCLI-28's reviewer during wave 2 of the Phase-1-ratification campaign (recorded in backlog/docs/campaigns/doc-4).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/reference/quest-cli-component-contracts-and-delivery-graph.md's section intro (near line 600) is corrected to reflect that items in the section can be Closed, consistent with the four items already marked Closed just below it
- [x] #2 docs/specs/quest-cli-delivery-roadmap.md's D3 row 'Register entry' cell (near line 123) no longer reads 'currently owned by no task' and is consistent with the register's D3 owner cell
- [x] #3 docs/specs/quest-cli-architecture.md's Open Questions (near lines 236 and 242) no longer ask whether anomaly is a first-class outcome class or where it sits in the taxonomy, since QCLI-24's ADR already answered both at the component level
- [x] #4 lore validate --strict passes
- [x] #5 No content changes are made to the three documents beyond correcting these three passages
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. docs/reference/quest-cli-component-contracts-and-delivery-graph.md (~line 600): rewrite the "Unresolved component decisions (AC3)" intro paragraph so it acknowledges that a category can be Closed (recording a resolution reached elsewhere, e.g. an accepted ADR) in addition to open/awaiting-owner/routed/blocked states, consistent with items 1 (Licensing), 3 (Platform), 4 (ID grammar), and 5 (Scale) already being marked "Status: closed 2026-08-05" just below. Keep the "never resolved by naming it here" point intact (the closure happens via the cited decision record, not by this document).
2. docs/specs/quest-cli-delivery-roadmap.md line 123 (D3 row, "Register entry" cell): replace "D3 — currently owned by no task" with wording consistent with the register's (docs/reference/quest-cli-open-component-decisions.md line 83) actual D3 Owner cell, "Component — claimed by `QCLI-27`" -> "D3 — Component, claimed by `QCLI-27`".
3. docs/specs/quest-cli-architecture.md:
   - Line ~236 ("Proposals routed to quest-doc" bullet): reword "Whether 'anomaly' is a first-class outcome class alongside success, decline, and error" so it no longer poses the component-level question as open (QCLI-24's ADR already answered it: anomaly is a distinguishable fourth outcome value, own exit code/payload key) and narrows the still-open, still quest-doc-routed proposal to product-wide vocabulary canonization only. Cite the ADR (docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md, QCLI-24), mirroring the phrasing already used in the roadmap's Exit table (line 126: "closed, component-level placement ... full product-wide outcome-vocabulary canonization remains a separate quest-doc proposal, not settled here").
   - Line ~242 (Open questions bullet, "Where does an anomaly belong in the outcome taxonomy?"): convert from an open question into a resolved statement citing QCLI-24's ADR placement (distinguishable fourth outcome value, own exit code), since this is now answered at the component level.
4. Verify: `lore validate --strict` (capture full output); `git diff` each of the three files against the pre-change working tree to confirm only these three passages changed.
5. Record notes, commit (Refs: QCLI-30), push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented all three corrections:

1. docs/reference/quest-cli-component-contracts-and-delivery-graph.md (~line 600): rewrote the "Unresolved component decisions (AC3)" intro to acknowledge a category can be **closed** (resolution reached and cited elsewhere), alongside the pre-existing open/awaiting-owner/routed/blocked states — consistent with items 1 (Licensing), 3 (Platform), 4 (ID grammar), 5 (Scale) already marked "Status: closed 2026-08-05" just below. Kept the "never resolved by naming it here" point intact.

2. docs/specs/quest-cli-delivery-roadmap.md line 123 (D3 row, "Register entry" cell): replaced "D3 — currently owned by no task" with "D3 — Component, claimed by `QCLI-27`", matching the register's (docs/reference/quest-cli-open-component-decisions.md line 83) actual D3 Owner cell value ("Component — claimed by `QCLI-27`").

3. docs/specs/quest-cli-architecture.md:
   - Line ~236 (Proposals routed to quest-doc): reworded the "Whether 'anomaly' is a first-class outcome class" bullet so it no longer poses the component-level question as open; cited QCLI-24's ADR as having settled it (distinguishable fourth outcome value, own exit code/payload key), and narrowed the still-open, still-routed proposal to product-wide vocabulary canonization only — phrasing aligned with the roadmap's own "closed, component-level placement ... full product-wide outcome-vocabulary canonization remains a separate quest-doc proposal, not settled here" (roadmap line 126).
   - Line ~242 (Open questions): converted "Where does an anomaly belong in the outcome taxonomy?" into a resolved statement citing QCLI-24's ADR placement, since Phase 1 already placed it.

Verification:
- `lore validate --strict` (whole bundle): "47 files, 0 errors, 0 warnings, 6 skipped", exit 0.
- `git diff` on each of the three files confirms only the three named passages changed — no other content touched (verified by direct diff inspection).
- `lore check` (read-only, run for extra confidence, not the specified gate): reports 2 pre-existing errors in docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md (status-drift + managed-block-drift, "run lore sync to reconcile"). This file was NOT modified by this task's changes (confirmed via `git status`) and the drift is unrelated to the three target docs — it matches the deferred-sync condition already noted in QCLI-24's implementation notes ("full reconciliation deferred to a single post-merge lore sync, done once centrally after QCLI-24/25/26/27 all merge to dev"). Per this task's scope boundary, `lore sync` was deliberately NOT run — it would touch a shared managed file outside this task's three named docs; reporting instead.

Out-of-scope finding (not acted on, reporting per instructions): the pre-existing lore check drift on docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md described above needs a centralized `lore sync` pass; this is exactly the kind of shared-file sync the wave-level integration pass is expected to handle.

Verified by reviewer: all 5 ACs independently confirmed, including cross-checking the D3 owner cell against docs/reference/quest-cli-open-component-decisions.md at its source and the anomaly-taxonomy claim against docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md directly. lore validate --strict re-run clean (47 files, 0 errors, 0 warnings, 6 skipped). Diff confined to the three named docs, single contiguous hunk in architecture.md covering exactly the two named Open Questions. Merged as 735d82d (PR #46, squash, rebased onto QCLI-29's merge).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Corrected three residual passages left inconsistent by the QCLI-28 reconciliation: the component-contracts-and-delivery-graph section intro now accounts for Closed status; the delivery-roadmap D3 register-entry cell now matches the register's actual owner (QCLI-27); and architecture.md's two anomaly-taxonomy Open Questions now reflect QCLI-24's ADR. lore validate --strict passes.
<!-- SECTION:FINAL_SUMMARY:END -->
