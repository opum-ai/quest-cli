---
id: QCLI-50
title: Settle whether tense-only edits fall under preserve-and-amend
status: To Do
assignee: []
created_date: '2026-08-07 20:28'
updated_date: '2026-08-08 01:07'
labels:
  - campaign
  - 'cluster:supersession-convention'
dependencies: []
priority: low
type: docs
ordinal: 69000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**OWNER RULING (2026-08-07, obtained at doc-11 wave-2 restore, before this task is dispatched) — tense-only edits are NOT covered by preserve-and-amend.**

A tense-only edit that preserves the recorded fact is **ordinary housekeeping**, not a supersession. `CLAUDE.md`'s "or re-tensing" wording is to be **narrowed by an inline dated amendment citing this task** to a stated test:

> Re-tensing is covered by preserve-and-amend **only when the edit alters or obscures what the record asserts was read**. A pure present→past shift that leaves the recorded reading intact is housekeeping.

Concretely: **nothing is restored in `docs/reference/quest-cli-activation-gate-evidence-record.md`.** `QCLI-42`'s re-tensed clause ("the Spec **now reports** items 2, 3, and 4 of the predicate as satisfied" → "the Spec **reported** ...") stays as it is. The reason must be written where a future sweeper will hit it, so the exclusion does not read as an oversight.

Owner's rationale: this ratifies the scope judgment `QCLI-45`'s review already made, rather than overturning it. The recorded fact — that the Spec reported items 2, 3, and 4 satisfied at pin `d2a9a9e11ddf` — survives identically in both versions, so there is no destroyed reading to mark superseded and AC #2's "restored ... as preserved-and-superseded text" would have no referent. A logging-every-instance variant was considered and rejected: it recreates most of the amendment burden the ruling just lifted.

This ruling settles AC #1 — it *is* the recorded, dated owner decision. AC #3's **second** branch is the one that fires. AC #1 is satisfied by implementing this faithfully, not by seeking a further decision.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An owner decision is recorded and dated on whether tense-only edits that preserve the recorded fact fall under preserve-and-amend
- [ ] #2 CLAUDE.md deleting-or-re-tensing wording is reconciled with that decision, so the ruling and the practice no longer admit two readings
- [ ] #3 If the decision is that re-tensing IS covered, the QCLI-42 re-tensed clause in the evidence record is restored verbatim from `git show 3b1e9f5^` as preserved-and-superseded text; if it is NOT covered, the reason is recorded where a future sweeper will find it
- [ ] #4 The amendment to CLAUDE.md existing QCLI-45 ruling is inline and dated and cites this task; `git diff` shows no rewritten prior ruling text
- [ ] #5 `lore validate --strict` and `lore check` both pass with 0 errors and 0 warnings, output recorded verbatim in implementation notes
<!-- AC:END -->
