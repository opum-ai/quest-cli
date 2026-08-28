---
id: QCLI-129
title: quest init does not scaffold a Quest Claude skill for the project
status: To Do
assignee: []
created_date: '2026-08-28 18:50'
labels:
  - cli
  - init
  - skills
  - onboarding
dependencies:
  - QCLI-126
references:
  - .claude/skills/lore/SKILL.md
priority: medium
type: feature
ordinal: 161000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
quest init never creates a .claude/skills/quest/SKILL.md the way this repo already relies on for lore (.claude/skills/lore/SKILL.md) and backlog-handover. A project that runs quest init has no equivalent skill teaching agents the day-to-day quest CLI loop, so they fall back to editing tracker state directly. Use the skill-creator flow to author and install a Quest skill, then wire its installation into quest init, mirroring the existing --agent-instructions flag.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A Quest skill (SKILL.md plus any supporting files) exists and installs under .claude/skills/quest/.
- [ ] #2 quest init offers to install or update this skill for the project, the same way --agent-instructions updates CLAUDE.md/AGENTS.md.
- [ ] #3 The skill documents the canonical agent loop for driving quest so agents reach for the quest CLI instead of editing tracker files directly.
- [ ] #4 Skill content is generated from or kept in sync with quest instructions output rather than duplicating a second, divergent copy.
<!-- AC:END -->
