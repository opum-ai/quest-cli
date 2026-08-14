---
id: QCLI-50
title: Settle whether tense-only edits fall under preserve-and-amend
status: Done
assignee:
  - '@claude'
created_date: '2026-08-07 20:28'
updated_date: '2026-08-14 12:18'
labels:
  - campaign
  - 'cluster:supersession-convention'
  - wave-3
  - 'doc:stories/preserve-quest-cli-documentation-campaign-provenance'
dependencies: []
documentation:
  - docs/stories/preserve-quest-cli-documentation-campaign-provenance.md
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
- [x] #1 An owner decision is recorded and dated on whether tense-only edits that preserve the recorded fact fall under preserve-and-amend
- [x] #2 CLAUDE.md deleting-or-re-tensing wording is reconciled with that decision, so the ruling and the practice no longer admit two readings
- [x] #3 If the decision is that re-tensing IS covered, the QCLI-42 re-tensed clause in the evidence record is restored verbatim from `git show 3b1e9f5^` as preserved-and-superseded text; if it is NOT covered, the reason is recorded where a future sweeper will find it
- [x] #4 The amendment to CLAUDE.md existing QCLI-45 ruling is inline and dated and cites this task; `git diff` shows no rewritten prior ruling text
- [x] #5 `lore validate --strict` and `lore check` both pass with 0 errors and 0 warnings, output recorded verbatim in implementation notes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read CLAUDE.md's QCLI-45 ruling paragraph and the evidence record's re-tensed clause (docs/reference/quest-cli-activation-gate-evidence-record.md, 'Trigger fired 2026-08-06' section, 'the Spec reported items 2, 3, and 4' sentence) to confirm exact anchor text.
2. Amend CLAUDE.md inline, appending (never rewriting) a new dated paragraph after the existing QCLI-45 ruling paragraph that narrows the 'or re-tensing' wording per the owner ruling: re-tensing is only covered by preserve-and-amend when it alters/obscures what the record asserts was read; a pure present->past shift preserving the recorded reading is ordinary housekeeping. Cite QCLI-50 inline and dated 2026-08-07. Zero deletions.
3. Add an inline dated note in docs/reference/quest-cli-activation-gate-evidence-record.md near the QCLI-42/QCLI-45 passage in the 'Trigger fired 2026-08-06' section explaining that the re-tensed clause ('reported' vs 'now reports') is NOT restored, citing QCLI-50 and the narrowed test, so a future sweeper does not read the omission as an oversight. This is the primary 'future sweeper' location since that's the file a sweeper audits. Pure addition, no deletion/re-tense.
4. Run lore validate --strict and lore check from repo root; capture verbatim output. Do NOT run lore sync.
5. Verify git diff shows 0 deletion lines in both CLAUDE.md and docs/.
6. Record implementation notes via backlog task edit --append-notes with placement rationale and verbatim gate output.
7. Commit with Refs: QCLI-50 trailer in final trailer block, verify with git interpret-trailers.
8. Push branch docs/qcli-50-tense-only-edits-ruling.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the owner ruling verbatim: tense-only edits that preserve the recorded fact are NOT covered by preserve-and-amend.

PLACEMENT DECISION: both files, each with its own inline dated addition citing QCLI-50 (no cross-referencing shortcut).
- CLAUDE.md: appended a new dated ruling paragraph immediately after the existing QCLI-45 ruling paragraph (before the '*-doc peer / *-cli peer' paragraph), narrowing 'or re-tensing' to: covered only when the edit alters or obscures what the record asserts was read; a pure present->past shift preserving the reading is housekeeping. States the QCLI-42 application and rejects the logging-every-instance variant, per the owner's rationale.
- docs/reference/quest-cli-activation-gate-evidence-record.md: appended a 'Disposition recorded 2026-08-07 by QCLI-50' note in the 'Trigger fired 2026-08-06' section, directly after the QCLI-45-restored blockquote and before 'The owner then ruled.' This is the primary 'future sweeper' location per AC #3 -- a sweeper auditing this record for unreconciled QCLI-42 edits reads this file directly, not CLAUDE.md. The note sits immediately below the paragraph containing the actual re-tensed clause ('the Spec reported items 2, 3, and 4...'), so the omission is legible in context.
Both additions are pure insertions -- git diff shows 0 deletion lines in both CLAUDE.md and docs/. No existing ruling or record text was reworded, deleted, or re-tensed.

AC #3: second branch fires (NOT covered) -- reason recorded in both locations above, per owner ruling.

GATE OUTPUT (verbatim):

$ lore validate --strict
[... 47 concept files, each 'ok', 6 index/log files 'skip (not a concept)' ...]
47 files, 0 errors, 0 warnings, 6 skipped
EXIT_VALIDATE:0

$ lore check
47 files, 0 errors, 0 warnings
EXIT_CHECK:0

No lore sync run (forbidden on this branch per dispatch constraints).

Review fix (post-4393fae): the note's locator wording was wrong — it pointed at 'the paragraph preceding this note,' but the paragraph immediately preceding is the LDOC-4 blockquote (which contains no such sentence), not the paragraph with the re-tensed clause, which sits two blocks earlier. Reworded the locator to identify that paragraph by its opening words ('...beginning "The moving reference this record warned about has moved"') instead of by relative position, so the reference stays correct if another dated amendment is inserted between the clause and this note. The before/after quotation of the re-tensed clause is unchanged.

SETTLEMENT (doc-11 wave 3, 2026-08-07). Merged as `0f07c27` (PR #65), rebased onto `7c68170` and re-verified before merge.

Implements the owner's ruling obtained at this restore, before dispatch: tense-only edits that preserve the recorded fact are ordinary housekeeping, not preserve-and-amend. AC #3's second branch fired — nothing was restored in the evidence record.

Review ran in the skill's degraded mode (orchestrator-run adversarial pass) and returned `request_changes` once before `approve`.

REQUEST_CHANGES CYCLE (resolved in `c0a6124`, rebased to `0ec9e52`). The first commit's evidence-record note located the re-tensed clause as 'the paragraph preceding this note'. That was wrong: the immediately preceding block is the `LDOC-4` blockquote, and the clause sits two blocks earlier at line 210, separated by both the QCLI-45 preserved-and-superseded paragraph and that blockquote. A reader following the pointer landed in the wrong place — in a document whose stated value is precision.

Fixed with a **structure-independent** locator: the paragraph is now identified by its opening words ('The moving reference this record warned about has moved') rather than by relative position, so the reference stays correct if a future dated amendment is inserted between the clause and the note — the same rot this bug class comes from. Verified the named paragraph does contain the clause.

Worth recording why review, not tooling, caught this: `lore validate --strict` and `lore check` both pass **on the defective version**. A wrong prose cross-reference is invisible to a link checker. The before/after quotation of the clause was correct throughout, so the note was never misleading about *what* changed — only about where to look.

Independently verified by the orchestrator:
- 0 deletion lines in `CLAUDE.md` and `docs/` against the wave base, checked both pre-rebase and post-rebase. (The commit's 2 raw deletions are `assignee: []` and `updated_date` frontmatter churn in the task file — inspected directly, not accepted as a characterization.)
- Both gates reproduced post-rebase: `lore validate --strict` → 47 files, 0 errors, 0 warnings, 6 skipped; `lore check` → 47 files, 0 errors, 0 warnings.
- Both branch commits carry a parseable `Refs: QCLI-50` trailer.

Placement decision endorsed: the rationale lives in BOTH `CLAUDE.md` (the reconciled ruling, AC #2/#4) and the evidence record (AC #3's 'where a future sweeper will find it'), each self-contained rather than cross-referencing. A sweeper auditing the record for unreconciled QCLI-42 edits reads that file directly, so a CLAUDE.md-only note would have been findable in principle and missed in practice.

Wave-level integration review: this task's files are disjoint from QCLI-49's, and `lore check --strict` on `dev` post-merge reports 47 files, 0 errors, 0 warnings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Settled the ambiguity between `CLAUDE.md`'s QCLI-45 ruling — which says the correct-in-place test 'does not license deleting or re-tensing an evidence record's own dated reading' — and the scope judgment QCLI-45's own review made when it restored QCLI-42's deleted paragraph but not its re-tensed clause.

The owner ruled that **tense-only edits are not covered by preserve-and-amend**: a pure present-to-past shift that leaves the recorded reading intact is ordinary housekeeping. `CLAUDE.md`'s 'or re-tensing' wording is narrowed to an explicit test — re-tensing is covered only when the edit alters or obscures what the record asserts was read — so the ruling and the practice no longer admit two readings. This ratifies rather than overturns the earlier review's judgment; a variant requiring a logged amendment for every tense-only edit was considered and rejected as recreating most of the burden the ruling lifts.

Applied to the case that raised it: QCLI-42's re-tensed clause in `quest-cli-activation-gate-evidence-record.md` is deliberately **not** restored, because the recorded fact — that the Spec reported items 2, 3 and 4 satisfied at pin `d2a9a9e11ddf` — survives identically under both phrasings, leaving no destroyed reading to mark superseded. The reason is recorded in both `CLAUDE.md` and the evidence record itself, so a sweeper auditing that document does not read the omission as an oversight.

Both additions are inline, dated, cite QCLI-50, and delete nothing: 0 deletion lines across `CLAUDE.md` and `docs/`, verified pre- and post-rebase. `lore validate --strict` and `lore check`: 47 files, 0 errors, 0 warnings. Merged as `0f07c27` (PR #65), after one review cycle that corrected a wrong locator in the evidence-record note.
<!-- SECTION:FINAL_SUMMARY:END -->
