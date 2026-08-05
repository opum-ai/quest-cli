---
id: QCLI-10.1
title: Author the Quest CLI open component decisions register
status: Done
assignee: []
created_date: '2026-08-05 11:40'
updated_date: '2026-08-05 11:55'
labels:
  - quest
  - cli
  - decisions
  - open-questions
  - blockers
  - register
  - 'doc:stories/prepare-quest-cli-for-implementation-activation'
dependencies: []
documentation:
  - docs/stories/prepare-quest-cli-for-implementation-activation.md
parent_task_id: QCLI-10
priority: high
type: docs
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every open Quest CLI decision is currently scattered across per-task settlement notes, per-contract "Explicitly open" subsections, and two Open questions lists. Several are recorded as unowned by any task, which makes them invisible to planning. Consolidate them into one register that is the direct input to delivery Phase 1.

Each entry records owner, blocker, what unblocks it, and the delivery phase that needs it. Entries that no task owns are marked unowned explicitly rather than left implicit.

Because nearly every entry is a moving reference, the document must carry a recheck clause naming the literal commands to re-run and the disposition of a changed result, per the research programme Spec convention.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The seven unresolved component decisions from QCLI-2.8 each appear with owner, blocker, unblock condition, and consuming phase
- [x] #2 The five research programme Spec open questions each appear, including the two recorded as unowned by any current task
- [x] #3 The per-contract explicitly-open items appear, covering JSON envelope shape, exit-code table, not-found convention, lease timing, lifecycle-stage enum, gate actor eligibility, record layout, event schema, locking primitive, merge strategy, and the Lore invocation surface
- [x] #4 The three external blockers LDOC-4, LCLI-278, and OCLI-7 appear as dated moving references with the literal command to re-check each
- [x] #5 The five Lore adapter rows requiring a lore-doc boundary decision appear as items Quest cannot resolve alone
- [x] #6 Residual follow-ups recorded in task settlement notes but never filed as tasks are enumerated, including the unclaimed supported-platform matrix and the unwritten quest-doc actor model
- [x] #7 The document carries a recheck clause naming literal commands and stating who rules on a changed result
- [x] #8 No entry is resolved, decided, or closed by this task
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Authored docs/reference/quest-cli-open-component-decisions.md.

Structure: how-to-use guidance, a mandatory recheck clause, the seven component decisions (D1-D7b) as a table with owner/blocker/unblock/consuming-phase plus prose detail where the one-line status understates the constraint, a mapping from the research programme Spec five Open questions onto register entries, fifteen contract-level open items, three external blockers, five lore-doc boundary decisions, ten residual items recorded in settlement notes but never filed, the Backlog.md v1.49.3 reclassification trigger, and a closing list of what is NOT open so settled matters are not re-litigated.

Decisions made while authoring:
- Added the Spec-open-questions mapping subsection after first draft, because without it the five coarse-grained Spec questions could not be traced onto the seven finer-grained component decisions, and either list could have been closed while the other still held the question open.
- Recorded D2 and D3 as unowned explicitly rather than leaving ownership blank, since the research states this and it is the fact most likely to be lost.
- Listed residual follow-ups without filing any as tasks: this project requires approval before follow-up work is filed.

Verification: lore validate --strict reports 0 errors 0 warnings; lore check reports 37 files 0 errors 0 warnings; lore orphans reports 0/0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the open component decisions register as docs/reference/quest-cli-open-component-decisions.md. It consolidates the seven unresolved component decisions, the five research programme Spec open questions (mapped onto those entries), fifteen contract-level open items, three external blockers with per-entry recheck commands, five lore-doc boundary decisions, ten residual items found in settlement notes but never filed, and the overdue Backlog.md v1.49.3 reclassification trigger. Entries that no task owns are marked unowned explicitly. Nothing was resolved, decided, or filed. Verified by lore validate --strict, lore check, and lore orphans, all reporting zero errors.
<!-- SECTION:FINAL_SUMMARY:END -->
