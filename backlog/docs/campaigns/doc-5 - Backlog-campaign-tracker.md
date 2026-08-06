---
id: doc-5
title: Backlog campaign tracker
type: other
created_date: '2026-08-06 00:30'
updated_date: '2026-08-06 02:02'
---
# Backlog campaign tracker

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Frontier

As of 2026-08-06 (post-wave-1 settlement): 0 ready campaign tasks, 0 blocked,
0 needs-human. **Campaign complete** — all campaign-labelled tasks are Done.
Two follow-ups from wave 1's integration review were approved by the user
and filed as QCLI-31 and QCLI-32 (see below) — neither carries the
`campaign` label yet; a future `/backlog-handover init` decides whether to
sweep them into a new campaign, same as QCLI-29/QCLI-30's own path from
doc-4. The ready set is ALWAYS recomputed live from
`backlog task list --json` plus each candidate's `task view --json` at the
start of every restore/wave — never trust a persisted "next wave" plan.

## Confirmed queue order

Confirmed by the user on 2026-08-06. Both tasks ran together as wave 1 since
they touch entirely disjoint files and have no dependency between them.

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

(empty — wave 1 fully settled, no wave 2 exists)

## Needs a human / blocked

(none)

## Proposed follow-ups

Surfaced by wave 1's integration review. Both approved by the user on
2026-08-06 and filed:

- **QCLI-31** (was Proposal A, priority: high) — **Reconcile the remaining
  architecture-Spec passages that still read as open after the Phase 1
  ADRs.** `docs/specs/quest-cli-architecture.md` now self-contradicts on
  anomaly-taxonomy placement (Error taxonomy ~line 186 vs. Open Questions
  ~line 246), plus a stale "Deferred by design" table. See the task for
  full acceptance criteria.
- **QCLI-32** (was Proposal B, priority: low) — **Run a centralized lore
  sync to reconcile the Phase-1-ratification Story.** Pre-existing (predates
  this campaign) `lore check` drift on
  `docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md`. See
  the task for full acceptance criteria.

Neither is `campaign`-labelled yet — filing captures the durable intent;
whether/when they join a campaign wave is a future `/backlog-handover init`
decision.

## Wave log

- 2026-08-06 — campaign init. Queue was empty (all 47 prior tasks Done, no
  drafts) following the close of the Phase-1-ratification campaign
  (`doc-4`). Per user decision, filed the two follow-ups that campaign's
  reviewers had proposed but left unfiled: QCLI-29 (stale ratification
  prose in three proposal docs) and QCLI-30 (three prose/header
  inconsistencies from the QCLI-28 reconciliation). Both labelled
  `campaign` plus a cluster label. User confirmed both run together as
  wave 1.

- 2026-08-06 — wave 1 (tasks: QCLI-29, QCLI-30). Both dispatched into
  treehouse worktrees pinned to wave base `1e3f89b`, implemented and
  reviewed in parallel (both reviewers independently confirmed all 5 ACs
  each, no findings required a fix cycle — both approved on first pass).
  Merged serially in confirmed queue order: QCLI-29 first (PR #45, squash
  6ffc401, no rebase needed — first item in the wave), then QCLI-30 (PR
  #46, squash 735d82d, clean rebase onto QCLI-29's merge, mandatory
  re-verification passed). Both settled to Done with all 5 ACs checked,
  notes, and final summaries recorded (commits 7614621, 8b8e102).
  Wave-level integration review found no blocking cross-task problems (file
  sets fully disjoint, no renames, ADR/register cross-references verified
  consistent) but surfaced one new finding: QCLI-30's narrow AC5 scope
  fence left `docs/specs/quest-cli-architecture.md` self-contradictory
  (Error taxonomy section ~line 186 still calls anomaly placement "open"
  while Open Questions ~line 246, which QCLI-30 rewrote, calls it
  resolved) — not blocking (validation stays green, nothing depends on it).
  Also reconfirmed the pre-existing (not wave-introduced) `lore check`
  drift on the Phase-1-ratification Story.
  **Campaign complete**: all campaign-labelled tasks are now Done. No
  further wave was possible — queue recomputed empty at the end of wave 1.

- 2026-08-06 — post-campaign follow-up filing. User approved both proposed
  follow-ups from wave 1's integration review. Filed as QCLI-31
  (architecture-Spec self-contradiction reconciliation, high priority) and
  QCLI-32 (centralized lore sync for the Phase-1-ratification Story, low
  priority). Neither carries the `campaign` label — left for a future
  campaign init to decide.
