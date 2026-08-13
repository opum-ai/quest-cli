---
id: QCLI-54
title: >-
  Bind the campaign doc's Stage reached column to a stage scale and settle
  post-dispatch recording cadence
status: Done
assignee:
  - '@codex'
created_date: '2026-08-08 18:28'
updated_date: '2026-08-13 13:32'
labels:
  - wave-4
dependencies: []
modified_files:
  - .claude/skills/backlog-handover/reference/wave-loop.md
  - .claude/skills/backlog-handover/reference/templates.md
  - .claude/skills/backlog-handover/SKILL.md
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
- [x] #1 reference/wave-loop.md's per-task stage-number table explicitly states whether it governs the campaign doc's in-flight Stage reached column, the handover's, or both; reference/templates.md's two Stage reached columns each cite the governing scale
- [x] #2 A settled decision, with stated reasoning, on whether a recording pass is mandated at any point after dispatch — including the explicit option of not mandating one, with the cost to SKILL.md R2 step 5's fourth signal named and accepted
- [x] #3 If further passes are mandated, reference/wave-loop.md names each trigger point and its owner, consistent with QCLI-49's rule that in-flight-pointer recording is committed immediately and QCLI-47's one-trailer-per-recorded-task rule
- [x] #4 The rule requires the recorded annotation to be consistent with the cited stage numeral, so 0b63077's '6 — under review' would be prevented or flagged rather than written
- [x] #5 SKILL.md R2 step 5's fourth-signal wording is reconciled with whatever is settled — strengthened if recording becomes mandated, left hedged if not — with no passage left overstating the signal
- [x] #6 The three folded-in narrow corrections in SKILL.md R2 step 5 are applied: the five-vs-six enumeration is corrected with both methods named, the circular consistency clause is dropped, 0b63077 is characterised as a disclosing recovery record, and 'substate' is narrowed to 'review-substate'
- [x] #7 The skill Provenance section records this change per the repo convention, and the skill version is bumped or the absence of a bump is explicitly justified
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Bind the per-task stage scale to both durable Stage reached columns and require the annotation to restate the defined stage meaning; terminal review outcomes that are not approve retain the last completed numeric stage and name the non-approve verdict separately. 2. Add one orchestrator-owned terminal-review snapshot pass after every member review pipeline has reached approve, merge-blocked, or escalated and before the merge walk starts. Record all wave members in one campaign-doc pass, commit immediately, push immediately, and include one Refs trailer per recorded task under the existing QCLI-47, QCLI-49, and QCLI-60 rules. This fills the approved-before-PR recovery gap while limiting cost to one additional bookkeeping commit and push per wave; per-transition recording is rejected as disproportionate churn, and no added pass is rejected because it leaves the fourth recovery signal stale for the entire wave. 3. Reconcile SKILL.md R2 step 5 with the mandated snapshot: correct the phrase-keyed five versus content-sweep six history, remove the circular enumeration claim, characterize 0b63077 as a fully disclosing recovery record whose numeral drifted, narrow substate to review-substate, and make signal counts and evidentiary limits internally consistent. 4. Add QCLI-54 provenance and bump 0.9.1-qcli.9 to 0.9.1-qcli.10 because the new snapshot pass is required orchestrator behavior. 5. Verify all seven acceptance criteria by targeted searches, historical commit inspection, git diff --check, and sequential adversarial self-review before finalization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the user-approved workflow decision in the three scoped skill files. wave-loop now binds both durable Stage reached columns to one scale, adds one orchestrator-owned terminal-review snapshot after all review pipelines settle and before the merge walk, mandates immediate commit/push plus one parseable Refs trailer per recorded task, and reserves stage 6 for an actual approve verdict. templates cites the scale at both tables. SKILL R2 now uses four durable sources, strengthens the campaign-table signal at the terminal barrier, applies the review-substate and 0b63077 disclosure corrections, and records version 0.9.1-qcli.10 provenance. Historical verification corrected creation-time drift: QCLI-54 was filed against five phrase-keyed versus six content-swept commits, but live base e7114f3 includes later a801c54, making the current counts six versus seven and six stage-1 commits. Objective checks: /private/tmp/qcli54-verify.mjs passed 13 contract assertions covering stage parsing, both template bindings, terminal trigger/owner, commit/push/trailer obligations, legacy 6-under-review rejection, R2 corrections, and version/provenance; git merge-base confirmed a801c54 is an ancestor of e7114f3; the full campaign-doc diff sweep enumerated all seven recording commits and their added stage rows; git diff --check passed. Sequential adversarial self-review, not independent review, found no blocking correctness, scope, or stale-operative-prose issue; QCLI-52 dated Provenance remains intentionally historical and the new QCLI-54 entry supersedes its unresolved cadence question. Only the three declared source files changed, alongside task and doc-15 campaign bookkeeping. No commit, push, PR, merge, final summary, terminal status, or cleanup performed because delivery authority is still absent; retain branch and lease.

Delivery verification: implementation PR #82 reviewed exact remote head 6123ee550d5fe4a042532f7155a2fb1f9edc1fd8 against base e7114f309a9fde418f9e1057c344410f3070f008, reported MERGEABLE/CLEAN with no reported checks, and squash-merged to dev as d327345c5991bf0c6bbbf531829ea870e5e01653. The reviewed-head and integration trees are byte-identical at tree 6b436bca8a7e17b3202234638aa6ffd51ab53429; the integration message parses Refs: QCLI-54; the integration diff passes git diff --check; all 13 contract assertions pass again on the integration tree.

Closure verification: finalization PR #83 reviewed exact head 4cdcb0f5fca1e50e9ce5aa789569f205b1717589 against base d327345c5991bf0c6bbbf531829ea870e5e01653, reported MERGEABLE/CLEAN with no reported checks, and squash-merged as 88eadf72140383e046d2346e7fb86bfee4acc5fd. Reviewed and integration trees are identical at c15d05e8b400964587fc0f6bdabc9001b877cf61; the integration message parses Refs: QCLI-54; git diff --check passed. Original lease d8b338584906fc3ae4a4cc0826c1e606 was returned after clean-state verification; implementation and finalization local/remote refs are absent after remote pruning; all six Treehouse slots were available before the temporary cleanup-reconciliation lease was acquired.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Bound the campaign document and active handover Stage reached columns to one stage scale, added a mandatory orchestrator-owned terminal-review snapshot before the merge walk with immediate commit/push and per-task trailers, reserved stage 6 for actual approval, reconciled R2 recovery guidance and historical counts, and bumped the skill to 0.9.1-qcli.10. Verified through 13 executable contract assertions, the complete seven-commit history sweep, ancestry checks, adversarial self-review, integration tree identity, parsed Refs trailer, and git diff --check. Delivered by PR #82 as d327345c5991bf0c6bbbf531829ea870e5e01653.
<!-- SECTION:FINAL_SUMMARY:END -->
