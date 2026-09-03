---
id: QCLI-169
title: >-
  Document --preserve-source-ids's three id-preservation guarantees in the
  migration fidelity contract
status: Done
assignee:
  - '@jeremy'
created_date: '2026-09-03 04:25'
updated_date: '2026-09-03 04:41'
labels:
  - migration
  - docs
  - cutover
dependencies: []
priority: high
ordinal: 198000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Backlog migration fidelity contract doc (docs/reference/quest-cli-backlog-migration-fidelity-contract.md) predates --preserve-source-ids entirely -- it was last requalified 2026-08-15, the flag shipped 2026-08-31 (QCLI-160) -- and covers only default migration. git grep -c "preserve-source-ids" across origin/dev's docs/reference/*.md returns nothing: the flag has no documented contract anywhere in the reference bundle. The only places its dotted-id-translation behavior is recorded today are an e2e test and quest migration backlog preview --help's summary text. opag (2026-09-02) ruled this a cutover prerequisite, not cleanup: the fleet's decision to keep citing dotted subtask ids in prose across five repos after migration rests entirely on the alias-retention property holding, and a property that consumers depend on but no contract names is one refactor away from being removed by someone with no reason to know it matters.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/reference/quest-cli-backlog-migration-fidelity-contract.md gains a section documenting --preserve-source-ids as an opt-in migration mode
- [x] #2 the section states the three guarantees the e2e suite already asserts: a flat in-family id is preserved verbatim; a dotted subtask id is translated to a freshly minted flat id; the dotted spelling is retained as a resolving alias, with its parent threaded through
- [x] #3 scope stays minimal -- this is a new section in the existing contract doc, not a general migration guide
- [x] #4 the section cites QCLI-160 as the origin of the ruling and behavior
- [x] #5 the change is made through lore (not a plain editor) and lore check exits 0
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a dated addendum subsection to docs/reference/quest-cli-backlog-migration-fidelity-contract.md documenting --preserve-source-ids's three guarantees, citing verified source lines and the e2e test.
2. Run lore sync + lore check.
3. Run the repo check suite.
4. Branch, commit, PR, gh pr merge --auto --squash.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added a dated addendum subsection (### --preserve-source-ids id-preservation guarantees, added 2026-09-02 by QCLI-169) to docs/reference/quest-cli-backlog-migration-fidelity-contract.md, after the Findings list and before Notes, explicitly framed as post-implementation (unlike the AC1-5 clean-room contract above it). Verified each source citation directly: src/adapters/migration/backlog/importer.ts:353-360 (alias construction), src/application/migration/backlog-public.ts:378-382 (mapping carries aliases alongside targetIdentifier), src/application/tasks/tasks.ts:142 (buildReferenceIndex indexes every alias). Multi-level parentId chaining is directly regression-tested, not just corroborated by the live preview: test/e2e/migration/backlog-preserve-source-ids.test.ts constructs ODOC-97 -> ODOC-97.5 -> ODOC-97.5.2 (a two-dot grandchild) and asserts both parentId hops resolve (lines ~160-171) -- the same shape as this repo's own QCLI-97.11.1. Cited QCLI-160 as the ruling/origin task; cross-repo corroboration (opum-doc, lore-cli) left in the QCLI-169 task record per opag's direction, not restated in the doc. lore sync + lore check run (63 files, 0 errors, 0 warnings). bun run check: typecheck/lint/format/layer-check clean, 399/399 tests pass. Delivered via PR opum-ai/quest-cli#245, source-gates green, squash-merged to dev as 08442e0 (dev unprotected, gh pr merge --auto --squash landed immediately).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a dated addendum to the Backlog migration fidelity contract doc covering --preserve-source-ids's three id-preservation guarantees (flat verbatim, dotted translated to a fresh flat id with parentId set to the parent's target id, dotted spelling retained as a resolving alias), explicitly scoped as post-implementation and separate from the doc's original AC1-5 clean-room research contract. Cites QCLI-160 as origin and verified source lines in this repo (importer.ts, backlog-public.ts, tasks.ts's buildReferenceIndex) plus the e2e regression test, which directly exercises the multi-level (grandchild) parentId chain. lore check exits 0 (63 files, 0 errors); bun run check exits 0 (399/399 tests). Delivered via PR #245, merged to dev as 08442e0.
<!-- SECTION:FINAL_SUMMARY:END -->
