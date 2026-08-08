---
id: QCLI-54
title: >-
  Bind the campaign doc's Stage reached column to a stage scale and settle
  post-dispatch recording cadence
status: To Do
assignee: []
created_date: '2026-08-08 18:28'
labels: []
dependencies: []
priority: medium
type: chore
ordinal: 73000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

`SKILL.md` R2 step 5 (as of `QCLI-52`, skill version `0.9.1-qcli.7`) directs a crash-recovery reader to use the campaign doc's in-flight table as one of four durable review-substage signals. Two defects in the underlying mechanism limit what that signal can carry. Both live in `reference/`, outside the legibility-text scope `QCLI-52` was held to.

## Defect 1 — staleness

`reference/wave-loop.md` mandates an in-flight-pointer-recording pass at dispatch only. No later transition — plan recorded, implemented, committed, pushed, reviewed-to-`approve` — requires a further pass, so `Stage reached` can sit at `1 — dispatched` for an entire wave.

Not hypothetical. Across the complete history of six commits that wrote in-flight rows (`82fca71`, `68ce681`, `61d48af`, `0b63077`, `146956d`, `3107d3a`), five record stage 1. Observed live: at doc-13 wave 1's integration review the table read `1 — dispatched` for `QCLI-52` while that task was already merged. `QCLI-52` hedged R2's wording correctly against this, but the hedge costs the signal most of its value.

## Defect 2 — no binding scale (the deeper cause)

`reference/wave-loop.md`'s per-task stage-number table scopes itself to "**the handover's** in-flight table" and never claims jurisdiction over the *campaign doc's* `Stage reached` column. `reference/templates.md` defines both tables with that column and points neither at the scale. The column is therefore free text with no definition an orchestrator is bound by.

This is the direct cause of `0b63077`, which wrote `6 — under review` when stage 6 is defined as "Reviewed to `approve`" and the branch had reached only stage 5. Doc-10's settled campaign doc corrects that row inline. A downstream rule reading the bare numeral would have trusted a wrong 6 — which is exactly the rule `QCLI-52`'s first implementation attempted to add before review caught it.

Worth carrying forward: `0b63077` was written by the *recovering* session and its annotation fully disclosed the true state ("implemented, committed, pushed by a session that then died; review dispatched on resume"). No reader was misled, and doc-10's settled text calls the mechanism "working exactly as designed." The defect is the free-text numeral drifting from the stage definitions, not the signal itself.

## Folded-in narrow corrections

Three single-sentence corrections in `SKILL.md` R2 step 5, folded here rather than filed separately because they edit the same paragraph AC #5 below would revisit:

1. "Five in-flight-pointer-recording commits exist" undercounts. Five match the phrase-keyed enumeration; a content-based sweep of all campaign-doc writes finds **six** — `3107d3a` ("chore(backlog): fold owner rulings and restore-1 evidence into the campaign") writes a stage row with no "in-flight pointer" phrase in its message. The merged text discloses this limitation as unverified; it has since been verified and the variant found. Also drop the circular clause "which every recording commit found here uses consistently" — a phrase-grep tautologically returns only commits containing the phrase.
2. Add that `0b63077` was a disclosing recovery record (see above), so a reader does not infer "the in-flight table is unreliable" instead of "the free-text numeral can drift."
3. "the one substate record this campaign commits on purpose" → "the one *review*-substate record", to avoid apparent tension with the stage-state table where Dispatched and Done are both committed.

## Scope note

Distinct from `QCLI-53`'s (f)/(g) discard-timing mismatch and from `QCLI-52`'s completed legibility work. This is mechanics in `reference/wave-loop.md` and `reference/templates.md`, plus the R2 step 5 reconciliation those changes imply.

## Origin

Surfaced by doc-13 wave 1's integration review (2026-08-08), supersedes that wave's original in-flight-staleness proposal, and filed with the user's explicit approval at that campaign's R6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 reference/wave-loop.md's per-task stage-number table explicitly states whether it governs the campaign doc's in-flight Stage reached column, the handover's, or both; reference/templates.md's two Stage reached columns each cite the governing scale
- [ ] #2 A settled decision, with stated reasoning, on whether a recording pass is mandated at any point after dispatch — including the explicit option of not mandating one, with the cost to SKILL.md R2 step 5's fourth signal named and accepted
- [ ] #3 If further passes are mandated, reference/wave-loop.md names each trigger point and its owner, consistent with QCLI-49's rule that in-flight-pointer recording is committed immediately and QCLI-47's one-trailer-per-recorded-task rule
- [ ] #4 The rule requires the recorded annotation to be consistent with the cited stage numeral, so 0b63077's '6 — under review' would be prevented or flagged rather than written
- [ ] #5 SKILL.md R2 step 5's fourth-signal wording is reconciled with whatever is settled — strengthened if recording becomes mandated, left hedged if not — with no passage left overstating the signal
- [ ] #6 The three folded-in narrow corrections in SKILL.md R2 step 5 are applied: the five-vs-six enumeration is corrected with both methods named, the circular consistency clause is dropped, 0b63077 is characterised as a disclosing recovery record, and 'substate' is narrowed to 'review-substate'
- [ ] #7 The skill Provenance section records this change per the repo convention, and the skill version is bumped or the absence of a bump is explicitly justified
<!-- AC:END -->
