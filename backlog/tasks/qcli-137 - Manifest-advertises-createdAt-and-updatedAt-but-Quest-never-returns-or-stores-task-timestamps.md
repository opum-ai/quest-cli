---
id: QCLI-137
title: >-
  Manifest advertises createdAt and updatedAt, but Quest never returns or stores
  task timestamps
status: Done
assignee: []
created_date: '2026-08-29 00:06'
updated_date: '2026-08-29 14:44'
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
- [x] #5 task list --sort createdAt and --sort updatedAt are restored to the sort vocabulary that QCLI-139 removed, and order by the stored values.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OWNER DECISION 2026-08-29: implement the timestamps, and reverse QCLI-139's removal of the two sort fields.

QCLI-139 dropped --sort createdAt and --sort updatedAt from TASK_LIST_SORT_FIELDS (src/cli/main.ts and src/application/tasks/tasks.ts) precisely because Quest stores neither, so they would have sorted every task on an empty string. Restoring them is part of this task's scope, not a follow-up: the fields exist in the manifest, in TaskState, and in the task view field list, so the only missing pieces are storage, population and the sort surface.

AC1 is therefore settled in favour of implementing rather than de-advertising.

Implemented on quest/qcli-137-timestamps, commits a10949e + 680a52c, off dev 37f3816 (Opum lease 2190c1b81f04e8f6aab841cc4411635a, slot 1).

AC3 is not applicable: it was the alternative branch of AC1, and the owner chose to implement rather than de-advertise.

Storage needed no schema change - TaskState and taskSchema already declared both as optional strings and nothing ever wrote them. TaskService takes an injected clock (trailing optional argument, defaulting to new Date()) and stamps at create, promote, edit, lifecycle move, and each applied batch row. Stamping in the service keeps taskState() a pure normalizer. Records written before this are not backfilled: their next edit gains an updatedAt, and createdAt stays absent rather than invented, so an unstamped task sorts as unknown - after every stamped one ascending, first when reversed, exactly like an unrecognized priority.

Independent review confirmed create reads the clock once, batch rows stamp independently, no path overwrites a newer timestamp with an older one, createdAt survives every mutation, and the fields round-trip on disk across processes. It found four real problems, all fixed in 680a52c:
- HIGH: draft promote created a task without stamping it. Under the no-backfill policy that record could NEVER acquire a createdAt, leaving a task promoted today indistinguishable from a legacy record.
- The AC4 guard checked task create, whose 'fields' is the settable-input vocabulary (it carries addLabels and clearParent, and omits id and status), so an output-presence assertion does not apply to it and would have failed spuriously later. It also skipped 'search', which is the third command that actually declared the timestamps. Corrected to the three read surfaces. My commit message and this task's description both had the same factual error about which commands declared them.
- GateService wrote a mutated task without advancing updatedAt. Library-only today, no CLI wiring, but stale is worse than absent.
- The Backlog importer parsed created_date and updated_date but wrote them only into the provenance blob, so imported tasks sorted last forever with the real date two layers away in the same record. Now carried onto the record. Confirmed no date is fabricated on either path.
Plus: editOn silently overwrote a caller-supplied timestamp and now rejects it like gates; three updatedAt assertions used >= which passes when nothing advances; the injected clock had no caller so a test pins it; and the sort vocabulary, duplicated across two files, now has a test keeping the copies equal.

Validation on 680a52c: bun test 351 pass / 0 fail; typecheck, biome format:check and layer:check clean; the 2 remaining lint warnings are pre-existing in untouched files. The AC4 guard, the sort-sync guard and the timestamp stamping were each confirmed red by reverting them.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The manifest declared createdAt and updatedAt on task list, task view and search. Nothing ever wrote them, so a consumer reading the contract provisioned for fields that did not exist. The owner chose to implement rather than de-advertise, and to restore the two sort fields QCLI-139 had to drop.

Storage needed no schema change; both fields were already declared optional and simply never populated. TaskService now takes an injected clock and stamps every path that persists a task: create, draft promote, edit, lifecycle move, each applied batch row, and a gate mutation. Pre-existing records are not backfilled - inventing a creation time is worse than leaving it absent - so an unstamped task sorts as unknown rather than oldest. The Backlog importer, which already parsed the source dates into a provenance blob, now carries them onto the record so an imported task keeps its real history.

The durable piece is AC4's guard: it creates a task with every settable field and asserts every field the three read surfaces declare is actually emitted. It fails for any future manifest field the CLI never writes, which is the class this bug was an instance of. Review corrected it - it had been checking task create, whose field list is the settable-input vocabulary, and skipping search.

Verified by test/cli-tracker-process.test.ts, test/integration/tasks/tasks.test.ts and test/contract/command-contract.test.ts: both fields present on create, view, list and promote; updatedAt strictly advancing across edit, complete and archive; createdAt stable throughout; a pinned clock proving create reads it exactly once; --sort createdAt and --sort updatedAt ordering, with an edit making the two orderings differ so neither can be an alias for the other; and the manifest, sort-vocabulary and stamping guards each confirmed red by reverting them. Full suite: 351 pass / 0 fail; typecheck, format:check and layer:check clean.
<!-- SECTION:FINAL_SUMMARY:END -->
