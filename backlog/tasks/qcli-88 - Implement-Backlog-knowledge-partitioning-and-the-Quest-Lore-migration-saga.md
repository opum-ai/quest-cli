---
id: QCLI-88
title: Implement Backlog knowledge partitioning and the Quest-Lore migration saga
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-16 17:47'
labels:
  - quest-0.1
  - 'wave:migration'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-87
documentation:
  - >-
    docs/adr/keep-lore-optional-and-integrate-only-through-versioned-public-records.md
  - docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/adapters/lore/
  - src/application/migration/backlog-knowledge.ts
  - test/integration/migration/lore-saga.test.ts
priority: high
type: feature
ordinal: 106000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Coordinate optional full Backlog adoption with Lore's released knowledge-adoption contract from LCLI-332. Quest must partition issue records from documents and decisions, invoke only Lore's public CLI, link returned stable concept IDs, and compensate a failed two-product apply without weakening Quest's standalone mode.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Issue-only Backlog adoption remains fully usable when Lore is absent
- [x] #2 Full adoption requires a compatible Lore manifest and routes decisions, specs, guides or runbooks, and other documents to the accepted Lore types
- [x] #3 One approved plan covers both products; Lore applies first, Quest applies second, and verification succeeds only when both mappings agree
- [x] #4 Failure at every boundary compensates Quest then Lore in reverse order or records blocked-incomplete with every surviving artifact
- [x] #5 Quest never writes Lore documents, managed blocks, indexes, configuration, or projection databases directly
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect the released Lore public manifest/export contract alongside Quest’s existing Lore projection adapter and Backlog importer to define a versioned, CLI-only migration boundary.
2. Partition Backlog records into issue adoption and Lore knowledge candidates, validating manifest compatibility and accepted Lore type routing while preserving standalone issue-only behavior.
3. Implement the two-product saga: approved mapping, Lore-first apply through public CLI, Quest-second application, cross-product verification, and stable concept-ID linkage.
4. Add compensation for every Lore/Quest boundary, preserving exact blocked-incomplete survivors when compensation cannot complete and never writing Lore-owned storage directly.
5. Add integration/fault coverage, run focused checks, obtain independent review, integrate, and settle evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Integrated tree `5aa93ba`: final verification passed `bun test test/integration/migration/lore-saga.test.ts test/integration/migration/migration.test.ts` (22 passing, 75 assertions), `bun run typecheck`, focused Biome, and `git diff --check`. Independent review verified CLI-only Lore boundary, compensation safety, and complete mapping checks.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the Lore 0.3 public-CLI Backlog adoption saga: issue-only operation, knowledge partition/type routing, combined approval, Lore-first/Quest-second apply, stable concept links, and guarded reverse compensation with explicit blocked-incomplete evidence. Verified through 22 migration tests and independent review.
<!-- SECTION:FINAL_SUMMARY:END -->
