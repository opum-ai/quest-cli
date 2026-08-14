---
id: QCLI-79
title: 'Implement operation-owned Git CAS, synchronization, and crash recovery'
status: To Do
assignee: []
created_date: '2026-08-14 18:08'
updated_date: '2026-08-14 18:27'
labels:
  - quest-0.1
  - 'wave:foundation'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-78
documentation:
  - >-
    docs/adr/coordinate-through-git-compare-and-swap-without-a-central-arbiter.md
  - docs/adr/require-atomic-idempotent-operation-owned-mutations.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/adapters/git/
  - src/application/mutations/
  - test/fault/git/
priority: high
type: feature
ordinal: 97000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build the sole authoritative mutation mechanism over real Git repositories and worktrees. Every mutation predeclares its owned paths, stages through an isolated index, commits only those paths, conditionally updates the target ref, and leaves recoverable evidence across crashes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 INV-1 through INV-5 pass against real repositories, worktrees, dirty indexes, unrelated uncommitted files, and injected failures
- [ ] #2 A local common-directory lock serializes only in-clone preparation while Git conditional ref updates decide authoritative contention
- [ ] #3 A losing CAS or push is a structured conflict and is never silently retried, rebased, force-applied, stashed, reset, or discarded
- [ ] #4 Synchronization permits fast-forward and deterministic disjoint-path integration but reports same-task or shared-namespace divergence
- [ ] #5 Crash recovery and repeated operation IDs produce exactly-once observable state without absorbing unrelated user changes
<!-- AC:END -->
