# Handover — doc-12 campaign init: reconcile the campaign stage-state table (waves: 0, tasks: QCLI-51 filed, none dispatched)

**Date**: 2026-08-08 | **Grounded against**: `dev` @ `8f55c56`, clean, in sync with `origin/dev` (0 ahead / 0 behind) | **Campaign doc**: `doc-12` — `backlog/docs/campaigns/doc-12 - Backlog-campaign-tracker.md`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli. 0 waves
completed this session — this was a standalone init, nothing has been
dispatched, implemented, reviewed, or merged. 1 task filed (QCLI-51, status To
Do, labels campaign + cluster:campaign-machinery, 6 ACs). Queue order confirmed
by the user on 2026-08-08; do not re-ask. The owner ruling QCLI-51 needs was
obtained at init and is recorded verbatim in the task's own description — do NOT
re-ask it, and do not re-propose one of the three narrower alternatives that
were offered and declined (they are listed in doc-12). The ready set is
recomputed live at restore — do NOT hardcode a "next wave" list here.

This is a one-task campaign. A single-member wave 1 is the wave builder
correctly degrading to sequential, not a defect.

Traps carried forward from doc-11, all cost real dispatch budget to learn:
subagent returns go missing while the work has in fact completed and pushed —
never re-dispatch on a missing return, verify the worktree's own git state and
review from that. The review gate is mandatory even when reviewer dispatch
fails; run it in degraded mode as an explicit adversarial in-session pass that
re-derives every claim rather than replaying the worker's self-report. Both
lore gates pass on a wrong prose cross-reference, and QCLI-51 is locator-heavy
by nature, so line/section references in its diff need reading, not grepping.
```

## State

| Item | Status |
| ---- | ------ |
| Default branch | `dev` @ `8f55c56`, working tree clean, in sync with `origin/dev` |
| Init commit | `8f55c56` — campaign-scoped, deliberately carries **no** `Refs:` trailer (verified: `%(trailers:key=Refs)` empty), per SKILL.md's Commits exception for init/close/archive commits |
| Campaign doc | `doc-12`, created and fully populated this session |
| Queue | **70 tasks: 69 `Done`, 1 `To Do`** (QCLI-51), 0 `In Progress`, 0 needs-human, 0 blocked |
| QCLI-51 | `To Do`, type `chore`, priority `medium`, labels `campaign` + `cluster:campaign-machinery`, 6 ACs, 0 dependencies |
| Campaign branches | none, local or remote (`git ls-remote --heads origin` shows only `dev` and `main`) |
| Worktrees | 6/6 treehouse pool slots `available`, zero leases held |
| Open PRs | none |
| Active handover | this file (gitignored; `.gitignore:1` already carried `.claude/handovers/`) |
| I3 gitignore setup | no-op — `.gitignore` and `archive/handovers/` already in place, so no setup commit was produced |
| lore | not run this session and not needed — no `docs/` file was touched. doc-11 left `docs/log.md` synced through `ceab348` |

## This session's in-flight wave

None. Nothing was dispatched. No worktree acquired, no branch created, no
review run, no merge performed.

## Next steps

1. `/backlog-handover restore`. R2 should find no drift: no branches, no
   worktrees, no PRs, clean tree at `8f55c56`.
2. R3 will likely be a near no-op, but **still run `lore sync`** — R3 mandates
   it, and doc-11 waves 1 and 2 each found a genuine one-commit lag there. If it
   reports files, gate with `lore check --strict` and commit before dispatching.
   Note this session's own commit `8f55c56` touched only `backlog/`, not
   `docs/`, so a lag is less likely than in doc-11's restores.
3. Wave 1 = QCLI-51 alone. Read its description first — the owner ruling and
   both corrections to doc-11's inherited framing live there, not only in
   doc-12.
4. Settle per the fixed finalization order, then the per-wave `lore sync`
   (`reference/wave-loop.md` section i) even though QCLI-51 touches no `docs/`
   file — the sync is per-wave, not per-file-touched.
5. Expect campaign completion after wave 1 unless the integration review
   surfaces follow-up work the owner approves.

## Critical context / traps

- **QCLI-51 edits the very skill that is executing the campaign.** The worker
  changes `.claude/skills/backlog-handover/SKILL.md` and
  `reference/wave-loop.md` while the orchestrator is following them. Read the
  skill from the orchestrator's `dev` checkout, not from the worker's worktree,
  and do not adopt the branch's proposed rules mid-wave before they merge.
- **The constraint QCLI-51 must not violate**: QCLI-49 established that mid-wave
  task-file label edits are never committed on `<default>` while that task's
  branch is unmerged. A fix that makes `in-review`/`merge-pending` durable by
  committing them on `<default>` mid-wave reintroduces the exact rebase conflict
  QCLI-49 closed. This is AC #5 and the description's closing constraint.
- **doc-11's framing of this defect was wrong twice**, and both corrections are
  already written into QCLI-51's description: an add instruction for
  `merge-pending` *does* exist at `reference/wave-loop.md:130` (what is missing
  is a point of action), and `in-review` sits in the identical never-committed
  position, so two table rows are affected. A worker that re-derives from
  doc-11's original wording instead of the task description will rebuild the
  wrong scope.
- **Three narrower dispositions were offered to the owner and declined**
  (vestigial-and-delete; point-of-action-in-(g); let-the-worker-derive). They
  are recorded in doc-12 so they are not re-proposed as improvements at review.
- **Verify claims about the skill against the file, not against doc-11's
  campaign log.** That log is a record of what was believed at the time; this
  init found it inaccurate on exactly the point the campaign is about.

## Do not repeat

- **Do not take an inherited proposal on the previous campaign doc's word.**
  Doing so here would have filed a task scoped to `merge-pending` alone and
  containing a false premise ("no step anywhere adds it"), leaving the identical
  defect standing in the `in-review` row. The verification that caught this is
  the reason the owner's ruling took the broader shape it did. doc-11's init hit
  the same thing with doc-10's proposals — two campaigns running, two for two.
- **Do not re-ask the QCLI-51 disposition.** It was settled on 2026-08-08 and is
  recorded verbatim in the task description and doc-12. doc-11 lost time twice
  to rulings that existed but were recorded only in a handover's summary rather
  than on the task.
- **Do not re-dispatch a subagent whose structured return never arrived.** Six
  such failures across doc-11's sessions; in several the work had already
  completed *and pushed*. Inspect the worktree's git state and review from that.

Nothing failed this session — no dispatch, merge, or gate was attempted, so
there are no failed approaches specific to doc-12 to record beyond the inherited
ones above.
