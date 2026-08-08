---
id: QCLI-51
title: >-
  Reconcile the campaign stage-state table with the never-committed reality of
  in-review and merge-pending
status: In Progress
assignee: []
created_date: '2026-08-08 13:46'
updated_date: '2026-08-08 14:08'
labels:
  - campaign
  - 'cluster:campaign-machinery'
  - wave-1
dependencies: []
priority: medium
type: chore
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

SKILL.md's "Campaign stage -> Backlog state" table presents six campaign stages, each mapped to a Backlog status plus labels. Two of those stages — `in-review` and `merge-pending` — name labels that `reference/wave-loop.md` section (f), as amended by QCLI-49, deliberately writes to the working tree and then **discards uncommitted** before the affected branch reaches (g)'s rebase, reconstructing the final label set only at settlement (i). Line 222 states this outright: "they are deliberately never committed at all; they are folded into the settlement commit's label state instead." Neither label is therefore ever observable in committed Backlog state.

`merge-pending` carries a second, narrower defect: it has no stated point of action. `wave-loop.md:130` instructs applying it only as a trailing parenthetical — `--add-label in-review`, "and later `merge-pending`" — and "later" names no step. Section (g)'s eight-step merge walk never mentions it. Settlement (i) removes it at lines 195 and 200, and (g)'s precondition paragraph at line 160 refers to it as an established transition.

The consequence is not cosmetic. R2 (restore's ground-truth verification) classifies leftover branches and worktrees after a crashed session by cross-checking them against Backlog state — but two of the six stages it would cross-check against can never appear in a committed task file.

## Origin and verification

Surfaced by QCLI-49's worker as an out-of-scope discovery during doc-11 wave 3, and correctly left alone there: it is pre-existing and unrelated to QCLI-49's commit-policy scope.

Re-verified at doc-12 init on 2026-08-08 against `b2ad797` rather than taken on doc-11's word. That check corrected the inherited framing in two ways, both of which this task inherits:

1. doc-11 recorded that "no step anywhere adds it." An add instruction **does** exist, at `wave-loop.md:130`. What is missing is a point of action, not the instruction.
2. doc-11 scoped the finding to `merge-pending` alone. `in-review` sits in exactly the same position under (f) steps 3-4 and line 222, and is removed by the same settlement calls. Two table rows are affected, not one.

## Owner ruling (2026-08-08, obtained at doc-12 init before dispatch)

**Broader — reconcile the whole table.** The disposition is not to settle `merge-pending` in isolation. SKILL.md's stage-state table must distinguish stages that are durably recorded in committed Backlog state from those that exist only as uncommitted working-tree edits, covering `in-review` as well as `merge-pending`, and the R2 crash-recovery consequence must be addressed directly rather than left as an implication for a reader to derive.

The owner was offered three narrower alternatives and did not take them: treating `merge-pending` as vestigial and deleting the row; giving it a point of action in (g) at the cost of a write-then-discard ceremony; and leaving the disposition for the worker to derive. Recording that here so a later reader does not re-propose a narrower fix as an improvement.

This ruling is recorded verbatim in this description so that it travels with the task rather than living only in the campaign document.

## Constraint

Whatever shape the fix takes, it must not reintroduce the rebase conflict QCLI-49 closed. Mid-wave task-file label edits are never committed on `<default>` while that task's branch is unmerged; a fix that makes these stages durable by committing them on `<default>` mid-wave is out of bounds.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SKILL.md stage-state table distinguishes, for every row it lists, stages durably recorded in committed Backlog state from those existing only as uncommitted working-tree edits
- [ ] #2 The disposition of merge-pending is settled explicitly and stated at its point of action: either the step that applies it is named in reference/wave-loop.md, or the stage is recorded as vestigial and removed from the table; the current trailing "and later" parenthetical at line 130 no longer stands as the only instruction
- [ ] #3 in-review receives the same treatment as merge-pending, with any difference in how the two are handled stated and justified rather than left implicit
- [ ] #4 SKILL.md R2 states how leftover branches and worktrees are classified given that these labels may be absent from committed state, so a crash-recovery reader is not directed to cross-check against a state that cannot appear
- [ ] #5 No remaining passage across SKILL.md and reference/wave-loop.md describes these labels in a way another passage contradicts, and the result is consistent with QCLI-49 rule that mid-wave task-file label edits are never committed on <default> while the branch is unmerged
- [ ] #6 The skill Provenance section records this change per the repo convention, and the skill version is bumped or the absence of a bump is explicitly justified
<!-- AC:END -->
