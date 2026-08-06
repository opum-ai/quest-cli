---
id: doc-6
title: Backlog campaign tracker
type: other
created_date: '2026-08-06 02:39'
updated_date: '2026-08-06 03:50'
---
# Backlog campaign tracker

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Frontier

As of 2026-08-06 (post wave 1): QCLI-31 is Done. QCLI-32 is now ready (its
only dependency, QCLI-31, is Done) — 1 ready (QCLI-32), 0 blocked, 0
needs-human. The ready set is ALWAYS recomputed live from
`backlog task list --json` plus each candidate's `task view --json` at the
start of every restore/wave — never trust a persisted "next wave" plan.

## Confirmed queue order

Confirmed by the user on 2026-08-06. Both tasks were surfaced by the
doc-cleanup campaign's (`doc-5`) wave-1 integration review and approved
for filing that same session.

1. QCLI-31 — Reconcile the remaining architecture-Spec passages that still
   read as open after the Phase 1 ADRs — **Done, wave 1**
2. QCLI-32 — Run a centralized lore sync to reconcile the
   Phase-1-ratification Story — ready, next wave

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
| cluster:architecture-spec | Self-contradiction in quest-cli-architecture.md left by QCLI-30's narrow scope fence | QCLI-31 (Done) |
| cluster:lore-sync | Centralized lore sync closing out the Phase-1-ratification Story's pre-existing drift | QCLI-32 |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(empty — wave 1 settled cleanly, no wave 2 dispatched yet)

## Needs a human / blocked

(none)

## Proposed follow-ups (awaiting user approval)

Surfaced by the wave-1 reviewer on QCLI-31 (`docs/specs/quest-cli-architecture.md`).
Not filed — this repo forbids creating follow-up tasks without user approval.

1. **Adjacent contradiction, same pattern as QCLI-31 itself.** The Spec's
   Open Questions bullet 4 (~line 263) still asks "does the projection port
   need transactional semantics, or is rebuild-on-doubt sufficient? ...
   cannot be settled before the scale target (D5)" — but D5 is now closed
   (by QCLI-31, citing the QCLI-26 ADR), and that same ADR already answers
   the question at its line 114 ("No durable transactional index is
   required to satisfy this scale target"). QCLI-31's AC6 scope fence
   correctly forbade touching this passage, so it was left as-is by design,
   not by oversight — but it means the Spec still contradicts itself in one
   remaining place. Proposed task: reconcile Open Questions bullet 4 with
   the QCLI-26 ADR's rebuild-on-doubt ruling, same shape as QCLI-31.
2. **Minor terminology tension, informational only.** The register's
   contract-level table (`quest-cli-open-component-decisions.md` ~line 193)
   and `quest-cli-component-contracts-and-delivery-graph.md` (~lines
   431-437) both still list "file layout" among the Git mutation contract's
   open items, while register D4's detail and the QCLI-25 ADR both say the
   *authored-record layout* is settled. Possibly the same concept under two
   names, in which case one of the two source documents is drifting — or
   they are genuinely distinct and no action is needed. Lower priority than
   (1); worth a look, not urgent.

## Wave log

- 2026-08-06 — campaign init. Queue was QCLI-31 and QCLI-32, both filed at
  the end of the prior doc-cleanup campaign (`doc-5`) as user-approved
  integration-review follow-ups. Labelled `campaign` plus a cluster label.
  User confirmed QCLI-31 first, with QCLI-32 made explicitly dependent on
  QCLI-31 (not just ordered) to avoid a known `lore sync` conflict pattern.
  No wave dispatched yet.
- 2026-08-06 — wave 1 = {QCLI-31}. Worktree acquired from the treehouse pool
  (slot 1, base `dev`@`94baa05`), branch
  `fix/qcli-31-architecture-spec-reconciliation`. Worker reconciled the
  Error taxonomy passage and the "Deferred by design" table against the
  ratified Phase 1 ADRs; `lore validate --strict` passed (47 files, 0
  errors, 0 warnings). Reviewer independently re-ran the same gate and
  confirmed all 6 acceptance criteria with file/line evidence — verdict
  `approve`, plus two non-blocking findings (recorded above under Proposed
  follow-ups). Rebase onto `origin/dev` produced one purely-mechanical
  conflict in the task file's `assignee`/`updated_date` fields (content
  diff untouched) — resolved by the orchestrator, re-verified post-rebase
  (still 0 errors/warnings), merged as PR #47 / `ccb68d1`. QCLI-31 settled
  to Done. QCLI-32 is now unblocked.
