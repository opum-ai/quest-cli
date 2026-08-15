---
id: QCLI-90
title: Implement optional Lore concept linking
status: Done
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
  - QCLI-76
  - QCLI-80
documentation:
  - >-
    docs/adr/keep-lore-optional-and-integrate-only-through-versioned-public-records.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/adapters/lore/
  - src/application/lore-links/
  - test/integration/lore-links/
priority: medium
type: enhancement
ordinal: 108000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement explicit task-to-Lore concept linking through Lore's versioned public export and CLI contract. Lore remains optional and an unavailable, incompatible, missing, or stale concept must leave the Quest task unchanged.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Link validation checks Lore capability, concept identity, source repository, revision, path, schema, and content provenance before the Quest mutation begins
- [x] #2 A valid concept is stored as an explicit stable documentation reference and event
- [x] #3 Unreachable Lore, incompatible schema, stale export, and missing concept IDs fail loud and leave authoritative Quest state byte-identical
- [x] #4 No Quest-only command or workflow requires Lore to be installed or reachable
- [x] #5 Contract and integration tests use only Lore public records and commands
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define the optional Lore public-record capability boundary and provenance validation in the dedicated adapter and application paths.
2. Implement explicit documentation-reference mutation only after validating identity, repository, revision, path, schema, and content provenance.
3. Add integration coverage for valid links and all unavailable/incompatible/stale/missing failure paths, proving Quest-only flows remain Lore-independent; run targeted and repository checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Independent review found the concrete Lore reader was not structurally compatible with the application port; fixed in 4c25cde by extracting the public Lore projection port and adding runtime export decoding. Verified targeted Lore-link suite (6 pass), typecheck, layer check, source-scoped Biome, and diff check.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented optional Lore public-export validation and atomic link-store boundary, creating stable documentation references and link events only after complete provenance validation. Concrete adapter now runtime-decodes public exports; failure paths leave Quest state untouched.
<!-- SECTION:FINAL_SUMMARY:END -->
