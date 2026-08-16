---
id: QCLI-94
title: 'Publish Quest operator, migration, recovery, and release runbooks'
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-16 18:33'
labels:
  - quest-0.1
  - 'wave:release'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-91
  - QCLI-92
documentation:
  - docs/reference/quest-cli-component-charter.md
  - docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - docs/runbooks/
  - docs/index.md
  - README.md
priority: medium
type: docs
ordinal: 112000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Author the operational documentation required to initialize, run, recover, migrate, package, release, and roll back Quest without relying on session memory or private implementation knowledge. All documentation changes are Lore-managed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Runbooks cover initialization, actor declaration, task workflows, claims, gates, Git conflicts, synchronization, projection status and rebuild, and workspace enrollment
- [x] #2 Backlog issue-only, full Backlog-plus-Lore, and Jira migration procedures cover preview, approval, shadow, refresh, cutover, status, and rollback
- [x] #3 Recovery guidance distinguishes authoritative Git repair from disposable projection rebuild and never recommends destructive history rewriting
- [x] #4 Release and package rollback procedures use immutable artifacts and preserve unpublished-package truth until publication succeeds
- [x] #5 lore sync, lore validate --strict, lore check --strict, command examples, and git diff --check pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect the release story, existing operator interfaces, migration and recovery contracts, plus Lore documentation coupling. 2. Author Lore-compatible runbooks for operations, migrations, recovery, release, and rollback without changing managed blocks manually. 3. Synchronize and strictly validate the documentation bundle; exercise command examples where practical. 4. Obtain independent review, integrate, and settle evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added Lore-managed operations, migration/recovery, and package/release runbooks. Independent review approved the public-command boundary, actor examples, workspace enrollment guidance, migration/recovery safety, and publication truth. Verified lore sync; lore validate --strict (59 files, 0 errors/warnings); lore check --strict (59 files, 0 errors/warnings); command examples via bun run src/cli/main.ts --version, manifest --json, task status-flow --json, and task list --json; git diff --check. QCLI-93's six-target harness remains explicit and publication-blocking.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Published Lore-managed operations, migration/recovery, and package/release runbooks; synchronized the bundle and corrected QCLI-95's release-runbook reference. Strict Lore validation/check and public tracker command examples pass; independent review approved the safety and release-truth guidance.
<!-- SECTION:FINAL_SUMMARY:END -->
