---
id: doc-2
title: Backlog campaign tracker — QCLI-6 register enumeration
type: other
created_date: '2026-08-05 02:50'
updated_date: '2026-08-05 03:22'
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
co-edits). Confirmed avoided in wave 1: QCLI-6 did not co-edit the migration
ledger or component charter, so all five new register members were
correctly SHA-pinned rather than self-pinned.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave —
never trust a persisted "next wave" plan. As of settlement of wave 1,
2026-08-05: 0 ready, 0 blocked. Campaign queue is empty — QCLI-6 was the
only member.

## Confirmed queue order

Confirmed by the user on 2026-08-05.

1. QCLI-6 — Close remaining research-source-register enumeration gaps
   (Done, wave 1)

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:provenance | Research-source-register coherence/enumeration | QCLI-6 (Done) |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(none — wave 1 fully settled)

## Needs a human / blocked

None currently outstanding.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up
work is filed. Each entry is a ready-to-run proposal.

- From wave 1's reviewer (QCLI-6 review, 2026-08-05): **Enumerate the
  campaign Story in the register's "Prior QCLI research records" slice (or
  rule explicitly that Stories need no admission)**
  QCLI-2.8's own settlement-pass caveat
  (`quest-cli-component-contracts-and-delivery-graph.md:69-96`) names three
  of its Provenance-table sources as not-yet-enumerated: QCLI-2.5's fidelity
  contract, QCLI-2.6's threat model, and the campaign Story itself
  (`docs/stories/prepare-quests-clean-room-research-foundation.md`, cited at
  `:61`). QCLI-6 closed the first two; the Story remains unenumerated in the
  register after this wave. This is the identical enumeration-gap class the
  campaign has now closed twice (QCLI-2.12, then QCLI-6) — leaving it open
  for the Story recreates the same debt.
  ACs (draft): (1) either the register's "Prior QCLI research records" slice
  gains a Story entry (SHA- or self-pinned per the standing rule) or the
  register states explicitly that Stories are out of scope for that slice's
  admission and names why; (2) QCLI-2.8's caveat is updated or confirmed
  accurate against whichever outcome; (3) `lore check/validate/orphans
  --strict` all clean.

## Wave log

- 2026-08-05 — wave 1 (tasks: QCLI-6): Single-member wave (whole campaign is
  one task). Worker implemented in treehouse slot 1
  (`fix/qcli-6-register-enumeration-gaps`, based on `dev @ d2a8469`):
  enumerated the five missing register members (SHA-pinned: QCLI-2.5→418c5eb,
  QCLI-2.6→739aa7e, QCLI-2.8→8935551, QCLI-2.9→3b5cd8c, QCLI-2.10→8935551)
  and stated process-level-response admissibility in the public-surface
  slice. Reviewer (independent, top-tier) returned **approve** on all 4 ACs
  after re-deriving every SHA from `git log`/`git show`, a strict
  Classification-field grep, a full pre/post slice-text diff, and an
  independent re-run of `lore check/validate/orphans --strict` (all clean).
  Two non-blocking findings: (1) QCLI-2.8's caveat names a third
  unenumerated source (the campaign Story) beyond the two this task closed
  — see the proposed follow-up above; (2) the worker's own out-of-scope note
  overstated closure of QCLI-2.8's caveat — corrected in the task's
  settlement notes. No wave-level integration review dispatched (single-task
  wave — no cross-task surface exists to review). Rebase onto `origin/dev`
  at merge time was a no-op (dev had not moved); gates re-verified clean
  anyway per the mandatory-reverify rule. Merged squash via PR #21 as
  `d4b7123`. Settled: QCLI-6 → Done, all 4 ACs checked.

Campaign complete: the queue held exactly one task (QCLI-6) and it is now
Done. No further waves to run. See the R6 report for the full session
summary and the proposed follow-up above, pending user approval.
