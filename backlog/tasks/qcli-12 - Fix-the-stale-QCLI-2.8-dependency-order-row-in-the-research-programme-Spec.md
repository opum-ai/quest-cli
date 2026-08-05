---
id: QCLI-12
title: Fix the stale QCLI-2.8 dependency-order row in the research programme Spec
status: In Progress
assignee: []
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 13:04'
labels:
  - campaign
  - 'cluster:convention'
  - research
  - correction
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-1
  - merge-pending
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: medium
type: docs
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The research programme Spec Dependency-order table records QCLI-2.8 as depending on "QCLI-2.2-QCLI-2.7". Its live Backlog dependencies are QCLI-2.2 through 2.7 plus QCLI-2.11, 2.12, 2.13, and 2.14 - ten, not six.

QCLI-2.14 found this and explicitly deferred it to an owner decision as out of scope for its own pass; the wave-4 integration review re-confirmed it was correctly left untouched. It was never filed. Verified still stale on 2026-08-05.

Known trap for this task: any task editing a register-pinned document invalidates that pin on merge, whether or not it intended to touch the register. Check whether the research source register currently pins the research programme Spec before merging, and either self-pin in the same pass or record the correction as a separate follow-up.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The QCLI-2.8 row in the Dependency-order table matches its live Backlog dependencies, verified by backlog task view QCLI-2.8
- [ ] #2 The correction is recorded inline and dated, citing this task, rather than silently rewritten
- [ ] #3 If the research source register pins this document, the pin is either updated in the same pass or the need for a separate correction is recorded in the task notes
- [ ] #4 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->
