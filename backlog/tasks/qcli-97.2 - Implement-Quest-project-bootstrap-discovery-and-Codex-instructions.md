---
id: QCLI-97.2
title: 'Implement Quest project bootstrap, discovery, and Codex instructions'
status: To Do
assignee: []
created_date: '2026-08-17 06:06'
updated_date: '2026-08-17 06:07'
labels:
  - quest-0.1
  - parity
  - bootstrap
  - codex
  - 'doc:stories/deliver-quest-cli-0-1-0'
dependencies: []
documentation:
  - docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md
  - docs/stories/deliver-quest-cli-0-1-0.md
parent_task_id: QCLI-97
priority: high
type: feature
ordinal: 116000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Deliver the missing public project-bootstrap and agent-discovery path identified by QCLI-97.1. This includes init, workspace configuration/discovery, help/instructions/completion, and opt-in managed Codex instruction integration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 quest init safely creates or discovers an explicit workspace configuration and rejects ambiguous or unmanaged pre-existing state without overwriting it
- [ ] #2 quest provides versioned help, instructions, and shell completion for every public command, and the manifest advertises the same surface
- [ ] #3 Opt-in agent integration writes a managed Quest block to supported instruction files while preserving user-authored content and supports drift checking
- [ ] #4 Clean-workspace and upgrade tests cover initialization, reinitialization, discovery, and Codex agent guidance
<!-- AC:END -->
