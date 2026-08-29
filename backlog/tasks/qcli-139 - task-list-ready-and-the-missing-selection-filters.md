---
id: QCLI-139
title: task list --ready and the missing selection filters
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-29 00:32'
updated_date: '2026-08-29 12:54'
labels:
  - cli
  - parity
  - agent-workflow
dependencies:
  - QCLI-134
references:
  - src/cli/main.ts
  - src/domain/tasks/tasks.ts
priority: medium
type: feature
ordinal: 171000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Quest task list offers --status and --label. Backlog 1.50.1 adds --exclude-status, --assignee, --unassigned, --milestone, --parent, --priority, --type, --search, --ready, --limit and --sort.

QCLI-134 singles out --ready (dependency-unblocked) as the one an agent picking its next task actually needs: without it an agent must list everything, then resolve the dependency graph itself. Quest already computes readiness internally - src/domain/tasks/tasks.ts carries validateTaskGraph and a ReadinessReason type - so --ready is exposing an existing capability rather than building one.

Filed out of the QCLI-134 register with the owner deciding to implement (2026-08-29). Deliver --ready first; the remaining filters are ordinary selection and can follow.

Lore is not blocked by this: Lore 0.3.4 consumes only backlog task list --json, task view --json and search --json with no filter flags (verified against its shipped binary, zero references to any of these flags).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 task list --ready returns only tasks whose dependencies are all satisfied, using the same readiness rules the domain already enforces rather than a second implementation.
- [x] #2 The remaining filters land: --exclude-status, --assignee, --unassigned, --milestone, --parent, --priority, --type, --search, --limit, --sort.
- [x] #3 Filters compose (for example --ready with --label), and the manifest filters list for task list declares every one.
- [x] #4 Existing --status and --label behaviour is unchanged.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Arrived already implemented, not from a wave this session dispatched: a concurrent operator session in this shared checkout committed 681a4224 on branch quest/qcli-139-list-filters, based on dev @ e3019db. Local dev never diverged. This session's job is therefore validation and delivery, not implementation.

1. Confirm the commit is isolated: primary checkout is on quest/qcli-139-list-filters, clean; dev == origin/dev @ e3019db. Nothing to rescue or reset.
2. Run every gate against the exact tree: typecheck, lint, format:check, layer:check, bun test.
3. Independent review against the four acceptance criteria, with specific attention to (a) --ready delegating to the domain's evaluateReadySet rather than a second readiness implementation, (b) readiness computed over the FULL task set before other filters, since a filtered-out dependency would otherwise change the answer, (c) sort before limit, (d) --assignee/--unassigned mutual exclusion, and (e) every surface that publishes the task list filters staying in sync - command-contract.ts, command-help.ts, contract/tracker/index.ts whose required list probe() compares by exact sorted equality, contract/tracker/fixtures.ts, and their tests. That last one is the class of defect QCLI-138's review caught.
4. Fix whatever the review confirms, in the same branch.
5. Push, PR to dev, merge on green CI, settle, and return the primary checkout to dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Independent review of the inherited commit 681a4224 returned nine findings; all closed in 96a76e9.

- HIGH: --sort priority ranked alphabetically (high < low < medium), so the top N by priority was wrong, and a test had codified that as intended. Now ranks high/medium/low case-folded, unknown values last. Both sort tests gained a medium task - the value that makes rank and alphabet disagree - and were confirmed red without the fix.
- --priority/--type/--milestone were exact and case-sensitive against free-form authored strings: --priority high returned [] for a task authored High. All fold case now. --parent resolves through the same reference rules every other task lookup uses, so aliases and case variants work.
- --exclude-status and --type accept a comma-separated value as well as repetition, and --type is repeatable at all. A repeated --assignee is now a union, not an intersection.
- The --assignee/--unassigned exclusion moved into listFiltered, which claims to own the whole selection contract; the CLI-only guard left other callers with a silent empty list.
- listFiltered took two independent repository reads, so readiness could describe a different revision than the rows it selected. One snapshot now feeds both.
- AC1's real property - readiness over the full collection before filtering - had no discriminating test; the existing case used two already-ready tasks. Unit and process tests now filter out a dependency and assert its dependent is not ready.
- --sort createdAt/updatedAt removed: Quest never stores task timestamps (QCLI-137), so they were advertised no-ops.
- The inherited sqlite-projection change deleted a 16.9s teardown budget to satisfy local bun 1.2.23, but CI pins 1.3.14 and runs that file on six platforms including two Windows runners, where the 11.9s lock-retry window needs it; its comment claimed the budget was folded into per-test timeouts, which is untrue and does not cover hooks. Reworked to setDefaultTimeout, which covers hooks and works on both runtimes.

Validation on 96a76e9: bun test 337 pass / 0 fail, including the projection file that was red locally before this branch. typecheck, biome format:check and layer:check clean; the 2 remaining lint warnings are pre-existing in untouched files.

Note: bun run format is unusable in the primary checkout - a stale .treehouse/ directory holds nested biome.json roots and biome refuses to recurse. Formatting was run against the explicit paths format:check uses. That is QCLI-108.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
quest task list offered only --status and --label, so an agent picking its next task had to list everything and resolve the dependency graph itself.

Adds --ready plus --exclude-status, --assignee, --unassigned, --milestone, --parent, --priority, --type, --search, --limit and --sort, all composable with the existing two. --ready delegates to the domain's evaluateReadySet and --search to searchTasks, so neither rule is reimplemented. The whole selection contract lives in one TaskService.listFiltered, which the CLI feeds a parsed TaskListQuery; readiness is evaluated over the full collection before any filter, because a dependency excluded by --label must still count against its dependent, and sort precedes limit so --limit truncates the final ordering rather than the id ordering.

Implementation arrived from a concurrent operator session as commit 681a4224. This session validated it, reviewed it independently, and fixed nine findings in 96a76e9 - the significant one being that --sort priority ranked alphabetically, putting 'low' ahead of 'medium', with a test codifying that as intended.

Verified by test/cli-tracker-process.test.ts and test/contract/tracker/task-command.test.ts: every filter, composition, the readiness-before-filtering property, case folding, comma lists, union semantics, sort-then-limit, and the validation errors. The priority-rank and readiness tests were each confirmed red without their fix. Full suite on 96a76e9: 337 pass / 0 fail. typecheck, format:check and layer:check clean.
<!-- SECTION:FINAL_SUMMARY:END -->
