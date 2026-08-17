---
id: QCLI-97.1
title: Audit Backlog parity and Lore/Codex onboarding gaps
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 06:03'
updated_date: '2026-08-17 06:06'
labels:
  - quest-0.1
  - parity
  - audit
  - lore-integration
  - codex
  - 'doc:stories/deliver-quest-cli-0-1-0'
dependencies: []
documentation:
  - docs/runbooks/quest-cli-operations.md
  - docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md
parent_task_id: QCLI-97
priority: high
type: spike
ordinal: 115000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Establish the evidence and delivery decomposition needed to restore the promised Backlog.md parity (except separate document management) and first-class Lore/Codex project onboarding. This audit must treat the public Quest manifest as authoritative, not internal code or unreleased runbooks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The audit inventories Backlog.md 1.50.1 public commands and observable setup behaviors, excluding only the separate document-management group
- [x] #2 The audit compares that inventory with the Quest 0.1.0 published manifest and records reproducible evidence for every missing or divergent surface
- [x] #3 The audit verifies the current published Lore CLI tracker contract and identifies every Quest-to-Lore compatibility requirement, including the missing project and agent discovery path
- [x] #4 The audit proposes independently reviewable follow-up tasks, dependencies, and acceptance criteria without silently choosing product-policy exclusions
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Enumerate Backlog.md 1.50.1 public command groups and setup behavior from its CLI contract. 2. Enumerate Quest 0.1.0 public manifest and test observable behavior in a clean workspace. 3. Recheck published Lore CLI tracker-facing surfaces and agent/project setup mechanisms. 4. Record a versioned parity matrix with evidence, explicit divergence classification, and independently deliverable follow-up tasks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Public-contract audit completed against Backlog.md 1.50.1, Quest 0.1.0, and Lore CLI 0.3.2. The matrix records 9 advertised Quest commands against Backlog's 13 public groups (excluding doc), confirms missing init/help/agents/config and Lore backend selection, and proposes five independent delivery slices without selecting exclusions.

Published-Lore recheck: npm view @opum-ai/lore version returned 0.3.2, matching the locally exercised Lore CLI 0.3.2 public command surface.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed the versioned public-contract audit. The Lore reference maps Backlog.md 1.50.1 against Quest 0.1.0, identifies the bootstrap/help/agent/Lore-adapter gaps, and decomposes the remedial work into independently reviewable slices.
<!-- SECTION:FINAL_SUMMARY:END -->
