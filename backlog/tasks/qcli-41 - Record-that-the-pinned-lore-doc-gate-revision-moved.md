---
id: QCLI-41
title: Record that the pinned lore-doc gate revision moved
status: Done
assignee: []
created_date: '2026-08-07 01:06'
updated_date: '2026-08-07 01:07'
labels:
  - documentation
  - activation-gate
  - evidence
  - cross-repository
dependencies: []
documentation:
  - docs/reference/quest-cli-activation-gate-evidence-record.md
priority: medium
type: docs
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-11's activation-gate evidence record pinned lore-doc HEAD 45d0d90f68a6 as read 2026-08-05 and flagged it a moving reference to re-verify before relying. lore-doc has since advanced to d2a9a9e11ddf and rewrote the gate Spec's evidence section, superseding its 2026-08-01 observations as false. Record the changed input so no reader trusts the stale pin, without re-running or refreshing the QCLI-11 capsule.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The evidence record states that the pinned lore-doc revision moved, names both revisions, and says what changed in the gate Spec
- [x] #2 The note reports the gate result as unchanged and closed, quoting the owner's position rather than computing a result in this repository
- [x] #3 The note does not re-run the evidence table, refresh the capsule, or discharge the recheck clause, and says so
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a dated trigger note above the recheck clause naming both lore-doc revisions and the superseded observations.
2. Confirm no gate result is computed locally and the recheck clause remains undischarged.
3. Run lore sync, validate --strict, check --strict, agents --check, git diff --check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified: the note names both revisions (45d0d90f68a6 -> d2a9a9e11ddf) and states the gate Spec's evidence section was rewritten with its 2026-08-01 no-tag/0.0.0/E404 observations superseded as false (AC1). It reports the result as closed and attributes it to LDOC-4 still being To Do, explicitly framed as a quote of the owner's position rather than a locally computed result (AC2). It states it does not re-run the evidence table, refresh the capsule, or discharge the recheck clause, which remains immediately below it and unmodified (AC3). lore validate --strict and lore check --strict: 47 files, 0 errors, 0 warnings. lore agents --check exit 0. git diff --check clean. No command mutating lore-doc, lore-cli, or npm was run.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Recorded that the lore-doc revision pinned by QCLI-11 has moved and the gate Spec's evidence section changed, so no reader trusts the 45d0d90f68a6 pin as current. The gate result is unchanged and closed because LDOC-4 remains To Do. The note is a pointer to a changed input only: it does not re-run QCLI-11's evidence table, refresh its capsule, or discharge its recheck clause, preserving this repository's constraint that it never computes a gate result of its own. Verified with strict lore validation, check, agent bridge, and git diff --check.
<!-- SECTION:FINAL_SUMMARY:END -->
