---
id: QCLI-144
title: 'FUTURE (not scheduled): doctor --fix, with a design pass before implementation'
status: To Do
assignee: []
created_date: '2026-08-29 00:32'
labels:
  - cli
  - parity
  - future
  - data-integrity
dependencies:
  - QCLI-134
references:
  - src/cli/main.ts
priority: low
type: feature
ordinal: 176000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
NOT SCHEDULED. Filed to capture intent; the owner explicitly deferred shipping (2026-08-29).

Quest doctor diagnoses but cannot repair. Backlog 1.50.1 repairs, including atomic duplicate-id rename.

This is the one QCLI-134 gap where the remedy itself mutates tracker records, so a wrong repair corrupts state rather than merely failing. It deserves its own design pass rather than parity-driven implementation - in particular: which classes of problem are safe to auto-repair, whether repair is actor-attributed like every other Quest write, whether it is transactional and rollback-able through the existing migration machinery, and what a --dry-run reports.

Quest also has an existing safety pattern to follow: cleanup already defaults to dry-run and requires --confirm plus an explicit actor.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A design decision is recorded first: which problem classes are auto-repairable, and which stay diagnose-only.
- [ ] #2 If implemented: repairs are actor-attributed, default to dry-run, require an explicit confirm, and are atomic per repair.
- [ ] #3 Duplicate-id rename in particular preserves referential integrity across dependencies, parents and milestones.
<!-- AC:END -->
