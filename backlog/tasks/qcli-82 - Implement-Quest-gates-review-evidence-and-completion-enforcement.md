---
id: QCLI-82
title: 'Implement Quest gates, review evidence, and completion enforcement'
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 21:17'
labels:
  - quest-0.1
  - 'wave:core'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-81
documentation:
  - docs/reference/quest-cli-component-glossary-actors-and-workflows.md
  - docs/specs/quest-cli-functional-requirements.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/domain/gates/
  - src/application/gates/
  - test/integration/gates/
priority: high
type: feature
ordinal: 100000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement authored gates and evidence as an orthogonal lifecycle constraint. Entering a terminal status must be denied until every blocking gate is satisfied by eligible, attributable evidence.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Gate definitions, evidence records, satisfaction state, and task completion are derived solely from authored events
- [x] #2 Unsatisfied blocking gates deny entry into a terminal status without changing task state
- [x] #3 Self-supplied evidence cannot satisfy a separation gate and a delegated agent cannot satisfy a human-judgement gate
- [x] #4 A distinct eligible human reviewer can satisfy the gate and the evidence remains attributable after later actor-record changes
- [x] #5 Gate, claim, status, and alias interactions pass the existing black-box scenarios
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Model authored gate definitions and attributable evidence as event-derived state alongside the task lifecycle. 2. Enforce blocking and actor-eligibility constraints on terminal transitions without mutating denied tasks. 3. Cover gate, claim, status, and alias interactions with black-box integration scenarios and run targeted plus cumulative checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Restored 2026-08-15: QCLI-82 dispatched from delivered QCLI-83 base 3042708d27a389beae1d21c4d6dd0bbeb63a2975 to an isolated worktree; task scope is gated lifecycle enforcement only.

Integrated verification at ef0e4b8: independent review approved authored event-only gates/evidence after adversarial tests closed history-erasure and inline satisfied-gate bypasses. Focused gates tests, typecheck, layer check, and diff check passed; branch validation reported 71 Bun tests passing.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented event-derived gate definitions and evidence with immutable actor snapshots, separation and human-judgement eligibility, alias-aware lifecycle enforcement, and terminal denial before any task write. Independently reviewed; adversarial history-erasure and forged-gate tests plus the 71-test branch suite passed.
<!-- SECTION:FINAL_SUMMARY:END -->
