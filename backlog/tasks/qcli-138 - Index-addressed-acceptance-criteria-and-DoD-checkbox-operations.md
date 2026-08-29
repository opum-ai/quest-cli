---
id: QCLI-138
title: Index-addressed acceptance-criteria and DoD checkbox operations
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-29 00:31'
updated_date: '2026-08-29 05:56'
labels:
  - cli
  - parity
  - correctness
dependencies:
  - QCLI-134
references:
  - src/application/tasks/edit-patch.ts
  - src/application/command-contract.ts
priority: high
type: feature
ordinal: 170000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Quest can only replace acceptance criteria and definition-of-done wholesale, via --acceptance-criteria / --definition-of-done taking a JSON array. Checking one box is therefore read-modify-write: read the list, flip one entry, write the whole list back. Two editors doing that concurrently silently lose each other checkmarks.

Backlog 1.50.1 addresses entries by index instead: --check-ac, --uncheck-ac, --remove-ac, --clear-ac and the --check-dod / --uncheck-dod / --remove-dod peers.

QCLI-134 identifies this as the only one of its nine parity gaps with a correctness dimension rather than ergonomics. Filed out of that register with the owner deciding to implement (2026-08-29).

Quest already has the machinery: EditPatchVocabulary and foldEditPatch (src/application/tasks/edit-patch.ts) are the single fold both task edit and task edit-batch consume, and the checklist value type already carries {index, text, checked}.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 task edit supports index-addressed check, uncheck, remove and clear for acceptance criteria, and the same for definition of done.
- [x] #2 Checking one box does not rewrite untouched entries: a concurrent-editor test proves two sequential index-addressed edits both survive, where two wholesale replaces would not.
- [x] #3 task edit-batch accepts the same operations through the shared fold, and the manifest field lists for task edit and task edit-batch declare them.
- [x] #4 The existing wholesale --acceptance-criteria / --definition-of-done replace continues to work unchanged.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend EditPatchVocabulary with index-addressed checklist ops: checkAcceptanceCriteria, uncheckAcceptanceCriteria, removeAcceptanceCriteria, clearAcceptanceCriteria plus the definitionOfDone peers. Indexes are 1-based on the public surface (Backlog 1.50.1 convention); the domain TaskCheckItem stays 0-based.
2. Add one foldCheckList helper in src/application/tasks/edit-patch.ts. It resolves every index op against the same base list simultaneously, then re-indexes. Base is the wholesale replacement when --acceptance-criteria was given, otherwise current state. Out-of-range or non-integer index throws check_index_out_of_range, so the single edit path returns a validation diagnostic and the batch path errors at that item index. Emit the field only when it actually changes.
3. Publish the eight new field names on task edit and task edit-batch in src/application/command-contract.ts, so the batch key allowlist picks them up from the manifest.
4. src/cli/main.ts: add repeatable --check-ac/--uncheck-ac/--remove-ac and the --*-dod peers, boolean --clear-ac/--clear-dod (booleanFlags plus the edit only() allowlist), a parseIndexList helper rejecting anything but a positive integer, and batch value-grammar branches for the index-list and boolean-clear fields ahead of the existing add|remove list regex.
5. src/application/command-help.ts: list the new flags under task edit.
6. Tests: new test/integration/tasks/checklist-index-ops.test.ts covering all four ops for AC and DoD, the batch transport through the shared fold, the AC4 wholesale-replace regression, index validation, and the AC2 concurrent-editor proof - two edits computed from one shared snapshot both survive, where two wholesale replaces lose one. Update test/contract/command-contract.test.ts field lists.
7. Run bun test, lint, typecheck; review; PR to dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented on branch quest/qcli-138-index-checkboxes (Opum lease c39ea20bdf84e1b4425e69804b6207c6, slot 1), commit 54267a2 off dev 740b4f7.

Design decisions:
- Public positions are 1-based, matching the tracker vocabulary Quest is at parity with (docs/reference/quest-cli-backlog-migration-fidelity-contract.md line 189 lists exactly --check-ac/--uncheck-ac/--remove-ac/--clear-ac and the dod peers). The domain TaskCheckItem index stays 0-based.
- All eight operations resolve in one new foldCheckList helper inside the existing foldEditPatch, so task edit and task edit-batch cannot drift. Every index addresses the same base snapshot read under the write lock that persists the result, so the outcome is order-independent and the survivors are re-indexed exactly once.
- The wholesale replacement, --clear-*, and the index operations are mutually exclusive. Combining them is check_operation_conflict, mirroring the tracker's own collision guard (same reference doc, line 250). Merging them would hand back a list neither editor asked for, which is the lost-update shape this vocabulary removes.
- A wholesale replacement is still passed through untouched, so an authored index that does not match its position keeps failing the domain's check_item_index_mismatch instead of being silently renumbered.
- --clear-dod has no Backlog counterpart; added for symmetry with --clear-ac per AC1.

Independent review of 54267a2 returned six findings; all are closed in 6376e2d.

- HIGH: the tracker contract's task edit required-field list (src/contract/tracker/index.ts) is compared to the manifest by exact sorted equality, and probe() failed closed against a real Quest. The list had already drifted by four fields since QCLI-133; the eight new ones widened it to twelve. Contract list and conformance fixture now carry all twelve, and a new test probes the manifest Quest actually publishes rather than the hand-written fixture. Verified red by deleting one field.
- MEDIUM: --remove-ac N with --check-ac N was accepted and the check evaporated. Now the same check_index_conflict as check+uncheck.
- MEDIUM: check_operation_conflict and check_index_conflict are decidable from argv, so they are usage errors at exit 2 with a corrective hint, matching every other flag-collision guard. check_index_out_of_range stays validation because it depends on stored state. The rule stays in the fold, so edit-batch still reports it per item.
- MEDIUM: the AC2 test now seeds two tasks so both transports face the same start state, and its comments no longer claim a shared stale read the index half never had.
- LOW: batch grammar accepted 1e21 where the flag parser rejected it; both now require a safe integer.
- LOW: the fold's JSDoc claimed a write lock the single task edit path does not take (it is an optimistic compare-and-set).
- Filed QCLI-146 for the review's out-of-scope finding: TrackerEditPatch and editArguments, the third transport over the same fold, still cannot reach the index operations.

Validation on quest/qcli-138-index-checkboxes @ 6376e2d: bun test 315 pass / 1 fail, the fail being the pre-existing sqlite-projection.test.ts loader bug under local bun 1.2.23 (QCLI-130, passes on the CI-pinned 1.3.14). typecheck, biome format:check and layer:check clean; the 2 biome lint warnings are pre-existing in files this branch does not touch.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Quest could only replace acceptance criteria and definition of done wholesale, so checking one box was read-modify-write and two editors working from the same read silently lost each other's checkmarks.

Added --check-ac / --uncheck-ac / --remove-ac / --clear-ac and the --*-dod peers to 'quest task edit', and the eight matching fields to the 'task edit-batch' vocabulary. Positions are 1-based on the public surface, matching the tracker Quest is at parity with; the domain TaskCheckItem index stays 0-based. All eight resolve in one new foldCheckList inside the shared foldEditPatch, so the two transports cannot drift: every index addresses the same base snapshot, the outcome is order-independent, and survivors are re-indexed once. The wholesale replacement, --clear-*, and the index operations are mutually exclusive, mirroring the tracker's own collision guard; a wholesale replacement still passes through untouched so its authored indexes keep facing the domain's validation.

Review also caught that the tracker contract's required manifest field list had drifted, breaking QuestTrackerClient.probe() against a real Quest, and that nothing compared the conformance fixture to the published manifest. Both are fixed and now guarded by tests.

Verified by test/integration/tasks/checklist-index-ops.test.ts (7 tests, 76 assertions) covering all four operations for both lists, the batch transport, index and grammar validation, the collision guards, the AC4 wholesale regression, and the stale-read case where an index-addressed edit keeps a checkmark a wholesale replace loses. Full suite on 6376e2d: 315 pass / 1 fail, the fail being the pre-existing sqlite-projection loader bug under local bun 1.2.23 (QCLI-130). typecheck, format:check and layer:check clean.
<!-- SECTION:FINAL_SUMMARY:END -->
