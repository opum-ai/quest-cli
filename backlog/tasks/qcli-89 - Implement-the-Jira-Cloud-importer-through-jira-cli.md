---
id: QCLI-89
title: Implement the Jira Cloud importer through jira-cli
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-16 12:59'
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
- [ ] #1 The adapter uses jira-cli argv and JSON only and never reads credentials, calls Jira HTTP endpoints, or parses ADF
- [ ] #2 Preview requires complete status mappings and reports every unsupported field or inaccessible issue without approximation
- [ ] #3 Issue hierarchy and links, versions, labels, people, timestamps, description, and ordered comments retain source provenance
- [ ] #4 Imported Jira people remain source identities and gain no Quest role or gate eligibility without explicit actor adoption
- [ ] #5 Paging, source changes, missing permissions, shadow refresh, cutover, and rollback pass recorded-golden and disposable-project tests
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect the existing migration ports, Backlog importer, and frozen Jira fidelity contract to define the adapter boundary and test seam.
2. Implement a jira-cli argv/JSON-only reader with paged inventory, explicit diagnostics, status-mapping validation, source fingerprints, and provenance-preserving conversion.
3. Wire preview, approval, shadow refresh, cutover, rollback, and drift compensation through the existing migration engine without reading credentials or using Jira HTTP.
4. Add recorded golden and disposable-project-style integration coverage for hierarchy, links, people, comments, paging, permissions, missing fields, and source changes.
5. Run focused checks, record evidence, obtain independent review, then complete task settlement.
<!-- SECTION:PLAN:END -->
