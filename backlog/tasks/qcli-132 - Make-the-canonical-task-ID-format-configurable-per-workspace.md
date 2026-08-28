---
id: QCLI-132
title: Make the canonical task-ID format configurable per workspace
status: To Do
assignee: []
created_date: '2026-08-28 21:26'
labels:
  - cli
  - init
  - domain
dependencies:
  - QCLI-126
references:
  - src/domain/records.ts
  - src/domain/gates/gates.ts
  - src/domain/tasks/tasks.ts
  - src/domain/claims/claims.ts
  - src/application/tasks/local-task-repository.ts
  - src/adapters/claims/local-claim-evidence.ts
priority: medium
type: feature
ordinal: 164000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
quest init/QCLI-126 lets a workspace declare a taskIdPrefix in .quest/workspace.toml, and nextTaskId already generates IDs with that prefix - but the domain layer rejects anything but the literal T- prefix. canonicalIdPattern = /^T-[1-9][0-9]*$/ is a module-level constant in src/domain/records.ts:14, and canonicalId()/canonicalIdSchema built from it are used across src/domain/records.ts, src/domain/gates/gates.ts, src/domain/tasks/tasks.ts, src/domain/claims/claims.ts, src/application/tasks/local-task-repository.ts, and src/adapters/claims/local-claim-evidence.ts. Confirmed live: quest init --name X (workspace.toml with a manually-set taskIdPrefix) then creating a task with that prefix fails with "Invalid canonical id: <prefix>-1" on the very next read.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A workspace with a configured taskIdPrefix in .quest/workspace.toml can create, view, edit, complete, archive, and reference tasks using that prefix end to end, with no domain-layer validation rejection.
- [ ] #2 Every one of the 6 files listed above is audited for a hardcoded T- assumption; each is either parameterized on the configured prefix or confirmed not to need it, with the reasoning recorded.
- [ ] #3 A workspace with no configured taskIdPrefix (every workspace initialized before this existed) keeps accepting only T-<N> exactly as today - no regression.
- [ ] #4 Once this lands, quest init/QCLI-126 gets a --task-id-prefix flag and its wizard question back.
<!-- AC:END -->
