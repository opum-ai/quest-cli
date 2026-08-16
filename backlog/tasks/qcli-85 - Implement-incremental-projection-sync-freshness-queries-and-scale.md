---
id: QCLI-85
title: 'Implement incremental projection sync, freshness, queries, and scale'
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-16 01:17'
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
- [x] #1 Projection status reports schema, checkpoint, authoritative basis, freshness, corruption, and recovery guidance
- [x] #2 Interrupted synchronization resumes from its last durable checkpoint and repeated interruption never permanently wedges progress
- [x] #3 Read commands open a matching projection read-only and fall back without creating, refreshing, or repairing cache files
- [x] #4 Cross-workspace list and search operate only over explicitly enrolled workspaces and report missing members
- [x] #5 The accepted approximately 10k-task, 100k-to-150k-event per-workspace and 25-workspace rebuild/query budgets pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Map the current projection and authoritative-replay boundaries, then define read-only status/query contracts that cannot create or repair cache files.
2. Extend the SQLite projection adapter with durable, resumable sync checkpoints plus freshness/corruption status.
3. Add explicitly enrolled cross-workspace list/search routing with missing-workspace reporting and authoritative-scan fallback.
4. Add focused integration and scale tests, then run projection, workspace, type, layer, formatting, and cumulative checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Activated after QCLI-84 completed and its six-platform Bun SQLite qualification passed on GitHub Actions run 31915704673. Beginning repository and authoritative-query research from dev at ace8210.

Restore reconciliation: QCLI-84 is Done and pushed at 9e5c1cd. QCLI-85 remains the sole dependency-ready implementation task; its tracked file budget does not overlap any other ready task.

Integrated projection status, durable resumable sync cursor, read-only SQLite reader, matching-cache query fallback, and enrolled-workspace routing on dev through 7131711. Independent review found cache-content trust and invalid-cursor gaps; both remediated and focused tests now pass. Remaining acceptance work: representative 10k-task / 100k-150k-event / 25-workspace scale-budget evidence, then final review and delivery.

Added representative scale qualification: a timed 10k-task/100k-event projection rebuild passes below five seconds; 25 independent SQLite projections at that same scale rebuild and serve matching read-only queries in 19 seconds (under the 120-second aggregate bound). Independent review confirmed the revised test uses actual SQLite readers and cleans temporary artifacts. Verified at the current tree with typecheck, source-scoped Biome lint, layer check, focused projection/scale suite (15 tests), and full Bun suite (86 tests). The repository-wide Biome command remains blocked before linting by Treehouse's nested reusable-worktree configuration.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered projection scale evidence for the accepted 10k-task/100k-150k-event and 25-workspace budgets. Added end-to-end SQLite rebuild and read-only matching-query tests; focused tests, full Bun suite, typecheck, source-scoped lint, and layer checks pass.
<!-- SECTION:FINAL_SUMMARY:END -->
