---
id: QCLI-64
title: >-
  Record the precedence ruling and reconcile the Specs' pre-activation
  prohibition
status: Done
assignee: []
created_date: '2026-08-09 13:49'
updated_date: '2026-08-09 13:51'
labels:
  - decisions
  - governance
dependencies: []
references:
  - CLAUDE.md
  - docs/specs/quest-cli-pre-implementation-research-program.md
  - docs/specs/quest-cli-delivery-roadmap.md
priority: high
type: docs
ordinal: 83000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-59 narrowed CLAUDE.md's pre-activation prohibition so product source, executable scaffolding, a package.json, a bin entry, and runtime dependencies became permitted, on the user's explicit authorization once QCLI-56's capsule established a verified Pass. CLAUDE.md named the resulting divergence and expressly declined to settle it: two Specs still read as an unconditional block, and which text a worker follows in the interim was left as an open precedence question for the owner.

The owner ruled on 2026-08-09: the instruction file is authoritative for permission to act, and the Specs are reconciled to match. The alternative would have silently revoked a permission the owner deliberately granted.

This task records that ruling and closes the divergence in the same pass, so no window exists in which the corpus contradicts itself.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A dated paragraph in CLAUDE.md records the 2026-08-09 precedence ruling, citing this task and QCLI-59 as the amendment whose divergence it settles
- [x] #2 The research programme Spec's 'Prohibited work before activation' list no longer states an unconditional prohibition on product source, runtime dependencies, and CLI or package scaffolding; the remaining prohibitions in that list are unchanged
- [x] #3 The delivery roadmap's Phases 2-5 statement and its Phase 2 entry no longer read as an unconditional pre-activation block on writing code
- [x] #4 Each amended passage is corrected in place rather than preserve-and-amended, because it asserts a live prohibition rather than recording a past observation, matching the reasoning QCLI-59 applied to CLAUDE.md's own bullet
- [x] #5 No prohibition beyond the pre-activation code block is weakened: publication, release workflows claiming readiness, public install instructions, and Phase 6 packaging remain prohibited exactly as they stand
- [x] #6 lore validate --strict and lore check both pass with zero errors and zero warnings
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Recorded the owner's 2026-08-09 precedence ruling and closed the divergence in one pass, so the corpus never holds the contradiction.

CLAUDE.md (15 insertions, 0 deletions): appended a dated ruling paragraph after QCLI-59's divergence paragraph rather than editing it. The divergence paragraph asserts what QCLI-59 did and did not decide — a record, not a live claim — so preserve-and-amend applies to it, matching the record-vs-current-assertion test this file defines. Followed QCLI-44/QCLI-45's precedent that a category rule about authority belongs in CLAUDE.md, where this repository's supersession rulings already live.

Scoped the ruling deliberately narrowly: CLAUDE.md governs permitted work only, not authority generally. A Spec remains the authority on what it uniquely owns (design, contracts, phase content). Recording the broad reading would have handed this file a power the owner did not grant.

Specs corrected in place, not preserve-and-amended (AC4): both passages assert a live prohibition rather than recording a past observation, so the same branch QCLI-59 applied to CLAUDE.md's own bullet applies here. Research programme Spec — the product-source bullet now records the 2026-08-08 lift and its precedence confirmation; the list's other five bullets are byte-unchanged (verified: 6 bullets before and after). Delivery roadmap — the Phases 2-5 statement and the Phase 2 entry both now record the lift and cite QCLI-56's capsule as the verified Pass it was conditional on.

AC5 verified by inspection, not assumption: 'package publication, release workflows that claim readiness, or public install instructions' survives verbatim in the research programme Spec, and the roadmap amendment explicitly restates that packaging is a Phase 6 matter and that publication and install instructions remain prohibited. Nothing beyond the pre-activation code block was weakened.

Verification: lore validate --strict and lore check both report 49 files, 0 errors, 0 warnings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Recorded the owner's 2026-08-09 precedence ruling in CLAUDE.md as an appended dated paragraph (15 insertions, 0 deletions, preserving QCLI-59's divergence record) and reconciled both Specs in the same pass so no contradictory window exists. Ruling scoped narrowly to permitted work, not general authority. Verified with lore validate --strict and lore check (49 files, 0 errors, 0 warnings each), and by confirming the research programme Spec's five other prohibition bullets and its publication ban survive unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
