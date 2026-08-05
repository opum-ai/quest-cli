---
id: QCLI-20
title: Propose the scale target and the projection sizing basis it implies
status: To Do
assignee: []
created_date: '2026-08-05 12:33'
updated_date: '2026-08-05 12:35'
labels:
  - campaign
  - 'cluster:projection'
  - decisions
  - phase-1
  - proposal
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: medium
type: spike
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Register entry D5. No scale target is set anywhere in the corpus. Its absence blocks two things: the projection storage or index engine cannot be chosen without it, and the migration read pass cost is known to scale with source-project size but against no stated target.

Propose a target expressed in terms a design can be checked against - record counts, event counts, repository and clone counts, and the rebuild time budget a user would accept - with the reasoning behind each figure rather than round numbers asserted.

Then state what the target implies for the projection: whether rebuild-on-doubt is sufficient or the projection port needs transactional semantics, which the architecture Spec raises and leaves open.

Do not choose a storage engine. Runtime is blocked post-activation as register entry D2, and an engine choice made before the runtime decision would be a freeze the research programme Spec prohibits.

Deliver a proposal for owner ruling. Do not edit the open component decisions register; a separate pass reconciles it once the owner rules.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A scale target is proposed across record, event, repository, and clone dimensions, each with stated reasoning rather than an asserted round number
- [ ] #2 A rebuild time budget is proposed and related to the forced-full-rebuild escape hatch the projection contract requires
- [ ] #3 The proposal states what the target implies for whether the projection port needs transactional semantics
- [ ] #4 No storage or index engine is chosen, and the reason for not choosing one is stated
- [ ] #5 The document is framed as a proposal for owner ruling; no decision is recorded as accepted and no ADR is created
- [ ] #6 The open component decisions register is not edited by this task
- [ ] #7 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->
