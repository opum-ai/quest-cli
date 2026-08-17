---
id: QCLI-97.8
title: Expose alias-preserving Backlog import for Lore tracker cutover
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 17:08'
updated_date: '2026-08-17 17:19'
labels: []
dependencies:
  - QCLI-87
parent_task_id: QCLI-97
priority: high
type: feature
ordinal: 133000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Expose the existing read-only Backlog importer as a public, versioned migration lifecycle for Lore tracker cutover. Preserve public aliases and canonical Quest task identity without coupling Lore to Quest internals or private storage.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Manifest, help, and instructions expose a versioned Backlog migration/import lifecycle with machine-readable preview, apply, status, and rollback—or an equivalent resumable contract.
- [x] #2 Preview inventories the complete source set, allocates canonical T-N IDs, assigns namespaced aliases and unqualified aliases when globally unambiguous, and rejects collisions or fidelity loss before writes.
- [x] #3 Apply is idempotent and source-read-only, returns every source-to-canonical mapping plus a stable receipt, and compensates failures or reports every survivor for safe resume.
- [x] #4 All task-reference commands resolve TASK-*, LCLI-*, and dotted Backlog IDs through aliases while returning canonical T-N identity.
- [x] #5 Packed-CLI and cross-product fixtures prove migration of TASK-1, LCLI-315.4, and dotted subtasks without Lore importing Quest code or reading private storage.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Expose a versioned `migration backlog` preview/apply/status/rollback CLI contract and manifest entries with strict argv parsing and JSON envelopes. 2. Reuse QCLI-87 BacklogImporter snapshots, collision checks, fingerprints, and aliases to generate a deterministic canonical T-N mapping against the public Quest task store. 3. Persist receipt/state records under .quest and apply or safely roll back only unchanged migration-owned task records, detecting source drift and reporting survivors for resume. 4. Preserve imported source references and aliases in canonical Quest tasks, including TASK-*, LCLI-*, and dotted identifiers, and make all tracker reference commands resolve them. 5. Add source-only Lore conformance fixtures and packed-binary qualification, then run the required quality gates.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented public migration backlog preview/apply/status/rollback envelopes with receipt persistence, explicit write actors, imported alias resolution, pre-write durable intent, and safe rollback survivors. Independent review findings on actor enforcement and crash recovery were fixed. Validation passed: bun test (147), typecheck, Biome lint/format, layer, check:packages, test:packages, and git diff --check.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Released the v0.2.2 candidate contract for public Backlog-to-Quest cutover. Preview and apply expose canonical mappings and durable receipts; aliases including TASK-1, LCLI-315.4, and dotted IDs resolve to canonical T-N tasks. Verified with the end-to-end source-only fixture, complete suite, package, packed-CLI, and layer gates.
<!-- SECTION:FINAL_SUMMARY:END -->
