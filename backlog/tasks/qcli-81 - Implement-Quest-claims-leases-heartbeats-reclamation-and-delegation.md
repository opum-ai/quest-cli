---
id: QCLI-81
title: 'Implement Quest claims, leases, heartbeats, reclamation, and delegation'
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 20:01'
labels:
  - quest-0.1
  - 'wave:core'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-80
documentation:
  - >-
    docs/adr/bound-claims-with-leases-evaluated-against-the-evaluator-s-own-clock.md
  - docs/specs/quest-cli-functional-requirements.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/domain/claims/
  - src/application/claims/
  - test/integration/claims/
priority: high
type: feature
ordinal: 99000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement authored ownership claims independently of task status. Lease validity is derived from event history and the evaluator's clock; renewals and delegation are generation-scoped and preserve accountability.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 At most one live lease exists for a canonical task regardless of the identifier form used
- [x] #2 The default lease is 30 minutes with a 5-minute heartbeat and both values are configuration-validated
- [x] #3 Renewal is scoped to the exact lease generation and a stale heartbeat cannot extend a newer holder's claim
- [x] #4 Reclamation appends a new event and preserves the expired holder, timing, and generation history
- [x] #5 Delegated agents require their accountable human and every concurrency or clock anomaly is surfaced deterministically
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define the claims domain and configuration validation in the dedicated claims paths, retaining immutable lease-generation history.
2. Add claim application use cases that resolve canonical task identifiers and enforce evaluator-clock, heartbeat, reclamation, delegation, and anomaly rules through the mutation kernel.
3. Add focused integration coverage for lease exclusivity, configuration, stale renewals, reclamation, delegation, and deterministic anomalies; run targeted and repository checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Independent review found non-monotonic claim histories were not surfaced; fixed in 4c25cde with deterministic clock-regression and early-reclamation anomalies. Verified targeted claims suite (6 pass), full suite previously 51 pass before cumulative changes, typecheck, layer check, source-scoped Biome, and diff check.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented dedicated claim/lease domain and application services with canonical alias resolution, validated defaults, generation-scoped heartbeat/delegation, immutable reclaim history, evaluator-clock status, and deterministic anomaly reporting. Reviewed and verified with focused integration coverage.
<!-- SECTION:FINAL_SUMMARY:END -->
