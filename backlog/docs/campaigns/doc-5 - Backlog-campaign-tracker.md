---
id: doc-5
title: Backlog campaign tracker
type: other
created_date: '2026-08-06 00:30'
updated_date: '2026-08-06 01:59'
---
# Backlog campaign tracker

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Frontier

As of 2026-08-06 (post-wave-1 settlement): 0 ready, 0 blocked, 0 needs-human.
**Campaign complete** — all campaign-labelled tasks are Done. The ready set is
ALWAYS recomputed live from `backlog task list --json` plus each candidate's
`task view --json` at the start of every restore/wave — never trust a
persisted "next wave" plan.

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

## Proposed follow-ups (awaiting user approval)

Surfaced by wave 1's integration review. Neither has been filed — this
project requires explicit user approval before any follow-up work is
created. Both are ready-to-run proposals.

- **Proposal A — priority: high.** **Reconcile the remaining
  architecture-Spec passages that still read as open after the Phase 1
  ADRs.**
  QCLI-30 rewrote `docs/specs/quest-cli-architecture.md`'s Open Questions to
  record that QCLI-24's ADR resolved anomaly placement, but its AC5 scope
  fence confined it to three named passages. Two passages elsewhere in the
  same file still assert the pre-ratification state, and the file now
  contradicts itself: the Error taxonomy section (line ~186) still calls
  anomaly's placement "an open question for Phase 1" while Open Questions
  (line ~246) calls it resolved, and the "Deferred by design" table (lines
  ~217-225) still lists D3 as "open, no owner" plus other items QCLI-24/25/26
  have since closed. The register and the ADRs are authoritative and already
  correct; only this Spec's prose lags. `lore validate --strict` passes over
  the contradiction because it is semantic, not structural.
  ACs: (1) Error taxonomy passage (~line 186) no longer states anomaly's
  taxonomy placement is open for Phase 1, cites QCLI-24's ADR instead,
  consistent with the Open Questions bullet at ~line 246; (2) "Deferred by
  design" table's D3 row no longer reads "open, no owner", matches the
  register's D3 owner cell (Closed; Component — claimed by QCLI-27); (3) the
  same table's rows for canonical identifier grammar (D4), authored-record
  layout, scale target (D5), and envelope shape / exit table are each
  removed or annotated as closed with a citation to the ADR that closed them
  (QCLI-25, QCLI-26, QCLI-24), while preserving as still-deferred the parts
  genuinely left open (storage/index engine, naming scheme, event schema,
  command vocabulary, flags); (4) D2 row unchanged (still genuinely
  blocked); (5) `lore validate --strict` passes; (6) no content changes
  beyond the Error taxonomy passage and the Deferred-by-design table, no
  edits to the register or any ADR.

- **Proposal B — priority: low.** **Run a centralized lore sync to reconcile
  the Phase-1-ratification Story.**
  `lore check` has reported two errors on
  `docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md` since
  commit `43bc22e` (predates this campaign entirely) — a `status-drift`
  (frontmatter says `in-progress` while its linked tasks QCLI-24..28 all
  recompute to `done`) and a `managed-block-drift` (stale
  `<!-- lore:tasks -->` block). This is the deferred centralized sync QCLI-24
  anticipated and QCLI-29/QCLI-30 each correctly declined to perform from an
  isolated worktree. Safe to run centrally on a stable `dev`, but not purely
  cosmetic — it flips a Story belonging to the prior Phase-1-ratification
  campaign (`doc-4`) to `done`, a project-state assertion, so it wants
  explicit sign-off rather than a silent regeneration.
  ACs: (1) `lore sync` run once, centrally, on a clean `dev` working tree;
  (2) `lore check` afterwards reports 0 errors, 0 warnings across the
  bundle; (3) resulting diff confined to the Story's frontmatter `status`
  and its `<!-- lore:tasks -->` managed block, anything else reported back
  rather than committed; (4) Story narrative prose not hand-edited, only
  tool-regenerated fields change; (5) `lore validate --strict` passes.

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
  resolved) — not blocking (validation stays green, nothing depends on it),
  but the top-priority proposed follow-up (Proposal A above). Also
  reconfirmed the pre-existing (not wave-introduced) `lore check` drift on
  the Phase-1-ratification Story, recommending it stay deferred to a
  centralized sync pending user approval (Proposal B above) rather than
  being run opportunistically mid-review.
  **Campaign complete**: all campaign-labelled tasks are now Done. No
  further wave was possible — queue recomputed empty at the end of wave 1.
