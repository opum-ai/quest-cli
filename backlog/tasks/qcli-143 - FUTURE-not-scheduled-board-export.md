---
id: QCLI-143
title: 'FUTURE (not scheduled): board export'
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
