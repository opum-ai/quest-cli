---
id: QCLI-148
title: >-
  Execute the instructions guides' own commands in a test, so a guide cannot
  ship a recipe that fails
status: To Do
assignee: []
created_date: '2026-08-29 15:13'
labels:
  - onboarding
  - contract
dependencies: []
priority: medium
type: feature
ordinal: 180000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-141's root cause was a fenced command in the task-finalization guide that exited 2 at the last step of every task: 'task edit --final-summary' did not exist. QCLI-147 made it exist, and the guide is correct again, but nothing stops the next guide edit from shipping an inexecutable recipe.

Review of QCLI-147 raised this after manually running every command in task-execution and task-finalization in sequence against a real store. That sequence is the test.

There is a real subtlety to design around: the recipes are not independent. 'task complete' from To Do exits 6 with an illegal-transition error, so the finalization guide is only correct because the execution guide sets In Progress first. A naive per-line runner would report a false failure. The test needs either an ordered run across guides or per-guide setup, and whichever it is should be stated rather than implied.

Filed from the QCLI-147 review, 2026-08-29.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A test extracts the quest commands from every guide in questGuides and runs them against a real store.
- [ ] #2 The cross-guide ordering dependency is handled explicitly, not by accident: the test states why task-finalization needs task-execution's status change to have happened.
- [ ] #3 The test fails if a guide contains a command the CLI rejects, verified by introducing one.
<!-- AC:END -->
