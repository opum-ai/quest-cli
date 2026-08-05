---
id: QCLI-19
title: Propose the canonical identifier grammar and authored-record layout
status: Done
assignee: []
created_date: '2026-08-05 12:33'
updated_date: '2026-08-05 16:27'
labels:
  - campaign
  - 'cluster:identity'
  - decisions
  - phase-1
  - proposal
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-2
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: high
type: spike
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Register entry D4. The canonical identifier grammar is an open component decision resolved by no document in the research campaign, and it gates the authored-record layout, which gates Phase 2.

Constraints already settled and not reopenable here:
- Quest does not inherit Backlog.md project-configurable prefix, zero-padding, or dot-suffixed hierarchy. That is an accepted ADR.
- A task has one canonical identity; aliases resolve to it and never constitute a second identity.
- Identifier uniqueness is enforced by Quest own comparison logic, never delegated to filesystem case behaviour, because that differs across platforms and would make identity platform-dependent.
- Exactly one lease exists per canonical task system-wide, not one per identifier form.
- Migration maps on the pair of source folder and source identifier, and must be reversible.

Propose a grammar satisfying all of the above, plus the authored-record layout and naming scheme it implies. Cover Unicode normalisation and case-folding behaviour explicitly - scenario TM-10 runs across two real filesystems.

Deliver a proposal for owner ruling. Do not edit the open component decisions register; a separate pass reconciles it once the owner rules.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A canonical identifier grammar is proposed with the alternatives considered and the reason for the recommendation
- [x] #2 The proposal states how it satisfies each of the five settled constraints named in the description
- [x] #3 Unicode normalisation and case-folding behaviour are specified explicitly, with the cross-filesystem collision case addressed
- [x] #4 The implied authored-record layout and naming scheme are described, including how records are enumerated exactly once across nested subdirectories
- [x] #5 The document is framed as a proposal for owner ruling; no decision is recorded as accepted and no ADR is created
- [x] #6 The open component decisions register is not edited by this task
- [x] #7 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Ground the proposal in the live sources before writing: register entry D4 and the "What is not open" section in docs/reference/quest-cli-open-component-decisions.md; the accepted ADR docs/adr/migrate-from-backlog-md-reversibly-without-inheriting-its-id-grammar.md; the lease ADR docs/adr/bound-claims-with-leases-evaluated-against-the-evaluator-s-own-clock.md ("Exactly one lease exists per canonical task, system-wide"); the threat model docs/reference/quest-cli-git-filesystem-and-concurrency-threat-model.md sections "Aliases", "Case sensitivity" (TM-10), and "Subdirectories" (TM-11, BB-10); and FR-IDENT-3/4/6/7/8 and FR-MIG-2/7 in docs/specs/quest-cli-functional-requirements.md. Read only; none of these are edited.

2. Scaffold the deliverable with `lore new reference "Quest CLI canonical identifier grammar and authored-record layout proposal"` under docs/reference/, matching the frontmatter/citation conventions of sibling Reference docs (grounding table, read-only citations of the register/ADR/threat-model, explicit non-goals).

3. Author the proposal body (outside any lore-managed block) covering, per the task's acceptance criteria:
   - A recommended canonical identifier grammar (fixed non-configurable literal prefix + flat, unpadded, monotonic decimal sequence; ASCII-only alphabet; single fixed canonical case; global counter, not scoped per folder/lifecycle state) plus at least three alternatives considered (opaque UUID/ULID, title-derived slug, and Backlog-style project-configurable/zero-padded/dot-suffixed grammar) with the reasoning for rejecting each and recommending the proposed shape.
   - An explicit subsection mapping the proposal against each of the five settled constraints named in the task description (ADR non-inheritance; one canonical identity with aliases; Quest's-own-comparison-logic uniqueness; exactly-one-lease-per-canonical-task; migration mapping on source-folder+source-identifier, reversible).
   - Explicit Unicode normalisation (NFC) and case-folding (Unicode default case folding for aliases/free text; ASCII case-fold for the restricted canonical-ID alphabet) rules, and a named-anomaly / reject-at-creation resolution for the TM-10 cross-filesystem case-collision scenario, verified identically regardless of which clone's filesystem performs the check.
   - The implied authored-record layout: one Git-tracked file per canonical task, filename anchored on the canonical-ID token (organizational subdirectories carry no identity meaning), and an enumeration rule (recursive walk, no symlink following, fold-compare every discovered ID, structured conflict rather than silent pick/merge) that finds each record exactly once at any nesting depth.
   - An explicit framing statement: this is a proposal for owner ruling; no ADR is created and no decision is marked accepted.

4. Link the new Reference doc's provenance/citation to the owning Story (docs/stories/follow-through-on-the-quest-cli-design-layer.md) the way sibling proposal-shaped Reference docs do; confirm via `lore instructions linking` whether `lore link` applies here (it couples Story <-> Backlog task ids, not Story <-> Reference doc, so the Story coupling is already via QCLI-19's `doc:` label / the Story's existing `tasks:` list) — do not touch the Story's managed task block by hand, only run `lore sync` if reconciliation is needed.

5. Run the three verification gates (`lore validate --strict`, `lore check`, `lore orphans`) and iterate until each is clean; record the literal output as evidence.

6. Record notes on the task via `backlog task edit QCLI-19 --append-notes` (via a scratch file, per the apostrophe/heredoc bug) summarizing what was authored and pasting the gate output. Do not check acceptance criteria or write a final summary or change status away from In Progress.

7. Commit in small logical commits (`docs(identity): ...`, each with a `Refs: QCLI-19` trailer) and push the branch as the last action.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Authored docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md via `lore new reference ...`, linked into docs/reference/index.md automatically by lore, and cited from (not edited into) the owning Story's coupled-tasks table via `lore sync`.

What the document covers, mapped to this task's acceptance criteria:
- AC1: recommends a fixed-literal-prefix + flat unpadded decimal grammar (ASCII-only, single global counter, one fixed canonical case), against three alternatives considered and rejected (opaque UUID/ULID, title-derived slug, Backlog-style project-configurable/zero-padded/dot-suffixed grammar), with reasons for each.
- AC2: a dedicated subsection maps the recommendation against each of the five settled constraints named in the task description, citing the corpus doc that actually settled each one (migration ADR, lease ADR, threat model, FR-IDENT/FR-MIG rows) rather than the task text itself.
- AC3: specifies NFC + Unicode default case folding for aliases/free text, and ASCII case-fold to one fixed case for the restricted canonical-id alphabet, with an explicit walk-through of the TM-10 cross-filesystem case-collision scenario (creation-time rejection via Quest's own fold-then-compare logic, plus the fallback structured-conflict requirement for a collision reaching disk some other way) and a note on why differently-cased organisational directory names are not an identity hazard.
- AC4: one Git-tracked file per canonical task, filename anchored on the canonical-id token with a non-identity-bearing informational slug, identity-free arbitrarily-nested subdirectories, and a fold-keyed recursive enumeration algorithm (no symlink following, structured conflict on a folded-key collision) that finds each legitimate record exactly once regardless of nesting depth.
- AC5: framed throughout as a proposal for owner ruling ("Nothing in this document is accepted"); closes with an explicit "What the owner is asked to rule on" section; no ADR created.
- AC6: docs/reference/quest-cli-open-component-decisions.md was read-only cited, never edited (confirmed via `git diff` — not in this branch's diff).
- AC7: verification evidence below.

Verification (run from the worktree root after authoring and after `lore sync`):

$ lore validate --strict --plain
39 files, 0 errors, 0 warnings, 6 skipped
exit=0

$ lore check --plain
39 files, 0 errors, 0 warnings
exit=0

$ lore orphans --plain
orphans: 0 orphan tasks, 0 dangling links
(none — every task has an owning doc, every linked task is live)
exit=0

Note: an initial `lore check` run (before `lore sync`) reported status-drift/managed-block-drift on the owning Story, expected after marking this task In Progress; `lore sync` reconciled it (regenerating docs/log.md, docs/reference/index.md, and the Story's managed task block/status) and the re-run above is clean.

Scope respected: did not touch docs/reference/quest-cli-open-component-decisions.md, docs/reference/quest-cli-component-contracts-and-delivery-graph.md, or docs/reference/quest-cli-research-source-register.md (read/cited only). Did not check acceptance criteria, write a final summary, change task status to Done, touch the campaign doc, or create any new Backlog task.

Out-of-scope findings noticed while researching (not acted on, reported per instructions):
- None beyond what the register and Story already record as open (D2/D3/D5/D6/D7a/D7b, the CLI-contract open items, and the residual-items list) — nothing new surfaced during this task's research.

Verified: Reviewer independently re-verified every cited constraint, ADR quote (migration ADR properties, lease-eligibility ADR), and threat-model scenario (TM-10 cross-filesystem case-collision) against the actual corpus text and confirmed all 7 ACs on the first pass, with only low-severity advisory notes (non-blocking: locale-invariance nuance, counter-CAS terseness, event-schema omission from the leaves-open list). lore validate --strict / lore check / lore orphans all clean (39 files, 0/0). Merged as adea711 (PR #33).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Authored docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md, a proposal for owner ruling on register entry D4: a fixed-literal-prefix, flat, unpadded, ASCII-only monotonic-decimal identifier grammar from a single global counter, mapped explicitly against all five settled constraints (non-inheritance ADR, one-canonical-identity, Quest-own-uniqueness-logic, one-lease-per-canonical-task, reversible migration mapping). Covers Unicode normalisation/case-folding explicitly, including the TM-10 cross-filesystem collision case, plus the implied one-file-per-task authored-record layout and its exactly-once enumeration algorithm. Decides nothing; no ADR created; register untouched. Reviewer approved on first pass with only low-severity advisory notes. Merged as adea711 (PR #33).
<!-- SECTION:FINAL_SUMMARY:END -->
