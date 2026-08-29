---
id: QCLI-141
title: 'quest instructions <guide> and --list, kept aligned with the Quest skill'
status: To Do
assignee: []
created_date: '2026-08-29 00:32'
labels:
  - cli
  - parity
  - onboarding
dependencies:
  - QCLI-134
  - QCLI-129
references:
  - src/application/agents/agent-instructions.ts
  - .claude/skills/quest/SKILL.md
priority: medium
type: feature
ordinal: 173000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Quest emits one fixed agent-instructions block. Backlog 1.50.1 serves five workflow guides - overview, task-creation, task-execution, task-finalization, init-required - through instructions <guide> plus --list for discovery.

Filed out of the QCLI-134 register with the owner deciding to implement now (2026-08-29), with one explicit requirement: the Quest skill shipped by QCLI-129 (.claude/skills/quest/SKILL.md, generated from the bundled questSkillContent constant) must stay aligned with these guides rather than becoming a third divergent copy of the same guidance. Quest already has two agent-facing surfaces - that skill and quest help <command> from QCLI-127 - so this work must consolidate, not add a parallel source of truth.

DESIGN DECISION, settled 2026-08-29: no "all" guide. Neither reference implementation has one - Backlog exposes [guide] plus --list, and Lore exposes [<topic>] and describes itself as task-scoped guidance "on demand". The purpose of splitting guides is just-in-time loading to keep agent context small; an "all" invites dumping every guide on every invocation and defeats that. --list already covers discovery, which is the real need.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 quest instructions <guide> serves distinct guides, and quest instructions --list enumerates them with a one-line purpose each.
- [ ] #2 Bare quest instructions keeps returning the managed agent-instructions block, so the existing agents --check / --update-instructions contract and every current caller are unaffected.
- [ ] #3 There is no "all" guide, per the recorded decision.
- [ ] #4 The Quest skill from QCLI-129 is reconciled against the guides: guidance lives in one place and the skill points at it rather than restating it, so the two cannot drift.
- [ ] #5 The manifest declares the guide argument and --list, and a test fails if the skill and the guides duplicate guidance that could diverge.
<!-- AC:END -->
