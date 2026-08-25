---
id: QCLI-97.10.1
title: Reconcile ODOC-63.2 tracker state and feature frontier
status: Done
assignee:
  - quest-cli
created_date: '2026-08-21 19:06'
updated_date: '2026-08-21 19:18'
labels:
  - odoc-63.2
dependencies: []
parent_task_id: QCLI-97.10
priority: high
ordinal: 148000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
JIT first child: reconcile the live quest-cli tracker and codebase state against the ODOC-63.2 outcome before any implementation. Reconcile existing QCLI-97.5/.6/.8/.9, QCLI-88, current origin/dev, dirty primary state (docs/log.md, untracked opencode.jsonc), open PRs/branches, and the current schema/manifest/migration implementation surface. Preserve learned facts in this task notes as a durable evidence record; do not implement features here.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A three-layer Git/Treehouse/physical audit of the primary checkout is recorded with exact SHAs
- [x] #2 Existing parity/migration tasks (QCLI-97.5/.6/.8/.9, QCLI-88) are reconciled with their live status and dependency edges
- [x] #3 Current schema-1 projection, manifest, and migration command coverage is inventoried against the ODOC-63.2 outcome list with gaps named
- [x] #4 The JIT child frontier for QCLI-97.10 is recomputed from native dependencies
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record three-layer Git/Treehouse/physical audit of primary checkout (SHAs, dirty state, worktrees, pool). 2. Reconcile QCLI-97.5/.6/.8/.9 and QCLI-88 live status against the ODOC-63.2 outcome list. 3. Inventory current schema-1 projection, manifest, and migration command coverage in the leased tree; name gaps. 4. Recompute the JIT frontier from native dependencies and record learned facts in task notes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-21: FMC correlation d75384177e55476fb841859f39c054a2 accepted. First-action attestation sent (policy opencode-qwen-2026-08-20-v4-spike1, lease 9c21bd6372aa34e7490d37d93df4eade, base origin/dev e700c3ebf613db1dfc8645d37bb43cba1ad23e24, branch feat/qcli-97.10-odoc-63.2-parity-migration, primary_checkout=false). lore-context child launch was rejected at the host permission layer with no FMC approval row created; treating as capability/configuration mismatch, reporting once, proceeding with direct bounded reads of the pinned opum-doc concepts and local Lore docs.

Gap inventory (leased tree at origin/dev e700c3e): (1) TaskState lacks assignees, references, modifiedFiles, createdAt/updatedAt; AC/DoD are plain strings dropping checked state (importer has checked flags but backlog-public.ts maps to text only); plan is a single string not ordered items; finalSummary concatenated into implementationNotes (spec forbids concatenation); migration drops milestone edges (importer parses milestone but BacklogImportService never creates Milestone records or task back-references); no multi-pass/resume beyond per-task fingerprint survivors; no case-insensitive configured status matching in status-flow/list/edit (exact string compare); public tracker contract (src/contract/tracker/index.ts) exposes only a subset of fields and edit patch lacks replace/clear for plan/notes/comments/AC/DoD/milestone/dependencies; manifest lacks field/filter advertisement. (2) Existing: canonical T-N + aliases + atomic forward/back dependency/parent links via canonicalizeTaskLinks exist; actor-required writes exist; digest-bound preview/apply/status/rollback receipts exist (QCLI-97.8/.9). Concept provenance: opum-doc 995b966 docs/stories/ship-the-lore-and-quest-tracker-parity-release.md, docs/specs/lore-quest-tracker-parity-adoption-and-paired-release-architecture.md (public tracker contract table), docs/adr/keep-lore-as-documentation-authority-and-quest-as-task-authority.md. JIT frontier: QCLI-97.10.2 ready.

2026-08-21 continuation: FMC correlation 70ae9747ac294930a23645487dbbb558 (kind feature-wayfinding-continuation, predecessor d75384177e55476fb841859f39c054a2) is the sole active continuation. Full first-action attestation repeated in authoritative local-FMC presence (no interim fmc_reply): scope policy-adoption; generation opencode-qwen-2026-08-20-v4-spike1; runtime opencode; model spark/qwen3.8-27b-routine; primary Build medium; agents [lore-context, explore, implementation-planner, standards-reviewer, spec-reviewer, verify]; skills [codex-worker, backlog-handover, treehouse-worktrees, lore]; profiles [implementation, review, verification]; primary_checkout=false; lease_id 9c21bd6372aa34e7490d37d93df4eade holder quest-cli-odoc-63.2; path /Volumes/external/repos/quest-cli/.treehouse/quest-cli-40ae4d/1/quest-cli; branch feat/qcli-97.10-odoc-63.2-parity-migration pinned at origin/dev e700c3ebf613db1dfc8645d37bb43cba1ad23e24 (verified live: clean tree, HEAD at base). No second lease, no duplicate tasks.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reconciled live tracker/codebase state against ODOC-63.2: three-layer audit (primary dev 03177b9 dirty docs/log.md + untracked opencode.jsonc preserved; origin/dev e700c3e; leased worktree .treehouse/quest-cli-40ae4d/1/quest-cli lease 9c21bd6372aa34e7490d37d93df4eade on branch feat/qcli-97.10-odoc-63.2-parity-migration). Reconciled QCLI-97.5 (In Progress, external Lore-side blocker), QCLI-97.6 (To Do, dependency-gated), QCLI-97.8/.9 (Done, v0.2.7 migration lifecycle qualified), QCLI-88 (Done, Lore saga boundary); duplicate QCLI-117..120 already merged as #134. Gap inventory recorded in notes; JIT frontier recomputed: QCLI-97.10.2 ready.
<!-- SECTION:FINAL_SUMMARY:END -->
