---
id: QCLI-97
title: 'Restore Quest parity, project bootstrap, and Lore/Codex integration'
status: To Do
assignee: []
created_date: '2026-08-17 06:03'
updated_date: '2026-08-17 06:05'
labels:
  - quest-0.1
  - parity
  - lore-integration
  - codex
  - 'doc:stories/deliver-quest-cli-0-1-0'
dependencies: []
documentation:
  - docs/stories/deliver-quest-cli-0-1-0.md
  - docs/runbooks/quest-cli-operations.md
  - docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md
priority: high
type: feature
ordinal: 114000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Restore the promised Backlog.md parity, excluding only separate document management, and deliver first-class Quest project bootstrap plus Lore/Codex integration. The released 0.1.0 manifest exposes only tracker commands: it lacks project initialization, instructions, agent integration, help discovery, and most Backlog public groups. The public contract, not unreleased internals, is the baseline.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A versioned parity matrix maps every Backlog.md public command and relevant behavior except the separate document-management group to Quest as implemented, intentionally different with rationale, or missing
- [ ] #2 Quest provides a safe project initialization and discovery workflow, including explicit workspace configuration and opt-in agent instruction integration that never overwrites unmanaged user content
- [ ] #3 The published CLI provides a discoverable help/instructions surface and its manifest accurately advertises every supported public command
- [ ] #4 Lore CLI integration is qualified against the supported published Lore release for task discovery, read/write result envelopes, actor declarations, and managed Story-to-task synchronization
- [ ] #5 Every parity gap is either implemented with automated conformance coverage or explicitly deferred by an owner-approved, documented exclusion
<!-- AC:END -->
