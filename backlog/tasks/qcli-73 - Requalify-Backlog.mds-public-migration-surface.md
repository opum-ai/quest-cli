---
id: QCLI-73
title: Requalify Backlog.md's public migration surface
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 01:22'
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
- [ ] #1 The installed and registry versions are recorded and any version after the current 1.50.1 observation is treated as a requalification trigger
- [ ] #2 Every task lifecycle folder, draft, milestone, document, decision, comment, relationship, custom prefix, zero padding, and duplicate-ID collision surface needed by migration is re-exercised
- [ ] #3 A field-by-field source-to-Quest disposition matrix identifies preserved fields, transformations, collisions, and explicit gaps
- [ ] #4 The source-read, current-state-only Git provenance, namespaced alias, and rollback contracts are updated without inheriting Backlog's ID grammar
- [ ] #5 All evidence is reproducible from documented public commands and disposable fixtures
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record the installed and current registry Backlog.md versions and identify the official public surfaces to requalify.
2. Exercise the documented migration-relevant lifecycle, metadata, collision, and output surfaces only in disposable fixtures; do not inspect implementation source or internal tests.
3. Reconcile the fidelity contract and adoption playbook with reproducible evidence, sync Lore, run strict documentation checks, and finalize with objective results.
<!-- SECTION:PLAN:END -->
