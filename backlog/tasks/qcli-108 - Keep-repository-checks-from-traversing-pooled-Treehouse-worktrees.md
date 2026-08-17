---
id: QCLI-108
title: Keep repository checks from traversing pooled Treehouse worktrees
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 16:22'
updated_date: '2026-08-17 19:58'
labels:
  - tooling
  - ci
  - treehouse
  - developer-experience
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
references:
  - biome.json
  - package.json
documentation:
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
modified_files:
  - package.json
  - scripts/test-repository-check-scope.mjs
priority: medium
type: bug
ordinal: 132000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
With reusable Treehouse leases present under the ignored `.treehouse/` directory, both `bun run lint` (`biome lint .`) and `bun run format:check` (`biome ci ... .`) discover each leased checkout's root `biome.json` before applying the root include set. Biome rejects the nested root configurations, so the standard `bun run check` gate cannot run in the repository state produced by its own parallel-agent workflow. Git already ignores `.treehouse/`; the check entry points must also exclude or avoid traversing pooled worktrees without reducing coverage of owned source files.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `bun run lint` succeeds when one or more Quest worktrees with their own `biome.json` exist beneath `.treehouse/`
- [x] #2 `bun run format:check` succeeds in the same pooled-worktree state
- [x] #3 Lint and formatting checks still cover the repository-owned source, tests, scripts, and configured root JSON files
- [x] #4 The checks behave identically when `.treehouse/` is absent
- [x] #5 Automated regression coverage reproduces the nested-root configuration layout and prevents traversal from returning
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace repository-root Biome traversal in package scripts with an explicit owned-path target set that covers source, tests, scripts, and configured root JSON without entering .treehouse.
2. Add a regression harness that creates the nested Treehouse/biome.json layout, runs the lint and format-check entry points with and without the pool, and verifies representative owned files remain checked.
3. Run focused regression checks, lint, format:check, the full repository gate, Lore sync/strict validation, and diff checks before independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Replaced repository-root Biome traversal with explicit owned targets for src, test, scripts, biome.json, package.json, and tsconfig.json. Added a temporary-fixture regression that runs lint and format checks before and after introducing a nested .treehouse worktree biome.json.
Validation on integrated tree 207c2f4484b1aa3a25f8f3e0b09d4a8059d75eb0: the regression passed both pool states; bun run check passed typecheck, lint, format, layer, regression, and 149 tests; check:packages and diff checks passed. Independent task and cumulative reviews approved the behavior and path scope.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Scoped Biome checks to repository-owned paths and added regression coverage for pooled Treehouse nested configurations. Lint and format behave identically with or without the pool while retaining source/test/script/root-JSON coverage; the integrated 149-test gate and independent reviews passed.
<!-- SECTION:FINAL_SUMMARY:END -->
