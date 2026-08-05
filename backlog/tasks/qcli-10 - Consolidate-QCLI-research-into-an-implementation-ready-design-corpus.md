---
id: QCLI-10
title: Consolidate QCLI research into an implementation-ready design corpus
status: To Do
assignee: []
created_date: '2026-08-05 11:39'
updated_date: '2026-08-05 11:41'
labels:
  - campaign
  - quest
  - cli
  - design
  - architecture
  - requirements
  - roadmap
  - no-implementation
  - 'doc:stories/prepare-quest-cli-for-implementation-activation'
dependencies: []
documentation:
  - docs/stories/prepare-quest-cli-for-implementation-activation.md
priority: high
type: feature
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The completed QCLI-1..QCLI-9 research campaign produced twelve deliverables organised by research task rather than by what an implementer needs. This campaign adds a derived design layer over that evidence: an open-decisions register, ADRs promoting settled-but-buried decisions, a functional-requirements Spec with a single ID space, a runtime-neutral architecture Spec, and a staged delivery roadmap.

The twelve research documents are cited as evidence and are not edited, superseded, or rewritten - they carry dated provenance and recheck clauses the clean-room audit depends on.

This campaign adds no product source, no package metadata, and no runtime dependency, and freezes no choice whose required Lore evidence is unfinished. Implementation remains gated on the Lore-owned release gate.

Like QCLI-2, this parent is not dispatched as a worker task; it is settled once its children are Done.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The derived design layer exists as five documents and does not modify any of the twelve research deliverables
- [ ] #2 Every requirement, decision, and phase in the new layer cites the research document and settling task it derives from
- [ ] #3 Runtime, native packaging, supported platforms, projection storage engine, and product license remain open and are recorded as such, not frozen
- [ ] #4 No product source, package.json, bin entry, runtime dependency, scaffolding, or install instruction is added
- [ ] #5 Strict Lore gates pass: lore validate, lore check, and lore orphans all report zero errors
<!-- AC:END -->
