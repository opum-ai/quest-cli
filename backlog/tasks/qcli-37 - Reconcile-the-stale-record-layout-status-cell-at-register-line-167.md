---
id: QCLI-37
title: Reconcile the stale 'record layout' status cell at register line 167
status: To Do
assignee: []
created_date: '2026-08-06 16:54'
updated_date: '2026-08-06 18:09'
labels:
  - campaign
  - 'cluster:register-mapping-table'
dependencies: []
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
docs/reference/quest-cli-open-component-decisions.md's Spec-open-questions mapping table (a different table from the one QCLI-34 touched) has a cell, around line 167, that lists 'the Git mutation contract items on record layout and event schema' with no status marker, while D4/D5 in the same cell already carry bold **closed**. Now that QCLI-34 closed the 'record layout' item (formerly tracked as 'file layout'), this cell under-reports: it should reflect record layout's closed status while leaving event schema's status (still open) untouched. Surfaced as a proposed follow-up in doc-7 (QCLI-33/34/35 campaign, wave 1) and approved for filing by the user on 2026-08-06.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The mapping-table cell around line 167 of docs/reference/quest-cli-open-component-decisions.md reflects that record layout is closed (citing QCLI-25/QCLI-34 as appropriate)
- [ ] #2 Event schema's status within the same cell is left exactly as-is — still open, not touched
- [ ] #3 No other row or cell in the table is modified
- [ ] #4 lore validate --strict passes with 0 errors and 0 warnings
- [ ] #5 lore check reports 0 errors
<!-- AC:END -->
