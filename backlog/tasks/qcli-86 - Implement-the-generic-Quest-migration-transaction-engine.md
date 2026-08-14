---
id: QCLI-86
title: Implement the generic Quest migration transaction engine
status: To Do
assignee: []
created_date: '2026-08-14 18:08'
updated_date: '2026-08-14 18:27'
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
- [ ] #1 Preview is fully read-only, deterministic for an unchanged source, exits 0, and returns requiresApproval with an immutable digest
- [ ] #2 Apply requires the exact approved digest and unchanged source and target bases, distinguishing validation from conflict
- [ ] #3 Mappings are persisted by source instance, source folder, and source identifier without rescanning for rollback
- [ ] #4 Shadow mode requires an explicit UTC deadline, rejects ordinary target writes, supports idempotent refresh, and requires explicit cutover or rollback
- [ ] #5 Automatic rollback removes only unchanged migration-owned records and reports post-cutover edits for manual reconciliation without data loss
<!-- AC:END -->
