---
id: QCLI-10.2
title: Promote settled Quest CLI decisions into ADRs
status: To Do
assignee: []
created_date: '2026-08-05 11:40'
updated_date: '2026-08-05 11:41'
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
- [ ] #1 An ADR records that Git-tracked authored records are the sole authority and projections are derived, disposable, and deterministically rebuildable, including the three-tier durability model
- [ ] #2 An ADR records that coordination is through Git ref compare-and-swap with no central arbiter
- [ ] #3 An ADR records the operation-owned mutation contract INV-1 through INV-5
- [ ] #4 An ADR records that claims are lease-bounded against the evaluator's own clock and that reclamation appends rather than rewrites
- [ ] #5 An ADR records the three categorical command outcomes over a versioned machine-readable envelope, leaving the literal envelope keys and exit-code table open
- [ ] #6 An ADR records that Quest does not inherit Backlog.md's ID grammar and that migration is reversible, keyed on source folder and source ID, and never mutates the source
- [ ] #7 An ADR records that Lore is optional at runtime, exchange is versioned public records only, and link failures are loud and leave task state untouched
- [ ] #8 Every ADR carries Status, Context, Decision, and Consequences sections and cites both its source document and the task that settled it
- [ ] #9 No ADR freezes runtime, native packaging, supported platforms, projection storage engine, or product license
<!-- AC:END -->
