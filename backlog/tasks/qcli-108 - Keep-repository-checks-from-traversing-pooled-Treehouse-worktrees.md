---
id: QCLI-108
title: Keep repository checks from traversing pooled Treehouse worktrees
status: To Do
assignee: []
created_date: '2026-08-17 16:22'
updated_date: '2026-08-17 16:26'
labels:
  - tooling
  - ci
  - treehouse
  - developer-experience
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
references:
  - biome.json
  - package.json
documentation:
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
priority: medium
type: bug
ordinal: 132000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
With reusable Treehouse leases present under the ignored `.treehouse/` directory, both `bun run lint` (`biome lint .`) and `bun run format:check` (`biome ci ... .`) discover each leased checkout's root `biome.json` before applying the root include set. Biome rejects the nested root configurations, so the standard `bun run check` gate cannot run in the repository state produced by its own parallel-agent workflow. Git already ignores `.treehouse/`; the check entry points must also exclude or avoid traversing pooled worktrees without reducing coverage of owned source files.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `bun run lint` succeeds when one or more Quest worktrees with their own `biome.json` exist beneath `.treehouse/`
- [ ] #2 `bun run format:check` succeeds in the same pooled-worktree state
- [ ] #3 Lint and formatting checks still cover the repository-owned source, tests, scripts, and configured root JSON files
- [ ] #4 The checks behave identically when `.treehouse/` is absent
- [ ] #5 Automated regression coverage reproduces the nested-root configuration layout and prevents traversal from returning
<!-- AC:END -->
