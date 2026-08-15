---
id: QCLI-80
title: 'Implement the Quest task graph, lifecycle, CRUD, search, and readiness'
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 18:57'
labels:
  - quest-0.1
  - 'wave:core'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-79
documentation:
  - docs/reference/quest-cli-dependency-readiness-and-blocking-design.md
  - docs/specs/quest-cli-functional-requirements.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/domain/tasks/
  - src/application/tasks/
  - test/integration/tasks/
priority: high
type: feature
ordinal: 98000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the authoritative task surface and dependency DAG on the mutation kernel. The shape must be rich enough for Quest workflows, Backlog and Jira adoption, and lore-cli's backend-neutral TrackerAdapter.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Create, list, view, search, and edit cover the full accepted summary and detail fields, criteria, narrative sections, comments, labels, documentation, hierarchy, and source provenance
- [ ] #2 Configured status order and transitions default to To Do, In Progress, and Done, with terminal records retained in place
- [ ] #3 Dependency and parent cycles, missing references, ambiguous aliases, and illegal transitions are rejected without mutation
- [ ] #4 Ready-set evaluation is deterministic from authoritative events, terminal dependencies, blocking gates, and live claims
- [ ] #5 All read paths remain correct without a projection and perform zero writes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define authoritative task graph, lifecycle, CRUD, search, and ready-set domain types over the Git mutation kernel.
2. Implement application use cases and read-only query paths, including configuration-driven status transitions and pre-mutation validation.
3. Enforce dependency/parent graph integrity, aliases, provenance, blocking gates, and claim-aware readiness deterministically from authored events.
4. Add integration tests for full task fields, transitions, graph rejection, readiness, and zero-mutation reads; run targeted and repository checks.
<!-- SECTION:PLAN:END -->
