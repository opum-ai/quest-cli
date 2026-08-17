---
id: QCLI-97.7
title: Restore the architecture layer gate after parity composition wiring
status: To Do
assignee: []
created_date: '2026-08-17 16:22'
updated_date: '2026-08-17 16:26'
labels:
  - architecture
  - tooling
  - ci
  - parity
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
references:
  - scripts/check-layers.mjs
documentation:
  - docs/specs/quest-cli-architecture.md
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
parent_task_id: QCLI-97
priority: high
type: bug
ordinal: 131000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-105 verification found that `bun run layer:check` fails on the current parity implementation with five dependency violations: two adapters import application contracts, and `src/cli/main.ts` imports three concrete adapters even though the checker permits CLI imports only from application. QCLI-75 completed with dependency-direction enforcement and a passing layer gate, so this is a regression that blocks trustworthy QCLI-97.6 qualification. Restore a truthful enforced architecture boundary; do not make the gate green by broadly exempting the current violations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `bun run layer:check` exits 0 against the current source tree
- [ ] #2 The enforced dependency graph is documented and remains consistent with the Quest architecture contract
- [ ] #3 The composition root can wire concrete adapters without granting ordinary CLI modules unrestricted adapter dependencies
- [ ] #4 Adapter contracts no longer require forbidden imports from the application layer
- [ ] #5 Automated coverage proves a representative forbidden reverse dependency still fails the layer gate
<!-- AC:END -->
