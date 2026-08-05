---
id: QCLI-28
title: >-
  Reconcile the Quest CLI open component decisions register, contracts graph,
  and delivery roadmap against the Phase 1 ADRs
status: To Do
assignee: []
created_date: '2026-08-05 22:38'
updated_date: '2026-08-05 22:38'
labels:
  - campaign
  - decisions
  - phase-1
  - tracking-reconciliation
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
  - 'cluster:tracking-reconciliation'
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
