---
id: QCLI-17
title: >-
  Correct the open component decisions register's Backlog.md
  reclassification-trigger claim
status: Done
assignee:
  - '@claude'
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 13:54'
labels:
  - campaign
  - 'cluster:migration'
  - correction
  - register
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-1
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: high
type: docs
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The open component decisions register, added by QCLI-10.1 on 2026-08-05, carries a section headed "A reclassification trigger that has probably fired". It asserts that the migration fidelity contract pin to Backlog.md v1.49.3 is likely stale because nobody has re-checked it.

That inference is wrong, and was checked the same day it was written. Live registry state on 2026-08-05: npm view backlog.md version returns 1.49.3, dist-tags.latest is 1.49.3, and time.modified is 2026-08-03. The pinned version IS the current published release. The trigger has not fired.

This matters beyond the wording: the section currently tells a reader that every FR-MIG requirement rests on a possibly outdated enumeration and implies re-running that enumeration is Phase 1 work. Both follow from the false premise.

Correct the section to record the verified current state as a dated moving reference with its literal command, keep the recheck obligation itself (which remains real and unchanged), and fix any downstream statement in the same document that inherited the false premise. Check the delivery roadmap and the functional requirements Spec for the same inherited claim.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The register records the verified 2026-08-05 registry state as a dated moving reference with the literal command that produced it
- [x] #2 The claim that the trigger has probably fired is removed, and the standing obligation to re-check before anything freezes is retained
- [x] #3 Any statement in the delivery roadmap or the functional requirements Spec that inherited the false premise is identified and corrected, or confirmed absent
- [x] #4 The correction is recorded inline and dated, citing this task, rather than silently rewritten
- [x] #5 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Live-verify backlog.md npm registry state (npm view backlog.md version / dist-tags.latest / time.modified).
2. Rewrite the register's 'A reclassification trigger that has probably fired' section in docs/reference/quest-cli-open-component-decisions.md: rename heading to reflect verified non-fired status, replace the single npm view command with the three literal commands used, record the dated 2026-08-05 verified result, remove the false 'probably fired' claim and the 'Re-running the enumeration is Phase 1 work' inference, keep the standing recheck-before-freeze obligation, and add an inline dated correction citing QCLI-17.
3. Grep docs/specs/quest-cli-delivery-roadmap.md and docs/specs/quest-cli-functional-requirements.md for inherited claims tied to the v1.49.3 pin.
4. Found delivery-roadmap.md Phase 1 Exit text calling the re-verification 'overdue' (inheriting the same false premise) - correct it with an inline dated QCLI-17 correction, keep the standing obligation. functional-requirements.md's Open Questions bullet on the version pin is neutral (states the recheck obligation, no staleness claim) - confirmed absent, no edit.
5. Run lore validate --strict, lore check, lore orphans; record exact output.
6. Append notes to QCLI-17 with npm verification results, files touched, and gate output.
7. Commit docs changes with Refs: QCLI-17 trailer; push branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Live npm verification (2026-08-05): npm view backlog.md version -> 1.49.3; npm view backlog.md dist-tags.latest -> 1.49.3; npm view backlog.md time.modified -> 2026-08-03T21:30:58.510Z. Confirms the pinned v1.49.3 IS the current published release; the reclassification trigger has not fired. Matches the description's stated numbers exactly.

Edits:
- docs/reference/quest-cli-open-component-decisions.md: renamed the section from 'A reclassification trigger that has probably fired' to 'The Backlog.md version-pin trigger - not fired (verified 2026-08-05)'. Replaced the single npm view command with the three literal commands used. Recorded the verified 2026-08-05 state as a dated moving reference. Removed the false 'probably fired' claim and the 'Re-running the enumeration is Phase 1 work' inference. Retained the standing recheck-before-freeze obligation, restated to re-run the same three commands. Added an inline blockquoted correction dated 2026-08-05 citing QCLI-17.
- docs/specs/quest-cli-delivery-roadmap.md: Phase 1 Exit text called the re-verification 'overdue' and listed it as pending Phase 1 catch-up work - same inherited false premise. Corrected to 'one standing re-verification obligation' with an inline dated QCLI-17 correction pointing to the register's verified state; the obligation to re-check before Phase 1 exit or any freeze is unchanged.
- docs/specs/quest-cli-functional-requirements.md: checked the Open Questions bullet on the Backlog.md version pin (line ~305-306). It only states the recheck-clause obligation neutrally, with no staleness/probability claim - confirmed the false premise is ABSENT there. No edit made.

Gate output (from worktree root, after lore sync reconciled the story's status-drift from the task's in-progress transition):
- lore validate --strict: 38 files, 0 errors, 0 warnings, 6 skipped
- lore check: 38 files, 0 errors, 0 warnings
- lore orphans: 0 orphan tasks, 0 dangling links

Commits: e78b95a (docs, Refs: QCLI-17) on fix/qcli-17-register-backlog-trigger-correction; c9af665 is lore sync's auto-commit of backlog/ (task status/plan/notes edits), created before the docs commit.

No out-of-scope findings beyond what's already covered by other QCLI-1x tasks in this campaign.

Verified by independent reviewer (2 rounds): AC1 confirmed — reviewer independently ran npm view backlog.md version/dist-tags.latest/time.modified and matched the recorded dated moving reference byte-for-byte. AC2 confirmed — 'probably fired' claim removed, standing recheck obligation retained. AC3 confirmed — delivery roadmap's inherited 'overdue' framing corrected; functional requirements Spec independently confirmed to carry no inherited claim (neutral, recheck-obligation-only language). AC4 confirmed inline/dated/cited correction. AC5 confirmed: lore validate --strict 38/0/0/6 skipped; lore check 38/0/0; lore orphans 0/0 (re-run after rebase, still green). Reviewer's request_changes round caught that the rewritten standing-obligation sentence contradicted the migration fidelity contract's own recheck clause (contract obliges re-verification before reliance; the rewrite forbade re-running unprompted) — corrected to align both documents' next-action guidance, re-verified against the contract's own text. Merged to dev via PR #30, squash commit fb8e8e3c9d8cabab4b366d9382cd54e9dd6ae171.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Corrected a false claim the design layer introduced hours earlier: that the Backlog.md v1.49.3 pin's reclassification trigger 'has probably fired.' Live registry verification (npm view backlog.md version/dist-tags.latest/time.modified, all matching on 2026-08-05) confirms the pin is current — the trigger has not fired. Recorded the verified state as a dated moving reference, removed the false claim while retaining the standing recheck-before-freeze obligation, and fixed the same inherited framing in the delivery roadmap; confirmed the functional requirements Spec had not inherited it. Reviewer caught that the rewritten obligation sentence initially contradicted the migration fidelity contract's own recheck clause (the contract obliges re-verification before reliance; the first rewrite forbade it) — corrected so both documents give consistent next-action guidance on a future version bump. All 5 ACs independently confirmed across two review rounds. Merged to dev via PR #30 (squash fb8e8e3) — the sixth and final task of wave 1.
<!-- SECTION:FINAL_SUMMARY:END -->
