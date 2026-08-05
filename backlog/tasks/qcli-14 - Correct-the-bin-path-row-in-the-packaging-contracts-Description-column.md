---
id: QCLI-14
title: Correct the bin-path row in the packaging contract's Description column
status: To Do
assignee: []
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 12:35'
labels:
  - campaign
  - 'cluster:packaging'
  - registry
  - correction
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: low
type: docs
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The packaging contract dated-evidence table has a Description column carrying published package descriptions. The @opum-ai/lore row instead carries a bin path in that column, where every other populated row carries a description string.

QCLI-2.9 settlement listed this as a follow-up item. The other two items in that list were closed by QCLI-2.11 and QCLI-2.12; this one appears in no later task scope and was never filed. Verified still present on 2026-08-05.

This is a dated-evidence table. Do not re-derive the observation - correct where the observed value is placed, or widen the column semantics, without changing what was observed or when.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The bin path no longer occupies a column whose semantics it does not match, and the row remains internally consistent with the other rows
- [ ] #2 No dated observation is changed, re-derived, or re-dated; only placement or column semantics change
- [ ] #3 The correction is recorded inline and dated, citing this task
- [ ] #4 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->
