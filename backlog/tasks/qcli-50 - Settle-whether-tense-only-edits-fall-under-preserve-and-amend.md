---
id: QCLI-50
title: Settle whether tense-only edits fall under preserve-and-amend
status: To Do
assignee: []
created_date: '2026-08-07 20:28'
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
Raised as a minor finding during `QCLI-45`'s review (doc-11 wave 1, 2026-08-07) and deliberately not acted on there, because it was judged outside that task's AC #2.

Commit `3b1e9f5` (`QCLI-42`) made **two** edits to `docs/reference/quest-cli-activation-gate-evidence-record.md`, not one:

1. It deleted the gate-result paragraph ("`LDOC-4` is still `To Do` ... **the gate result is unchanged: closed.**"). `QCLI-45` restored this verbatim as preserved-and-superseded text.
2. It **re-tensed** a clause in the immediately preceding paragraph: "and the Spec **now reports** items 2, 3, and 4 of the predicate as satisfied" became "and the Spec **reported** items 2, 3, and 4 of the predicate as satisfied." `QCLI-45` did **not** restore this.

The reviewer's reasoning for excluding it: no dated reading was destroyed. The recorded fact — that the Spec reported items 2, 3, and 4 satisfied at pin `d2a9a9e11ddf` — survives intact in both versions; only the tense marker relative to the reader's present changed. There is nothing to mark superseded, so AC #2's "restored ... as preserved-and-superseded text" has no referent.

The tension: the ruling `QCLI-45` itself wrote into `CLAUDE.md` says the correct-in-place test "does not license deleting **or re-tensing** an evidence record's own dated reading." Read literally, that names re-tensing as covered. So `CLAUDE.md` and the reviewer's scope judgment can be read as disagreeing, and a future reader sweeping the record has no stated way to resolve it.

This is a convention question, not a defect: **the owner should decide whether tense-only edits that preserve the recorded fact fall under preserve-and-amend, or whether they are ordinary housekeeping.** Both readings are defensible and the point is to stop the ambiguity, not to presume the answer.

Constraint: whatever is decided, `CLAUDE.md`'s existing `QCLI-45` ruling paragraph is a historical-record amendment and must be amended **inline and dated, citing this task** — not rewritten (`CLAUDE.md`'s `QCLI-44` ruling).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An owner decision is recorded and dated on whether tense-only edits that preserve the recorded fact fall under preserve-and-amend
- [ ] #2 CLAUDE.md deleting-or-re-tensing wording is reconciled with that decision, so the ruling and the practice no longer admit two readings
- [ ] #3 If the decision is that re-tensing IS covered, the QCLI-42 re-tensed clause in the evidence record is restored verbatim from `git show 3b1e9f5^` as preserved-and-superseded text; if it is NOT covered, the reason is recorded where a future sweeper will find it
- [ ] #4 The amendment to CLAUDE.md existing QCLI-45 ruling is inline and dated and cites this task; `git diff` shows no rewritten prior ruling text
- [ ] #5 `lore validate --strict` and `lore check` both pass with 0 errors and 0 warnings, output recorded verbatim in implementation notes
<!-- AC:END -->
