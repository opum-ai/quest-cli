---
id: QCLI-78
title: 'Implement safe Quest workspace initialization, discovery, and enrollment'
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 17:49'
labels:
  - quest-0.1
  - 'wave:foundation'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-77
documentation:
  - docs/specs/quest-cli-architecture.md
  - docs/reference/quest-cli-git-filesystem-and-concurrency-threat-model.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/application/workspaces/
  - src/adapters/workspaces/
  - test/integration/workspaces/
priority: high
type: feature
ordinal: 96000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement explicit initialization and local enrollment for Git workspaces. Current-repository operations and cross-workspace reads must resolve stable worktree identities while preserving missing, moved, nested, hostile, and unrelated user state.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 quest init creates only the declared authored paths in a non-bare Git worktree and fails safely for unsupported repository states
- [ ] #2 Workspace enrollment is explicit, local-only, and distinguishes Git common-directory identity from worktree path
- [ ] #3 Current-workspace commands and read-only all-workspace enumeration behave deterministically for moved, missing, nested, and removed repositories
- [ ] #4 Symlink escapes, path traversal, case collisions, and hostile path components are rejected before writes
- [ ] #5 Every read-only workspace command leaves filesystem, Git, registry, and projection state unchanged on success and failure
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reconcile workspace initialization/enrollment requirements with the Git/filesystem threat model and existing command/domain conventions.
2. Define pure workspace identities and path-validation rules, plus a Git subprocess port that discovers a non-bare worktree and its common-directory identity without shell interpolation.
3. Implement explicit local-only enrollment, declared-path initialization, current-workspace resolution, and deterministic read-only enumeration under the task-owned application/adapter boundaries.
4. Add integration tests using temporary Git repositories, linked worktrees, moved/missing/nested paths, hostile components, symlink escapes, and read-only state snapshots.
5. Run focused and cumulative checks, obtain independent review, synchronize Lore, and finalize.
<!-- SECTION:PLAN:END -->
