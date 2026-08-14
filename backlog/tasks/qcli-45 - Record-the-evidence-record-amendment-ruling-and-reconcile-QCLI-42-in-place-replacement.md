---
id: QCLI-45
title: >-
  Record the evidence-record amendment ruling and reconcile QCLI-42 in-place
  replacement
status: Done
assignee: []
created_date: '2026-08-07 18:52'
updated_date: '2026-08-14 12:18'
labels:
  - campaign
  - 'cluster:supersession-convention'
  - wave-1
  - 'doc:stories/preserve-quest-cli-documentation-campaign-provenance'
dependencies: []
references:
  - CLAUDE.md
  - docs/reference/quest-cli-activation-gate-evidence-record.md
documentation:
  - docs/stories/preserve-quest-cli-documentation-campaign-provenance.md
priority: medium
type: docs
ordinal: 64000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-42 (commit `3b1e9f5`) deleted and re-tensed QCLI-41's gate-result paragraph in `docs/reference/quest-cli-activation-gate-evidence-record.md` instead of appending a dated inline amendment. The doc-10 wave-1 reviewer assessed this as defensible under CLAUDE.md's "prose a reader would act on today gets corrected in place" branch — the deleted sentence was "the gate result is unchanged: closed", which is actionable prose — but noted it sits at odds with that document's stronger self-declared preserve-and-amend methodology. The reviewer explicitly declined to assert a violation, leaving the convention question genuinely open rather than a known defect. It was surfaced as an approved follow-up in campaign doc-10 and approved for filing by the owner at doc-11 init.

**OWNER RULING (2026-08-07, obtained at doc-11 campaign init, before dispatch): preserve-and-amend governs evidence records.** The record's own stronger methodology wins over CLAUDE.md's general correct-in-place branch. QCLI-42 should have appended a dated amendment rather than deleting and re-tensing QCLI-41's paragraph.

Owner's rationale: the document's stated value is fidelity to what was read on a given date, so deleting the prior reading destroys the thing the record exists to hold. Preserve-and-amend still prevents the stale sentence misleading a reader — it is marked superseded rather than left to read as current — so the correct-in-place branch's concern is met without the loss.

Applying the ruling means two things: record it durably so the next reader does not re-derive it, and restore QCLI-41's replaced wording as preserved-and-superseded text rather than leaving the replacement standing alone.

Constraints on how:

- Do **not** rewrite QCLI-42's own amendment text while fixing it. This repo's supersession convention forbids rewriting historical-record text; amend inline, dated, citing this task (CLAUDE.md's QCLI-44 ruling requires the directing-task citation).
- The prior wording is recoverable from `git show 3b1e9f5^:docs/reference/quest-cli-activation-gate-evidence-record.md`. Restore what QCLI-42 removed, do not paraphrase it from memory.
- Decide and state where the ruling belongs — CLAUDE.md (where the general convention lives) or the evidence record's own methodology section (where the stronger local rule is declared). Either is defensible; pick one, say why, and do not leave the two documents disagreeing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The ruling that preserve-and-amend governs evidence records is recorded and dated in one durable location, naming this task as the directing task, and CLAUDE.md and the evidence record do not contradict each other about which convention applies
- [x] #2 The wording QCLI-42 removed from docs/reference/quest-cli-activation-gate-evidence-record.md is restored verbatim from `git show 3b1e9f5^` as preserved-and-superseded text, marked with the date and the task under which it was superseded
- [x] #3 No existing amendment text is rewritten or deleted: `git diff` shows every edit to prior amendments as an inline dated addition citing this task
- [x] #4 `lore validate --strict` and `lore check` both pass with 0 errors and 0 warnings, with the output recorded verbatim in implementation notes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirmed via git show 3b1e9f5 / 3b1e9f5^ exactly what QCLI-42 removed: the paragraph `LDOC-4` is still `To Do`. The gate's owner has not accepted the release boundary, so **the gate result is unchanged: closed.** Per this record's own constraint, that sentence is a quote of the owner's position, not a conclusion drawn here. — replaced in place by QCLI-42's new open-gate paragraphs rather than preserved.
2. Place the ruling in CLAUDE.md, not the evidence record's own text: CLAUDE.md is already this repo's established durable location for supersession-convention rulings (QCLI-44's directing-task-citation ruling lives there, immediately above where this one will go), and the owner's rationale is phrased as a category rule ('preserve-and-amend governs evidence records', not 'governs this one file'), so it belongs where the general convention already lives rather than being re-declared per document. Insert a new dated, QCLI-45-cited paragraph in CLAUDE.md immediately after the existing QCLI-44 ruling paragraph (currently ending '...(Implementation Notes).') and before the '*-doc/*-cli drift' paragraph. Pure insertion — QCLI-44's paragraph and the surrounding convention text are untouched.
3. In docs/reference/quest-cli-activation-gate-evidence-record.md, restore QCLI-41's removed paragraph verbatim as a blockquote (matching this doc's existing convention for quoting superseded historical text, e.g. the top predicate quote), inserted after the '...ruled on item 1.' sentence and before 'The owner then ruled.' — i.e. in its original chronological position — wrapped in a new dated note: '**Preserved and superseded 2026-08-07 by `QCLI-45`:** ...' citing this task and CLAUDE.md's QCLI-45 ruling, explaining QCLI-42 replaced this paragraph instead of appending an amendment and it is now restored per the owner's ruling. Pure insertion — no existing line touched.
4. Verify: git diff shows only added lines in both files (no deletions/modifications of existing text) for AC#3; grep both files to confirm CLAUDE.md and the evidence record state the same rule (AC#1); confirm the restored blockquote matches git show 3b1e9f5^ byte-for-byte (AC#2).
5. Run lore validate --strict and lore check from the worktree root; capture verbatim output for implementation notes (AC#4). Do not run lore sync.
6. Record implementation notes with the ruling location/rationale and verbatim gate output; commit with Refs: QCLI-45 trailer(s); push the branch. Do not check ACs, write final summary, or move status to Done — orchestrator handles settlement.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RULING RECORDED (AC#1) — CLAUDE.md, immediately after the existing QCLI-44 ruling paragraph (new paragraph inserted before the '*-doc/*-cli drift' section):

'**Ruling (2026-08-07, `QCLI-45`): preserve-and-amend governs evidence records, overriding the correct-in-place branch above.** A dedicated evidence record — a document whose stated value is fidelity to what was read at a given inspection boundary — is amended by appending a dated, superseded-marked note even for prose a reader would otherwise act on today; the correct-in-place branch's is-this-recording-what-was-once-decided-or-telling-a-reader-whats-true-now test does not license deleting or re-tensing an evidence record's own dated reading, because doing so destroys the thing the record exists to hold. Preserve-and-amend still meets the correct-in-place branch's underlying concern — a stale reading is marked superseded, not left to read as current — without that loss. This resolves QCLI-42 (commit 3b1e9f5)... Full reasoning: backlog/tasks/qcli-45-....md.'

LOCATION DECISION AND WHY: placed in CLAUDE.md, not in the evidence record's own text, for two reasons. (1) Precedent: CLAUDE.md is already this repo's established durable location for supersession-convention rulings — QCLI-44's directing-task-citation ruling lives there immediately above where this one was inserted, and QCLI-45's ruling is the same kind of process ruling (which convention governs, not a product/component decision), so it belongs in the same place for the same reason QCLI-44 gave (register/product docs are scoped to product decisions, not documentation-process rulings). (2) The owner's stated rationale is phrased as a category rule ('preserve-and-amend governs evidence records', not 'governs this one file'), so recording it in the one place the general convention already lives covers any future evidence record without requiring each one to separately declare or cross-reference the same carve-out. CLAUDE.md and the evidence record do not disagree: CLAUDE.md now states the exception explicitly and the evidence record's own restored text (see AC#2 below) demonstrates conformance to it, citing the same ruling.

AC#2 — RESTORATION: docs/reference/quest-cli-activation-gate-evidence-record.md, in the 'Trigger fired 2026-08-06' section, inserted a new '**Preserved and superseded 2026-08-07 by `QCLI-45`:**' block in the original chronological position (after '...ruled on item 1.' and before 'The owner then ruled.', i.e. exactly where QCLI-42 replaced it), quoting QCLI-41's removed paragraph verbatim as a blockquote (matching this doc's own convention of blockquoting preserved historical text, as already used for the top predicate quotation):

> `LDOC-4` is still `To Do`. The gate's owner has not accepted the release boundary, so **the gate result is unchanged: closed.** Per this record's own constraint, that sentence is a quote of the owner's position, not a conclusion drawn here.

Verified byte-for-byte against `git show 3b1e9f5^:docs/reference/quest-cli-activation-gate-evidence-record.md` via a diff of the extracted lines (both original and restored, quote markers stripped) — 'MATCH: verbatim restoration confirmed', zero differences.

AC#3 — NO REWRITE: `git diff -- CLAUDE.md docs/reference/quest-cli-activation-gate-evidence-record.md` shows only `+` lines in both files (18 and 18 lines added respectively); zero `-` lines. QCLI-42's own amendment paragraphs ('The owner then ruled...', 'An open Lore gate is not activation...', the QCLI-44 citation note) are untouched — confirmed by inspecting the diff context, which shows them unchanged before and after the new insertion.

GATES (verbatim, run from the worktree root after both edits):

$ lore validate --strict
47 files, 0 errors, 0 warnings, 6 skipped
(exit 0)

$ lore check
47 files, 0 errors, 0 warnings
(exit 0)

OUT-OF-SCOPE FINDINGS: none beyond what QCLI-44's own notes already recorded (the activation-gate-evidence-record.md:67 citation-gap site and the research-source-register.md:420 / backlog-migration-fidelity-contract.md:561 outstanding-citation sites) — none of those are touched by this task's edits and none are newly discovered here.

SETTLEMENT (orchestrator, on dev). Review was run by the orchestrator as an explicit adversarial pass in the skill's degraded mode: three dispatched reviewer subagents terminated without delivering a verdict, so the mandatory gate was re-run in-session rather than skipped.

Independently verified, not taken from the implementer:
- AC#1: CLAUDE.md carries the dated 2026-08-07 ruling citing QCLI-45 as directing task, inserted after the QCLI-44 ruling with that ruling untouched. No contradiction with the evidence record, whose restored text cites the same ruling.
- AC#2: extracted QCLI-42's deletion block from 'git show 3b1e9f5' and compared against this branch's additions — exact match across all four lines of the gate-result paragraph.
- AC#3: 'git diff dev...HEAD -- CLAUDE.md docs/' returned ZERO deletion lines.
- AC#4: gates re-run by the reviewer in the worktree: lore check --strict -> 47 files, 0 errors, 0 warnings; lore validate --strict -> 47 files, 0 errors, 0 warnings, 6 skipped.
- Confirmed no 'lore sync' ran on the branch (docs/log.md untouched).

Reviewer finding [minor], surfaced to the owner rather than fixed here: QCLI-42 also re-tensed a clause in the preceding paragraph ('the Spec now reports' -> 'the Spec reported') which this task did not restore. Judged outside AC#2 — no dated reading was destroyed, the recorded fact survives intact, so there is nothing to mark superseded. Recorded because the new CLAUDE.md text names 'deleting or re-tensing', so a future reader may reasonably ask.

Merged as 866b184 (PR #60), squash message carrying a parseable 'Refs: QCLI-45' trailer.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Recorded the owner's 2026-08-07 ruling that preserve-and-amend governs evidence records — overriding CLAUDE.md's general correct-in-place branch — as a dated, QCLI-45-citing paragraph in CLAUDE.md, chosen over the evidence record's own text because the ruling is a category rule and CLAUDE.md is where this repo's supersession rulings already live (QCLI-44 precedent). Restored the gate-result paragraph QCLI-42 (3b1e9f5) deleted from docs/reference/quest-cli-activation-gate-evidence-record.md as blockquoted preserved-and-superseded text, verified byte-verbatim against 'git show 3b1e9f5^'. Both files changed by pure addition (zero deletion lines), so no prior amendment text was rewritten. Verified with lore check --strict and lore validate --strict, both 0 errors and 0 warnings. Merged as 866b184.
<!-- SECTION:FINAL_SUMMARY:END -->
