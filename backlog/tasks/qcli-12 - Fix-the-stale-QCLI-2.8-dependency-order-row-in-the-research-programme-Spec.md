---
id: QCLI-12
title: Fix the stale QCLI-2.8 dependency-order row in the research programme Spec
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 12:50'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Verify QCLI-2.8's live Backlog dependencies via 'backlog task view QCLI-2.8 --plain' (done: QCLI-2.2, QCLI-2.3, QCLI-2.4, QCLI-2.5, QCLI-2.6, QCLI-2.7, QCLI-2.11, QCLI-2.12, QCLI-2.13, QCLI-2.14 -- ten total).
2. Edit docs/specs/quest-cli-pre-implementation-research-program.md's Dependency order table: change the QCLI-2.8 row's Depends-on cell from 'QCLI-2.2-QCLI-2.7' to the full ten-item set, and add a dated inline correction note (citing QCLI-12, dated 2026-08-05) directly beneath the table rather than silently rewriting the cell, following this repo's existing dated-correction convention (e.g. the register's 'corrected 2026-08-04 by QCLI-2.7' style).
3. Read (not edit) docs/reference/quest-cli-research-source-register.md's 'Prior QCLI research records' slice to check whether it pins the research programme Spec. If it does, per the wave's MANDATORY constraint I do NOT edit the register (QCLI-15 owns it concurrently in this wave) -- instead record the exact pinned line/SHA/text in --append-notes as a separate-follow-up finding.
4. Run 'lore validate --strict', 'lore check', and 'lore orphans' from the worktree root; capture exact output.
5. 'lore sync' if needed, then commit docs/ changes explicitly (sync does not auto-commit docs/ here) with a 'Refs: QCLI-12' trailer, avoiding raw < > { } in the subject line.
6. Record notes via --append-notes with decisions, register-pin finding, and gate evidence.
7. Push fix/qcli-12-research-programme-dependency-order. Do not check ACs, write a final summary, move status to Done, or touch the register/campaign doc/other files.
<!-- SECTION:PLAN:END -->
