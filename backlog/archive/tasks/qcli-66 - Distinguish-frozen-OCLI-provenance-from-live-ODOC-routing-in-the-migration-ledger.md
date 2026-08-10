---
id: QCLI-66
title: >-
  Distinguish frozen OCLI provenance from live ODOC routing in the migration
  ledger
status: To Do
assignee: []
created_date: '2026-08-10 22:42'
labels:
  - docs
  - provenance
  - odoc
  - follow-up
dependencies:
  - QCLI-64
ordinal: 85000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
opum-doc's own Backlog task-id prefix changed from OCLI to ODOC on 2026-08-09 (a Backlog.md config change, not a repository rename; tracked as ODOC-24 in opum-doc, which recreated 31 tasks 1:1 as ODOC-n and moved the OCLI originals to backlog/completed/ or backlog/archive/tasks/ as immutable provenance).

docs/reference/former-ocli-to-qcli-migration-ledger.md's Former record column intentionally identifies each OCLI id as it stood at the OCLI-to-QCLI component split -- that is this ledger's whole purpose, and its own Preservation rules forbid renaming or duplicating those ids. Most rows (OCLI-1 through OCLI-3.8) are purely historical: frozen predecessor tasks, completed research, or QCLI successor mappings, with no claim about opum-doc's present state.

Three rows differ: OCLI-4, OCLI-5, and OCLI-6 each explain non-adoption with a present-tense claim about where responsibility currently sits ('portfolio authority remains in opum-doc', 'SaaS roadmap work belongs to opum-doc', 'the control task belongs to opum-doc'). Checked directly against opum-doc's Backlog: all three have live counterparts today (ODOC-4 Done, ODOC-5 To Do, ODOC-6 Done). A reader following those present-tense claims would hit a dead OCLI-n reference in opum-doc's own tracker.

This is repository-local work per the ledger's own text ('quest-cli is its own normative owner'); tracked here as QCLI-n and referenced from opum-doc's ODOC-24.3, which supplies the mapping and the reason.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The Former record column is unchanged for every row -- no OCLI id is renamed, duplicated, or removed
- [ ] #2 OCLI-4, OCLI-5, and OCLI-6's disposition text each name their current ODOC id, verified against opum-doc's live Backlog
- [ ] #3 No other row's disposition text changes
- [ ] #4 lore validate --strict and lore check --strict pass unpiped
<!-- AC:END -->
