---
id: QCLI-72
title: Reconcile and freeze the Quest 0.1 implementation baseline
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 01:01'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reconcile the four active Quest design documents against ODOC-57’s accepted local actor/delegation ADR and the existing D2/Opum/Lore decisions.
2. Replace stale lifecycle, D2, Lore-adapter, activation, preview, and projection claims without reopening accepted product choices.
3. Run Lore reconciliation and strict validation gates, independently review the final diff, then finalize QCLI-72 with objective evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-14 campaign grounding: not activated. Live repository evidence still routes gate-approval actor eligibility and D6 to the external ODOC-57 ruling; the target docs contain no adopted ruling. QCLI-72 cannot truthfully freeze the requested actor vocabulary until the ODOC-57 outcome is available in the authorized quest-cli scope.

2026-08-14 external recheck: ODOC-57 is Done on opum-doc origin/dev. Its accepted ADR defines opaque human/delegated-agent actors, accountable-human delegation, role separation, and the prohibition on delegated-agent satisfaction of human-judgement or separation-of-duty gates.
<!-- SECTION:NOTES:END -->
