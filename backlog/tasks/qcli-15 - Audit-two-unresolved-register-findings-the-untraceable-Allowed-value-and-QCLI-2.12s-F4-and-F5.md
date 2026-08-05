---
id: QCLI-15
title: >-
  Audit two unresolved register findings: the untraceable Allowed value and
  QCLI-2.12's F4 and F5
status: In Progress
assignee: []
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 13:13'
labels:
  - campaign
  - 'cluster:provenance'
  - register
  - audit
  - correction
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-1
  - merge-pending
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: medium
type: spike
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two residual findings against the research source register were recorded in settlement notes and never filed. Both are audits first: confirming one is already closed is a valid and useful outcome, not a failure.

Finding A - QCLI-2.1 settlement recorded that the "Prior QCLI research records" slice is classified Allowed on sound reasoning, but that the specific classification value is not traceable to the task notes it cites. Two sibling findings from the same settlement were later closed by QCLI-2.7; this one was not.

Finding B - QCLI-2.12 notes state "F4/F5 (non-blocking, out of scope for this fix pass) - not touched; left for the orchestrator to track." No tracking record exists. Complicating this: the same task carries a separate escalation over findings also numbered F2, F3, and F4 from the wave-4 integration review, and that escalation was resolved on 2026-08-04 via the Option A self-pin. The two numbering schemes are different, so establish which F4 and F5 the out-of-scope note meant before assuming either is open.

Do not reclassify any source. This task closes a traceability gap and an audit gap, not an admission decision.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The Allowed classification on the named slice is either traced to admitting evidence, or the gap is recorded explicitly with what would close it
- [ ] #2 The F4 and F5 referenced by QCLI-2.12's out-of-scope note are identified against the correct numbering scheme, and each is recorded as already resolved or still open with evidence
- [ ] #3 No source slice classification value is changed by this task
- [ ] #4 Findings confirmed already closed are recorded as closed with the evidence that closed them, not silently dropped
- [ ] #5 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->
