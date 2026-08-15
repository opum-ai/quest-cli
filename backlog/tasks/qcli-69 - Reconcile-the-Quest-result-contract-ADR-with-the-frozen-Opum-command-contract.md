---
id: QCLI-69
title: Reconcile the Quest result-contract ADR with the frozen Opum command contract
status: Done
assignee:
  - '@codex'
created_date: '2026-08-12 13:46'
updated_date: '2026-08-13 18:17'
labels:
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
dependencies: []
references:
  - >-
    docs/adr/ratify-the-quest-cli-result-contract-envelope-shape-exit-codes-not-found-and-anomaly.md
  - docs/reference/quest-cli-opum-command-contract-local-obligation.md
  - >-
    https://github.com/opum-ai/opum-doc/blob/dev/docs/specs/opum-command-contract.md
  - QCLI-68
  - opum-doc ODOC-22
documentation:
  - >-
    docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md
  - docs/reference/quest-cli-opum-command-contract-local-obligation.md
modified_files:
  - >-
    docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md
  - docs/log.md
  - docs/reference/quest-cli-component-contracts-and-delivery-graph.md
  - docs/reference/quest-cli-d2-runtime-proposal.md
  - docs/reference/quest-cli-open-component-decisions.md
  - docs/reference/quest-cli-opum-command-contract-local-obligation.md
  - >-
    docs/reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md
  - docs/specs/quest-cli-architecture.md
  - docs/specs/quest-cli-delivery-roadmap.md
  - docs/specs/quest-cli-dependency-ready-set-and-blocking-design.md
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
type: docs
ordinal: 88000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Before quest-cli implements its result layer, reconcile or explicitly ratify the difference between its accepted Quest-specific result-contract ADR and the shared command contract frozen by opum-doc ODOC-22. The local ADR currently fixes a string schema version, separate kind/outcome fields, outcome-specific payload keys, and a 0/1/2/3/64 exit table; the shared contract freezes a numeric schema version, the {schemaVersion, kind, data, principal} pattern, its shared exit taxonomy, a live kind-registry pattern, and structured diagnostics. QCLI-68 commits the future implementation to the shared pattern, so the two records cannot remain silently inconsistent. This task records a deliberate resolution and its authority; it does not presume whether alignment or an explicitly approved divergence is correct.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The exact differences between the accepted Quest result-contract ADR and the frozen Opum command contract are enumerated across envelope fields and types, payload placement, exit-code meanings, kind registry, diagnostics, and reserved principal handling.
- [x] #2 A durable, authority-backed ruling either aligns the Quest contract to the shared pattern or explicitly ratifies each retained divergence and identifies the required opum-doc contract amendment or exception; no difference remains implicit.
- [x] #3 The accepted ADR and every derived Quest contract document affected by the ruling are reconciled consistently, with supersession or amendment provenance preserved rather than silently rewriting history.
- [x] #4 QCLI-68 remains truthful after reconciliation: before any result-layer implementation ships, quest-cli has one unambiguous contract for its result envelope, exit codes, live kind registry, diagnostics, and reserved wire-form `principal: null`.
- [x] #5 Principal establishment and authorization enforcement remain explicitly outside this reconciliation unless separately authorized; the task settles only the reserved command-contract field.
- [x] #6 The future quest-cli conformance-test obligation is updated to enforce the resolved contract, and strict Lore validation/check plus repository diff checks pass.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve the 2026-08-05 Quest-specific ruling as historical provenance and append a dated QCLI-69 amendment that explicitly yields every conflicting wire-contract surface to the frozen ODOC-22 Opum command contract. 2. Reconcile each derived Quest document that currently treats the old schemaVersion, kind/outcome, payload, or exit mapping as live; retain the earlier proposal and historical Story claims as historical records while adding explicit amendment provenance. 3. Strengthen the QCLI-68 local obligation so the future quest-cli conformance test covers the numeric {schemaVersion, kind, data, principal} result envelope, structured diagnostic envelopes, frozen exit taxonomy, live dotted kind registry, output/stream discipline, null principal slot, and deliberate-violation cases without entering principal establishment or authorization enforcement. 4. Couple QCLI-69 to the Phase 1 decision Story, run Lore sync, inspect the complete diff adversarially against all six acceptance criteria and the local ODOC-22 Spec, then run strict Lore validation/check and repository diff checks. 5. Record exact evidence and finalize only if every criterion and gate passes; make local commits only, leaving push, PR, merge, and cleanup for separate authorization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the QCLI-69 reconciliation through Lore-managed documentation. The accepted ADR now carries a dated amendment and exact old-versus-frozen contract table while preserving the original 2026-08-05 decision and consequences under explicit historical headings. Reconciled the local obligation, contracts graph, open-decision register, roadmap, architecture, dependency ready-set design, D2 proposal, historical proposal provenance, and owning Story. The resolved wire contract is numeric {schemaVersion, kind, data, principal}; structured diagnostics; shared exits 0/1/2/3/4/5/6; a live dotted-kind registry; stream/output discipline; and required principal:null until separate ratification. Principal identity and authorization remain out of scope. Verification: first lore validate --strict correctly failed because the amended ADR lacked literal required Decision/Consequences headings; corrected those headings and added current consequences. Then lore sync --json reported 0 files changed; lore validate --strict --plain passed (51 files, 0 errors, 0 warnings, 6 skipped); lore check --strict --plain passed (51 files, 0 errors, 0 warnings); git diff --check passed.

Delivery follow-through on 2026-08-13: refreshed origin/dev to 0f7276bf28252f72f4726f9cd7b3654bb4d4dd95; it remained an ancestor of the clean feature branch, so no rebase was required. Re-ran lore validate --strict (51 files, 0 errors, 0 warnings), lore check --strict (51 files, 0 errors, 0 warnings), and git diff --check against the refreshed base. Pushed docs/qcli-69-result-contract-reconciliation and opened unmerged PR #89 to dev: https://github.com/opum-ai/quest-cli/pull/89. Merge and cleanup remain unauthorized.

Merge authorization on 2026-08-13: after PR #89 was verified OPEN, MERGEABLE, and CLEAN at head 712670622daeba2a6451217551fed4d185baa01f, the user replied "approved" to the explicit merge decision. This provenance update is being added to the PR before the approved squash merge. Branch and worktree cleanup remain unauthorized.

Post-merge reconciliation on 2026-08-13: PR #89 was squash-merged to `dev` at 2026-08-13T17:13:54Z. Exact PR head: `6b0492b917ed4ed794e00b6b470fb88a4cda9724`; exact integration commit: `f2f3ef3b7bac1e3df3686521a1d3f68055970bf0`. The source and integration trees were identical at tree `e18b2db11446170ca317941526dba52b54cb8e09`, and the post-merge strict Lore gates plus `git diff --check` passed. After the user explicitly approved cleanup, the exact local and remote `docs/qcli-69-result-contract-reconciliation` refs were deleted and their absence was verified. The reusable Treehouse worktrees were clean and left untouched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Amended the accepted Quest result-contract ADR to align the live wire contract with ODOC-22 while preserving the 2026-08-05 ruling as explicit historical provenance. Reconciled every derived document that carried the old wire semantics, strengthened QCLI-68 with executable future conformance obligations, and kept principal establishment and authorization out of scope. Verified against the clean local Opum contract source, a 12-assertion focused consistency audit, idempotent Lore sync, lore validate --strict (51 files, 0 errors, 0 warnings), lore check --strict (51 files, 0 errors, 0 warnings), and git diff --check. Adversarial self-review found no remaining live old-contract assertion outside sections explicitly marked historical. Delivered in PR #89 to dev; the user authorized its squash merge after GitHub reported the PR MERGEABLE and CLEAN. The merge follows the tracked authorization record; cleanup remains separately unauthorized.

Post-merge settlement: PR #89 merged as `f2f3ef3b7bac1e3df3686521a1d3f68055970bf0`; its source tree matched the integrated tree exactly, final validation passed, and the user-authorized local and remote feature-branch cleanup completed without touching Treehouse worktrees.
<!-- SECTION:FINAL_SUMMARY:END -->
