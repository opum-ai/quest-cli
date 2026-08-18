---
id: QCLI-97.9
title: Deliver and qualify the installed Quest migration lifecycle for Lore
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-17 21:25'
updated_date: '2026-08-18 01:27'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Establish 0.2.7 as an unpublished local candidate by synchronizing the root package, six optional package declarations, runtime and managed-instruction version constants, fixtures, and exact version tests. 2. Extend packed-artifact qualification to assert the four migration manifest entries with exact kinds/mutability, denied actor-free writes, preview/status, and the complete apply/rollback fixture used by Lore LCLI-315.4. 3. Commit the reviewed source/test changes, rebuild all six native packages from that clean source using the pinned Bun 1.3.14 target cache, and deliver the checksum-coupled artifact paths through the constrained package workflow. 4. Pack root plus all six platform artifacts, record source SHA and tarball/binary checksums, prove an isolated clean install, then replace the active global Quest installation from the local root plus darwin-arm64 tarballs and rerun installed black-box qualification. 5. Record the unpublished candidate and Lore handback evidence in QCLI-97.9 and release truth, run full/package/Lore gates and independent review, deliver to dev, and do not publish or mutate npm registry state.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner authorization received: QCLI-97.9 may bump and rebuild all six packages, create local packed artifacts, and replace the global Quest installation for qualification. npm publication remains explicitly unauthorized. Preflight selected 0.2.7; current source/packages are 0.2.6, while the installed launcher is the stale 0.2.2 candidate under /private/tmp and lacks all four migration backlog manifest commands.
<!-- SECTION:NOTES:END -->
