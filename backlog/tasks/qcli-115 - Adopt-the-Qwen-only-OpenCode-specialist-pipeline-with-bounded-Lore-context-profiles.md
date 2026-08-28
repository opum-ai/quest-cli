---
id: QCLI-115
title: >-
  Adopt the Qwen-only OpenCode specialist pipeline with bounded Lore context
  profiles
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-20 12:29'
updated_date: '2026-08-21 01:45'
labels:
  - fmc
  - opencode
  - qwen
  - lore
  - subagents
  - permissions
dependencies: []
priority: high
type: enhancement
ordinal: 141000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
quest-cli slice of opum-doc ODOC-63.1. Expose nonempty task-scoped Lore profiles for the implementation, review, and verification OpenCode specialists, plus the minimal repository context those configured Qwen-only specialists need, so a Worker can load the Lore skill and retrieve a bounded profile without an unexpected approval prompt. Bounded adoption-only scope: does not resume the paused broad backlog campaign, does not run the retired Nemotron/routine/review aliases, and makes no product-code change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The quest-cli Lore bundle exposes specialist agent profiles .lore/agents/implementation.toml, review.toml, and verification.toml (schema_version 1, kind specialist, bounded max_tokens) whose pinned plus ranked sources reach specs/quest-cli-architecture, adr/keep-lore-optional-and-integrate-only-through-versioned-public-records, reference/quest-cli-component-contracts-and-delivery-graph, runbooks/quest-cli-operations, and stories/harden-and-qualify-quest-cli-0-2-x, with the focused task reachable through lore agent context --task
- [x] #2 Every profile validates via lore agent list/show and compiles through lore agent context with reported digest, token estimate, and truncation state; if the installed lore 0.3.2 whole-document empty-body defect causes an empty pack, that exact defect is recorded in the task as a cross-repository lore-cli residual instead of hidden
- [x] #3 Regenerated repository context (lore agent bridge) exposes the committed profiles as the specialist opt-in without adding secrets, broad permissions, or retired Nemotron/routine/review agent aliases
- [x] #4 Gates pass in the isolated lease tree with zero product-source change: lore check --strict, bun run check, bun run check:packages, git diff --check, while the primary dev checkout dirty state (status digest 2a6d0ee9454a6c6c6d3b0200ebf962bbd3889cafb4b470be98c913b6e0925c7e) is preserved byte-for-byte
- [x] #5 Delivery is non-force via PR to origin/dev and squash-merged after required checks; QCLI-115 settles with evidence, the Treehouse lease 9dde8a9559eb35480f5c1226b51953fa returns via --if-lease-id/--if-lease-holder fencing, and the three-layer post-audit is clean
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1) Author .lore/agents/implementation.toml, review.toml, verification.toml (schema_version 1, specialist, bounded max_tokens) pinning the architecture spec plus the governing Lore ADR and ranking component contracts, the operations runbook, and the active 0.2.x Story as sources. 2) Prove validity (lore agent show) and compile packs (lore agent context), recording digest/tokens/truncation; attribute any empty pack to the documented lore-cli 0.3.2 whole-doc defect as a cross-repo residual. 3) Regenerate the Lore agent bridge so repository context exposes the profile opt-in. 4) Run lore check --strict and the repository checks (bun run check, check:packages) with zero product-code change. 5) Deliver non-force via PR to origin/dev, settle the task, and return the Treehouse lease with identity fencing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ordered by FMC correlation 4504f830339d4edc91d3b409d0ea2349 (policy_generation opencode-qwen-2026-08-20-v1, scope policy-adoption, controller_task ODOC-63.1); supersedes cancelled quest correlation 288b1b323e4f4f4c8404355e1a7d3dac, which superseded cancelled 59694356ea244e379c3b1248ba3a4bba. Paused QCLI-97.5/97.6/98 and doc-8 campaign preserved untouched. No publish, no main promotion.

2026-08-20 (correlation 84c6692975eb4e77966c415a995d860a, policy opencode-qwen-2026-08-20-v4-spike1): execution resumed in leased worktree .treehouse/.treehouse/quest-cli-40ae4d/1/quest-cli on feat/qcli-115-opencode-qwen-lore-adoption. Worktree rebased from 044e87d to pinned base 019e2ee via rebase --autostash; the sole tracked dirty file (.lore/config.toml) was byte-identical to the integrated dev state (diff sha256 0df3eb73cf3a3d2ab229fd924dc65a656e94e6071f8c024ce4e6b94f2aed0dee both sides), so the hunk is a no-op and nothing unique was lost. Unique untracked artifacts preserved: this task record (sha256 ac7906b7f71543da978d1301e280956dd4e762fd51300a1e75e79dffd2069b0c) and .lore/agents/{implementation,review,verification}.toml. lore agent list/show validates all three profiles; lore agent context compiles non-empty packs for all three (implementation ~48KB, review ~40KB, verification ~36KB at the stated budgets) with digests and truncation states reported; no empty-body defect observed with the fleet-pinned lore binary.

AC2 evidence (fleet-pinned lore binary /Volumes/external/repos/opum-doc/.herdr/opencode-runtime/bin/lore, not PATH 0.3.2): lore agent list -> 'agent profiles: 3' with all three named; lore agent show implementation -> budget 12000, path .lore/agents/implementation.toml, pinned specs/quest-cli-architecture + adr/keep-lore-optional..., sources listed, delegates none. lore agent context <profile> --task 'Adopt the Qwen-only OpenCode specialist pipeline...' compiled non-empty packs for all three: implementation ~48036 bytes (pinned architecture spec digest sha256:58af65a63635a79ed1a7e84fd966bae52e84ae4b64c3739a92d83f807b98208a in pack; catalog shows per-source selection/truncation states incl. omitted-by-budget entries), review ~39893 bytes, verification ~35937 bytes. No empty-body defect observed; no cross-repo residual needed.

Settlement evidence (correlation 84c6692975eb4e77966c415a995d860a): PR #132 squash-merged to origin/dev as 8c35b9eb4ed7fac73874a6cda941b1f3476d659a (Refs: QCLI-115 trailer parseable on the merged commit). Independent two-axis review approved (standards + spec axes; fallback single-pass reviewer also approve, zero blocking findings). Independent verify re-ran all gates in the lease tree: lore check --strict 0 errors; lore agent list/show x3 specialist profiles bounded; bun run check pass (166 tests, 0 fail); bun run check:packages pass; git diff --check clean; zero product-source delta (src/test/scripts empty base..head); .lore/config.toml blob identical base vs head. AC3 disposition: no separate generated-bridge file exists in this repository — the committed .lore/agents/*.toml profiles ARE the specialist opt-in surface exposed by the Lore agent bridge (verified via lore agent list/show/context with the fleet-pinned binary), and the added content introduces no secrets, broad permissions, or retired aliases.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Adopted the Qwen-only OpenCode specialist pipeline: committed .lore/agents/{implementation,review,verification}.toml (schema_version 1, kind specialist, bounded budgets 12000/10000/9000) whose pinned+sources reach the architecture spec, governing Lore ADR, component contracts, operations runbook, and active 0.2.x Story; versioned the QCLI-115 Backlog record. Verified with lore agent list/show/context (non-empty packs, fleet-pinned binary), lore check --strict (0 errors), bun run check + check:packages (pass), git diff --check (clean), zero product-source delta. Delivered non-force via PR #132 squash-merged to origin/dev as 8c35b9e; lease returned with ID/holder fencing.
<!-- SECTION:FINAL_SUMMARY:END -->
