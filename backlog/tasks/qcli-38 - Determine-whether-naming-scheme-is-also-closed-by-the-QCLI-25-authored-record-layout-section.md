---
id: QCLI-38
title: >-
  Determine whether 'naming scheme' is also closed by the QCLI-25
  authored-record-layout section
status: To Do
assignee: []
created_date: '2026-08-06 16:54'
updated_date: '2026-08-06 18:09'
labels:
  - campaign
  - 'cluster:naming-scheme-reconciliation'
dependencies: []
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-34 closed 'file layout' as the same concept as QCLI-25/D4's 'authored-record layout'. Both the QCLI-34 worker and its reviewer independently flagged that 'naming scheme' — a sibling open item in the same open-item list(s) file layout was closed from — is plausibly also settled by the same QCLI-25 section: QCLI-25's authored-record-layout text includes 'filename anchored on the canonical id in fixed case...', which is literally a naming-scheme decision. QCLI-34 deliberately left this untouched as out of its own stated scope. This task makes the same-concept-vs-distinct determination for 'naming scheme' that QCLI-34 made for 'file layout', and reconciles the open-item listing(s) accordingly, in the same two documents QCLI-34 touched (docs/reference/quest-cli-open-component-decisions.md and docs/reference/quest-cli-component-contracts-and-delivery-graph.md). Surfaced as a proposed follow-up in doc-7 (QCLI-33/34/35 campaign, wave 1) and approved for filing by the user on 2026-08-06.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The QCLI-25 ADR and register D4 are read closely enough to state definitively whether 'naming scheme' denotes the same on-disk-structure decision QCLI-25/D4 already settled, or is genuinely distinct
- [ ] #2 If the same concept: the 'naming scheme' open-item listing(s) are updated to reflect that this item is settled, using terminology consistent with QCLI-25
- [ ] #3 If genuinely distinct: the listing(s) retain 'naming scheme' as open but gain a one-line clarifying note distinguishing it from the QCLI-25/D4 decision
- [ ] #4 No other row or item in either table is modified
- [ ] #5 lore validate --strict passes with 0 errors and 0 warnings
- [ ] #6 lore check reports 0 errors
<!-- AC:END -->
