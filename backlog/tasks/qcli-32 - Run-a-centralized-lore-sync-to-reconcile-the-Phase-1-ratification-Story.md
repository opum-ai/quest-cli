---
id: QCLI-32
title: Run a centralized lore sync to reconcile the Phase-1-ratification Story
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-06 02:01'
updated_date: '2026-08-06 03:56'
labels:
  - 'cluster:lore-sync'
  - campaign
  - wave-2
  - in-review
dependencies:
  - QCLI-31
references:
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
priority: low
type: chore
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`lore check` has reported two errors on `docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md` since commit `43bc22e` (predates the doc-cleanup campaign entirely) — a `status-drift` (frontmatter says `in-progress` while its linked tasks QCLI-24..28 all recompute to `done`) and a `managed-block-drift` (stale `<!-- lore:tasks -->` block). This is the deferred centralized sync that QCLI-24's implementation notes anticipated and that QCLI-29 and QCLI-30 each correctly declined to perform from an isolated worktree. It is now safe to run centrally on a stable `dev`, but it is not purely cosmetic: it flips a Story belonging to the prior Phase-1-ratification campaign (doc-4) to `done`, which is a project-state assertion and therefore wants explicit sign-off rather than a silent regeneration. Proposed by wave 1's integration review of the doc-cleanup campaign (recorded in backlog/docs/campaigns/doc-5).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 lore sync is run once, centrally, on a clean dev working tree
- [ ] #2 lore check afterwards reports 0 errors and 0 warnings across the bundle
- [ ] #3 The resulting diff is confined to `docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md` (frontmatter `status` and the `<!-- lore:tasks -->` managed block); any file changed beyond that is reported back rather than committed
- [ ] #4 The Story's narrative prose is not hand-edited — only the tool-regenerated fields change
- [ ] #5 lore validate --strict passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirmed worktree is clean (git status --porcelain empty) on branch chore/qcli-32-lore-sync-phase1-ratification, freshly branched from dev (includes QCLI-31's merge).
2. Read docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md: frontmatter status: in-progress, tasks: qcli-24..28; managed <!-- lore:tasks --> block shows QCLI-28 as "In Progress".
3. Ran `lore check --plain` baseline: 47 files, 2 errors, 0 warnings — status-drift (story says in-progress, tasks recompute to done) and managed-block-drift (stale task table) on the Story file, matching the task description exactly. Confirmed via `backlog task view QCLI-28` that QCLI-28 is actually Done in Backlog (updated 2026-08-05 23:42 UTC), so the recompute is correct and the drift is just stale doc state.
4. Run `lore sync` once, centrally, with no path args (full-bundle sync) per lore instructions sync.
5. Run `git diff --name-only` to confirm the diff is confined to the Story file. If any other file changed, `git checkout -- <file>` to revert it and record exactly what and why in notes.
6. Run `lore check --plain` (expect 0 errors, 0 warnings) and `lore validate --strict` (expect pass) as objective gates.
7. Append notes to QCLI-32 with before/after lore check output and any reverted files.
8. Commit only the Story file with an `Refs: QCLI-32` trailer following repo commit conventions.
9. Push branch chore/qcli-32-lore-sync-phase1-ratification to origin.
<!-- SECTION:PLAN:END -->
