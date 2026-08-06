---
id: doc-8
title: Backlog campaign tracker
type: other
created_date: '2026-08-06 18:09'
updated_date: '2026-08-06 18:09'
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
2026-08-06 (init), 4 ready (QCLI-36, QCLI-37, QCLI-38, QCLI-39), 0 blocked.

## Confirmed queue order

Confirmed by the user on 2026-08-06. This is the wave-builder's tie-break, NOT
a guarantee that any task lands in any particular wave. All four tasks were
proposed as follow-ups by the doc-7 (QCLI-33/34/35) campaign's wave-1
reviewers and worker, and filed this session with the user's approval.

1. QCLI-36 — Fix QCLI-34's task metadata: correct the references field to
   real paths
2. QCLI-37 — Reconcile the stale 'record layout' status cell at register
   line 167
3. QCLI-38 — Determine whether 'naming scheme' is also closed by the
   QCLI-25 authored-record-layout section
4. QCLI-39 — Sync docs/log.md again to close post-wave-1 SHA drift

Rationale: lowest-risk/highest-information first. QCLI-36 is a trivial
metadata-only fix touching no doc content. QCLI-37 is a small stale-cell
reconciliation. QCLI-38 is judgment-heavy (same shape as QCLI-34's
same-concept-vs-distinct determination). QCLI-39 (log sync) is last
deliberately, so it can capture the other three's merge commits — the same
lesson wave 1 learned the hard way with QCLI-33/34/35.

**Known file-overlap risk, not yet resolved**: QCLI-36, QCLI-37, and QCLI-38
all potentially touch `docs/reference/quest-cli-open-component-decisions.md`,
at different line ranges (QCLI-36: none — only the QCLI-34 backlog task file;
QCLI-37: ~line 167, the Spec-open-questions mapping table; QCLI-38: the
open-item table row(s) analogous to QCLI-34's ~line 193 edit). This was NOT
resolved at init — restore's R4b conflict-graph computation must do a live
file-citation read to determine whether QCLI-37 and QCLI-38 can safely run in
the same wave or need sequencing across waves. Treat same-cluster-or-not as
informational only here; do not skip the live file-citation read.

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:task-metadata | QCLI-34's own bad `references` field | QCLI-36 |
| cluster:register-mapping-table | Stale status cell in the register's Spec-open-questions mapping table (~line 167) | QCLI-37 |
| cluster:naming-scheme-reconciliation | Same-concept-vs-distinct determination for "naming scheme" against QCLI-25/D4, register + delivery-graph open-item tables | QCLI-38 |
| cluster:lore-log-sync | docs/log.md SHA drift accumulated since QCLI-35's sync | QCLI-39 |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

## Needs a human / blocked

(none — all four campaign tasks classified as agent-resolvable at init;
QCLI-38 carries the same judgment-heavy shape QCLI-34 successfully resolved
without escalation, and its ACs are written the same way — either outcome is
objectively verifiable)

## Proposed follow-ups (awaiting user approval)

(none yet this campaign — carried nothing forward from doc-7 beyond what was
just filed as QCLI-36..39)

## Wave log

- 2026-08-06 — campaign init (doc-8). Prior campaign (doc-7, QCLI-33/34/35)
  closed 2026-08-06 with 0 campaign-labelled tasks remaining; queue was
  empty. doc-7's wave-1 report proposed 4 follow-ups, never filed per this
  project's no-autonomous-task-creation rule. User chose to file all 4 and
  run a full campaign. Created QCLI-36 (task-metadata fix), QCLI-37
  (register mapping-table reconciliation), QCLI-38 (naming-scheme
  determination), QCLI-39 (log sync), each with description + testable ACs
  per `task-creation` guide, no implementation plan. Labelled all four
  `campaign` + cluster label. User confirmed queue order (36, 37, 38, 39)
  and its rationale. No wave dispatched yet — file-overlap risk between
  QCLI-36/37/38 flagged above for restore to resolve live.
