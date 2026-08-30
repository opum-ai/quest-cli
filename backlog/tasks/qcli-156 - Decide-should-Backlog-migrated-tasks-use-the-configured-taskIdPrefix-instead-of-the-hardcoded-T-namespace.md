---
id: QCLI-156
title: >-
  Decide: should Backlog-migrated tasks use the configured taskIdPrefix instead
  of the hardcoded T- namespace?
status: To Do
assignee: []
created_date: '2026-08-30 17:40'
labels:
  - design-decision
dependencies: []
ordinal: 185000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found while investigating opag's prefix-collision report (QCLI-155). quest migration backlog preview/apply always mints target ids as T-1, T-2, ... (src/application/migration/backlog-public.ts, previewInternal, ~line 183/191), regardless of the workspace's configured .quest/workspace.toml taskIdPrefix (QCLI in this repo). This repo's own dogfooded .quest/tasks/ has T-1.json and T-2.json sitting alongside a QCLI- scheme nothing else uses, which is direct evidence of the divergence. This may be an intentional design choice (a dedicated import namespace sidesteps ever needing cross-system id reconciliation, and is part of why case-only collisions with existing QCLI-N tasks are structurally impossible for the primary id -- only aliases can collide, and those are already guarded). Or it may be an oversight that leaves imported tasks permanently looking inconsistent with the rest of the project's numbering. This task is to make and record that call, not to implement a fix -- it needs a product decision from whoever owns migration UX before any code changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A decision is recorded: keep the dedicated T- import namespace as-is, or change migration target-id minting to use the configured taskIdPrefix
- [ ] #2 If changed, the collision-safety property proven in QCLI-155 (refuse before write, case-folded) is preserved or re-verified under the new scheme
<!-- AC:END -->
