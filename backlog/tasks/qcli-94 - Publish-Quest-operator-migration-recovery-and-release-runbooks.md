---
id: QCLI-94
title: 'Publish Quest operator, migration, recovery, and release runbooks'
status: To Do
assignee: []
created_date: '2026-08-14 18:08'
updated_date: '2026-08-14 18:27'
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
- [ ] #1 Runbooks cover initialization, actor declaration, task workflows, claims, gates, Git conflicts, synchronization, projection status and rebuild, and workspace enrollment
- [ ] #2 Backlog issue-only, full Backlog-plus-Lore, and Jira migration procedures cover preview, approval, shadow, refresh, cutover, status, and rollback
- [ ] #3 Recovery guidance distinguishes authoritative Git repair from disposable projection rebuild and never recommends destructive history rewriting
- [ ] #4 Release and package rollback procedures use immutable artifacts and preserve unpublished-package truth until publication succeeds
- [ ] #5 lore sync, lore validate --strict, lore check --strict, command examples, and git diff --check pass
<!-- AC:END -->
