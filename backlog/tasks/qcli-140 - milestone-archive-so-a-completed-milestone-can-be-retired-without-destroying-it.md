---
id: QCLI-140
title: >-
  milestone archive, so a completed milestone can be retired without destroying
  it
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-29 00:32'
updated_date: '2026-08-29 13:17'
labels:
  - cli
  - parity
  - data-integrity
dependencies:
  - QCLI-134
references:
  - src/cli/main.ts
priority: medium
type: feature
ordinal: 172000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Quest offers only milestone delete. Retiring a finished milestone therefore destroys its record, including its task references.

Backlog 1.50.1 has milestone archive <name>. Quest already treats archive-not-delete as the normal retirement path everywhere else - task archive and draft archive both exist and are in the manifest - so milestones are the inconsistent case rather than a deliberate design.

Filed out of the QCLI-134 register with the owner deciding to implement (2026-08-29). Lore does not consume milestone commands at all (verified against its shipped binary).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 quest milestone archive <id> retires a milestone while preserving its record and its task references, mirroring task archive and draft archive.
- [x] #2 An archived milestone is excluded from milestone list by default and remains retrievable, consistent with how archived tasks and drafts behave.
- [x] #3 The manifest declares the command, and milestone delete keeps its existing destructive behaviour for callers that genuinely want it.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Milestones are not stored per-file the way drafts are - PlanningService reads and writes one {milestones, decisions} record - so archiving is a field on the Milestone, not a filesystem move like archiveDraft. The draft pattern to mirror is its CLI and list semantics, not its storage.

1. Domain (src/domain/planning/planning.ts): add optional 'archived' to the Milestone interface and milestoneSchema. Boolean, not a timestamp: Quest stores no timestamps (QCLI-137). Keep it orthogonal to status, since Backlog's milestone archive retires a milestone regardless of open/closed.
2. Application (src/application/planning/planning.ts): add archiveMilestone(id, operationId) mirroring deleteMilestone's shape - not_found when absent, milestone_lifecycle_already_at_destination when already archived, matching archiveDraft's error - but writing the record back with archived: true instead of filtering it out. Unlike delete it must NOT reject a milestone that still has taskIds; preserving those references is the whole point of AC1.
3. listMilestones(includeArchived = false) filters archived out by default, mirroring listDrafts.
4. CLI (src/cli/main.ts): 'milestone archive <id>' with an actor, in the shared milestone/decision branch; add 'archive' to the action list that consumes rest[0], and --include-archived to the milestone list only() allowlist. Decisions get neither - AC scope is milestones.
5. Manifest: declare 'milestone archive' with kind milestone.archived in command-contract.ts, add the include-archived filter to milestone list, and mirror both in command-help.ts. Check whether contract/tracker publishes milestone commands - it did not for task edit filters, but verify rather than assume; that drift class is what QCLI-138's and QCLI-139's reviews both caught.
6. Tests: archive preserves taskIds and the record; archived milestone is hidden from list and shown with --include-archived; view still resolves it; double archive errors; delete keeps its destructive behaviour and its has-task-references guard (AC3); manifest declares the command.
7. Gates, independent review, PR to dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented on quest/qcli-140-milestone-archive, commits 6aab7d6 + b0a1353, off dev 015fa7b (Opum lease 269f174cbed3f5dc475b654c910a871b, slot 1).

Design: milestones are not per-file records the way drafts are - PlanningService reads and writes one {milestones, decisions} blob - so archiving is a boolean field on the Milestone, not the filesystem move archiveDraft performs. The draft pattern mirrored is its CLI and list semantics. The flag is orthogonal to MilestoneStatus because a milestone is retired whether it closed or was abandoned, and it is a boolean rather than a timestamp because Quest stores none (QCLI-137). Unlike delete, archive accepts a milestone that still carries task references; preserving them is the point.

Independent review returned six findings, all closed in b0a1353:
- HIGH, a regression I introduced: changing listMilestones' default to hide archived records silently changed nextPlanningId, which allocated the next id from that list. Archiving the highest-numbered milestone made every later 'milestone create' fail with milestone_already_exists. Allocation now sees archived records.
- The Backlog migration rebuilt a reused-by-title milestone field by field and dropped 'archived'; it now spreads the existing record.
- 'cleanup --confirm' reaped closed, task-free milestones without consulting the flag, destroying the record archiving exists to preserve. Archived milestones are now excluded: archiving is a deliberate retirement, and cleanup is not its reaper.
- 'overview' counted an archived milestone as open or closed work; a retired one is neither.
- The published Quest skill's milestone lifecycle line omitted 'archive'. Nothing bound that list to the manifest - the same drift class the QCLI-138 and QCLI-139 reviews each caught on a different surface - so a test now asserts every lifecycle verb the manifest declares appears in the skill. Confirmed red by removing 'archive' again.
- Test gaps closed: id-allocation regression, edit preserving 'archived' at service and CLI level, cleanup/overview behaviour, and a message assertion on the rejected 'decision archive'.

Deliberately out of scope and stated rather than silently accepted: archived milestones remain visible to 'search --all' and 'board', and 'task edit --milestone' still accepts one. A boolean flag does not get the whole-system invisibility 'draft archive' gets for free by moving the file. AC2 requires exclusion from 'milestone list' only. The archive conflict path is untested; it is structurally identical to every sibling mutation and the existing conflict fake cannot reach it.

Validation on b0a1353: bun test 341 pass / 0 fail; typecheck, biome format:check and layer:check clean; the 2 remaining lint warnings are pre-existing in untouched files.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Quest offered only 'milestone delete', so retiring a finished milestone destroyed its record and its task references. Every other Quest record already retires by archiving - 'task archive' and 'draft archive' both exist - so milestones were the inconsistent case.

Adds 'quest milestone archive <id>', an 'archived' field on the Milestone, and '--include-archived' on 'milestone list', which now hides archived milestones by default. 'milestone view' still resolves one. 'milestone delete' keeps its destructive behaviour and its has-task-references guard for callers that want it.

Because archiving is a field rather than a file move, every other writer had to be audited: the id allocator, the Backlog migration, cleanup and overview all needed to learn about it, and three of those were found by review rather than by me. A new test binds the published Quest skill's lifecycle verbs to the manifest, closing the drift class that the QCLI-138 and QCLI-139 reviews each caught on a different surface.

Verified by test/integration/planning/planning.test.ts and test/cli-tracker-process.test.ts: archive preserves the record and its task references where delete refuses; the archived milestone is hidden from list, shown with --include-archived, and still viewable; double archive, unknown id and missing actor all error correctly; 'decision archive' is rejected; edit does not un-archive; cleanup and overview ignore archived milestones; and id allocation still advances past an archived milestone. The skill guard and the id-allocation regression were each confirmed red without their fix. Full suite: 341 pass / 0 fail; typecheck, format:check and layer:check clean.
<!-- SECTION:FINAL_SUMMARY:END -->
