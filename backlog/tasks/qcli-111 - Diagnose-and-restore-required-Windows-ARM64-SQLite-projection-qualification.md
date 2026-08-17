---
id: QCLI-111
title: Diagnose and restore required Windows ARM64 SQLite projection qualification
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-17 21:25'
updated_date: '2026-08-17 22:56'
labels:
  - quest-0.2
  - bun
  - ci
  - windows-arm64
dependencies: []
references:
  - 'https://github.com/opum-ai/quest-cli/actions/runs/32069839094'
  - .github/workflows/projection-platform.yml
  - test/integration/projection/sqlite-projection.test.ts
modified_files:
  - .github/workflows/projection-platform.yml
  - test/integration/projection/sqlite-projection.test.ts
  - src/adapters/projection/
priority: medium
type: bug
ordinal: 136000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Windows ARM64 is quarantined after three isolated projection-matrix failures while the other five platform lanes pass. The observed failure moved between SQLite recovery cases and consumed both Bun's default 5-second timeout and an isolated 15-second workflow budget, indicating a hang or runner-specific cleanup defect rather than a single slow assertion. Restore trustworthy required coverage without weakening the other lanes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Diagnostics on a clean Windows ARM64 runner identify which projection, SQLite, filesystem, or Bun phase hangs and distinguish deterministic slowness from leaked handles or files
- [ ] #2 Projection tests and adapters leave no open database handles, temporary files, or asynchronous work after each recovery case
- [ ] #3 The complete projection suite passes in at least three independently dispatched clean Windows ARM64 runs using the repository-pinned Bun version
- [ ] #4 Windows ARM64 is restored as a required non-quarantined lane while all six platform lanes and their existing assertions remain enabled
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add deterministic projection release diagnostics that identify replacement versus cleanup phase, retry count, elapsed time, and filesystem error without changing normal output.
2. Harden SQLite rebuild and sync temporary-file cleanup so every opened database closes in finally, temporary rebuild/progress files are removed or a specific cleanup error is surfaced, and the retry budget cannot be hidden by the outer test timeout.
3. Refactor projection integration fixtures to own and remove one temporary directory per test, close mutation handles in finally, and add targeted recovery assertions proving no database, progress, rebuild, or asynchronous residue remains.
4. Restore Windows ARM64 as a required matrix lane, retain all six platforms and pinned Bun 1.3.14, and apply measured bounds only to the recovery cases whose release latency is documented.
5. Run focused and repository gates, obtain independent review, then dispatch three new full six-lane workflow runs on the exact candidate SHA and require the Windows ARM64 test step itself to pass before delivery.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Restore audit corrected prior evidence: runs 32071578797 and 32075311643 are genuine Windows ARM64 passes, but 32073732956 contains a failed test step masked by continue-on-error. AC3 therefore still requires three fresh independent passing runs. The failure path is synchronize/rebuild replacement; retry plus swallowed cleanup can exceed the 15-second outer timeout and leave temp residue. Production handles normally close, while test fixtures currently leak their temp directories and several mutation handles lack finally blocks.

Implemented the reviewed candidate in the three declared paths. The adapter emits env-gated attempting/succeeded/failed file-release events before and after database rebuild, sync-progress, sync-progress-removal, and fixture teardown operations; rebuild handles close in finally; progress and rebuild cleanup failures are surfaced with both errors retained. Recovery fixtures close mutation handles, assert only the projection remains, and remove their owned directory with the same bounded observable release policy. The workflow removes quarantine and continue-on-error while preserving all six runners and Bun 1.3.14. Independent rereview approved the calculated targeted timeout budgets. Local exact-tree gates passed: focused projection 10 tests/41 expectations; full repository check 160 tests/1406 expectations; typecheck, lint, format, layer, and diff checks passed.

Fresh exact-candidate qualification at 8086ad0 produced two clean six-lane runs (32077939935 and 32077941910) and one required Windows ARM64 failure (32077943944, job 95534972695). The new diagnostics isolated a database_rebuild replacement EBUSY in the valid-SQLite recovery case: attempt 100 ended at 10,980ms, then rebuild-temp and fixture cleanup both succeeded immediately, proving bounded destination-handle release rather than a leaked temp handle. The first safe remediation extends the retry policy from 100 to 120 attempts and recalculates the targeted test bounds from 99 to 119 delay intervals; focused tests, typecheck, lint, format, and diff checks pass. Because the source tree changed, three new exact-candidate runs are required and prior successes will not be counted toward AC3.
<!-- SECTION:NOTES:END -->
