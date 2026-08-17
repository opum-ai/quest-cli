---
id: QCLI-112
title: Make six-target Bun artifact delivery safe in Treehouse worktrees
status: To Do
assignee: []
created_date: '2026-08-17 21:25'
labels:
  - quest-0.2
  - bun
  - packaging
  - treehouse
dependencies: []
references:
  - scripts/build-platform-packages.mjs
  - scripts/check-package-artifacts.mjs
  - .codex/skills/treehouse-worktrees/SKILL.md
modified_files:
  - scripts/
  - package.json
  - .codex/skills/treehouse-worktrees/
priority: medium
type: chore
ordinal: 137000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rebuilding Quest's six Bun-compiled native packages produces roughly 64–99 MB binaries. In the constrained campaign worktrees, ordinary Git add, commit, status, and diff refreshes have been killed with exit 137, forcing manual loose-object/index construction and persistent assume-unchanged hints. Provide a supported, observable repository workflow that preserves artifact integrity without hidden index state or Git plumbing surgery.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A documented repository command can build, inspect, stage, and commit all six native artifacts in a Treehouse worktree without manual Git object creation or update-index cacheinfo operations
- [ ] #2 The workflow leaves no persistent assume-unchanged or skip-worktree bits and permits normal status and diff inspection plus safe Treehouse lease return
- [ ] #3 Constrained-environment qualification detects staging or memory failure explicitly instead of silently omitting changed binaries
- [ ] #4 All six platform versions, package metadata, checksums, and packed-package gates remain mechanically verified
<!-- AC:END -->
