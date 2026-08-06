---
id: QCLI-39
title: Sync docs/log.md again to close post-wave-1 SHA drift
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-06 16:54'
updated_date: '2026-08-06 20:09'
labels:
  - campaign
  - 'cluster:lore-log-sync'
  - wave-2
dependencies: []
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-35 (doc-7 campaign, wave 1) closed the pre-existing SHA-unreachable drift in docs/log.md, but the log is already one sync behind again by ordinary, expected mechanics: it's missing entries for every commit merged since QCLI-35's own sync (currently at least ce4a130 QCLI-34, 2b30560 QCLI-35 itself, 79166fa and 3509fdc campaign settlement/doc commits, and 0c0d896 handover archival — re-check the actual current gap at execution time rather than trusting this list, since more commits may land on dev before this task runs). Both QCLI-35 reviewers flagged this as expected, ordinary drift, not a defect, and recommended this exact follow-up — the same doc-6 to doc-7 pattern that produced QCLI-35 itself. Surfaced as a proposed follow-up in doc-7 (QCLI-33/34/35 campaign, wave 1) and approved for filing by the user on 2026-08-06.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 lore sync --dry-run is run first to confirm the change set is confined to docs/log.md before writing anything
- [ ] #2 docs/log.md is regenerated via lore sync and contains 0 SHAs unreachable from HEAD
- [ ] #3 No file other than docs/log.md is modified or committed (the task's own backlog record is not 'unrelated work' for this purpose)
- [ ] #4 The change lands as its own commit, not folded into unrelated work
- [ ] #5 lore check reports 0 errors
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Run 'lore sync --dry-run' and inspect output/--json to confirm the change set is confined to docs/log.md only (per AC1).
2. If scope confirmed, run 'lore sync' for real to regenerate docs/log.md.
3. If dry-run shows any other file (besides the documented backlog/ auto-commit exception per QCLI-35 precedent) would change, STOP -- do not run real sync -- record findings in notes and report blocked.
4. Verify via git status/git diff --stat and/or git log that only docs/log.md changed (plus the backlog/ auto-commit, which QCLI-35's notes established is the tool's own documented bookkeeping, not unrelated work under AC3).
5. Verify docs/log.md now contains 0 SHAs unreachable from HEAD: extract all recorded 40-char SHAs and check each with 'git cat-file -e' + 'git merge-base --is-ancestor <sha> HEAD'.
6. Run 'lore check' and confirm 0 errors (AC5).
7. Record notes with dry-run output, real output, before/after unreachable-SHA counts, and scope confirmation, citing QCLI-35's notes for the backlog/ auto-commit precedent.
8. Commit docs/log.md standalone with 'Refs: QCLI-39' trailer (if lore sync did not already commit it); ensure this task's own plan/notes edits land in a separate small commit with 'Refs: QCLI-39', matching QCLI-35's pattern.
9. Push branch chore/qcli-39-log-sha-drift-sync to origin (final action).
<!-- SECTION:PLAN:END -->
