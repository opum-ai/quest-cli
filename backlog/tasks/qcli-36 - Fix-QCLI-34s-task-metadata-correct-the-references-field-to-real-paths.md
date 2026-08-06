---
id: QCLI-36
title: 'Fix QCLI-34''s task metadata: correct the references field to real paths'
status: To Do
assignee: []
created_date: '2026-08-06 16:54'
updated_date: '2026-08-06 18:09'
labels:
  - campaign
  - 'cluster:task-metadata'
dependencies: []
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-34's own `references` field names two paths that don't exist: `docs/registers/quest-cli-open-component-decisions.md` (the docs/registers/ directory doesn't exist at all) and `docs/specs/quest-cli-component-contracts-and-delivery-graph.md` (that file actually lives under docs/reference/, not docs/specs/). QCLI-34's own reviewer confirmed via git diff --name-only that the worker correctly edited the real files at docs/reference/quest-cli-open-component-decisions.md and docs/reference/quest-cli-component-contracts-and-delivery-graph.md — the shipped documentation change was correct, only the task record's own metadata is wrong. Surfaced as a proposed follow-up in doc-7 (QCLI-33/34/35 campaign, wave 1) and approved for filing by the user on 2026-08-06.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 QCLI-34's references field lists exactly docs/reference/quest-cli-open-component-decisions.md and docs/reference/quest-cli-component-contracts-and-delivery-graph.md
- [ ] #2 No other field on QCLI-34 (status, labels, notes, final summary, acceptance criteria) is modified
<!-- AC:END -->
