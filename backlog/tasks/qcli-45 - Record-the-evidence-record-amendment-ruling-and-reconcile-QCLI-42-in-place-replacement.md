---
id: QCLI-45
title: >-
  Record the evidence-record amendment ruling and reconcile QCLI-42 in-place
  replacement
status: To Do
assignee: []
created_date: '2026-08-07 18:52'
labels:
  - campaign
  - 'cluster:supersession-convention'
dependencies: []
references:
  - CLAUDE.md
  - docs/reference/quest-cli-activation-gate-evidence-record.md
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
- [ ] #1 The ruling that preserve-and-amend governs evidence records is recorded and dated in one durable location, naming this task as the directing task, and CLAUDE.md and the evidence record do not contradict each other about which convention applies
- [ ] #2 The wording QCLI-42 removed from docs/reference/quest-cli-activation-gate-evidence-record.md is restored verbatim from `git show 3b1e9f5^` as preserved-and-superseded text, marked with the date and the task under which it was superseded
- [ ] #3 No existing amendment text is rewritten or deleted: `git diff` shows every edit to prior amendments as an inline dated addition citing this task
- [ ] #4 `lore validate --strict` and `lore check` both pass with 0 errors and 0 warnings, with the output recorded verbatim in implementation notes
<!-- AC:END -->
