---
id: QCLI-18
title: >-
  Propose the CLI result contract: envelope shape, exit-code table, not-found
  convention, and anomaly placement
status: To Do
assignee: []
created_date: '2026-08-05 12:33'
updated_date: '2026-08-05 12:35'
labels:
  - campaign
  - 'cluster:cli-contract'
  - decisions
  - phase-1
  - proposal
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: high
type: spike
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Delivery Phase 1 is component decision work that produces no code and is not blocked on the Lore-owned release gate. This task drafts a proposal for its largest cluster of open items, for the owner to rule on. It decides nothing by itself.

In scope, from the open component decisions register:
- The exact envelope shape - whether schemaVersion is numeric or another form, the kind naming convention, whether a shared data key exists or each kind carries its own payload key, and per-command payload-key naming.
- The literal exit-code-to-outcome table over the three categorical outcomes.
- The not-found signal convention. Note that the lore-doc half of this is a boundary decision Quest cannot make alone; propose Quest side only and mark the dependency.
- Where an anomaly sits in the outcome taxonomy. A detected lease-evaluator disagreement is neither success, nor a correct decline, nor an internal fault; the architecture Spec raises this and leaves it open.

Load-bearing constraint from QCLI-2.7: Lore inbound adapter expectation and Lore own documented outbound contract diverge deliberately, so mirroring Lore published JSON output would produce the wrong shape. Neither may be copied as a default.

Deliver a proposal document with options, trade-offs, and a recommendation per item. Do not edit the open component decisions register - a separate pass reconciles it once the owner rules, so that this task and the others in its wave do not contend for the same file.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each of the four in-scope items has a stated proposal with the alternatives considered and the reason for the recommendation
- [ ] #2 The proposal explains how it avoids inheriting either side of the documented Lore envelope divergence
- [ ] #3 Items requiring a lore-doc boundary decision are marked as such and are not proposed as settled by Quest alone
- [ ] #4 The document is framed as a proposal for owner ruling; no decision is recorded as accepted and no ADR is created
- [ ] #5 The open component decisions register is not edited by this task
- [ ] #6 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->
