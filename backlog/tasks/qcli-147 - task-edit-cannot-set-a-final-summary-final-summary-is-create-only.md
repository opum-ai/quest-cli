---
id: QCLI-147
title: 'task edit cannot set a final summary: --final-summary is create-only'
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-29 13:54'
updated_date: '2026-08-29 15:15'
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
- [x] #1 task edit accepts --final-summary and it round-trips to the stored record.
- [x] #2 task edit-batch accepts finalSummary through the shared fold, and both manifest field lists declare it.
- [x] #3 The QCLI-141 task-finalization guide is reverted to the --final-summary recipe and its create-only caveat removed.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
finalSummary is already a domain field (src/domain/tasks/tasks.ts, optional string, in taskSchema) and already declared on task view and task create. Only the edit vocabulary is missing it, so this mirrors how QCLI-133 added title/priority/type/ordinal: a plain scalar replace, not new storage.

1. EditPatchVocabulary gains finalSummary?: string, and foldEditPatch a scalar replace beside summary and description.
2. The QCLI-146 compile-time parity guard will fail the moment step 1 lands, because TrackerEditPatch will no longer mirror the vocabulary. That is the guard doing its job - add finalSummary there too and project it to --final-summary in the edit argv builder. Do not weaken the guard.
3. Manifest: declare finalSummary on task edit and task edit-batch, and mirror in the contract test. The batch key allowlist derives from the manifest at runtime, so it needs no separate change, but its value grammar treats unlisted keys as plain scalar strings, which is already correct for this one - verify rather than assume.
4. CLI: add --final-summary to the task edit only() allowlist and map it with one(). It is already registered as a value-taking flag for task create.
5. Help: list it under task edit.
6. AC3: revert the QCLI-141 caveat. The task-finalization guide currently uses --add-note and states that --final-summary is create-only; restore the --final-summary recipe and delete the caveat. The skill/guides duplication guard and the guide's other claims must still pass.
7. Tests: setting a final summary on an existing task round-trips and is visible in task view; edit-batch carries it through the shared fold; the tracker adapter emits the flag and a round trip against the real CLI proves the CLI accepts it.
8. Gates, independent review, PR to dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented on quest/qcli-147-final-summary, commits 1c6eb56 + 7e7d617, off dev 575672d (Opum lease f6f52507958c59147c5c20970adb757a, slot 1).

finalSummary was already a domain field and already declared on task view and task create; only the edit vocabulary lacked it, so this is a plain scalar replace beside summary and description, and edit-batch gets it through the shared fold.

Two guards built earlier in this campaign did the finding for me. The QCLI-146 compile-time parity assertion failed the moment EditPatchVocabulary gained the field, naming TrackerEditPatch as the one that had to follow. The QCLI-138 probe guard then failed until the tracker contract's required list and its conformance fixture both declared it. Neither surface had to be remembered.

Independent review mutation-tested all ten surfaces that publish the edit vocabulary by deleting the field from each in turn. Nine turned a test red; the tenth, commandHelp's task edit flag list, did not - quest help could silently omit a real flag, because the existing binding only ran documented-implies-accepted. Added the reverse direction in 7e7d617, reading the parser's own allowlist out of main.ts the way the QCLI-137 sort-vocabulary guard does, and confirmed it red.

Also added the three assertions review found missing: the batch envelope's per-item outcome rather than just its exit code, a non-string finalSummary rejected at parse time, and repeat rejection. Recorded the empty-value behaviour rather than leaving it assumed - it stores an empty string exactly as --summary does.

AC3: the QCLI-141 task-finalization guide is back to the --final-summary recipe with the create-only caveat deleted. Review ran every command in that guide and in task-execution against a real store; all exit 0.

Filed two follow-ups review scoped out: QCLI-148 to execute the guides' own commands in a test, which is the guard that would have caught QCLI-141's inexecutable recipe rather than a reviewer running it by hand; and QCLI-149 for --clear-final-summary and --append-final-summary, which Backlog has and Quest does not.

Not addressed, informational: the committed native artifacts under npm/ still answer --final-summary with a usage error. The version is unchanged, so no gate flags it, and the six-artifact rebuild is a deliberate delivery-boundary step.

Validation on 7e7d617: bun test 353 pass / 0 fail; typecheck, biome format:check and layer:check clean; the 2 remaining lint warnings are pre-existing in untouched files.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
quest task edit --final-summary now works, so a closing summary can be recorded when the work is actually finished and corrected afterwards. It was accepted only by task create, which meant a summary written once could never be changed and there was no way to add one to an existing task at all - the same write-once class QCLI-133 closed for title, priority, type and ordinal, missed there because create already accepted it.

The field was already in the domain and already declared on task view, so this is a scalar replace in the shared fold; task edit-batch gets it for free. Two guards from earlier in this campaign located the surfaces that had to follow: the compile-time vocabulary parity assertion pointed at the tracker adapter, and the probe drift guard pointed at the tracker contract and its fixture.

Review then mutation-tested all ten publishing surfaces and found the one nothing covered - the help entry, where the existing binding ran only documented-implies-accepted. The reverse direction is now guarded too.

Reverts the caveat QCLI-141 had to write into the task-finalization guide.

Verified by test/cli-tracker-process.test.ts and test/contract/: the flag round-trips and persists across unrelated edits, replacement works, the batch transport carries it with a per-item outcome, a non-string is rejected at parse time, the flag is single-value, and the help and parser lists agree in both directions. Every new guard was confirmed red by reintroducing the drift it catches. Full suite: 353 pass / 0 fail; typecheck, format:check and layer:check clean.
<!-- SECTION:FINAL_SUMMARY:END -->
