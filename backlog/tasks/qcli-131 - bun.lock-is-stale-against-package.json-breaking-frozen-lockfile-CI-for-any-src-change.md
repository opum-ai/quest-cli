---
id: QCLI-131
title: >-
  bun.lock is stale against package.json, breaking frozen-lockfile CI for any
  src change
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-28 19:30'
updated_date: '2026-08-28 19:43'
labels:
  - cli
  - ci
  - dependencies
dependencies: []
references:
  - bun.lock
  - package.json
  - .github/workflows/prepublication-qualification.yml
priority: high
type: bug
ordinal: 163000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
bun install --frozen-lockfile fails on a completely clean dev checkout (confirmed at 802287a, before any unrelated change) with "lockfile had changes, but lockfile is frozen". A non-frozen bun install (bun 1.3.14, matching the pin in .github/workflows/prepublication-qualification.yml and projection-platform.yml) shows the committed bun.lock is missing the six @opum-ai/quest-<platform>@0.2.9 optionalDependencies entries and their resolved package records under the root @opum-ai/quest entry - a leftover from a package.json version bump (QCLI-123/124, 0.2.7 to 0.2.9) that was never followed by a regenerated lockfile commit. Confirmed live in CI: PR #162s source-gates job fails with the identical error under the pinned bun-version 1.3.14. This blocks prepublication-qualification.yml (and by extension every future PR that touches src/**, package.json, or bun.lock) from ever going green until fixed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 bun install --frozen-lockfile --linker=isolated succeeds on dev using bun 1.3.14 (the CI-pinned version).
- [x] #2 source-gates and the platform qualification matrix pass on a PR that touches src/** after this fix.
- [x] #3 No package.json dependency version actually changes as a result - only bun.lock is regenerated to match the already-committed package.json.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Acquire an Opum worktree lease, base dev @ 802287a.
2. Run bun install --linker=isolated using an isolated bun 1.3.14 binary (matching
   the exact CI pin in .github/workflows/*.yml) to regenerate bun.lock.
3. Diff the regenerated bun.lock against the committed one; confirm the only
   changes are the six missing @opum-ai/quest-<platform>@0.2.9
   optionalDependencies/resolved entries under the root package (the QCLI-123/124
   version-bump aftermath) - no unrelated dependency version changes.
4. Verify bun install --frozen-lockfile --linker=isolated now succeeds under the
   1.3.14 binary.
5. Commit only bun.lock, open a PR, confirm source-gates and the platform matrix
   go green in CI, then merge.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Merged via PR #163 (merge commit 88b81f5). All 13 CI checks passed: source-gates (2m52s), 6 prepublication-qualification.yml platform builds, and all 6 projection-platform.yml matrix jobs (bun.lock is a watched path for both workflows).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Regenerated bun.lock with an isolated bun 1.3.14 binary (matching the exact CI pin) to add the six missing @opum-ai/quest-<platform>@0.2.9 optionalDependencies/resolved entries left over from the QCLI-123/124 version bump. Diff was additive only (+20/-0), no other dependency changed. bun install --frozen-lockfile now succeeds; verified live via PR #163, where source-gates and every platform job in both prepublication-qualification.yml and projection-platform.yml passed. Merged to dev at 88b81f5.
<!-- SECTION:FINAL_SUMMARY:END -->
