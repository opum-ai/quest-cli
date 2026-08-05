---
id: QCLI-11
title: Record quest-cli's activation-gate evidence and decision time
status: To Do
assignee: []
created_date: '2026-08-05 11:41'
updated_date: '2026-08-05 12:33'
labels:
  - quest
  - cli
  - activation-gate
  - evidence
  - lore
  - blocked-on-owner
  - campaign
  - 'cluster:lore-gate'
dependencies: []
documentation:
  - docs/stories/prepare-quest-cli-for-implementation-activation.md
priority: high
type: docs
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Lore-owned release gate predicate has four clauses. Clause 4 is quest-cli's own obligation: quest-cli records the exact evidence it consumed and the decision time. No such record exists in this repository.

This task creates that record. It does not evaluate the gate and does not open it - the gate decision belongs to lore-doc and its LDOC-4 task, and a consumer repository cannot infer it.

Context worth carrying into the work: the 2026-08-01 audit boundary that closed the gate observed no Lore Git tag, an inspected package version of 0.0.0, and a public npm lookup returning E404. Those are dated observations, not standing facts, and the gate's own text says so. A live re-check is required before anything is recorded, and a changed result is a new fact for the gate owner to rule on, not grounds for a consumer to act.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The record names the exact repository revisions, evidence locations, and evaluation time of every input consumed
- [ ] #2 Every observation is captured as a dated moving reference with the literal command that produced it
- [ ] #3 The record states the gate result as reported by its owner, and does not compute, infer, or assert a gate result of its own
- [ ] #4 Any input that is missing, stale, or contradictory is recorded as such and keeps the consumed result closed
- [ ] #5 No product source, package metadata, runtime dependency, or release artifact is added by this task
<!-- AC:END -->
