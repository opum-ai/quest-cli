---
id: QCLI-15
title: >-
  Audit two unresolved register findings: the untraceable Allowed value and
  QCLI-2.12's F4 and F5
status: Done
assignee:
  - '@claude'
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 13:46'
labels:
  - campaign
  - 'cluster:provenance'
  - register
  - audit
  - correction
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-1
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: medium
type: spike
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two residual findings against the research source register were recorded in settlement notes and never filed. Both are audits first: confirming one is already closed is a valid and useful outcome, not a failure.

Finding A - QCLI-2.1 settlement recorded that the "Prior QCLI research records" slice is classified Allowed on sound reasoning, but that the specific classification value is not traceable to the task notes it cites. Two sibling findings from the same settlement were later closed by QCLI-2.7; this one was not.

Finding B - QCLI-2.12 notes state "F4/F5 (non-blocking, out of scope for this fix pass) - not touched; left for the orchestrator to track." No tracking record exists. Complicating this: the same task carries a separate escalation over findings also numbered F2, F3, and F4 from the wave-4 integration review, and that escalation was resolved on 2026-08-04 via the Option A self-pin. The two numbering schemes are different, so establish which F4 and F5 the out-of-scope note meant before assuming either is open.

Do not reclassify any source. This task closes a traceability gap and an audit gap, not an admission decision.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The Allowed classification on the named slice is either traced to admitting evidence, or the gap is recorded explicitly with what would close it
- [x] #2 The F4 and F5 referenced by QCLI-2.12's out-of-scope note are identified against the correct numbering scheme, and each is recorded as already resolved or still open with evidence
- [x] #3 No source slice classification value is changed by this task
- [x] #4 Findings confirmed already closed are recorded as closed with the evidence that closed them, not silently dropped
- [x] #5 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Investigated QCLI-2.1 (settlement residual findings), QCLI-2.7 (which closed 2 of 3 sibling findings), and QCLI-2.12 (both its own task file and the review-follow-up section) via backlog task view.
2. Finding A: confirmed via grep that QCLI-1/QCLI-3/QCLI-4's own task notes never discuss the register's Allowed/Contextual/etc. vocabulary (it postdates them, authored by QCLI-2.1 itself) - the Allowed value for 'Prior QCLI research records' traces only to the register's own Ownership-rationale reasoning (current, live quest-cli authored-requirement material), not to any classification statement inside the cited task notes. Per AC1, record this gap explicitly in that slice plus what would close it, without reclassifying.
3. Finding B: disambiguate the two F4/F5 numbering schemes by reading QCLI-2.12's task file directly. Scheme 1 = the pre-merge 'Review follow-up (2026-08-04)' pass (F1 blocking/AC7, F2 blocking/AC6, F3 non-blocking/fixed, F4/F5 non-blocking/out-of-scope/not touched) - this is literally where the quoted out-of-scope sentence appears. Scheme 2 = the wave-4 integration review's separate F2/F3/F4 (register enumeration + revision-pin + ledger attribution gaps), resolved 2026-08-04 via Option A self-pin, merged PR #17 squash c8dfdca - already closed, confirmed via task notes + campaign tracker (backlog/docs/campaigns/doc-1).
4. Searched exhaustively for scheme-1 F4/F5's actual content: QCLI-2.12 task notes, backlog/docs/campaigns/doc-1 and doc-3, archive/handovers/*.md, docs/reference/quest-cli-open-component-decisions.md (which independently records the same gap, corroborating scope but adding no content), git log including dangling/unreachable objects (git fsck), and GitHub PR #14 reviews/comments via gh api (all empty - this repo's review process isn't posted to GitHub, only summarized in backlog notes). Conclusion: scheme-1 F4/F5's substance was never recorded anywhere retrievable in this repository - only the one-line summary survives.
5. Record both findings in docs/reference/quest-cli-research-source-register.md: (a) a dated audit note in the 'Prior QCLI research records' slice for Finding A per AC1/AC3/AC4; (b) a dated audit note in the '## Notes' section (matching the existing QCLI-2.7/QCLI-2.12 narrative-note convention) for Finding B, naming the correct scheme, confirming scheme-2 is closed with evidence, and recording scheme-1 F4/F5 as still-open/untracked with the content-unrecoverable evidence and what would close it, per AC2/AC4.
6. No Classification field value changes anywhere (AC3) - verify via grep/diff before and after.
7. Run lore validate --strict, lore check, lore orphans; capture exact output (AC5).
8. Record decisions + gate evidence via --append-notes; commit docs/ changes (and docs/log.md if lore sync touches it) with Refs: QCLI-15 trailers; push branch.
9. Report out-of-scope observation: docs/reference/quest-cli-open-component-decisions.md's two rows for these exact findings are now stale (should say 'filed as QCLI-15' / 'resolved') but that file is out of my scope per the task brief.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Both residual findings audited against docs/reference/quest-cli-research-source-register.md; no source reclassified (verified: Classification-field count 19 before and after, byte-identical lines aside from line-number shift from inserted prose).

Finding A (Allowed traceability, AC1): checked whether QCLI-1/QCLI-3/QCLI-4's own task notes (grep for allow/admiss/classif) establish the Prior QCLI research records slice's Allowed value - they do not; none discuss the register's Classification vocabulary because the register (and that vocabulary's application here) postdates all three, first authored by QCLI-2.1 itself. Confirmed the finding is real, not stale. Recorded in place in the slice's Ownership rationale field: the Allowed value traces to that field's own reasoning applied against the vocabulary's Allowed definition (authored requirement/decision material, not third-party or legacy), not to an admission inside the cited notes: and recorded what would close the gap fully - an explicit owner ruling ratifying self-classification-by-vocabulary, the same instrument already used for the lore-cli split rule and the Backlog.md authorship-independence ruling. Also recorded (per AC4) that two sibling findings from the same QCLI-2.1 settlement paragraph were closed by QCLI-2.7 (release-gate-evidence classification gap; Backlog-corpus closed-list-to-catch-all gap) - confirmed via QCLI-2.7's own task notes line 77.

Finding B (QCLI-2.12 F4/F5, AC2): disambiguated the two F-numbering schemes by reading QCLI-2.12's task file directly. Scheme 1 = the pre-merge Review follow-up (2026-08-04) pass (F1 blocking/AC7 fixed 77b01f2, F2 blocking/AC6 fixed d6a67e5, F3 non-blocking fixed da9c529, F4/F5 non-blocking explicitly not touched) - this is the literal source of the quoted out-of-scope sentence. Scheme 2 = the wave-4 integration review's separately-restarted F1-F6 numbering (backlog/docs/campaigns/doc-1, Wave 4 section); its F2/F3/F4 are a different, later, already-closed matter, resolved 2026-08-04 via the owner's Option A self-pin, merged PR #17 squash c8dfdca - confirmed closed, not what the note means.

Searched exhaustively for scheme-1 F4/F5's actual content before concluding it is unrecoverable: QCLI-2.12's own task notes and comments, backlog/docs/campaigns/doc-1 and doc-3, archive/handovers/*.md (all 6), docs/reference/quest-cli-open-component-decisions.md (corroborates the gap's existence, adds no content), git fsck --unreachable for dangling objects from the pre-squash branch (found and read F1/F2/F3's individual commits by SHA - 77b01f2, d6a67e5, da9c529 - no F4/F5 commits exist because none was made), and GitHub PR #14 via gh api repos/opum-ai/quest-cli/pulls/14/reviews and /comments and /issues/14/comments (all empty - this project's review passes are narrated only in Backlog task notes, never posted to GitHub). Conclusion: F4 and F5's substance was never captured anywhere retrievable in this repository; only the one-line summary in QCLI-2.12's notes survives. Recorded in the register's Notes section as open, with the absence-of-content itself as the evidence, and what would close it (recovering the original reviewer output if a transcript still exists elsewhere, then filing it as a normal finding) rather than inferring content.

Gate output (re-run after lore sync reconciled an unrelated in-progress status-drift on the campaign Story): lore validate --strict --plain -> 38 files, 0 errors, 0 warnings, 6 skipped, exit 0. lore check --strict --plain -> 38 files, 0 errors, 0 warnings, exit 0. lore orphans --plain -> 0 orphan tasks, 0 dangling links, exit 0.

Out-of-scope observation (not acted on, per task scope boundary): docs/reference/quest-cli-open-component-decisions.md still lists both findings in its 'Residual items recorded but never filed' table as if unfiled; both are now filed and audited by this task, so those two rows are stale. That file's target ownership sits with a different task per this wave's shared-file rule, not this one.

Commits: 449fa4a (Refs: QCLI-15, docs/register + docs/log.md + Story managed-block sync); 9433acb (chore(backlog): sync task changes, auto-committed by lore sync when the in-progress status/plan were recorded).

Fix pass (reviewer request_changes, 2026-08-05): applied both required fixes to docs/reference/quest-cli-research-source-register.md's Traceability audit note (Prior QCLI research records slice, Ownership rationale field).

F1 (major, required): the audit note's enumeration at ~line 1079 named only six members while asserting the conclusion over "every enumerated member" of a slice the register itself states (line 918) enumerates fourteen. Fixed by reusing the slice's own correct exhaustive formulation (from the Exclusions field, ~line 1109) in place of the incomplete list: now reads "every enumerated member -- the component charter, the migration ledger, the research Spec, the accepted ADR, this register itself, and the nine QCLI-2.2-QCLI-2.10 Reference deliverables -- is quest-cli's own authored requirement or decision record...". The underlying conclusion (all members are quest-cli's own authored material, none third-party/legacy) is unchanged -- only which members are named was wrong.

F2 (minor, recommended): the note misquoted QCLI-2.1's settlement text -- attributed "classified Allowed on sound reasoning, but that specific value is not traceable to the task notes it cites" to QCLI-2.1 verbatim, but QCLI-2.1's actual text (confirmed via `backlog task view QCLI-2.1 --plain`) has no comma before "but" and ends at "the task notes" with no "it cites" (that phrase originates in QCLI-15's own task description, not QCLI-2.1's record). Fixed by correcting the quoted text to match QCLI-2.1 verbatim.

No Classification value changed (grep -c '^- \*\*Classification:\*\*' = 19, before and after, matching the pre-fix-pass count). No file other than the register touched.

Gate re-run after fixes: `lore validate --strict --plain` -> 38 files, 0 errors, 0 warnings, 6 skipped, exit 0. `lore check --strict --plain` -> 38 files, 0 errors, 0 warnings, exit 0. `lore orphans --plain` -> 0 orphan tasks, 0 dangling links, exit 0.

Verified by independent reviewer (2 rounds): AC1 confirmed — the Allowed classification on 'Prior QCLI research records' is genuinely untraceable to QCLI-1/3/4's task notes (reviewer independently grepped all three, zero hits); recorded in place with a concrete closure condition. AC2 confirmed — the two numbering schemes for QCLI-2.12's F4/F5 correctly disambiguated (reviewer independently read QCLI-2.12's task file and confirmed the source sentence); scheme-1 F4/F5's content confirmed unrecoverable via git fsck --unreachable, GitHub PR review/comment API, and full-history grep, recorded open with that absence as evidence — reviewer reproduced all negative-search claims independently and added a broader check of its own. AC3 confirmed — 19 Classification lines byte-identical before/after. AC4 confirmed — QCLI-2.7-closed sibling findings recorded closed with line-77 evidence. AC5 confirmed: lore validate --strict 38/0/0/6 skipped; lore check 38/0/0; lore orphans 0/0 (re-run after rebase, still green). Merged to dev via PR #28, squash commit 6b78fd0bfebcc68a824e50c62d8aa1270eb48ba6.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Audited two residual research-source-register findings recorded in settlement notes but never filed. Finding A (the 'Prior QCLI research records' slice's Allowed classification) confirmed genuinely untraceable to admitting evidence in the cited task notes; recorded with a concrete closure condition (an owner ruling ratifying self-classification-by-vocabulary). Finding B (QCLI-2.12's F4/F5) disambiguated against two distinct in-corpus numbering schemes; the correct scheme's content confirmed unrecoverable after an exhaustive search and recorded open with that absence as evidence, rather than assumed resolved. No source Classification value changed. Reviewer caught one factual defect in the audit's own prose (an enumeration understating the register slice's member count 6-of-14, reusing the slice's own correct formulation to fix) plus a minor misquote, both corrected. All 5 ACs independently confirmed by reviewer across two review rounds, with independent reproduction of both central judgment calls. Reviewer also confirmed and broadened an integration finding: the open-component-decisions.md 'residual items' table will carry stale rows for multiple wave members once merged. Merged to dev via PR #28 (squash 6b78fd0).
<!-- SECTION:FINAL_SUMMARY:END -->
