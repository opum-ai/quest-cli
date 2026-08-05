---
id: doc-4
title: Backlog campaign tracker
type: other
created_date: '2026-08-05 22:39'
updated_date: '2026-08-05 23:19'
---
# Backlog campaign tracker

Protocol: restore -> recompute the ready/conflict graph from Backlog -> acquire
worktrees -> mark the acquired members dispatched -> implement + review in
parallel -> serialize the merge -> settle tasks and write this doc once more ->
loop until the queue is empty or blocked -> write handover.

## Frontier

As of 2026-08-05 (post wave 1): QCLI-24, QCLI-25, QCLI-26, QCLI-27 all Done.
QCLI-28 now unblocked (its four dependencies are Done) -- expected to be wave
2. The ready set is ALWAYS recomputed live from `backlog task list --json`
plus each candidate's `task view --json` at the start of every restore/wave --
never trust a persisted "next wave" plan.

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

(empty -- wave 1 fully settled)

## Needs a human / blocked

(none -- all 5 campaign tasks are agent-resolvable; the two items that
needed a human, D1 and D3, were ruled on by the owner before these tasks
were filed)

## Proposed follow-ups (awaiting user approval)

Never created unprompted -- this project requires approval before follow-up
work is filed. Each entry is a ready-to-run proposal.

- From wave 1 review (QCLI-25's reviewer): **Update the three ratified proposal
  docs' stale "nothing accepted" status prose.** `docs/reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md`,
  `docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md`,
  and `docs/reference/quest-cli-scale-target-proposal.md` each still open with
  prose like "Nothing in this document is accepted. No ADR is created here" --
  now stale and unpointed to the ratifying ADR. This repo already has a
  precedent for the fix (inline-amend the superseded prose, dated, citing the
  directing ADR -- same convention used elsewhere in this bundle). Proposed
  ACs: each of the three proposal docs gets an inline dated note pointing to
  its ratifying ADR (QCLI-24/25/26's ADRs respectively); `lore validate --strict`
  passes; no other content changes.

## Wave log

- 2026-08-05 -- campaign init. The owner ruled live on all five open Phase 1
  items (CLI result contract sub-decisions, identifier grammar
  shape/prefix/layout/case-folding, scale target design points, D1
  license/provenance, D3 platform matrix/ownership) in a session captured by
  the new Story `stories/ratify-the-quest-cli-phase-1-component-decisions`.
  Filed QCLI-24..28 (all `campaign`-labelled), linked to the Story via
  `lore link`; `lore sync` / `lore check` / `lore orphans` all clean. No wave
  dispatched yet.

- 2026-08-05 -- wave 1 (tasks: QCLI-24, QCLI-25, QCLI-26, QCLI-27). All four
  ready (no dependencies), conflict-disjoint (each authors a distinct new
  ADR/reference doc), dispatched together under the wave-size cap of 6.
  Workers ran `lore new adr`/`lore new reference` to author each ratification.
  Three of four (QCLI-24, QCLI-26, QCLI-27) independently ran `lore sync` in
  their own worktrees, each regenerating the shared `docs/adr/index.md` /
  `docs/reference/index.md` / `docs/log.md` / Story managed-task-table from a
  partial single-task view -- a real cross-branch conflict risk caught at
  review. QCLI-25's worker correctly deferred this on its own initiative.
  Each reviewer independently confirmed the diagnosis and issued
  `request_changes` with concrete revert instructions; one fix-pass round per
  task reverted the shared-file edits (keeping each task's own new doc), and
  all four were re-reviewed to `approve`. QCLI-26 additionally picked up an
  optional D7a/D7b attribution correction in its fix pass.
  Merge order (confirmed queue order): QCLI-24 (PR #39, `e5c790b`), QCLI-25
  (PR #40, `9e7a0c0`), QCLI-26 (PR #41, `589e1a7`), QCLI-27 (PR #42,
  `f89b370`) -- each rebased onto the moving `dev`, mandatorily re-verified
  (`lore validate --strict`) post-rebase, squash-merged, settled to `Done`
  (all ACs checked from reviewer-confirmed evidence, final summaries
  recorded) directly on `dev`.
  Wave-level integration review then centralized the deferred `lore sync`
  (PR #43, `859af6a`) in one pass across the complete post-merge state --
  regenerated `docs/adr/index.md`, `docs/reference/index.md`, `docs/log.md`,
  and the Story's managed task table (QCLI-24..27 -> Done); reviewer
  independently re-verified completeness (set-equal index vs. files on disk),
  Story-table accuracy against live Backlog, and idempotency (re-running
  `lore sync` produced zero further content delta). No escalations. One
  non-blocking follow-up proposed (see above, awaiting user approval); one
  observation carried into QCLI-28's brief: QCLI-27's reference doc already
  records a D2 *ownership* ruling (quest-cli-owned, runtime choice itself
  still deferred) -- QCLI-28 should cite it rather than duplicate or
  contradict it when reconciling the register's D2 row.
