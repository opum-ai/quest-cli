---
id: QCLI-19
title: Propose the canonical identifier grammar and authored-record layout
status: To Do
assignee: []
created_date: '2026-08-05 12:33'
updated_date: '2026-08-05 12:35'
labels:
  - campaign
  - 'cluster:identity'
  - decisions
  - phase-1
  - proposal
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: high
type: spike
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Register entry D4. The canonical identifier grammar is an open component decision resolved by no document in the research campaign, and it gates the authored-record layout, which gates Phase 2.

Constraints already settled and not reopenable here:
- Quest does not inherit Backlog.md project-configurable prefix, zero-padding, or dot-suffixed hierarchy. That is an accepted ADR.
- A task has one canonical identity; aliases resolve to it and never constitute a second identity.
- Identifier uniqueness is enforced by Quest own comparison logic, never delegated to filesystem case behaviour, because that differs across platforms and would make identity platform-dependent.
- Exactly one lease exists per canonical task system-wide, not one per identifier form.
- Migration maps on the pair of source folder and source identifier, and must be reversible.

Propose a grammar satisfying all of the above, plus the authored-record layout and naming scheme it implies. Cover Unicode normalisation and case-folding behaviour explicitly - scenario TM-10 runs across two real filesystems.

Deliver a proposal for owner ruling. Do not edit the open component decisions register; a separate pass reconciles it once the owner rules.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A canonical identifier grammar is proposed with the alternatives considered and the reason for the recommendation
- [ ] #2 The proposal states how it satisfies each of the five settled constraints named in the description
- [ ] #3 Unicode normalisation and case-folding behaviour are specified explicitly, with the cross-filesystem collision case addressed
- [ ] #4 The implied authored-record layout and naming scheme are described, including how records are enumerated exactly once across nested subdirectories
- [ ] #5 The document is framed as a proposal for owner ruling; no decision is recorded as accepted and no ADR is created
- [ ] #6 The open component decisions register is not edited by this task
- [ ] #7 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->
