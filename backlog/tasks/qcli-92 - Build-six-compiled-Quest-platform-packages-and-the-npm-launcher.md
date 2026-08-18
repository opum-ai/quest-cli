---
id: QCLI-92
title: Build six compiled Quest platform packages and the npm launcher
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-16 18:25'
labels:
  - quest-0.1
  - 'wave:release'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-83
  - QCLI-85
  - QCLI-91
documentation:
  - docs/reference/quest-cli-packaging-contract.md
  - docs/reference/quest-cli-d2-runtime-ruling.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - package.json
  - bin/quest.cjs
  - npm/
priority: high
type: chore
ordinal: 110000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the Lore-aligned distribution layout for @opum-ai/quest: a minimal Node launcher selecting compiled optional-dependency binaries for macOS, Linux, and Windows on x64 and arm64. Bun SQLite must work inside every artifact without a host Bun installation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The root package exposes quest through a minimal Node launcher and declares exactly six same-version optional platform packages
- [x] #2 Each platform package contains one compiled binary with correct os and cpu constraints, license, provenance, and package metadata
- [x] #3 Launcher selection, missing-platform diagnostics, --version, manifest, and a SQLite-backed smoke operation pass from packed tarballs
- [x] #4 Published-package candidates contain no runtime dependency on Bun, LadybugDB, source TypeScript, private workspace paths, or development fixtures
- [x] #5 Version and checksum consistency is mechanically verified across root and platform artifacts
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect the existing runtime, packaging contract, and current release tooling to define the six-platform artifact layout.
2. Build the Node launcher and platform package manifests/artifacts with deterministic version and checksum verification.
3. Exercise packed-tarball launcher, platform selection, manifest/version, and SQLite smoke behavior.
4. Run focused packaging checks, obtain independent review, integrate, and settle evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Integrated at dev tree 93db33040b094f972347dfd3bb2aa2ca02dcc7e9 after independent review. Final evidence: bun run check:packages; bun run test:packages; bun test test/contract/cli-process.test.ts test/cli-tracker-process.test.ts (5 pass, 24 expectations); bun run typecheck; source-scoped Biome; git diff --check. The broad root formatter gate remains pre-existing Treehouse nested-config discovery; root layer check remains the pre-existing migration boundary violation, while task-scoped checks pass. Bun automatic cross-target extraction failed twice at darwin-x64; QUEST_BUN_TARGETS_DIR=/private/tmp/quest-bun-targets built all six without packaging the fallback.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Built and integrated the Node launcher, six platform binary packages, SHA-256/version checks, and packed-tarball smoke coverage. Verified artifact contents, platform metadata, launcher diagnostics/version/manifest/SQLite smoke, focused CLI regressions, typecheck, scoped formatting, and diff hygiene at 93db330.
<!-- SECTION:FINAL_SUMMARY:END -->
