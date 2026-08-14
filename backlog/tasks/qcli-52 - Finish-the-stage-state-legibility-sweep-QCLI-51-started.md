---
id: QCLI-52
title: Finish the stage-state legibility sweep QCLI-51 started
status: Done
assignee: []
created_date: '2026-08-08 14:43'
updated_date: '2026-08-14 12:18'
labels:
  - campaign
  - 'cluster:skill-docs'
  - wave-1
  - 'doc:stories/preserve-quest-cli-documentation-campaign-provenance'
dependencies: []
documentation:
  - docs/stories/preserve-quest-cli-documentation-campaign-provenance.md
priority: medium
type: chore
ordinal: 71000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

QCLI-51 (merged as `79545d6`, 2026-08-08) reconciled `.claude/skills/backlog-handover/SKILL.md`'s campaign stage-state table with the fact that the `in-review` and `merge-pending` labels are applied to the working tree and then deliberately discarded uncommitted, so neither is ever observable in committed Backlog state.

doc-12 wave 1's wave-level integration review found two passages that still describe where campaign substate is legible without accounting for what is actually committed. Both are the same defect class QCLI-51 closed; neither is a defect in QCLI-51's merged diff.

## The two passages

1. **`SKILL.md`'s "Stage state" convention row** reads: "Backlog has three statuses, the campaign has six stages. Status carries the coarse state, labels carry the sub-stage — see the state table below." After QCLI-51 that is only two-thirds true: for two of the six stages the labels carry the sub-stage *only in the working tree*, never in committed state. It sits roughly 15 lines upstream of the table that now corrects it, so a cold reader forms exactly the impression QCLI-51 was chartered to remove before reaching the correction. It is not a contradiction — it does say "see the state table below" — but it is the one passage left asserting the pre-QCLI-51 framing unqualified.

2. **`SKILL.md` R2 step 5's list of durable signals is presented as exhaustive and is not.** It says "Derive the review substage instead from what actually persists:" and enumerates three signals (the orchestrator's own `<default>` working-tree dirtiness, the worktree's own `git log`, `gh pr list`). It omits the campaign doc's **in-flight table** — the one substate record this campaign commits on purpose. `reference/templates.md` defines its columns (`Worktree path | Branch | Stage reached`); `reference/wave-loop.md`'s scope note states the in-flight pointer commit "is always committed immediately"; and commit `68ce681` (doc-12 wave 1) is a worked example. That is a durable, purpose-built substage record and arguably stronger evidence than any of the three currently listed. Nothing is broken today — R1/R3 do consult the campaign doc — but step 5 is precisely where a crash-recovery reader is told what persists.

## Method note for whoever picks this up

QCLI-51's own AC#5 sweep could not have caught either passage: that sweep grepped `in-review`/`merge-pending`, and neither passage contains those strings. The sweep was correct within its stated method. A sweep for this task must not be scoped the same way — search for prose *about* where substate is recorded, not for the label names.

## Origin

Surfaced by doc-12 wave 1's integration review (2026-08-08), recorded as an unfiled proposal in doc-12 and filed with the user's explicit approval at that campaign's R6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SKILL.md's Stage state convention row no longer asserts unqualified that labels carry the sub-stage, and is consistent with the stage-state table's durability column without requiring the reader to reach the table first
- [x] #2 SKILL.md R2 step 5 names the campaign doc's in-flight table among the durable signals that classify a leftover branch's review substage, or states explicitly why it is excluded
- [x] #3 A sweep scoped to prose about where campaign substate is recorded (not to the label names) finds no further passage across SKILL.md and reference/*.md asserting the pre-QCLI-51 framing; the sweep's method and results are recorded in the task notes
- [x] #4 The change is consistent with QCLI-49's rule that mid-wave task-file label edits are never committed on <default> while the branch is unmerged, and with QCLI-51's merged framing
- [x] #5 The skill Provenance section records this change per the repo convention, and the skill version is bumped or the absence of a bump is explicitly justified
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read .claude/skills/backlog-handover/SKILL.md and reference/{wave-loop,templates,escalation}.md in full; confirm both target passages (Stage-state Conventions row, line 90; R2 step 5, line 159) and check reference/*.md for the same pre-QCLI-51 framing.
2. Verify how the campaign doc's in-flight table actually behaves in practice: read reference/templates.md's In-flight section, reference/wave-loop.md's per-task stage table and section (i) scope note, and the two real in-flight-pointer-recording commits (68ce681 doc-12 wave-1, 82fca71 doc-13 wave-1) to confirm what "Stage reached" actually records and how often.
3. Edit SKILL.md line 90 (Stage-state row): state inline that labels carry the sub-stage for four of six stages, name the two exceptions and cite QCLI-51, without requiring the reader to reach the table first.
4. Edit SKILL.md R2 step 5: add the campaign doc's in-flight table as a fourth durable signal, worded to match verified behavior (positive-only proof: a later recorded stage is durable evidence, but its absence is inconclusive since no recording pass is mandated at every stage transition) rather than overclaiming exhaustiveness.
5. Run the AC#3 sweep: grep SKILL.md + reference/*.md across a list of angle terms for prose about where substate is recorded/persists/is legible (not the label strings) and confirm no further passage asserts the pre-QCLI-51 framing; explicitly leave the QCLI-53-owned (f)/(g) discard-timing mismatch untouched.
6. Add a Provenance entry (0.9.1-qcli.7) documenting both fixes, the AC#3 sweep, and the AC#5 version reasoning, in the same evidence-dense register as prior entries; bump the frontmatter version.
7. Record notes (sweep commands + results, AC-by-AC evidence) and a --comment flagging the in-flight-table recording-cadence question as a possible separate follow-up. Commit with Refs: QCLI-52 trailer(s), verify with git interpret-trailers, and push.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Passage 1 — SKILL.md Stage-state Conventions row (AC#1)

Before: "Backlog has three statuses, the campaign has six stages. Status carries the coarse state, labels carry the sub-stage — see the state table below" (unqualified).

After: "Backlog has three statuses, the campaign has six stages. Status carries the coarse state; labels carry the sub-stage for four of the six stages — for the other two (`in-review`, `merge-pending`) the label is applied to the working tree and deliberately discarded before it is ever committed (`QCLI-51`), so it carries no sub-stage in Backlog's committed state at all. See the durability column in the state table below for exactly which four vs which two"

Verified against the actual table (SKILL.md lines 105-112): of the six stages (Queued, Dispatched, In review, Merge-pending, Done, Blocked/needs-human), four (Queued, Dispatched, Done, Blocked/needs-human) have a committed label/status distinguishing them; two (In review, Merge-pending) rely on a label that is applied to the working tree and discarded, per line 116, before ever being committed. "Four of six / two of six" is accurate, not approximate. The qualification is now stated in the row itself, not deferred to the table.

## Passage 2 — SKILL.md R2 step 5 (AC#2)

Added the campaign doc's in-flight table (`reference/templates.md`'s `Stage reached` column) as a fourth durable signal alongside the existing three (orchestrator `<default>` dirtiness, worktree `git log`, `gh pr list`).

Verification before wording it: read `reference/wave-loop.md`'s per-task stage table (lines 321-335, stages 0-6) and its section (i) scope note (line 223: in-flight pointer recording "is always committed immediately... same as (d)"), then checked the two real recording commits in this repo's history:
- `68ce681` "chore(campaign): record doc-12 wave-1 in-flight pointer" — records QCLI-51 at stage 1 (dispatch).
- `82fca71` "chore(campaign): record doc-13 wave-1 in-flight pointer" — records QCLI-52 (this task) at stage 1 (dispatch).

Both worked examples record only stage 1. Neither SKILL.md nor reference/wave-loop.md mandates a further recording pass at every later stage transition (plan recorded, implemented, committed, pushed, reviewed-to-approve). So while the recording *commit* is durably never left dirty (stronger than (f)'s discard-by-design label edits), the table's *content* is not guaranteed continuously current — it only proves what was true as of whoever's last recording pass. I did not accept doc-12 wave 1's framing ("arguably stronger evidence than any of the three currently listed") at face value; I verified it against real commits first and found the claim needs narrowing.

Resulting wording treats a later recorded `Stage reached` (specifically 6, "Reviewed to `approve`") as durable positive proof of approval even after (f)'s label diff is discarded and before any PR opens — filling a real gap the other three signals miss (approved-but-not-yet-merged, PR not yet opened, working-tree diff already discarded) — but explicitly says absence of a later stage is inconclusive, not proof of no progress, and falls back to the first three signals for that case.

## AC#3 — sweep for further pre-QCLI-51-framing passages

Method: per the task's method note (QCLI-51's own sweep grepped only `in-review`/`merge-pending` and so missed both passages above), this sweep targeted prose *about where substate is recorded*, not the label strings. Ran (from `.claude/skills/backlog-handover/`):

```
for term in "labels carry" "sub-stage" "substage" "persists" "durable" "committed" \
            "observable" "state table" "campaign doc" "in-flight" "records" "legible" \
            "never observable" "working-tree-only" "working tree only"; do
  grep -n -i "$term" SKILL.md reference/*.md
done
```

Results (pre-edit, full transcript captured): every hit besides the two target passages was either (a) the state table itself and its already-QCLI-51-correct durability column/prose (SKILL.md lines 105-123), (b) historical Provenance narrative (already-settled record of past decisions, correctly past-tense), (c) reference/wave-loop.md sections (d)/(f)/(g)/(i)/(scope note), all already reconciled to the post-QCLI-51 framing, or (d) unrelated (lore sync, commit-trailer rules, templates boilerplate). No further passage asserted the pre-QCLI-51 framing unqualified. Re-ran the same sweep post-edit (`grep -c`) to confirm the new counts are only the intended additions and introduce no new contradiction.

One item surfaced but explicitly NOT touched, per the task's hard scope boundary: `reference/wave-loop.md` section (f) step 4 ("before that task's branch reaches (g)'s rebase step") vs section (g)'s precondition ("must be clean before this walk starts") — this is QCLI-53's owned discard-timing wording mismatch, not this task's. Left untouched.

## AC#4 — consistency with QCLI-49 / QCLI-51

Read `reference/wave-loop.md` sections (d), (f), (g), (i) and SKILL.md's stage-state table (lines 103-123) in full before editing. Neither of my edits touches wave-loop.md, the state table, or the (f)/(g) discard mechanics; both edits only add qualification/enumeration consistent with what those sections already establish (durability column, (i)'s scope note, the per-task stage table). No change to QCLI-49's or QCLI-51's rules.

## AC#5 — Provenance + version

Bumped `0.9.1-qcli.6` -> `0.9.1-qcli.7` (frontmatter + new Provenance paragraph). Justification for bumping rather than leaving it unbumped: this is a second, non-trivial behavioral change to what R2 tells a crash-recovery reader to check (a new signal, sourced from real-commit verification, with its own caveat) plus a Conventions-row correction — the same class and weight of change QCLI-51 itself bumped for. Provenance entry follows the existing register (evidence-dense, cites task IDs and commit SHAs, states what was verified vs. what remains a gap).

## Out-of-scope discovery (flagged via --comment, not fixed here)

reference/wave-loop.md does not mandate an in-flight-table recording pass at any point after dispatch (e.g., on approval) — the two real recording commits found (68ce681, 82fca71) both only ever recorded stage 1. This means the in-flight table's "Stage reached" can be stale for the entire remainder of a wave unless the orchestrator chooses to re-record it. That's a possible gap in reference/wave-loop.md's mechanics, distinct from QCLI-53's (f)/(g) wording mismatch and from this task's legibility-text scope. Not fixed here; recorded as a comment for the reviewer/user to decide whether it merits a follow-up task.

## Fix pass 1 (mandatory reviewer request_changes, 2026-08-08)

The mandatory reviewer returned `request_changes` with three BLOCKING findings, two MINOR, and one NIT. This section corrects the notes above rather than silently rewriting them — the plan step 2, Passage-2 (AC#2), and out-of-scope sections above all state 'the two real in-flight-pointer-recording commits in history (`68ce681`, `82fca71`), both recording stage 1' — that claim is FALSE and stands corrected here.

Re-running the enumeration:
```
git log dev --format='%h %s' | grep -i "in-flight pointer"
```
finds FIVE commits, not two: `82fca71` (doc-13 wave-1, records QCLI-52 at stage 1 — dispatched), `68ce681` (doc-12 wave-1, records QCLI-51 at stage 1), `61d48af` (doc-11 wave-2, records QCLI-46 and QCLI-48 both at stage 1), `0b63077` (doc-10 wave-2, recovered, records QCLI-43 at 'Stage reached: 6 — under review'), `146956d` (doc-10 wave-1, records QCLI-44 at stage 1).

`0b63077` is the missed counterexample. Its row: '| QCLI-43 | 2 | ...lease `28eadc44…`, holder `qcli/QCLI-43` | `chore/qcli-43-settlement-log-sync` @ `28e4018` | 6 — under review (implemented, committed, pushed by a session that then died; review dispatched on resume) |' — recorded for a branch that a prior session had implemented, committed, and pushed, then died BEFORE the review gate ran, i.e. actually at stage 5 (pushed), not 6 (approved). Doc-10's own settled campaign doc (`backlog/docs/campaigns/doc-10 - Backlog-campaign-tracker.md`, 'Wave 2 was recovered, not restarted' section) later corrects this same row inline: '...Backlog state and worktree state agreed, so R3 resumed it at its recorded stage (5, pushed) rather than restarting.' That is a committed, explicit correction of the earlier over-report, sitting in this repo's own history the whole time.

So this repo's history contains exactly one later-than-stage-1 in-flight-table record, and it OVER-reports, not confirms. The original wording ('both happen to record stage 1, not a later one') told a reader the table had never carried a later-stage record at all, which suppressed the one piece of evidence that the new signal actually fires — and fires with a defect. The original hedge ('treat later stage as positive proof, absence as inconclusive') guarded only the under-reporting direction; the only real evidence in this repo's history is an over-reporting instance, so the hedge guarded the wrong direction on the one case that matters.

## What this fix pass changed in SKILL.md

1. Line 90 (MINOR): 'labels carry the sub-stage for four of the six stages' attributed to *labels* what the durability column actually measures. Dispatched and Done share an identical committed label set (`campaign`, `wave-<N>`) and are distinguished only by *status* — reworded to 'the committed record distinguishes four of the six stages'.
2. R2 step 4 (MINOR, orchestrator-directed inclusion, not a silent drive-by): 'In Progress + wave-N means implementation may be mid-flight or done-but-unreviewed' omitted the third, post-QCLI-51 possibility — already reviewed-and-approved — since neither review-adjacent label ever commits. Named explicitly now, with a pointer to step 5's signals.
3. R2 step 5 (BLOCKING x2): replaced the false 'two commits, both stage 1' claim with the five-commit enumeration above, cited `0b63077` as the worked over-reporting example and its doc-10 correction, keyed the rule on the row's *stated annotation* rather than the bare numeral, required corroboration against the other three signals before crediting a claimed post-dispatch stage, and stated explicitly that both directions of error (under- and over-report) are real — not only the under-reporting direction the prior wording guarded.
4. Provenance paragraph (BLOCKING): the same false 'two commits' claim was restated in the skill's own evidence record and is corrected there too, with an explicit verified-vs-not-verified statement and a new short paragraph documenting this fix pass, the re-sweep, and that the version stays 0.9.1-qcli.7 (correcting an unmerged entry's own evidentiary support is not a new behavioral change).

Re-ran the AC#3 sweep method (below) over every passage this fix pass touched (Stage-state row, R2 steps 4-5, Provenance) and found no new instance of the pre-QCLI-51 framing introduced.

Confirmed unaffected: `reference/*.md` — `git diff dev...chore/qcli-52-stage-state-legibility-sweep --name-only -- .claude/skills/backlog-handover/reference/` returns zero lines, still QCLI-53's scope. Frontmatter version unchanged at 0.9.1-qcli.7.

## Settlement (doc-13 wave 1, orchestrator)

Merged to \`dev\` as squash commit \`d652126\` (PR #68). Branch commits after rebase: \`858fc5b\`, \`347abc6\`, \`cc19050\`, \`0f302ed\`; all four plus the squash commit verified with \`git log -1 --format=%B <sha> | git interpret-trailers --parse\` reporting \`Refs: QCLI-52\` as a genuinely parsed trailer (QCLI-48 blank-line hazard avoided by hand-authoring the squash body).

Review gate: two passes. Pass 1 returned \`request_changes\` with three blocking findings; pass 2 returned \`approve\` with all five ACs independently confirmed. All five checked here on that evidence.

The blocking finding worth preserving: the first implementation added a rule reading a recorded \`Stage reached\` of 6 as durable proof of approval. The orchestrator independently verified the counterexample before dispatching the fix — \`0b63077\` records \`6 — under review\` for a branch whose session died before the review gate ran, so that rule would have handed an unreviewed branch to the merge queue, violating SKILL.md's own mandatory review gate. It rested on a false claim that only two in-flight-pointer-recording commits exist. Corrected text now guards over- and under-reporting alike.

Enumeration, re-verified at settlement by two independent methods:
- phrase-keyed (\`git log dev --format='%h %s' | grep -i "in-flight pointer"\`): five — \`82fca71\`, \`68ce681\`, \`61d48af\`, \`0b63077\`, \`146956d\`
- content-based (scanning added \`+| QCLI-\` rows whose final column is a stage value): six — the extra is \`3107d3a\`, also stage 1

The merged text states five and explicitly discloses the phrase-keying limitation as not re-verified. The wave-level integration review then closed that caveat by the content-based method and found the variant (\`3107d3a\`) the disclosure predicted. The load-bearing conclusion is confirmed against the complete set of six, not just the grep set: exactly one later-than-stage-1 record exists (\`0b63077\`) and it over-reports.

Post-merge verification performed on the merged result, not on agent report: this task's file on \`dev\` carries only \`campaign\`, \`cluster:skill-docs\`, \`wave-1\` — no \`in-review\`, no \`merge-pending\` — and a repo-wide check finds neither label in any committed task frontmatter. That is QCLI-51's and this task's durability claim confirmed empirically for the first time under a \`merge-pending\` transition.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @qcli-52-worker
created: 2026-08-08 16:17
---
Flagging a possible follow-up, not fixing it here (out of this task's scope): reference/wave-loop.md never mandates an in-flight-pointer-recording pass after dispatch. The only two real recording commits in this repo's history (68ce681 doc-12 wave-1, 82fca71 doc-13 wave-1) both record stage 1 (dispatch) only. I used that fact to word SKILL.md R2 step 5's new fourth signal conservatively (later stage = positive proof, absence = inconclusive, not proof of no progress) rather than claiming the in-flight table is continuously current. If the intent was for the orchestrator to also re-record at, say, approval (stage 6) or push (stage 5), that would need an explicit step added to reference/wave-loop.md sections (e)/(f)/(g) — a mechanics change, not a legibility-text fix, and outside QCLI-52's scope. Worth a decision on whether to file that as a follow-up task.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Closed the two passages QCLI-51's sweep left behind in .claude/skills/backlog-handover/SKILL.md, and extended R2's leftover-classification enumeration.

What changed: the Stage state Conventions row no longer asserts unqualified that labels carry the sub-stage — it states inline that the committed record distinguishes four of the six stages and names in-review and merge-pending as the working-tree-only exceptions, so the qualification is visible before the reader reaches the table. R2 step 5 names the campaign doc's in-flight table as a fourth durable signal, keyed on the row's stated annotation rather than the bare numeral and requiring corroboration against the other three. R2 step 4's enumeration gained the third post-QCLI-51 possibility (already reviewed-and-approved), a deliberate scope extension disclosed in Provenance rather than left as a silent drive-by. Provenance records the change at 0.9.1-qcli.7 with a re-runnable enumeration command, all five SHAs, and an explicit verified-vs-not-verified split. reference/ was left untouched (0 diff lines) — the (f)/(g) discard-timing wording is QCLI-53's scope.

Why: the merged text had to describe where campaign substate is actually legible without overstating it. An earlier draft overstated it in a way that would have been unsafe — see the settlement notes on the stage-6 rule and 0b63077.

How verified: mandatory review gate over two passes (request_changes then approve), each acceptance criterion independently confirmed by the reviewer with named evidence; a prose sweep scoped to where substate is recorded rather than to the label names, re-run over every passage the fix pass touched; both enumerations re-run at settlement; and post-merge confirmation on dev that no committed task frontmatter carries either review-adjacent label. No automated gate covers .claude/skills/ in this repo and none was invented.
<!-- SECTION:FINAL_SUMMARY:END -->
