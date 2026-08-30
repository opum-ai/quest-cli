---
id: QCLI-146
title: >-
  Expose index-addressed checklist operations on the tracker adapter edit
  surface
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-29 05:55'
updated_date: '2026-08-29 14:17'
labels:
  - parity
  - tracker-contract
dependencies: []
priority: medium
type: feature
ordinal: 178000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-138 added index-addressed acceptance-criteria and definition-of-done operations to 'task edit' and 'task edit-batch', both of which reach them through the shared foldEditPatch. The tracker subprocess contract is the third transport over that same fold and was left behind.

TrackerEditPatch (src/contract/tracker/index.ts) and the editArguments builder that turns it into argv carry no index operations, so a Lore-side tracker adapter can only replace a checklist wholesale. That is the exact read-modify-write hazard QCLI-138 removed from the CLI, still reachable through the adapter.

QCLI-138 did update the contract's required manifest field list, so probe() now passes; this is only about the edit patch type and its argv projection.

Found by independent review of QCLI-138 on 2026-08-29. Not required by any QCLI-138 acceptance criterion.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 TrackerEditPatch carries the eight index-addressed checklist operations that EditPatchVocabulary does.
- [x] #2 editArguments projects each of them to the matching quest task edit flag, with 1-based positions.
- [x] #3 A conformance test drives every new operation through QuestTrackerClient.edit against the real runQuest and asserts the resulting task state.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
The tracker subprocess contract is the third transport over foldEditPatch, and QCLI-138 left it behind. TrackerEditPatch (src/contract/tracker/index.ts) carries the wholesale acceptanceCriteria/definitionOfDone replacement but none of the eight index-addressed operations, so a Lore-side adapter can only read-modify-write a checklist - the exact race QCLI-138 removed from the CLI.

1. Add the eight members to TrackerEditPatch, matching EditPatchVocabulary's names exactly: checkAcceptanceCriteria, uncheckAcceptanceCriteria, removeAcceptanceCriteria, clearAcceptanceCriteria and the definitionOfDone peers. Numbers are 1-based on this surface, as on the CLI.
2. Project them in the edit argv builder to --check-ac/--uncheck-ac/--remove-ac/--clear-ac and the --*-dod peers. appendRepeated already handles repeatable flags but takes strings, so index lists need the numbers stringified; the two clear flags are bare booleans like --clear-parent.
3. Do not re-implement the collision rules. The CLI already rejects replacement-plus-index, clear-plus-anything, and contradictory positions, and the adapter should surface those as the usage errors they are rather than second-guessing them client-side.
4. The manifest required-field list in the same file already carries all eight from QCLI-138, and probe() compares by exact sorted equality, so no manifest change is needed - verify rather than assume.
5. Tests in test/contract/tracker/quest-tracker-client.test.ts: assert the exact argv each operation emits, and drive at least one full round trip through the real runQuest to prove the flags the adapter emits are the flags the CLI accepts. An argv-shape test alone would pass against a misspelled flag.
6. Gates, independent review, PR to dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented on quest/qcli-146-tracker-adapter, commits 7b00940 + b07e2e5, off dev 7dbd612 (Opum lease 42fddbfd69cd825f6b7996cf1db05b17, slot 1).

The eight operations project to --check-ac/--uncheck-ac/--remove-ac/--clear-ac and the --*-dod peers, 1-based as on the CLI. The collision rules are deliberately not reimplemented client-side: a replacement combined with index operations, clear combined with anything, and one position given contradictory operations are already usage errors from quest, and the adapter surfaces them rather than drifting from the CLI.

Independent review confirmed the flags, boolean handling, argv ordering and the manifest claim, and found two contract problems, both fixed in b07e2e5:
- BLOCKING: TrackerOutcome declared five outcomes where Quest's canonical envelope has seven. The 'let the CLI own collisions' design routes three of the five new error paths into 'usage', which the union said could not happen, so an exhaustive consumer switch would receive an object whose type was a lie. Added 'usage' and 'uncaught' to the type and the conformance fixture.
- TrackerEditPatch could not express title, priority, type or ordinal, the four scalars QCLI-133 added to EditPatchVocabulary and never mirrored here, while probe()'s required table demanded Quest advertise all four. Added, with argv projection.
- 'Keep both lists in sync' was a comment that had already drifted twice by that exact route. It is now a compile-time obligation asserted in both directions in the contract test; deleting 'ordinal' again produces three type errors.
- AC3 asked for every operation end to end and the round trip covered four of eight. It now covers all eight plus the four scalars, asserting resulting task state.
- check_index_out_of_range reached consumers as a raw token; it was unreachable from Lore before this branch, so it now carries prose and a hint. The 1-based patch position versus 0-based TrackerCheckItem.index is documented where a caller will see it.

Not addressed, out of scope: fixtures/tracker/v1/conformance.json is an externally shipped Lore-facing fixture that nothing in the repository references or tests, and its manifest entries carry no fields at all. It diverges from src/contract/tracker/fixtures.ts and predates this branch.

Validation on b07e2e5: bun test 347 pass / 0 fail; typecheck, biome format:check and layer:check clean; the 2 remaining lint warnings are pre-existing in untouched files.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
QCLI-138 gave task edit and task edit-batch index-addressed checklist operations through a shared fold. The tracker subprocess contract is the third transport over that fold and was left behind, so a Lore-side adapter could only replace a checklist wholesale - the read-modify-write race QCLI-138 removed from the CLI, still reachable.

TrackerEditPatch now carries the eight operations and projects them to the CLI flags, with the collision rules left to the CLI rather than duplicated. Review then found the surrounding contract wrong in two ways: the outcome union declared five diagnostics where Quest emits seven, and the design's own primary error paths landed in the two it omitted; and the patch still could not express the four scalars QCLI-133 added, while probe() demanded Quest advertise them. Both fixed, and the 'keep both lists in sync' comment that had drifted twice is now a compile-time obligation in both directions.

Verified by test/contract/tracker/quest-tracker-client.test.ts: exact argv for every operation, and a round trip driving all eight plus the four scalars against the real runQuest with task-state assertions - because an argv assertion alone passes against a misspelled flag, which I confirmed by misspelling one. The parity guard was confirmed red by deleting a field. Full suite: 347 pass / 0 fail; typecheck, format:check and layer:check clean.
<!-- SECTION:FINAL_SUMMARY:END -->
