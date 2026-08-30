---
id: QCLI-155
title: Verify Backlog migration refuses case-only id collisions with live tasks
status: Done
assignee:
  - '@opag-directed'
created_date: '2026-08-30 17:37'
updated_date: '2026-08-30 17:37'
labels: []
dependencies: []
ordinal: 185000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
opag (fleet orchestrator) raised a fleet-wide defect concern: Backlog and Quest task-id prefixes can collide (e.g. this repo's Backlog prefix 'qcli' vs Quest's 'QCLI' differ only by case, on macOS's default case-insensitive filesystem), and asked whether quest migration backlog preview/apply refuses, renumbers, merges, or silently overwrites on collision, plus how dotted Backlog subtask ids (e.g. OPAG-1.1) are handled. Investigation traced the real CLI path (createBacklogImportService / previewInternal in src/application/migration/backlog-public.ts) and found the domain-level assertAliasesAvailable (src/domain/records.ts) already uses a case-folded (Unicode default case fold + NFC) alias comparison and throws a named RecordConflictError on any collision, including case-only ones -- confirmed empirically end-to-end through the real CLI (exit 5, error_type conflict, 'Alias collision: "qcli-1" conflicts with "QCLI-1".'). Dotted subtask ids are preserved as opaque alias strings and never parsed numerically by the import counter, so they cannot perturb it (already covered by an existing passing fixture with TASK-2.1/LCLI-315.4). No source fix was needed -- the gap was test coverage: no test anywhere exercised a live case-only collision through the real CLI-facing service.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A regression test exercises migration backlog preview against a store holding a live task whose id case-collides with an incoming Backlog source id, and asserts refusal (not silent overwrite)
- [x] #2 bun run check passes with the new test
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Trace the real CLI-facing migration path (createBacklogImportService, previewInternal in backlog-public.ts) and the domain-level alias-collision guard (assertAliasesAvailable, aliasKey in records.ts).
2. Confirm empirically via a throwaway store+source fixture whether a case-only collision (existing QCLI-1 vs incoming qcli-1) is refused or silently overwritten.
3. Add a permanent regression test in test/e2e/migration/backlog-public.test.ts locking in the refusal behavior end-to-end through the real CLI.
4. Run bun run format && bun run check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Findings for opag's three questions, with file:line evidence:
(1) Collision behavior: previewInternal (src/application/migration/backlog-public.ts:169-198) never reuses the Backlog source id as the primary target id -- it always mints a fresh sequential id in a hardcoded T- namespace (line ~191, confirmed by this repo's own dogfooded .quest/tasks/T-1.json and T-2.json). The raw Backlog id is preserved only as an alias (src/adapters/migration/backlog/importer.ts:354-358). Before preview or apply can proceed, assertAliasesAvailable (src/domain/records.ts:106-121) checks every candidate id/alias against every existing live task id/alias and throws a named RecordConflictError on any collision -- confirmed empirically end-to-end: exit 5, error_type conflict, message 'Alias collision: "qcli-1" conflicts with "QCLI-1".' This is refusal, not overwrite, renumber, or merge.
(2) Case sensitivity: not case-sensitive -- case-FOLDED (aliasKey, records.ts:90, NFC + Unicode default case fold), which is stricter than exact-match and specifically catches ASCII case variance (already generically tested at test/domain/records.test.ts:79: assertAliasesAvailable(["A","a"], []) throws). In this repo specifically, Backlog's own id: frontmatter field is stored uppercase (QCLI-136, confirmed by reading a live task file), matching Quest's configured taskIdPrefix=QCLI (.quest/workspace.toml) -- so the two systems are not even differently-cased here today, but the guard would still catch it if they were, and it runs before any file write so there is no filesystem-level (case-insensitive-FS) race to worry about.
(3) Dotted subtask ids: the import target-id counter (backlog-public.ts ~183) derives the next id purely by scanning EXISTING QUEST task ids in the T- namespace -- it never parses the source id at all, dotted or not. main.ts's nextTaskId (the Number.isSafeInteger counter opag pointed at) is a completely separate code path used only for quest task create, not backlog import. A dotted Backlog id (e.g. LCLI-315.4, TASK-2.1) is preserved as an opaque alias string, verbatim including the dot -- already exercised by an existing passing fixture in test/e2e/migration/backlog-public.test.ts (the first test in the file imports LCLI-315.4 and TASK-2.1 successfully as T-1/T-3 aliases).
Also noted but NOT changed (flagging, not fixing, since it may be an intentional design choice and changing it is a product decision): imported Backlog tasks always land in a T-N namespace decoupled from the project's real configured taskIdPrefix (QCLI here), diverging from what quest task create now produces. This repo's own dogfood store proves it (T-1/T-2 sit alongside a QCLI- naming scheme nothing else uses). Worth a deliberate decision, not a silent fix.
Verified: added a new e2e regression test (QCLI-155) that creates a live QCLI-1 task, then runs migration backlog preview against a Backlog source containing qcli-1, and asserts exit 5 / error_type conflict / the exact Alias collision message, plus that nothing was written (task list still length 1). bun run check: 376/376 tests pass, typecheck/lint/format/layer clean except the same 2 pre-existing unrelated lint warnings noted in QCLI-154.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
No source defect found -- opag's feared silent-overwrite scenario is already refused today by assertAliasesAvailable's case-folded alias-collision guard (src/domain/records.ts), confirmed empirically end-to-end through the real CLI (exit 5, 'Alias collision: qcli-1 conflicts with QCLI-1'). Dotted Backlog subtask ids are also already safe: they're preserved as opaque alias strings and never numerically parsed by the import counter, which is a separate code path from quest task create's counter. The actual gap was missing test coverage for this exact scenario through the real CLI-facing service; closed with a new regression test in test/e2e/migration/backlog-public.test.ts. Separately flagged (not fixed): imported tasks land in a hardcoded T- id namespace decoupled from the project's configured taskIdPrefix, which may be intentional but is worth a deliberate product decision.
<!-- SECTION:FINAL_SUMMARY:END -->
