---
id: QCLI-68
title: Record quest-cli local obligation to the frozen Opum command contract
status: Done
assignee:
  - '@codex'
created_date: '2026-08-12 11:21'
updated_date: '2026-08-12 11:24'
labels:
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
dependencies: []
references:
  - >-
    https://github.com/opum-ai/opum-doc/blob/dev/docs/specs/opum-command-contract.md
  - opum-doc ODOC-22
documentation:
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
ordinal: 87000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Record quest-cli adoption of the frozen opum-doc command contract under ODOC-22 without duplicating the normative Spec or claiming product implementation that does not exist.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A short repository-local obligation links the stable opum-doc dev-branch Spec URL and identifies ODOC-22 as its cross-repository source.
- [x] #2 The note commits quest-cli result envelopes, exit codes, kind registry, and diagnostics to the frozen pattern, including reserved wire-form `principal: null`, before implementation ships.
- [x] #3 Because quest-cli has no src or test tree, the note records a forward-looking conformance-test commitment and does not invent a current test citation.
- [x] #4 The note explicitly excludes principal establishment and enforcement as a separate unresolved problem.
- [x] #5 Lore sync, strict validation, strict check, and git diff checks pass.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Scaffold a short Reference concept with Lore and author only the repository-local ODOC-22 obligation: stable Spec link, forward-looking command-contract adoption, reserved `principal: null`, and the principal-establishment/enforcement disclaimer. 2. Couple QCLI-68 to the Phase 1 result-contract Story and run Lore sync so managed status and indexes remain coherent. 3. Verify the focused diff and run lore sync, lore validate --strict, lore check --strict, and git diff --check. 4. Finalize QCLI-68 with objective gate evidence, commit the documentation change, push the feature branch, and open an unmerged PR to dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Authored a new Lore Reference rather than modifying or copying the normative opum-doc Spec. The latest origin/dev tree contains no src/, test/, tests/, package.json, or runtime project files, so the note truthfully records a forward-looking component-owned conformance test instead of citing a nonexistent test. Manual focused-diff review confirmed the stable Spec URL, ODOC-22 provenance, all four contract surfaces, `principal: null`, and the principal-mechanism disclaimer. Initial unpiped gates: lore sync exit 0; lore validate --strict exit 0 (50 files, 0 errors, 0 warnings, 6 skipped); lore check --strict exit 0 (50 files, 0 errors, 0 warnings); git diff --check exit 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added docs/reference/quest-cli-opum-command-contract-local-obligation.md as a short local adoption record for opum-doc ODOC-22. It commits future quest-cli output to the frozen envelope, exit-code, kind-registry, and diagnostics pattern with reserved `principal: null`; defers principal establishment/enforcement; and records the required future conformance-test properties because no implementation or test tree exists. Coupled QCLI-68 to the Phase 1 result-contract Story and verified the Lore bundle with strict validation/check plus git diff checking.
<!-- SECTION:FINAL_SUMMARY:END -->
