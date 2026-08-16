---
id: QCLI-86
title: Implement the generic Quest migration transaction engine
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-16 03:23'
labels:
  - quest-0.1
  - 'wave:migration'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-85
documentation:
  - >-
    docs/adr/migrate-from-backlog-md-reversibly-without-inheriting-its-id-grammar.md
  - docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/application/migration/
  - src/domain/migration/
  - test/integration/migration/
priority: high
type: feature
ordinal: 104000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement source-neutral migration planning and transaction behavior before either source adapter. The engine owns deterministic plans, source and target fingerprints, approval digests, fresh Quest IDs, persisted mappings, bounded shadow coexistence, cutover, status, and safe rollback.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Preview is fully read-only, deterministic for an unchanged source, exits 0, and returns requiresApproval with an immutable digest
- [x] #2 Apply requires the exact approved digest and unchanged source and target bases, distinguishing validation from conflict
- [x] #3 Mappings are persisted by source instance, source folder, and source identifier without rescanning for rollback
- [x] #4 Shadow mode requires an explicit UTC deadline, rejects ordinary target writes, supports idempotent refresh, and requires explicit cutover or rollback
- [x] #5 Automatic rollback removes only unchanged migration-owned records and reports post-cutover edits for manual reconciliation without data loss
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Map the existing authored-record, Git CAS, and task lifecycle boundaries needed for source-neutral migration state. 2. Define deterministic preview, digest, fingerprint, mapping, shadow, cutover, and rollback domain/application contracts. 3. Implement migration persistence and transaction workflows with focused integration coverage for approval, conflicts, shadow mode, and safe rollback. 4. Run migration, type, layer, formatting, and cumulative qualification.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Activated after QCLI-85 delivery at 839e64f; QCLI-86 is now the sole dependency-ready task.

Implemented and independently reviewed deterministic source-neutral migration contracts. Validation at 27c8ba004eaa5e6e5a32836fe9f55c37ca50324e: 97 Bun tests passed; tsc, source-scoped Biome, layer check, and git diff --check passed. Repository-wide Biome is environment-blocked by the nested available Treehouse worktree configuration.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the migration transaction engine with deterministic read-only previews, digest/base guards, source-qualified persisted mappings, bounded shadow coexistence, conditional recovery, and non-destructive rollback. Independently reviewed; 97 tests and relevant checks passed.
<!-- SECTION:FINAL_SUMMARY:END -->
