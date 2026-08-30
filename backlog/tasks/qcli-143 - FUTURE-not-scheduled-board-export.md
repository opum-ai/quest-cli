---
id: QCLI-143
title: 'FUTURE (not scheduled): board export'
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-29 00:32'
updated_date: '2026-08-29 23:13'
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
- [ ] #1 Before any implementation, confirm a static export is still wanted given board --json and quest browser already exist.
- [ ] #2 If implemented: board export writes the artifact, honours --force, and the manifest declares the command and its flags.
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
