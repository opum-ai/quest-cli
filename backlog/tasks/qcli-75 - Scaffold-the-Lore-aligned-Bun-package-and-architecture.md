---
id: QCLI-75
title: Scaffold the Lore-aligned Bun package and architecture
status: To Do
assignee: []
created_date: '2026-08-14 18:08'
updated_date: '2026-08-14 18:27'
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
- [ ] #1 The package is strict ESM TypeScript on the current Lore-compatible Bun toolchain with Commander, Zod, Biome, bun:test, js-yaml, and string-width
- [ ] #2 CLI, application, domain, ports, and adapters have explicit dependency boundaries enforced by an automated layer check
- [ ] #3 Package metadata reserves @opum-ai/quest and the quest executable without claiming the unpublished package is installable
- [ ] #4 Typecheck, lint, format-check, layer-check, and an initial test suite run from documented scripts
- [ ] #5 No domain behavior, runtime service, LadybugDB dependency, authentication, RBAC, MCP, or hosted component is introduced
<!-- AC:END -->
