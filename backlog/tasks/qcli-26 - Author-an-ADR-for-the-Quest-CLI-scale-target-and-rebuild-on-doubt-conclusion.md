---
id: QCLI-26
title: Author an ADR for the Quest CLI scale target and rebuild-on-doubt conclusion
status: To Do
assignee: []
created_date: '2026-08-05 22:37'
updated_date: '2026-08-05 22:38'
labels:
  - campaign
  - decisions
  - phase-1
  - adr
  - projection
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
  - 'cluster:projection'
dependencies: []
documentation:
  - docs/reference/quest-cli-scale-target-proposal.md
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
type: docs
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-20 proposed a scale target for register entry D5 and a rebuild-on-doubt conclusion for the projection port's transactional-semantics question, but explicitly decided nothing and chose no storage or index engine. The component owner ruled on it in a live session on 2026-08-05, captured in the owning Story. This task records that ruling as an accepted ADR so register entry D5 can be closed truthfully.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An accepted ADR records D5 as closed, accepting QCLI-20's proposed design points as-is: ~10,000 active-plus-historical task records per enrolled workspace, ~100,000-150,000 events per enrolled workspace, ~25 concurrently enrolled workspaces per installation, ~5-10 live clones per enrolled repository, and a rebuild time budget of low single-digit seconds at ordinary per-workspace scale and low minutes at the ~25-workspace aggregate bound
- [ ] #2 The ADR accepts the rebuild-on-doubt-remains-sufficient conclusion: full ACID-style cross-record transactional semantics are not implied by this scale target
- [ ] #3 The ADR states explicitly that it chooses no storage or index engine, consistent with register entry D2 remaining blocked post-activation and the research programme Spec's prohibition on freezing runtime-dependent choices before Phase 0
- [ ] #4 The ADR names QCLI-20's proposal and the owning Story as the ruling's provenance
- [ ] #5 lore validate --strict passes on the new ADR file
<!-- AC:END -->
