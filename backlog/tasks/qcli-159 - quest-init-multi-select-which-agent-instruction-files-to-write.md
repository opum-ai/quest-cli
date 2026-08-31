---
id: QCLI-159
title: 'quest init: multi-select which agent instruction files to write'
status: To Do
assignee: []
created_date: '2026-08-31 13:23'
labels: []
dependencies: []
type: feature
ordinal: 188000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User-requested feature (relayed via opag, verified against source, 2026-08-31): `quest init` currently offers only a single yes/no prompt -- "Write the managed AGENTS.md instructions block?" (src/cli/main.ts:544) -- and the boolean --agent-instructions flag (src/cli/main.ts:157,672,679,691) has no target selection. The request is a multi-select of which agent instruction file(s) to write: Claude Code -> CLAUDE.md, Codex -> AGENTS.md, pi -> AGENTS.md (per the user, marked with a question mark -- UNCONFIRMED: nothing in src/application/agents/agent-instructions.ts or elsewhere in this codebase currently models a "pi" agent target at all; today the module only knows codexInstructionPath = "AGENTS.md". Confirm the correct pi target filename before implementing rather than assuming AGENTS.md.

command-help.ts documents `instructions` (:46) and `agents --update-instructions` (:61) in the same AGENTS.md-only terms, so the surface used by this feature is wider than `init` alone -- scope whether those follow the same multi-select or stay AGENTS.md-only.

Fleet context: Codex is retired as a runtime this fleet dispatches to internally, but quest is a published package with external users and shipped product surface is out of scope for that retirement (same reasoning that keeps `lore init --codex`). Codex stays in scope for this feature on that basis.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 quest init offers a multi-select (not a single yes/no) for which agent instruction target(s) to write, covering at least Claude Code (CLAUDE.md), Codex (AGENTS.md), and pi (target filename confirmed before implementation, not assumed)
- [ ] #2 Design states explicitly what happens when two selected targets resolve to the same file (e.g. Codex and pi both AGENTS.md today): one merged block, two blocks, or a rejected combination
- [ ] #3 --agent-instructions compatibility is decided explicitly: existing scripted callers passing the current boolean flag do not silently change behavior to "write all targets"
- [ ] #4 Decision recorded for whether quest instructions and quest agents --update-instructions follow the same multi-target model or stay AGENTS.md-only
<!-- AC:END -->
