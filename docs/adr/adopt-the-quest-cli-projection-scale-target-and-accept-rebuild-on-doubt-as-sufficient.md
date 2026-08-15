---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Adopt the Quest CLI projection scale target and accept rebuild-on-doubt as sufficient
tags:
  - quest
  - cli
  - scale
  - projection
  - decisions
summary: Accepts QCLI-20's proposed scale target and rebuild-on-doubt conclusion for register entry D5; the later implementation baseline selects Bun SQLite as the disposable projection engine.
timestamp: 2026-08-05T22:53:44.432Z
---

# Adopt the Quest CLI projection scale target and accept rebuild-on-doubt as sufficient

## Status

Accepted. This record ratifies the component owner's ruling in a live session on
2026-08-05, captured in the
[Ratify the Quest CLI Phase 1 component decisions Story](../stories/ratify-the-quest-cli-phase-1-component-decisions.md).

Unlike this bundle's other ADRs, which each promote a decision the completed research
campaign already settled, this record ratifies a decision made *after* that campaign
closed. [`QCLI-20`'s scale target proposal](../reference/quest-cli-scale-target-proposal.md)
did the reasoning and proposed design points, a rebuild time budget, and a
rebuild-on-doubt conclusion for owner ruling — but that document is explicit that it
"proposes; it does not decide," created no ADR, and chose no storage or index engine.
This document performs the acceptance act; the reasoning it accepts is `QCLI-20`'s own,
restated here rather than reconstructed.

Register entry [D5](../reference/quest-cli-open-component-decisions.md) is closed by
this ADR. Reconciling the open component decisions register's own table row, the
component contracts and delivery graph, and the delivery roadmap's Phase 1 exit-criteria
table against this ADR is a separate task (`QCLI-28`) and is not performed here.

## Context

The [architecture Spec](../specs/quest-cli-architecture.md) left an open question: does
the projection port need transactional semantics, or is rebuild-on-doubt sufficient? That
question "cannot be settled before the scale target (D5)" — and D5 itself had no target,
only a placeholder in the
[open component decisions register](../reference/quest-cli-open-component-decisions.md)
blocking Phase 3 storage and index design.

`QCLI-20` supplied that missing target: a reasoned record count, event count, enrolled-
workspace count, and clone count, each traced to this campaign's own dated Backlog.md
corpus and to Quest's own chartered shape (event-derived state, opt-in per-repository
enrollment, a non-hosted first release), plus a rebuild time budget for the documented
forced-full-rebuild escape hatch (`FR-PROJ-5`, `BB-08`). It also reasoned from that target
to a conclusion about the transactional-semantics question, and separately explained why
it chose no storage or index engine at that time: D2 had not yet been ruled, and the
[research programme Spec](../specs/quest-cli-pre-implementation-research-program.md)
prohibits "freezing runtime... packaging, supported-platform, or integration choices
whose required Lore evidence is unfinished" — a concrete engine choice is exactly such a
freeze, because it is made in the vocabulary of a runtime that this component has not yet
chosen.

`QCLI-20` explicitly stopped short of deciding any of this: no ADR, no register edit, no
engine. The component owner has now ruled on all of it, in the live session this ADR
records.

## Decision

**`QCLI-20`'s proposed design points, rebuild time budget, and rebuild-on-doubt
conclusion are accepted as-is. Register entry D5 is closed. This ADR made no engine choice;
the later QCLI-72 implementation baseline selects Bun SQLite as the disposable engine.**

| Dimension | Accepted design point |
| --- | --- |
| Record count | ~10,000 active-plus-historical task records per enrolled workspace |
| Event count | ~100,000-150,000 events per enrolled workspace |
| Enrolled-workspace count | ~25 concurrently enrolled workspaces per installation |
| Clone count | ~5-10 live clones per enrolled repository |
| Rebuild time budget, ordinary scale | Low single-digit seconds, at the per-workspace design points above |
| Rebuild time budget, aggregate bound | Low minutes, at the ~25-workspace aggregate bound |

These are design points the projection's read, write, and freshness-reporting paths are
built and tested against — not hard ceilings whose crossing is itself a defect, per
`QCLI-20`'s own framing.

**Rebuild-on-doubt remains sufficient as the projection's primary recovery mechanism at
these design points. Full ACID-style cross-record transactional semantics are not implied
by this scale target.** A full replay of a Git-tracked event history at the accepted
per-workspace order of magnitude is accepted as completing inside the accepted rebuild
time budget, so the cheaper implementation — rebuild-on-doubt over a durable
transactional index — is the one this scale target requires.

**No storage or index engine was chosen by this ADR.** At its 2026-08-05 decision point,
D2 had not been ruled and the research programme prohibited a runtime-dependent choice.
That historical boundary no longer describes the active baseline: D2 is Bun and QCLI-72
selects Bun SQLite as the disposable projection engine. This scale target and rebuild time
budget remain that engine's sizing inputs.

Deliberately **not** decided here: D7a (Quest's archival model) and D7b (legacy Opum
evidence retention, routed to `opum-doc`); the not-found convention's `lore-doc` boundary
half; and any edit
to the open component decisions register, the component contracts and delivery graph, or
the delivery roadmap — all reserved for `QCLI-28`.

## Consequences

- **Register entry D5 can be marked closed**, citing this ADR — the mechanical edit to
  the register table itself is `QCLI-28`'s job, not this document's.
- **The projection's read, write, and freshness-reporting paths are built and tested at
  the accepted design points** (~10,000 records, ~100,000-150,000 events per enrolled
  workspace, ~25 workspaces, ~5-10 clones per repository) rather than at the single- or
  double-digit scale this campaign's own corpus currently exercises.
- **No durable transactional index is required to satisfy this scale target.**
  Rebuild-on-doubt, invoked through the documented forced-full-rebuild escape hatch
  (`FR-PROJ-5`, `BB-08`), stays the projection's primary recovery mechanism.
- **`FR-PROJ-3` and `FR-PROJ-4`'s incremental-resume checkpoint requirements are
  unaffected.** They are already a narrower, already-accepted form of durable write — a
  monotonic checkpoint of how far the projection has read, not a transactional guarantee
  over record contents — and this ADR neither adds to nor relaxes them.
- **This conclusion is scale-dependent by construction and expected to invert** if a
  future ruling sets the scale target meaningfully higher than accepted here — for
  instance, at anything closer to a multi-tenant or hosted-portfolio scale, which the
  component charter currently routes outside this component entirely. Because that scale
  is out of this component's chartered scope today, this ADR does not design for it, and
  does not foreclose a future ADR reopening this question if the scale target itself is
  later revised.
- **The Bun SQLite projection must treat this scale target and rebuild time budget as its
  sizing input.** This ADR did not spend that budget on an engine choice; QCLI-72 did.
- **At the ~25-workspace aggregate bound, the operator-confirmation UX for a very large or
  multi-workspace rebuild stops being optional.** Designing that UX is not fixed by this
  ADR; it is a candidate this scale target now obliges a future task to adopt rather than
  defer indefinitely.
