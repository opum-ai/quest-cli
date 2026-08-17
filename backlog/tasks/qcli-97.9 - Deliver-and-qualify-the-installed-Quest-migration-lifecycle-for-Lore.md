---
id: QCLI-97.9
title: Deliver and qualify the installed Quest migration lifecycle for Lore
status: To Do
assignee: []
created_date: '2026-08-17 21:25'
labels:
  - quest-0.2
  - parity
  - release
  - lore-integration
dependencies: []
references:
  - QCLI-97.6
  - QCLI-97.8
  - scripts/test-packed-packages.mjs
modified_files:
  - package.json
  - npm/
  - scripts/test-packed-packages.mjs
  - docs/reference/
parent_task_id: QCLI-97
priority: high
type: bug
ordinal: 138000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Live Lore verification is blocked because the installed quest reports 0.2.2 but its schema-1 manifest omits migration backlog preview, apply, status, and rollback. The global launcher currently resolves through the installed package to a retained pre-reconciliation campaign candidate under /private/tmp, while the migration lifecycle exists on origin/dev. Establish an attributable clean-install artifact whose version and manifest prove the surface Lore consumes; do not treat a matching version string alone as release evidence.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The qualifying Quest package uses a version newer than the stale 0.2.2 candidate and the root plus all six native package versions and checksums agree with the source tree
- [ ] #2 A clean installed quest resolves to an attributable package artifact rather than a retained /private/tmp campaign symlink, and quest --version matches that artifact
- [ ] #3 The installed schema-1 manifest lists migration backlog preview, apply, status, and rollback with their exact kinds and mutability
- [ ] #4 Black-box installed-binary tests exercise preview and status plus actor/write validation and a complete apply/rollback fixture needed by Lore's LCLI-315.4
- [ ] #5 Packed-artifact qualification asserts the same migration manifest and lifecycle as the live installed path and records source commit, artifact checksums, and reinstall verification
- [ ] #6 Registry publication or mutation occurs only under separate explicit owner authorization
<!-- AC:END -->
