---
id: QCLI-65
title: Align the register's D2 phase-gating cell to the delivery roadmap
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-09 13:51'
updated_date: '2026-08-13 05:51'
labels:
  - docs
  - decisions
dependencies: []
references:
  - docs/reference/quest-cli-open-component-decisions.md
  - docs/specs/quest-cli-delivery-roadmap.md
modified_files:
  - docs/reference/quest-cli-open-component-decisions.md
priority: low
type: chore
ordinal: 84000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The open component decisions register's D2 'Needed for' cell reads 'Phases 2 and 6' while the delivery roadmap's phase table lists D2 against Phase 6 only. QCLI-61 recorded the disagreement as predating its wave and reserved resolution for an owner ruling on which record is authoritative.

The owner ruled on 2026-08-09: the roadmap's phase table is authoritative for phase gating, and the register is aligned to it.

This is documentation consistency, not a blocker. D2 was closed by QCLI-63, so it now gates nothing either way — which is why the ruling was taken at low priority rather than as an unblocking decision. Routine cleanup.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The register's D2 'Needed for' cell reads Phase 6 only, matching the delivery roadmap's phase table
- [x] #2 The change cites the 2026-08-09 owner ruling and notes that D2 is closed, so the correction alters no gating in practice
- [x] #3 The delivery roadmap is not amended; the register is the document that moves
- [x] #4 No other register row's Needed-for cell is changed
- [x] #5 lore validate --strict and lore check both pass with zero errors and zero warnings
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Treat docs/specs/quest-cli-delivery-roadmap.md as the controlling phase-gating record per the owner ruling already captured by QCLI-65, while preserving it byte-for-byte. 2. In docs/reference/quest-cli-open-component-decisions.md, change only D2's Needed for cell from Phases 2 and 6 to Phase 6 and append a dated QCLI-65 amendment to the D2 detail explaining the 2026-08-09 ruling and why closed D2 makes the correction operationally inert. 3. Prove scope with a targeted diff: no roadmap change and no other register Needed-for cell change. Run lore sync, lore validate --strict, lore check --strict, and git diff --check; record exact evidence and perform an adversarial self-review before finalization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the narrow register-only correction on local branch docs/qcli-65-d2-phase-gating from base 7aad686a6c44e948adccd59911b09fc7c47af148. Register line 82 changes only D2's Needed for value from Phases 2 and 6 to Phase 6. Lines 141-144 append a dated QCLI-65 amendment citing the owner's 2026-08-09 ruling, naming the roadmap as phase-gating authority, and stating that D2 was already closed by QCLI-63 so the correction changes no active gate or permission. Automated verification script passed four assertions: D2 = Phase 6; every other component-decision Needed for cell unchanged; delivery roadmap byte-identical to origin/dev; required ruling/no-active-gate explanation present. lore validate --strict reported 51 files, 0 errors, 0 warnings, 6 skipped; lore check --strict reported 51 files, 0 errors, 0 warnings; git diff --check passed. Lore sync committed the task/tracker dispatch state as 7613e78; its known self-referential QCLI-62 log-only entry was discarded per the active handover. Adversarial self-review (not independent) checked the full diff against all five ACs, preserved the historical statement about what QCLI-63 did not resolve, and found no roadmap, other-row, managed-block, or unrelated-document change. Delivery remains local and uncommitted because commit/push/PR authority has not been granted; task stays In Progress.
<!-- SECTION:NOTES:END -->
