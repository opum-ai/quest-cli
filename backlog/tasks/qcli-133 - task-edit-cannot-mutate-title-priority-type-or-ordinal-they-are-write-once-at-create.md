---
id: QCLI-133
title: >-
  task edit cannot mutate title, priority, type or ordinal: they are write-once
  at create
status: To Do
assignee: []
created_date: '2026-08-28 21:31'
labels:
  - parity
  - task-edit
  - e2e
dependencies: []
priority: high
type: bug
ordinal: 165000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A Quest task's title can never be changed after it is created. Nor can its priority, type or ordinal.

'quest task create' accepts --priority, --type and --ordinal, and takes the title as its positional argument. 'quest task edit' accepts none of the four. There is no rename path at all.

The shipped 0.2.9 manifest is unambiguous — 'quest manifest --json', command 'task edit', fields:

  acceptanceCriteria, addAssignees, addComments, addDependencies, addLabels,
  addModifiedFiles, addNotes, addPlan, addReferences, clearMilestone, clearParent,
  comments, definitionOfDone, description, documentation, implementationNotes,
  labels, milestoneId, parentId, plan, removeAssignees, removeComments,
  removeDependencies, removeLabels, removeModifiedFiles, removeNotes, removePlan,
  removeReferences, status, summary

No title. No priority. No type. No ordinal. 'task edit-batch' declares the identical field list, so the batch path cannot work around it either.

Reproduction (quest 0.2.9):

  quest task create "T" --actor h --actor-kind human --json
  quest task edit T-1 --title X    --actor h --actor-kind human --json   # exit 2 usage
  quest task edit T-1 --priority X --actor h --actor-kind human --json   # exit 2 usage
  quest task edit T-1 --type X     --actor h --actor-kind human --json   # exit 2 usage
  quest task edit T-1 --ordinal 10 --actor h --actor-kind human --json   # exit 2 usage
  # {"error_type":"usage","message":"task edit received invalid arguments."}

Backlog.md 1.50.1 supports all four on edit: 'backlog task edit <id> -t <title>', --priority, --type, --ordinal. A task created with a typo in Backlog is fixable; in Quest it is permanent, and the only remedy is to create a replacement record and lose the id.

This contradicts QCLI-97.10, which is marked Done. AC#2 claims the CLI covers 'priority/type/ordinal/dates', and AC#3 claims edit semantics 'include replace/add/remove/clear'. The projection may carry the fields, but the CLI cannot mutate them, so the acceptance criteria are not satisfied by what shipped.

Related but separate, and deliberately not folded in here: Backlog's incremental acceptance-criteria checkbox operations (--check-ac, --uncheck-ac, --remove-ac, --clear-ac and the DoD equivalents) have no Quest counterpart. Quest can express a checked criterion only by wholesale-replacing the whole array via --acceptance-criteria '[{"index":0,"text":"...","checked":true}]', which is read-modify-write and races under concurrent editors. Filed in the parity register issue.

Evidence: opum-cli-e2e baselines/v0.2.9, surface parity/backlog, rows 'declared gap: quest has no task edit --title|--priority|--type|--ordinal'. Suite: suites/45-parity-backlog.mjs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 quest task edit accepts --title and the edited title is persisted and returned by task view, with the task id and every other field unchanged
- [ ] #2 quest task edit accepts --priority, --type and --ordinal, each validated against the same vocabulary task create enforces
- [ ] #3 task edit-batch accepts the same four fields, and the manifest field lists for task edit and task edit-batch both declare them so the surface stays machine-discoverable
- [ ] #4 QCLI-97.10 AC#2 and AC#3 are re-verified against the shipped CLI rather than the projection, and either pass or are reopened with the shortfall recorded
<!-- AC:END -->
