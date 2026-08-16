---
id: QCLI-89
title: Implement the Jira Cloud importer through jira-cli
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-16 13:09'
labels:
  - quest-0.1
  - 'wave:migration'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-74
  - QCLI-86
documentation:
  - docs/specs/quest-cli-functional-requirements.md
  - docs/reference/quest-cli-component-charter.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/adapters/migration/jira/
  - test/fixtures/jira/
  - test/integration/migration/jira.test.ts
priority: high
type: feature
ordinal: 107000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement one-way Jira Cloud issue adoption solely through the qualified installed jira-cli. Preserve the approved core-plus-comments field set, source identities, drift checks, explicit fidelity gaps, bounded coexistence, cutover, and rollback without owning Jira credentials or transport.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The adapter uses jira-cli argv and JSON only and never reads credentials, calls Jira HTTP endpoints, or parses ADF
- [x] #2 Preview requires complete status mappings and reports every unsupported field or inaccessible issue without approximation
- [x] #3 Issue hierarchy and links, versions, labels, people, timestamps, description, and ordered comments retain source provenance
- [x] #4 Imported Jira people remain source identities and gain no Quest role or gate eligibility without explicit actor adoption
- [x] #5 Paging, source changes, missing permissions, shadow refresh, cutover, and rollback pass recorded-golden and disposable-project tests
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect the existing migration ports, Backlog importer, and frozen Jira fidelity contract to define the adapter boundary and test seam.
2. Implement a jira-cli argv/JSON-only reader with paged inventory, explicit diagnostics, status-mapping validation, source fingerprints, and provenance-preserving conversion.
3. Wire preview, approval, shadow refresh, cutover, rollback, and drift compensation through the existing migration engine without reading credentials or using Jira HTTP.
4. Add recorded golden and disposable-project-style integration coverage for hierarchy, links, people, comments, paging, permissions, missing fields, and source changes.
5. Run focused checks, record evidence, obtain independent review, then complete task settlement.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Independent review requested changes: installed jira-cli 1.0.2 rejects `issue search ... --json`; comments are exposed as `jira comment list <issueKey>`, not `jira issue comment list`. Correct argv and add public-contract coverage before integration. Review also found no end-to-end migration-service exercise for AC5; assess and implement only within the existing task boundary.

Integrated tree `b340fb0`: independent review found and verified corrections for Jira CLI 1.0.2 argv, top-level comment listing, and zero-exit JSON error-envelope classification. Validation passed: `bun test test/integration/migration` (30 passing), `bun run typecheck`, `bunx biome check src/adapters/migration/jira test/integration/migration/jira.test.ts test/fixtures/jira`, and `git diff --check`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the jira-cli argv/JSON-only MigrationSource adapter with bounded paging, complete status-map validation, source fingerprints/provenance, explicit fidelity gaps, ADF refusal, and classified diagnostics. Verified on integrated dev with 30 migration tests, typecheck, focused Biome, and two independent reviews; generic MigrationService tests cover the adapter-port lifecycle flows.
<!-- SECTION:FINAL_SUMMARY:END -->
