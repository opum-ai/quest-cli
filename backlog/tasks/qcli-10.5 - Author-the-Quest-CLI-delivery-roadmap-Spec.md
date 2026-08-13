---
id: QCLI-10.5
title: Author the Quest CLI delivery roadmap Spec
status: Done
assignee: []
created_date: '2026-08-05 11:41'
updated_date: '2026-08-05 11:56'
labels:
  - quest
  - cli
  - roadmap
  - phases
  - activation-gate
  - 'doc:stories/prepare-quest-cli-for-implementation-activation'
dependencies:
  - QCLI-10.1
  - QCLI-10.3
documentation:
  - docs/stories/prepare-quest-cli-for-implementation-activation.md
parent_task_id: QCLI-10
priority: high
type: docs
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The seven-phase delivery graph is dormant inside an eight-hundred-line reference document, with no entry or exit criteria and no mapping from phases to requirements. Its single most actionable finding - that Phase 1 is decision work not blocked on the Lore gate - is effectively invisible.

Make the graph executable without activating it. The roadmap describes what each phase requires and produces; it authorises no implementation and opens no gate.

Cite quest-doc as the owner of the product-wide staged roadmap rather than restating it as normative here.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each of the seven phases records entry criteria, exit criteria, the requirements it satisfies, the scenarios that verify it, and its open-decision dependencies
- [x] #2 The roadmap makes prominent that Phase 1 is component decision work not blocked on the Lore-owned release gate, and is therefore the next actionable unit of work
- [x] #3 A test strategy is named as a phase deliverable, recording that the repository currently has no automated test, build, or lint gate
- [x] #4 Component release and rollback runbooks are named as phase deliverables, recording that the charter claims them and the runbooks directory does not contain them
- [x] #5 quest-doc is cited as the owner of the product-wide staged roadmap rather than restated as normative here
- [x] #6 No phase is activated, no gate is opened, and no implementation is authorised
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Authored docs/specs/quest-cli-delivery-roadmap.md.

Per phase: entry criteria, exit criteria, the FR requirements it satisfies, the BB/TM scenarios that verify it, and its open-decision dependencies. Plus a dependency diagram and a workable-now column.

Decisions made while authoring:
- Put the Phase 1 finding in a pull quote in the Summary, above everything else. It is the single most actionable fact in the corpus (Phase 1 is decision work, produces no code, and is blocked only by Quest own open decisions) and it was previously invisible inside an 800-line reference document.
- Recorded per phase whether it is workable now, because the distinction between owner-gated (0, 6), internally-blocked (2-4), and externally-blocked (5) is what determines where effort can go today.
- Added the test strategy and the release/rollback runbooks as named phase deliverables. Neither is named as phase work by the research, but the charter claims ownership of both and neither exists; scheduling them here stops them being discovered late. Recorded that the repository has no automated test, build, or lint gate at all.
- Noted that the BB and TM scenarios were authored before any runtime was chosen, so they are raw material for a suite rather than a suite design, and cannot be expressed as executable tests until the runtime decision is settled.
- Phase 0 records the gate status as a dated moving reference with its recheck command, and states plainly that a consumer repository cannot infer a gate result. Nothing here evaluates or opens the gate.

Verification: lore validate --strict reports 0 errors 0 warnings; lore check reports 37 files 0 errors 0 warnings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the delivery roadmap as docs/specs/quest-cli-delivery-roadmap.md, making the dormant seven-phase graph executable without activating it. Each phase carries entry and exit criteria, its FR coverage, its verifying scenarios, and its blockers, with a dependency diagram and a per-phase workable-now assessment. The roadmap leads with the finding that Phase 1 is component decision work not blocked on the Lore gate and is therefore the next actionable unit of work. Test strategy and release/rollback runbooks are added as named phase deliverables, recording that the repository has no automated test, build, or lint gate and that the runbooks the charter claims do not exist. quest-doc is cited as owner of the product-wide staged roadmap. No phase is activated, no gate opened, no implementation authorised. Verified by lore validate --strict and lore check, both reporting zero errors.
<!-- SECTION:FINAL_SUMMARY:END -->
