---
id: QCLI-84
title: Implement the Bun SQLite projection schema and atomic rebuild
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 23:03'
labels:
  - quest-0.1
  - 'wave:projection'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-82
documentation:
  - >-
    docs/adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md
  - docs/specs/quest-cli-architecture.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/adapters/projection/
  - src/application/projection/
  - test/integration/projection/
priority: high
type: feature
ordinal: 102000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement a disposable per-workspace SQLite projection using Bun's built-in SQLite. Git-tracked records remain sole authority; rebuild constructs a complete replacement database from authoritative enumeration and swaps it atomically only after validation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The projection schema covers tasks, dependencies, actors, claims, gates, evidence, aliases, events, source mappings, and Git checkpoints
- [ ] #2 A missing or corrupt projection is detected and rebuilt from Git without changing authored records
- [ ] #3 Rebuild writes a temporary database, validates it against authoritative counts and replay, and atomically replaces the prior database
- [ ] #4 Projection data can never satisfy a gate, hold a claim, or override authored disagreement
- [ ] #5 Bun SQLite behaves consistently on the supported operating-system and architecture matrix
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect the existing authoritative replay and workspace boundaries to define a projection port and complete SQLite schema. 2. Build a disposable projection adapter that rebuilds to a validated temporary database and atomically swaps it into place without writing authored records. 3. Add integration coverage for corruption recovery, authoritative parity, gate/claim non-authority, and supported Bun SQLite behavior; run focused and cumulative checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Restored 2026-08-15 from campaign cursor grounded at fa8ec73496da64749439532eedb05508baa79982. QCLI-82 is live Done; QCLI-84 is the current dependency-ready projection task. Dispatching from the pinned dev base in an isolated Treehouse lease.
<!-- SECTION:NOTES:END -->
