---
id: QCLI-2.3
title: Turn prototype failures into Quest black-box scenarios
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 15:12'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: docs/reference/quest-cli-black-box-acceptance-scenarios.md (new Reference, this task's exclusive output this wave). 17 independently authored scenarios (BB-01..BB-17) across all 8 AC1 categories: lease/heartbeat (BB-01, BB-02), human gates (BB-03, BB-04), read-only purity (BB-05, BB-06), recovery (BB-07, BB-08), hostile paths (BB-09, BB-10, BB-11), dirty worktrees (BB-12, BB-13), canonical IDs (BB-14, BB-15), operation-owned Git effects (BB-16, BB-17). Every scenario carries all 5 AC2 fields (verified: grep -c on each field label = 17/17, matching the 17 scenario headers). Seed-to-category traceability table maps all 11 dated fleet-inventory seeds; seed 10 (stdio MCP smoke boundary) is explicitly Deferred (register: Deferred Opum prototype surfaces; charter: local MCP is a first-release non-goal), not authored as an active scenario -- recorded as a preserved open question only.

Sources: dated Opum fleet and prior-art inventory (opum-doc, Allowed, HEAD c9b6741, re-verified live unchanged since bee848a/846f054, 120 lines) used only for its 11 seeds as prompts; OCLI-3.3 task narrative (opum-doc, Allowed via migration ledger row OCLI-3.3->QCLI-2.3, HEAD c9b6741) read as the historical, unexecuted, do-not-activate content predecessor for AC-field vocabulary and first-release/deferred framing only -- no test, fixture, source organization, or algorithm exists in either (both are prose) and none was copied. Component charter, legacy reconciliation doc (QCLI-2.2), migration ledger, and source register cited read-only throughout; none edited.

Exit/result vocabulary is deliberately categorical (success / structured decline-or-conflict / structured error), not literal exit-code integers or a fixed JSON schema, since command vocabulary and exit-code conventions are QCLI-2.4's and later contract work's scope, not fixed here. Human-gate scenarios (BB-03/BB-04) test only the block/self-approval mechanism, not who counts as an accountable human/reviewer -- that actor-model question stays routed to quest-doc per the legacy reconciliation doc, unchanged here.

Gates (worktree root, after 'lore sync' run exactly once):
- lore check --strict --plain -> '20 files, 0 errors, 0 warnings' (exit 0)
- lore validate --strict --plain -> '20 files, 0 errors, 0 warnings, 6 skipped' (exit 0; skips are index.md/log.md, not concepts)
- lore orphans --plain -> '0 orphan tasks, 0 dangling links' (exit 0)

Note: 'lore sync' (real, run once) did NOT itself commit docs/ changes in this environment -- only its help text's 'commit backlog/' behavior fires when backlog/ is left dirty by lore link/unlink, which this task never ran. The regenerated docs/log.md, docs/reference/index.md, and the Story's managed task-status block were committed by this task as an ordinary commit (b4f0871), same discipline as any other doc change. Recording this as an observation for the orchestrator/other workers, not acted on beyond committing my own regenerated files.

No files owned by sibling tasks this wave (quest-cli-packaging-contract.md, quest-cli-research-source-register.md, legacy-opum-requirement-reconciliation-for-quest-cli.md, quest-cli-pre-implementation-research-program.md) were edited -- read-only citations only.
<!-- SECTION:NOTES:END -->
