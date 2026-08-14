---
id: QCLI-96
title: Make autonomous campaigns loop until a true pause
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 19:49'
updated_date: '2026-08-14 20:31'
labels:
  - campaign
  - automation
  - codex
  - docs
  - 'doc:stories/audit-quest-cli-documentation-authority'
dependencies: []
references:
  - docs/reference/operate-quest-cli-autonomous-documentation-campaigns.md
documentation:
  - docs/stories/audit-quest-cli-documentation-authority.md
modified_files:
  - AGENTS.md
  - .gitignore
  - treehouse.toml
  - .codex/agents/docs-explorer.toml
  - .codex/agents/docs-reviewer.toml
  - .codex/agents/docs-sweeper.toml
  - .codex/agents/docs-writer.toml
  - .codex/skills/backlog-handover/SKILL.md
  - .codex/skills/backlog-handover/references/restore.md
  - .codex/skills/backlog-handover/references/handover.md
  - .codex/skills/backlog-handover/references/delivery.md
  - .codex/skills/backlog-handover/scripts/audit-handover-lifecycle.mjs
  - .codex/skills/backlog-handover/scripts/test-audit-handover-lifecycle.mjs
  - .codex/skills/treehouse-worktrees/SKILL.md
  - .codex/skills/treehouse-worktrees/agents/openai.yaml
  - docs/index.md
  - docs/reference/operate-quest-cli-autonomous-documentation-campaigns.md
priority: high
type: enhancement
ordinal: 90000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Quest CLI campaign sessions can currently stop at vague session boundaries or leave a structurally valid but operationally ambiguous cursor. Strengthen the repository-local backlog-handover contract and executable audits so a campaign continues through ready issues, independent review, commit, dev delivery, settlement, and safe cleanup. A run may stop only for an explicit human-decision boundary or a context/environment renewal that durably tells the operator to clear the session, start a fresh one, run the exact restore command, and resume from grounded state.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Init and restore continue across task, review, commit, PR, merge, settlement, cleanup, and newly ready waves; a successful wave, merged PR, cleanup pass, or subjective session-size judgment is not a stopping point.
- [x] #2 Every nonterminal stop is classified as either a named human decision/blocker or a session/environment renewal, with grounded tracker, queue, branch, worktree, last completed stage, exact next action, and no vague continuation language.
- [x] #3 Session renewal explicitly tells the operator to clear the current session, start a new session in quest-cli, invoke `$backlog-handover restore`, and continue the persisted campaign without asking for reconfirmation.
- [x] #4 The loop defaults to the widest safe wave of up to three parallel agents in isolated worktrees, preserves coordinator ownership of Backlog, Lore, handover, integration, and delivery state, and performs serial cumulative review and hygiene settlement.
- [x] #5 Executable lifecycle fixtures reject ambiguous or stale executable cursors and prove the human-decision and session-renewal stop forms, while the active handover is reconciled to the current campaign state.
- [x] #6 Focused script/configuration checks, Lore agent bridge checks, strict Lore validation/coherence, diff hygiene, independent review, dev delivery, and post-merge branch/worktree cleanup evidence pass at the delivered tree.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reconcile the current Codex/Terra-medium fast lane, active cursor, recent session evidence, and worktree state against QCLI-96’s two legitimate nonterminal exit classes.
2. Strengthen AGENTS and the progressive Codex skill references so init/restore keep executing through review, commit, dev PR/merge, settlement, and exact housekeeping; define an explicit session-renewal protocol with `/clear`, a new quest-cli session, and `$backlog-handover restore`.
3. Add a repository-local Treehouse worktree skill with fenced leases, coordinator ownership, patch-equivalence cleanup, recovery preservation, and safe pooled-worktree hygiene for parallel subagents.
4. Extend lifecycle auditing and fixtures to require grounded cursor fields, numeric queue state, retained-artifact disposition, exact next action, and exactly one stop class; reject vague/stale/foreign continuation and prove queue-empty cursor removal.
5. Update and couple the Lore operating record, correct the stale active-campaign index claim, reconcile the local active cursor, run focused/strict gates, obtain independent cumulative review, deliver one PR to dev, and perform a post-merge artifact audit with only provably safe cleanup.

6. Migrate the sole executable cursor from the misleading legacy .claude handover path to .codex/handovers, explicitly exclude .claude/skills from Codex execution, and align every local agent profile to Terra/medium.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User confirmed Quest campaigns run in Codex with gpt-5.6-terra at medium reasoning, not Claude. The sole executable cursor is .codex/handovers/active.md. A legacy .claude/handovers/active.md is migration input only, is removed after live grounding, and .claude/skills/** is never loaded by the Codex handover flow. The repository default and all four local agent profiles are Terra/medium.

The cleanup contract directly addresses the reported bad prompt: safe pruning, merged-branch deletion, and clean fast-forwarding are never bundled with a request to discard unique dirty work. Patch-equivalent merged artifacts are cleaned automatically; unique in-scope work is preserved and delivered; unrelated or decision-dependent work is retained with an owner and exact reason.

Treehouse was validated with a repository-local three-tree pool, a JSON lease, visible lease ID and holder, and an identity-fenced return. The reusable external six-tree pool remains intentionally retained. The QCLI-96 implementation and nested Treehouse worktrees were clean, patch-equivalent to merged PR #96, and removed; the campaign-created feature branch was deleted.

Four independent review rounds drove lifecycle hardening for duplicate or invalid stop classes, prompt-only renewal, stale live expectations, duplicate counts, missing in-flight rows, contradictory lifecycle markers, foreign or Markdown-nested continuation directives, and unknown stages. The suite now covers 26 lifecycle cases plus 3 tracker cases. Settlement review additionally required the explicit legacy audit command and removal of contradictory Claude-era task evidence.

Final objective evidence: PR #96 merged to dev at fe0dfcf3225e5140522a56603aef73922fcfc342 with tree identity to reviewed feature HEAD 63595ce6f92ac1b78c7ec29ff6179187d53bb05b. Post-merge cleanup removed the campaign feature worktree, nested Treehouse test worktree, and feature branch. Settlement gates passed: 26 lifecycle fixtures, 3 tracker fixtures, both skill validations, strict Codex config load, Lore agent bridge, Lore validate/check 54 files with zero findings, diff hygiene, grounded Codex cursor audit, legacy Claude cursor complete audit, and independent approval.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Made Quest CLI Codex campaigns continue through ready work, cumulative review, commit, dev PR/merge, settlement, and safe cleanup, with only human-decision or explicit /clear plus $backlog-handover restore renewal exits. Added fenced Treehouse worktree operations, adversarial cursor fixtures, patch-equivalence cleanup rules, a sole .codex handover cursor that never loads Claude skills, and Terra/medium defaults for all local agents. Verified 26 lifecycle and 3 tracker fixtures, strict Codex config, both skill validators, Lore agents/validate/check, diff hygiene, independent review, merged PR #96, and post-merge artifact cleanup.
<!-- SECTION:FINAL_SUMMARY:END -->
