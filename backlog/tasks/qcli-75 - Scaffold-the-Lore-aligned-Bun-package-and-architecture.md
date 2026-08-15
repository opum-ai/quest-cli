---
id: QCLI-75
title: Scaffold the Lore-aligned Bun package and architecture
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 02:13'
labels:
  - quest-0.1
  - 'wave:foundation'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-72
documentation:
  - docs/specs/quest-cli-architecture.md
  - docs/reference/quest-cli-d2-runtime-ruling.md
  - docs/reference/quest-cli-packaging-contract.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - package.json
  - bun.lock
  - src/
priority: high
type: chore
ordinal: 93000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create the minimal Quest package/tooling scaffold aligned to lore-cli without implementing domain behavior. Establish the one-package CLI, application, domain, ports, and adapters layers, exact toolchain, test entry points, MIT metadata, and dependency-direction enforcement.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The package is strict ESM TypeScript on the current Lore-compatible Bun toolchain with Commander, Zod, Biome, bun:test, js-yaml, and string-width
- [x] #2 CLI, application, domain, ports, and adapters have explicit dependency boundaries enforced by an automated layer check
- [x] #3 Package metadata reserves @opum-ai/quest and the quest executable without claiming the unpublished package is installable
- [x] #4 Typecheck, lint, format-check, layer-check, and an initial test suite run from documented scripts
- [x] #5 No domain behavior, runtime service, LadybugDB dependency, authentication, RBAC, MCP, or hosted component is introduced
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect the current repository, tooling conventions, and the D2/package contracts.
2. Add a strict ESM Bun TypeScript package scaffold with the requested layers, scripts, and automated dependency-boundary check, without domain behavior.
3. Run all documented checks, record objective evidence, and finalize after independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validation on tree b74e1edce0d86838a83970bc600bb703f3cff5b8 plus the uncommitted QCLI-75 scaffold: bun run typecheck, lint, format:check, layer:check, and test all passed; lore validate --strict and lore check --strict passed. Independent review found no blocking issues.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Scaffolded the private, unpublished @opum-ai/quest Bun package with strict TypeScript, five architectural layers, automated import-boundary enforcement, tooling scripts, and an initial CLI identity test. Verified with Bun checks, strict Lore gates, and independent review.
<!-- SECTION:FINAL_SUMMARY:END -->
