---
id: QCLI-113
title: Settle FMC worker ledger and delivery
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-18 17:05'
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
- [ ] #1 AGENTS.md records quest-cli as Worker, opum-doc as the exact Controller, and the delegated authorization boundary for matching directives and exact FMC allows
- [ ] #2 Local project copies do not shadow the selected user-level codex-worker, backlog-handover, or treehouse-worktrees procedures
- [ ] #3 The active handover cursor is reconciled against live campaign state without discarding unique state
- [ ] #4 Repository, Lore, Backlog, Git worktree, and Treehouse checks provide objective delivery evidence
- [ ] #5 Validated commits are delivered by fast-forward only to origin/dev, with no main promotion or history rewrite
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect the existing worker commits, local tracker, skills, handover cursor, Git/Treehouse state, and allowed approval. 2. Make only the necessary ledger/shadow/cursor settlement changes. 3. Run required Backlog/Lore/repository validation, commit the local settlement, push the linear stack to origin/dev, and record final evidence.
<!-- SECTION:PLAN:END -->
