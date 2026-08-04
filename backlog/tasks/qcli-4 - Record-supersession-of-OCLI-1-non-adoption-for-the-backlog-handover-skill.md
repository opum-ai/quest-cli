---
id: QCLI-4
title: Record supersession of OCLI-1 non-adoption for the backlog-handover skill
status: In Progress
assignee: []
created_date: '2026-08-04 05:35'
updated_date: '2026-08-04 05:35'
labels:
  - 'doc:stories/audit-quest-cli-documentation-authority'
dependencies: []
references:
  - docs/reference/former-ocli-to-qcli-migration-ledger.md
  - >-
    ../opum-doc/backlog/tasks/ocli-1 -
    Adopt-backlog-handover-skill-adapted-to-Backlog.md.md
documentation:
  - docs/stories/audit-quest-cli-documentation-authority.md
priority: high
type: docs
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The former-OCLI-to-QCLI migration ledger (docs/reference/former-ocli-to-qcli-migration-ledger.md) records OCLI-1 (the opum-doc backlog-handover campaign-driver skill task) as explicit non-adoption because it is repository setup history. The repository owner separately and explicitly directed porting that exact skill into quest-cli (.claude/skills/backlog-handover/), which is now committed on this repo's main/dev history. This conflicts with the ledger's recorded disposition. Per the ledger's own preservation rules ('If old research conflicts with current quest-doc, record a supersession decision; never silently blend the two'), reconcile the record: document that the non-adoption call for OCLI-1 is superseded for this specific artifact, who directed it and why, without altering, renaming, duplicating, or completing the original OCLI-1 record in opum-doc.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The ledger's OCLI-1 entry documents that its non-adoption disposition is superseded specifically for the backlog-handover skill, citing the owner's direction and the quest-cli commit/path that adopted it
- [ ] #2 The original opum-doc OCLI-1 task record is left untouched: not renamed, not duplicated, not marked complete or reopened
- [ ] #3 lore validate --strict and lore check --strict report zero errors and zero warnings after the edit
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Edit docs/reference/former-ocli-to-qcli-migration-ledger.md: change the OCLI-1 row to note the non-adoption call is superseded for the backlog-handover skill specifically, citing the owner's explicit direction and quest-cli commit 287c2b8 (.claude/skills/backlog-handover/). Add a short 'Superseded dispositions' note under Preservation rules pointing at this task. 2. Do not touch opum-doc's OCLI-1 record. 3. Run lore sync, lore validate --strict, lore check --strict. 4. Record notes/final summary, check ACs, mark Done.
<!-- SECTION:PLAN:END -->
