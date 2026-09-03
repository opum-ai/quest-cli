---
id: QCLI-168
title: >-
  migration backlog preview: surface renumbered pairs as their own section, not
  just diffable across mappings
status: To Do
assignee: []
created_date: '2026-09-03 04:23'
labels:
  - migration
  - cli
  - ux
dependencies: []
priority: medium
ordinal: 197000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When --preserve-source-ids translates a dotted subtask id to a fresh flat id (QCLI-160), the preview's mappings field lists every record -- unchanged and renumbered alike -- with no field or section that isolates the ones where targetIdentifier != sourceIdentifier. A consumer has to diff the whole list by hand to find what actually changes. opum-agent did exactly that against its own live preview on 2026-09-02, misread the diff as a data hazard, and briefed four fleet sessions on a problem the tool's own alias-retention already handled -- direct evidence the current shape makes the wrong thing easy to see and the right thing (what changes vs. what doesn't) easy to miss, in a command whose entire job is telling someone what is about to happen to their data.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 migration backlog preview's output (with --preserve-source-ids) includes a distinct, itemized list of mappings where targetIdentifier differs from sourceIdentifier, separate from the full mappings list
- [ ] #2 each entry in that list is intelligible without cross-referencing the aliases array -- it is visibly a renumbered/translated pair, not just two id strings
- [ ] #3 the existing mappings field is unchanged (additive, not breaking) so any current consumer parsing it keeps working
- [ ] #4 an e2e test previews a source mix of flat and dotted ids and asserts the new section lists exactly the translated ones, no more and no fewer
- [ ] #5 quest migration backlog preview --help's summary is updated to mention the new section
<!-- AC:END -->
