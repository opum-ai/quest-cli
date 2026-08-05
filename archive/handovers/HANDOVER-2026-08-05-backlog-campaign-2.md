# Handover — QCLI-11..QCLI-20 design-layer follow-through campaign (waves: 1, tasks: QCLI-12, QCLI-13, QCLI-14, QCLI-15, QCLI-16, QCLI-17)

**Date**: 2026-08-05 | **Grounded against**: `dev` @ `bb70619`, clean, in sync with `origin/dev` | **Campaign doc**: `doc-3` — `backlog/docs/campaigns/doc-3 - Backlog-campaign-tracker-—-QCLI-11..QCLI-20-design-layer-follow-through.md`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli. 1 wave
completed this session, 6 tasks resolved (all Done, campaign label — QCLI-12
through QCLI-17). Queue order confirmed by the user on 2026-08-05; do not
re-ask. The ready set is recomputed live at restore — do NOT hardcode a
"next wave" list.

6 tasks remain in the queue, all To Do: QCLI-11, QCLI-18, QCLI-19, QCLI-20
(positions 7-10 in the original confirmed order) plus QCLI-21, QCLI-22
(positions 11-12, appended after wave 1 — see below). All six write NEW
documents only, or in QCLI-21/22's case each touches its own disjoint
pre-existing document — no authored-file collisions among any of the six.

QCLI-21 and QCLI-22 were drafted by wave 1's integration review, approved by
the user THIS session, and are already filed (not just proposed) — nothing
further needs approval before dispatching them:
  - QCLI-21: reconcile the open component decisions register's "Residual
    items" table and D1 entry, plus one invalidated sentence in the
    contracts graph, against the QCLI-12/13/14/16 corrections.
  - QCLI-22: re-pin three stale exact-SHA register pins (decouple from
    still-correct siblings, don't repoint wholesale) and refresh three
    date-stale self-pin stamps, all in the research source register.

Two validated, reusable merge-conflict dispositions from wave 1, generalize
to any future wave in this campaign:
  1. Backlog task-file YAML frontmatter (assignee/created_date/updated_date)
     conflicting between the orchestrator's dev-side bookkeeping commits and
     a branch's own status edits -> take the branch side wholesale.
  2. Lore-GENERATED files (docs/log.md, docs/index.md, any
     <!-- lore:tasks:begin/end --> managed block) -> these are build
     artifacts, never hand-merge the lines; clear the conflict marker with
     either side, finish the rebase, then run `lore sync` to regenerate
     correctly.
Any OTHER conflict class is NOT pre-validated -- a fresh merger agent must
stop and escalate, not improvise, exactly as wave 1's mergers correctly did
once (on docs/log.md, before that class was validated).
```

## State

| Item | Status |
| ---- | ------ |
| Default branch | `dev` @ `bb70619`, clean, in sync with `origin/dev` |
| Campaign doc | `doc-3`, updated with wave-1 wave-log entry, refreshed frontier, and QCLI-21/22 recorded as filed (approval already given and acted on) |
| Owning Story | `docs/stories/follow-through-on-the-quest-cli-design-layer.md` owns QCLI-12..QCLI-22 (12 linked tasks now, after `lore link` coupled QCLI-21/22 in; aggregate `status: todo` — correct, since 6 of 12 linked tasks are still To Do); `docs/stories/prepare-quest-cli-for-implementation-activation.md` owns QCLI-11 |
| Queue | 6 Done (QCLI-12..17), 6 To Do (QCLI-11, 18, 19, 20, 21, 22), 0 In Progress, 0 blocked |
| Campaign branches | none — all 6 wave-1 branches deleted locally and on origin after merge |
| Worktrees | 6 treehouse slots, **all `available`** — no leases held (pool grew 4→6 during wave 1 acquisition; treehouse auto-expands on demand) |
| Open PRs | none — all 6 wave-1 PRs (#25-#30) merged (squash) and closed |
| Lore gates | `lore check` 38 files 0/0 · `lore validate --strict` 38 files 0/0 6 skipped · `lore orphans` 0/0 |
| Test/build/lint gate | **none exists in this repo** — the Lore gates are the only gates |
| Merged SHAs this session | QCLI-12 `1dd4aa6` (PR #25) · QCLI-13 `d871d32` (PR #26) · QCLI-14 `077d3be` (PR #27) · QCLI-15 `6b78fd0` (PR #28) · QCLI-16 `44a7ed8` (PR #29) · QCLI-17 `fb8e8e3` (PR #30) |
| Filed this session | QCLI-21, QCLI-22 — user-approved follow-ups from the wave-1 integration review, both linked to the owning Story via `lore link` |

## This session's in-flight wave

None. Wave 1 fully merged and settled; nothing to resume.

## Next steps

1. `/backlog-handover restore`. R2's drift check should find nothing: no branches, no held leases, no open PRs, no `In Progress` campaign tasks.
2. Wave 2 is ready to compute live: QCLI-11, QCLI-18, QCLI-19, QCLI-20, QCLI-21, QCLI-22 are all `To Do`, all campaign-labelled, all file-disjoint from each other — expect all six to fit in one wave at the cap of 6, pending live re-verification.
3. No user approval is pending — QCLI-21/22 are already filed, this is not a "check with the user first" situation like it was at the end of wave 1.

## Critical context / traps

- **Two merge-conflict classes are now pre-validated for this campaign** (see the paste-ready prompt above for the exact resolution rules): backlog task-file frontmatter, and Lore-generated files. Both were empirically dry-run and confirmed safe by a disposition reviewer before any worker resolved them live. Reuse these dispositions directly — do not re-escalate for the same shape.
- **A third, unvalidated conflict class will surface eventually and must NOT be improvised past.** Wave 1's first merger correctly stopped and `git rebase --abort`'d when it hit `docs/log.md` before that class was validated — this is the correct behavior for any conflict shape not already covered by an established disposition. Get a fresh disposition call, don't guess.
- **After EVERY merge, run `lore sync` directly on `dev` and commit if it changes anything**, before starting the next branch's rebase. Skipping this step is exactly what caused `dev` to drift mid-wave this session (a squash-merge's log line and the story's managed block both went stale for two merges before being caught and fixed). The wave-loop doc's step g already says to do this; this session under-executed it once and had to backfill.
- **`backlog task edit` settlement commands do NOT auto-commit.** They mutate `backlog/tasks/*.md` in the working tree only. This session lost track of this once (QCLI-12's settlement sat uncommitted through an entire subsequent branch's `git checkout dev`) and had to catch it via `git status` before it could have been silently lost. Commit immediately after every settlement batch, before moving to the next task.
- **`gh pr merge --squash --delete-branch` reliably fails the branch-delete half** when the branch is still checked out in a treehouse worktree (which it always will be, mid-walk). This is expected, not an error — the PR merge itself still succeeds (verify with `gh pr view <N> --json state,mergedAt,mergeCommit`). Delete the branch yourself with `git branch -d` after releasing the worktree, and separately delete the remote branch (`git push origin --delete <branch>`) since `--delete-branch`'s remote-delete half also silently doesn't fire when the local half fails.
- **Named Agent-tool dispatches can hit a pane-infrastructure error** (`herdr pane split ... pane_not_found`) once enough teammate panes have accumulated in a long session. Retrying the identical call with `name` omitted (unnamed/async dispatch) worked around it every time this session. Prefer omitting `name` for merge-queue workers that don't need to be individually addressable mid-task.
- **The register-pin parallel-edit constraint is real and worked as designed.** Any task in this campaign that touches a document the research source register SHA-pins must NOT edit the register itself if another wave-mate owns it that wave — record the pin finding as a follow-up note instead. This produced exactly QCLI-22; if a future wave has multiple members touching register-pinned documents in parallel, expect the same pattern.
- **`backlog task create` heredocs nested inside `$(...)` will syntax-error on macOS's default bash 3.2 if the heredoc body contains an apostrophe**, even with a quoted `<<'EOF'` delimiter (confirmed as a real bash 3.2 parser bug via minimal repro, not a quoting mistake). Workaround used this session: write each description/AC to its own file with the Write tool, then build the command with `--ac "$(cat file)"` — the apostrophes live in the file, never in the script source bash actually lexes.
- **This project files no follow-up without approval — but once approved, file it in the same turn**, don't leave it in a drafted-but-unfiled state across a handover. This session got explicit approval via AskUserQuestion and filed QCLI-21/22 immediately, including `lore link`-ing them to the owning Story and running `lore sync` — a half-finished "approved but not yet filed" state would have been a worse handover than either fully-drafted or fully-filed.
- **Never archive completed work.** No `backlog task archive` / `task complete` on campaign tasks.

## Do not repeat

- **Do not re-run `git checkout dev` (or any command that touches the main checkout's working tree) without first checking `git status --porcelain`.** This session's QCLI-12 settlement went uncommitted for one full branch-merge cycle because the next `git checkout dev` ran without that check first — caught only because the checkout's own output surfaced the modified file. Make the status check a reflex before every checkout, not an occasional habit.
- **Do not assume `gh pr merge --delete-branch`'s failure means the merge itself failed.** It doesn't — `gh pr view --json state,mergedAt,mergeCommit` is the actual source of truth, and this session verified it every time rather than trusting the exit code.
- **Do not treat a merge conflict in `docs/log.md` or a Lore-managed block as something to read and hand-resolve line-by-line.** Both are regenerated build artifacts; the correct move is always "clear the marker, finish the rebase, run `lore sync`" — never inspect the conflicting lines for "the right answer," there isn't one to find by reading.
- **Do not skip the wave-level integration review even when every individual task review came back clean.** This session's six task-level reviews all reached `approve` with no cross-task findings visible to any single one of them — the integration review was the only place that caught the design layer's own tracking tables going stale across four of the six merges. It is not a formality.
- **Do not write `backlog task create --ac`/`-d` arguments as inline heredocs inside `$(...)` on this machine.** See the bash 3.2 apostrophe bug above — use per-field files instead.
