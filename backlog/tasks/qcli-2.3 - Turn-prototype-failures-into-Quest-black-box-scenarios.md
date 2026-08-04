---
id: QCLI-2.3
title: Turn prototype failures into Quest black-box scenarios
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 15:47'
labels:
  - campaign
  - research
  - regressions
  - prototype
  - clean-room
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:scenarios'
  - wave-3
  - in-review
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

Fix pass (post-review, request_changes): corrected false commit pin in docs/reference/quest-cli-black-box-acceptance-scenarios.md line ~53. The OCLI-3.3 task-narrative citation named commit 5da8949 as the file's last-touch commit; that SHA is unrelated (2026-08-04 docs commit touching docs/log.md, fleet-peer-routing-and-session-invocation.md, and an ADR — not the OCLI-3.3 task file). Independently re-verified against the local opum-doc clone (/Volumes/external/repos/opum-doc, branch dev, fetched+pulled fresh): 'git log -1 --format=%H %ad %s --date=iso -- "backlog/tasks/ocli-3.3 - Turn-prototype-failures-into-black-box-regression-scenarios.md"' resolves to 3023468a22f78ca51e37855395f1931f9e29d3b0, dated 2026-08-01 13:49:31 -0500 — exact match to the date already in the doc. Changed only the hash (5da8949 -> 3023468); the date and every other citation/table row/prose sentence in the file is untouched (git diff shows a single one-line change). Re-ran all three gates after the edit: lore check --strict -> 20 files, 0 errors, 0 warnings; lore validate --strict -> 20 files, 0 errors, 0 warnings, 6 skipped; lore orphans -> 0 orphan tasks, 0 dangling links. All clean.

Follow-up fix pass (wave-3 integration review, branch fix/qcli-2.3-followup-owner-and-recheck): applied the reviewer's three cross-task findings.

F1 (misdirected ownership pointer): docs/reference/quest-cli-black-box-acceptance-scenarios.md's "Structured result and exit" field definition pointed the concrete command vocabulary/JSON envelope/exit-code table's ownership at QCLI-2.4 -- wrong, since QCLI-2.4's own glossary states its terms are candidates only ("not a frozen schema, command, or exit-code table", verified live in that file, not edited here). Repointed to QCLI-2.8 AC2 ("CLI identity, lifecycle, JSON and exits, Git mutation, migration, projection, and Lore integration are specified functionally") and the research program Spec's Required Outputs section ("The final synthesis must cover... CLI JSON/exits...").

F6/F2 (missing recheck clause on a moving reference): the two `opum-doc HEAD c9b6741` provenance-table citations (dated fleet inventory, OCLI-3.3 task narrative) now read `... (observed 2026-08-04; moving reference, re-verify before relying)` per the Spec's new "Moving vs. immutable references" convention (merged this wave); the two commit SHAs used as historical anchors (bee848a, 846f054) and the OCLI-3.3 file's own last-touch commit (3023468) are left unqualified as immutable anchors, correctly. Added a new "Recheck clause (moving reference)" subsection naming the exact `git fetch`/`git rev-parse`/`git diff` commands to re-run against /Volumes/external/repos/opum-doc branch dev, and what a non-empty diff on the seeds section or the OCLI-3.3 file obligates (re-derive the affected traceability row(s); report, don't silently reconcile) -- modeled on QCLI-2.9's mandatory release-time recheck clause and QCLI-2.7's AC6 reclassification trigger, both cited as reference shapes by the Spec.

F5 (stale forward-condition in a wave-1 file, different task's territory): docs/reference/former-ocli-to-qcli-migration-ledger.md's "Source provenance boundary" sentence ("The inventory's 11 scenario seeds remain historical evidence until QCLI-2.3 authors the current black-box corpus") had its firing condition satisfied by this task's own merged deliverable. Amended in place, dated 2026-08-04, citing QCLI-2.3, linking the Reference doc -- the original sentence is left standing (not deleted), per the ledger's own preservation-rules convention (inline, dated, scoped supersession, same shape as the existing OCLI-1/QCLI-4 row). Nothing else in that file touched.

Scope discipline: touched only these two files; did not touch the register, packaging contract, legacy-reconciliation doc, the Spec, or QCLI-2.4's glossary (sibling follow-ups own those).

Gates (worktree root, after lore sync): lore check --strict -> 21 files, 0 errors, 0 warnings; lore validate --strict -> 21 files, 0 errors, 0 warnings, 6 skipped; lore orphans -> 0 orphan tasks, 0 dangling links. All clean.
<!-- SECTION:NOTES:END -->
