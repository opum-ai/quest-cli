---
id: QCLI-10.2
title: Promote settled Quest CLI decisions into ADRs
status: Done
assignee: []
created_date: '2026-08-05 11:40'
updated_date: '2026-08-05 11:56'
labels:
  - quest
  - cli
  - adr
  - decisions
  - architecture
  - 'doc:stories/prepare-quest-cli-for-implementation-activation'
dependencies: []
documentation:
  - docs/stories/prepare-quest-cli-for-implementation-activation.md
parent_task_id: QCLI-10
priority: high
type: docs
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Seventeen architectural decisions the research already settled live buried in reference prose with no Status/Context/Decision/Consequences framing and no supersession machinery. Exactly one ADR exists in the bundle. Promote the load-bearing decisions into first-class ADRs.

Each ADR records a decision already made and cites the research document and the task that settled it. No ADR introduces a decision the research did not make, and none freezes a choice whose required Lore evidence is unfinished.

The existing package-and-command ADR already covers repository, package, executable identity, and the single-package layering; it is not duplicated or amended here.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An ADR records that Git-tracked authored records are the sole authority and projections are derived, disposable, and deterministically rebuildable, including the three-tier durability model
- [x] #2 An ADR records that coordination is through Git ref compare-and-swap with no central arbiter
- [x] #3 An ADR records the operation-owned mutation contract INV-1 through INV-5
- [x] #4 An ADR records that claims are lease-bounded against the evaluator's own clock and that reclamation appends rather than rewrites
- [x] #5 An ADR records the three categorical command outcomes over a versioned machine-readable envelope, leaving the literal envelope keys and exit-code table open
- [x] #6 An ADR records that Quest does not inherit Backlog.md's ID grammar and that migration is reversible, keyed on source folder and source ID, and never mutates the source
- [x] #7 An ADR records that Lore is optional at runtime, exchange is versioned public records only, and link failures are loud and leave task state untouched
- [x] #8 Every ADR carries Status, Context, Decision, and Consequences sections and cites both its source document and the task that settled it
- [x] #9 No ADR freezes runtime, native packaging, supported platforms, projection storage engine, or product license
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Authored seven ADRs under docs/adr/, each recording a decision the research already settled:

1. treat-git-tracked-authored-records-as-the-sole-authority (QCLI-2.6, QCLI-2.8)
2. coordinate-through-git-compare-and-swap-without-a-central-arbiter (QCLI-2.6)
3. require-atomic-idempotent-operation-owned-mutations (QCLI-2.6, INV-1..INV-5)
4. bound-claims-with-leases-evaluated-against-the-evaluator-s-own-clock (QCLI-2.6, QCLI-2.4)
5. emit-three-categorical-command-outcomes-over-a-versioned-envelope (QCLI-2.3, QCLI-2.7, QCLI-2.8)
6. migrate-from-backlog-md-reversibly-without-inheriting-its-id-grammar (QCLI-2.5, QCLI-2.10)
7. keep-lore-optional-and-integrate-only-through-versioned-public-records (QCLI-2.7, QCLI-2.4)

Decisions made while authoring:
- Status is Accepted, not Proposed, with an explicit sentence that the record promotes an already-settled decision rather than making a new one. A Proposed status would have implied these were open.
- ADR 5 is Accepted as to the SHAPE of the contract only; the literal envelope keys, exit-code table, and not-found convention are stated as still open and routed to the register. Marking it Accepted outright would have frozen what the research left open.
- The existing package-and-command ADR was not duplicated or amended; it already covers repository, package, executable identity, and the single-package layering.
- Each Consequences section names the FR requirements and BB/TM scenarios the decision binds, so an implementer can move from decision to test without a search.

Verification: lore validate reports 9 ADR files, 0 errors, 0 warnings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added seven ADRs promoting decisions that were settled by the research but buried in reference prose: Git-records-as-sole-authority with the three-tier durability model, Git compare-and-swap coordination with no central arbiter, the INV-1..INV-5 mutation contract, lease semantics evaluated against the evaluator own clock, the three categorical command outcomes, reversible migration without inheriting Backlog identifier grammar, and Lore runtime optionality with versioned-record-only exchange. Each carries Status, Context, Decision, and Consequences, cites its source document and settling task, and freezes no runtime, packaging, platform, storage-engine, or license choice. Verified by lore validate reporting zero errors across all nine ADR files.
<!-- SECTION:FINAL_SUMMARY:END -->
