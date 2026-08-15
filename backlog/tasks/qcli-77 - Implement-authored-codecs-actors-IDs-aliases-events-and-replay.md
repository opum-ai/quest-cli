---
id: QCLI-77
title: 'Implement authored codecs, actors, IDs, aliases, events, and replay'
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 17:21'
labels:
  - quest-0.1
  - 'wave:foundation'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-73
  - QCLI-74
  - QCLI-76
documentation:
  - >-
    docs/adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md
  - docs/reference/quest-cli-component-glossary-actors-and-workflows.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/domain/
  - src/adapters/records/
  - test/domain/
priority: high
type: feature
ordinal: 95000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement Quest's authoritative record primitives before workflows: tracked configuration and namespace state, opaque actor declarations consuming ODOC-57, T-prefixed global IDs, co-located aliases, append-only events, deterministic materialization, and schema validation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Canonical IDs are T-prefixed unpadded decimals allocated from one global Git-coordinated counter
- [ ] #2 Aliases preserve display spelling and compare by NFC plus full Unicode default case folding, with collisions reported before any write
- [ ] #3 Actor declarations distinguish human and delegated-agent kinds, reviewer and maintainer roles, and required accountable-human links without authentication claims
- [ ] #4 Task events are append-only, versioned, operation-idempotent, actor-attributed, basis-aware, and replay to the exact persisted materialization
- [ ] #5 Unsupported major schemas, malformed UTF-8, duplicate events, alias collisions, and replay drift fail loud with no partial mutation
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reconcile the canonical-ID, actor, and authored-record ADRs with the QCLI-76 shell and inspect current domain/adapter conventions.
2. Implement pure domain codecs for IDs, aliases, actors, events, and deterministic replay plus record adapters for UTF-8/schema validation.
3. Add domain/record contract tests for allocation, Unicode collision prevention, actor rules, event idempotence, replay, and fail-closed corrupt input cases.
4. Run focused and cumulative checks, obtain independent review, synchronize Lore, and finalize.
<!-- SECTION:PLAN:END -->
