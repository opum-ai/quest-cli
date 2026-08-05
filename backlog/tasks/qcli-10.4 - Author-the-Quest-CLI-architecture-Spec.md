---
id: QCLI-10.4
title: Author the Quest CLI architecture Spec
status: Done
assignee: []
created_date: '2026-08-05 11:41'
updated_date: '2026-08-05 11:56'
labels:
  - quest
  - cli
  - architecture
  - ports
  - trust-model
  - durability
  - 'doc:stories/prepare-quest-cli-for-implementation-activation'
dependencies:
  - QCLI-10.2
  - QCLI-10.3
documentation:
  - docs/stories/prepare-quest-cli-for-implementation-activation.md
parent_task_id: QCLI-10
priority: high
type: docs
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The bundle contains no architecture document. The only structural statement anywhere is one phrase in an ADR decision item naming a CLI, application, domain, and ports seam. Elaborate that into an actual structure an implementer can build against.

The Spec is runtime-neutral by necessity: freezing runtime, native packaging, or supported platforms is prohibited until live Lore evidence is reviewed. A ports-and-adapters description is exactly what the admitted research supports, so this constraint costs nothing.

Anything that would change Quest-wide vocabulary, the actor model, or product architecture is written as a proposal routed to quest-doc, not asserted as normative here.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Layers are named with what belongs in each and the rule that dependencies point inward only
- [x] #2 The ports are named, including a clock port, since lease expiry is evaluated against the evaluator's own clock and a fault scenario injects clock skew
- [x] #3 The trust model records Git ref compare-and-swap as the only ordering authority, no central arbiter, Lore bounded out of the authoritative-write surface, and a projection that can never satisfy a gate, hold a claim, or be trusted over Git
- [x] #4 The three-tier durability model is recorded, including that durable success is not reported on a local-only unsynchronized commit
- [x] #5 An error taxonomy maps the three categorical outcomes to layer boundaries
- [x] #6 Storage engine, on-disk layout, ID grammar, event schema, locking primitive, merge strategy, and supported platforms are each stated as deferred and linked to the open-decisions register
- [x] #7 Any product-wide implication is written as a proposal routed to quest-doc rather than asserted as normative
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Authored docs/specs/quest-cli-architecture.md.

Elaborates the component ADR four-word seam (CLI, application, domain, ports) into a buildable structure: layer diagram with responsibilities, inward-only dependency rule, five ports with the domain vocabulary each exposes and why each must be substitutable, a four-statement trust model, the three durability tiers, a three-class error taxonomy, and a six-step canonical operation shape.

Decisions made while authoring:
- Runtime-neutral throughout. No language, build system, library, or storage engine is named, because freezing runtime and platform is prohibited until live Lore evidence is reviewed. Ports-and-adapters is the shape the research supports and the shape that survives having its runtime chosen later.
- Named the clock as a first-class port and argued for it explicitly. It is the port most often omitted as over-engineering and the one this design most depends on: TM-05 injects clock skew, which is untestable if lease evaluation reads a system clock directly.
- Made the operation shape a numbered sequence, because the ORDER is the enforcement mechanism for INV-1 and INV-4 - computing the owned path set before any write rules out discovering what to stage by inspecting the tree afterwards, which is how a tool commits a user unrelated work.
- Recorded that an anomaly (two evaluators disagreeing about a lease) fits none of the three outcome classes cleanly, and routed its placement to Phase 1 as an open question rather than inventing a fourth class here.
- Two items are written as proposals routed to quest-doc, not decisions: gate-approval actor eligibility, and whether anomaly becomes a product-wide outcome class.

Verification: lore validate --strict reports 0 errors 0 warnings; lore check reports 37 files 0 errors 0 warnings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the architecture Spec as docs/specs/quest-cli-architecture.md, turning the component ADR four-word layering phrase into a buildable runtime-neutral structure. Covers the four layers with inward-only dependencies, five ports including a clock port justified by the clock-skew fault scenario, a four-statement trust model, the three durability tiers with the rule against reporting durable success on local-only commits, a three-class error taxonomy, and a six-step operation shape whose ordering is what makes the atomicity and staging invariants enforceable. Eight deferred choices are each linked to their open-decisions register entry, and two items are routed to quest-doc as proposals rather than asserted. Verified by lore validate --strict and lore check, both reporting zero errors.
<!-- SECTION:FINAL_SUMMARY:END -->
