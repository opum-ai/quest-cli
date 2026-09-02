---
id: QCLI-165
title: >-
  task list can never return completed or archived tasks -- not via default, not
  via --status Done, not via any flag
status: To Do
assignee: []
created_date: '2026-09-02 20:26'
labels:
  - cli
  - tasks
  - tracker-contract
dependencies: []
references:
  - src/application/tasks/local-task-repository.ts
  - src/application/tasks/tasks.ts
  - src/application/command-help.ts
priority: high
type: bug
ordinal: 194000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found via opag/lcli coordination on the ISSUES.md batch (LCLI-375 orphans false-positive), reproduced live against the installed quest 0.3.0 binary and confirmed at the root-cause line, 2026-09-02.

Reproduction: init a scratch workspace, create+complete a task (T-1, now status Done), create a second To-Do task (T-2). 'quest task list --json' with no filter returns only T-2. 'quest task list --status "Done" --json' (and lowercase 'done') both return an empty array, even though 'quest task view T-1 --json' proves T-1 exists with status Done.

Root cause: LocalTaskRepository.snapshot() (src/application/tasks/local-task-repository.ts:268-317) reads three separate directories -- tasks/, completed/, archive/tasks/ -- into one taskRecords array tagged by location. readAll() (line 371-379) then derives the public .tasks field by filtering to location === "tasks" only, unconditionally dropping completed and archived records. listFiltered() (src/application/tasks/tasks.ts:439-451) sources its entire working set from snapshot.tasks -- the already-stripped array -- so no --status/--exclude-status value can ever see a completed or archived task; they are gone before the status predicate runs at all.

This contradicts the documented contract: command-help.ts's own usage example for task list is '[--status "To Do"] [--exclude-status "Done"]', which only makes sense if Done tasks are normally included and --exclude-status is how you remove them. Today the opposite holds unconditionally, and there is no flag that restores them.

Downstream impact confirmed real: this is the actual root cause feeding lore-cli's orphans command false 'dangling' flag on completed, correctly-linked tasks (LCLI-375) -- lore has no way to distinguish 'genuinely orphaned' from 'quest just won't show me this task' because task list silently omits the second case.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 task list --status "Done" (and any configured terminal status) returns completed tasks; task list --status <archived-equivalent> or an explicit flag returns archived tasks
- [ ] #2 Unfiltered task list's default scope (active-only vs. everything) is decided explicitly and documented in command-help.ts's usage line, rather than left as an accidental all-locations-except-tasks exclusion
- [ ] #3 task view already resolves completed/archived tasks correctly (confirmed working) -- list gains parity with view's location-agnostic lookup rather than view losing it
- [ ] #4 A regression test covers: list with no filter, list --status <terminal>, and list --exclude-status <terminal>, each against a task in tasks/, completed/, and archive/tasks/
<!-- AC:END -->
