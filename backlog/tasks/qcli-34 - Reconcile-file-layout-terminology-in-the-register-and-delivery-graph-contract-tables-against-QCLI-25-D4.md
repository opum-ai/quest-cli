---
id: QCLI-34
title: >-
  Reconcile 'file layout' terminology in the register and delivery-graph
  contract tables against QCLI-25/D4
status: To Do
assignee: []
created_date: '2026-08-06 10:48'
updated_date: '2026-08-06 10:49'
labels:
  - campaign
  - 'cluster:terminology-reconciliation'
dependencies: []
references:
  - docs/registers/quest-cli-open-component-decisions.md
  - docs/specs/quest-cli-component-contracts-and-delivery-graph.md
priority: low
type: docs
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
quest-cli-open-component-decisions.md (~line 193, register D4 contract table) and quest-cli-component-contracts-and-delivery-graph.md (~lines 431-437) both still list "file layout" as an open item under the Git mutation contract, while register D4's own detail and the QCLI-25 ADR say the authored-record layout is settled. This may be the same concept surviving under two names after QCLI-25 settled it, or it may be a genuinely distinct open item — the QCLI-31 reviewer flagged it as informational/lower-priority precisely because that determination was not yet made. This task makes the determination and reconciles the documents accordingly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The QCLI-25 ADR and register D4 are read closely enough to state definitively whether "file layout" (register + delivery-graph tables) and "authored-record layout" (QCLI-25/D4) denote the same on-disk structure decision
- [ ] #2 If they are the same concept: both open-item listings are updated to reflect that this item is settled (matching D4's status), using consistent terminology with QCLI-25
- [ ] #3 If they are genuinely distinct: both tables retain "file layout" as open but gain a one-line clarifying note distinguishing it from the QCLI-25/D4 authored-record-layout decision
- [ ] #4 No other row in either table is modified
- [ ] #5 lore validate --strict passes with 0 errors and 0 warnings
- [ ] #6 lore check reports 0 errors
<!-- AC:END -->
