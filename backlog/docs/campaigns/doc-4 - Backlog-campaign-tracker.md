---
id: doc-4
title: Backlog campaign tracker
type: other
created_date: '2026-08-05 22:39'
updated_date: '2026-08-05 22:40'
---
# Backlog campaign tracker

Protocol: restore -> recompute the ready/conflict graph from Backlog -> acquire
worktrees -> mark the acquired members dispatched -> implement + review in
parallel -> serialize the merge -> settle tasks and write this doc once more ->
loop until the queue is empty or blocked -> write handover.

## Frontier

As of 2026-08-05 (init): 4 ready now (QCLI-24, QCLI-25, QCLI-26, QCLI-27 --
no dependencies), 1 blocked (QCLI-28 -- depends on all four), 0 done. The
ready set is ALWAYS recomputed live from `backlog task list --json` plus each
candidate's `task view --json` at the start of every restore/wave -- never
trust a persisted "next wave" plan.

## Confirmed queue order

Confirmed by the user on 2026-08-05, via a live decision-ruling session on
the Quest CLI Phase 1 component decisions (result contract, identifier
grammar, scale target, license, platform matrix). This is the wave-builder's
tie-break, NOT a guarantee that any task lands in any particular wave.

1. QCLI-24 -- Author an ADR for the Quest CLI result contract: envelope shape, exit codes, not-found convention, and anomaly placement
2. QCLI-25 -- Author an ADR for the Quest CLI canonical identifier grammar and authored-record layout
3. QCLI-26 -- Author an ADR for the Quest CLI scale target and rebuild-on-doubt conclusion
4. QCLI-27 -- Record the Quest CLI D1 (license, contributor provenance) and D3 (platform matrix, ownership) owner rulings
5. QCLI-28 -- Reconcile the Quest CLI open component decisions register, contracts graph, and delivery roadmap against the Phase 1 ADRs (depends on 1-4)

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:cli-contract | CLI result contract ADR | QCLI-24 |
| cluster:identity | Identifier grammar ADR | QCLI-25 |
| cluster:projection | Scale target ADR | QCLI-26 |
| cluster:governance | License/platform rulings | QCLI-27 |
| cluster:tracking-reconciliation | Register/graph/roadmap reconciliation | QCLI-28 |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(empty)

## Needs a human / blocked

(none -- all 5 campaign tasks are agent-resolvable; the two items that
needed a human, D1 and D3, were ruled on by the owner before these tasks
were filed)

## Proposed follow-ups (awaiting user approval)

Never created unprompted -- this project requires approval before follow-up
work is filed. Each entry is a ready-to-run proposal.

(none yet)

## Wave log

- 2026-08-05 -- campaign init. The owner ruled live on all five open Phase 1
  items (CLI result contract sub-decisions, identifier grammar
  shape/prefix/layout/case-folding, scale target design points, D1
  license/provenance, D3 platform matrix/ownership) in a session captured by
  the new Story `stories/ratify-the-quest-cli-phase-1-component-decisions`.
  Filed QCLI-24..28 (all `campaign`-labelled), linked to the Story via
  `lore link`; `lore sync` / `lore check` / `lore orphans` all clean. No wave
  dispatched yet.
