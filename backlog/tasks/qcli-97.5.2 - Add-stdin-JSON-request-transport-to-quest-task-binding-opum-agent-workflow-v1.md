---
id: QCLI-97.5.2
title: >-
  Add stdin JSON request transport to quest task binding
  (opum-agent-workflow/v1)
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-25 01:41'
updated_date: '2026-08-25 02:30'
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
- [ ] #1 quest task binding accepts the exact stdin JSON envelope when no flags-driven inputs are supplied
- [ ] #2 Exact requestId/taskId negotiation echoed in the 14-key public response
- [ ] #3 Malformed, duplicate, or unknown-field stdin input fails with stable redacted diagnostics
- [ ] #4 Existing flag-driven behavior and tests remain byte-compatible
- [ ] #5 Process/contract/integration tests cover negotiation, errors, freshness/state evidence
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Red: process test invoking the selector with stdin envelope; 2. Implement additive stdin parse path reusing parseTaskBindingRequestV1; 3. Green + full gates; 4. Review and deliver to dev.

Implementation complete: additive stdin transport in main.ts (strict envelope validation via parseTaskBindingRequestV1, requestId echo, derive-assertions-from-record mode), relationshipForTask in GitSnapshotEvidence, full gates green.
<!-- SECTION:PLAN:END -->
