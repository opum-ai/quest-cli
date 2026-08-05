---
id: QCLI-28
title: >-
  Reconcile the Quest CLI open component decisions register, contracts graph,
  and delivery roadmap against the Phase 1 ADRs
status: Done
assignee:
  - '@jeremy-newhouse'
created_date: '2026-08-05 22:38'
updated_date: '2026-08-05 23:42'
labels:
  - campaign
  - decisions
  - phase-1
  - tracking-reconciliation
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
  - 'cluster:tracking-reconciliation'
  - wave-2
dependencies:
  - QCLI-24
  - QCLI-25
  - QCLI-26
  - QCLI-27
documentation:
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
type: docs
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-24, QCLI-25, QCLI-26, and QCLI-27 record the owner's Phase 1 rulings (D1, D3, D4, D5, and the CLI result contract) as ADRs/reference documents, but none of them edits the open component decisions register, the component contracts and delivery graph, or the delivery roadmap Spec by design (the same file-contention avoidance the original proposal tasks used). This task closes that gap once all four are merged.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The open component decisions register's D1, D3, D4, and D5 rows, and the 'JSON and exits' contract row's four open items (envelope shape, exit-code table, not-found convention Quest-side, create/edit JSON-uniformity), are each marked closed, citing the specific ADR or reference document that closed it
- [x] #2 The component contracts and delivery graph's corresponding open-items entries are reconciled to match the register
- [x] #3 The delivery roadmap Spec's Phase 1 exit-criteria table reflects each of its nine listed items as closed or explicitly owned, citing the closing document for each
- [x] #4 The reconciliation does not mark closed, and does not imply closed, any item this campaign's owning Story lists as remaining open: the not-found convention's lore-doc boundary half, D2's runtime choice itself, D6, D7a, or D7b
- [x] #5 lore validate --strict, lore check, and lore orphans all report zero after the change
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Register (docs/reference/quest-cli-open-component-decisions.md): mark D1, D3, D4, D5 rows Closed in the Component decisions table, citing QCLI-27's reference doc (D1, D3) and QCLI-25's/QCLI-26's ADRs (D4, D5) respectively; update D2's row to record ownership-only closure by QCLI-27 while keeping the runtime choice itself Blocked; update the matching Detail bullets (D1-D4) with closure notes; update the Spec-open-question mapping table's D2/D3 glosses; add a Status column to the Contract-level open items table and mark the JSON-and-exits envelope/exit-code/create-edit-uniformity rows Closed (QCLI-24), splitting the not-found row into a Closed Quest-side row and an Open lore-doc-boundary row; fix the Residual-items table's stale "D3 unowned"/"still genuinely unfiled" text now that QCLI-27 closed it.
2. Component contracts and delivery graph (docs/reference/quest-cli-component-contracts-and-delivery-graph.md): update the Unresolved component decisions section items 1 (Licensing), 3 (Platform), 4 (ID grammar), 5 (Scale) to Closed with citations; add an ownership-only closure note to item 2 (Runtime) without closing it; update each contract's own "Explicitly open" list (CLI identity, JSON and exits, Git mutation, Migration, Projection) wherever it names an item that is now closed, citing the closing ADR/reference doc, and explicitly keep the not-found convention's lore-doc boundary half open.
3. Delivery roadmap Spec (docs/specs/quest-cli-delivery-roadmap.md): add a "Closed / owned by" column to Phase 1's exit-criteria table citing the closing ADR/reference doc for each of the 9 rows (6 fully closed, not-found marked closed-Quest's-side-only, runtime marked owned-not-closed, anomaly marked closed-at-component-level with the quest-doc vocabulary proposal left open); resolve the stale "Who claims D3" bullet in Open questions.
4. Do not touch D2's runtime choice, D6, D7a, D7b, the not-found lore-doc boundary half, the four wave-1 ADR/reference docs, or the QCLI-18/19/20 proposal docs.
5. Verify: lore validate --strict, lore check, lore orphans all report zero; re-run lore sync if any managed block/status drift is introduced by the QCLI-28 status change. Re-check every AC against the literal file text.
6. Record notes + verification evidence on the task, commit in small logical commits with Refs: QCLI-28, push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented. Edited three files to close the register/graph/roadmap gap against QCLI-24/25/26/27:

1. docs/reference/quest-cli-open-component-decisions.md (fcb814f)
   - Component decisions table: D1, D3, D4, D5 rows marked **Closed**, each citing QCLI-27's ownership record (D1, D3) or the QCLI-25/QCLI-26 ADRs (D4, D5). D2 row kept **Blocked** but its Owner/Unblocked-by cells now cite QCLI-27 for ownership-only closure, explicit that the runtime choice itself is unaffected.
   - D1-D4 Detail bullets updated with matching closure citations.
   - Spec-open-question mapping table and its prose updated (D1/D3/D4/D5 closed; D2 ownership closed, runtime choice still blocked).
   - Contract-level open items table: added a Status column; JSON-and-exits envelope shape, exit-code table, and create/edit-uniformity rows marked Closed (QCLI-24); the not-found row split into a Closed "Quest's own side" row and an Open "lore-doc boundary half" row so the still-open half stays visible.
   - Residual-items section: fixed the now-stale "no task claims the supported-platform matrix" / "still genuinely unfiled" text (D3 is closed by QCLI-27), corrected the count from four to three genuinely-unfiled items, dated and attributed to QCLI-28.

2. docs/reference/quest-cli-component-contracts-and-delivery-graph.md (6f4dc18)
   - "Unresolved component decisions" items 1 (Licensing), 3 (Platform), 4 (ID grammar), 5 (Scale) marked Closed with the same citations as the register. Item 2 (Runtime) gets an ownership-only closure note, explicitly not closing the runtime choice.
   - Each contract's own "Explicitly open" list (CLI identity, JSON and exits, Git mutation, Migration, Projection) updated wherever it named a now-closed item, always preserving the not-found convention's lore-doc boundary half as open.

3. docs/specs/quest-cli-delivery-roadmap.md (a6fc202)
   - Phase 1 exit-criteria table: added a "Closed / owned by" column citing the closing document for all nine listed items — 6 fully closed, not-found marked closed-Quest's-side-only, runtime marked owned-not-closed, anomaly marked closed-at-component-level (product-wide vocabulary canonization stays a separate quest-doc proposal).
   - Resolved the stale "Who claims D3, the platform matrix?" Open Question (struck through, cited QCLI-27).

Untouched, as required by AC4/scope: D2's runtime choice itself (still Blocked), D6, D7a, D7b, the not-found convention's lore-doc boundary half, the four wave-1 ADR/reference docs, and the QCLI-18/19/20 proposal docs.

Verification (run after all edits, before final commit):
- `lore validate --strict` → "47 files, 0 errors, 0 warnings, 6 skipped", exit 0
- `lore check` → "47 files, 0 errors, 0 warnings", exit 0
- `lore orphans` → "orphans: 0 orphan tasks, 0 dangling links", exit 0
- `lore sync` was run once after the status change to In Progress (regenerated docs/log.md and this Story's managed task block/status; committed in a357d12).

Commits: fcb814f (register), 6f4dc18 (contracts graph), a6fc202 (roadmap), 8b4e2f8 (backlog status sync, auto-committed by `lore sync`), a357d12 (log.md/story sync). Branch pushed to origin/fix/qcli-28-tracking-reconciliation.

Out-of-scope findings (not acted on):
- The three ratified proposal docs (QCLI-18/19/20's) still say "nothing accepted here" with no pointer to their ratifying ADRs — per the dispatch brief this is a separate follow-up already awaiting user approval; not touched here.
- The "Proposed component delivery graph (dormant)" Phase 1 row in the contracts-and-delivery-graph doc (its forward-looking dormant proposal table, distinct from the "Explicitly open" lists and "Unresolved component decisions" section this task's ACs target) still frames the JSON envelope/not-found/ID-grammar/license/platform-and-runtime-ownership questions as future "Proposal only" work. Left as-is: that table is a dormant blueprint for a not-yet-authorized future task, not a live open-items list, and editing it was outside this task's three-file scope.

Settlement: reviewer independently re-verified all 5 ACs, opening every cited document to confirm citations were accurate (not just present). AC4 (no false 'closed' on D2's runtime choice, D6, D7a, D7b, or the not-found lore-doc boundary half) was given particular scrutiny given it's the highest-risk criterion — confirmed clean across the register, contracts graph, and roadmap. lore validate --strict / lore check / lore orphans re-run clean (0/0/0). A few low-severity prose/header inconsistencies noted (not blocking); proposed as a possible small follow-up alongside the already-pending stale-proposal-doc-prose item, pending user approval. One mechanical merge-time conflict (frontmatter assignee/updated_date only, between the orchestrator's dispatch-marking commit and the worker's lore-sync commit) resolved directly by the orchestrator during rebase — no content decision involved. Merged via PR #44, squash commit 43bc22e on dev. This is the final task of the Phase-1-ratification campaign (QCLI-24..28) — campaign complete.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reconciled the Quest CLI open component decisions register, the component contracts and delivery graph, and the delivery roadmap Spec's Phase 1 exit-criteria table against the four Phase 1 ADRs/reference docs (QCLI-24: CLI result contract; QCLI-25: D4 identifier grammar; QCLI-26: D5 scale target; QCLI-27: D1 license/provenance, D3 platform/ownership, D2 ownership-only). Marked D1/D3/D4/D5 and the 'JSON and exits' contract's four open items closed with citations to the specific closing document; the delivery roadmap's nine Phase-1 exit-criteria rows now each cite their closing document or explicit owner. D2's runtime choice itself, D6, D7a, D7b, and the not-found convention's lore-doc boundary half were explicitly left open/unresolved throughout, per the owning Story. Verified via lore validate --strict/lore check/lore orphans (all 0/0/0) and independent reviewer re-verification of all 5 ACs, with AC4's no-false-closure check given particular scrutiny. Merged PR #44 (43bc22e). This closes the Phase-1-ratification campaign (QCLI-24..28).
<!-- SECTION:FINAL_SUMMARY:END -->
