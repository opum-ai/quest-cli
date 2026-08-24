---
id: QCLI-97.5.1
title: >-
  Adopt opum-agent shared skill source and deliver ODOC-71.8 read-only Quest
  task-binding adapter
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-24 14:13'
updated_date: '2026-08-24 14:20'
labels:
  - quest-0.1
  - parity
  - lore-integration
dependencies: []
parent_task_id: QCLI-97.5
priority: high
type: feature
ordinal: 155000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ODOC-71.8 policy-adoption wave: record the immutable opum-agent shared skill source marker, replace active Treehouse routing in AGENTS and live runbooks with the canonical user-level skills, and add the public read-only opum-agent-workflow/v1 Quest task-binding adapter over public contracts only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marker doc records the exact opum-agent shared skill source path
- [x] #2 AGENTS.md and live agent-facing runbook routing reference user-level codex-worker/backlog-handover/opum-worktrees instead of Treehouse
- [x] #3 opum-agent-workflow/v1 adapter binds a task by id plus claim-or-correlation identity using only the public tracker contract
- [x] #4 Adapter enforces strict version/envelope diagnostics with typed outcomes
- [x] #5 Binding evidence carries revision/freshness fields and a deterministic digest
- [x] #6 Unit/contract tests cover binding, diagnostics, freshness, and digest determinism
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add marker doc; 2. Rewire AGENTS.md + runbook routing; 3. Implement src/contract/tracker/opum-agent-workflow.ts over QuestTrackerClient reads only; 4. Contract tests; 5. Checks, review, PR to dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validation: bun run check (typecheck, biome lint+format, layer check, repository-check-scope, package-artifact-delivery, bun test) all green: 197 pass / 0 fail. lore validate + lore check green (63 files, 0 errors). Marker doc created via lore new; AGENTS.md and campaign runbook rerouted to user-level skills. Adapter is library-level public contract re-exported from src/contract/tracker/index.ts; repo has no CLI command surface for consumer contracts, so no manifest/help entry applies.

Capability note: subagent delegation (implementation-planner, standards/spec reviewers) was denied by the session permission layer; Build primary performed direct grounding and self-review instead.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the immutable opum-agent shared skill source marker doc, rerouted AGENTS.md and the autonomous-campaign runbook from Treehouse to the canonical user-level skills, and delivered the read-only opum-agent-workflow/v1 Quest task-binding adapter over the public tracker contract with typed diagnostics, claim-or-correlation identity, revision/freshness evidence, deterministic SHA-256 digest, and 6 contract tests. Verified with bun run check (197 tests pass) and lore check (0 errors).
<!-- SECTION:FINAL_SUMMARY:END -->
