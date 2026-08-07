---
id: doc-9
title: Backlog campaign tracker
type: other
created_date: '2026-08-07 03:05'
updated_date: '2026-08-07 03:06'
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
2026-08-06 (campaign init), 1 ready, 0 blocked, 0/1 Done.

## Origin of this campaign

Seeded 2026-08-06 from the single follow-up doc-8's wave-1 integration review
proposed and the user approved. QCLI-40 was filed at `e8f6e46` **after**
doc-8 closed, so it carried no `campaign` label and no completed campaign
covered it. doc-8's own closing line directed it into "the next `init`";
this session ran that init inline (user chose init-and-drain over a separate
`/backlog-handover init` round-trip) rather than reopening a campaign already
formally summarized as complete.

## Confirmed queue order

Confirmed by the user on 2026-08-06. This is the wave-builder's tie-break, NOT
a guarantee that any task lands in any particular wave. Trivial here — the
campaign has one member.

1. QCLI-40 — Reconcile stale "file layout"/"naming scheme" open-item bundles
   outside the register and delivery-graph docs

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:open-item-bundles | Live forward-pointing "remains open" claims about file layout / naming scheme in documents outside the register and delivery-graph docs (the ADR's deliberately-not-decided list; the architecture Spec's "Deferred by design" table) | QCLI-40 |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(clean — no wave dispatched yet)

## Needs a human / blocked

(none)

## Proposed follow-ups (awaiting user approval)

(none yet)

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
  QCLI-40 `campaign` + `cluster:open-item-bundles`. No dependencies — it is
  a single-member campaign, so the dependency and conflict graphs are both
  trivially empty.
