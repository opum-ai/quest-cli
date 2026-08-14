---
id: QCLI-96
title: Make autonomous campaigns loop until a true pause
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-14 19:49'
updated_date: '2026-08-14 20:19'
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
- [ ] #1 Init and restore continue across task, review, commit, PR, merge, settlement, cleanup, and newly ready waves; a successful wave, merged PR, cleanup pass, or subjective session-size judgment is not a stopping point.
- [ ] #2 Every nonterminal stop is classified as either a named human decision/blocker or a session/environment renewal, with grounded tracker, queue, branch, worktree, last completed stage, exact next action, and no vague continuation language.
- [ ] #3 Session renewal explicitly tells the operator to clear the current session, start a new session in quest-cli, invoke `$backlog-handover restore`, and continue the persisted campaign without asking for reconfirmation.
- [ ] #4 The loop defaults to the widest safe wave of up to three parallel agents in isolated worktrees, preserves coordinator ownership of Backlog, Lore, handover, integration, and delivery state, and performs serial cumulative review and hygiene settlement.
- [ ] #5 Executable lifecycle fixtures reject ambiguous or stale executable cursors and prove the human-decision and session-renewal stop forms, while the active handover is reconciled to the current campaign state.
- [ ] #6 Focused script/configuration checks, Lore agent bridge checks, strict Lore validation/coherence, diff hygiene, independent review, dev delivery, and post-merge branch/worktree cleanup evidence pass at the delivered tree.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reconcile the current Codex/Terra-medium fast lane, active cursor, recent session evidence, and worktree state against QCLI-96’s two legitimate nonterminal exit classes.
2. Strengthen AGENTS and the progressive Codex skill references so init/restore keep executing through review, commit, dev PR/merge, settlement, and exact housekeeping; define an explicit session-renewal protocol with `/clear`, a new quest-cli session, and `$backlog-handover restore`.
3. Add a repository-local Treehouse worktree skill with fenced leases, coordinator ownership, patch-equivalence cleanup, recovery preservation, and safe pooled-worktree hygiene for parallel subagents.
4. Extend lifecycle auditing and fixtures to require grounded cursor fields, numeric queue state, retained-artifact disposition, exact next action, and exactly one stop class; reject vague/stale/foreign continuation and prove queue-empty cursor removal.
5. Update and couple the Lore operating record, correct the stale active-campaign index claim, reconcile the local active cursor, run focused/strict gates, obtain independent cumulative review, deliver one PR to dev, and perform a post-merge artifact audit with only provably safe cleanup.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User clarified the operating client is Codex using Terra/medium, not Claude. QCLI-96 therefore leaves `.claude/skills/**` and `CLAUDE.md` unchanged; `.claude/handovers/active.md` remains only the existing local cursor location. The user also identified the concrete bad prompt: a bulk approval request that mixed two dirty worktree discards with safe pruning, merged-branch deletion, and a clean fast-forward. The new cleanup contract must classify patch equivalence first, preserve unique in-scope work, and execute independently safe hygiene without prompting.

Treehouse forward test: repository-local config parsed and `treehouse status --json`/`treehouse prune --verbose` passed. A `qcli-96-skill-test` lease was acquired as JSON with an immutable lease ID and returned successfully using both `--if-lease-id` and `--if-lease-holder`; the only warning was sandbox denial of optional lingering-process scanning. The reusable test pool remains ignored inside the disposable QCLI-96 coordinator worktree and will be removed with that worktree after delivery.

First independent review rejected the candidate on three concrete grounds: duplicate Stop class lines and prompt-only renewal actions could bypass the lifecycle audit; formatted cursors were not bound to live tracker/Git/queue expectations; and the Treehouse config was changed before proving lease visibility. Remediation now parses required sections structurally, requires exactly one stop class, binds decision/action text to their sections, requires live expected tracker/SHA/branch/worktree/state arguments, and adds duplicate/prompt-only/stale-cursor fixtures. Treehouse uses one stable repo-local root; a second round trip proved the leased path/ID/holder appears in `treehouse status --json` and the identity-fenced return clears the lease while leaving the pool entry available.

Second independent review rejected two remaining parser gaps: an extra invalid stop classification could coexist with a valid one, and duplicate state counts or a missing in-flight row could pass. Remediation now counts every Stop class line and accepts exactly one of the two allowed values, requires exactly one numeric row per state label, and makes the in-flight table row count plus task/branch-or-worktree/last-stage cells match State. New adversarial fixtures cover invalid extra classification, duplicate Ready counts, and missing in-flight rows; the lifecycle suite now has 20 cases.

Third independent review rejected three remaining cursor ambiguities: contradictory current/historical markers, a bulleted historical Resume directive, and an in-flight stage cell containing only `not known`. Remediation makes lifecycle markers mutually exclusive and singular, detects list/numbered/blockquote continuation forms in historical files, and requires each in-flight stage cell to contain a full SHA plus a concrete lifecycle stage. Three new adversarial fixtures bring the lifecycle suite to 23 cases.

Fourth independent review found one remaining historical-cursor hole: nested Markdown prefixes such as blockquote-plus-list and list-plus-numbering could hide Resume/Continue imperatives. The detector now consumes repeated blockquote, unordered-list, and ordered-list prefixes. Three new fixtures cover the reported forms; the lifecycle suite now has 26 cases.
<!-- SECTION:NOTES:END -->
