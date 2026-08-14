---
id: QCLI-66
title: >-
  Distinguish frozen OCLI provenance from live ODOC routing in the migration
  ledger
status: Done
assignee: []
created_date: '2026-08-10 22:43'
updated_date: '2026-08-14 12:17'
labels:
  - docs
  - provenance
  - odoc
  - follow-up
  - 'doc:stories/audit-quest-cli-documentation-authority'
dependencies: []
documentation:
  - docs/stories/audit-quest-cli-documentation-authority.md
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
- [x] #1 The Former record column is unchanged for every row -- no OCLI id is renamed, duplicated, or removed
- [x] #2 OCLI-4, OCLI-5, and OCLI-6's disposition text each name their current ODOC id, verified against opum-doc's live Backlog
- [x] #3 No other row's disposition text changes
- [x] #4 lore validate --strict and lore check --strict pass unpiped
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a dated attributed note after the Details table explaining the opum-doc OCLI->ODOC prefix change (2026-08-09, Backlog.md config change, not a repository rename) and that rows OCLI-4/5/6 below now also name their current ODOC id.
2. Edit the OCLI-4, OCLI-5, OCLI-6 rows to append '(now tracked as **ODOC-N**[, Done])' to each disposition, matching each task's live status in opum-doc's Backlog checked via backlog task view.
3. Leave every other row (OCLI-1, 2, 3, 3.1-3.8) byte-for-byte unchanged.
4. Run lore validate --strict and lore check --strict unpiped in quest-cli; capture file/error/warning counts.
5. Commit with Refs: QCLI-66, present the diff to the user before pushing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified: the Former record column is byte-for-byte unchanged for every row except the three edited (diff reviewed, only additive parentheticals). OCLI-4/5/6 each checked against opum-doc's live Backlog (ODOC-4 Done, ODOC-5 To Do, ODOC-6 Done) before tagging. lore validate --strict and lore check --strict: 49 files, 0 errors, 0 warnings, both before and after merge. Merged as 75d483e (PR #75, squash) into dev.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added (now tracked as ODOC-N) to the three OCLI-4/5/6 rows whose disposition text makes a present-tense claim about opum-doc's current ownership, plus one dated attributed note explaining the OCLI->ODOC prefix change. Every other row is untouched, preserving the ledger's frozen-provenance rule. Verified with lore validate --strict / lore check --strict (49 files, 0/0). Merged as 75d483e.
<!-- SECTION:FINAL_SUMMARY:END -->
