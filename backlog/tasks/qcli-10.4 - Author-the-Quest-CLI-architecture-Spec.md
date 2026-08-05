---
id: QCLI-10.4
title: Author the Quest CLI architecture Spec
status: To Do
assignee: []
created_date: '2026-08-05 11:41'
updated_date: '2026-08-05 11:41'
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
- [ ] #1 Layers are named with what belongs in each and the rule that dependencies point inward only
- [ ] #2 The ports are named, including a clock port, since lease expiry is evaluated against the evaluator's own clock and a fault scenario injects clock skew
- [ ] #3 The trust model records Git ref compare-and-swap as the only ordering authority, no central arbiter, Lore bounded out of the authoritative-write surface, and a projection that can never satisfy a gate, hold a claim, or be trusted over Git
- [ ] #4 The three-tier durability model is recorded, including that durable success is not reported on a local-only unsynchronized commit
- [ ] #5 An error taxonomy maps the three categorical outcomes to layer boundaries
- [ ] #6 Storage engine, on-disk layout, ID grammar, event schema, locking primitive, merge strategy, and supported platforms are each stated as deferred and linked to the open-decisions register
- [ ] #7 Any product-wide implication is written as a proposal routed to quest-doc rather than asserted as normative
<!-- AC:END -->
