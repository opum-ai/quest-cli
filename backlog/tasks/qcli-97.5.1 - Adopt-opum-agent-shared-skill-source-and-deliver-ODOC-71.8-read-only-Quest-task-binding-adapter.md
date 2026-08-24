---
id: QCLI-97.5.1
title: >-
  Adopt opum-agent shared skill source and deliver ODOC-71.8 read-only Quest
  task-binding adapter
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-24 14:13'
updated_date: '2026-08-24 15:23'
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

6. Controller salvage correction: replace internal adapter with the public quest task binding CLI surface, exact opum-agent-workflow envelope, minimal QuestTaskBindingV1, stable ABSENT/STALE/INCOMPATIBLE/STATE diagnostics, manifest/help exposure, AGENTS marker, and process/artifact tests.

7. Second fresh correction (dfa3cb89): public v1 stdout is the exact closed 14-key envelope; relationshipId is the accepted identity; claims replay full history with CAS/liveness/generation binding via real LocalClaimEvidence adapter; correlation state resolves only from repository-native versioned relationship records; holder/repository/base/settlement verified against authoritative evidence, never echoed.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validation: bun run check (typecheck, biome lint+format, layer check, repository-check-scope, package-artifact-delivery, bun test) all green: 197 pass / 0 fail. lore validate + lore check green (63 files, 0 errors). Marker doc created via lore new; AGENTS.md and campaign runbook rerouted to user-level skills. Adapter is library-level public contract re-exported from src/contract/tracker/index.ts; repo has no CLI command surface for consumer contracts, so no manifest/help entry applies.

Capability note: subagent delegation (implementation-planner, standards/spec reviewers) was denied by the session permission layer; Build primary performed direct grounding and self-review instead.

Salvage correction delivered: public quest task binding CLI command (contract opum-agent-workflow/v1), exact envelope (contract/supportedVersions/requestId-32hex/taskId) with strict INCOMPATIBLE rejection of unknown contract/version/extra fields, minimal QuestTaskBindingV1 record, claim liveness via public ClaimService replay, stable ABSENT/STALE/INCOMPATIBLE/STATE diagnostics, manifest+help exposure with closed-set golden update, AGENTS.md authority marker, provenance rebound to continuation 274b52ffa3194505b15cc7a094ec625e (cancelled correlation removed). bun run check green: typecheck, biome lint/format, layer check, repository-check-scope, package-artifact-delivery, bun test 217 pass/0 fail. lore check green (63 files, 0 errors). Diff secrecy scan clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered the corrected ODOC-71.8 public read-only task-binding surface: quest task binding --contract opum-agent-workflow/v1 --task <ref> --claim-or-correlation <id> --holder <id> --base <ref> --settlement <ref> --json returning the minimal QuestTaskBindingV1 envelope echo with selectedVersion=1; pure domain evaluator enforces in-progress task state, live-claim/accepted-correlation relationships, exact environment match, and the issuedAt-60s<=now<expiresAt (max 5m) freshness window with stable redacted diagnostics. Verified by 27 new domain/integration tests plus 5 process tests and the full bun run check suite (217 pass); lore check clean.
<!-- SECTION:FINAL_SUMMARY:END -->
