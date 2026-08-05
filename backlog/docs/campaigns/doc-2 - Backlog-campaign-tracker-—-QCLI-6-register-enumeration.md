---
id: doc-2
title: Backlog campaign tracker — QCLI-6 register enumeration
type: other
created_date: '2026-08-05 02:50'
updated_date: '2026-08-05 02:50'
---
# Backlog campaign tracker — QCLI-6 register enumeration

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Campaign scope

A single task: **QCLI-6** — "Close remaining research-source-register
enumeration gaps (QCLI-2.5, 2.6, 2.8, 2.9, 2.10 not yet enumerated in 'Prior
QCLI research records')". This is the O2 follow-up the QCLI-2 campaign's
wave-5 integration review proposed (see `doc-1`, the QCLI-2 campaign's
archival record, which stays untouched as history — this doc does not
supersede it). Approved and created by the task owner outside the campaign
flow; onboarded here at `init` on 2026-08-05.

Governing documents are the same as the QCLI-2 campaign:
`docs/reference/quest-cli-component-charter.md`,
`docs/reference/former-ocli-to-qcli-migration-ledger.md`, and
`docs/reference/quest-cli-research-source-register.md` (the per-slice
admission authority). Documentation only — no product source, runtime
dependency, executable scaffolding, package publication, or release.

## Known trap — read before dispatch

`doc-1`'s "Needs a human / blocked" section documents a SHA-pinning
self-reference trap: QCLI-2.12's fix passes routinely edited the migration
ledger in the same pass as the register, and any SHA pin of a co-edited
sibling document is structurally invalidated by construction. It cost 3
review cycles (escalated to `human_needed`) before the owner chose Option A
(self-pin the co-edited sibling to its own current state on the branch,
rather than to an exact commit SHA) — see PR #17. QCLI-6's own task
description already names this pattern and the mitigation explicitly (AC1
requires self-pinning for any of the five documents this task itself
co-edits). The worker/reviewer prompts for QCLI-6 must carry this pointer
verbatim so the trap does not recur unguided.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave —
never trust a persisted "next wave" plan. As of init, 2026-08-05: 1 ready
(QCLI-6, all 5 dependencies Done), 0 blocked.

## Confirmed queue order

Confirmed by the user on 2026-08-05.

1. QCLI-6 — Close remaining research-source-register enumeration gaps

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:provenance | Research-source-register coherence/enumeration | QCLI-6 |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

## Needs a human / blocked

None currently outstanding.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up
work is filed. Each entry is a ready-to-run proposal.

## Wave log

(none yet)
