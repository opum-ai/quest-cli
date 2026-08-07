---
id: doc-10
title: Backlog campaign tracker
type: other
created_date: '2026-08-07 11:42'
updated_date: '2026-08-07 11:45'
---
# Backlog campaign tracker

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of
2026-08-07 (campaign init), 2 ready, 0 blocked, 0/2 Done.

## Origin of this campaign

Seeded 2026-08-07 from doc-9's two approved follow-ups, QCLI-43 and QCLI-44.
Both were filed at `34bceae` **after** doc-9 closed, so neither carried a
`campaign` label and no live campaign covered them. R2 ground truth for this
session found doc-9 complete (QCLI-40 Done, handover correctly archived with
no successor per the campaign-complete rule), local `dev` clean at `34bceae`
and in sync with `origin/dev`, all six treehouse pool slots available with
zero leases, zero campaign branches local or remote, and zero open PRs —
nothing to reconcile at R3.

The owner chose init-and-drain inline over a separate `/backlog-handover init`
round-trip, the same path doc-9 took for QCLI-40.

## Owner ruling obtained at init (QCLI-44)

QCLI-44 was **not dispatchable as filed**: its own description says an owner
ruling on which citation form is normative is required *before* any editing,
and its AC #1 requires that ruling to be recorded and dated. An agent cannot
manufacture an owner ruling, so the ruling was obtained at init rather than
labelling the task `needs-human`.

**Ruling (2026-08-07): option (a) — a directing-task citation IS required.**
An inline supersession amendment must cite the directing task in addition to
whatever closing decision it names. CLAUDE.md line 90 stands as written and is
NOT relaxed; the amendments citing only the closing decision are what gets
reconciled.

Owner's rationale: agents read `docs/` without git history in context, so the
directing-task citation is what makes the full reasoning (task description,
ACs, implementation notes) reachable from the document itself. Git preserves
the same trace but not in a form a docs reader can follow.

Recorded verbatim as a comment on QCLI-44 so it travels with the task rather
than living only here.

## Confirmed queue order

Confirmed by the user on 2026-08-07. This is the wave-builder's tie-break, NOT
a guarantee that any task lands in any particular wave.

1. QCLI-44 — Settle whether inline supersession amendments must cite the
   directing task
2. QCLI-43 — Fold the lore log sync into campaign settlement to stop recurring
   `docs/log.md` SHA drift

Rationale for this order (owner-selected): QCLI-43's `lore sync` is what
closes `docs/log.md` drift, so running it *last* means it also covers QCLI-44's
merge and the session ends with the log caught up through both — which is
precisely what QCLI-43 exists to guarantee, and makes its AC #1 verifiable at
maximum coverage. The reverse order would re-open drift at QCLI-44's merge and
require a second manual sync pass.

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:supersession-convention | The inline-supersession citation convention and the amendments that must conform to it | QCLI-44 |
| cluster:campaign-machinery | The `backlog-handover` skill's settlement contract and the `docs/log.md` sync it owns | QCLI-43 |

**These two are treated as conflicting despite different clusters.** QCLI-43
runs `lore sync`, which regenerates managed blocks across `docs/` and
auto-commits `backlog/` bookkeeping; QCLI-44 edits three files under `docs/`.
The file-citation read gives disjoint *authored* sets, but `lore sync`'s blast
radius overlaps them, so the wave builder over-approximates per R4b ("ambiguous
match → keep every candidate"). Consequence: two waves of one, not one wave of
two. With a two-task queue the parallelism cost is nil.

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |
| QCLI-44 | 1 | treehouse pool slot 1 (lease `f47c4204…`, holder `qcli/QCLI-44`) | `fix/qcli-44-supersession-citation` | 1 — dispatched |

Wave 1 base pinned at `3686859`; the branch was cut from `8721feb` (the
dispatch-marking commit) so the doc-9 task-file rebase-conflict class stays
closed. Sub-stage labels (`in-review`, `merge-pending`) are folded into
settlement per doc-9's process fix, so read stage from this table, not from
task labels.

## Needs a human / blocked

(none — QCLI-44's blocking ruling was obtained at init, see above)

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed.

(none yet)

## Wave log

- 2026-08-07 — campaign init (doc-10), run inline during a `restore`. R2
  ground truth clean on every axis: `dev` at `34bceae` clean and in sync,
  6/6 treehouse slots available with zero leases, no campaign branches
  (local or remote — remote carries only `dev` and `main`), no open PRs,
  63 tasks of which 61 Done. R3 had nothing to reconcile. Labelled QCLI-43
  `campaign` + `cluster:campaign-machinery` and QCLI-44 `campaign` +
  `cluster:supersession-convention`. Obtained the owner ruling QCLI-44
  required before dispatch (see above) and recorded it as a task comment.
