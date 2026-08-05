---
id: QCLI-27
title: >-
  Record the Quest CLI D1 (license, contributor provenance) and D3 (platform
  matrix, ownership) owner rulings
status: To Do
assignee: []
created_date: '2026-08-05 22:37'
updated_date: '2026-08-05 22:38'
labels:
  - campaign
  - decisions
  - phase-1
  - governance
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
  - 'cluster:governance'
dependencies: []
documentation:
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
type: docs
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Register entries D1 (product license and contributor provenance) and D3 (supported-platform matrix and final npm package ownership) are the two Phase 1 items the follow-through Story explicitly could not touch: D1 is owner-held and D3 needed a human to claim ownership. The component owner ruled on both in a live session on 2026-08-05, captured in the owning Story. This task records both rulings and adds the resulting LICENSE file.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A dated reference document (or ADR, at the implementer's judgment, following this bundle's existing convention for governance-level rulings) records: D1 license = MIT; D1 contributor provenance = informal/none for now; D3 supported-platform matrix = macOS + Linux + Windows; D3 ownership explicitly claimed as quest-cli-owned
- [ ] #2 The same document records D2 (runtime) ownership explicitly claimed as quest-cli-owned, while stating plainly that the runtime choice itself remains deferred to post-activation and is not decided by this task
- [ ] #3 A root LICENSE file exists using the MIT license text, with a copyright line dated 2026 attributed to opum-ai
- [ ] #4 The document names the owning Story as the ruling's provenance, dated 2026-08-05
- [ ] #5 lore validate --strict passes on the new/changed files
<!-- AC:END -->
