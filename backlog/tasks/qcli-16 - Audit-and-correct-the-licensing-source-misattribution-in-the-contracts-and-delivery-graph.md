---
id: QCLI-16
title: >-
  Audit and correct the licensing-source misattribution in the contracts and
  delivery graph
status: In Progress
assignee: []
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 12:48'
labels:
  - campaign
  - 'cluster:synthesis'
  - correction
  - provenance
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-1
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: low
type: docs
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-2.8 settlement recorded a licensing-source misattribution in its own deliverable, described as not affecting the document conclusion, and left it as-is. It was never filed.

The licensing entry under Unresolved component decisions states that Backlog.md MIT licensing and npm registry metadata were admitted as naming-conflict and allocation evidence only, never as license guidance. Verify what the document actually attributes to which source, against the research source register slices that admit them, and correct any attribution the register does not support.

The conclusion - that product licensing is open and owner-held - is not in question and must not change. This is an attribution fix.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The attribution in question is identified precisely, quoting the document and the register slice that governs it
- [ ] #2 Any attribution the register does not support is corrected inline and dated, citing this task
- [ ] #3 The licensing decision status remains open and owner-held, unchanged by this task
- [ ] #4 If the audit finds the attribution is in fact correct, that finding is recorded with evidence rather than treated as no work
- [ ] #5 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->
