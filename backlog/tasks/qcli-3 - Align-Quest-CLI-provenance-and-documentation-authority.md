---
id: QCLI-3
title: Align Quest CLI provenance and documentation authority
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-01 17:53'
updated_date: '2026-08-01 17:54'
labels:
  - audit
  - documentation
  - authority
  - quest
  - provenance
  - no-implementation
  - 'doc:stories/audit-quest-cli-documentation-authority'
dependencies: []
references:
  - >-
    ../opum-doc/backlog/tasks/ocli-6 -
    Audit-and-remediate-cross-product-documentation-authority.md
documentation:
  - docs/stories/audit-quest-cli-documentation-authority.md
priority: high
type: docs
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remediate quest-cli component documentation under the cross-product authority audit led by opum-doc OCLI-6. Preserve the sole active QCLI research campaign, complete OCLI provenance, point to the Lore-owned release gate, and make component navigation cohesive without adding product source.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The OCLI-to-QCLI ledger covers every former record with exactly one successor or explicit non-adoption disposition and no parallel active campaign
- [ ] #2 The root index and active research Story directly link the component ADR, charter, research Spec, migration ledger, and context-free handover
- [ ] #3 Lore release-gate detail is owned by lore-doc and consumed here only as a named activation obligation
- [ ] #4 No product source, dependency, package scaffold, implementation task, or release claim is added
- [ ] #5 Lore sync, strict validation, strict checking, Lore agents check, Story/task rollup, git diff check, and semantic review pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Verify QCLI task mapping and component authority against quest-doc and opum-doc. 2. Complete non-adoption/successor dispositions and replace duplicated Lore gate wording with an owner pointer. 3. Connect root and active-Story navigation across the component ADR, charter, Spec, ledger, and handover. 4. Synchronize, run strict gates and stale-language review, finalize with evidence, and commit documentation/task changes only.
<!-- SECTION:PLAN:END -->
