---
id: QCLI-97.10.4
title: Deliver lossless multi-pass Backlog task/milestone migration
status: To Do
assignee: []
created_date: '2026-08-21 19:07'
updated_date: '2026-08-21 19:07'
labels:
  - odoc-63.2
dependencies:
  - QCLI-97.10.3
parent_task_id: QCLI-97.10
priority: high
ordinal: 151000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend the existing Backlog migration surface to lossless multi-pass task/milestone migration: aliases, configured vocabularies, digest-bound preview/apply/status/rollback, resumability/idempotency, relationship closure, and source immutability. Lore-owned knowledge adoption and archive/delete remain out of scope (QCLI-88 boundary).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Migration preserves aliases and configured vocabularies across multiple passes
- [ ] #2 Preview/apply/status/rollback are digest-bound; re-running apply is idempotent and resumable
- [ ] #3 Relationship closure holds: parent/dependency/milestone references resolve after migration
- [ ] #4 Source Backlog files are never mutated; failure compensation reports every survivor
<!-- AC:END -->
