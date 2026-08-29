---
id: QCLI-149
title: >-
  Final summary has no clear or append operation, unlike its Backlog
  counterparts
status: To Do
assignee: []
created_date: '2026-08-29 15:14'
labels:
  - parity
  - task-edit
dependencies: []
priority: low
type: feature
ordinal: 181000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-147 made 'task edit --final-summary' work. Setting it to empty stores an empty string, which matches how --summary and --description behave, so Quest is internally consistent and this is not a defect.

But Quest already has --clear-parent, --clear-milestone, --clear-ac and --clear-dod, so 'clear' is an established Quest idiom that final summary does not participate in. Backlog 1.50.1 has both --clear-final-summary and --append-final-summary (docs/reference/quest-cli-backlog-migration-fidelity-contract.md line 189).

--append-final-summary is the more interesting of the two: a final summary written before review, then extended with what review found, is the shape this campaign has used repeatedly.

Filed from the QCLI-147 review, 2026-08-29, which explicitly scoped it out of that task. Not urgent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 task edit accepts --clear-final-summary, rejecting it in combination with --final-summary the way --clear-ac rejects a replacement.
- [ ] #2 task edit accepts --append-final-summary, repeatable, appending in CLI order after any --final-summary replacement, matching how --append-plan and --append-notes already compose.
- [ ] #3 Both reach task edit-batch through the shared fold, and every surface that publishes the edit vocabulary declares them.
<!-- AC:END -->
