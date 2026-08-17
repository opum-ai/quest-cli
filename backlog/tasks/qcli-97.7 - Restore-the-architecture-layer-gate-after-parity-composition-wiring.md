---
id: QCLI-97.7
title: Restore the architecture layer gate after parity composition wiring
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 16:22'
updated_date: '2026-08-17 16:47'
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
modified_files:
  - scripts/check-layers.mjs
  - src/ports/agent-instructions.ts
  - src/ports/planning.ts
  - src/application/agents/agent-instructions.ts
  - src/application/planning/planning.ts
  - src/adapters/agents/local-agent-instructions.ts
  - src/adapters/planning/local-planning-repository.ts
  - src/cli/composition.ts
  - src/cli/main.ts
  - test/contract/layer-check.test.ts
  - docs/specs/quest-cli-architecture.md
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
- [x] #1 `bun run layer:check` exits 0 against the current source tree
- [x] #2 The enforced dependency graph is documented and remains consistent with the Quest architecture contract
- [x] #3 The composition root can wire concrete adapters without granting ordinary CLI modules unrestricted adapter dependencies
- [x] #4 Adapter contracts no longer require forbidden imports from the application layer
- [x] #5 Automated coverage proves a representative forbidden reverse dependency still fails the layer gate
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Move adapter-facing error and planning repository contracts into the ports layer.
2. Isolate concrete adapter construction in one explicit CLI composition root and teach the layer gate only that file may import adapters.
3. Add layer-check regression coverage for an ordinary CLI-to-adapter import and document the enforced graph.
4. Run focused and full gates, then finalize the task through Backlog and Lore.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Moved adapter-facing contracts into ports and isolated concrete adapter construction in src/cli/composition.ts. The checker permits only that exact composition root to import adapters; ordinary CLI modules remain restricted to application imports. Verification: bun run layer:check passed for 64 TypeScript files; the new subprocess regression rejects an ordinary CLI-to-adapter import; bun test passed 146 tests; typecheck, targeted Biome, all six artifact and packed-install checks, and Lore strict validation/check passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restored the enforced dependency graph without broad exemptions: adapters no longer import application contracts, and one path-specific CLI composition root owns concrete wiring. Documented the graph and added regression coverage. Verified with the passing layer gate, 146-test suite, typecheck, package qualification, and Lore strict gates.
<!-- SECTION:FINAL_SUMMARY:END -->
