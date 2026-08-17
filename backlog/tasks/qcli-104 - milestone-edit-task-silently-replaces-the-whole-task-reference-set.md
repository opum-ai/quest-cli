---
id: QCLI-104
title: milestone edit --task silently replaces the whole task reference set
status: To Do
assignee: []
created_date: '2026-08-17 15:27'
updated_date: '2026-08-17 16:26'
labels:
  - cli
  - planning
  - correctness
  - data-loss
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
documentation:
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
priority: medium
type: bug
ordinal: 127000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`milestone edit --task` overwrites the milestone's entire `taskIds` list with whatever is passed, silently discarding references the caller did not mention. The flag name gives no hint of replace semantics, and it is inconsistent with how the task commands handle the same problem.

Candidate: v0.2.0, native darwin-arm64 sha256 1d5491bd90ab7fb3a9d97d700023088ebbbae75ce23eca4dc345076895cb5ad5.

## Repro

    $ quest task create "Real task" --actor jdn --actor-kind human --json          # -> T-1
    $ quest milestone create "Dangling" --task T-does-not-exist --task T-1 \
        --actor jdn --actor-kind human --json
    $ quest milestone list --json
    {..."taskIds":["T-does-not-exist","T-1"]}

    $ quest milestone edit M-1 --task T-also-fake --actor jdn --actor-kind human --json
    {"schemaVersion":1,"kind":"milestone.records","data":{"kind":"success","revision":"024ae09..."}}
    $ quest milestone list --json
    {..."taskIds":["T-also-fake"]}

T-1, a real task, is gone. Exit code 0, no warning, and because the edit response carries no record (QCLI-103) the caller cannot even see what the list became without a follow-up read.

## Why this reads as a defect rather than a design choice

- `--task` is repeatable and accumulates on `create`, so the same flag means 'add these' in one command and 'replace everything with these' in the other.
- The task commands already model partial reference edits explicitly: `task edit` takes `--add-label` and `--remove-label` rather than a bare replacing `--label`. The planning group has no equivalent, so there is no way to add or drop a single milestone reference.
- The destructive form is the short, obvious one. A caller wanting to attach one more task to a milestone will reach for `--task`, and will silently detach every other task.

If replace is the intended semantic, it needs a name that says so and the additive pair alongside it.

## Related observation, not part of this task

A dangling reference is accepted at write time but is reported by `quest doctor` as `milestone_task_not_found`, so write-freely-detect-later appears deliberate and is covered:

    $ quest doctor --json
    {..."healthy":false,"issues":[{"code":"milestone_task_not_found","milestoneId":"M-1","taskId":"T-does-not-exist"}]}
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Adding a task reference to a milestone does not remove references the caller did not name
- [ ] #2 The planning groups expose additive and subtractive reference editing, consistent with task edit's --add-label and --remove-label
- [ ] #3 Any wholesale-replace form is named so the semantic is explicit at the call site
- [ ] #4 A test edits a milestone that already has two task references, adds a third, and asserts all three are present
<!-- AC:END -->
