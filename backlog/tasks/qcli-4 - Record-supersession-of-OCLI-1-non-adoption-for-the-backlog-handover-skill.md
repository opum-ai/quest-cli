---
id: QCLI-4
title: Record supersession of OCLI-1 non-adoption for the backlog-handover skill
status: Done
assignee: []
created_date: '2026-08-04 05:35'
updated_date: '2026-08-04 05:36'
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
- [x] #1 The ledger's OCLI-1 entry documents that its non-adoption disposition is superseded specifically for the backlog-handover skill, citing the owner's direction and the quest-cli commit/path that adopted it
- [x] #2 The original opum-doc OCLI-1 task record is left untouched: not renamed, not duplicated, not marked complete or reopened
- [x] #3 lore validate --strict and lore check --strict report zero errors and zero warnings after the edit
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Edit docs/reference/former-ocli-to-qcli-migration-ledger.md: change the OCLI-1 row to note the non-adoption call is superseded for the backlog-handover skill specifically, citing the owner's explicit direction and quest-cli commit 287c2b8 (.claude/skills/backlog-handover/). Add a short 'Superseded dispositions' note under Preservation rules pointing at this task. 2. Do not touch opum-doc's OCLI-1 record. 3. Run lore sync, lore validate --strict, lore check --strict. 4. Record notes/final summary, check ACs, mark Done.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Edited docs/reference/former-ocli-to-qcli-migration-ledger.md: OCLI-1 row now documents the non-adoption call is superseded for the backlog-handover skill only (cites owner's explicit direction, quest-cli path .claude/skills/backlog-handover/, commit 287c2b8); rest of OCLI-1 stays non-adopted. Added a Preservation-rules bullet requiring supersession notes to stay row-scoped, not a blanket flip. Verified opum-doc's OCLI-1 record untouched: 'git status --porcelain' in ~/repos/opum-doc is clean and the file's last commit is still f784693, predating this session's work. Ran 'lore sync' (2 files regenerated: docs/log.md, docs/stories/audit-quest-cli-documentation-authority.md), then 'lore validate --strict' and 'lore check --strict': both report 15 files, 0 errors, 0 warnings, exit 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reconciled the OCLI-to-QCLI migration ledger's OCLI-1 row to record an explicit, artifact-scoped supersession: the backlog-handover skill port (directed by the repo owner, committed at 287c2b8) overrides the prior blanket non-adoption call for that one artifact only. Added a Preservation-rules bullet formalizing that supersessions must be row-scoped and cite the directing task. opum-doc's OCLI-1 record is unchanged. lore validate --strict and lore check --strict both pass at 0 errors/0 warnings.
<!-- SECTION:FINAL_SUMMARY:END -->
