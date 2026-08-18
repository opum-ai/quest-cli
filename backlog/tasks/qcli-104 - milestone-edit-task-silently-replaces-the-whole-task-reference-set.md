---
id: QCLI-104
title: milestone edit --task silently replaces the whole task reference set
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 15:27'
updated_date: '2026-08-17 21:52'
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
- [x] #1 Adding a task reference to a milestone does not remove references the caller did not name
- [x] #2 The planning groups expose additive and subtractive reference editing, consistent with task edit's --add-label and --remove-label
- [x] #3 Any wholesale-replace form is named so the semantic is explicit at the call site
- [x] #4 A test edits a milestone that already has two task references, adds a third, and asserts all three are present
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reconfirm milestone create/edit parsing and QCLI-101 value-flag matrices on top of QCLI-103. 2. Keep repeatable --task for create, reject it for edit, and add repeatable --add-task, --remove-task, and --replace-task edit flags. 3. Compute deterministic taskIds while preserving unnamed references; reject replace combined with add/remove and reject add/remove overlap before writing. 4. Add black-box coverage starting with two references, adding a third, removing one, explicitly replacing the set, and asserting returned QCLI-103 milestone.updated records. 5. Extend every-value-flag and repeated-collection tests, run focused/full gates, obtain independent review, then rebuild and qualify the combined 0.2.5 native artifacts once.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented explicit repeatable --add-task, --remove-task, and --replace-task milestone edit semantics with deterministic de-duplication, order preservation, and invalid-combination rejection. Bare --task is create-only. Coordinator review found and fixed a shared-allowlist leak that had allowed decision edits to silently ignore milestone flags; regressions now prove all three are rejected without mutation. Independent re-review approved. Focused evidence: 17 tests / 625 expectations, typecheck, formatting, and diff check pass. Final native artifact rebuild and full gates remain at the combined planning-wave delivery boundary.

Final cumulative evidence: formatted full bun run check passes; focused parser/process suite passes 17 tests / 625 expectations and combined planning/contract suite passes 28 / 690; check:packages and test:packages pass; all six 0.2.5 artifacts match; independent cumulative review approved.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Milestone edit now preserves unnamed references through explicit repeatable --add-task and --remove-task operations, with an explicit --replace-task form for wholesale replacement. Invalid combinations and milestone-only flags on decisions fail before mutation. Verified ordered de-duplication, no-data-loss behavior, full tests, packed launcher, and six native artifacts.
<!-- SECTION:FINAL_SUMMARY:END -->
