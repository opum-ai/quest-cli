---
id: QCLI-152
title: >-
  Imported Backlog timestamps are not normalised to ISO-8601, so the new date
  sort compares mixed formats
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-30 00:22'
updated_date: '2026-08-30 01:03'
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
- [x] #1 Imported createdAt and updatedAt are normalised to ISO-8601 UTC at import, so every task record carries one timestamp format regardless of origin
- [x] #2 A date-only source value is normalised without inventing a time of day it did not state, or is deliberately not promoted; whichever is chosen is recorded as a decision rather than left implicit
- [x] #3 task list --sort createdAt orders a mixed corpus of imported and native records correctly, proved by a test containing both
- [x] #4 An unparseable source timestamp does not silently become a wrong date: it is either omitted or fails the import loudly
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Normalisation happens where the value is PROMOTED onto the task record (src/application/migration/backlog-public.ts), not where it is parsed. That seam keeps source fidelity and sortability from trading against each other: the provenance blob still carries the raw Backlog string verbatim, so nothing is lost, while the top-level field a consumer sorts on is always ISO-8601 UTC.

Two decisions recorded in the code rather than left implicit (AC2):
- Zone-less input reads as UTC, not local. Backlog writes '2025-06-02 14:23' with no offset. Reading it as local time would make the same file import to different instants on different machines - the import would stop being deterministic, which matters more here than guessing the author's timezone correctly.
- A bare date normalises to midnight UTC. That is the canonical instant for 'that day', not a claim about the hour. Refusing to promote it was the alternative, and it would leave a whole Backlog corpus unsortable, which is the defect being closed.

AC4: unparseable input is dropped rather than turned into a wrong date, and nothing is lost by that because the raw form stays in the provenance blob. Asserted directly.

Verified: bun run check exits 0. The new e2e test covers all four Backlog shapes (zone-less datetime, bare date, full ISO-8601, and a non-date) and asserts the resulting mixed corpus sorts by time rather than by format, with the unparseable record last as unknown. Proven RED by reverting the one-line promotion change.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Imported Backlog timestamps are normalised to ISO-8601 UTC where they are promoted onto the task record, so the date sort QCLI-137 restored now orders a mixed corpus by time rather than by string format. Zone-less input reads as UTC to keep the import deterministic across machines; a bare date becomes midnight UTC; unparseable input is dropped rather than becoming a wrong date, losing nothing because the raw source string stays in the provenance blob. Verified by an e2e test covering all four Backlog shapes and asserting the resulting sort order, proven red against its own revert; bun run check exits 0.
<!-- SECTION:FINAL_SUMMARY:END -->
