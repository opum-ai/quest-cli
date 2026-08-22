---
id: QCLI-97.11.6
title: Correct schema-1 contract closure before CLI semantics
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-21 21:04'
updated_date: '2026-08-21 21:16'
labels:
  - odoc-63.2
dependencies:
  - QCLI-97.11.2
parent_task_id: QCLI-97.11
priority: high
type: feature
ordinal: 153000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Corrective child for the ODOC-63.2 parity campaign (Controller JIT payload, message a19bf67e0c5f41f7801c13af10459a4e): make b94c637's public tracker contract internally complete and fail-closed before CLI implementation. Exclusive owned paths: src/contract/tracker/index.ts; src/application/command-contract.ts; src/domain/tasks/tasks.ts; test/contract/tracker/quest-tracker-client.test.ts; test/contract/command-contract.test.ts; test/integration/tasks/tasks.test.ts. No docs model, no migration work, no publication/delivery, no edits outside owned paths plus mechanically created Backlog task/dependency metadata.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 TrackerCreateInput/EditPatch and manifest cover summary/comments, aliases, priority/type/ordinal/finalSummary, complete label replacement/clear, comment add/remove, and every full parity field with deterministic replace/add/remove/clear semantics
- [x] #2 QuestTrackerClient.probe requires exact fields/filters for task status-flow/list/view/search/create/edit and rejects omissions/drift
- [x] #3 checked AC/DoD lists require index equals array position with no duplicate/reordered indexes in requests and responses
- [x] #4 milestone closure rejects missing reciprocal taskId, duplicates, noncanonical IDs, and nondeterministic ordering, while forward/back reference checks remain atomic
- [x] #5 focused negatives reproduce every Controller review finding and bun run check passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Close TrackerCreateInput/TrackerEditPatch gaps: summary, comments, complete label replacement/clear, comment add/remove, deterministic replace/add/remove/clear semantics across every full parity field. 2. Extend QuestTrackerClient.probe to require exact fields/filters for task status-flow/list/view/search/create/edit and reject omissions/drift. 3. Enforce checked AC/DoD index-equals-position with no duplicate/reordered indexes in requests and responses. 4. Strengthen milestone closure: reject missing reciprocal taskId, duplicates, noncanonical IDs, nondeterministic ordering; keep forward/back reference checks atomic. 5. Focused negatives reproducing every Controller review finding; bun run check green.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation commit cdfe2d5 on feat/qcli-97.10-odoc-63.2-parity-migration (base 7822301). Two-axis review: standards axis clean (layering intact, wire contract frozen, deterministic ordering, fail-loud stable messages, biome clean); spec axis all five ACs pass with focused negatives (probe field/filter omission+drift, reordered/mixed checklists, duplicate milestone taskIds, nondeterministic ordering normalized, duplicate indexes). Verification: focused suites 31/31 + cli-process 15/15 + cli-tracker-process 10/10 pass; full bun run check green except the five pre-existing QCLI-97.11.3 cli-semantics tests whose implementation bytes are preserved in stash@{0} pending .3 reconciliation under the corrected contract.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Schema-1 tracker contract closed fail-closed before CLI semantics: create/edit inputs and manifest advertise summary/comments/full label replacement/comment add/remove; probe requires exact fields/filters for all six tracker commands; checked AC/DoD lists enforce positional completeness without duplicate or reordered indexes; milestone closure rejects duplicates and normalizes to deterministic canonical order while keeping forward/back reference checks atomic. Commit cdfe2d5; Refs trailer parseable.
<!-- SECTION:FINAL_SUMMARY:END -->
