---
id: QCLI-83
title: Ship the Quest tracker subprocess contract and Lore conformance kit
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 21:06'
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
- [x] #1 The probe uses bare semver plus the live manifest and rejects incompatible command or schema versions
- [x] #2 Status flow, list, view, search, create, and edit map losslessly to lore-cli's TrackerAdapter fields and patch semantics
- [x] #3 All reads and writes use argv-safe subprocess JSON with bounded execution and deterministic missing, denied, conflict, and drift outcomes
- [x] #4 A versioned conformance fixture suite can be run by lore-cli without reading Quest private files
- [x] #5 The contract documents actor selection for writes and leaves read operations actor-independent
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

Restored 2026-08-15: QCLI-83 continuation dispatched from pinned dev base 4507095b6c429dc8dd4d32aeef55a03d761a44cd to isolated campaign/qcli-83-tracker-cli worktree. Scope: operational CLI repository composition, public fixture artifact, spawned black-box conformance, then independent review.

Independent review of 2096e9d blocked integration: default create ID is noncanonical; successful tracker payloads lack runtime schema validation; fixture remains static/private rather than externally runnable; dash-leading argv values do not round-trip; local edit CAS is non-atomic. Remediation dispatched on campaign/qcli-83-tracker-cli before re-review.

Final integrated verification at e0589a7e436e322b7423345819206ed4b3d5bdb9: independent review approved after remediating canonical default IDs, successful-payload drift validation, external public fixture execution, dash-leading argv values, and bounded conflict-safe repository locking. Source-scoped Biome gates, typecheck, layer check, 67 Bun tests, Lore validate/check strict, and git diff --check passed. Full  remains structurally blocked only by Biome discovering the leased nested Treehouse worktree; equivalent source-scoped checks passed.

Correction: the aggregate Bun check is structurally blocked only because Biome discovers the leased nested Treehouse worktree; equivalent source-scoped checks passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered the live Quest tracker subprocess CLI: bare 0.1.0 probe, manifest capability registry, argv-safe task reads/writes with actor enforcement and bounded conflict diagnostics, runtime-validated client envelopes, and a versioned external conformance fixture. Independently reviewed and verified by 67 passing Bun tests, source-scoped lint/format/type/layer checks, Lore strict validation/check, and diff check.
<!-- SECTION:FINAL_SUMMARY:END -->
