---
id: QCLI-62
title: 'Author the Quest dependency, ready-set, and blocking design'
status: To Do
assignee: []
created_date: '2026-08-09 07:09'
labels:
  - design
dependencies: []
references:
  - docs/specs/quest-cli-functional-requirements.md
  - docs/specs/quest-cli-architecture.md
  - >-
    docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md
  - .claude/skills/backlog-handover/reference/wave-loop.md
priority: high
type: feature
ordinal: 81000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Quest CLI has no dependency or DAG design at all — no dependency-edge semantics, no ready-set definition, no blocking model, and no cycle policy. This is the last net-new design gap before implementation can start, and it is on the critical path twice: Quest is the ratified owner of execution records, and opum-harness will consume Quest as its record layer when it replaces Backlog.md.

Backlog.md is the reference implementation, but it must NOT be adopted wholesale. Its computeSequences() (src/core/sequences.ts:12, MIT) is layering-only and is unsafe for an autonomous scheduler as written: it ignores task status entirely (so it produces layers, not a ready set), it silently emits dependency cycles as a final schedulable layer (:67-76) rather than failing, and it shunts isolated tasks into an 'unsequenced' bucket (:39-44) even though those are exactly the immediately-ready tasks in an execution context.

The outcome of this task is a design document, not code. It should define the semantics precisely enough that implementation is mechanical and that an autonomous scheduler consuming it cannot silently schedule a cycle or silently drop a ready task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dependency edge semantics are defined: direction, meaning, self-edge and duplicate-edge handling, and what makes an edge valid
- [ ] #2 Ready-set is defined as an explicit predicate over dependency completion and claim/lease state, distinct from topological layering
- [ ] #3 Cycle policy is fail-closed: a cycle is a named error with an assigned exit code, never a schedulable layer
- [ ] #4 Isolated tasks (no dependencies, no dependents) are specified as ready, not excluded or 'unsequenced'
- [ ] #5 Blocking model is defined: how a task becomes blocked, how blocking is represented in the authored record, and how it clears
- [ ] #6 The design states its delta from Backlog.md computeSequences() explicitly, with citations, so the divergence is deliberate and auditable
- [ ] #7 Design is consistent with the ratified identifier grammar and authored-record layout ADR; no second storage format is introduced
- [ ] #8 lore validate --strict and lore check both pass with zero errors and zero warnings
<!-- AC:END -->
