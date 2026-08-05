---
id: QCLI-18
title: >-
  Propose the CLI result contract: envelope shape, exit-code table, not-found
  convention, and anomaly placement
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 12:33'
updated_date: '2026-08-05 15:34'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Delivered docs/reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md via `lore new reference ...`, grounded in the live text of the open component decisions register's "JSON and exits" row, the architecture Spec's error taxonomy and Open questions, the emit-three-categorical-outcomes ADR, and QCLI-2.7's adapter contract review Part 2 (items 2b, 4b/4c, 5a/5b, 6c; the divergence table between Lore's inbound adapter expectation and Lore's own outbound cli-contract.md shape).

Per item:
- Envelope shape: recommended a string schemaVersion ("1"), an underscore-joined `<command>_<outcome-class>` kind, and a per-outcome-class payload key (result/decline/error), with an explicit per-axis explanation of why each choice is neither Lore inbound's literal shape nor Lore outbound's cli-contract.md shape.
- Exit-code table: recommended one code per ADR class (0 success, 1 decline/conflict, 2 error, 3 anomaly conditional on item 4, 64 usage error via sysexits EX_USAGE), with lore-cli's own self-facing exit convention presented and rejected as an alternative (Option B) specifically to avoid reproducing lore's own numbering.
- Not-found convention: proposed Quest's own JSON-first decline-envelope convention only, and explicitly marked the lore-doc half (register/adapter item 5b - whether a future Lore adapter accepts this or requires the bare exit-1/empty-stdout pattern) as not settled here, since no Lore adapter targets Quest today (BacklogAdapter is lore-cli's only adapter type).
- Anomaly placement: recommended a distinguishable fourth outcome (kind-tagged, its own conditional exit code 3), and separately flagged - as a distinct, non-lore-doc boundary - that fully canonizing "anomaly" as product-wide vocabulary is the architecture Spec's own quest-doc-routed proposal, not re-opened or settled here.

Framing: explicit "this document decides nothing" statement up front and in the closing summary table; no ADR created; the open component decisions register was not touched by this task (confirmed via `git status --porcelain` against docs/reference/quest-cli-open-component-decisions.md, quest-cli-component-contracts-and-delivery-graph.md, and quest-cli-research-source-register.md - none appear).

Verification evidence (all run from the worktree, current HEAD):
- `lore validate --strict` (whole bundle): "39 files, 0 errors, 0 warnings, 6 skipped", exit 0.
- `lore check`: after the new task's status change to In Progress produced expected status-drift/managed-block-drift on the owning Story, ran `lore sync` (updated docs/log.md, docs/reference/index.md, docs/stories/follow-through-on-the-quest-cli-design-layer.md; committed a pending backlog/ edit as `chore(backlog): sync task changes`). Re-ran `lore check`: "39 files, 0 errors, 0 warnings", exit 0.
- `lore orphans`: "0 orphan tasks, 0 dangling links... every task has an owning doc, every linked task is live", exit 0.

Out-of-scope findings, not acted on:
- The register's "JSON and exits" row also lists "whether create and edit emit a JSON envelope uniformly" as an open item alongside this task's four; QCLI-18's scope does not include it (per the task body) and it remains open after this document - noted explicitly in the new document's own Notes section so it is not mistaken for settled.
- `lore sync`'s catch-all backlog/ commit swept in a pending edit from this session's own `backlog task edit --plan` call (expected behavior per lore's own documented sync semantics, not a foreign change).
<!-- SECTION:NOTES:END -->
