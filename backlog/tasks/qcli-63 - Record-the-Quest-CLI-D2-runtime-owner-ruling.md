---
id: QCLI-63
title: Record the Quest CLI D2 runtime owner ruling
status: To Do
assignee: []
created_date: '2026-08-09 07:42'
labels:
  - decisions
  - governance
dependencies: []
references:
  - docs/reference/quest-cli-open-component-decisions.md
  - docs/reference/quest-cli-d2-runtime-proposal.md
  - docs/reference/quest-cli-license-platform-and-runtime-ownership-record.md
priority: high
type: docs
ordinal: 82000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The component owner ruled D2 (runtime and native packaging) in a live session on 2026-08-09: Bun, matching the shipped @opum-ai/lore runtime and its compiled per-platform binary distribution. The ruling is recorded portfolio-wide in opum-doc's 'Adopt Bun as the runtime for Opum command-line components' ADR; quest-cli owns D2 (ownership claimed by QCLI-27) and so records the closure here.

This discharges the hazard QCLI-61 was filed to guard: that the first worker acting on CLAUDE.md's product-source permission would decide D2 by construction, pre-empting a ruling reserved for the owner. The owner has now ruled, so no worker decides it implicitly.

Follows the QCLI-27 precedent: governance-level rulings that close register entries without an architectural trade-off are recorded as dated Reference documents citing their provenance, not as ADRs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A dated Reference record states the D2 ruling: runtime = Bun, with the compiled per-platform binary distribution pattern matching @opum-ai/lore
- [ ] #2 The record names the 2026-08-09 owner ruling as provenance and cites opum-doc's Bun ADR as the portfolio-level decision
- [ ] #3 The open component decisions register's D2 row is updated from Blocked to Closed, with the Unblocked-by cell citing this ruling
- [ ] #4 The register's D2 detail paragraph is amended to record the closure without rewriting its existing history
- [ ] #5 The roadmap-versus-register disagreement over whether D2 gates Phase 2 or only Phase 6 is left UNRESOLVED and unamended, per QCLI-61's explicit non-goal
- [ ] #6 lore validate --strict and lore check both pass with zero errors and zero warnings
<!-- AC:END -->
