---
id: QCLI-162
title: >-
  Scope the cross-folder duplicate-id check to the selected family in
  preservation mode
status: Done
assignee:
  - '@jeremy'
created_date: '2026-08-31 15:16'
updated_date: '2026-08-31 15:18'
labels: []
dependencies: []
priority: high
type: bug
ordinal: 191000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up ruling from opag on QCLI-160, 2026-08-31: the backlog_cross_folder_duplicate_id check in previewInternal (src/application/migration/backlog-public.ts) is blanket over the whole source snapshot, checked before any family filtering happens. Discovered live: lore-cli cannot preview family LCLI (its live, to-be-imported family) because LORE-195 and LORE-53 -- two ids in LORE, a family lore-cli has already ruled frozen history that will never be imported as live state -- exist as different tasks in archive/tasks/ vs completed/. Blocking a valid LCLI migration on a legacy defect inside a family the run does not touch is a false gate.

Ruling: scope narrowly. With --source-family given, check cross-folder duplicates only among records in the selected family. Without --source-family (the existing positional/whole-snapshot import path), keep the blanket check exactly as it is today -- the whole snapshot is being imported there, so every record's integrity is load-bearing. Not lore-cli-specific: any repo with a legacy id collision in a superseded family hits the same wall in preservation mode.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 With --preserve-source-ids --source-family <X>, a cross-folder duplicate id whose family is not X does not block the preview
- [x] #2 With --preserve-source-ids --source-family <X>, a cross-folder duplicate id whose family IS X still refuses the preview (the guarantee is not silently dropped inside the selected family)
- [x] #3 Without --preserve-source-ids, the blanket cross-folder duplicate check is unchanged -- any duplicate anywhere in the snapshot still refuses
- [x] #4 Test proves the fix directly (e.g. a source fixture where a non-selected family has a cross-folder duplicate and the selected family does not)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: previewInternal now filters snapshot.crossFolderDuplicateIds by family (via the existing sourceFamily helper) when preserveSourceIds is given, before deciding whether to refuse; unchanged (blanket) when it is not. Minimal, no transitive/closure pass over cross-family references.

lore-cli independently measured whether that's actually safe (unprompted, via opag): across all 415 LCLI frontmatter blocks, zero structured references (parent_task_id/dependencies/labels/blocks) point into LORE -- only 5 free-text prose mentions and 1 test-fixture string, none of them resolvable links. Confirms a plain per-family filter is correct and sufficient; no closure/reachability pass needed.

Verified: typecheck/lint/format/layer-check clean; full bun test suite 389 pass/0 fail; three new e2e tests (backlog-preserve-source-ids.test.ts) proving AC1-3 directly with a genuine cross-folder duplicate fixture (same id in tasks/ and archive/tasks/, different titles). lore-cli has offered to re-run their live LCLI preview once this lands and opag has taken them up on it, so independent confirmation against the actual repo that motivated this follows from the data owner rather than from me.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Scoped the cross-folder duplicate-id check to the selected family: with --preserve-source-ids --source-family <X>, a duplicate outside X no longer blocks the preview; a duplicate inside X still refuses; without the flags, the blanket whole-snapshot check is unchanged. Verified with three new e2e tests plus the full suite (389 pass/0 fail). lore-cli independently confirmed the narrow per-family filter needs no transitive closure pass -- zero structured LCLI->LORE references exist in their real data.
<!-- SECTION:FINAL_SUMMARY:END -->
