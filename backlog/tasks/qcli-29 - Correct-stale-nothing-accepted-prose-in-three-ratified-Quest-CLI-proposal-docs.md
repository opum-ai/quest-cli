---
id: QCLI-29
title: >-
  Correct stale 'nothing accepted' prose in three ratified Quest CLI proposal
  docs
status: Done
assignee:
  - '@claude'
created_date: '2026-08-06 00:29'
updated_date: '2026-08-14 12:17'
labels:
  - campaign
  - 'cluster:proposal-docs'
  - wave-1
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
dependencies: []
references:
  - >-
    docs/reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md
  - >-
    docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md
  - docs/reference/quest-cli-scale-target-proposal.md
documentation:
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
priority: medium
type: docs
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Phase-1-ratification campaign (QCLI-24..28) produced ADRs for the CLI result contract, canonical identifier grammar, and scale target. The three proposal reference docs that originally raised those questions still carry their pre-ratification 'nothing accepted' framing, now stale and unpointed to the ADR that closed each one. Proposed by QCLI-25's reviewer during wave 1 of the Phase-1-ratification campaign (recorded in backlog/docs/campaigns/doc-4). Follow the repo's existing inline-supersession convention (dated note, citing the directing ADR) rather than rewriting the original proposal prose.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md carries a dated inline note pointing to the ADR that ratified it (from QCLI-24), leaving the original proposal prose intact below the note
- [x] #2 docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md carries a dated inline note pointing to the ADR that ratified it (from QCLI-25), leaving the original proposal prose intact below the note
- [x] #3 docs/reference/quest-cli-scale-target-proposal.md carries a dated inline note pointing to the ADR that ratified it (from QCLI-26), leaving the original proposal prose intact below the note
- [x] #4 lore validate --strict passes
- [x] #5 No content changes are made to the three documents beyond the three inline supersession notes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirmed ADR mapping via QCLI-24/25/26 task records and docs/adr/ files: QCLI-24 -> docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md; QCLI-25 -> docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md; QCLI-26 -> docs/adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md.
2. Located this repo's inline-supersession convention precedent (use-quest-cli-for-the-quest-package-and-command.md's QCLI-5 amendment; QCLI-7/QCLI-8/QCLI-9 register/playbook/contracts-graph fixes; term itself defined in stories/follow-through-on-the-quest-cli-design-layer.md and research-source-register.md): a bold dated lead paragraph (e.g. '**Resolved DATE.**' / '**Amendment - DATE (TASK-ID).**') appended immediately after the specific stale passage, original text preserved verbatim and unmoved.
3. For each of the 3 docs, insert one new paragraph immediately after the paragraph containing its 'nothing accepted' framing sentence ('This document decides nothing.' / 'Nothing in this document is accepted.' / 'This document proposes; it does not decide.'), reading '**Ratified - 2026-08-05 (`QCLI-2N`).**' and linking the corresponding accepted ADR by relative path, noting the stale framing above no longer holds and that the original text is preserved per the inline-supersession convention. No other line in any of the 3 docs changes.
4. Verify: lore validate --strict; git diff each file to confirm only the new paragraph was added (no other lines touched).
5. Record notes, commit with Refs: QCLI-29, push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cited ADRs (confirmed via QCLI-24/25/26 task records + docs/adr/ files): QCLI-24 -> docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md; QCLI-25 -> docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md; QCLI-26 -> docs/adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md.

Added one dated '**Ratified — 2026-08-05 (`QCLI-2N`).**' paragraph to each of the 3 proposal docs, inserted immediately after the paragraph carrying that doc's pre-ratification 'nothing accepted' framing sentence, linking the corresponding accepted ADR and noting the original framing is preserved unedited below/around it. Matched this repo's existing inline-supersession convention precedent (bold dated-lead paragraph appended next to the stale passage, original text preserved verbatim) as seen in docs/adr/use-quest-cli-for-the-quest-package-and-command.md's QCLI-5 amendment and the QCLI-7/QCLI-8/QCLI-9 register/playbook/contracts-graph fixes; did not invent a new format.

Verification: git diff on all 3 files shows only the new paragraph added in each, no other line touched (AC5). 'lore validate --strict' run for real: 47 files, 0 errors, 0 warnings, 6 skipped, exit 0 (AC4).

Did not run lore sync — not required (no ADR/register/index edits, no Story task-coupling changes) and none of the touched files are lore-managed index files.

No out-of-scope findings.

Verified by reviewer: all 5 ACs independently confirmed. ADR attribution checked bidirectionally against docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md, docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md, and docs/adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md. lore validate --strict re-run clean (47 files, 0 errors, 0 warnings, 6 skipped). Diff is pure-addition (git diff --numstat shows zero deletions under docs/), scope-clean. Convention matched against real precedent (QCLI-5 amendment style, research-source-register wording). Merged as 6ffc401 (PR #45, squash).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a dated inline supersession note to each of the three Phase-1 proposal docs (result-contract, canonical identifier grammar, scale target), pointing to the ADR that ratified it (QCLI-24/25/26 respectively). Original proposal prose preserved verbatim below each note, per this repo's existing inline-supersession convention. lore validate --strict passes.
<!-- SECTION:FINAL_SUMMARY:END -->
