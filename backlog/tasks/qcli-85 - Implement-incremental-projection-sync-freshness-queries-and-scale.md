---
id: QCLI-85
title: 'Implement incremental projection sync, freshness, queries, and scale'
status: To Do
assignee: []
created_date: '2026-08-14 18:08'
updated_date: '2026-08-14 18:27'
labels:
  - quest-0.1
  - 'wave:projection'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-84
documentation:
  - >-
    docs/adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md
  - docs/specs/quest-cli-functional-requirements.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/application/queries/
  - src/adapters/projection/
  - test/scale/
priority: high
type: feature
ordinal: 103000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add resumable incremental projection updates and query routing without violating read-only purity. Stale, missing, or incompatible projections must fall back to an in-memory authoritative scan unless the caller explicitly invokes a projection mutation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Projection status reports schema, checkpoint, authoritative basis, freshness, corruption, and recovery guidance
- [ ] #2 Interrupted synchronization resumes from its last durable checkpoint and repeated interruption never permanently wedges progress
- [ ] #3 Read commands open a matching projection read-only and fall back without creating, refreshing, or repairing cache files
- [ ] #4 Cross-workspace list and search operate only over explicitly enrolled workspaces and report missing members
- [ ] #5 The accepted approximately 10k-task, 100k-to-150k-event per-workspace and 25-workspace rebuild/query budgets pass
<!-- AC:END -->
