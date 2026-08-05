---
id: QCLI-16
title: >-
  Audit and correct the licensing-source misattribution in the contracts and
  delivery graph
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 13:05'
labels:
  - campaign
  - 'cluster:synthesis'
  - correction
  - provenance
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-1
  - merge-pending
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: low
type: docs
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-2.8 settlement recorded a licensing-source misattribution in its own deliverable, described as not affecting the document conclusion, and left it as-is. It was never filed.

The licensing entry under Unresolved component decisions states that Backlog.md MIT licensing and npm registry metadata were admitted as naming-conflict and allocation evidence only, never as license guidance. Verify what the document actually attributes to which source, against the research source register slices that admit them, and correct any attribution the register does not support.

The conclusion - that product licensing is open and owner-held - is not in question and must not change. This is an attribution fix.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The attribution in question is identified precisely, quoting the document and the register slice that governs it
- [ ] #2 Any attribution the register does not support is corrected inline and dated, citing this task
- [ ] #3 The licensing decision status remains open and owner-held, unchanged by this task
- [ ] #4 If the audit finds the attribution is in fact correct, that finding is recorded with evidence rather than treated as no work
- [ ] #5 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read the licensing entry (item 1, 'Unresolved component decisions') in docs/reference/quest-cli-component-contracts-and-delivery-graph.md lines 568-579: it attributes BOTH 'Backlog.md's own MIT license' AND the '@opum-ai/lore/quest/quest-cli npm registry metadata' to the same two register slices ('npm package name occupancy' and 'lore-cli / the lore command'), framed as naming-conflict/allocation evidence only.
2. Verify against docs/reference/quest-cli-research-source-register.md (read-only): the npm-registry-metadata half of the claim is correct (both cited slices explicitly admit registry metadata, including license fields, as naming-conflict/allocation evidence). The Backlog.md-MIT-license half is NOT supported by either cited slice - Backlog.md is never named in either slice's Repository/URL or Permitted-use fields. Backlog.md's MIT license is instead discussed in two DIFFERENT register sections: 'Backlog.md implementation source and internal tests' (Excluded; MIT license cited only as rationale for an owner reclassification offer the owner declined - the retained constraint is authorship independence, not licensing) and 'Backlog.md public surface' (Allowed; MIT license cited only as rationale for why consuming published docs/output is ordinary user activity). Neither of those two frames it as naming-conflict/allocation evidence, and neither is the npm-occupancy or lore-cli slice.
3. Correct the contracts document's licensing entry inline: split the single conflated sentence into two accurate attributions, dated 2026-08-05 and citing QCLI-16, quoting the actual governing register slice names for each claim. Do not touch the register file (read-only per wave constraint) and do not change the 'open, owner-held' status/conclusion.
4. Run lore validate --strict, lore check, lore orphans; capture exact output.
5. Record findings and evidence via --append-notes; commit docs/ changes with Refs: QCLI-16 trailer; push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Audit result: the licensing entry (item 1, Unresolved component decisions) conflated two distinct claims under one attribution. The document said: 'Backlog.md's own MIT license and the @opum-ai/lore/quest/quest-cli npm registry metadata this campaign read were admitted only as naming-conflict and allocation evidence (register, npm package name occupancy and lore-cli / the lore command slices), never as license guidance.'

Verified against the register (read-only, not edited): the npm-registry-metadata half is CORRECT - both 'npm package name occupancy' (Permitted use: cite existence, version, license, claimed repository... as naming-conflict and allocation-constraint evidence for QCLI-2.9's package-allocation resolution) and 'lore-cli / the lore command' (Widened 2026-08-04 by QCLI-2.12: also cite @opum-ai/lore's ordinary registry metadata - license, claimed repository, maintainer identity... as package-naming-pattern and allocation evidence) explicitly admit registry metadata including license fields for exactly that purpose. This half is recorded correct, not just left alone.

The Backlog.md-MIT-license half was WRONG: Backlog.md is never named in either cited slice's Repository/URL or Permitted-use fields. Backlog.md's MIT license only appears in two OTHER register slices, both under the register's own 'Backlog.md' heading: 'Backlog.md implementation source and internal tests' (Excluded; permitted use none; MIT license cited only as rationale for a source-reading reclassification the owner was offered and declined - constraint is authorship independence, not licensing) and 'Backlog.md public surface' (Allowed; MIT license cited only as rationale for why consuming published docs/--help/command output is ordinary user/integrator activity, not implementation derivation). Neither frames the license as naming-conflict/allocation evidence.

Fix applied inline in docs/reference/quest-cli-component-contracts-and-delivery-graph.md, item 1 (Licensing), dated 2026-08-05 and citing QCLI-16: split the conflated sentence into two accurate attributions - Backlog.md's MIT license now correctly cited to its own two register slices with their actual (non-naming-conflict) rationale; the npm registry metadata claim preserved and re-confirmed against its two correct slices. The 'never admitted as license guidance for Quest's own choice' conclusion, and the open/owner-held status, are unchanged.

No register edits made (out of scope for this task per wave instruction; register is correct as written, no correction needed there).

Gate evidence (all zero, clean tree after commit): lore validate --strict -> 38 files, 0 errors, 0 warnings, 6 skipped. lore check -> 38 files, 0 errors, 0 warnings. lore orphans -> 0 orphan tasks, 0 dangling links.

Fix-pass finding 1 (notes-only, no doc edit — file is out of this task's scope): the same misattribution this task refutes survives, unrecorded, in a second document. docs/reference/quest-cli-open-component-decisions.md:92-96, D1 — License, reads: "No admitted source in the campaign records a chosen license for @opum-ai/quest; the charter and the component ADR are both silent. Backlog.md's MIT license and the npm registry metadata this campaign read were admitted as naming-conflict and allocation evidence only, never as license guidance. Permissive licensing elsewhere makes copying legally permissible, not provenance-clean — the two are separate tests and only the second binds this campaign." After this branch merges, this is a direct contradiction: docs/reference/quest-cli-component-contracts-and-delivery-graph.md (this task's corrected target) now correctly states the register does NOT support crediting Backlog.md's MIT license as naming-conflict/allocation evidence — that framing applies only to the npm registry metadata; Backlog.md's MIT license is instead governed by two different register slices ('Backlog.md implementation source and internal tests' and 'Backlog.md public surface'), neither framed as naming-conflict/allocation evidence. open-component-decisions.md D1 still asserts the conflated claim as fact. QCLI-17 owns open-component-decisions.md this wave, but its scope is a different section, not this D1 block — this contradiction needs routing/correction by a future pass.

Fix-pass finding 2 (notes-only, no doc edit): a findings-table row in the same file is now stale. docs/reference/quest-cli-open-component-decisions.md:219, in the 'Residual items recorded but never filed' table, reads: "A licensing-source misattribution in QCLI-2.8, not affecting its conclusion | QCLI-2.8 settlement | Minor citation defect". This row IS the item QCLI-16 has now audited, corrected, and filed/closed. After this branch merges, the table will still read as if the item is open and unfiled, which is now stale. Needs a future pass to update or remove the row — left unedited here per this task's file-scope constraint.

Fix-pass finding 3: replaces the prior bare 'register is correct, no correction needed' assertion with actual evidence, verified by reading docs/reference/quest-cli-research-source-register.md directly. The register does not need a pin correction because docs/reference/quest-cli-component-contracts-and-delivery-graph.md (QCLI-2.8's document) is SELF-PINNED, not SHA-pinned, as of QCLI-7's 2026-08-04 amendment: 'QCLI-2.8's document is therefore changed from the commit-pin QCLI-6 set (8935551, previously shared with QCLI-2.10) to a self-pin: pinned to its own current state on this branch, as amended live through this same edit or through any later commit in this same pass, read live 2026-08-04.' The register's running count confirms this and has been reaffirmed since without change: 'self-pinned members remain three (this register, the migration ledger, and QCLI-2.8's document, none touched by this task)'. Because the document is pinned to its own current state rather than to a fixed commit like 8935551, this task's inline correction to that document does not break or stale any register pin — there is nothing to re-verify. Register-owner judgment call flagged, not decided here: the self-pin carries a 'read live 2026-08-04' retrieval stamp, and the document is now amended 2026-08-05 by this task; whether that stamp needs refreshing is the register owner's call, not this task's.
<!-- SECTION:NOTES:END -->
