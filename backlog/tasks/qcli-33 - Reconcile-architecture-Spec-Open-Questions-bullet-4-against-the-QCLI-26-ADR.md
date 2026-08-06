---
id: QCLI-33
title: Reconcile architecture-Spec Open Questions bullet 4 against the QCLI-26 ADR
status: To Do
assignee: []
created_date: '2026-08-06 10:48'
updated_date: '2026-08-06 10:49'
labels:
  - campaign
  - 'cluster:architecture-spec'
dependencies: []
references:
  - docs/specs/quest-cli-architecture.md
priority: medium
type: docs
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
quest-cli-architecture.md Open Questions bullet 4 (~line 263) still asks whether the projection port needs transactional semantics, framed as unsettleable "before the scale target (D5)". D5 is now closed — QCLI-31 closed it, citing the QCLI-26 ADR — and that same ADR already answers the question directly at its line 114 ("No durable transactional index is required to satisfy this scale target"). QCLI-31 deliberately left this passage untouched (its AC6 scope fence forbade touching it); this task picks up where it left off, same shape as QCLI-31: reconcile a Spec passage that reads as open against a Phase-1 ADR that has since settled it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Open Questions bullet 4 in docs/specs/quest-cli-architecture.md no longer frames the transactional-semantics question as unsettled pending D5
- [ ] #2 The passage cites the QCLI-26 ADR (rebuild-on-doubt ruling, ~line 114) as the resolution, consistent with how QCLI-31 cited the same ADR for the adjacent passage
- [ ] #3 No other Open Questions bullet or unrelated passage is modified
- [ ] #4 lore validate --strict passes with 0 errors and 0 warnings
- [ ] #5 lore check reports 0 errors
<!-- AC:END -->
