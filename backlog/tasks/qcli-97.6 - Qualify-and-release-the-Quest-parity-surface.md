---
id: QCLI-97.6
title: Qualify and release the Quest parity surface
status: To Do
assignee: []
created_date: '2026-08-17 06:07'
updated_date: '2026-08-17 16:26'
labels:
  - quest-0.1
  - parity
  - release
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies:
  - QCLI-97.2
  - QCLI-97.3
  - QCLI-97.4
  - QCLI-97.5
  - QCLI-97.7
  - QCLI-108
documentation:
  - docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
parent_task_id: QCLI-97
priority: high
type: task
ordinal: 120000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Perform final clean-room and cross-product qualification for the restored Quest parity surface, then record release truth. This task does not authorize a registry publication on its own.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A clean install exposes the complete approved parity manifest, help/instructions, and agent onboarding without relying on repository-local internals
- [ ] #2 Qualification covers public parity commands, migration of existing Quest workspaces, all native packages, and real Lore adapter conformance
- [ ] #3 Release truth records the supported Backlog and Lore versions, accepted exclusions, source commit, platform artifacts, and verification results
- [ ] #4 Publication, if a version change is required, occurs only under separate explicit owner authorization
<!-- AC:END -->
