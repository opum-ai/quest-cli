---
id: doc-9
title: Backlog campaign tracker
type: other
created_date: '2026-08-07 03:05'
updated_date: '2026-08-07 05:04'
---
# Backlog campaign tracker

**Campaign complete as of 2026-08-06.** Its single task (QCLI-40) is Done.
Queue empty. See the Wave log for full history. Run
`/backlog-handover init` to start a fresh campaign from whatever's in the
backlog next.

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of
2026-08-06 (campaign complete), 0 ready, 0 blocked, 1/1 Done.

## Origin of this campaign

Seeded 2026-08-06 from the single follow-up doc-8's wave-1 integration review
proposed and the user approved. QCLI-40 was filed at `e8f6e46` **after**
doc-8 closed, so it carried no `campaign` label and no completed campaign
covered it. doc-8's own closing line directed it into "the next `init`";
this session ran that init inline (user chose init-and-drain over a separate
`/backlog-handover init` round-trip) rather than reopening a campaign already
formally summarized as complete.

## Confirmed queue order

Confirmed by the user on 2026-08-06. Trivial here — the campaign has one
member.

1. QCLI-40 — Reconcile stale "file layout"/"naming scheme" open-item bundles
   outside the register and delivery-graph docs — **Done, wave 1**

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:open-item-bundles | Live forward-pointing "remains open" claims about file layout / naming scheme in documents outside the register and delivery-graph docs | QCLI-40 |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(clean — campaign complete, worktree released, all six pool slots available)

## Needs a human / blocked

(none)

## Follow-ups — approved and filed

Surfaced at the wave-1 report as proposals; the owner approved both on
2026-08-07 and they were filed at that point. Filed, not started.

1. **QCLI-43** — Fold the lore log sync into campaign settlement to stop
   recurring `docs/log.md` SHA drift. The owner chose to fix the cause over
   filing a fourth one-shot sync task (QCLI-35 for doc-7, QCLI-39 for doc-8,
   and open again for doc-9). Note it changes the settlement contract in this
   repo's fork of the `backlog-handover` skill, so its ACs require the
   Provenance section to record the divergence from upstream `opum-doc`
   rather than diverging silently.

2. **QCLI-44** — Settle whether inline supersession amendments must cite the
   directing task. Promoted from QCLI-40's reviewer `nit`. Needs an owner
   ruling on which form is normative *before* any editing: register line 167
   cites its directing task, the delivery-graph prose and QCLI-40's ADR
   amendment cite only the closing decision, and CLAUDE.md's stated wording
   matches the former.

## Wave log

- 2026-08-06 — campaign init (doc-9), run inline during a `restore`. R2
  ground truth found doc-8 complete (QCLI-36/37/38/39 all Done, handover
  correctly archived with no successor per the campaign-complete rule),
  local `dev` clean at `3b1e9f5` and in sync with `origin/dev`, all six
  treehouse pool slots available with zero leases, and zero open PRs. R2
  also found six stale remote branches left by earlier campaigns that
  skipped `--delete-branch` (`feat/qcli-24…27`, `fix/qcli-28`,
  `chore/qcli-wave1-integration-lore-sync`); every one had a squash-merged
  PR (#39–#44) and a `Done` task, so all six were deleted on `origin` with
  the user's approval. Remote now carries only `dev` and `main`. Labelled
  QCLI-40 `campaign` + `cluster:open-item-bundles`.

- 2026-08-06 — wave 1 (QCLI-40, single member). Worktree acquired from the
  pool (slot 1, lease `8af22075…`), branch `fix/qcli-40-open-item-bundles`.
  - **Process fix — the task-file rebase conflict class is now closed.**
    doc-8 hit a rebase conflict on the task's own metadata file in *both*
    waves, because the worker's `--plan` edit landed on a branch cut before
    the orchestrator's dispatch-marking commit; doc-8 concluded this was
    expected and should be routed through escalation each time. This wave
    instead advanced the branch onto `dev` *after* committing the
    dispatch-marking edit, and folded the `in-review`/`merge-pending`
    sub-stage labels into settlement rather than committing them mid-wave.
    Result: zero conflicts, no escalation call spent, no reviewer time on
    frontmatter. Recommended as the default: **never commit an
    orchestrator-side edit to a task file while a worker is live on that
    same task's branch without re-basing the branch onto it immediately.**
    Note the sub-stage labels are then absent mid-wave, so a crashed
    session must read stage from this doc's In-flight table (which is what
    that table is for) rather than from task labels.
  - QCLI-40: implemented (narrowed the atomic-mutations ADR's
    "deliberately not decided" bundle to event schema + locking primitive,
    with a dated amendment recording the file-layout/naming-scheme closure;
    split the architecture Spec's "Deferred by design" row so naming scheme
    carries the D4 citation and event schema stays open). Reviewed
    **approve**, all 4 ACs confirmed against resulting file text and the
    three-dot diff, gates independently re-run (47 files, 0/0 both). Merged
    as `c9353bc` (PR #57).
  - **Date-attribution challenge, resolved.** The orchestrator specifically
    challenged the ADR's new "closed 2026-08-05" claim before review, because
    QCLI-38's *determination* postdates the QCLI-25 ADR it cites — a
    plausible doc-vs-doc drift. Reviewer found it SUPPORTED: the
    delivery-graph doc already carries that exact date and attribution
    verbatim, QCLI-25's ADR frontmatter timestamps `2026-08-05T22:52:51.123Z`,
    and register line 167 draws the distinction explicitly ("same decision as
    D4; `QCLI-25`, reconciled here by `QCLI-38`"). Closure attaches to the
    decision date; QCLI-34/38 are the later reconciliations.
  - Non-blocking findings: one `minor` (the ADR's scope enumeration was
    narrowed rather than preserved-and-annotated — accepted as consistent
    with the already-merged QCLI-34/38 pattern in the delivery-graph doc,
    and the record survives in paraphrase) and three `nit`s, one of which is
    promoted to a proposed follow-up above.
  - **Wave-level integration review**: a single-member wave has no
    cross-task surface — the cumulative wave diff *is* the task diff a
    top-tier reviewer had just cleared — so the redundant second pass was
    deliberately skipped. In its place the orchestrator ran the one check a
    single-task review structurally cannot do: a tree-wide sweep for
    residual live "file layout"/"naming scheme" open claims now that all of
    doc-8 plus QCLI-40 sit on `dev` together. Clean — every remaining hit is
    the new closure sentence, `docs/log.md` history, the D4 proposal
    defining the scheme, or the threat-model / legacy-reconciliation scope
    statements AC3 explicitly protects as historical record.

## Campaign summary

doc-9 closed 2026-08-06 with its single task Done in one wave, no
escalations, no needs-human items, and no merge conflicts — the first
campaign in this sequence to take zero escalation calls, attributable to the
dispatch-marking rebase fix recorded above. Cleanup: six orphan remote
branches removed; `origin` now carries only `dev` and `main`. Two follow-ups
are proposed-not-filed above and await the owner's decision.
