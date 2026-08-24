---
id: QCLI-97.5.1
title: >-
  Adopt opum-agent shared skill source and deliver ODOC-71.8 read-only Quest
  task-binding adapter
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-24 14:13'
updated_date: '2026-08-24 18:08'
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
- [ ] #7 5
- [ ] #8 5
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add marker doc; 2. Rewire AGENTS.md + runbook routing; 3. Implement src/contract/tracker/opum-agent-workflow.ts over QuestTrackerClient reads only; 4. Contract tests; 5. Checks, review, PR to dev.

6. Controller salvage correction: replace internal adapter with the public quest task binding CLI surface, exact opum-agent-workflow envelope, minimal QuestTaskBindingV1, stable ABSENT/STALE/INCOMPATIBLE/STATE diagnostics, manifest/help exposure, AGENTS marker, and process/artifact tests.

7. Second fresh correction (dfa3cb89): public v1 stdout is the exact closed 14-key envelope; relationshipId is the accepted identity; claims replay full history with CAS/liveness/generation binding via real LocalClaimEvidence adapter; correlation state resolves only from repository-native versioned relationship records; holder/repository/base/settlement verified against authoritative evidence, never echoed.

8. Third fresh correction (be1306c8): opaque IDs hashed to fixed SHA-256 filenames with resolved-path containment; closed authoritative relationship schema validated at the adapter boundary; domain-level record.id===identity binding guard; stable redacted ABSENT/STALE/INCOMPATIBLE/STATE normalization for malformed JSON/JSONL, schema defects, undeclared actors, duplicate events, and replay failures.

9. Fourth fresh correction (aabec9ec): claim evidence reads the authoritative ClaimService layout .quest/claims/<canonical taskId>.jsonl (no hashing); symlink-safe containment via canonicalized root + per-component lstat with final regular-file check across relationship reads/writes, claim events, and actors; manifest task binding fields reduced to the exact closed 14-key public response set; debug residue removed.

10. Fifth fresh correction (27524798): authoritative evidence reads moved to revision-pinned Git-object seam (readBlob/listFiles on one immutable HEAD snapshot; no worktree FS access); production LocalClaimRepository adapter over the Git CAS/operation commit seam wired to ClaimService with true E2E claim/heartbeat/binding test plus stale-revision conflict coverage; blind relationship writer replaced by CAS writer (expectedRevision+operationId, conflict on stale); hostile-symlink tests prove pinned reads ignore worktree swaps.

11. Sixth fresh correction (3d31c74b): binding no longer touches the mutable worktree pre-snapshot — raw --task reference resolves entirely inside the pinned Git snapshot with authoritative taskState validation, duplicate-id/alias-collision/ambiguity rejection; production writeRaw backdoor removed (fixtures use real Git commands); LocalClaimRepository.append derives .quest/claims/<CanonicalId>.jsonl internally and rejects any other ownedPaths before commit; true ClaimService→CAS-relationship→binding E2E asserts the exact 14-key envelope.

12. Seventh bounded correction (42b4efaa): fixed broken duplicate-ID assertion to prove the stable workflow error through a real callable; E2E chain now creates the relationship via the production LocalTaskRelationshipCasWriter.write(); LocalClaimRepository read/append hardened with authoritative taskState/canonicalId validation, duplicate-id and alias-collision rejection, and internally derived sole owned claim path with unchanged-revision evidence on every malicious-path rejection.

13. Eighth test-adequacy correction (9c57f471): duplicate-ID and alias-collision read tests now seed full valid TaskState records and assert the discriminating RecordValidationError messages ('Duplicate canonical task id.' / 'Duplicate task alias.') plus the stable workflow-error mapping, with the separate malformed-record early-validation test retained.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validation: bun run check (typecheck, biome lint+format, layer check, repository-check-scope, package-artifact-delivery, bun test) all green: 197 pass / 0 fail. lore validate + lore check green (63 files, 0 errors). Marker doc created via lore new; AGENTS.md and campaign runbook rerouted to user-level skills. Adapter is library-level public contract re-exported from src/contract/tracker/index.ts; repo has no CLI command surface for consumer contracts, so no manifest/help entry applies.

Capability note: subagent delegation (implementation-planner, standards/spec reviewers) was denied by the session permission layer; Build primary performed direct grounding and self-review instead.

Salvage correction delivered: public quest task binding CLI command (contract opum-agent-workflow/v1), exact envelope (contract/supportedVersions/requestId-32hex/taskId) with strict INCOMPATIBLE rejection of unknown contract/version/extra fields, minimal QuestTaskBindingV1 record, claim liveness via public ClaimService replay, stable ABSENT/STALE/INCOMPATIBLE/STATE diagnostics, manifest+help exposure with closed-set golden update, AGENTS.md authority marker, provenance rebound to continuation 274b52ffa3194505b15cc7a094ec625e (cancelled correlation removed). bun run check green: typecheck, biome lint/format, layer check, repository-check-scope, package-artifact-delivery, bun test 217 pass/0 fail. lore check green (63 files, 0 errors). Diff secrecy scan clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Seventh bounded correction delivered: duplicate-ID test rewritten to assert the stable OPUM_WORKFLOW_QUEST_INCOMPATIBLE error through a real callable (broken allSettled/undefined expression removed and proven in full suite); E2E chain made fully real — ClaimService claim+heartbeat → pinned snapshot → relationship via production LocalTaskRelationshipCasWriter.write() → binding asserting live claim and exact result; LocalClaimRepository read now validates every committed task through authoritative taskState with duplicate-id and alias-collision rejection, append validates canonicalId() (rejecting AGENTS.md/foo/arbitrary/T-0/T-01/wrong types) and derives the sole owned path internally with unchanged-revision evidence on every rejection. bun run check green (246 tests), lore check green, git diff --check clean, CI run 32759435482 all seven jobs success.
<!-- SECTION:FINAL_SUMMARY:END -->
