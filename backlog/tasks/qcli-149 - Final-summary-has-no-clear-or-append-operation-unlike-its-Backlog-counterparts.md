---
id: QCLI-149
title: >-
  Final summary has no clear or append operation, unlike its Backlog
  counterparts
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-29 15:14'
updated_date: '2026-08-29 23:13'
labels:
  - parity
  - task-edit
dependencies: []
priority: low
type: feature
ordinal: 181000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-147 made 'task edit --final-summary' work. Setting it to empty stores an empty string, which matches how --summary and --description behave, so Quest is internally consistent and this is not a defect.

But Quest already has --clear-parent, --clear-milestone, --clear-ac and --clear-dod, so 'clear' is an established Quest idiom that final summary does not participate in. Backlog 1.50.1 has both --clear-final-summary and --append-final-summary (docs/reference/quest-cli-backlog-migration-fidelity-contract.md line 189).

--append-final-summary is the more interesting of the two: a final summary written before review, then extended with what review found, is the shape this campaign has used repeatedly.

Filed from the QCLI-147 review, 2026-08-29, which explicitly scoped it out of that task. Not urgent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 task edit accepts --clear-final-summary, rejecting it in combination with --final-summary the way --clear-ac rejects a replacement.
- [x] #2 task edit accepts --append-final-summary, repeatable, appending in CLI order after any --final-summary replacement, matching how --append-plan and --append-notes already compose.
- [x] #3 Both reach task edit-batch through the shared fold, and every surface that publishes the edit vocabulary declares them.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Owner reversed the earlier deferral 2026-08-29: resolve everything open before tagging and releasing.

Two operations, each with an established Quest pattern to copy rather than invent.

1. --clear-final-summary mirrors --clear-ac exactly: a boolean in booleanFlags, a clearFinalSummary member on EditPatchVocabulary, and the same collision rule - combining it with --final-summary or --append-final-summary is check_operation_conflict's peer, a usage error at exit 2 with a hint naming the corrective combination. Reuse that error shape rather than adding a third vocabulary for the same idea.
2. --append-final-summary mirrors --append-plan and --append-notes: repeatable, applied after any replacement in CLI order, so '--final-summary X --append-final-summary Y' yields X then Y. Those two append to string LISTS though, and finalSummary is a scalar, so decide the join explicitly: append with a blank line between paragraphs, which is what a summary extended after review actually looks like.

3. The compile-time parity guard from QCLI-146 will fail the moment EditPatchVocabulary gains either member and will name TrackerEditPatch as the surface that must follow; the QCLI-138 probe guard will then name the tracker contract's required list and its conformance fixture; and the QCLI-147 help guard will name commandHelp. Let those three drive the surface sweep instead of listing surfaces from memory - that is what they were built for.
4. Manifest: declare both on task edit and task edit-batch. The batch value grammar treats an unlisted key as a scalar string, which is right for appendFinalSummary only if it is a list - check which, and add it to the boolean set for the clear.
5. Tests: clear empties it; append extends after a replacement in one command and across two; both reach edit-batch through the shared fold; the collision is a usage error; and the guides still pass, since the finalization guide shows --final-summary.
6. Gates, independent review, PR to dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented on quest/qcli-142-145-149-parity, commits 20f105e + 0e74fdd, off dev b87fffc (Opum lease d55672d0bf05b47d8a905e296fa6dc85, slot 1).

Three guards named every surface that had to follow, which is what they were built for: the QCLI-146 compile-time parity assertion named TrackerEditPatch, the QCLI-138 probe guard named the tracker contract's required list and its conformance fixture, and the manifest golden named both edit commands. None had to be recalled from memory.

Independent review mutation-tested all 31 surface deletions and killed every one - 27 by bun test, 4 by typecheck, those being the two interface declarations on each side of the compile-time parity assertion. No publishing surface was missed. What it found instead was that my claims were wrong:

- The comments, AC2, the plan and the commit message all said appending matches --append-plan and --append-notes. Quest spells those --add-plan and --add-note, and they behave the OPPOSITE way: a replacement short-circuits and the add is silently dropped. Verified: 'task edit --plan [a] --add-plan b' yields [a]. So Quest holds three answers to replace-plus-modify - compose here, silently drop for lists, reject for checklists. The documentation now names that divergence and says why each shape is what it is, instead of claiming a match that does not exist. Filed the silent drop as QCLI-150; it is the same lost-update class QCLI-138 removed from checklists.
- An existing summary ending in a newline turned one blank line into three. Base is now trimmed.
- An append of only empty strings on a never-set task wrote empty string, quietly producing the cleared state the exclusivity rule exists to keep separate from append. Empty additions are dropped before deciding whether the patch touches the field at all.
- clear leaves empty string rather than removing the field - the only clear in the vocabulary that does. Documented rather than left surprising. It matches --final-summary '' which already produced this state, per QCLI-147's recorded decision.
- The help-versus-parser guard kept its own copy of the boolean-flag set, so a boolean flag missing from it was probed as --flag=1, rejected for taking a value before only() was consulted, and the guard passed without testing anything. Proved by deleting --clear-final-summary from the allowlist and watching that file stay green. The set is derived from the parser now, and the same deletion fails.
- The batch grammar assertions checked only exit 2, which also passes for 'unknown patch key'. They assert which rejection now.
- The task-finalization guide did not mention append, though write-then-extend-after-review is exactly the workflow it covers and the one that motivated this task. Added before complete rather than after, and QCLI-148's runner executes it.

Validation on 0e74fdd: bun test 356 pass / 0 fail; typecheck, biome format:check and layer:check clean; the 2 remaining lint warnings are pre-existing in untouched files.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
QCLI-147 made 'task edit --final-summary' work, but a summary could only be replaced wholesale. Adds --clear-final-summary and --append-final-summary.

Appending is the one that earns its place: a summary written before review and extended with what review found is the shape every task in this campaign has used, and without it the choice was retype the whole thing or lose the original wording. It is repeatable, applies after any replacement in the same command, and joins with a blank line so an extended summary reads as a second paragraph. --clear-final-summary is exclusive with any value, like --clear-ac, and the collision is a usage error naming the corrective combination.

Three guards located every surface that had to follow rather than my remembering them. Review then mutation-tested all 31 deletions and killed every one, so the sweep was complete - and instead found that the change's own documentation claimed a symmetry with --add-plan and --add-note that does not exist: those silently drop the add when a replacement is present. Filed as QCLI-150. The docs now state the three different rules and why, rather than asserting a false match.

Verified by test/cli-tracker-process.test.ts and the tracker conformance suite: append extends and does not replace, composes with a replacement in one command, is repeatable in CLI order, does not lead with a blank line on a never-set task, and does not double a trailing newline; clear empties and is exclusive; both reach edit-batch through the shared fold with typed grammar; and the finalization guide's new append recipe is executed by QCLI-148's runner. Full suite: 356 pass / 0 fail; typecheck, format:check and layer:check clean.
<!-- SECTION:FINAL_SUMMARY:END -->
