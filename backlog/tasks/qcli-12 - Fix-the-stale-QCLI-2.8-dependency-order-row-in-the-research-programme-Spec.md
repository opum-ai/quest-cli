---
id: QCLI-12
title: Fix the stale QCLI-2.8 dependency-order row in the research programme Spec
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 13:01'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1: Verified QCLI-2.8's live Backlog dependencies via 'backlog task view QCLI-2.8 --plain' -> Dependencies field lists ten items: QCLI-2.2, QCLI-2.3, QCLI-2.4, QCLI-2.5, QCLI-2.6, QCLI-2.7, QCLI-2.11, QCLI-2.12, QCLI-2.13, QCLI-2.14. Updated docs/specs/quest-cli-pre-implementation-research-program.md's Dependency-order table row for QCLI-2.8 from "QCLI-2.2-QCLI-2.7" to "QCLI-2.2-QCLI-2.7, QCLI-2.11, QCLI-2.12, QCLI-2.13, QCLI-2.14" to match.

AC2: Added a dated inline correction note directly beneath the table ("Corrected 2026-08-05 by QCLI-12: ...") explaining the prior six-item cell, citing QCLI-2.14's original deferral and the wave-4 integration review's re-confirmation that leaving it untouched was correct at the time, per this repo's existing dated-correction convention (matching the register's "corrected 2026-08-04 by QCLI-2.7" style). Not a silent rewrite.

AC3 (register-pin finding, per this wave's MANDATORY constraint -- register file NOT edited, QCLI-15 owns it concurrently this wave): docs/reference/quest-cli-research-source-register.md's "Prior QCLI research records" slice (heading at line 818) DOES pin this document. At lines 953-956 it reads: "The **research Spec** (`../specs/quest-cli-pre-implementation-research-program.md`) is last amended at `157ad56` (2026-08-04 14:09:46 -0500, `QCLI-2.14` -- the same commit that amends the Lore dependency evidence document below)." This is an exact-SHA commit-pin (not a self-pin -- the register does not co-edit the Spec in the same pass), so it will go stale the moment this task's commit(s) merge to dev, per the register's own documented pattern for this failure mode (see its migration-ledger and QCLI-2.8-document self-pin bullets in the same slice for the general shape of the problem). A separate follow-up task is needed to re-point this pin (SHA and amending-task attribution) at the research Spec's new last-touch commit once QCLI-12 merges. Not actioned here per the wave's explicit routing of all register edits to QCLI-15 to avoid a real merge collision.

AC4 -- Lore gates (worktree root, run after 'lore sync' reconciled the expected status-drift/managed-block-drift on the owning Story from marking this task In Progress, consistent with this campaign's established convention):
- lore check --plain -> "38 files, 0 errors, 0 warnings" (exit 0)
- lore validate --strict --plain -> "38 files, 0 errors, 0 warnings, 6 skipped" (exit 0)
- lore orphans --plain -> "0 orphan tasks, 0 dangling links" (exit 0)

Scope discipline: only docs/specs/quest-cli-pre-implementation-research-program.md was edited for content; docs/log.md and docs/stories/follow-through-on-the-quest-cli-design-layer.md changed only as the documented side effect of 'lore sync' reconciling status/managed-block drift (verified via 'git diff dev -- docs/reference/quest-cli-research-source-register.md' showing zero diff -- register untouched). No other document touched; no acceptance criterion checked; no status moved to a terminal state; no summary written.

Commits: befd442 (chore(backlog): sync task changes -- lore sync's automatic backlog/ commit) and 5bc5e55 (docs: correct the stale QCLI-2.8 dependency-order row in the research programme Spec, Refs: QCLI-12).

Downstream-reach findings (recorded, not actioned -- both target files are concurrently owned by other tasks this wave, per the reviewer's fix-pass instruction):

2a. docs/reference/quest-cli-open-component-decisions.md:216, 'Residual items recorded but never filed' table, row: "The research programme Spec's dependency-order row for QCLI-2.8 is stale — it reads a range that predates the 2.11–2.14 corrections | QCLI-2.14, deferred to an owner decision | A reader mis-reads the synthesis inputs". QCLI-12 both filed this residual item (this task IS the filing) and fixed the underlying staleness in docs/specs/quest-cli-pre-implementation-research-program.md. Once this branch merges to dev, the row is false on both counts: the item is no longer 'never filed' and the Spec's dependency-order row is no longer stale. QCLI-17 is this file's current wave-owner, but QCLI-17's scope is a different section ('A reclassification trigger that has probably fired,' about Backlog.md v1.49.3) -- it does not cover line 216 and will not incidentally catch this. A separate future correction pass is needed to update or retire that row.

2b. docs/reference/quest-cli-component-contracts-and-delivery-graph.md:128-131, sentence: "The Spec's Dependency order table … names only the six deliverables QCLI-2.2–QCLI-2.7; the full ten-item dependency set … is named in this task's own Backlog record (QCLI-2.8's Dependencies field), not in the Spec's table." This sentence was written as a workaround describing the exact defect QCLI-12 fixes. Once this branch merges, it becomes false: the Spec's Dependency order table now names the full ten-item set directly, not just the six, so the sentence's premise (only six named, ten-item set found only in Backlog) no longer holds. QCLI-16 is this file's current wave-owner, but QCLI-16's scope is the licensing-source misattribution under 'Unresolved component decisions' -- it does not cover lines 128-131 and will not incidentally catch this. A separate future correction pass is needed to update that sentence.
<!-- SECTION:NOTES:END -->
