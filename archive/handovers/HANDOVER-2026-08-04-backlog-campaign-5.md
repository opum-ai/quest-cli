# Handover — QCLI-2 clean-room research campaign (waves: 4, tasks resolved: 12 of 14)

**Date**: 2026-08-04 | **Grounded against**: `dev @ f3c2f79`, clean, in sync with `origin/dev` | **Campaign doc**: `doc-1` at `backlog/docs/campaigns/doc-1 - Backlog-campaign-tracker.md`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli.

Wave 4 is done: QCLI-2.5 (407ea61), QCLI-2.6 (739aa7e), QCLI-2.12 (d55eaf7),
QCLI-2.14 (157ad56) all merged and settled Done. A wave-level integration
review then found 6 cross-task issues; F1 was fixed directly (mechanical
lore sync), F5+F6 were fixed via a 1-branch follow-up (also merged and
settled, PR #16). Twelve of fourteen subtasks are now Done. Two remain,
QCLI-2.8 and QCLI-2.10, and BOTH are now dependency-clear — a full
two-member wave is available, the last one before this campaign's queue
is empty.

ONE ESCALATION IS OUTSTANDING — read it before doing anything else. The
F2/F3/F4 follow-up branch (fix/qcli-2.12-followup-f2-f3-f4, PR #17 open
but explicitly marked DO NOT MERGE) went through 3 fix-and-review cycles
and exhausted the 2-retry cap. Root cause: the register pins the
co-edited migration ledger by exact commit SHA, and any edit to the
ledger later in the same pass invalidates that pin — this happened on
all 3 passes. Two proposed fixes are written up in the campaign doc's
"Needs a human / blocked" section and in PR #17's description. ASK THE
OWNER which fix pattern to use before attempting a 4th pass. This does
NOT block QCLI-2.8 or QCLI-2.10 — dispatch those normally while this
sits waiting for a decision.

The ready set is recomputed live — do NOT trust any persisted wave plan.
Frontier hint only: QCLI-2.8 and QCLI-2.10 are both dependency-clear,
disjoint clusters (cluster:synthesis, cluster:migration) — a full wave
under the size cap.

Read "Campaign conventions learned in wave 4" in the campaign doc — 6 new
rules, on top of waves 2 and 3's twelve, that each cost real time this
wave: a resumed teammate can silently stall for hours with zero progress
and zero error (kill it and redispatch as a background agent, don't wait
it out); a pane-allocation tool bug is worked around by omitting the
`name` parameter on Agent dispatches; an accidental duplicate reviewer
dispatch surfaced a real defect the "official" reviewer missed (treat
disagreement between two independent reads as signal, not noise); and
the register/ledger self-reference trap described above.

Every worker prompt must still carry the clean-room constraints AND the
per-slice admission rule: docs/reference/quest-cli-research-source-register.md
is the admission authority. Owner rulings 1-13 are in the campaign doc; do
not re-litigate or re-ask them.
```

## State

| Item | Status |
| ---- | ------ |
| Campaign doc | `doc-1`, updated with the wave-4 log, the 6-item integration-review table, the escalation writeup, 6 new conventions |
| Queue | **14 subtasks**; **12 Done** (2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9, 2.11, 2.12, 2.13, 2.14), 2 To Do (2.8, 2.10), both dependency-clear, plus the QCLI-2 parent epic |
| Waves run | 4 (plus wave-3's and wave-4's follow-up batches) |
| In flight | None from the normal wave loop — all 4 wave-4 worktrees + both follow-up worktrees returned to the pool. **One exception:** branch `fix/qcli-2.12-followup-f2-f3-f4` is pushed (`5dd001e`) and has an open PR (#17, explicitly marked DO NOT MERGE) but is deliberately left unmerged pending a human decision — see "Needs a human / blocked" in the campaign doc |
| Local `dev` vs `origin/dev` | in sync at `f3c2f79` |
| Open PRs | #17 only (`fix/qcli-2.12-followup-f2-f3-f4`, DO NOT MERGE, audit-trail only). #12-#16 all merged |
| Escalations | **One, outstanding.** See above and the campaign doc |
| Gates on merged `dev` | `lore check --strict` 23 files 0/0 · `lore validate --strict` 23 files 0/0, 6 skipped · `lore orphans` 0/0 |

## Next steps

1. `git fetch` and re-verify `dev`/`origin/dev` before acting (R2).
2. **Ask the owner which fix pattern to use for the escalated register/ledger issue** — see the paste-ready prompt above, the campaign doc's "Needs a human / blocked" section, and PR #17's description for the two proposed options (self-pin the ledger like the register self-pins itself, or enforce strict edit ordering). Do not attempt a 4th automated pass without an answer.
3. Recompute the ready set. As of this writing: **QCLI-2.8** (deps 2.2/2.3/2.4/2.5/2.6/2.7/2.11/2.12/2.13/2.14, all Done, `cluster:synthesis` — the largest remaining task by far, same note carried since wave 2) and **QCLI-2.10** (deps 2.5, Done, `cluster:migration`) — both ready, disjoint clusters, a full wave.
4. This is likely the **last wave before the campaign queue is empty** (only the QCLI-2 parent epic would remain — settled separately by the user/orchestrator per the campaign scope, not mechanically). Plan for the "queue empty" R6 path on the wave after this one.
5. Once the escalation is resolved (either merged or explicitly abandoned), close or update PR #17 accordingly — it should not sit open indefinitely as a stale audit trail.

## Critical context / traps

- **A resumed teammate can silently stall for hours with zero progress and zero error signal.** QCLI-2.14's first fix attempt sat "running" for 2+ hours with the worktree untouched (zero commits) after being dispatched via `SendMessage` to an already-idle worker. No error, no timeout, no idle notification — just silence. Every comparable fix this wave, dispatched as a fresh background agent via the `Agent` tool, completed in 2-9 minutes. `TaskStop` on a bogus ID safely lists running teammates/agents without side effects — use it to check liveness rather than waiting indefinitely. If a resumed teammate hasn't committed anything after 2-3x the wave's median time for comparable work, kill it and redispatch fresh.
- **A pane-allocation bug blocks named `Agent` dispatches after enough concurrent panes are open this session — omit `name` to work around it.** Every named dispatch failed identically (`herdr pane split ... pane not found`); an unnamed dispatch (same underlying mechanism) succeeded every time afterward. If a named dispatch fails on a pane error, retry once, then fall back to unnamed — resumable later via `SendMessage` to the returned `agentId`.
- **An accidental duplicate reviewer dispatch is a genuine independent second opinion, not noise to discard.** A slip (using `Agent` instead of `SendMessage` to resume a reviewer) spawned a second, context-less reviewer that disclosed the gap, ran a full review from scratch anyway, and found a real defect the first `approve`-verdict reviewer had only flagged as non-blocking. When this happens, check whether the two verdicts disagree — disagreement is signal.
- **The register/ledger co-editing self-reference trap.** Any register field that pins a document by exact commit SHA is invalidated the instant that document is edited again in the same pass — and QCLI-2.12's own fix work routinely edits both the register and its co-owned migration ledger together. This defeated 3 consecutive fix-and-review cycles before being correctly diagnosed as structural rather than a worker-quality issue. Two proposed fixes are written up; a human should pick one before any further attempt.
- **The wave-level integration review is worth running even when most single-task reviews are clean.** Wave 4 proved this a fourth time: one of four tasks (QCLI-2.6) got a clean first-pass `approve`, yet the integration pass still found 6 real cross-task issues.
- **Idle notifications never carry a payload, for any agent role, across all four waves now.** Always explicitly re-request output that hasn't arrived; never infer approval (or completion) from silence or an idle signal alone.
- **`lore sync` does NOT auto-commit `docs/` in this environment.** Confirmed a second time this wave. Regenerated `docs/log.md`, `docs/reference/index.md`, and Story managed blocks must be committed explicitly by whoever ran the sync.
- **A squash-merged branch's own log-sync commit goes dangling in `docs/log.md` every time.** Run one `lore sync` directly on `dev` after every batch of merges (main wave AND any follow-up batch), not once per wave. This wave needed it twice (after the main 4-merge batch, and again after the F5/F6 follow-up merge).
- **`gh pr merge --squash --delete-branch` worked cleanly on all 6 of this wave's merges (#12-#16) with zero local-branch-delete failures**, confirming the wave-2/3 fix (return the worktree before calling `gh pr merge`) holds under repeated use.
- **This repo is shared with `@codex`** — re-check ground truth every restore, same as always.

## Do not repeat

- **Do not dispatch a fix pass to a resumed teammate without a liveness check plan.** Prefer fresh background agents (`Agent` tool, no `name` if named dispatch is failing) for fix passes generally this session; if you must resume a teammate, decide up front how long you'll wait before treating silence as a stall.
- **Do not attempt a 4th automated fix pass on the escalated register/ledger branch without a human's chosen fix pattern in hand.** Three unguided passes each fixed the previously-identified problem while introducing a new instance of the same root cause. A 4th attempt without addressing the structural issue would very likely repeat this.
- **Do not assume a rebase conflict on a task's own Backlog file, or on `docs/log.md`/the Story's managed block, needs hand-resolution.** Every wave-4 branch conflicted on at least its own task file against the dispatch/in-review label commits; two also conflicted on the generated files. Resolve both classes the same way established since wave 2/3: `git checkout --theirs` (branch content for the task file; either side for generated files, since they get regenerated anyway), then reapply any labels `dev` had gained via `backlog task edit --add-label`, then re-run `lore sync` once, never by hand-editing.
- **Do not proceed on an idle notification alone.** Explicitly ask "please resend your verdict/report" every time one arrives with no payload — happened to every agent this wave too, cost nothing to correct each time it was caught.
