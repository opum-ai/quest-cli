---
id: QCLI-120
title: Normalize Quest Treehouse 2.2 repository/pool identity
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-21 16:03'
labels:
  - infrastructure-housekeeping
  - treehouse
  - odoc-63
dependencies: []
priority: high
type: chore
ordinal: 146000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Normalize the owner-local Treehouse 2.2 pool identity so treehouse.toml uses the canonical root '.' rather than the nested '.treehouse' resolution, with a valid three-layer Git/Treehouse/physical audit and reviewed dev delivery.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 treehouse.toml uses root '.' and max_trees 3
- [ ] #2 Three-layer Git/Treehouse/physical audit is valid before and after the change
- [ ] #3 Focused repository checks, backlog validation, strict Lore validate/check, diff/check hygiene, and independent verify evidence pass
- [ ] #4 Change is committed to a task branch, pushed, PR to dev is green, merged, and node-created artifacts are safely cleaned/returned
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Ground AGENTS.md, backlog overview/task-execution, lore instructions, treehouse-worktrees skill.
2. Audit current Git/Treehouse/physical state and confirm no equivalent change already delivered.
3. Lease existing available Treehouse slot from pinned origin/dev base cd0e437ff3928d54840ba96e23b6e0dc2ad9295f with immutable lease ID.
4. Refresh stable quest-cli presence attestation keyed to message 2633694f98944c2c963fa015f836611b before mutation.
5. Change only treehouse.toml root to "." in leased worktree; preserve primary checkout and unrelated artifacts.
6. Validate config semantics, three-layer audit, focused checks, backlog validation, strict Lore validate/check, diff hygiene.
7. Commit without amend, push task branch, open PR to dev, monitor checks, merge if green.
8. Clean/return only node-created artifacts when safely proved disposable; reply with full evidence.
<!-- SECTION:PLAN:END -->
