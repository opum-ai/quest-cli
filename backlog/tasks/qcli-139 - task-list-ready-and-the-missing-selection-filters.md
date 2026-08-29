---
id: QCLI-139
title: task list --ready and the missing selection filters
status: To Do
assignee: []
created_date: '2026-08-29 00:32'
labels:
  - cli
  - parity
  - agent-workflow
dependencies:
  - QCLI-134
references:
  - src/cli/main.ts
  - src/domain/tasks/tasks.ts
priority: medium
type: feature
ordinal: 171000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Quest task list offers --status and --label. Backlog 1.50.1 adds --exclude-status, --assignee, --unassigned, --milestone, --parent, --priority, --type, --search, --ready, --limit and --sort.

QCLI-134 singles out --ready (dependency-unblocked) as the one an agent picking its next task actually needs: without it an agent must list everything, then resolve the dependency graph itself. Quest already computes readiness internally - src/domain/tasks/tasks.ts carries validateTaskGraph and a ReadinessReason type - so --ready is exposing an existing capability rather than building one.

Filed out of the QCLI-134 register with the owner deciding to implement (2026-08-29). Deliver --ready first; the remaining filters are ordinary selection and can follow.

Lore is not blocked by this: Lore 0.3.4 consumes only backlog task list --json, task view --json and search --json with no filter flags (verified against its shipped binary, zero references to any of these flags).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 task list --ready returns only tasks whose dependencies are all satisfied, using the same readiness rules the domain already enforces rather than a second implementation.
- [ ] #2 The remaining filters land: --exclude-status, --assignee, --unassigned, --milestone, --parent, --priority, --type, --search, --limit, --sort.
- [ ] #3 Filters compose (for example --ready with --label), and the manifest filters list for task list declares every one.
- [ ] #4 Existing --status and --label behaviour is unchanged.
<!-- AC:END -->
