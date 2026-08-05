---
id: QCLI-20
title: Propose the scale target and the projection sizing basis it implies
status: To Do
assignee: []
created_date: '2026-08-05 12:33'
updated_date: '2026-08-05 15:35'
labels:
  - campaign
  - 'cluster:projection'
  - decisions
  - phase-1
  - proposal
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: medium
type: spike
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Register entry D5. No scale target is set anywhere in the corpus. Its absence blocks two things: the projection storage or index engine cannot be chosen without it, and the migration read pass cost is known to scale with source-project size but against no stated target.

Propose a target expressed in terms a design can be checked against - record counts, event counts, repository and clone counts, and the rebuild time budget a user would accept - with the reasoning behind each figure rather than round numbers asserted.

Then state what the target implies for the projection: whether rebuild-on-doubt is sufficient or the projection port needs transactional semantics, which the architecture Spec raises and leaves open.

Do not choose a storage engine. Runtime is blocked post-activation as register entry D2, and an engine choice made before the runtime decision would be a freeze the research programme Spec prohibits.

Deliver a proposal for owner ruling. Do not edit the open component decisions register; a separate pass reconciles it once the owner rules.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A scale target is proposed across record, event, repository, and clone dimensions, each with stated reasoning rather than an asserted round number
- [ ] #2 A rebuild time budget is proposed and related to the forced-full-rebuild escape hatch the projection contract requires
- [ ] #3 The proposal states what the target implies for whether the projection port needs transactional semantics
- [ ] #4 No storage or index engine is chosen, and the reason for not choosing one is stated
- [ ] #5 The document is framed as a proposal for owner ruling; no decision is recorded as accepted and no ADR is created
- [ ] #6 The open component decisions register is not edited by this task
- [ ] #7 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Researched register D5, the architecture Specs Open questions (projection port transactional semantics vs rebuild-on-doubt), functional-requirements FR-PROJ-2..9, the component-contracts-and-delivery-graphs residual finding #5 (migration read-pass cost scales with source-project size, no target set), the component charter (local, single-package, non-hosted, explicit multi-repository enrollment/isolation, first-release non-goal of hosted portfolio/dashboard), the glossary (event-sourced task/workspace state, Workspace/Enrollment terms), and the Git/filesystem/concurrency threat model (worktree/clone coordination, TM-03 two-clone race, TM-06 repository removal, durability tiers) to ground each proposed dimension in the corpuss own stated properties rather than an external assumption.
2. Gathered real, dated self-hosted evidence as a floor anchor rather than inventing figures: this campaigns own live Backlog corpus (41 active task records, 0 archived, verified via ls backlog/tasks) and its own Git mutation history (106 commits touching backlog/, 62 touching docs/, spanning 2026-08-01..2026-08-05), explicitly flagged in the proposal as a compressed, accelerated, dated anchor rather than a claimed norm, then reasoned upward toward a realistic sustained multi-year small-team project.
3. Scaffolded a new Reference-type concept via lore new reference under docs/reference/ and hand-authored the proposal body: record/event/repository/clone-count targets each with a stated reasoning chain (not a round number asserted); a rebuild time budget tied explicitly to the forced-full-rebuild escape hatch (FR-PROJ-5, BB-08); an explicit answer to whether the target implies the projection port needs transactional semantics or whether rebuild-on-doubt is sufficient; and an explicit statement of why no storage or index engine is chosen (D2 blocked post-activation; choosing one now would be the premature freeze the research programme Spec prohibits).
4. Framed the whole document as a proposal for an owner ruling: no ADR created, no decision recorded as accepted, and no edit to the open component decisions register (a separate reconciliation task folds the outcome in once an owner rules).
5. Ran lore sync to regenerate the reference index/log, then lore validate --strict, lore check, and lore orphans, resolving any findings, and recorded the real command output as verification evidence rather than asserting success.
6. Recorded notes and any out-of-scope findings via backlog task edit QCLI-20 --append-notes, then committed in small logical commits each ending Refs: QCLI-20, and pushed the branch. Did not change task status, check acceptance criteria, or touch any sibling-owned file (open component decisions register, contracts and delivery graph, research source register) per this waves scope boundary.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Authored docs/reference/quest-cli-scale-target-proposal.md via lore new reference, then hand-wrote the proposal body. Contents:

- Proposes design-point figures, each with a stated reasoning chain rather than an asserted round number: ~10,000 task records per enrolled workspace; ~100,000-150,000 events per enrolled workspace (~10-15 events/record); ~25 concurrently enrolled workspaces per Quest installation; ~5-10 live clones per enrolled repository.
- Grounded every figure in two real anchors: (a) this campaigns own live Backlog corpus, independently re-derived in this worktree on 2026-08-05 (41 active task records via ls backlog/tasks, 35 Done/6 To Do, 0 archived; 106 commits touching backlog/, 62 touching docs/, 146 total, spanning 2026-08-01..2026-08-05 via git log --oneline -- <path>), explicitly flagged as a compressed accelerated-campaign floor rather than a claimed norm; and (b) the corpuss own stated properties -- the component charters non-hosted/non-portfolio scope and explicit multi-repository enrollment model, the glossarys event-derived-state and workspace/enrollment terms, and the threat models worktree/clone coordination topology (TM-03, TM-06, durability tiers).
- Proposed a rebuild time budget tied directly to the forced-full-rebuild escape hatch (FR-PROJ-5, BB-08): low single-digit seconds at the ordinary per-workspace design point, low minutes at the ~25-workspace aggregate bound, past which the glossarys already-flagged operator-confirmation UX candidate for a very large or multi-workspace rebuild stops being optional.
- Answered the architecture Specs open question directly: at the proposed target, rebuild-on-doubt remains sufficient and full ACID-style cross-record transactional semantics are not implied; the only durable-write requirement is the progress-point checkpoint FR-PROJ-3/FR-PROJ-4 already require independent of scale (BB-07/BB-08 resume-not-restart). Flagged explicitly that this conclusion inverts if a future owner ruling sets the target closer to hosted/portfolio scale, which the charter currently routes outside this component.
- Stated two independent reasons no storage or index engine is chosen: D2 (runtime/native packaging) is blocked post-activation, and the research programme Spec prohibits freezing such choices before Lore evidence is reviewed; an engine choice is made in runtime vocabulary the architecture Spec deliberately withholds until D2 settles.
- Framed the whole document as a proposal for owner ruling throughout: no ADR created, no decision recorded as accepted, explicit statement that the open component decisions register is not edited here and a separate reconciliation task folds in the outcome once an owner rules.

Did not touch quest-cli-open-component-decisions.md, quest-cli-component-contracts-and-delivery-graph.md, or quest-cli-research-source-register.md -- read and cited only, verified via git diff --name-only HEAD~1 against all three (empty output).

Verification evidence (all re-run clean after the commit, working tree clean):
- lore validate --strict: 39 files, 0 errors, 0 warnings, 6 skipped -- exit 0
- lore check: 39 files, 0 errors, 0 warnings -- exit 0
- lore orphans: 0 orphan tasks, 0 dangling links -- exit 0

Did not change task status, check off acceptance criteria, or write a final summary, per this waves orchestrator instructions overriding the generic task-execution guides in-progress step.

Out-of-scope observations (not acted on):
- No corpus defect or drift was found while researching D2/D5 and the projection contract -- the registers D5 row, the delivery graphs residual finding 5, and the architecture Specs open question are already mutually consistent as of this reading.
- lore new flagged the initial --summary as too long (238 chars, over the ~200-char guidance); shortened before authoring the body. Not a corpus defect, just a scaffolding-step note.
- Noticed in passing (via the research programme Specs prohibited-work clause) that lore-cli maintains its own LadybugDB benchmark/scale-acceptance doc for its own graph engine -- unrelated to Quests own projection-engine decision (D5/D2) and out of this repos scope; not cited as evidence in the proposal and no action taken.
<!-- SECTION:NOTES:END -->
