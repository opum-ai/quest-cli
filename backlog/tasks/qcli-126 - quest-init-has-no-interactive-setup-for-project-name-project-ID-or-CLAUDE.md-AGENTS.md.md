---
id: QCLI-126
title: >-
  quest init has no interactive setup for project name, project ID, or
  CLAUDE.md/AGENTS.md
status: To Do
assignee: []
created_date: '2026-08-28 18:50'
labels:
  - cli
  - init
  - onboarding
  - ux
dependencies: []
references:
  - src/cli/main.ts
priority: medium
type: feature
ordinal: 158000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Unlike backlog init and lore init, quest init (src/cli/main.ts, init branch) only accepts --agent-instructions, --json, and --plain. It writes .quest/workspace.toml but never prompts for a project name or project ID, and only touches CLAUDE.md/AGENTS.md when the caller already knows to pass --agent-instructions. New adopters get an unconfigured project with no onboarding path comparable to the other two CLIs in this toolchain.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Running quest init interactively (TTY, no --json/--plain) prompts for the information needed to configure the project, at minimum a project name and project ID.
- [ ] #2 quest init offers to create or update CLAUDE.md and AGENTS.md with the Quest managed instructions block without requiring the caller to already know about --agent-instructions.
- [ ] #3 Non-interactive usage (--json, --plain, or no TTY) skips prompts and keeps today scriptable, flag-only behavior.
<!-- AC:END -->
