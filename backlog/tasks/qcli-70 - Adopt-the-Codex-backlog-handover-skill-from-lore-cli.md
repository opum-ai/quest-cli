---
id: QCLI-70
title: Adopt the Codex backlog-handover skill from lore-cli
status: Done
assignee:
  - '@codex'
created_date: '2026-08-13 04:16'
updated_date: '2026-08-13 04:19'
labels: []
dependencies: []
references:
  - ../lore-cli/.codex/skills/backlog-handover
modified_files:
  - .codex/skills/backlog-handover/SKILL.md
  - .codex/skills/backlog-handover/agents/openai.yaml
  - .codex/skills/backlog-handover/scripts/audit-handover-lifecycle.mjs
priority: medium
type: chore
ordinal: 87000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add the Codex-native backlog campaign skill maintained in the sibling lore-cli repository to quest-cli. Preserve the source workflow and UI metadata while adapting repository-specific lifecycle detection to Quest task identifiers.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The repository contains a discoverable `.codex/skills/backlog-handover/SKILL.md` and matching `agents/openai.yaml` based on the current lore-cli source bundle.
- [x] #2 The bundled handover lifecycle audit resolves Quest handovers from the repository root and detects runnable `QCLI-*` resume directives without retaining lore-cli-only `LCLI-*` assumptions.
- [x] #3 Skill structure validation and focused lifecycle-audit checks pass.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Copy the current lore-cli Codex skill manifest and UI metadata into `.codex/skills/backlog-handover/`. 2. Copy the lifecycle audit script and adapt its task-resume detector from `LCLI-*` to `QCLI-*`, leaving the repository-root path contract unchanged. 3. Validate the skill structure, exercise passing and failing lifecycle fixtures, inspect the scoped diff, and record evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the current lore-cli Codex skill bundle at `.codex/skills/backlog-handover/`: `SKILL.md` and `agents/openai.yaml` are byte-identical to the source working tree; the audit script differs only by adapting the runnable task directive from `LCLI-*` to `QCLI-*`. Verification: skill-creator `quick_validate.py` passed; a canonical active handover fixture exited 0; a historical `Resume QCLI-70` fixture exited 1 with `task resume directive`; the same `LCLI-70` historical text exited 0; `rg` found no retained LCLI token; `git diff --check` passed.

Final acceptance pass: `quick_validate.py` and `node --check` exited 0; exact comparisons confirmed `SKILL.md` and `agents/openai.yaml` match lore-cli; the audit-script diff contains only `LCLI` → `QCLI`; the canonical fixture passed and the historical `Resume QCLI-70` fixture failed with the expected runnable-signal diagnostics. Running the audit with no path reached Quest `.claude/handovers/` and reported `active.md is missing`, confirming repository-root resolution; that missing pointer is current repository state, not an adoption defect.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Adopted lore-cli’s current Codex-native backlog-handover skill as a three-file Quest bundle, preserving the source workflow and UI metadata while adapting lifecycle detection to `QCLI-*` task resume directives. Skill schema, script syntax, repository-root resolution, canonical lifecycle success, and stale Quest-resume rejection were all verified.
<!-- SECTION:FINAL_SUMMARY:END -->
