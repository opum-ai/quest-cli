---
id: QCLI-129
title: quest init does not scaffold a Quest Claude skill for the project
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-28 18:50'
updated_date: '2026-08-28 22:30'
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
- [x] #1 A Quest skill (SKILL.md plus any supporting files) exists and installs under .claude/skills/quest/.
- [x] #2 quest init offers to install or update this skill for the project, the same way --agent-instructions updates CLAUDE.md/AGENTS.md.
- [x] #3 The skill documents the canonical agent loop for driving quest so agents reach for the quest CLI instead of editing tracker files directly.
- [x] #4 Skill content is generated from or kept in sync with quest instructions output rather than duplicating a second, divergent copy.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Author .claude/skills/quest/SKILL.md for this repo directly (done) - mirrors
   .claude/skills/lore/SKILL.md's structure (frontmatter, When to use it, Start here,
   Commands, Machine contract).
2. src/adapters/agents/local-agent-instructions.ts: relax LocalAgentInstructionPort's
   single-segment-filename restriction to allow safe nested relative paths (needed for
   .claude/skills/quest/SKILL.md); add the same symlink-escape walk and mkdir
   -p-equivalent local-workspaces.ts already uses for .quest/workspace.toml. The
   existing AGENTS.md/CLAUDE.md path and its tests are unaffected (single-segment
   paths take the same safe path through the relaxed check).
3. src/application/agents/agent-instructions.ts: add questSkillPath, questSkillContent
   (the exact bundled SKILL.md content), and whole-file
   checkQuestSkillFile/applyQuestSkillFile/updateQuestSkillFile/inspectQuestSkillFile,
   mirroring the existing managed-block functions but without block-search logic (the
   whole file is Quest-owned, so it is either an exact match or drifted - no
   "malformed markers" sub-case applies).
4. src/cli/main.ts: agents branch calls both instructions and skill
   check/update, returns {...instructionsCheck, skill: skillCheck} (additive - the
   existing top-level state/message fields keep describing CLAUDE.md/AGENTS.md exactly
   as today, so no existing --check/--update-instructions assertion breaks); --check
   fails on drift or (with --require-installed) missing from either target. init
   branch's writeInstructions path also calls updateQuestSkillFile.
5. Tests: local-agent-instructions adapter test for the relaxed nested-path write
   (incl. symlink-escape rejection); agents --check/--update-instructions tests
   extended to also cover the skill file's missing/current/drift states; quest init
   --agent-instructions end-to-end writes both targets.
6. bun run typecheck / lint / layer:check / format:check / test before opening the PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Note on tooling: /skill-creator, named in the original request, is not available in this environment (Skill tool returned 'Unknown skill: skill-creator'). Authored the skill by hand against .claude/skills/lore/SKILL.md's structure instead - which is also the closer precedent, since lore agents already implements exactly the 'regenerate SKILL.md + the CLAUDE.md nudge' install pattern this task needed.
Adapter change worth flagging for review: relaxing LocalAgentInstructionPort to accept nested paths also fixed a latent portability bug - the old containment check tested for the literal '../' and would have missed Windows-style '..\' traversal on the newly-allowed nested path. Now uses the platform sep, matching local-workspaces.ts. Windows CI (win32-arm64, win32-x64) passes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added .claude/skills/quest/SKILL.md and wired its installation into quest agents --update-instructions and quest init's instructions path, so any project - not just this repo - gets the skill alongside the CLAUDE.md/AGENTS.md managed block. AC4 (kept in sync, not a divergent second copy) is satisfied structurally: the file is generated from a single bundled questSkillContent constant, and agents --check reports drift the moment an installed copy differs, so the two cannot silently diverge; verified byte-identical between the repo file and the constant. Verified with new tests covering nested-path write, symlink-escape-through-intermediate-directory rejection, skill missing/current/drift states, init installing both targets end to end, and mixed missing/drifted recovery - plus confirmation the existing flat AGENTS.md path is unaffected. Merged via PR #166 (merge commit 5c7b2eb); all 7 CI checks passed including both Windows targets.
<!-- SECTION:FINAL_SUMMARY:END -->
