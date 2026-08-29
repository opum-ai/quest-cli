---
id: QCLI-142
title: 'FUTURE (not scheduled): search filters to Backlog parity'
status: Done
assignee: []
created_date: '2026-08-29 00:32'
updated_date: '2026-08-29 20:47'
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
- [x] #1 Before any implementation, confirm this is still wanted given what QCLI-139 delivered on task list.
- [ ] #2 If implemented: search accepts the Backlog filter set, filters compose, and the manifest filters list declares them.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OWNER DECISION 2026-08-29: closed as not needed. AC1 asked whether search still wants the Backlog filter set now that QCLI-139 has landed, and the answer is no.

QCLI-139 gave task list eleven filters - --ready, --exclude-status, --assignee, --unassigned, --milestone, --parent, --priority, --type, --search, --limit and --sort - so task list is the filtering surface. Duplicating that set onto search would spread the same capability across two commands whose distinctive value is different: search's is cross-record reach, and 'search --all' already spans tasks, milestones and decisions, which Backlog has no answer for at all.

Downstream impact remains none, as recorded when this was filed: Lore 0.3.4 consumes 'search --json' with no filter flags, and its shipped binary contains zero references to any of them.

AC2 is conditional on implementing and does not apply.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Closed without code. The owner answered AC1: search does not need its own copy of the Backlog filter set now that QCLI-139 has made task list the filtering surface. search keeps what Backlog cannot do - '--all' spanning tasks, milestones and decisions - rather than duplicating what task list now does better. No downstream consumer is affected; Lore uses search --json with no flags.
<!-- SECTION:FINAL_SUMMARY:END -->
