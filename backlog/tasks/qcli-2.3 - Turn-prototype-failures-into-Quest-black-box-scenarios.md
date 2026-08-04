---
id: QCLI-2.3
title: Turn prototype failures into Quest black-box scenarios
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 15:06'
labels:
  - campaign
  - research
  - regressions
  - prototype
  - clean-room
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:scenarios'
dependencies:
  - QCLI-2.1
  - QCLI-2.2
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Convert approved prototype dogfood and review findings into independently authored, implementation-neutral Quest acceptance scenarios describing observable inputs, interleavings, results, repository effects, and recovery.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenarios cover lease and heartbeat failures, human gates, read-only purity, recovery, hostile paths, dirty worktrees, canonical IDs, and operation-owned Git effects
- [ ] #2 Each scenario defines preconditions, action or concurrency interleaving, structured result and exit, allowed effects, and recovery checks
- [ ] #3 No prototype test, fixture, source organization, or algorithm is copied or treated as normative
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirm sources live: task QCLI-2.3 --plain; the register (docs/reference/quest-cli-research-source-register.md, read-only, admission authority); the legacy reconciliation doc (docs/reference/legacy-opum-requirement-reconciliation-for-quest-cli.md, QCLI-2.2, read-only, cited); the component charter (docs/reference/quest-cli-component-charter.md, cited); the Story (docs/stories/prepare-quests-clean-room-research-foundation.md, read-only); the migration ledger row OCLI-3.3 -> QCLI-2.3 (docs/reference/former-ocli-to-qcli-migration-ledger.md); and, per the register's explicit permitted use, the dated Opum fleet and prior-art inventory's 11 scenario seeds (opum-doc:docs/reference/dated-opum-fleet-and-prior-art-inventory.md, Allowed, local clone /Volumes/external/repos/opum-doc) plus OCLI-3.3's own task narrative (opum-doc:backlog/tasks/ocli-3.3-*.md, Allowed via the ledger row) as prose prompts only, never as tests/algorithms to copy.
2. Scaffold docs/reference/quest-cli-black-box-acceptance-scenarios.md via 'lore new reference' (new file, mine to own this wave).
3. Author: (a) a source-attributed provenance section matching this repo's established Reference convention (table: source, repo/path, revision, register classification, used for); (b) a seed-to-category traceability table mapping each of the 11 dated seeds to one of AC1's eight required categories (lease/heartbeat failures, human gates, read-only purity, recovery, hostile paths, dirty worktrees, canonical IDs, operation-owned Git effects); (c) ~15-18 independently authored scenarios covering every category, each with the five AC2 fields (preconditions; action or concurrency interleaving; structured result and exit; allowed filesystem/Git effects; recovery checks), written in implementation-neutral operation-category vocabulary (claim, lease-renewal/heartbeat, human-gate, read-only inspection, recovery/resume, synchronization operations) since concrete command names/flags/exit-code integers are QCLI-2.4's and later contract work's scope, not fixed here; (d) an explicit deferred-scope note for the stdio MCP smoke boundary (seed 10) and other first-release non-goals, consistent with the register's Deferred classification (preserve the question, do not design against it); (e) a Notes/independence section stating no prototype test, fixture, source organization, or algorithm was opened or copied (AC3).
4. Run 'lore validate --strict' and 'lore check --strict' against the new file iteratively while drafting; fix any errors.
5. Run 'lore sync' exactly once as the final step (regenerates docs/reference/index.md and docs/log.md), then re-run 'lore check --strict', 'lore validate --strict', and 'lore orphans' from the worktree root as the closing gate.
6. Record notes with decisions and objective gate output; commit in small logical steps with 'Refs: QCLI-2.3'; push the branch.
<!-- SECTION:PLAN:END -->
