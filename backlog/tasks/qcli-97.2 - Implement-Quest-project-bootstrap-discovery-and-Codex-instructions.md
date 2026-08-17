---
id: QCLI-97.2
title: 'Implement Quest project bootstrap, discovery, and Codex instructions'
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-17 06:06'
updated_date: '2026-08-17 13:18'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reuse the existing QCLI-78 workspace initializer behind a public init command with structured diagnostics. 2. Add versioned help, instructions, completion, and manifest registration from a shared command specification. 3. Add an opt-in managed agent-instruction writer/checker that preserves non-managed content. 4. Add clean-workspace, reinitialization, drift, subprocess, and packed-artifact coverage.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner approved product-code implementation on 2026-08-17. QCLI-97 requires Backlog-compatible parity except separate document management; initial design exploration is underway.

Exploration found QCLI-78 workspace initialization already implemented but unexposed in src/application/workspaces/workspaces.ts and src/adapters/workspaces/local-workspaces.ts. Shared routing hotspots src/cli/main.ts and src/application/command-contract.ts will be integrated serially.

Managed AGENTS.md instruction core committed and integrated at 2c835ea43e9eb8641a068cfe4ae8d62e4e5ca166. Nine focused agent/workspace tests plus typecheck, Biome, and diff checks passed. Public init, agents, instructions, completion, help, and manifest routing remains serialized.

Serialized public discovery/bootstrap wiring committed at bea587e5412c108ed1af61c3ef659a259e59877e with manifest entries and contract coverage for help, instructions, completion, init, and agents. End-to-end init/agents filesystem tests and full packaging verification remain required before finalization.

Integrated executable clean-workspace coverage at dev 0dccaf6: init/reinit, managed AGENTS preservation, drift detection, and repair. Shared public discovery routing remains under final wave integration.
<!-- SECTION:NOTES:END -->
