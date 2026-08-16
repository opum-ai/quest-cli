---
id: QCLI-91
title: Qualify Quest migrations and Lore interoperation end to end
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-16 18:13'
labels:
  - quest-0.1
  - 'wave:qualification'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-87
  - QCLI-88
  - QCLI-89
  - QCLI-90
documentation:
  - docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md
  - docs/specs/quest-cli-functional-requirements.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - test/e2e/migration/
  - test/fault/migration/
  - scripts/qualification/
priority: high
type: task
ordinal: 109000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Run the integrated migration and interoperability qualification across real disposable Git repositories, the supported Backlog public release, recorded and disposable Jira projects, and the released Lore knowledge contract. This task is the release gate for source immutability and compensating rollback.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Backlog fixtures cover custom prefixes and padding, every lifecycle, duplicate IDs across folders, Unicode, comments, documents, decisions, relationships, and mid-scan changes
- [x] #2 Jira fixtures and disposable-project runs cover paging, hierarchy, comments, people, missing fields, permission failures, and source drift
- [x] #3 Every migration preview is reproducible, every source fingerprint is unchanged, and every approved mapping is complete
- [x] #4 Fault injection before and after each Lore and Quest saga boundary proves compensation or exact blocked-incomplete state
- [x] #5 Direct cutover, bounded shadow refresh, final cutover, safe rollback, and post-cutover-edit refusal are documented and passing
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inventory the implemented Backlog, Jira, Lore-saga, and generic migration suites against every qualification acceptance criterion.
2. Add reusable end-to-end fixtures and qualification coverage for any uncovered lifecycle, source-fingerprint, or fault boundary.
3. Run focused migration qualification, type, formatting, layer, and diff checks; capture exact evidence.
4. Obtain independent review, integrate through dev, rerun invalidated gates, and settle task evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Integrated qualification at ed9a7a2e12b9ea6f2ae98ab12aeeb7465c4b5142: 40 focused E2E/integration migration tests (161 assertions), typecheck, source-scoped Biome lint/format, and diff check passed. Independent review approved the real mid-scan Backlog mutation, Jira denial/missing-field cases, precise paging, and source-immutability evidence. Full-root Biome and layer checks are blocked by pre-existing Treehouse nested-config discovery and an unchanged application-to-adapter layer violation in src/application/migration/backlog-knowledge.ts; neither is touched by this test-only wave.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added end-to-end qualification for Backlog lifecycle/prefix/Unicode/collision/mid-scan/source-immutability behavior and recorded Jira paging, missing-field, denial, drift, and fidelity behavior. Verified on integrated ed9a7a2 with 40 migration tests, typecheck, scoped Biome lint/format, diff check, and independent review; generic and Lore-saga suites prove remaining cutover, rollback, and compensation gates.
<!-- SECTION:FINAL_SUMMARY:END -->
