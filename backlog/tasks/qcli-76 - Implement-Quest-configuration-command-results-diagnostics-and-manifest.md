---
id: QCLI-76
title: 'Implement Quest configuration, command results, diagnostics, and manifest'
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 02:15'
labels:
  - quest-0.1
  - 'wave:foundation'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-75
documentation:
  - >-
    docs/adr/emit-three-categorical-command-outcomes-over-a-versioned-envelope.md
  - docs/specs/opum-command-contract.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - src/cli/
  - src/application/
  - test/contract/
priority: high
type: feature
ordinal: 94000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the stable CLI/application shell every later command consumes: repository-local configuration, command registration, read/write classification, output-mode selection, the Opum success envelope, diagnostics, exit taxonomy, bare version output, and the live compatibility manifest.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Successful JSON commands emit exactly one schemaVersion 1 dotted-kind envelope with data and principal null on stdout
- [ ] #2 Failures emit one diagnostic on stderr and use exits 1 through 6 according to the accepted taxonomy
- [ ] #3 --json overrides --plain, non-TTY defaults to plain, pretty output is TTY-only, and --version is bare semver
- [ ] #4 Configuration validates additive TOML safely and reports unsupported schema or drift without mutation
- [ ] #5 The live manifest enumerates every command, result kind, schema version, and read-only or mutating classification and is covered by goldens
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reconcile the frozen Opum command contract with the QCLI-76 acceptance criteria and inspect the QCLI-75 scaffold.
2. Implement typed result/diagnostic, output-mode, manifest, and additive configuration boundaries; expose only the contract shell with CLI wiring.
3. Add goldens and contract tests for envelope, diagnostics, output precedence, configuration, and manifest validation.
4. Run focused and cumulative checks, obtain independent review, synchronize Lore, and finalize.
<!-- SECTION:PLAN:END -->
