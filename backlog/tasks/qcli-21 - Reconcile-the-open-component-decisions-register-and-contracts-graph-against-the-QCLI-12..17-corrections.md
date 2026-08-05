---
id: QCLI-21
title: >-
  Reconcile the open component decisions register and contracts graph against
  the QCLI-12..17 corrections
status: To Do
assignee: []
created_date: '2026-08-05 14:36'
labels:
  - campaign
  - 'cluster:tracking-reconciliation'
  - correction
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: medium
type: docs
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Wave 1 (QCLI-12..QCLI-17) corrected six defects in the research corpus. Four of the six were tracked by rows in the open component decisions register's "Residual items recorded but never filed" table, and two more were audited without being closed -- but no wave task owned that table, so it still describes the pre-wave state. Two of those fixes also invalidated statements in sibling documents no wave task owned.

Concretely, on merged `dev`:

- `docs/reference/quest-cli-open-component-decisions.md:204-207` states the listed items "were never filed as tasks." Five of the ten were filed, as QCLI-12..QCLI-16.
- Rows at `:216` (QCLI-2.8 dependency order), `:218` (playbook backlink), `:220` (bin path in the Description column) are fully closed -- by QCLI-12 `1dd4aa6`, QCLI-13 `d871d32`, and QCLI-14 `077d3be` respectively.
- Row `:219` (licensing-source misattribution) is only half closed. QCLI-16 `44a7ed8` fixed it in the contracts and delivery graph; the same misattribution survives in this file's own D1 entry at `:93-95` ("Backlog.md's MIT license and the npm registry metadata this campaign read were admitted as naming-conflict and allocation evidence only"), directly contradicting the corrected authority text at `component-contracts-and-delivery-graph.md:577-589` -- which this file's preamble at `:28-31` names as authoritative over it. Striking the row without fixing D1 would delete the surviving defect's only tracking record.
- Rows `:217` (QCLI-2.12's F4/F5) and `:221` (untraceable Allowed value) remain genuinely open, but QCLI-15 `6b78fd0` audited both and re-characterized them. Their Source and Consequence cells no longer match what the register now records at `quest-cli-research-source-register.md:1064-1090` and `:1240-1274`.
- `docs/reference/quest-cli-component-contracts-and-delivery-graph.md:128-132` still asserts the Spec's Dependency order table "names only the six deliverables `QCLI-2.2`-`QCLI-2.7` ... not in the Spec's table." QCLI-12 made that false; the Spec's table at `:68` now names all ten.

All corrections are inline and dated per the repo's supersession convention. Nothing is silently rewritten.

Line numbers above are as observed by the wave-1 integration review immediately after merge; re-verify current line numbers before editing, since intervening commits may have shifted them slightly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The framing paragraph near open-component-decisions.md:204-207 is corrected to distinguish items still unfiled from items filed and closed in the QCLI-12..17 wave, citing the closing task and squash commit for each
- [ ] #2 The rows for the QCLI-2.8 dependency-order fix, the playbook backlink fix, and the packaging-contract bin-path fix are recorded as closed, each citing its closing task and commit (QCLI-12/1dd4aa6, QCLI-13/d871d32, QCLI-14/077d3be) and the file+location where the fix now lives -- not deleted without trace
- [ ] #3 The licensing-source-misattribution row is re-scoped, not struck: it records that QCLI-16 closed the contracts-graph instance and that the same misattribution survives in this file's D1 entry, remaining open until AC4 lands
- [ ] #4 D1 (License) is corrected to match component-contracts-and-delivery-graph.md's QCLI-16 correction: Backlog.md's MIT license is not admitted as naming-conflict/allocation evidence (it is discussed only under the register's "Backlog.md implementation source and internal tests" and "Backlog.md public surface" slices, on authorship-independence and ordinary-user-activity grounds); the npm registry metadata attribution is correct as stated. D1's Open status and owner are unchanged
- [ ] #5 The QCLI-2.12 F4/F5 row and the untraceable-Allowed-value row are updated to reflect QCLI-15's audit -- Source cites the audit, Consequence states the audited finding, and each names the closure condition QCLI-15 identified (for F4/F5, recovering the original reviewer text from an out-of-repo transcript if findable; for the Allowed value, an explicit owner ruling ratifying self-classification-by-vocabulary). Both remain listed as open
- [ ] #6 The QCLI-2.12 F4/F5 row carries a disambiguation note that QCLI-2.12's notes contain two independent F-numbering schemes, and that the wave-4 integration review's F4 (resolved via PR #17, c8dfdca) is a different item
- [ ] #7 component-contracts-and-delivery-graph.md's sentence asserting the Spec's Dependency order table names only six deliverables is corrected inline and dated: the Spec's table now names the full ten-item set as of QCLI-12 (1dd4aa6). The surrounding argument about what QCLI-2.8 synthesized is unchanged, and any separate "synthesis of six deliverables" claim elsewhere in the document is verified and left alone unless independently wrong
- [ ] #8 The garbled provenance clause in component-contracts-and-delivery-graph.md's QCLI-16 correction note (missing a word, reads as a grammar error) is repaired without altering the correction's substance, dating, or attribution
- [ ] #9 The remaining rows in the residual-items table (platform matrix, quest-doc actor model, Backlog.md browser HTTP endpoint, LCLI-316) are verified still accurate and left unchanged
- [ ] #10 docs/reference/quest-cli-research-source-register.md is not edited by this task
- [ ] #11 lore validate --strict, lore check, and lore orphans are all clean after the change
<!-- AC:END -->
