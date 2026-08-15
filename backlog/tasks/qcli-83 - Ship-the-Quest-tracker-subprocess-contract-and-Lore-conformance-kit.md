---
id: QCLI-83
title: Ship the Quest tracker subprocess contract and Lore conformance kit
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 20:01'
labels:
  - quest-0.1
  - 'wave:interop'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-80
documentation:
  - >-
    docs/adr/keep-lore-optional-and-integrate-only-through-versioned-public-records.md
  - docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/cli/commands/task/
  - src/contract/tracker/
  - test/contract/tracker/
priority: high
type: feature
ordinal: 101000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Publish the stable Quest subprocess contract lore-cli LCLI-315.4 will consume after Quest is released. Cover capability probing, asynchronous status flow, task summaries/details, reads, writes, timeouts, and fail-loud schema drift without introducing a shared private library.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The probe uses bare semver plus the live manifest and rejects incompatible command or schema versions
- [ ] #2 Status flow, list, view, search, create, and edit map losslessly to lore-cli's TrackerAdapter fields and patch semantics
- [ ] #3 All reads and writes use argv-safe subprocess JSON with bounded execution and deterministic missing, denied, conflict, and drift outcomes
- [ ] #4 A versioned conformance fixture suite can be run by lore-cli without reading Quest private files
- [ ] #5 The contract documents actor selection for writes and leaves read operations actor-independent
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define the public versioned tracker contract and conformance fixtures without importing Lore private files.
2. Implement argv-safe Quest CLI task commands and bounded JSON subprocess mapping for probe, reads, and writes with deterministic outcome categories.
3. Add contract coverage for semver/schema compatibility, lossless fields and patches, timeouts/errors, actor selection, and external fixture execution; run targeted and repository checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Independent review blocks finalization: live CLI remains command-free (development version, manifest lacks tracker commands, task argv routes/storage composition absent), and fixtures are private TypeScript rather than a public consumable artifact. Next work: implement CLI routing/storage, live manifest/version/envelopes/diagnostics, public fixture artifact, and spawned black-box tests.
<!-- SECTION:NOTES:END -->
