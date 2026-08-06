---
id: QCLI-33
title: Reconcile architecture-Spec Open Questions bullet 4 against the QCLI-26 ADR
status: In Progress
assignee:
  - '@jeremy.newhouse'
created_date: '2026-08-06 10:48'
updated_date: '2026-08-06 14:54'
labels:
  - campaign
  - 'cluster:architecture-spec'
dependencies: []
references:
  - docs/specs/quest-cli-architecture.md
priority: medium
type: docs
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
quest-cli-architecture.md Open Questions bullet 4 (~line 263) still asks whether the projection port needs transactional semantics, framed as unsettleable "before the scale target (D5)". D5 is now closed — QCLI-31 closed it, citing the QCLI-26 ADR — and that same ADR already answers the question directly at its line 114 ("No durable transactional index is required to satisfy this scale target"). QCLI-31 deliberately left this passage untouched (its AC6 scope fence forbade touching it); this task picks up where it left off, same shape as QCLI-31: reconcile a Spec passage that reads as open against a Phase-1 ADR that has since settled it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Open Questions bullet 4 in docs/specs/quest-cli-architecture.md no longer frames the transactional-semantics question as unsettled pending D5
- [ ] #2 The passage cites the QCLI-26 ADR (rebuild-on-doubt ruling, ~line 114) as the resolution, consistent with how QCLI-31 cited the same ADR for the adjacent passage
- [ ] #3 No other Open Questions bullet or unrelated passage is modified
- [ ] #4 lore validate --strict passes with 0 errors and 0 warnings
- [ ] #5 lore check reports 0 errors
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirmed current state: Open Questions bullet 4 in docs/specs/quest-cli-architecture.md is at lines 263-265, reading 'Does the projection port need transactional semantics, or is rebuild-on-doubt sufficient? This trades implementation complexity against rebuild cost and cannot be settled before the scale target (D5).' The QCLI-26 ADR (docs/adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md) closes D5 and, at its Consequences section line 114, states directly: 'No durable transactional index is required to satisfy this scale target. Rebuild-on-doubt, invoked through the documented forced-full-rebuild escape hatch (FR-PROJ-5, BB-08), stays the projection's primary recovery mechanism.'
2. Match QCLI-31's precedent citation style for the adjacent Open Questions bullet (anomaly placement, ~line 251-256): bold 'is resolved' framing sentence, restate the original tradeoff in past tense, then an inline markdown link to the ADR file with the QCLI ID in backticks, then a direct quote/paraphrase of the ADR's resolving text.
3. Edit only bullet 4 (lines 263-265) in docs/specs/quest-cli-architecture.md: replace the unsettled framing with a resolved framing citing the QCLI-26 ADR and its rebuild-on-doubt conclusion. Leave every other Open Questions bullet and all other passages in the file byte-for-byte unchanged.
4. Run 'lore validate --strict' and 'lore check' to confirm 0 errors/0 warnings; re-diff to confirm only bullet 4 changed.
5. Record notes, commit with a 'Refs: QCLI-33' trailer, push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented. Edited docs/specs/quest-cli-architecture.md's Open Questions bullet 4 only (lines 263-265 -> now 263-270), via direct prose edit (file has no lore-managed <!-- lore:tasks:begin/end --> blocks, so no lore CLI subcommand applies here, matching QCLI-31's precedent).

Change: replaced 'Does the projection port need transactional semantics, or is rebuild-on-doubt sufficient? This trades implementation complexity against rebuild cost and cannot be settled before the scale target (D5).' with a resolved framing matching the adjacent bullet's citation style (anomaly placement, ~line 251-256): bold '...is resolved.' lead sentence, restated tradeoff in past tense, then an inline link to docs/adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md (QCLI-26) with a direct paraphrase of its Consequences-section line 114 ruling ('No durable transactional index is required to satisfy this scale target... rebuild-on-doubt... stays the projection's primary recovery mechanism').

Verification: 'lore validate --strict' -> 47 files, 0 errors, 0 warnings, 6 skipped (exit 0). 'lore check' -> 47 files, 0 errors, 0 warnings (exit 0). git diff confirms only docs/specs/quest-cli-architecture.md changed, and only bullet 4 within it — no other Open Questions bullet or passage touched.

Out-of-scope findings: none. Read the full Open Questions list and the QCLI-26 ADR end to end; no other drift observed beyond what QCLI-33 was scoped to fix.
<!-- SECTION:NOTES:END -->
