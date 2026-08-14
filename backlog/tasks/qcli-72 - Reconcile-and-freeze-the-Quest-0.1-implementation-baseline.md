---
id: QCLI-72
title: Reconcile and freeze the Quest 0.1 implementation baseline
status: To Do
assignee: []
created_date: '2026-08-14 18:08'
updated_date: '2026-08-14 18:27'
labels:
  - quest-0.1
  - 'wave:contracts'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies: []
documentation:
  - docs/specs/quest-cli-delivery-roadmap.md
  - docs/specs/quest-cli-functional-requirements.md
  - docs/specs/quest-cli-architecture.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - docs/specs/quest-cli-delivery-roadmap.md
  - docs/reference/quest-cli-open-component-decisions.md
  - docs/adr/
priority: high
type: docs
ordinal: 90000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Freeze a coherent implementation baseline from the accepted Quest research and current cross-product decisions before product code begins. Reconcile stale runtime, Lore-adapter, lifecycle, migration-preview, projection, and authority statements; consume the actor vocabulary ruled by opum-doc ODOC-57; and record Bun SQLite as the disposable projection engine. This task closes documentation drift only and does not reopen accepted product decisions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The active design layer consistently records Bun, Bun SQLite, the current Opum result contract, and the current Lore tracker seam
- [ ] #2 Lifecycle defaults, lease timing, terminal retention, actor eligibility, source aliases, and one-way migration behavior match the approved implementation campaign
- [ ] #3 The older nonzero outstanding-preview rule is superseded so a successful read-only migration preview exits 0 with requiresApproval and a digest
- [ ] #4 The open-decisions register and delivery roadmap contain no stale D2, D6, Backlog-only Lore-adapter, or pre-activation blocker claims
- [ ] #5 lore sync, lore validate --strict, lore check --strict, and git diff --check pass
<!-- AC:END -->
