---
id: QCLI-18
title: >-
  Propose the CLI result contract: envelope shape, exit-code table, not-found
  convention, and anomaly placement
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 12:33'
updated_date: '2026-08-05 15:27'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Re-read the live open component decisions register's "JSON and exits" contract row and the architecture Spec's error taxonomy/open-questions sections, plus QCLI-2.7's adapter contract review Part 2 items 2b/4b/4c/5a/5b/6c (docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md), to ground each of the four in-scope items in the current corpus rather than paraphrase the task body.
2. Scaffold a new Reference concept via `lore new reference "<title>"` (matching the existing docs/reference/*.md convention: Reference type, `## Details` body, forward link to the owning Story, no register/contracts-graph/source-register edits).
3. Author the proposal body with one subsection per in-scope item:
   - Envelope shape (schemaVersion form, kind naming, shared data key vs per-kind payload key, per-command payload-key naming) - options, trade-offs, recommendation, explicit statement of how the recommendation avoids copying either Lore's inbound adapter expectation or Lore's own outbound cli-contract.md shape (QCLI-2.7 item 2b).
   - Exit-code-to-outcome table - concrete numeric table over the three categorical outcomes (success/decline-conflict/error) plus the fixed `--version` exit 0 case, with alternatives considered.
   - Not-found signal convention - propose Quest's own side only (JSON-first vs bare-exit convention), explicitly mark the lore-doc boundary half (adapter item 5b / register item 5b) as NOT settled here.
   - Anomaly placement - where a detected lease-evaluator disagreement sits relative to success/decline/error, grounded in the architecture Spec's open question and its note that promoting "anomaly" to a first-class outcome class is itself a quest-doc-facing proposal, not a lore-doc boundary item.
4. Frame the whole document explicitly as a proposal for owner ruling: no ADR created, no decision marked accepted, explicit statement that the open component decisions register is intentionally not edited by this task.
5. Do not touch docs/reference/quest-cli-open-component-decisions.md, docs/reference/quest-cli-component-contracts-and-delivery-graph.md, or docs/reference/quest-cli-research-source-register.md. Do not hand-edit docs/reference/index.md (managed block) or the Story's managed task table.
6. Run `lore sync` to reconcile managed blocks/index, then run the three gates: `lore validate --strict`, `lore check`, `lore orphans`, recording real output.
7. Record notes and evidence on QCLI-18 via `backlog task edit --append-notes`, commit in small logical commits (`type(scope): summary`, `Refs: QCLI-18` trailer), and push the branch.
<!-- SECTION:PLAN:END -->
