---
id: QCLI-53
title: >-
  Settle the discard-timing looseness between wave-loop (f) and (g)'s
  clean-checkout precondition
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-08 14:44'
updated_date: '2026-08-08 18:43'
labels:
  - campaign
  - 'cluster:skill-docs'
  - wave-2
dependencies: []
priority: low
type: chore
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

`.claude/skills/backlog-handover/reference/wave-loop.md` section (f) instructs the orchestrator to leave the mid-wave label edit uncommitted and discard it "before that task's branch reaches (g)'s **rebase step**." Section (g)'s precondition paragraph instead demands that the orchestrator's own `<default>` checkout "must be clean before this **walk starts**, and stays clean across every iteration of it," and (g) step 0 re-confirms it per member.

Those two deadlines are not the same point. "Before the rebase step" is later than "before the walk starts."

## Why it is not urgent, and why it is still worth settling

The two are reconcilable in practice — discarding immediately after (f)'s diff-confirmation step satisfies both readings — and doc-12 wave 1 did exactly that with no incident. The wording is also inherited verbatim from QCLI-49, which wrote it when `in-review` was the only label involved.

What changed is the margin. QCLI-51 gave `merge-pending` a point of action at the reviewer's `approve` verdict, which sits materially closer to (g) than `in-review`'s dispatch-time edit did. The looseness is therefore easier to trip over now than when the wording was written, even though the wording itself did not change.

This is pre-existing QCLI-49 debt, not a defect introduced by QCLI-51.

## Scope note

This is a mechanics-timing question in `reference/wave-loop.md`, deliberately kept separate from QCLI-52 (documentation legibility in `SKILL.md`). The doc-12 reviewer recommended the split explicitly: folding them together would blur two different axes and produce a task touching two files for two unrelated reasons.

Settling this may legitimately conclude that one of the two wordings should move to match the other, or that a single explicit discard point should be named — the disposition is open and should be derived from the current text, not assumed from this description.

## Origin

Surfaced as a `minor` finding during doc-11-era QCLI-49 work and again by doc-12 wave 1's review (2026-08-08), recorded as an unfiled proposal in doc-12 and filed with the user's explicit approval at that campaign's R6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 reference/wave-loop.md names a single unambiguous point at which the mid-wave label edit is discarded, and (f) and (g)'s precondition paragraph agree on it
- [ ] #2 The chosen disposition is derived from the current text and stated with its reasoning, including why the alternative wording was not adopted
- [ ] #3 (g)'s clean-checkout precondition remains true by construction under the settled wording, not by orchestrator discipline, for both the in-review and merge-pending edits
- [ ] #4 No remaining passage across SKILL.md and reference/wave-loop.md states a discard deadline that contradicts the settled one
- [ ] #5 The skill Provenance section records this change per the repo convention, and the skill version is bumped or the absence of a bump is explicitly justified
- [ ] #6 The chosen discard timing states its effect on SKILL.md R2 step 5's first durable signal (the label-only dirty entry on the orchestrator's <default> checkout) — whether the window stays wide enough for a crash to observe the label, and if not, that the loss is named and accepted
- [ ] #7 If the settled timing materially shrinks that window, SKILL.md R2 step 5's first signal is reworded so it does not promise classification power the mechanics no longer provide, and the remaining signals' sufficiency is stated
- [ ] #8 No passage across SKILL.md and reference/wave-loop.md is left asserting that the in-review/merge-pending distinction is observable in a dirty diff if the settled timing makes that unreliable
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Derived from a full read of wave-loop.md sections (d),(f),(g),(i) and SKILL.md's Stage-state block + R2 step 5 + Provenance.

Root finding: (g)'s merge walk does not begin until EVERY member of the wave has reached a terminal review verdict (g's own opening line: "Once the wave's implement->review pipelines settle... walk the approve branches"). (f)'s current discard deadline ("before THAT task's branch reaches (g)'s rebase step") is scoped to that task's own later turn in the serial merge queue -- which is strictly LATER than "before the walk starts" for every member queued after the first, and for an escalated task it never fires at all (an escalated branch never reaches a rebase step, so under a literal reading its in-review diff is never discarded by this rule before the walk). That is the looseness AC#1-3 must close.

Disposition (AC#2): retime (f)'s discard trigger to "as soon as that task's OWN review reaches a terminal verdict" -- approve (discard immediately after step 2's merge-pending edit is applied+confirmed) or escalate (discard immediately after step 1's in-review edit is confirmed, since step 2 never runs). This is a per-task trigger, not tied to that task's position in the merge queue, and it transitively satisfies (g) because (g) cannot start walking until every member has already reached one of these two terminal verdicts -- so every diff is provably gone before the walk starts, and nothing re-dirties the checkout during the walk since no further (f) label edit occurs once it begins.

Rejected alternative: the description's floated "discard immediately after (f)'s diff-confirmation step" for BOTH edits (i.e. also collapsing in-review's window to near-zero, discarding right after step 1 too). Rejected because in-review's wide window (dispatch -> that task's own review settling) is NOT what causes the g-precondition violation -- it always resolves (transitions to merge-pending, or is discarded on escalate) before that task's own review settles, which is required before ANY task's walk iteration can start. Only merge-pending's late-deferred discard was unsafe. Tightening both would sacrifice the "before approve" pin for no additional safety.

AC#6/7 tradeoff: this preserves in-review's window (still pins "before approve" reliably) but narrows merge-pending's window to the gap between two sequential orchestrator actions -- a crash is unlikely to ever catch it dirty. SKILL.md R2 step 5's first signal currently claims BOTH labels pin before/after approve; will reword so only in-review's pin is asserted, merge-pending's absence is stated as uninformative, and the other three signals (worktree git log, gh pr list, in-flight table) are named as what actually establishes "already approved" now.

Edits:
1. wave-loop.md (f) step 4 -- retime the discard trigger as above, covering both approve and escalate outcomes, citing QCLI-53.
2. wave-loop.md (g) precondition paragraph -- align "only run-then-discarded before that branch's rebase" with the new trigger.
3. SKILL.md Stage-state block (~line 116) -- same alignment (AC#4).
4. SKILL.md R2 step 5's first signal -- reword per AC#6/7 above.
5. Sweep (AC#4/#8): grep both files for "rebase", "discard", and "in-review.*merge-pending"/"merge-pending.*in-review" co-occurrences; confirm no remaining passage contradicts the settled wording; record the commands + results in notes. Historical Provenance entries (QCLI-49's and QCLI-51's own dated paragraphs) describe what those tasks changed AT THE TIME and are left untouched, consistent with this doc's own append-only Provenance convention (each later entry adds a new dated paragraph rather than rewriting an earlier one, e.g. QCLI-52 vs QCLI-51 above it) -- not edited to assert the new current wording.
6. Do NOT touch (f)'s "Evidence:" paragraph (QCLI-55's scope) or the campaign-doc `Stage reached` material (QCLI-54's scope).
7. Add a new dated Provenance entry (SKILL.md) for this task and bump the skill version in frontmatter + Provenance header from 0.9.1-qcli.7 to 0.9.1-qcli.8 (behavioral change to discard timing + signal semantics, following the QCLI-49/51/52 bump precedent, not the qcli.7 "fix pass" no-bump precedent which was a pure evidentiary correction with no behavior change).
8. Re-read (d),(f),(g),(i) end to end after editing to confirm AC#3 -- g's precondition holds by construction, including the escalate path -- before recording notes.
9. Record --append-notes with disposition, rejected alternative, sweep commands/results, tradeoff analysis, and version reasoning; --comment for anything needing reviewer attention. Commit in small logical commits with `Refs: QCLI-53` trailer; verify with `git interpret-trailers --parse`; push branch. Do not check ACs, write final summary, or touch status/campaign doc (worker scope boundary).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DISPOSITION: retimed (f)'s discard trigger from "before that task's branch reaches (g)'s rebase step" (per-task-turn-in-merge-queue) to "as soon as that task's own review reaches a terminal verdict" (per-task, review-settle-time) -- immediately after step 2's merge-pending edit for approve; immediately after step 1's in-review edit alone for escalate (step 2 never runs there). Both wave-loop.md (f) step 4 and (g)'s precondition paragraph, and SKILL.md's Stage-state block (~line 116), now state this single rule in matching terms.

REASONING (AC#2): (g)'s own opening line ("Once the wave's implement->review pipelines settle... walk the approve branches") gates walk-start on EVERY member having already reached a terminal review verdict. A per-task-turn deadline is looser than that gate for every member queued after the first -- an earlier-queued branch's rebase iteration could run while a later-queued (or slower-reviewed) branch's merge-pending diff was still sitting dirty, since "before that task's OWN turn" says nothing about other members' turns. It also never fires at all for an escalated branch (never reaches a rebase step), which I confirmed is a real, previously-unaddressed gap: (i) only clears an escalated task's in-review label via --remove-label at settlement, which runs strictly after (h), which runs strictly after (g)'s entire walk completes -- so under the old wording an escalated task's dirty diff would sit through the WHOLE wave's merge walk, not just until "its own rebase step" (which never comes). Tying discard to "this task's own review settling" closes both gaps at once and is provably sufficient because it is a strictly earlier trigger than (g)'s own walk-start gate for every member, by that gate's own definition.

REJECTED ALTERNATIVE (AC#2): the description's floated "discard immediately after (f)'s diff-confirmation step," read as tightening BOTH edits (collapsing in-review's window too). Rejected because in-review's wide window (dispatch -> that task's own review settling) is not what caused the (g)-precondition violation -- it always resolves (transitions to merge-pending, or is discarded on escalate) before that task's own review settles, which the walk-start gate already requires of every member regardless of wording. Tightening it would have sacrificed R2 step 5's "before-approve" pin for zero additional safety. Only merge-pending's late-deferred discard was actually unsafe, so only its window is tightened.

AC#6/#7 TRADEOFF: merge-pending's dirty window narrows from "however long until this task's own rebase turn" (the unsafe part) to the gap between two sequential orchestrator actions -- a crash is now unlikely to ever catch it dirty. Named and accepted, not silently absorbed. SKILL.md R2 step 5's first signal reworded: only in-review's appearance still reliably pins "before approve"; a caught merge-pending entry is now rare, its ABSENCE is uninformative (must not be read as "not yet approved"), and the reviewer is pointed at gh pr list (open PR = durable proof of approve, unaffected by this narrowing) and the campaign doc's in-flight table to establish after-approve state instead; the worktree git-log signal is clarified as establishing only "implemented," not "approved." Chose to narrow-and-name rather than preserve-the-window, since preserving it would require either (a) keeping the old per-task-turn deadline (which is what caused the (g) violation in the first place) or (b) a new wave-level batch-discard-before-walk mechanism not asked for and not derivable from the current text without inventing a new step.

AC#4/#8 SWEEP: `grep -n -i "rebase" reference/wave-loop.md SKILL.md` (36 total hits) filtered to exclude literal `git rebase`/`git -C ... rebase` command lines and unrelated performance/PR-flow mentions, leaving exactly 5 prose hits about discard timing: wave-loop.md:133 (f) and :161 (g precondition) -- both fixed to the new wording; SKILL.md:116 (Stage-state block, current governing text) -- fixed; SKILL.md:217 (QCLI-49's own dated Provenance paragraph) and :219 (QCLI-51's own dated Provenance paragraph) -- left untouched, since both are historical records of what those tasks changed AT THE TIME, consistent with this document's own append-only Provenance convention (each later entry, e.g. QCLI-52 vs QCLI-51, adds a new dated paragraph rather than rewriting an earlier one). Also ran `grep -n -i "pins the crash|before or after.*approve|distinguish"` (post-edit: zero remaining hits outside my own reworded R2 step-5 text) and `grep -n -iE "in-review.*merge-pending|merge-pending.*in-review"` across both files (all hits reviewed individually above; none assert unqualified before/after-approve distinguishability for both labels after the edit). Also checked reference/escalation.md and reference/templates.md for the same terms: zero hits, confirming the defect and its fix are fully contained to the two files AC#4/#8 name.

AC#3 RE-READ: read (d), (f), (g), (i) end-to-end post-edit. (d) unaffected (dispatch-marking commit, unrelated to this discard rule). (f) now names an unambiguous per-outcome discard trigger for both in-review and merge-pending. (g)'s precondition paragraph's explanation now matches (f)'s trigger instead of contradicting it, and step 0's `git status --porcelain` re-check remains as defense-in-depth (bug/hand-edit case), not the sole guarantee. (i) settlement's `--remove-label "in-review,merge-pending"` on Done/escalated tasks is unaffected -- by settlement time both labels are already absent from the (by-then-clean) checkout under the new rule, so these removals are idempotent no-ops on the correct end state, not a second discard mechanism.

AC#5 VERSION: bumped SKILL.md frontmatter + Provenance from 0.9.1-qcli.7 to 0.9.1-qcli.8, following the QCLI-49/51/52 precedent (each a discard/label-mechanics or crash-recovery-signal behavioral change got its own bump), not the "Fix pass" qcli.7 entry's no-bump precedent (that was a pure evidentiary correction with no behavior change). This task changes real mechanics (discard trigger) and real reader-facing guidance (R2 step 5's claimed signal power), so a bump is warranted under the established pattern rather than an explicit-absence justification.

VERIFICATION METHOD: no test/build/lint gate exists for .claude/skills/ (no root package.json, none created, per CLAUDE.md). Verified by: (1) quoting every edited passage before/after via `git diff` (recorded in this task's commits), (2) the sweep commands and results above, (3) the AC#3 end-to-end re-read above, (4) not running `lore check` -- no docs/ file touched, confirmed via `git diff --stat`.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-08 18:28
---
Acceptance criteria #6-#8 added 2026-08-08 by the doc-13 orchestrator with the user's explicit approval, on a finding from doc-13 wave 1's integration review. Rationale: this task's likely disposition (discarding immediately after (f)'s diff-confirmation step, floated in the description) would collapse the dirty-diff window that SKILL.md R2 step 5's FIRST durable signal depends on — that signal claims which label shows pins a crash before or after the approve verdict, which only holds because (f) currently keeps the edit dirty across a wide window. Original AC#4 checks only for passages stating a contradicting discard DEADLINE, not for downstream signals depending on the discard WINDOW, so the regression would not have been caught by this task's own criteria. The coupling is pre-existing (QCLI-51 wrote signal #1; QCLI-52 left it byte-identical) — a forward risk, not a defect in merged work. Added as criteria rather than filed separately so the tradeoff is weighed while choosing the disposition rather than audited afterward.
---

author: @claude
created: 2026-08-08 18:43
---
Out-of-scope finding for the reviewer/orchestrator, not fixed here (not this task's discard-timing scope, and touching it would be a drive-by): reference/wave-loop.md section (g)'s opening line (line 163) gates the merge walk on "every member reached approve / merge-blocked / escalated" -- three outcomes -- but (f)'s own reviewer structured-verdict enum (line 155) defines only three DIFFERENT outcomes: approve / request_changes / escalate. "merge-blocked" appears exactly once in SKILL.md + reference/wave-loop.md (this one line) and is not defined or produced anywhere. It may be a stale/leftover term (possibly meant to read "request_changes" mid-review, which doesn't gate walk-start, or a duplicate of "escalated"), or it may denote a real third state I'm not aware of (e.g. a branch stuck at (g) itself from a real rebase conflict, per line 169's "Real content conflict -> one reviewer escalation call"). I did not rely on the exact count/names of terminal states in my own wording -- I cited "every member's review pipeline has settled" generically rather than enumerating "these two/three verdicts" specifically, so this ambiguity does not affect QCLI-53's correctness. Flagging for a follow-up task or a quick owner clarification.

Also confirmed untouched, per the hard scope boundaries given: (f)'s "Evidence:" paragraph and its "has not yet been separately exercised in a recorded wave" sentence (QCLI-55's territory), and the campaign-doc Stage-reached/recording-cadence material and SKILL.md R2 step 5's five-vs-six enumeration / 0b63077 characterisation / "substate" wording (QCLI-54's territory) -- none of these were edited by this task's changes.
---
<!-- COMMENTS:END -->
