---
id: QCLI-152
title: >-
  Imported Backlog timestamps are not normalised to ISO-8601, so the new date
  sort compares mixed formats
status: To Do
assignee: []
created_date: '2026-08-30 00:22'
labels: []
dependencies: []
references:
  - 'src/application/migration/backlog-public.ts:99'
  - 'src/adapters/migration/backlog/importer.ts:335'
  - src/application/tasks/tasks.ts
priority: medium
type: bug
ordinal: 183000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-137 promoted the importer's parsed createdAt/updatedAt onto the task record, and restored createdAt/updatedAt as task list --sort fields. The two do not compose: the imported values are copied verbatim from Backlog front matter and are never normalised.

Backlog writes created_date as '2025-06-01' or '2025-06-02 14:23'. Quest-native stamps are new Date().toISOString(), so '2026-08-29T23:39:46.314Z'. Two consequences:

1. 'quest task list --sort createdAt' compares those lexicographically. '2025-06-02 14:23' and '2025-06-02T14:23:00.000Z' do not order against each other the way a reader expects, and a space sorts before 'T', so same-instant records interleave by format rather than by time.
2. A consumer calling new Date(value) gets a LOCAL-timezone parse for the imported form and a UTC parse for the native one. The same displayed instant shifts by the host offset depending on where the record came from.

QCLI-137 made the date sort trustworthy for native records. This is what stops it being trustworthy for imported ones, which is the corpus that matters for a Backlog cutover.

Found by independent review of the QCLI-135 branch, out of that task's scope. Not a regression: before QCLI-137 the values were not on the record at all.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Imported createdAt and updatedAt are normalised to ISO-8601 UTC at import, so every task record carries one timestamp format regardless of origin
- [ ] #2 A date-only source value is normalised without inventing a time of day it did not state, or is deliberately not promoted; whichever is chosen is recorded as a decision rather than left implicit
- [ ] #3 task list --sort createdAt orders a mixed corpus of imported and native records correctly, proved by a test containing both
- [ ] #4 An unparseable source timestamp does not silently become a wrong date: it is either omitted or fails the import loudly
<!-- AC:END -->
