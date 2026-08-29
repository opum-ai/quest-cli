---
id: QCLI-137
title: >-
  Manifest advertises createdAt and updatedAt, but Quest never returns or stores
  task timestamps
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-29 00:06'
updated_date: '2026-08-29 23:54'
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
- [x] #1 A decision is recorded: either Quest stores and returns createdAt/updatedAt, or the manifest stops declaring them on task list, task view and task create.
- [x] #2 If timestamps are implemented: quest task view and quest task list return createdAt and updatedAt for a newly created task, and updatedAt advances on a task edit.
- [ ] #3 If they are dropped instead: the manifest no longer declares them, and the removal is recorded as deliberate so downstream qualification can cite a source.
- [x] #4 Either way the manifest and the CLI agree, verified by a test that fails if the manifest declares a task field the CLI never emits.
- [x] #5 Restore createdAt and updatedAt to the task list --sort field set, which QCLI-139 had to drop; an absent timestamp sorts last ascending
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Owner settled AC1 in favour of implementing (2026-08-29), and added AC5: restore the two sort fields QCLI-139 had to drop.

Storage needs no schema change - TaskState and taskSchema already declare createdAt and updatedAt as optional strings (src/domain/tasks/tasks.ts). Nothing ever populated them. So this is four write paths, not a record migration.

1. TaskService gains an injected clock: a trailing optional 'now: () => Date' constructor argument defaulting to new Date(), matching how the codebase already passes 'now' explicitly to ready() and claimState(). Timestamps are ISO-8601 via toISOString().
2. Stamp at the four places a task record is written: create() sets both; editOn(), moveTask() (complete/archive/demote) and each applied editBatch row advance updatedAt. Stamping in the service rather than in taskState() keeps the domain normalizer pure.
3. Do NOT backfill existing records. A task written before this lands has no createdAt, and inventing one is worse than leaving it absent; updatedAt appears on its next edit. State that in the task notes rather than fabricating history.
4. AC5: restore createdAt and updatedAt to TASK_LIST_SORT_FIELDS in both src/application/tasks/tasks.ts and src/cli/main.ts, and update the --sort error-message test that enumerates the fields. Absent timestamps sort LAST in ascending order, matching the unknown-priority rule - a task with no timestamp is unknown, not oldest.
5. AC4 is the generalizable guard: a test that creates a task with every settable field, then asserts that every field the manifest declares for task view, task list and task create is actually present in the emitted JSON. That fails for any future manifest field the CLI never emits, which is the defect class this task is an instance of.
6. Gates, independent review, PR to dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented on branch quest/qcli-137-task-timestamps (67c05c6).

TaskService takes an injected clock (trailing optional 'now: () => Date') and stamps ISO-8601 UTC at the four write paths: create() sets createdAt and updatedAt to the same instant; editOn(), moveTask() (complete/archive/demote) and each applied editBatch row advance updatedAt. Stamping lives in the service, not in taskState(), so the domain normalizer stays pure.

No backfill, deliberately. A record written before this has no createdAt; inventing one would be worse than admitting there isn't one. Its updatedAt appears on the next edit.

Migration imports are unaffected and were checked, not assumed: src/application/migration/backlog-public.ts persists through taskState() + applyTransaction, never through TaskService.create(), so imported records neither gain a synthetic createdAt nor lose the source timestamps already carried in the summary blob.

AC5 (sort fields restored): createdAt and updatedAt are back in TASK_LIST_SORT_FIELDS in both src/application/tasks/tasks.ts and src/cli/main.ts. An absent timestamp sorts LAST ascending via a '\\uffff' sentinel, which is greater than every ISO-8601 string; that matches the unknown-priority rule - no timestamp is unknown, not oldest.

Verification: bun run check passes end to end (typecheck, lint, format, layer, 346 tests, 0 fail). The two lint warnings it reports are pre-existing on dev and were confirmed unrelated by stashing.

New coverage:
- test/integration/tasks/timestamps.test.ts: create stamps both equal; edit advances updatedAt and never rewrites createdAt; a lifecycle move is a write and advances updatedAt; --sort createdAt/updatedAt orders correctly with a seeded pre-QCLI-137 record proving absent-sorts-last in both directions.
- test/integration/tasks/tasks.test.ts: an injected fake clock proves the exact stamps and that createdAt is written once - the CLI test cannot assert strict advance because two writes can share a millisecond.
- test/integration/tasks/manifest-field-coverage.test.ts: the AC4 guard, generalized past this defect.

The AC4 guard was verified RED, not just green: adding a phantom 'bogusNeverEmitted' field to the task view manifest entry made it fail with that field named in the diff, then it was reverted. It creates a task with every settable field populated so no declared field can be absent for the innocent reason that it was never set, then asserts task list, task view, task create and search each emit every field their own manifest entry declares.

Original repro is closed: 'quest task create --json' and 'quest task view T-1 --json' both return createdAt and updatedAt, and .quest/tasks/T-1.json stores them.

Independent review (high effort) found four gaps; all four fixed in 71facfe with red-verified coverage.

1. HIGH, real: 'draft promote' called bare createTask() and bypassed the stamping in create(), so a promoted draft was born with no timestamps and sorted last under --sort createdAt as though it predated the feature. Notably the AC4 guard could NOT catch this - 'draft promote' declares no fields in the manifest, so it is invisible to a manifest-vs-emission test. Covered directly in timestamps.test.ts instead.
2. MEDIUM: Backlog imports parsed createdAt/updatedAt but left them inside the summary JSON blob, so an imported corpus was indistinguishable from pre-timestamp records. Now promoted to the top-level fields the schema advertises. This corrects the claim in my earlier note that migration needed no change: it needed one line, and the review was right.
3. LOW: gate appends rewrite the durable record but left updatedAt unchanged, contradicting 'every write advances updatedAt'. GateService now takes the same injected clock.
4. LOW: createdAt was patchable through the public service API. Both the single and batch edit paths now reject it with task_created_at_immutable rather than silently overwriting a write-once field.

Findings 2 and 3 were verified RED by reverting the fix and watching the new test fail, then restoring. bun run check exits 0 after all four.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Quest now stores and returns task createdAt and updatedAt, closing the manifest-vs-implementation gap the bug reported. TaskService takes an injected clock and stamps ISO-8601 UTC at every write path - create, edit, edit-batch, lifecycle moves, draft promote and gate appends - while createdAt is write-once and rejected as a patch. Existing records are deliberately not backfilled; Backlog imports carry their parsed source timestamps at the top level instead. createdAt and updatedAt are back in the --sort field set, with an absent timestamp sorting last ascending as unknown rather than oldest.

AC1 was settled by the owner in favour of implementing, so AC3 (the drop-instead branch) does not apply and stays unchecked by design.

Verified: bun run check exits 0 (typecheck, lint, format, layer, 352 tests). The AC4 guard was proven red against a phantom manifest field, and the migration fix red against its own revert. The original repro is closed - task create, task view and task list all return both fields and .quest/tasks/T-1.json stores them. Independent review found four gaps including a real one in draft promote; all four are fixed and covered.
<!-- SECTION:FINAL_SUMMARY:END -->
