---
id: QCLI-73
title: Requalify Backlog.md's public migration surface
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 01:24'
labels:
  - quest-0.1
  - 'wave:contracts'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-72
documentation:
  - docs/reference/quest-cli-backlog-migration-fidelity-contract.md
  - docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - docs/reference/quest-cli-backlog-migration-fidelity-contract.md
  - docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md
  - test/fixtures/backlog/
priority: high
type: spike
ordinal: 91000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Re-run the clean-room Backlog.md public-contract qualification against the installed and latest published release before the task/event schema is implemented. Use only published documentation, command help, public command output, and artifacts produced in disposable repositories; Backlog.md implementation source and internal tests remain excluded.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The installed and registry versions are recorded and any version after the current 1.50.1 observation is treated as a requalification trigger
- [x] #2 Every task lifecycle folder, draft, milestone, document, decision, comment, relationship, custom prefix, zero padding, and duplicate-ID collision surface needed by migration is re-exercised
- [x] #3 A field-by-field source-to-Quest disposition matrix identifies preserved fields, transformations, collisions, and explicit gaps
- [x] #4 The source-read, current-state-only Git provenance, namespaced alias, and rollback contracts are updated without inheriting Backlog's ID grammar
- [x] #5 All evidence is reproducible from documented public commands and disposable fixtures
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record the installed and current registry Backlog.md versions and identify the official public surfaces to requalify.
2. Exercise the documented migration-relevant lifecycle, metadata, collision, and output surfaces only in disposable fixtures; do not inspect implementation source or internal tests.
3. Reconcile the fidelity contract and adoption playbook with reproducible evidence, sync Lore, run strict documentation checks, and finalize with objective results.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-15 requalification: installed and npm latest Backlog.md are both 1.50.1 (registry modified 2026-08-10T07:49:40.987Z). Exercised only public CLI/help/output in disposable fixture /private/tmp/qcli-73-backlog-DhZ690: custom letters-only prefix and zero padding, task create/edit/comment/dependency/archive/complete, parent/subtask, drafts, milestones, documents, decisions, JSON list/view, and doctor. The initial numeric-prefix fixture setup was rejected by the documented letters-only constraint; rerunning with Q succeeded. No implementation source or internal tests were inspected.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Requalified the Backlog.md migration public contract at v1.50.1. Updated the fidelity contract and adoption playbook with reproducible disposable-fixture evidence while preserving clean-room, current-state-only, namespaced/provenance identity, one-way, and rollback requirements.
<!-- SECTION:FINAL_SUMMARY:END -->
