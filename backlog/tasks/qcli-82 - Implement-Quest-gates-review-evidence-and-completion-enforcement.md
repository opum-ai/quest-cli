---
id: QCLI-82
title: 'Implement Quest gates, review evidence, and completion enforcement'
status: To Do
assignee: []
created_date: '2026-08-14 18:08'
updated_date: '2026-08-14 18:27'
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
- [ ] #1 Gate definitions, evidence records, satisfaction state, and task completion are derived solely from authored events
- [ ] #2 Unsatisfied blocking gates deny entry into a terminal status without changing task state
- [ ] #3 Self-supplied evidence cannot satisfy a separation gate and a delegated agent cannot satisfy a human-judgement gate
- [ ] #4 A distinct eligible human reviewer can satisfy the gate and the evidence remains attributable after later actor-record changes
- [ ] #5 Gate, claim, status, and alias interactions pass the existing black-box scenarios
<!-- AC:END -->
