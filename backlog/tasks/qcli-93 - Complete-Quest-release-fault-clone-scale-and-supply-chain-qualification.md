---
id: QCLI-93
title: 'Complete Quest release, fault, clone, scale, and supply-chain qualification'
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-16 22:16'
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
  - src/application/migration/
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect the integrated six-target qualification runner, native migration requirement, and migration boundary failure. 2. Add a candidate-local native migration-smoke executable/harness invoked by every immutable-target qualification run. 3. Move or invert the Backlog migration dependency so application code no longer imports an adapter implementation, with focused regression coverage. 4. Rerun affected gates, full qualification where available, and obtain independent review; record any explicit environment limitations.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Integrated qualification runner and six-target CI matrix at dev tree 57a5f027146736f3eacdc087741f9a3760a695ee after independent review. Native darwin-arm64 immutable candidate passed packing, checksum, clean install, version, manifest, actor-declared task, SQLite projection, and supplied migration-hook gates. The runner deliberately records a missing QUEST_QUALIFICATION_MIGRATION_SMOKE native executable as environment_skipped/publication-blocking on every target. The source layer gate remains failed by the pre-existing out-of-scope migration adapter import; broad formatter Treehouse discovery is also known external to task sources. Do not treat QCLI-93 or publication as complete.

Authorized remediation implemented and independently reviewed: compiled migration-smoke exercises preview, approved apply, and safe rollback from the immutable candidate; all six artifacts rebuilt with the maintained /private/tmp target cache; runner executes each installed native binary directly (including Windows .exe). Lore adoption protocol moved to ports, clearing the application-to-adapter layer violation. Local typecheck, layer check, source-scoped Biome CI, package checks/tests, focused CLI and Lore migration tests, full domain/contract/integration/fault/migration/scale qualification, and darwin-arm64 immutable candidate all pass. Root-wide Biome lint/format still fail before scanning due the pre-existing nested .treehouse configuration; CI's clean checkout is the authoritative six-runner gate.
<!-- SECTION:NOTES:END -->
