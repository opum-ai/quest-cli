---
id: QCLI-113
title: Settle FMC worker ledger and delivery
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-18 17:05'
updated_date: '2026-08-18 17:07'
labels: []
dependencies: []
type: chore
ordinal: 139000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Record and settle the quest-cli-local FMC Worker onboarding and housekeeping follow-up dispatched by Controller opum-doc. Preserve unrelated campaign state while reconciling the delegated delivery ledger, user-level skill selection, and validated dev integration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AGENTS.md records quest-cli as Worker, opum-doc as the exact Controller, and the delegated authorization boundary for matching directives and exact FMC allows
- [x] #2 Local project copies do not shadow the selected user-level codex-worker, backlog-handover, or treehouse-worktrees procedures
- [x] #3 The active handover cursor is reconciled against live campaign state without discarding unique state
- [x] #4 Repository, Lore, Backlog, Git worktree, and Treehouse checks provide objective delivery evidence
- [x] #5 Validated commits are delivered by fast-forward only to origin/dev, with no main promotion or history rewrite
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect the existing worker commits, local tracker, skills, handover cursor, Git/Treehouse state, and allowed approval. 2. Make only the necessary ledger/shadow/cursor settlement changes. 3. Run required Backlog/Lore/repository validation, commit the local settlement, push the linear stack to origin/dev, and record final evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validated AGENTS delegation, user-level skill selection, retained human-decision cursor, strict Lore gates, Git/Treehouse audit, and fast-forward delivery at 3699c2e87e2ea0e128fd5b801221a1125bb13f08. Approval 2f2d466daf1840ab8723e1a71acd6914 was allowed by opum-doc; origin/dev now equals that SHA.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Settled the quest-cli FMC worker ledger, removed duplicate project skill bundles, retained and audited the active campaign cursor, and delivered the validated linear stack to origin/dev.
<!-- SECTION:FINAL_SUMMARY:END -->
