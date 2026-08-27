---
id: QCLI-122
title: Restore public CLI task-edit throughput at 10k scale for the paired release
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-27 00:39'
updated_date: '2026-08-27 01:57'
labels:
  - perf
  - quest-0.1
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
priority: high
type: task
ordinal: 154000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Deterministic red-first regression/performance contract covers repository write-path scan count and splice-revision equivalence
- [x] #2 Public CLI task edit semantics preserved: identity, actor gating, event/gate integrity, atomicity, search/filter behavior, Backlog parity contracts (full existing gates green)
- [x] #3 Measured before/after public-CLI throughput at representative scale recorded in task notes with method reproducible by script
- [x] #4 Exact rebuilt 0.2.7 candidate artifacts replace/annotate prior candidate evidence only when merged to dev; otherwise stale-candidate note recorded
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Baseline sequential edit timing on seeded 10k workspace from exact base 01456d7. 2. LocalTaskRepository.write: compute post-write revision via deterministic in-memory splice of locked current snapshot + round-tripped written payload; eliminate second full directory rescan; equivalence unit tests vs fresh readAll (key-order churn, drafts, archives, duplicate-guard fallback on id-miss). 3. TaskService: single-snapshot internal edit path consumed by CLI dispatch removing duplicate view+edit full scans while preserving public envelope byte-for-byte. 4. Optional warm fast path (.quest fastrevision sidecar, stat-walk verified, authoritative slow-path fallback) ONLY if A+B measured gain insufficient; independent slow-path equivalence tests mandatory. 5. Full bun run check gates + measure after + PR to dev; no publish.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FMC correlation 0b32ada7153b4a5d85b3d73ee8df7a45; release-blocking scale remediation ordered by opum-doc under policy_generation opencode-openrouter-glm-5.3-flash-2026-08-26-v2.

Replacement scope executed under FMC e1b5f4eab41a416ca0a93e78913287e8: durable sidecar/fingerprint cache REMOVED fail-closed per Controller rejection of 0b32ada7. Delivered public actor-bound seam 'quest task edit-batch' (JSONL ops file): one locked session performs entry CAS like a single write, per-item vocabulary fold against evolving pre-state (shared foldEditPatch module), sound incremental link validation (createTaskLinkSession) plus one post-batch validateTaskGraph assertion, atomic per-record renames, milestone-transition items deferred to ordinary single-edit planning transactions after release, structured per-item updated/error results with applied/failed/deferredCount and terminal revision.

Measured on darwin-arm64, 10k-task store: sequential single-edit CLI 46.2 ops/min at base 01456d7; final retained single edit 67.5 ops/min (splice-revision write + prepareMutation/editOn one-snapshot dispatch, byte-equivalence-tested); new batch seam 6509 ops/min (600/600 applied), i.e. remaining 90k ops complete in about 14 minutes versus roughly 17 hours. Deterministic red-first contract test/cli-task-edit-batch.test.ts gates >=1500 ops/min; repository scan-count and splice-revision equivalence tests in test/local-task-repository-write-path.test.ts.

Gates at PR #148 commit 4cf97cc: bun run check exit 0 (typecheck, biome lint, biome ci, layer check, repository-check-scope, package-artifact-delivery fixture) plus bun test 272 pass / 0 fail across 38 files; CI required checks all pass on 7 jobs (source-gates + six platform jobs). Packed-bits isolated install smoke on darwin-arm64 candidate tarballs from merged dev 11cb1a9f5f054019e1e6aa67eeea49089c1f24cb: quest init OK; edit-batch absent-reference error accounting verified (0 applied/2 failed before seeding), then created T-1 and batch applied=1 kind updated; manifest returns 43 commands with task edit-batch listed. AC4 satisfied via new durable candidate final-quest-11cb1a9 replacing prior final-quest-01456d7 lineage (root+6 platform tarballs, sha256.txt, package-metadata.json with recomputed sha512 SRI + sha1 shasum per package).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered public quest task edit-batch (JSONL ops file) locked-session executor: entry CAS like single write, per-item fold/validate/error accounting, atomic per-record writes, milestone items deferred to planning transactions, incremental link session closed by full graph assert, no sidecars. Measured at 10k-store: sequential baseline 46.2 ops/min -> retained single edit 67.5 -> batch 6509 ops/min (90k ops ~=14 min vs ~17h). CI checks green; PR #148 squash-merged to dev as 11cb1a9f5f054019e1e6aa67eeea49089c1f24cb; immutable candidate rebuilt.
<!-- SECTION:FINAL_SUMMARY:END -->
