---
id: QCLI-97.11.4
title: Deliver lossless multi-pass Backlog task/milestone migration
status: To Do
assignee:
  - '@quest-cli'
created_date: '2026-08-21 19:45'
updated_date: '2026-08-21 20:12'
labels:
  - odoc-63.2
dependencies:
  - QCLI-97.11.3
parent_task_id: QCLI-97.11
priority: high
type: feature
ordinal: 151000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend the existing Backlog migration surface to lossless multi-pass task/milestone migration: aliases, configured vocabularies, digest-bound preview/apply/status/rollback, resumability/idempotency, relationship closure, and source immutability. Lore-owned knowledge adoption and archive/delete remain out of scope (QCLI-88 boundary). Scope boundary (review-correction ad7dd9c69be34f12bcc1208e0215f9d9 finding 5): this child owns migration mapping/provenance/closure; immutable source provenance (source folder/path, Git, migration provenance) must live in migration evidence, not leak into user-visible task summary.

Ownership (feature-wayfinding gate feature-wayfinding-v2, correlation 1cdd200728ec4d8c8e3342f8a2d235c4):
- quest-cli:src/application/migration
- quest-cli:test/integration/migration
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Migration preserves aliases and configured vocabularies across multiple passes
- [ ] #2 Preview/apply/status/rollback are digest-bound; re-running apply is idempotent and resumable
- [ ] #3 Relationship closure holds: parent/dependency/milestone references resolve after migration
- [ ] #4 Source Backlog files are never mutated; failure compensation reports every survivor
- [ ] #5 Source provenance lives in migration evidence only; round-trip and negative coverage prove no leak into user-visible task summary
<!-- AC:END -->
