---
id: QCLI-62
title: 'Author the Quest dependency, ready-set, and blocking design'
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-09 07:09'
updated_date: '2026-08-13 05:07'
labels:
  - design
dependencies: []
references:
  - docs/specs/quest-cli-functional-requirements.md
  - docs/specs/quest-cli-architecture.md
  - >-
    docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md
  - .claude/skills/backlog-handover/reference/wave-loop.md
documentation:
  - docs/specs/quest-cli-dependency-ready-set-and-blocking-design.md
modified_files:
  - docs/specs/quest-cli-dependency-ready-set-and-blocking-design.md
  - docs/specs/index.md
  - docs/log.md
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
- [x] #1 Dependency edge semantics are defined: direction, meaning, self-edge and duplicate-edge handling, and what makes an edge valid
- [x] #2 Ready-set is defined as an explicit predicate over dependency completion and claim/lease state, distinct from topological layering
- [x] #3 Cycle policy is fail-closed: a cycle is a named error with an assigned exit code, never a schedulable layer
- [x] #4 Isolated tasks (no dependencies, no dependents) are specified as ready, not excluded or 'unsequenced'
- [x] #5 Blocking model is defined: how a task becomes blocked, how blocking is represented in the authored record, and how it clears
- [x] #6 The design states its delta from Backlog.md computeSequences() explicitly, with citations, so the divergence is deliberate and auditable
- [x] #7 Design is consistent with the ratified identifier grammar and authored-record layout ADR; no second storage format is introduced
- [x] #8 lore validate --strict and lore check both pass with zero errors and zero warnings
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Scaffold a Lore Spec at docs/specs/quest-cli-dependency-ready-set-and-blocking-design.md and ground it in QCLI-62, the settled functional requirements, architecture, identifier/layout ADR, lease ADR, and result-contract ADR.
2. Specify canonical dependency-edge validation and graph evaluation: dependency-to-dependent direction, canonical T-* endpoints, missing/self/duplicate-edge handling, deterministic validation, and fail-closed cycle reporting as named error dependency_cycle on exit 2.
3. Define the claimable ready-set predicate over lifecycle eligibility, dependency completion, active authored blockers, and evaluated claim/lease state; include isolated tasks and distinguish readiness from topological layering.
4. Define blocking as append-only blocked/unblocked events co-located in the task's sole authored record, including clear-by-id/evidence semantics and projection derivation without a second authority.
5. Contrast the design explicitly with Backlog.md computeSequences(), cite the inspected source locations, then run lore sync, lore validate --strict, lore check --strict, and git diff --check; record exact evidence and perform an adversarial self-review before finalization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the QCLI-62 design locally from origin/dev base 484fd30d27fd343d1c39b46433adc5dd64be06f6. Added docs/specs/quest-cli-dependency-ready-set-and-blocking-design.md through Lore and regenerated docs/specs/index.md plus docs/log.md.

Acceptance evidence:
- AC1: Spec lines 77-109 define dependency->dependent direction, canonical endpoint validity, named missing/ambiguous target errors, self-edge rejection, duplicate-after-alias-resolution rejection, same-workspace scope, and authored-record ownership.
- AC2: lines 138-207 define claim/lease evaluation and the explicit ready(t,R,now) conjunction over lifecycle eligibility, dependency completion, active blockers, and unclaimed/expired claim state, distinct from topology.
- AC3: lines 111-136 define whole-scope SCC validation, named dependency_cycle, outcome error, exit 2, and no partial ready set.
- AC4: lines 209-226 make isolated tasks normal readiness candidates via vacuous dependency truth and forbid unsequenced exclusion.
- AC5: lines 156-182 define append-only blocker-opened/blocker-cleared events, required evidence, active-blocker derivation, invalid histories, and new IDs for reopening.
- AC6: lines 228-255 cite the inspected MIT Backlog.md computeSequences() at commit a80b7a16 and contrast missing-target, unsequenced, state-free layering, and cycle-final-layer behavior with Quest.
- AC7: summary and lines 95-109/163-182 bind canonical T-* resolution and co-locate dependencies/blocker events in the sole authored task record; reverse edges and SCCs remain disposable projections.
- AC8: lore validate --strict --plain reported 51 files, 0 errors, 0 warnings, 6 skipped; lore check --strict --plain reported 51 files, 0 errors, 0 warnings.

Additional verification: lore sync --plain was idempotent (0 files changed); git diff --check passed. Adversarial self-review (not independent) checked each AC, result-contract exit mapping, lease semantics, and the existing backlog-handover cycle policy; it tightened the coordinator/product boundary at lines 245-255. No product source or second storage format was added.

Delivery disposition: on 2026-08-13 the user explicitly authorized creating a local QCLI-62 branch and commit. Push, PR, merge, and cleanup remain unauthorized, so the task stays In Progress after the local commit.
<!-- SECTION:NOTES:END -->
