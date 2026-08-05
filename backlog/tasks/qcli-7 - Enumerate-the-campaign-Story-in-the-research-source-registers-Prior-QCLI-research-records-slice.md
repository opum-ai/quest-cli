---
id: QCLI-7
title: >-
  Enumerate the campaign Story in the research-source-register's 'Prior QCLI
  research records' slice
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 03:25'
updated_date: '2026-08-05 03:38'
labels:
  - research
  - register
  - correction
  - no-implementation
  - clean-room
  - 'cluster:provenance'
  - campaign
  - wave-2
  - in-review
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
dependencies:
  - QCLI-6
  - QCLI-2.8
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
priority: medium
type: docs
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-2.8's own settlement-pass caveat (docs/reference/quest-cli-component-contracts-and-delivery-graph.md, 'Reconciliation across the ten dependencies') names three of its Provenance-table sources as not yet enumerated in the register's 'Prior QCLI research records' slice: QCLI-2.5's Backlog migration fidelity contract, QCLI-2.6's Git/filesystem/concurrency threat model, and the campaign Story itself (docs/stories/prepare-quests-clean-room-research-foundation.md, cited in QCLI-2.8's own Provenance table as principal grounding). QCLI-6 closed the first two; the Story remains unenumerated in the register after that task. This is the identical enumeration-gap class the campaign has now closed twice (QCLI-2.12, then QCLI-6) -- leaving the Story open recreates the same debt for a third time.

This task resolves the Story's status one way or the other: either admit it as a register member (pinned per the campaign's standing self-pin/SHA-pin rule -- see QCLI-2.12's task notes and PR #17), or state explicitly in the register why Stories are out of scope for that slice's admission authority. Whichever outcome is chosen, QCLI-2.8's caveat must be reconciled against it so it stays accurate.

Documentation only. Do not reclassify any source, and do not narrow any permitted use a merged deliverable already relies on -- the same non-negotiable constraint QCLI-2.12 and QCLI-6 operated under. No product source, runtime dependency, executable scaffolding, package publication, or release.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The register's 'Prior QCLI research records' slice either gains a correctly pinned entry for the campaign Story (self-pinned to its own current state if co-edited by this task's own passes, SHA-pinned to a specific commit otherwise), or the register explicitly states that Stories are out of scope for that slice's admission authority, with reasoning
- [ ] #2 QCLI-2.8's caveat at quest-cli-component-contracts-and-delivery-graph.md is updated (if the gap closed) or confirmed still accurate (if Stories were ruled out of scope) against whichever outcome AC1 produced
- [ ] #3 No slice loses its Classification field, the slice-to-Classification count stays one-to-one, and no permitted use is narrowed below what a merged deliverable already relies on
- [ ] #4 lore check --strict, lore validate --strict, and lore orphans report zero errors, warnings, and orphans
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read register 'Prior QCLI research records' slice in full (done) and the Story file (done) and lore linking topic (done) to confirm Stories carry a lore-managed tasks: block that lore sync rewrites on every coupled task's status change, independent of authored-prose edits -- confirmed via QCLI-6's own last touch to the Story (commit d4b7123: only the frontmatter status and the managed Tasks table row changed, no prose).
2. Judgment call: RULE STORIES OUT OF SCOPE for this slice's admission authority (do not admit the Story as a member). Reasoning: (a) every existing member of this slice is a Reference/Spec/ADR-type document whose authored content is fixed once its owning task's edits land -- the precondition for this slice's pinning discipline (self-pin or exact-commit SHA) to mean anything; (b) a Story is a structurally different document type carrying a live-synced tasks: block, so no exact-revision pin against it can outlive the next unrelated coupled task's status change -- a categorically worse instability than the same-pass co-editing hazard QCLI-2.12's self-pin rule solves, and one self-pinning does not fix either; (c) what QCLI-2.8 actually draws from the Story (its Goal/Acceptance-criteria prose, cited as 'the campaign's own acceptance criteria this document's structure answers to') is directional/organizational grounding, not an evidentiary 'prior research record' whose findings later work must stay consistent with -- the same non-evidentiary citation relationship this register already extends, without slice admission, to a citing document's own Backlog task record or the research Spec's Dependency order table.
3. Edit docs/reference/quest-cli-research-source-register.md, 'Prior QCLI research records' slice: add a dated, attributed (QCLI-7) paragraph to the Exclusions field stating Stories are out of scope with the reasoning from step 2; add a brief cross-reference note in Repository or URL pointing to it. Also: since this task co-edits docs/reference/quest-cli-component-contracts-and-delivery-graph.md (QCLI-2.8's deliverable) in this same pass, and that document is ALREADY a pinned member of this slice (added by QCLI-6, currently commit-pinned to 8935551 shared with QCLI-2.10), change QCLI-2.8's document specifically to a self-pin (Option-A pattern, same as the register's and migration ledger's own self-pins) so the pin does not go stale the moment this task's edit lands; leave QCLI-2.10's playbook pinned at 8935551 (untouched by this task). Update the running self-pinned/commit-pinned/distinct-SHA counts accordingly (two->three self-pinned members; twelve->eleven commit-pinned; eight distinct SHAs unchanged since 8935551 still pins QCLI-2.10 alone). Do not change any Classification field; do not narrow any permitted use.
4. Edit docs/reference/quest-cli-component-contracts-and-delivery-graph.md's 'Provenance and grounding (AC1)' caveat (the 'three of this table's own sources are not yet enumerated' paragraph, sources QCLI-2.5/QCLI-2.6/the Story): preserve the original paragraph as the historical record of what QCLI-2.8's own settlement pass found, and append a dated 'Resolved 2026-08-04' paragraph stating QCLI-2.5 and QCLI-2.6 are now enumerated (QCLI-6) and the Story was considered and ruled out of scope by QCLI-7 (not an outstanding gap), citing the register's Exclusions field for the reasoning.
5. Run lore check --strict, lore validate --strict, lore orphans; fix anything flagged.
6. Manually re-read both edited slices/sections against AC1-AC3 line by line.
7. Record decisions and verification in backlog notes (--append-notes), including the admit-vs-rule-out reasoning and the out-of-scope discovery (quest-cli-backlog-adoption-and-migration-playbook.md carries its own now-stale QCLI-2.5-enumeration caveat, out of this task's scope, flagged for a future task).
8. Commit in small logical commits with Refs: QCLI-7 trailers; push branch fix/qcli-7-story-enumeration.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decision (admit vs. rule-out): RULED STORIES OUT OF SCOPE for the register's "Prior QCLI research records" slice admission authority. Did not admit the Story as a member.

Reasoning: every existing member of the slice (component charter, migration ledger, research Spec, accepted ADR, this register, and the nine QCLI-2.2-QCLI-2.10 Reference deliverables) is a Reference/Spec/ADR-type document whose authored content is fixed once its owning task's edits land -- that fixedness is what lets the slice's Classification vocabulary and pinning discipline (self-pin or exact-commit SHA) apply meaningfully. A Story is a structurally different lore document type: per `lore instructions linking`, it carries a `tasks:` frontmatter list and a lore-managed Tasks block that `lore sync` mechanically rewrites whenever ANY coupled task's Backlog status changes, independent of authored-prose edits. This was empirically confirmed live during this task's own pass: the Story's last prior touch (QCLI-6's settlement commit d4b7123) changed only its frontmatter `status` and Tasks table row, no prose; then this task's own pass coupled a 17th task (QCLI-7 itself, linked via `lore link` to close an orphan-task finding `lore orphans` surfaced) and ran `lore sync` again, changing the Story a further time with zero prose edits. No exact-revision pin against a Story can outlive the next unrelated task's routine status change -- a strictly worse instability than the same-pass co-editing hazard the self-pin/SHA-pin rule (QCLI-2.12, PR #17) exists to solve, and one self-pinning does not fix either. Independently: what QCLI-2.8 draws from the Story ("the campaign's own acceptance criteria this document's structure answers to") is the campaign's directing charter, not an evidentiary finding later research must "stay consistent with" the way this slice's Permitted use field frames its actual members -- the same non-evidentiary citation relationship the register already extends, without slice admission, to a citing document's own Backlog task record or the research Spec's Dependency order table.

Implementation: recorded the out-of-scope determination and reasoning in the slice's Exclusions field, with a dated pointer in Repository or URL (AC1, second branch). Since this same pass co-edits QCLI-2.8's component-contracts-and-delivery-graph.md (AC2), and that document was ALREADY a pinned register member added by QCLI-6 (commit-pinned to 8935551, shared with QCLI-2.10) -- moved QCLI-2.8's pin specifically to a self-pin (Option-A pattern, same as the register's and migration ledger's own self-pins), since a commit-pin cannot survive this pass's own later edit to that document. QCLI-2.10's playbook is untouched by this task and keeps its original 8935551 pin. Updated running counts: 2->3 self-pinned members, 12->11 commit-pinned, 8 distinct SHAs unchanged (8935551 now pins QCLI-2.10 alone). No Classification field touched (AC3).

Reconciled QCLI-2.8's caveat (component-contracts-and-delivery-graph.md, "Provenance and grounding (AC1)" section, the "three of this table's own sources are not yet enumerated" paragraph -- note: this caveat lives in that section, NOT in "Reconciliation across the ten dependencies" as the campaign brief's line-number pointer suggested; verified directly against the live file) (AC2): left the original paragraph standing as historical record (inline-supersession convention) and appended a dated "Resolved 2026-08-04" paragraph confirming QCLI-2.5/QCLI-2.6 are now enumerated (QCLI-6) and the Story is settled out of scope (QCLI-7), not an outstanding gap.

Verification: lore check --strict, lore validate --strict, and lore orphans all report 0 errors/warnings/orphans (25 files each; ran clean after `lore link` + `lore sync` reconciled a pre-existing Story status/managed-block drift and orphan-task condition that predated this task's content edits -- QCLI-7 was filed but never linked to the campaign Story). Working tree clean after commits.

Out-of-scope discovery, flagged not fixed (per instructions): docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md (QCLI-2.10's own deliverable) carries its own, now-stale, near-identical caveat ("Caveat -- the fidelity contract's own admissibility is not yet enumerated", lines ~426-449) about QCLI-2.5's fidelity contract not being enumerated in "Prior QCLI research records" -- QCLI-6 already closed that gap in the register, but QCLI-2.10's own document text was never updated to reflect it, same as QCLI-2.8's caveat was stale before this task. This is outside QCLI-7's stated scope boundary (register + component-contracts-and-delivery-graph.md only) and was not touched. Recommend a small follow-up task to reconcile it the same way this task reconciled QCLI-2.8's caveat.
<!-- SECTION:NOTES:END -->
