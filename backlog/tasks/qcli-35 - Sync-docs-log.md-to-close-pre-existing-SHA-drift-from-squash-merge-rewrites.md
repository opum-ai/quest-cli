---
id: QCLI-35
title: Sync docs/log.md to close pre-existing SHA drift from squash-merge rewrites
status: Done
assignee:
  - '@claude'
created_date: '2026-08-06 10:49'
updated_date: '2026-08-14 12:18'
labels:
  - campaign
  - 'cluster:lore-log-sync'
  - wave-1
  - 'doc:stories/preserve-quest-cli-documentation-campaign-provenance'
dependencies: []
references:
  - docs/log.md
documentation:
  - docs/stories/preserve-quest-cli-documentation-campaign-provenance.md
priority: low
type: chore
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
docs/log.md has drifted from HEAD since its last sync at commit 43bc22e: 4 of its 85 recorded SHAs are unreachable from HEAD, a side effect of squash-merge rewrites on dev. This was surfaced independently by both the QCLI-32 worker and reviewer during the doc-6 campaign (confirmed via a lore sync --dry-run showing the fix is precisely scoped to this one file) and deliberately left untouched to keep QCLI-32 inside its own AC3 scope fence. This task is the standalone regeneration commit that follow-up flagged.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 lore sync --dry-run is run first to confirm the change set is confined to docs/log.md before writing anything
- [x] #2 docs/log.md is regenerated via lore sync and contains 0 SHAs unreachable from HEAD
- [x] #3 No file other than docs/log.md is modified or committed
- [x] #4 The change lands as its own commit, not folded into unrelated work
- [x] #5 lore check reports 0 errors
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Run 'lore sync --dry-run' and inspect output to confirm the change set is confined to docs/log.md only.
2. If scope confirmed, run 'lore sync' for real to regenerate docs/log.md.
3. If dry-run shows any other file would change, STOP — do not run real sync — record findings in notes and report blocked.
4. Verify via git status/git diff --stat that only docs/log.md changed.
5. Spot-check/verify docs/log.md now contains 0 SHAs unreachable from HEAD (sample SHAs via git cat-file -e / git merge-base --is-ancestor, or trust lore sync's regeneration + sample check).
6. Run 'lore check' and confirm 0 errors.
7. Record notes with dry-run output and verification results.
8. Commit docs/log.md standalone with 'Refs: QCLI-35' trailer, following commit conventions.
9. Push branch chore/qcli-35-log-sha-drift-sync to origin.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
lore sync --dry-run (before writing anything): output was 'would update docs/log.md / 1 file changed (dry-run)'; --json confirmed files: [{path: docs/log.md}], filesChanged: 1, backlogCommit: {committed: false, files: []}, orphanedIndexes: []. Change set confirmed confined to docs/log.md; proceeded to real sync per AC1.

Ran real 'lore sync': output 'updated docs/log.md / committed backlog/: 1 file / 1 file changed'. As documented in lore instructions sync and matching this repo's long-standing convention (see QCLI-32's commit 2e57876), lore sync auto-committed backlog/tasks/qcli-35-*.md (dirtied by this task's own earlier 'backlog task edit' status/plan calls) as a separate commit bd3cb93 'chore(backlog): sync task changes' — this is standard lore sync behavior, not part of the docs/log.md regeneration, and is not folded into the docs/log.md commit.

Verification: git status/diff --stat after sync show only docs/log.md modified (9 insertions, 5 deletions across 4 hunks) — no other file touched. Extracted all 86 unique 40-char SHAs recorded in docs/log.md and checked each with 'git cat-file -e' (object exists) and 'git merge-base --is-ancestor <sha> HEAD' (reachable): 86/86 present, 0 missing objects, 0 unreachable from HEAD. 'lore check': 47 files, 0 errors, 0 warnings (exit 0).

Verified by independent reviewer (opus-tier): re-derived all 86 recorded SHAs independently (git cat-file -e + git merge-base --is-ancestor), confirmed 0 unreachable, and confirmed the pre-state had exactly the 4 unreachable SHAs the task description named. AC3 scrutinized deliberately rather than waved through on precedent: the lore sync tool's own documented contract requires committing backlog/ as part of regenerating docs/log.md (AC2), so an absolute reading of AC3 would make AC2 unsatisfiable; examined this repo's QCLI-32 precedent (doc-6 wave-2) and confirmed the project has already adjudicated this exact boundary the same way (docs/ file outside the fence -> revert; the task's own backlog record -> bookkeeping, not a violation). Re-verified again after rebasing onto QCLI-33 and QCLI-34's merges (0 unreachable SHAs still holds); the log is expected to be one wave behind again as a normal consequence, not a defect of this task. Merged as 2b30560 (PR #51, squash).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Regenerated docs/log.md via lore sync (after confirming scope with lore sync --dry-run first), closing 4 pre-existing SHAs left unreachable by squash-merge rewrites since the last sync at 43bc22e; all 86 recorded SHAs are now reachable from HEAD. Verified via lore check (0 errors) and an independently re-derived reachability check by the reviewer, who also scrutinized the AC3 backlog/-auto-commit boundary against this project's own QCLI-32 precedent rather than accepting it on convention alone. Merged to dev as 2b30560.
<!-- SECTION:FINAL_SUMMARY:END -->
