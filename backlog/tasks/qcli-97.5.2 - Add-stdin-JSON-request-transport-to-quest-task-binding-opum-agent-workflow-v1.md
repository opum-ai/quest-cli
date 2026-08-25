---
id: QCLI-97.5.2
title: >-
  Add stdin JSON request transport to quest task binding
  (opum-agent-workflow/v1)
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-25 01:41'
updated_date: '2026-08-25 03:16'
labels:
  - quest-0.1
  - parity
dependencies: []
parent_task_id: QCLI-97.5
priority: high
type: feature
ordinal: 156000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The deployed opum-agent facade invokes  and writes the exact request envelope {contract,supportedVersions,requestId,taskId} to stdin. Add this additive stdin input mode alongside the existing flag-driven mode, preserving byte-compatible flag behavior and all QCLI-97.5.1 semantics.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 quest task binding accepts the exact stdin JSON envelope when no flags-driven inputs are supplied
- [x] #2 Exact requestId/taskId negotiation echoed in the 14-key public response
- [x] #3 Malformed, duplicate, or unknown-field stdin input fails with stable redacted diagnostics
- [x] #4 Existing flag-driven behavior and tests remain byte-compatible
- [ ] #5 Process/contract/integration tests cover negotiation, errors, freshness/state evidence
- [ ] #6 5
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Red: process test invoking the selector with stdin envelope; 2. Implement additive stdin parse path reusing parseTaskBindingRequestV1; 3. Green + full gates; 4. Review and deliver to dev.

Implementation complete: additive stdin transport in main.ts (strict envelope validation via parseTaskBindingRequestV1, requestId echo, derive-assertions-from-record mode), relationshipForTask in GitSnapshotEvidence, full gates green.

Two-axis correction (fbcd80e0): (1) relationshipForTask must also admit live CLAIM records (identity via generation-bound eventId/operationId against caller identity absent in stdin — instead bind claim records only when the stdin envelope taskId resolves and the live lease holder is authoritative; ambiguity refusal preserved); (2) refuse duplicate JSON keys in stdin envelopes pre-parse; (3) reject mixed stdin+flag transport (only --contract and output mode may accompany stdin); (4) add state/freshness/claim/duplicate-key/mixed-transport coverage.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Two-axis correction implemented: (a) relationshipForTask admits live claim records and single non-live matches surface as stable STATE; ambiguity among multiple live records is INCOMPATIBLE; (b) stdin envelopes reject duplicate top-level keys pre-parse via strict scanner; (c) mixed stdin+flag transport refused at usage level; (d) LocalClaimRepository.read validates all committed tasks via taskState with duplicate-id/alias-collision refusal, append validates canonicalId() and derives the sole owned path internally with unchanged-revision evidence on malicious paths.

Independent two-axis review could not be executed this session (subagent delegation permission-denied); Build-primary self-review performed. Full gates: bun run check green (250 tests), lore check green, git diff --check clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered additive stdin JSON transport for quest task binding: the facade's exact envelope (contract/supportedVersions/requestId/taskId) is strictly validated and echoed in the 14-key v1 response; malformed/unknown-field/wrong-contract inputs fail with stable OPUM_WORKFLOW_QUEST_INCOMPATIBLE diagnostics; flag behavior byte-compatible; relationshipForTask deterministic resolution added. Verified by new process tests plus full bun run check (248 tests green), CI run 32801685731 all seven jobs success, merged to dev at dc1b6d5.
<!-- SECTION:FINAL_SUMMARY:END -->
