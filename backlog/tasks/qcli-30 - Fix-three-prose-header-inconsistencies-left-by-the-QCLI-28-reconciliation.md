---
id: QCLI-30
title: Fix three prose/header inconsistencies left by the QCLI-28 reconciliation
status: To Do
assignee: []
created_date: '2026-08-06 00:29'
updated_date: '2026-08-06 00:29'
labels:
  - campaign
  - 'cluster:reconciliation-cleanup'
dependencies: []
references:
  - docs/reference/quest-cli-component-contracts-and-delivery-graph.md
  - docs/specs/quest-cli-delivery-roadmap.md
  - docs/specs/quest-cli-architecture.md
priority: low
type: docs
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-28 reconciled the Quest CLI open component decisions register, contracts graph, and delivery roadmap against the Phase 1 ADRs, marking several items Closed. Its reviewer found three residual passages nearby that still read as if those items are open, contradicting the reconciliation that just landed next to them. Proposed by QCLI-28's reviewer during wave 2 of the Phase-1-ratification campaign (recorded in backlog/docs/campaigns/doc-4).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/reference/quest-cli-component-contracts-and-delivery-graph.md's section intro (near line 600) is corrected to reflect that items in the section can be Closed, consistent with the four items already marked Closed just below it
- [ ] #2 docs/specs/quest-cli-delivery-roadmap.md's D3 row 'Register entry' cell (near line 123) no longer reads 'currently owned by no task' and is consistent with the register's D3 owner cell
- [ ] #3 docs/specs/quest-cli-architecture.md's Open Questions (near lines 236 and 242) no longer ask whether anomaly is a first-class outcome class or where it sits in the taxonomy, since QCLI-24's ADR already answered both at the component level
- [ ] #4 lore validate --strict passes
- [ ] #5 No content changes are made to the three documents beyond correcting these three passages
<!-- AC:END -->
