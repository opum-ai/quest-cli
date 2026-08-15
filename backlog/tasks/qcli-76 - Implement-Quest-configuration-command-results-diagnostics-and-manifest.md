---
id: QCLI-76
title: 'Implement Quest configuration, command results, diagnostics, and manifest'
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 17:20'
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
  - docs/reference/quest-cli-opum-command-contract-local-obligation.md
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
- [x] #1 Successful JSON commands emit exactly one schemaVersion 1 dotted-kind envelope with data and principal null on stdout
- [x] #2 Failures emit one diagnostic on stderr and use exits 1 through 6 according to the accepted taxonomy
- [x] #3 --json overrides --plain, non-TTY defaults to plain, pretty output is TTY-only, and --version is bare semver
- [x] #4 Configuration validates additive TOML safely and reports unsupported schema or drift without mutation
- [x] #5 The live manifest enumerates every command, result kind, schema version, and read-only or mutating classification and is covered by goldens
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reconcile the frozen Opum command contract with the QCLI-76 acceptance criteria and inspect the QCLI-75 scaffold.
2. Implement typed result/diagnostic, output-mode, manifest, and additive configuration boundaries; expose only the contract shell with CLI wiring.
3. Add goldens and contract tests for envelope, diagnostics, output precedence, configuration, and manifest validation.
4. Run focused and cumulative checks, obtain independent review, synchronize Lore, and finalize.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and verified the result/diagnostic wire shell, output-mode precedence, additive TOML validation, manifest registry validation with negative cases, and CLI stream/exit contract tests. bun run check passed after independent review remediation.

Independent review found no release blocker and requested broader taxonomy/configuration evidence. Added table-driven diagnostics for every frozen error type, malformed configuration coverage, and read-only configuration-port coverage; bun run check, strict Lore validation/check, and git diff --check passed at ec77389.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the QCLI-76 command contract shell and added independent-review remediation tests. Verified exact success/diagnostic envelopes, exits 1–6, output precedence, bare version, additive configuration, read-only config loading, and manifest goldens with bun run check (9 tests/44 assertions), strict Lore gates, and git diff --check.
<!-- SECTION:FINAL_SUMMARY:END -->
