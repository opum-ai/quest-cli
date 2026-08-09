---
id: QCLI-65
title: Align the register's D2 phase-gating cell to the delivery roadmap
status: To Do
assignee: []
created_date: '2026-08-09 13:51'
labels:
  - docs
  - decisions
dependencies: []
references:
  - docs/reference/quest-cli-open-component-decisions.md
  - docs/specs/quest-cli-delivery-roadmap.md
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
- [ ] #1 The register's D2 'Needed for' cell reads Phase 6 only, matching the delivery roadmap's phase table
- [ ] #2 The change cites the 2026-08-09 owner ruling and notes that D2 is closed, so the correction alters no gating in practice
- [ ] #3 The delivery roadmap is not amended; the register is the document that moves
- [ ] #4 No other register row's Needed-for cell is changed
- [ ] #5 lore validate --strict and lore check both pass with zero errors and zero warnings
<!-- AC:END -->
