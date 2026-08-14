---
id: QCLI-93
title: 'Complete Quest release, fault, clone, scale, and supply-chain qualification'
status: To Do
assignee: []
created_date: '2026-08-14 18:08'
updated_date: '2026-08-14 18:27'
labels:
  - quest-0.1
  - 'wave:release'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-92
documentation:
  - docs/specs/quest-cli-functional-requirements.md
  - docs/reference/quest-cli-packaging-contract.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - .github/workflows/
  - scripts/qualification/
  - test/
priority: high
type: task
ordinal: 111000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Run the complete prepublication gate over source, behavior, concurrency, migrations, projections, platform artifacts, and supply-chain metadata. No registry mutation is authorized by this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Typecheck, Biome, layer checks, unit, contract, integration, black-box, fault, migration, scale, and package tests pass
- [ ] #2 Real-clone and worktree tests prove concurrent claims, stale refs, shared-counter conflicts, crash recovery, and unrelated dirty-state preservation
- [ ] #3 All six clean-install targets run version, manifest, task, projection, and migration smoke tests from immutable candidate artifacts
- [ ] #4 Clean-room provenance, dependency licenses, package contents, checksums, repository identity, and publication preconditions are audited
- [ ] #5 Any failed or environment-skipped release gate remains explicit and blocks publication
<!-- AC:END -->
