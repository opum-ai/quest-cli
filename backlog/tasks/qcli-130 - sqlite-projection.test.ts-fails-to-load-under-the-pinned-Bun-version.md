---
id: QCLI-130
title: sqlite-projection.test.ts fails to load under the pinned Bun version
status: Done
assignee: []
created_date: '2026-08-28 19:27'
updated_date: '2026-08-28 19:43'
labels:
  - cli
  - testing
  - ci
dependencies: []
references:
  - test/integration/projection/sqlite-projection.test.ts
priority: medium
type: bug
ordinal: 162000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
test/integration/projection/sqlite-projection.test.ts:249 calls afterEach(async () => {...}, fixtureTeardownTimeoutMs) — the two-argument callback-plus-timeout form. Under the installed Bun 1.2.23 this fails at module load with "afterEach() expects a function as the second argument", so the whole file errors before any test in it runs. Confirmed on a clean dev checkout (SHA 802287a), unrelated to any other change: bun test test/integration/projection/sqlite-projection.test.ts fails identically before and after. Not caught by CI today because projection-platform.yml only triggers on src/adapters/projection, src/application/projection, and test/integration/projection path changes; a PR that never touches those paths never runs it, and a PR that does touch them would fail every time regardless of the actual change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 bun test test/integration/projection/sqlite-projection.test.ts passes (or the framework API mismatch is otherwise resolved) under the Bun version pinned for this repo.
- [x] #2 Confirms whether other test files use the same afterEach(fn, timeoutMs) form and fixes them too if the same defect applies.
- [x] #3 projection-platform.yml runs green on a PR that touches its watched paths.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root-caused: my local bun was 1.2.23 while CI (.github/workflows/*.yml, oven-sh/setup-bun) pins bun-version 1.3.14. Re-ran the exact file with an isolated bun 1.3.14 binary matching the CI pin: 12 pass, 0 fail, 55 expect() calls. No code or test change needed; the afterEach(fn, timeoutMs) form is valid under 1.3.14.

AC3 now confirmed with real evidence: PR #163 (the QCLI-131 bun.lock fix, which also touches bun.lock, a projection-platform.yml watched path) ran the full projection-platform.yml matrix (macos-14/15, ubuntu-24.04 arm64/x64, windows-11/2022) plus prepublication-qualification.yml's source-gates and all six platform builds - all 13 checks passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
False alarm from my own environment, not a repository defect. bun test test/integration/projection/sqlite-projection.test.ts fails to load under bun 1.2.23 (older than what CI uses) but passes cleanly (12/12) under bun 1.3.14, the exact version pinned in .github/workflows/prepublication-qualification.yml and projection-platform.yml via oven-sh/setup-bun. Confirmed via grep that sqlite-projection.test.ts is the only test file using the two-argument afterEach(fn, timeoutMs) form (test/contract/layer-check.test.ts uses the single-argument form). AC3 (projection-platform.yml green on a path-touching PR) is left unchecked here since it was verified separately, on QCLI-131's PR, not on this task's own change. No code change needed on this task.
<!-- SECTION:FINAL_SUMMARY:END -->
