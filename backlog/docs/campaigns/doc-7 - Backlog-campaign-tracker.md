---
id: doc-7
title: Backlog campaign tracker
type: other
created_date: '2026-08-06 10:52'
updated_date: '2026-08-06 10:53'
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
2026-08-06 (init), 3 ready (QCLI-33, QCLI-34, QCLI-35), 0 blocked.

## Confirmed queue order

Confirmed by the user on 2026-08-06. This is the wave-builder's tie-break, NOT
a guarantee that any task lands in any particular wave. All three tasks were
filed this session as the doc-6 campaign's proposed follow-ups, now approved
by the user for filing.

1. QCLI-33 — Reconcile architecture-Spec Open Questions bullet 4 against the
   QCLI-26 ADR
2. QCLI-35 — Sync docs/log.md to close pre-existing SHA drift from
   squash-merge rewrites
3. QCLI-34 — Reconcile 'file layout' terminology in the register and
   delivery-graph contract tables against QCLI-25/D4

User confirmed these three touch disjoint files (no repeat of the QCLI-31→32
`lore sync` repo-wide-side-effect conflict) and approved running them as a
single parallel wave. Order above is priority tie-break only, not a wave
boundary.

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:architecture-spec | Open Questions bullet 4 in quest-cli-architecture.md, same pattern as QCLI-31 | QCLI-33 |
| cluster:terminology-reconciliation | "file layout" vs "authored-record layout" terminology tension in the register + delivery-graph contract tables | QCLI-34 |
| cluster:lore-log-sync | docs/log.md SHA drift from squash-merge rewrites | QCLI-35 |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

## Needs a human / blocked

(none — all three campaign tasks classified as agent-resolvable at init)

**Watch item, not a blocker:** QCLI-34's determination (same concept under two
names, vs. genuinely distinct) is more judgment-heavy than QCLI-33 or QCLI-35.
Its acceptance criteria are written so either outcome is objectively
verifiable from the QCLI-25 ADR and register D4 text, but if the worker or
reviewer finds the evidence genuinely ambiguous, escalate per
`reference/escalation.md` rather than forcing a call — do not let this stall
the rest of the wave.

## Proposed follow-ups (awaiting user approval)

Carried over from doc-6 (all three of its proposals were approved and filed
as QCLI-33/34/35 this session — none remain pending).

## Wave log

- 2026-08-06 — campaign init (doc-7). Prior campaign (doc-6, QCLI-31/32)
  closed 2026-08-06 with 0 campaign-labelled tasks remaining; queue was empty.
  doc-6's wave log had proposed 3 follow-ups, never filed per this project's
  no-autonomous-task-creation rule. User chose to file all 3 and run a full
  campaign. Created QCLI-33 (architecture-spec reconciliation, cluster
  `cluster:architecture-spec`), QCLI-34 (terminology reconciliation, cluster
  `cluster:terminology-reconciliation`), QCLI-35 (log.md sync, cluster
  `cluster:lore-log-sync`), each with description + testable ACs per
  `task-creation` guide, no implementation plan. Labelled all three
  `campaign` + cluster label. User confirmed queue order (33, 35, 34 as
  priority tie-break) and approved running all three as one parallel wave —
  no cross-task file overlap, no dependency forced. No wave dispatched yet.
