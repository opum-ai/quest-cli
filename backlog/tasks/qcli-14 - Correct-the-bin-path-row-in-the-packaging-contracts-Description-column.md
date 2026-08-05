---
id: QCLI-14
title: Correct the bin-path row in the packaging contract's Description column
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 12:51'
labels:
  - campaign
  - 'cluster:packaging'
  - registry
  - correction
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-1
  - merge-pending
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirm the defect: in the 'Conflicting/reference names on the public registry' table (packaging contract, Dated registry evidence section), the @opum-ai/lore row's Description cell holds a bin path (bin `lore` -> bin/lore.cjs) instead of a published description string, unlike every other populated row.
2. Fix by widening column semantics: add a new 'Bin' column to the table header and every row (filled '-' where not observed, matching the table's existing convention for uncaptured fields). Move the @opum-ai/lore row's bin path value into the new Bin column; set its Description cell to '-' since no npm description was ever captured for that package in the original 2026-08-04 sweep. Do not touch the 4 dated npm view timestamps or any other observed value.
3. Add an inline, dated correction note directly after the table citing QCLI-14 and 2026-08-05, explaining the relocation without re-deriving or re-dating the underlying observation.
4. Read-only check of docs/reference/quest-cli-research-source-register.md for a pin on the packaging contract; do NOT edit that file (QCLI-15 owns it this wave). Record findings in task notes.
5. Run lore validate --strict, lore check, lore orphans; capture exact output.
6. lore sync if needed, then commit docs/ changes with a Refs: QCLI-14 trailer, push branch.
<!-- SECTION:PLAN:END -->
