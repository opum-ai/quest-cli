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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ran `lore sync` once, centrally, on the clean dev-branched worktree.

Before (lore check --plain):
  error stories/ratify-the-quest-cli-phase-1-component-decisions.md [status-drift]: status is "in-progress" but the linked tasks recompute to "done" — run `lore sync` to reconcile
  error stories/ratify-the-quest-cli-phase-1-component-decisions.md [managed-block-drift]: the <!-- lore:tasks --> block is stale — run `lore sync` to regenerate it from live task data
  47 files, 2 errors, 0 warnings

After (lore check --plain):
  47 files, 0 errors, 0 warnings

lore validate --strict: 47 files, 0 errors, 0 warnings, 6 skipped (exit 0) — passes.

`lore sync` touched three things:
1. docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md — frontmatter status: in-progress -> done, and the QCLI-28 row in the <!-- lore:tasks --> managed block: "In Progress" -> "Done". This is the intended, in-scope change (AC1/AC3/AC4). Narrative prose untouched.
2. docs/log.md — regenerated to reconcile several merge-commit SHAs that were rewritten by squash-merge since the log's last sync (same class of drift as the historical "chore: regenerate log.md to fix dangling pre-squash SHAs from QCLI-22" commit). This is OUT OF SCOPE for AC3 (repo convention commits log.md separately from task-specific commits — confirmed via `git log -- docs/log.md`). Reverted with `git checkout -- docs/log.md` and NOT committed. Flagging for a future dedicated "chore(docs): sync log.md" commit outside this task.
3. backlog/tasks/qcli-32...md — lore sync's documented "commit backlog/ if dirty" behavior auto-committed the plan I had just recorded via `backlog task edit --plan` (commit bf734a5, "chore(backlog): sync task changes"). Verified this is a long-standing, routine repo convention (22 prior commits with this exact message in history) triggered by ordinary backlog-CLI writes, not a lore-sync side effect on the docs bundle — left as-is, not reverted.

git diff --name-only after sync + revert confirms the working-tree diff is confined to docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md only.
<!-- SECTION:NOTES:END -->
