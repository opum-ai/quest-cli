---
id: QCLI-10.1
title: Author the Quest CLI open component decisions register
status: To Do
assignee: []
created_date: '2026-08-05 11:40'
updated_date: '2026-08-05 11:41'
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
- [ ] #1 The seven unresolved component decisions from QCLI-2.8 each appear with owner, blocker, unblock condition, and consuming phase
- [ ] #2 The five research programme Spec open questions each appear, including the two recorded as unowned by any current task
- [ ] #3 The per-contract explicitly-open items appear, covering JSON envelope shape, exit-code table, not-found convention, lease timing, lifecycle-stage enum, gate actor eligibility, record layout, event schema, locking primitive, merge strategy, and the Lore invocation surface
- [ ] #4 The three external blockers LDOC-4, LCLI-278, and OCLI-7 appear as dated moving references with the literal command to re-check each
- [ ] #5 The five Lore adapter rows requiring a lore-doc boundary decision appear as items Quest cannot resolve alone
- [ ] #6 Residual follow-ups recorded in task settlement notes but never filed as tasks are enumerated, including the unclaimed supported-platform matrix and the unwritten quest-doc actor model
- [ ] #7 The document carries a recheck clause naming literal commands and stating who rules on a changed result
- [ ] #8 No entry is resolved, decided, or closed by this task
<!-- AC:END -->
