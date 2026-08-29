---
id: QCLI-147
title: 'task edit cannot set a final summary: --final-summary is create-only'
status: To Do
assignee: []
created_date: '2026-08-29 13:54'
labels:
  - parity
  - task-edit
dependencies: []
priority: medium
type: bug
ordinal: 179000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
quest task create accepts --final-summary. quest task edit does not, and neither the task edit nor the task edit-batch manifest field list carries finalSummary. There is therefore no way to record a final summary on an existing task - the one moment you actually have one.

This is the same class QCLI-133 closed for title, priority, type and ordinal: a field that is write-once at create for no design reason. It was missed there because create already accepted it, so it did not read as a missing field.

Found while writing the QCLI-141 task-finalization guide, whose closing recipe used 'task edit --final-summary' and failed with exit 2. That guide now uses --add-note and states the limitation; it should be reverted to --final-summary once this lands.

The fold that needs it is foldEditPatch (src/application/tasks/edit-patch.ts), which already carries summary and description as plain scalar replaces.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 task edit accepts --final-summary and it round-trips to the stored record.
- [ ] #2 task edit-batch accepts finalSummary through the shared fold, and both manifest field lists declare it.
- [ ] #3 The QCLI-141 task-finalization guide is reverted to the --final-summary recipe and its create-only caveat removed.
<!-- AC:END -->
