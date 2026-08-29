---
id: QCLI-150
title: List replace plus add silently discards the add
status: To Do
assignee: []
created_date: '2026-08-29 23:12'
labels:
  - task-edit
  - correctness
dependencies: []
priority: medium
type: bug
ordinal: 182000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Combining a wholesale list replacement with an add in one 'task edit' silently drops the add. Confirmed live on dev b87fffc:

    task edit T-1 --plan '["a"]' --add-plan b   -> plan is ['a']
    task edit T-1 --labels '["x"]' --add-label y -> labels are ['x']

foldEditPatch short-circuits: 'if (patch.plan !== undefined) next.plan = [...patch.plan]; else if (addPlan...)'. The same shape applies to labels, implementationNotes and comments (src/application/tasks/edit-patch.ts).

This is the lost-update class QCLI-138 removed from checklists, in a different field family: the caller asked for two things and got one, with no error. Quest now has three answers to 'replace and modify in one command' - compose (finalSummary, QCLI-149), silently drop (these lists), and reject (checklists, foldCheckList). Two of those are defensible; silently dropping is not.

Found by the independent review of QCLI-149 on 2026-08-29, which checked whether that task's compose behaviour really matched the pattern it claimed to copy. It did not - these drop.

Preference, not yet decided: compose, matching finalSummary and mergeList's own documented 'current minus removed, then new entries not already present' contract. Rejecting would also be honest but is a harder break for existing callers.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Combining a list replacement with an add in one edit either composes or errors; it never silently discards the add.
- [ ] #2 The chosen rule is applied consistently across labels, plan, implementationNotes and comments, and stated in foldEditPatch's documentation alongside the checklist and finalSummary rules.
- [ ] #3 A test covers replace-plus-add for each of the four families, and was confirmed red against the current behaviour.
<!-- AC:END -->
