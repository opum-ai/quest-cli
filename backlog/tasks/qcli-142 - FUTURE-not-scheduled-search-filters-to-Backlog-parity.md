---
id: QCLI-142
title: 'FUTURE (not scheduled): search filters to Backlog parity'
status: To Do
assignee: []
created_date: '2026-08-29 00:32'
labels:
  - cli
  - parity
  - future
dependencies:
  - QCLI-134
references:
  - src/cli/main.ts
priority: low
type: feature
ordinal: 174000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
NOT SCHEDULED. Filed to capture intent; the owner explicitly deferred shipping (2026-08-29).

Quest search offers --all. Backlog 1.50.1 offers --type, --task-type, --status, --exclude-status, --priority, --modified-file and --limit.

Downstream impact verified as none: Lore 0.3.4 consumes only backlog task list --json, task view --json and search --json with no filter flags. Its shipped 85MB binary contains zero references to --exclude-status, --unassigned, --ready, --sort, --modified-file or --task-type, and its README pins the coupling to those three commands with no --plain fallback.

Note the overlap with QCLI-139: task list is the primary filtering surface and gains the richer filter set there. Reassess whether search needs its own filters after QCLI-139 lands, since the two may substantially overlap. Quest also already has search --all spanning tasks, milestones and decisions, which Backlog has no answer for.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Before any implementation, confirm this is still wanted given what QCLI-139 delivered on task list.
- [ ] #2 If implemented: search accepts the Backlog filter set, filters compose, and the manifest filters list declares them.
<!-- AC:END -->
