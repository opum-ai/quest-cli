---
id: QCLI-90
title: Implement optional Lore concept linking
status: To Do
assignee: []
created_date: '2026-08-14 18:08'
updated_date: '2026-08-14 18:27'
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
- [ ] #1 Link validation checks Lore capability, concept identity, source repository, revision, path, schema, and content provenance before the Quest mutation begins
- [ ] #2 A valid concept is stored as an explicit stable documentation reference and event
- [ ] #3 Unreachable Lore, incompatible schema, stale export, and missing concept IDs fail loud and leave authoritative Quest state byte-identical
- [ ] #4 No Quest-only command or workflow requires Lore to be installed or reachable
- [ ] #5 Contract and integration tests use only Lore public records and commands
<!-- AC:END -->
