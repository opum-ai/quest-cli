---
id: QCLI-163
title: >-
  task create --dependency forces topological-order creation; forward references
  fail with dependency_target_not_found
status: To Do
assignee: []
created_date: '2026-09-02 20:07'
labels:
  - cli
  - dx
  - dependencies
dependencies: []
references:
  - src/application/tasks/tasks.ts
  - src/domain/tasks/tasks.ts
  - docs/specs/quest-cli-dependency-ready-set-and-blocking-design.md
priority: low
type: enhancement
ordinal: 192000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reported via opag/ISSUES.md, verified against source 2026-09-02: task create's dependency validation runs canonicalizeTaskLinks([...tasks, newTask]) synchronously at creation (src/application/tasks/tasks.ts:401), which throws dependency_target_not_found (src/domain/tasks/tasks.ts:526) when --dependency/--dep names a task that doesn't exist yet. This is a deliberate, ratified design choice (QCLI-62 AC1/AC3: named missing-target errors, fail-closed validation), not a bug -- confirmed by reading docs/specs/quest-cli-dependency-ready-set-and-blocking-design.md. The friction is real though: an agent creating tasks with a forward dependency (e.g. EDK-20 depending on not-yet-created EDK-22) hits an unhelpful stop and must either reorder creation or fall back to a two-pass create-then-task-edit-add-dependency workflow, discovering that pattern by trial and error.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The task-creation guide (backlog instructions task-creation, or quest's own equivalent guide) explicitly documents that dependency targets must already exist and shows the two-pass create-then-add-dependency workaround for forward references
- [ ] #2 dependency_target_not_found's error message/hint points the caller at the two-pass workaround instead of stopping with no next step
- [ ] #3 Explicitly re-affirm or revisit the QCLI-62 fail-closed ratification for this specific case before changing validation behavior -- this is a UX/docs task by default, not a request to relax validation
<!-- AC:END -->
