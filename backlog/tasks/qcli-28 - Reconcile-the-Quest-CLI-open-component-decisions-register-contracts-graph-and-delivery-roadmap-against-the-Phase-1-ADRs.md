---
id: QCLI-28
title: >-
  Reconcile the Quest CLI open component decisions register, contracts graph,
  and delivery roadmap against the Phase 1 ADRs
status: In Progress
assignee:
  - '@jeremy-newhouse'
created_date: '2026-08-05 22:38'
updated_date: '2026-08-05 23:26'
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
- [ ] #1 The open component decisions register's D1, D3, D4, and D5 rows, and the 'JSON and exits' contract row's four open items (envelope shape, exit-code table, not-found convention Quest-side, create/edit JSON-uniformity), are each marked closed, citing the specific ADR or reference document that closed it
- [ ] #2 The component contracts and delivery graph's corresponding open-items entries are reconciled to match the register
- [ ] #3 The delivery roadmap Spec's Phase 1 exit-criteria table reflects each of its nine listed items as closed or explicitly owned, citing the closing document for each
- [ ] #4 The reconciliation does not mark closed, and does not imply closed, any item this campaign's owning Story lists as remaining open: the not-found convention's lore-doc boundary half, D2's runtime choice itself, D6, D7a, or D7b
- [ ] #5 lore validate --strict, lore check, and lore orphans all report zero after the change
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
