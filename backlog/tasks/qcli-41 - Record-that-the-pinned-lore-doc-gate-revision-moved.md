---
id: QCLI-41
title: Record that the pinned lore-doc gate revision moved
status: In Progress
assignee: []
created_date: '2026-08-07 01:06'
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
- [ ] #1 The evidence record states that the pinned lore-doc revision moved, names both revisions, and says what changed in the gate Spec
- [ ] #2 The note reports the gate result as unchanged and closed, quoting the owner's position rather than computing a result in this repository
- [ ] #3 The note does not re-run the evidence table, refresh the capsule, or discharge the recheck clause, and says so
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a dated trigger note above the recheck clause naming both lore-doc revisions and the superseded observations.
2. Confirm no gate result is computed locally and the recheck clause remains undischarged.
3. Run lore sync, validate --strict, check --strict, agents --check, git diff --check.
<!-- SECTION:PLAN:END -->
