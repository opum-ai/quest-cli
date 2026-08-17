---
id: QCLI-97.3
title: Restore Quest planning and operations parity commands
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-17 06:06'
updated_date: '2026-08-17 12:45'
labels:
  - quest-0.1
  - parity
  - operations
  - 'doc:stories/deliver-quest-cli-0-1-0'
dependencies: []
documentation:
  - docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md
  - docs/stories/deliver-quest-cli-0-1-0.md
parent_task_id: QCLI-97
priority: high
type: feature
ordinal: 117000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Restore the missing Backlog.md planning, diagnostics, and operator command groups under the agreed parity boundary, excluding only separate document management.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Quest implements or owner-explicitly excludes milestones, decisions, board, overview, doctor, cleanup, browser, and complete search coverage excluding separate document CRUD
- [ ] #2 Each delivered command has deterministic JSON/plain behavior, safe mutation boundaries, and CLI conformance tests
- [ ] #3 Search includes the non-document records promised by the accepted parity boundary and distinguishes unsupported queries explicitly
- [ ] #4 Operational commands preserve unrelated worktree state and provide dry-run or confirmation behavior where mutations are material
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Introduce typed local storage boundaries for milestones and decisions without modifying task lifecycle storage. 2. Add read-only overview, board, and complete non-document search using existing task/query foundations. 3. Add milestone and decision CRUD/list, then deterministic doctor, cleanup, and localhost browser surfaces. 4. Add command conformance and safety tests; integrate shared CLI/manifest wiring serially after QCLI-97.2 and QCLI-97.4 changes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner approved product-code implementation on 2026-08-17. Implement accepted Backlog parity except separate document management; initial design exploration is underway.

Exploration found no existing public planning/operations implementation; QCLI-97.3 must not modify task lifecycle storage owned by QCLI-97.4. Shared routing hotspots will be serialized.

Typed milestone/decision planning core committed at a416b2c5686135e7f632c908a6762761a015aab3. Focused planning tests, typecheck, and targeted Biome lint/format checks passed; CLI/manifest wiring remains serialized.

Independent review found the planning core is not yet a complete parity surface: durable repository, CRUD transitions, board, doctor, cleanup, browser, and public routing remain required. Keep task in progress.
<!-- SECTION:NOTES:END -->
