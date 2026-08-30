---
id: QCLI-157
title: Fix three Backlog-migration silent-data-loss/inconsistency bugs
status: Done
assignee: []
created_date: '2026-08-30 17:52'
updated_date: '2026-08-30 18:05'
labels: []
dependencies: []
ordinal: 186000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
opag and e2e-qualify-lore-quest independently reproduced three real defects in 'quest migration backlog preview/apply', all silent (exit 0, valid receipt) except the third which was flagged as inconsistent behavior: (A) acceptance-criteria and definition-of-done checked/unchecked state is dropped on import -- every item comes back checked:false regardless of source -- because importedTask() mapped BacklogCriterion[] down to bare text strings, discarding .checked, and normalizeCheckList() defaults a bare string to checked:false. (B) migration always mints hardcoded T-<n> ids regardless of the destination workspace's configured taskIdPrefix, landing imports in a namespace disconnected from the workspace's real id family and exposing a real (if guarded) collision surface against any workspace's organic T-N tasks. (C) a migrated subtask's parentId is left as the raw pre-migration Backlog source id instead of being rewritten to the parent's real new canonical id, even though the old id is a registered alias of the parent -- so 'task list --parent <real-id>' finds nothing post-migration. opag ruled Bug B should honor the configured taskIdPrefix (matching every other id-allocation path in the CLI) rather than keep a separate reserved namespace.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An imported task's acceptanceCriteria and definitionOfDone preserve the source's [x]/[ ] checked state in the structured JSON field
- [x] #2 quest migration backlog preview/apply mint ids under the destination workspace's configured taskIdPrefix, and the preview-time alias-collision guard still refuses both exact and case-only collisions under that prefix, including against organic (never-imported) tasks
- [x] #3 A migrated subtask's parentId resolves to its parent's real new canonical id, and quest task list --parent <new-id> finds the migrated children
- [x] #4 bun run check passes with RED-then-GREEN regression coverage for all three bugs
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. importedTask() in src/application/migration/backlog-public.ts: stop mapping acceptanceCriteria/definitionOfDone down to bare .text strings, which lose .checked; pass positionally-reindexed {index,text,checked} objects instead (Bug A).
2. previewInternal(): replace the hardcoded T-<n>/.slice(2) id minting with the destination workspace's configured taskIdPrefix, threaded through BacklogImportService's constructor and createBacklogImportService() from main.ts's existing configuredTaskIdPrefix() resolver (Bug B).
3. apply(): before persisting, run every newly-imported task's parentId/dependencies through domain/tasks/tasks.ts's existing canonicalizeTaskLinks() (already used by every other task-write path) against the combined existing+imported task set, so raw pre-migration source ids resolve to their real new canonical ids via the alias table the importer already registers (Bug C).
4. RED-then-GREEN regression tests in test/e2e/migration/backlog-public.test.ts for all three, plus a taskIdPrefix test asserting the preview-time alias-collision guard still refuses organic-id collisions under the configured prefix.
5. bun run format && bun run check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RED-GREEN evidence captured for all three bugs by stashing just the fix (src/application/migration/backlog-public.ts, src/cli/composition.ts, src/cli/main.ts) while keeping the new tests, running them (all 3 new tests failed exactly on the reported symptom: AC checked:false despite [x] source; targetIdentifier T-1 instead of FX-2 under a configured FX prefix; parentId stayed the raw TASK-1 source id instead of resolving to T-1), then popping the stash back and re-running (all 6 tests in the file pass, including the 3 pre-existing ones, confirming no regression).
Bug B design: honoring the workspace's configured taskIdPrefix (opag's ruling) rather than a reserved T- namespace, because it matches every other id-allocation path (nextTaskId in src/cli/main.ts already does this) and needs no new documented carve-out. The preview-time assertAliasesAvailable collision guard is untouched -- it already covers whichever prefix mappings now use -- and a new test proves it still refuses a case-only collision (fx-1 vs an organic FX-1) under a configured prefix, at preview time, before any write.
Bug C uses the existing domain/tasks/tasks.ts canonicalizeTaskLinks() (already the mechanism task create/edit use) rather than a bespoke resolver, so migrated links get exactly the same alias-resolution and graph validation (cycles, self-edges, dependency_target_not_found) as every native write.
Full suite: bun run check green, 379/379 tests (up from 376 on dev), typecheck/lint/format/layer clean except 2 pre-existing unrelated lint warnings (src/application/tasks/tasks.ts:928, test/qcli122-fourth-pass.test.ts:374) predating this change.

REGRESSION FOUND AND FIXED (e2e-qualify-lore-quest, post-PR #223 re-verification): Bug A and Bug C confirmed fixed on first pass. Bug B's fix introduced a false-positive self-collision: when the destination workspace's configured taskIdPrefix matches the Backlog source's own display prefix (the realistic day-one cutover shape, e.g. quest init --task-id-prefix FX against an FX-*-numbered backlog project), the first migrated task's newly minted canonical id (e.g. FX-1) is now the identical string as the bare source-id alias being registered for that SAME task. Two separate call sites treated that self-identity as ambiguous:
1. assertAliasesAvailable's candidate list in previewInternal (src/application/migration/backlog-public.ts) flattened a mapping's [targetIdentifier, ...aliases] without deduping, so the same string appeared twice in the flat candidate list and self-collided against itself.
2. resolver() in src/domain/tasks/tasks.ts (used by canonicalizeTaskLinks, wired in for Bug C) threw dependency_target_ambiguous whenever an alias key was already claimed by ANY task -- including the exact same task -- unlike its sibling createTaskLinkSession.indexIdentity() in the same file, which already correctly compares 'claimed by a DIFFERENT task'.
Fixed both: previewInternal dedupes each mapping's own candidates by alias key before flattening; resolver() now only throws when the key is claimed by a task id different from the one currently registering it (matching indexIdentity's existing, correct pattern). Added a new RED-then-GREEN test reproducing e2e's exact fresh-FX-workspace-same-prefix case (git init + quest init --task-id-prefix FX + FX-1/FX-1.1/FX-1.2 backlog source, zero pre-existing tasks) that fails with the exact reported error before the fix and passes after, plus a same-test assertion that a genuine cross-task case-only collision (a second migration batch's fx-1 against the first batch's real FX-1) still refuses at preview time, exit 5. Full suite: 380/380, bun run check clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed three real Backlog-migration defects opag and e2e-qualify-lore-quest reproduced. (A) acceptanceCriteria/definitionOfDone now preserve source checked state -- importedTask() passes positionally-reindexed {index,text,checked} objects instead of bare .text strings, which normalizeCheckList() always defaults to checked:false. (B) migration now mints ids under the destination workspace's configured taskIdPrefix (threaded from main.ts's configuredTaskIdPrefix() through BacklogImportService) instead of a hardcoded T-<n>, matching every other id-allocation path; the preview-time alias-collision guard is proven to still refuse case-only collisions under that prefix, including against organic tasks. (C) apply() now runs every imported task's parentId/dependencies through the existing canonicalizeTaskLinks() before persisting, so a migrated child's parentId resolves to its parent's real new id via the alias table the importer already registers, instead of staying the raw pre-migration source id -- proven via task list --parent <new-id> actually finding the migrated children, not just a plausible-looking string. Verified with RED-then-GREEN evidence for each bug (temporarily reverted just the fix, confirmed all three new tests fail on the exact reported symptom, restored the fix, confirmed green) plus the full suite: bun run check passes, 379/379 tests, typecheck/lint/format/layer clean.
<!-- SECTION:FINAL_SUMMARY:END -->
