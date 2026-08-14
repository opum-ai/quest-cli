---
id: QCLI-38
title: >-
  Determine whether 'naming scheme' is also closed by the QCLI-25
  authored-record-layout section
status: Done
assignee:
  - '@claude'
created_date: '2026-08-06 16:54'
updated_date: '2026-08-14 12:17'
labels:
  - campaign
  - 'cluster:naming-scheme-reconciliation'
  - wave-1
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
dependencies: []
documentation:
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-34 closed 'file layout' as the same concept as QCLI-25/D4's 'authored-record layout'. Both the QCLI-34 worker and its reviewer independently flagged that 'naming scheme' — a sibling open item in the same open-item list(s) file layout was closed from — is plausibly also settled by the same QCLI-25 section: QCLI-25's authored-record-layout text includes 'filename anchored on the canonical id in fixed case...', which is literally a naming-scheme decision. QCLI-34 deliberately left this untouched as out of its own stated scope. This task makes the same-concept-vs-distinct determination for 'naming scheme' that QCLI-34 made for 'file layout', and reconciles the open-item listing(s) accordingly, in the same two documents QCLI-34 touched (docs/reference/quest-cli-open-component-decisions.md and docs/reference/quest-cli-component-contracts-and-delivery-graph.md). Surfaced as a proposed follow-up in doc-7 (QCLI-33/34/35 campaign, wave 1) and approved for filing by the user on 2026-08-06.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The QCLI-25 ADR and register D4 are read closely enough to state definitively whether 'naming scheme' denotes the same on-disk-structure decision QCLI-25/D4 already settled, or is genuinely distinct
- [x] #2 If the same concept: the 'naming scheme' open-item listing(s) are updated to reflect that this item is settled, using terminology consistent with QCLI-25
- [ ] #3 If genuinely distinct: the listing(s) retain 'naming scheme' as open but gain a one-line clarifying note distinguishing it from the QCLI-25/D4 decision
- [x] #4 No other row or item in either table is modified
- [x] #5 lore validate --strict passes with 0 errors and 0 warnings
- [x] #6 lore check reports 0 errors
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Hypothesis to verify: 'naming scheme' (Git mutation contract open item) plausibly denotes the SAME on-disk-structure decision QCLI-25/D4 settled (the authored-record filename-anchoring rule), not a distinct concept -- but confirm by reading QCLI-25 ADR in full plus its origin sources (QCLI-19 proposal, QCLI-2.6 threat model non-goals) before concluding.
2. Read QCLI-25 ADR (docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md) 'Authored-record layout' section in full; read QCLI-19's proposal (docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md) for its literal section title and content; read QCLI-2.6 threat model (docs/reference/quest-cli-git-filesystem-and-concurrency-threat-model.md) 'Non-goals' section, the origin of the 'naming scheme' term; read require-atomic-idempotent-operation-owned-mutations.md's line grouping 'file layout, naming scheme' together; read QCLI-34's own notes on 'file layout' for precedent and its flagged out-of-scope finding on naming scheme.
3. Make the same-concept-vs-distinct determination with textual evidence quoted.
4. Apply the determined outcome to both files (register table row split/note; delivery-graph explicitly-open list edit), following QCLI-34's established pattern exactly, touching nothing else (not line 167, not the other 4 sibling items' Open status).
5. Run lore validate --strict and lore check; capture real output.
6. Record determination, evidence, changes, and verification in --append-notes.
7. Commit with Refs: QCLI-38 trailer; push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DETERMINATION: SAME CONCEPT (confidence: high). 'Naming scheme' (the Git mutation contract's open item, sibling to the now-closed 'file layout') denotes the same on-disk-structure decision QCLI-25/D4 already settled — specifically the authored-record filename-anchoring convention.

EVIDENCE:
1. The term 'naming scheme' originates in QCLI-2.6's Git/filesystem/concurrency threat model non-goals (docs/reference/quest-cli-git-filesystem-and-concurrency-threat-model.md, lines 87-99): 'This model intentionally does not: choose a file layout, naming scheme, canonical-ID grammar, event schema, locking primitive, merge/rebase strategy, or storage engine (the research program Spec lists "canonical ID grammar, authored-record layout, event schema, and scale target" as an open question this document does not close).' The threat model's own parenthetical self-cites the Spec's compressed 'authored-record layout' bundle term as covering BOTH 'file layout' and 'naming scheme' from its own 7-item non-goals list — the same textual pattern QCLI-34 already relied on for 'file layout' alone.
2. QCLI-19's proposal (docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md, line 238) has a section literally titled 'Authored-record layout and naming scheme' — bundling the two under one heading. Its content IS the naming-scheme decision: 'Its filename is anchored on the canonical id in fixed case, optionally followed by a separator and a free-text, purely informational slug... `<canonical-id>[ - <informational-slug>].md`'.
3. The QCLI-25 ADR (docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md) states: 'The recommended grammar shape, authored-record layout, and Unicode/case-folding rules in QCLI-19's proposal are accepted as proposed' (line 62) — and its own 'Authored-record layout' section (lines 92-111) reproduces the identical filename-anchoring bullet verbatim: 'Filename anchored on the canonical id in fixed case, optionally followed by a separator and a free-text, purely informational slug...'. Since the ADR accepts QCLI-19's proposal 'as proposed', and the proposal's own section title names this content as both 'authored-record layout' AND 'naming scheme', the ADR's acceptance necessarily closes both.
4. Corroborating: require-atomic-idempotent-operation-owned-mutations.md line 69 groups 'file layout, naming scheme, event schema, and locking primitive' together as jointly-undecided-there, consistent with 'file layout' and 'naming scheme' being the same class of decision (record/filename structure) as opposed to 'event schema'/'locking primitive' (Git-mutation-mechanism internals, still open, untouched here).
5. QCLI-34's own reviewer note (already on QCLI-34's task record) independently flagged: 'the threat model's non-goals mapping has no home for file layout/naming scheme other than authored-record layout' — reached testing the strongest counter-case and finding it had no distinct textual home.

No textual home exists for 'naming scheme' as a decision distinct from the authored-record layout's filename convention; nothing in QCLI-25, D4, the threat model, or the proposal treats them as separate questions. The remaining Git-mutation open items (event schema, locking primitive, merge/rebase strategy, storage engine) are unambiguously distinct — none of QCLI-25's text touches Git ref/commit/event/lock mechanics — and were left untouched.

CHANGES MADE (mirroring QCLI-34's established pattern exactly):
- docs/reference/quest-cli-open-component-decisions.md line 194: split 'Naming scheme' out of the bundled open row into its own row, marked Closed, citing QCLI-25 and D4's authored-record layout with the specific filename-anchoring evidence. Remaining row keeps 'Event schema, locking primitive, merge and rebase strategy, storage engine' as Open, verbatim/unchanged text and status.
- docs/reference/quest-cli-component-contracts-and-delivery-graph.md lines 431-444 (prose Explicitly-open list): moved 'naming scheme' out of the open list into the closed-items sentence alongside 'file layout' and 'canonical-ID grammar', with a clarifying clause naming the specific filename-anchoring convention it was settled by. 'Three items... now closed' -> 'Four items... now closed'.
- Line 167 (QCLI-37's Spec-open-questions mapping row) untouched. No other row/section touched — confirmed via git diff.

VERIFICATION:
- lore validate --strict: '47 files, 0 errors, 0 warnings, 6 skipped', exit 0.
- lore check: '47 files, 0 errors, 0 warnings', exit 0.
- git diff confirms only the two targeted rows/list-items changed in the two target files; the other 4 sibling items (event schema, locking primitive, merge/rebase strategy, storage engine) remain Open, unchanged in substance.

Determination: SAME CONCEPT. 'Naming scheme' denotes the same on-disk-structure decision QCLI-25/D4 already settled (authored-record filename convention). Evidence independently re-verified by the reviewer against primary sources: QCLI-19's proposal section 'Authored-record layout and naming scheme' (line 238), the QCLI-25 ADR's verbatim reproduction of the filename-anchoring bullet and its acceptance of QCLI-19's rules 'as proposed', and QCLI-2.6's threat-model non-goals self-mapping 'file layout, naming scheme' onto the Spec's bundled 'authored-record layout' term. Reviewer found no counter-evidence for a distinct reading. AC3 (the 'genuinely distinct' branch) does not apply since the same-concept branch was taken. Register and delivery-graph edits confirmed scoped exactly as required, byte-precise around QCLI-37's territory (line 167) and the 4 remaining Git-mutation open items. lore validate --strict and lore check both independently re-run by the reviewer: 47 files, 0 errors, 0 warnings. Merged as 761313d (PR #54).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Determined 'naming scheme' is the same on-disk-structure decision QCLI-25/D4 already settled, not a distinct open item, based on QCLI-19's 'Authored-record layout and naming scheme' section and the QCLI-25 ADR's verbatim adoption of it. Split naming scheme out of the bundled Git-mutation open row into its own Closed row (register) and moved it into the closed-items sentence (delivery-graph doc), mirroring QCLI-34's established pattern, while leaving the other 4 open items (event schema, locking primitive, merge/rebase strategy, storage engine) untouched. Reviewer independently re-verified the determination against primary sources (not just mechanics) and found no counter-evidence.
<!-- SECTION:FINAL_SUMMARY:END -->
