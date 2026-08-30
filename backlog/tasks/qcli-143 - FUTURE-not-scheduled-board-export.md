---
id: QCLI-143
title: 'FUTURE (not scheduled): board export'
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-29 00:32'
updated_date: '2026-08-30 16:44'
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
ordinal: 175000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
NOT SCHEDULED. Filed to capture intent; the owner explicitly deferred shipping (2026-08-29).

Backlog 1.50.1 has board export [file] --force --readme --export-version. In Quest, board export exits 2 with "board accepts only --json and --plain".

Downstream impact verified as none: Lore 0.3.4 shipped binary contains zero references to board or board export.

Quest already covers the adjacent needs from two directions: board --json is machine-readable, and quest browser serves a live board and overview over HTTP. What is missing is specifically a static file/Markdown/README export artifact.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Before any implementation, confirm a static export is still wanted given board --json and quest browser already exist.
- [x] #2 If implemented: board export writes the artifact, honours --force, and the manifest declares the command and its flags.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
OWNER DECISION 2026-08-29: implement, file only. No --readme - a flag that rewrites the project README is surprising and easy to do by hand from the exported file. That answers AC1 yes with a narrowed scope.

Note before coding: PlanningService.board() returns columns of task IDs and nothing else (src/application/planning/planning.ts:299). A Markdown board of bare IDs would be useless to a reader, so the export has to join titles from the task snapshot board() already reads. That is the real work; the file write is trivial.

1. Add renderBoardMarkdown in the application layer, taking the board plus a title lookup. Columns as sections in the configured status order rather than alphabetical - a board reads To Do, In Progress, Done, and board()'s current localeCompare sort happens to invert that. Include milestones, since board() already returns them and a static artifact loses the ability to go look them up.
2. CLI: 'board export <file>' with --force. Without --force an existing file is a usage error naming --force; this writes outside .quest/ and must not clobber silently. The file write belongs at the composition root, not in the application layer, so the application returns a string.
3. Manifest and help: declare 'board export' with kind project.board-export. mutates stays false - it changes no tracker record - and no actor is required, matching Backlog and matching every other read command.
4. Tests: the artifact contains every task's id and title under its own status heading, milestones appear, an existing file is refused without --force and overwritten with it, the parent directory missing is a clean error rather than a stack trace, and 'board' itself is unchanged.
5. Gates, independent review, PR to dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified 2026-08-30 by exercising the built CLI against a scratch Quest workspace, not by code reading: 'board export board.md' wrote a 127-byte artifact listing both tasks by id and title under their status headings in lifecycle order; a second run without --force returned error_type conflict naming --force; --force overwrote; a missing parent directory returned error_type validation with the ENOENT message rather than a stack trace; and 'manifest --json' declares {name: 'board export', kind: 'project.board-export', mutates: false, filters: ['force'], fields: ['bytes','path']}. Full gate on the rebased branch: bun run check, 375 pass, 0 fail.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added 'quest board export <file>' writing the board as a Markdown artifact. PlanningService.boardMarkdown joins task titles onto the board's task ids and renders columns in configured lifecycle order rather than board()'s localeCompare order, so the artifact reads as a board; the file write stays at the composition root. Per the owner decision of 2026-08-29 the scope is file-only, with no --readme flag. Verified by exercising the CLI end to end (artifact contents, --force refusal and overwrite, missing-parent error, manifest declaration) and by the full gate: 375 pass, 0 fail.
<!-- SECTION:FINAL_SUMMARY:END -->
