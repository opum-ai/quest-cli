---
id: doc-6
title: Backlog campaign tracker
type: other
created_date: '2026-08-06 02:39'
updated_date: '2026-08-06 02:39'
---
# Backlog campaign tracker

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Frontier

As of 2026-08-06, campaign init: 1 ready (QCLI-31), 1 blocked-by-dependency
(QCLI-32, depends on QCLI-31), 0 needs-human. The ready set is ALWAYS
recomputed live from `backlog task list --json` plus each candidate's
`task view --json` at the start of every restore/wave — never trust a
persisted "next wave" plan.

## Confirmed queue order

Confirmed by the user on 2026-08-06. Both tasks were surfaced by the
doc-cleanup campaign's (`doc-5`) wave-1 integration review and approved
for filing that same session.

1. QCLI-31 — Reconcile the remaining architecture-Spec passages that still
   read as open after the Phase 1 ADRs
2. QCLI-32 — Run a centralized lore sync to reconcile the
   Phase-1-ratification Story

**QCLI-32 carries a real Backlog dependency on QCLI-31 (`--dep QCLI-31`),
not just a queue-order tie-break.** This repo has already hit a real
conflict from running `lore sync` in parallel with an in-flight content
edit (doc-4, wave 1) — `lore sync` can regenerate shared index files
repo-wide, a side effect the file-citation conflict check cannot see since
QCLI-31 and QCLI-32's *named* references are disjoint. The dependency
forces QCLI-32 into its own wave after QCLI-31 merges, by design, per user
decision — this is not a scheduling accident to "fix" later.

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:architecture-spec | Self-contradiction in quest-cli-architecture.md left by QCLI-30's narrow scope fence | QCLI-31 |
| cluster:lore-sync | Centralized lore sync closing out the Phase-1-ratification Story's pre-existing drift | QCLI-32 |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(empty — no wave dispatched yet)

## Needs a human / blocked

(none — both QCLI-31 and QCLI-32 are agent-resolvable: objectively
verifiable via direct doc inspection, `lore validate --strict`, and
`lore check`. QCLI-32's own "wants explicit sign-off" note was satisfied by
the user's approval to file it during doc-5's R6 report — filing it into
this campaign is that sign-off being exercised, not a reason to mark it
needs-human.)

## Proposed follow-ups (awaiting user approval)

(none yet this campaign)

## Wave log

- 2026-08-06 — campaign init. Queue was QCLI-31 and QCLI-32, both filed at
  the end of the prior doc-cleanup campaign (`doc-5`) as user-approved
  integration-review follow-ups. Labelled `campaign` plus a cluster label.
  User confirmed QCLI-31 first, with QCLI-32 made explicitly dependent on
  QCLI-31 (not just ordered) to avoid a known `lore sync` conflict pattern.
  No wave dispatched yet.
