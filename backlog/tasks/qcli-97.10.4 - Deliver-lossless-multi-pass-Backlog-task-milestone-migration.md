---
id: QCLI-97.10.4
title: Deliver lossless multi-pass Backlog task/milestone migration
status: Done
assignee: []
created_date: '2026-08-21 19:07'
updated_date: '2026-08-25 17:38'
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
- [x] #1 Migration preserves aliases and configured vocabularies across multiple passes
- [x] #2 Preview/apply/status/rollback are digest-bound; re-running apply is idempotent and resumable
- [x] #3 Relationship closure holds: parent/dependency/milestone references resolve after migration
- [x] #4 Source Backlog files are never mutated; failure compensation reports every survivor
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-25 qualification: lossless multi-pass migration verified on dev 03177b9 — e2e+migration suites 41 pass (digest-bound preview/apply/status/rollback, idempotent re-run, relationship closure, source immutability), plus packed-package installed migration lifecycle qualification (bun run test:packages, exit 0).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Lossless multi-pass Backlog task/milestone migration with revision-guarded atomic transaction delivered in PR #136 (merge 87e82ec, in origin/dev); re-verified 2026-08-25 with e2e/integration migration suites and packed-package qualification passing.
<!-- SECTION:FINAL_SUMMARY:END -->
