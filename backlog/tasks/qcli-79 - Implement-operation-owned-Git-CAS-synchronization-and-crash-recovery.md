---
id: QCLI-79
title: 'Implement operation-owned Git CAS, synchronization, and crash recovery'
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 18:56'
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
- [x] #1 INV-1 through INV-5 pass against real repositories, worktrees, dirty indexes, unrelated uncommitted files, and injected failures
- [x] #2 A local common-directory lock serializes only in-clone preparation while Git conditional ref updates decide authoritative contention
- [x] #3 A losing CAS or push is a structured conflict and is never silently retried, rebased, force-applied, stashed, reset, or discarded
- [x] #4 Synchronization permits fast-forward and deterministic disjoint-path integration but reports same-task or shared-namespace divergence
- [x] #5 Crash recovery and repeated operation IDs produce exactly-once observable state without absorbing unrelated user changes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define the operation-owned Git mutation port, structured conflict/recovery outcomes, and test seam from the accepted CAS and mutation-invariant contracts.
2. Implement local common-directory preparation locking, isolated-index staging, owned-path validation, commit creation, and conditional ref update in src/adapters/git/.
3. Add synchronization and operation-journal recovery behavior that preserves unrelated changes and detects duplicate operation IDs.
4. Exercise real-repository fault, dirty-index, race, divergence, and repeat-operation scenarios; run targeted then repository checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and independently reviewed operation-owned Git mutations. Verified on integration tree 8ef4417078268e5ca79db0f29e92b7bc97cdea32: bun typecheck, source-only Biome lint/format (repository-wide scripts exclude reusable Treehouse nested worktree), layer check, and bun test (37 tests/169 assertions). Fault coverage includes dirty indexes, staged/unstaged/untracked preservation, injected staging/CAS interruptions, durable journal recovery, cross-process/common-directory locking, real linked worktrees, CAS/push conflicts, and synchronization.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the Git mutation port and local adapter with predeclared owned scopes, isolated-index commits, common-directory preparation locking, durable operation journals, expected-old CAS, structured push/CAS/integration conflicts, idempotent recovery, and deterministic synchronization. Independently reviewed and verified with the full 37-test/169-assertion suite on the integrated tree.
<!-- SECTION:FINAL_SUMMARY:END -->
