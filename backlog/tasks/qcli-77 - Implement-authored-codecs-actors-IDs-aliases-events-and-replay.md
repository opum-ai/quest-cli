---
id: QCLI-77
title: 'Implement authored codecs, actors, IDs, aliases, events, and replay'
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 17:48'
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
- [x] #1 Canonical IDs are T-prefixed unpadded decimals allocated from one global Git-coordinated counter
- [x] #2 Aliases preserve display spelling and compare by NFC plus full Unicode default case folding, with collisions reported before any write
- [x] #3 Actor declarations distinguish human and delegated-agent kinds, reviewer and maintainer roles, and required accountable-human links without authentication claims
- [x] #4 Task events are append-only, versioned, operation-idempotent, actor-attributed, basis-aware, and replay to the exact persisted materialization
- [x] #5 Unsupported major schemas, malformed UTF-8, duplicate events, alias collisions, and replay drift fail loud with no partial mutation
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reconcile the accepted identifier, record-layout, actor, and Git-CAS ADRs with the QCLI-76 shell and current domain/adapter conventions.
2. Add a narrowly scoped Git-backed global-counter record port that makes the allocation precondition and replacement revision explicit, without duplicating QCLI-79's full mutation engine.
3. Strengthen pure authored-record validation: validate accountable-human references against declarations, enforce event-stream bases, and decode typed records rather than only their envelope.
4. Add contract tests for counter CAS semantics, actor links, invalid bases, malformed version-1 records, idempotence, replay, and fail-closed input.
5. Run focused and cumulative checks, obtain independent review, synchronize Lore, and finalize.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-15 restoration: primary `bun run check` at 26543cc failed before tests because `unicode-case-folding` is missing from node_modules. `bun install --frozen-lockfile` failed with Bun `PermissionDenied` writing its tempdir both sandboxed and escalated. Independent read-only review at 26543cc found blockers: no Git-coordinated counter adapter, event bases are unchecked, and decodeAuthoredRecord validates only the version envelope. Corrective slice planned; source tree remains clean.

2026-08-15 corrective validation at uncommitted `dev`: npm installed the lock-compatible missing dependency using `/private/tmp/quest-npm-cache` after Bun tempdir and the default npm cache failed with PermissionDenied. `bun run typecheck`, source-only Biome lint/format checks (the repository-wide scripts scan Treehouse's nested worktree and fail configuration), `bun run layer:check`, and `bun test` passed: 15 tests / 69 assertions. Lore sync, `lore validate --strict`, `lore check --strict`, and `git diff --check` passed. Independent review found and the final spot review verified the persisted-duplicate replay regression fix.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented Git-CAS counter port, typed authored-record codecs, declared-human actor-link validation, basis-aware append/replay, and fail-closed persisted-duplicate detection. Verified by 15 Bun tests (69 assertions), type/layer/lint/format checks, Lore strict validation/check, diff validation, and independent review.
<!-- SECTION:FINAL_SUMMARY:END -->
