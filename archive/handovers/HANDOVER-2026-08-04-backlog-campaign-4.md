# Handover — QCLI-2 clean-room research campaign (waves: 3, tasks resolved: 8 of 14)

**Date**: 2026-08-04 | **Grounded against**: `dev @ 48bc40a`, clean, in sync with `origin/dev` | **Campaign doc**: `doc-1` at `backlog/docs/campaigns/doc-1 - Backlog-campaign-tracker.md`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli.

Wave 3 is done: QCLI-2.3 (4ed6ee1), QCLI-2.4 (0d127ee), QCLI-2.11 (3b5cd8c),
QCLI-2.13 (eaa8a0c) all merged and settled Done. A wave-level integration
review then found 6 cross-task issues; 5 were fixed via a 3-branch narrow
follow-up batch (also merged and settled — see the campaign doc's wave-3 log
for the full F1-F6 table). Eight of fourteen subtasks are now Done. No task
is blocked, no escalation is outstanding, nothing is in flight.

ONE ITEM IS AWAITING OWNER APPROVAL — do not dispatch it, do not re-derive it,
just ask: the wave-3 integration review's finding F2 proposes extending
QCLI-2.12 (not yet dispatched) with two new acceptance criteria closing a
register admission-authority coverage gap. Full proposed AC text is in the
campaign doc's "Proposed follow-ups" section. If approved, add the ACs via
`backlog task edit QCLI-2.12 --ac "..."` before QCLI-2.12 is dispatched; if
declined, note the decision and move on — QCLI-2.12 is dependency-clear
either way (QCLI-2.11 is Done).

TWO DECISIONS REMAIN OPEN FROM EARLIER SESSIONS, still not raised with the
owner (carried forward a second time now — please actually ask this time):
1. QCLI-2.8's dependency list was deliberately never widened to include
   QCLI-2.11-2.14, so QCLI-2.8 will inherit defects those tasks corrected
   in already-merged text. `--dep` at edit REPLACES the list, not appends.
2. `docs/runbooks/quest-cli-research-handover.md:25` still lists the remote
   as `salient-data/quest-cli` under Prerequisites — a genuine stale
   reference (not a deliberate supersession record), deferred twice now.

Also read "Campaign conventions learned in wave 3" in the campaign doc — six
new rules, on top of wave 2's six, that each cost real time this wave and
will recur: idle notifications never carry a payload for ANY agent role (not
just reviewers), cross-pool worktree orphans need `treehouse prune --all` or
an explicit `destroy` to find, `lore sync` does NOT auto-commit `docs/` in
this environment (only `backlog/`, only via `link`/`unlink`), and a
squash-merged branch's own log-sync commit goes dangling in `docs/log.md`
EVERY time — run `lore sync` on `dev` once per merge batch, not once per wave.

The ready set is recomputed live — do NOT trust any persisted wave plan.
Frontier hint only: QCLI-2.5, QCLI-2.6, QCLI-2.12, QCLI-2.14 are
dependency-clear with disjoint clusters as of this writing — a full wave
under the size cap, modulo the F2 decision above for QCLI-2.12's scope.

Every worker prompt must still carry the clean-room constraints AND the
per-slice admission rule: docs/reference/quest-cli-research-source-register.md
is the admission authority. Owner rulings 1-9 are in the campaign doc; do not
re-litigate or re-ask them.
```

## State

| Item | Status |
| ---- | ------ |
| Campaign doc | `doc-1`, updated with the wave-3 log, the 6-item integration-review table, the F2 proposal, 6 new conventions |
| Queue | **14 subtasks**; **8 Done** (2.1, 2.2, 2.3, 2.4, 2.7, 2.9, 2.11, 2.13), 6 To Do (2.5, 2.6, 2.8, 2.10, 2.12, 2.14), plus the QCLI-2 parent epic |
| Waves run | 3 (plus a 3-branch narrow follow-up batch after wave 3) |
| In flight | None — all 7 treehouse worktrees used this session returned to the pool (verified via `treehouse status --json`: all 4 in pool `f11e72` show `available`, no lease); all branches deleted local **and** remote for all 7 PRs (#5-#11), each verified explicitly with `git ls-remote --heads` after `gh pr merge --delete-branch`'s local-delete half failed on every single one (worktree-holds-branch trap, expected every time) |
| Local `dev` vs `origin/dev` | in sync at `48bc40a` |
| Open PRs | None (#1-#11 all merged) |
| Escalations | None. QCLI-2.3's one `request_changes` (a single false commit-pin) closed in its fix-cycle budget; every follow-up fix reached `approve` on its first review pass |
| Gates on merged `dev` | `lore check --strict` 21 files 0/0 · `lore validate --strict` 21 files 0/0, 6 skipped · `lore orphans` 0/0 |

## Next steps

1. `git fetch` and re-verify `dev`/`origin/dev` before acting (R2).
2. **Ask the owner about F2 before dispatching QCLI-2.12** — see the paste-ready prompt above and the campaign doc's "Proposed follow-ups" section for the exact proposed AC text.
3. **Ask the owner about QCLI-2.8's dependency list and the stale runbook reference** — both deferred twice now; do not defer a third time without at least asking.
4. Recompute the ready set. As of this writing: QCLI-2.5 (deps 2.1+2.4, both Done, `cluster:migration`), QCLI-2.6 (deps 2.2+2.3+2.4, all Done, `cluster:threat-model`), QCLI-2.12 (deps 2.11, Done, `cluster:provenance` — scope pending the F2 decision), QCLI-2.14 (deps 2.13, Done, `cluster:convention`). QCLI-2.10 still needs QCLI-2.5; QCLI-2.8 needs QCLI-2.5+2.6 plus everything else (already Done).
5. QCLI-2.5 carries owner ruling 2 (exhaustive Backlog CLI coverage) — it is the largest remaining task by far, same as noted in the wave-2 handover.

## Critical context / traps

- **The wave-level integration review is worth running even when every single-task review is clean.** Wave 3 proved this a second time: 4/4 tasks got a clean first-pass `approve`, yet the integration pass still found 6 real cross-task issues, none visible to any single-task review. Do not skip it to save time on a "clean" wave.
- **Idle notifications never carry a payload, for any agent role.** Every reviewer AND every worker this wave went idle without its report arriving in the same message. Always explicitly re-request output that hasn't arrived; never infer approval (or completion) from silence or an idle signal alone.
- **`lore sync` does NOT auto-commit `docs/` in this environment.** Auto-commit is scoped to `backlog/`, and only fires when `lore link`/`unlink` left it dirty. Regenerated `docs/log.md`, `docs/reference/index.md`, and Story managed blocks must be committed explicitly by whoever ran the sync. This corrects the wave-2-era assumption recorded in the prior handover.
- **A squash-merged branch's own log-sync commit goes dangling in `docs/log.md` every single time**, not occasionally — the SHA it cites never exists on `dev` post-squash. Run one `lore sync` directly on `dev` after every batch of merges (main wave AND any follow-up batch), not once per wave.
- **Cross-pool worktree orphans are invisible to scoped `treehouse status`/`prune`.** This session found one (`quest-cli-033df3`, a different pool than the one in active use, `quest-cli-f11e72`) that only `treehouse prune --all` (global) or `treehouse destroy <exact path>` could see. Cross-check `git worktree list` against `treehouse status --json` explicitly at every restore.
- **The register is the admission authority and it keeps needing coverage corrections, not reclassifications.** Three waves running now: wave 1 (couldn't satisfy its own admission rule for 5 slices), wave 2 (reachability-vs-content-identity confusion), wave 3 (F2 — two new documents cited slices in ways the slice's own enumeration doesn't cover). None of these were reclassifications; all were coverage/coherence gaps. Treat every register claim as checkable.
- **This repo is shared with `@codex`** — re-check ground truth every restore, same as always.
- **CLAUDE.md's fleet-routing section was hardened twice more this session** (commits `f9e2297`, `98f1f27`, both by the human owner directly on `dev`, outside the campaign) — sharper literal-satisfaction tests for the "don't describe Quest as installable," "check per repository," and "don't promote either side" rules, plus a DNS hard negative. Not campaign work; no action needed, just be aware `dev` moved for reasons outside this skill's control, same as `QCLI-5` did in wave 2.

## Do not repeat

- **Do not run `gh pr merge --delete-branch` and trust its output.** It failed the local-branch-delete half on all 7 PRs this session (#5-#11) — every time, not occasionally, because the worktree still held the branch. The pattern that works: return the worktree first (`treehouse return --force --if-lease-id ... --if-lease-holder ...`), delete the local branch, delete the remote branch explicitly, then verify with `git ls-remote --heads`.
- **Do not assume a rebase conflict on a task's own Backlog file needs hand-resolution.** Every one of the 7 branches this session conflicted on its own task file when rebased onto a `dev` that had moved past the wave-dispatch marking — resolve with `git checkout --theirs <file>` (keep the branch's plan/notes/comments), then reapply any labels `dev` had gained via `backlog task edit --add-label`, never by editing the markdown.
- **Do not skip the mechanical `lore sync` after squash-merges "because gates were already clean before the squash."** They will not stay clean after — `docs/log.md` will cite a SHA that no longer exists. This bit every single merge this session; the fix takes one command.
- **Do not proceed on an idle notification alone.** Explicitly ask "please resend your verdict/report" every time one arrives with no payload — this happened to every agent this session and cost nothing to correct each time it was caught early.
