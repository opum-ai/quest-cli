---
id: QCLI-16
title: >-
  Audit and correct the licensing-source misattribution in the contracts and
  delivery graph
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 12:52'
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
