---
id: QCLI-137
title: >-
  Manifest advertises createdAt and updatedAt, but Quest never returns or stores
  task timestamps
status: To Do
assignee: []
created_date: '2026-08-29 00:06'
updated_date: '2026-08-29 13:54'
labels:
  - cli
  - contract
  - parity
dependencies: []
references:
  - src/application/command-contract.ts
  - src/domain/tasks/tasks.ts
priority: medium
type: bug
ordinal: 169000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The published command manifest declares createdAt and updatedAt as fields of task list, task view and task create, but the CLI never emits them and the stored record never carries them. A consumer reading the contract will provision for timestamps that do not exist.

Confirmed live on dev 384df4fa1edf8ef717b3f8009365925adb0e342e:

    quest manifest --json      # task view fields include createdAt, updatedAt
    quest task view T-1 --json # neither key present
    cat .quest/tasks/T-1.json  # neither key present

Isolated from ordinary unset-field omission: a task created with --summary, --description, --assignee, --reference and --modified-file all set returned every one of those declared fields, while createdAt and updatedAt were still absent. So this is not "optional field omitted when empty" - Quest has no task timestamps at all.

Same contract-vs-implementation class as QCLI-133, and it is the concrete remainder of QCLI-97.10 AC#2, whose "priority/type/ordinal/dates" coverage claim now holds for priority/type/ordinal (QCLI-133) but still fails for dates. Found while re-verifying QCLI-97.10 under QCLI-133 AC4.

Deciding whether Quest should carry timestamps at all, or whether the manifest should stop advertising them, is a product call and is part of this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A decision is recorded: either Quest stores and returns createdAt/updatedAt, or the manifest stops declaring them on task list, task view and task create.
- [ ] #2 If timestamps are implemented: quest task view and quest task list return createdAt and updatedAt for a newly created task, and updatedAt advances on a task edit.
- [ ] #3 If they are dropped instead: the manifest no longer declares them, and the removal is recorded as deliberate so downstream qualification can cite a source.
- [ ] #4 Either way the manifest and the CLI agree, verified by a test that fails if the manifest declares a task field the CLI never emits.
- [ ] #5 task list --sort createdAt and --sort updatedAt are restored to the sort vocabulary that QCLI-139 removed, and order by the stored values.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OWNER DECISION 2026-08-29: implement the timestamps, and reverse QCLI-139's removal of the two sort fields.

QCLI-139 dropped --sort createdAt and --sort updatedAt from TASK_LIST_SORT_FIELDS (src/cli/main.ts and src/application/tasks/tasks.ts) precisely because Quest stores neither, so they would have sorted every task on an empty string. Restoring them is part of this task's scope, not a follow-up: the fields exist in the manifest, in TaskState, and in the task view field list, so the only missing pieces are storage, population and the sort surface.

AC1 is therefore settled in favour of implementing rather than de-advertising.
<!-- SECTION:NOTES:END -->
