---
id: QCLI-37
title: Reconcile the stale 'record layout' status cell at register line 167
status: Done
assignee:
  - '@claude'
created_date: '2026-08-06 16:54'
updated_date: '2026-08-14 12:17'
labels:
  - campaign
  - 'cluster:register-mapping-table'
  - wave-1
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
dependencies: []
documentation:
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
docs/reference/quest-cli-open-component-decisions.md's Spec-open-questions mapping table (a different table from the one QCLI-34 touched) has a cell, around line 167, that lists 'the Git mutation contract items on record layout and event schema' with no status marker, while D4/D5 in the same cell already carry bold **closed**. Now that QCLI-34 closed the 'record layout' item (formerly tracked as 'file layout'), this cell under-reports: it should reflect record layout's closed status while leaving event schema's status (still open) untouched. Surfaced as a proposed follow-up in doc-7 (QCLI-33/34/35 campaign, wave 1) and approved for filing by the user on 2026-08-06.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The mapping-table cell around line 167 of docs/reference/quest-cli-open-component-decisions.md reflects that record layout is closed (citing QCLI-25/QCLI-34 as appropriate)
- [x] #2 Event schema's status within the same cell is left exactly as-is — still open, not touched
- [x] #3 No other row or cell in the table is modified
- [x] #4 lore validate --strict passes with 0 errors and 0 warnings
- [x] #5 lore check reports 0 errors
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Re-read docs/reference/quest-cli-open-component-decisions.md line 162-168 (Spec-open-questions mapping table) to confirm exact current text of the line-167 cell.
2. Edit ONLY that cell: split 'the Git mutation contract items on record layout and event schema' into two clauses -- 'the Git mutation contract item on record layout' marked -- closed (citing QCLI-25 as the closing ADR/task and QCLI-34 as the task that reconciled this cell's terminology), and 'the Git mutation contract item on event schema' left with no status marker (same as before -- still open by omission, matching this table's own convention seen in the D3/D5 cells at lines 165 and 168).
3. Match the table's existing terse citation style (bare backtick task IDs, e.g. line 165's 'D3 -- **closed**, claimed by `QCLI-27`') rather than the fuller ADR-link style used in the separate Contract-level table at line 193.
4. Do not touch line 193 or the Contract-level open items table (QCLI-38's territory), and do not touch any other row of the Spec-open-questions mapping table.
5. Run lore validate --strict and lore check; capture output.
6. git diff to confirm only the line-167 row changed.
7. Append implementation notes with verification evidence.
8. Commit with Refs: QCLI-37 trailer and push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Edited only the line-167 cell (Spec-open-questions mapping table, row for 'Canonical ID grammar, authored-record layout, event schema, and scale target') in docs/reference/quest-cli-open-component-decisions.md.

BEFORE: 'D4 — **closed**; D5 — **closed**; and the Git mutation contract items on record layout and event schema'
AFTER:  'D4 — **closed**; D5 — **closed**; the Git mutation contract item on record layout — **closed** (same decision as D4; `QCLI-25`, reconciled here by `QCLI-34`); and the Git mutation contract item on event schema'

Rationale: split the previously-bundled 'record layout and event schema' clause into two per-item clauses so each can carry its own status, following this same table's existing per-item citation convention (e.g. line 165's 'D3 — **closed**, claimed by `QCLI-27`'). Record layout now carries an explicit **closed** marker citing QCLI-25 (the closing ADR/task, same on-disk-structure decision as D4) and QCLI-34 (the task that reconciled this terminology across the register). Event schema's clause is left with no status marker, exactly as before — still open by omission, matching this table's own convention (see D5's cell at line 168, which also lists open items with no marker).

Scope respected: only the line-167 row of the Spec-open-questions mapping table was touched. Did not touch line 193 or the Contract-level open items table (QCLI-38's territory). git diff confirms the doc's only change is this one line.

VERIFICATION:
- lore validate --strict: '47 files, 0 errors, 0 warnings, 6 skipped', exit 0.
- lore check: '47 files, 0 errors, 0 warnings', exit 0.
- git diff -- docs/reference/quest-cli-open-component-decisions.md shows exactly one line changed.

No out-of-scope findings.

Verified: line 167's cell now explicitly closes 'record layout' citing QCLI-25/QCLI-34, leaves event schema open-by-omission untouched, and no other row/cell was modified (git diff --stat confirmed single line). lore validate --strict and lore check both independently re-run by the reviewer: 47 files, 0 errors, 0 warnings. Merged as 4640ab3 (PR #53). A wave-level integration review subsequently found this cell also needed a naming-scheme clause once QCLI-38 closed it — fixed separately in a narrow follow-up (merged as 098dbe6, PR #55), not part of QCLI-37's own scope.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reconciled the stale line-167 cell in the Spec-open-questions mapping table: split the bundled 'record layout and event schema' clause into two, marking record layout closed (citing QCLI-25/QCLI-34) while leaving event schema open and untouched, matching the table's own citation convention. Reviewer independently re-ran lore validate --strict and lore check (both 0/0) and confirmed scope containment.
<!-- SECTION:FINAL_SUMMARY:END -->
