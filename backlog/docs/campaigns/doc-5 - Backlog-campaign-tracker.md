---
id: doc-5
title: Backlog campaign tracker
type: other
created_date: '2026-08-06 00:30'
updated_date: '2026-08-06 00:30'
---
# Backlog campaign tracker

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Frontier

As of 2026-08-06, campaign init: 2 ready (QCLI-29, QCLI-30), 0 blocked,
0 needs-human. The ready set is ALWAYS recomputed live from
`backlog task list --json` plus each candidate's `task view --json` at the
start of every restore/wave — never trust a persisted "next wave" plan.

## Confirmed queue order

Confirmed by the user on 2026-08-06. Both tasks are the two follow-ups
proposed (but not filed) during the prior Phase-1-ratification campaign
(`doc-4`) — filed as QCLI-29 and QCLI-30 with this init, then confirmed to
run together as a single wave since they touch entirely disjoint files and
have no dependency between them. This is the wave-builder's tie-break, NOT
a guarantee either lands in a particular wave if the ready set changes.

1. QCLI-29 — Correct stale 'nothing accepted' prose in three ratified Quest
   CLI proposal docs
2. QCLI-30 — Fix three prose/header inconsistencies left by the QCLI-28
   reconciliation

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:proposal-docs | Ratification pointers in the three Phase 1 proposal docs | QCLI-29 |
| cluster:reconciliation-cleanup | Prose/header inconsistencies left by QCLI-28 | QCLI-30 |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(empty — no wave dispatched yet)

## Needs a human / blocked

(none — both QCLI-29 and QCLI-30 are agent-resolvable: objectively
verifiable via `lore validate --strict` plus direct inspection of the
named passages)

## Proposed follow-ups (awaiting user approval)

(none yet this campaign)

## Wave log

- 2026-08-06 — campaign init. Queue was empty (all 47 prior tasks Done, no
  drafts) following the close of the Phase-1-ratification campaign
  (`doc-4`). Per user decision, filed the two follow-ups that campaign's
  reviewers had proposed but left unfiled: QCLI-29 (stale ratification
  prose in three proposal docs) and QCLI-30 (three prose/header
  inconsistencies from the QCLI-28 reconciliation). Both labelled
  `campaign` plus a cluster label. User confirmed both run together as
  wave 1. No wave dispatched yet.
