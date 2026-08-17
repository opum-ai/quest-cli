---
id: QCLI-111
title: Diagnose and restore required Windows ARM64 SQLite projection qualification
status: To Do
assignee: []
created_date: '2026-08-17 21:25'
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
