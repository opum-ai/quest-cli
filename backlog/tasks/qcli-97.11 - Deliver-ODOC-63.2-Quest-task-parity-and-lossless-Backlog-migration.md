---
id: QCLI-97.11
title: Deliver ODOC-63.2 Quest task parity and lossless Backlog migration
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-21 19:45'
updated_date: '2026-08-21 20:25'
labels:
  - odoc-63.2
dependencies: []
parent_task_id: QCLI-97
priority: high
type: feature
ordinal: 147000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Feature parent for the ODOC-63.2 JIT feature-wayfinding campaign: deliver the complete confirmed Quest side of Quest/Lore/Backlog tracker parity — a public schema-1 task projection with full CLI/manifest coverage, create/edit/list/view/search/status-flow semantics, and a lossless multi-pass Backlog task/milestone migration (aliases, configured vocabularies, digest-bound preview/apply/status/rollback, resumability/idempotency, relationship closure, source immutability). Lore-owned knowledge adoption and archive/delete are out of scope; publication is a later campaign. Grounding: opum-doc dev merge 995b966e8a2bb044c94b5defccbeb06f6cf89c85 (docs/stories/ship-the-lore-and-quest-tracker-parity-release.md, docs/specs/lore-quest-tracker-parity-adoption-and-paired-release-architecture.md, docs/adr/keep-lore-as-documentation-authority-and-quest-as-task-authority.md); canonical adapted capability at opum-doc .treehouse/opum-doc-811ba3/3/opum-doc/tooling/codex-skills/feature-wayfinding/SKILL.md (read-only).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A local feature parent exists with sharp child issues created through Backlog CLI and native dependencies wired before execution
- [ ] #2 The public schema-1 task projection and CLI/manifest cover IDs/aliases/lifecycle/status, title/description, labels/assignees, priority/type/ordinal/dates, parent/dependencies/milestone with atomic forward/back references, ordered checked AC/DoD, plan/notes/comments/final summary, references/modified files, and Lore documentation references only
- [ ] #3 Create/edit/list/view/search/status-flow semantics include replace/add/remove/clear, deterministic ordering, case-insensitive configured statuses, actor-required atomic writes, stable versioned JSON diagnostics, and fail-loud compatibility
- [ ] #4 Lossless multi-pass Backlog task/milestone migration preserves aliases and configured vocabularies with digest-bound preview/apply/status/rollback, resumability/idempotency, relationship closure, and source immutability; no Lore-owned knowledge adoption or archive/delete is implemented here
- [ ] #5 Focused tests, full repository checks, installed-package/packaging validation, strict Lore gates, and exact-tree two-axis review pass before PR to dev
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
JIT DAG: .1 reconcile -> .2 schema/projection/manifest contract -> .3 CLI semantics -> .4 migration mapping/provenance/closure -> .5 qualify/review/deliver.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Materialized in leased worktree per opum-doc review-correction ad7dd9c69be34f12bcc1208e0215f9d9 finding 1: primary-copy artifacts were untracked; this tree is the execution tree of record. Scope de-overlap: .2 owns schema/projection/manifest contract; .3 owns CLI replace/add/remove/clear, case-insensitive statuses and relationship writes; .4 owns migration mapping/provenance/closure.

2026-08-21: feature-wayfinding gate feature-wayfinding-v2 (correlation 1cdd200728ec4d8c8e3342f8a2d235c4, replacement for cancelled ad7dd9c69be34f12bcc1208e0215f9d9). First-action attestation repeated for this exact correlation in authoritative local FMC presence (no interim fmc_reply): scope policy-adoption; policy_generation opencode-qwen-2026-08-20-v4-spike1; runtime opencode; model spark/qwen3.8-27b-routine; primary agent build variant medium; six named nonrecursive lanes [lore-context, explore, implementation-planner, standards-reviewer, spec-reviewer, verify]; four required skills [codex-worker, backlog-handover, treehouse-worktrees, lore]; three Lore profiles [implementation, review, verification]; exact pane/native session recorded in presence metadata; primary_checkout=false; lease 9c21bd6372aa34e7490d37d93df4eade holder quest-cli-odoc-63.2; worktree /Volumes/external/repos/quest-cli/.treehouse/quest-cli-40ae4d/1/quest-cli; branch feat/qcli-97.10-odoc-63.2-parity-migration pinned at base e700c3ebf613db1dfc8645d37bb43cba1ad23e24; source-clean proof before correction: git status showed only the six untracked QCLI-97.11.x Backlog artifacts created under the accepted predecessor correlation (no tracked-file modifications), HEAD e700c3ebf613db1dfc8645d37bb43cba1ad23e24.

Gate corrections executed via Backlog CLI in this tree: (1) QCLI-97.11.1 AC #4 now names QCLI-97.11. (2) Each child .1-.5 declares concrete mutually exclusive repository:path ownership in its description: .1 reconciliation evidence only (its own task artifact); .2 domain/schema/projection/manifest persistence and atomic relationship invariants (src/domain/tasks/tasks.ts, src/contract/tracker/index.ts, src/application/command-contract.ts, test/integration/tasks/tasks.test.ts, test/integration/projection/sqlite-projection.test.ts, test/contract/tracker, test/contract/command-contract.test.ts); .3 CLI argument parsing, command dispatch, and command-facing diagnostics only, no relationship persistence/writes (src/application/tasks, src/application/mutations, test/cli-local-task-repository.test.ts, test/integration/tasks/cli-semantics.test.ts, test/contract/cli-process.test.ts); .4 migration mapping/provenance/closure (src/application/migration, test/integration/migration); .5 qualification/delivery evidence only (its own task artifact).

Gate receipt: node tooling/codex-skills/feature-wayfinding/scripts/validate-feature-map.mjs /var/folders/lf/1qgs5_xd7js_y63j1_5jhwk00000gn/T/opencode/feature-map-qcli-97.11.json from the leased worktree exit=1 with exactly four findings and no ownership-overlap or unqualified-id findings: (a) x3 "cannot load claimed workspace manifest .lore/workspaces/opum-fmc-workers.json: ENOENT" — the quest-cli repository does not carry the opum-fmc-workers workspace manifest (it lives only in the opum-doc Controller checkout; quest-cli has no .lore/workspaces directory), so the validator cannot resolve the claimed controlling concepts from this repository; (b) x3 "cross-repository map lacks controlling Story/Spec/ADR evidence" — direct consequence of (a). The same validator run against the Controller fixture corrected-exclusive-ownership.json from the opum-doc checkpoint tree prints "feature-wayfinding gate passed" exit=0, proving the validator itself is functional and the failure is the cross-repository manifest resolution gap, not a map defect. Per the gate instruction, stopping before source mutation on the exact blocker: the workspace manifest cannot resolve the controlling concepts from the quest-cli execution tree.

2026-08-21: feature-wayfinding gate feature-wayfinding-v2-opum-doc-cwd PASSED (correlation 7367a69f5211440aba510a1b06bce17a, successor to blocker reply 1cdd200728ec4d8c8e3342f8a2d235c4). First-action attestation repeated for this exact correlation in authoritative local FMC presence (no interim fmc_reply): scope policy-adoption; policy_generation opencode-qwen-2026-08-20-v4-spike1; runtime opencode; model spark/qwen3.8-27b-routine; primary agent build variant medium; six named nonrecursive lanes [lore-context, explore, implementation-planner, standards-reviewer, spec-reviewer, verify]; four required skills [codex-worker, backlog-handover, treehouse-worktrees, lore]; three Lore profiles [implementation, review, verification]; exact pane/native session in presence metadata; primary_checkout=false; lease 9c21bd6372aa34e7490d37d93df4eade holder quest-cli-odoc-63.2 (no new lease allocated); worktree /Volumes/external/repos/quest-cli/.treehouse/quest-cli-40ae4d/1/quest-cli; branch feat/qcli-97.10-odoc-63.2-parity-migration pinned at base e700c3ebf613db1dfc8645d37bb43cba1ad23e24; source-clean proof before gate re-run: git status showed only the six untracked QCLI-97.11.x Backlog artifacts (no tracked-file modifications), HEAD e700c3ebf613db1dfc8645d37bb43cba1ad23e24.

Gate receipt: cd /Volumes/external/repos/opum-doc/.treehouse/opum-doc-811ba3/3/opum-doc && node tooling/codex-skills/feature-wayfinding/scripts/validate-feature-map.mjs /var/folders/lf/1qgs5_xd7js_y63j1_5jhwk00000gn/T/opencode/feature-map-qcli-97.11.json -> "feature-wayfinding gate passed" exit=0. Map sha256 9ec7761c29922e0860f2190ba125fb0c2f44ee21fec3c36ca4ca0e1bb700316f. The actual task-derived map (regenerated from corrected QCLI-97.11/.1-.5 declarations) passed with the three qualified opum-doc concepts (Story opum-doc::stories/ship-the-lore-and-quest-tracker-parity-release, Spec opum-doc::specs/lore-quest-tracker-parity-adoption-and-paired-release-architecture, ADR opum-doc::adr/keep-lore-as-documentation-authority-and-quest-as-task-authority) and every corrected ownership surface; no fixture used as evidence; no manifest published/copied/symlinked/committed into quest-cli; read-only cross-repository validation only.
<!-- SECTION:NOTES:END -->
