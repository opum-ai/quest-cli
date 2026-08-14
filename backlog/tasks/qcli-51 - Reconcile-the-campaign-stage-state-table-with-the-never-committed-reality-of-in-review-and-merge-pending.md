---
id: QCLI-51
title: >-
  Reconcile the campaign stage-state table with the never-committed reality of
  in-review and merge-pending
status: Done
assignee: []
created_date: '2026-08-08 13:46'
updated_date: '2026-08-14 12:18'
labels:
  - campaign
  - 'cluster:campaign-machinery'
  - wave-1
  - 'doc:stories/preserve-quest-cli-documentation-campaign-provenance'
dependencies: []
documentation:
  - docs/stories/preserve-quest-cli-documentation-campaign-provenance.md
priority: medium
type: chore
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

SKILL.md's "Campaign stage -> Backlog state" table presents six campaign stages, each mapped to a Backlog status plus labels. Two of those stages — `in-review` and `merge-pending` — name labels that `reference/wave-loop.md` section (f), as amended by QCLI-49, deliberately writes to the working tree and then **discards uncommitted** before the affected branch reaches (g)'s rebase, reconstructing the final label set only at settlement (i). Line 222 states this outright: "they are deliberately never committed at all; they are folded into the settlement commit's label state instead." Neither label is therefore ever observable in committed Backlog state.

`merge-pending` carries a second, narrower defect: it has no stated point of action. `wave-loop.md:130` instructs applying it only as a trailing parenthetical — `--add-label in-review`, "and later `merge-pending`" — and "later" names no step. Section (g)'s eight-step merge walk never mentions it. Settlement (i) removes it at lines 195 and 200, and (g)'s precondition paragraph at line 160 refers to it as an established transition.

The consequence is not cosmetic. R2 (restore's ground-truth verification) classifies leftover branches and worktrees after a crashed session by cross-checking them against Backlog state — but two of the six stages it would cross-check against can never appear in a committed task file.

## Origin and verification

Surfaced by QCLI-49's worker as an out-of-scope discovery during doc-11 wave 3, and correctly left alone there: it is pre-existing and unrelated to QCLI-49's commit-policy scope.

Re-verified at doc-12 init on 2026-08-08 against `b2ad797` rather than taken on doc-11's word. That check corrected the inherited framing in two ways, both of which this task inherits:

1. doc-11 recorded that "no step anywhere adds it." An add instruction **does** exist, at `wave-loop.md:130`. What is missing is a point of action, not the instruction.
2. doc-11 scoped the finding to `merge-pending` alone. `in-review` sits in exactly the same position under (f) steps 3-4 and line 222, and is removed by the same settlement calls. Two table rows are affected, not one.

## Owner ruling (2026-08-08, obtained at doc-12 init before dispatch)

**Broader — reconcile the whole table.** The disposition is not to settle `merge-pending` in isolation. SKILL.md's stage-state table must distinguish stages that are durably recorded in committed Backlog state from those that exist only as uncommitted working-tree edits, covering `in-review` as well as `merge-pending`, and the R2 crash-recovery consequence must be addressed directly rather than left as an implication for a reader to derive.

The owner was offered three narrower alternatives and did not take them: treating `merge-pending` as vestigial and deleting the row; giving it a point of action in (g) at the cost of a write-then-discard ceremony; and leaving the disposition for the worker to derive. Recording that here so a later reader does not re-propose a narrower fix as an improvement.

This ruling is recorded verbatim in this description so that it travels with the task rather than living only in the campaign document.

## Constraint

Whatever shape the fix takes, it must not reintroduce the rebase conflict QCLI-49 closed. Mid-wave task-file label edits are never committed on `<default>` while that task's branch is unmerged; a fix that makes these stages durable by committing them on `<default>` mid-wave is out of bounds.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SKILL.md stage-state table distinguishes, for every row it lists, stages durably recorded in committed Backlog state from those existing only as uncommitted working-tree edits
- [x] #2 The disposition of merge-pending is settled explicitly and stated at its point of action: either the step that applies it is named in reference/wave-loop.md, or the stage is recorded as vestigial and removed from the table; the current trailing "and later" parenthetical at line 130 no longer stands as the only instruction
- [x] #3 in-review receives the same treatment as merge-pending, with any difference in how the two are handled stated and justified rather than left implicit
- [x] #4 SKILL.md R2 states how leftover branches and worktrees are classified given that these labels may be absent from committed state, so a crash-recovery reader is not directed to cross-check against a state that cannot appear
- [x] #5 No remaining passage across SKILL.md and reference/wave-loop.md describes these labels in a way another passage contradicts, and the result is consistent with QCLI-49 rule that mid-wave task-file label edits are never committed on <default> while the branch is unmerged
- [x] #6 The skill Provenance section records this change per the repo convention, and the skill version is bumped or the absence of a bump is explicitly justified
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. SKILL.md stage-state table (~L103-114): add a 'Committed to Backlog?' column; mark in-review/merge-pending as No (working-tree-only). Add prose below the table: (a) both labels are applied by (f) on the orchestrator's own <default> checkout and discarded before (g)'s rebase, never an ancestor of any commit; (b) identical durability treatment for the same QCLI-49 reason; (c) distinct points of action stated explicitly: in-review at review dispatch, merge-pending at the reviewer's approve verdict (not 'later'); (d) pointer to R2 for crash-recovery classification.
2. wave-loop.md section (f): rewrite the intro sentence (drop vague 'transition later'); rewrite the numbered list so step 1 = add in-review at dispatch (point of action stated), new step 2 = swap to merge-pending on approve, before (g) (point of action stated, explicitly reusing the existing run-then-discard mechanism rather than adding a new one in (g) - the three owner-declined alternatives are not reintroduced), renumbered steps 3-5 = confirm diff / discard once / reconstruct at settlement (covering both edits). Add an honest evidence note: in-review's discard-and-reconstruct is evidenced (doc-11 wave 2); merge-pending's own point-of-action edit has not yet been separately exercised in a recorded wave.
3. SKILL.md R2: add a new step after the existing 4-item list (as step 5) stating that in-review/merge-pending will never be present in committed state, so R2 must not cross-check leftovers against them; instead derive review substage from: the orchestrator's own <default> checkout dirtiness (step 1) with the specific label present pinning pre/post-approve, the worktree's own git log (step 4) for the worker's stage-4 commit, and gh pr list (step 3) since a PR opens only post-approve. State the fallback: no such signal -> presumptively pre-approval, resume at review.
4. Sweep every in-review/merge-pending occurrence in SKILL.md and wave-loop.md (grep -n, already run) and re-read each post-edit to confirm no contradiction remains (line 128 intro sentence, line 160 (g) precondition paragraph, lines 195/200 settlement label-removal calls, line 222 scope note, the new table/R2 text). escalation.md and templates.md contain zero occurrences (confirmed by grep) - no edit needed there.
5. Bump SKILL.md frontmatter version 0.9.1-qcli.5 -> 0.9.1-qcli.6 and add a Provenance paragraph after QCLI-49's, in the file's existing style, describing the reconciliation, the origin/re-verification history, the three declined owner alternatives (named but not re-proposed), and the evidence sweep.
6. Re-read all edited regions post-edit (not carry line numbers from the task description), record notes with the AC#5 sweep table, commit in small logical commits with Refs: QCLI-51 trailers, verify with git interpret-trailers, push.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented. Sweep + verification evidence below (all re-read post-edit; no line numbers copied from the task description — sections cited instead where the prose allows it).

AC#1 (durability distinction, every row): SKILL.md's stage-state table (Campaign stage -> Backlog state) gained a "Committed to Backlog?" column: Queued/Dispatched/Done/Blocked all "Yes" (with the committing step named for Dispatched and Done); In review and Merge-pending both "No -- working-tree-only, see below". Prose immediately below states why (reference/wave-loop.md section (f) applies+discards both before section (g)'s rebase; reconstructed at settlement (i)) and cites QCLI-51/QCLI-49. Read post-edit.

AC#2 (merge-pending disposition + point of action): reference/wave-loop.md section (f)'s numbered list rewritten. New step 1 = add in-review at reviewer dispatch (in-review's point of action). New step 2 = on the reviewer's `approve` verdict, before the branch is handed to (g), swap to merge-pending via `--remove-label in-review --add-label merge-pending` -- merge-pending's point of action, named directly. The old trailing "and later `merge-pending`" phrase no longer exists in the file (replaced, not merely supplemented). Section (g)'s eight-step merge walk still names neither label (verified by re-reading section g in full post-edit) -- the point of action lives in (f), reusing (f)'s existing run-then-discard mechanism rather than adding a new one in (g). This deliberately avoids owner-declined alternative (b) ("point of action in (g) at the cost of a new ceremony there"): no new steps were added to (g).

AC#3 (in-review same treatment, difference stated): both labels get identical durability treatment in the table and in the new SKILL.md prose (same QCLI-49 rebase-conflict reason). The difference -- in-review marks review's start (dispatch), merge-pending marks review's end (approve, pre-(g)) -- is stated explicitly in both SKILL.md's new prose and wave-loop.md section (f)'s rewritten steps, not left implicit.

AC#4 (R2 crash-recovery classification): SKILL.md R2 gained a new step 5 stating neither label is ever present in committed state, so absence must not be read as "review never started/approved". Classification instead uses: step 1's working-tree-clean check on the *orchestrator's own* <default> checkout (a label-only dirty entry for a given task's file pins the crash to before/after that task's own approve verdict, per which label is present -- refined mid-implementation to be explicitly per-task-file, since review is pipelined and multiple members can be mid-review concurrently); step 4's worktree git log (worker's stage-4 commit presence/absence); step 3's `gh pr list` (a PR only opens post-approve in (g), so an open PR is durable proof of passed review even though merge-pending itself leaves no trace). No-signal case is stated as presumptively pre-approval.

AC#5 sweep -- every `in-review`/`merge-pending` occurrence found via `grep -n` in SKILL.md and reference/wave-loop.md, each read in context post-edit:
- SKILL.md L109-110: table rows -- updated, consistent.
- SKILL.md L116, L120-121, L123: new explanatory prose -- consistent, matches wave-loop.md (f).
- SKILL.md L159: new R2 step 5 -- consistent.
- SKILL.md L217 (QCLI-49 provenance entry): historical incident record ("uncommitted wave-1/in-review label edits...") -- untouched, remains accurate as history, does not contradict new framing.
- SKILL.md L219: new QCLI-51 provenance entry -- self-consistent, names the 3 declined alternatives without re-proposing them.
- wave-loop.md L126: in-review dispatch-time marking -- consistent with new step 1.
- wave-loop.md L128, L130-131, L136: rewritten intro/steps/evidence note -- internally consistent; evidence note is honest that merge-pending's own point-of-action edit has not yet been separately exercised in a recorded wave (only in-review's has, doc-11 wave 2).
- wave-loop.md L161 ((g) precondition paragraph): "mid-wave label transitions (in-review, merge-pending -- see (f)) are never committed on <default>..." -- still accurate under the new framing (both governed by (f), both run-then-discard); left unchanged since it asserts nothing that changed.
- wave-loop.md L196, L201 (settlement's `--remove-label "in-review,merge-pending"` calls): unchanged; still a correct defensive normalization even though these labels are never actually present on the merged copy (they were discarded pre-rebase) -- no contradiction.
- wave-loop.md L223 (QCLI-49 scope note): "they do not appear as a row in this table because they are deliberately never committed at all" -- still accurate, unchanged.
- reference/escalation.md and reference/templates.md: `grep -n "in-review|merge-pending"` returns zero matches in both (confirmed twice). No edit made to either file, per the task's scope note ("possibly ... IF ... they contain a contradicting passage").
Consistent with QCLI-49's rule throughout: no label edit for either stage was committed on <default> mid-wave anywhere in the new text; section (g) gained zero new label-handling steps.

AC#6: SKILL.md frontmatter version bumped 0.9.1-qcli.5 -> 0.9.1-qcli.6. New Provenance paragraph added after the QCLI-49 entry, same shape as QCLI-43/47/48/49 (version, task ID, date, what changed, why, origin/re-verification history, the declined alternatives named without being re-proposed, evidence-sweep pointer).

Owner-ruling compliance: did not delete/treat merge-pending as vestigial (alternative a); did not add a write-then-discard ceremony to section (g) (alternative b); did not leave the disposition for a future reader to derive (alternative c) -- the point of action is stated directly in (f).

No out-of-scope discoveries.

## Settlement (doc-12 wave 1, orchestrator)

Merged as `79545d6` (PR #67, squash-merged into `dev`). Branch `chore/qcli-51-stage-state-table-reconcile` rebased onto `68ce681`, re-verified post-rebase, force-with-lease pushed, then squash-merged with a hand-authored body so the `Refs: QCLI-51` trailer parses (the branch carried two commits each ending in their own `Refs:` line — exactly QCLI-48's unparseable-squash shape had the body been auto-generated). Verified: `git interpret-trailers --parse` on `79545d6` reports `Refs: QCLI-51`.

Review: two passes by a top-tier reviewer, independently re-deriving every claim. No automated gate exists for `.claude/skills/` (no package.json, Makefile, test suite, or linter; `lore check --strict` covers only `docs/`), so verification was reading — stated explicitly rather than skipped.

- Pass 1: `request_changes` on one blocker — R2 step 5 attributed the `git log` check to step 2 (enumeration only) when step 4 prescribes it. Fixed in `64d40a9`, which the reviewer confirmed as a two-character word-diff altering no other token, leaving `reference/wave-loop.md` untouched and the AC#5 sweep table intact after the wholesale `--plan`/`--notes` replace.
- Pass 2: `approve`, all six criteria confirmed with named file+line evidence.

Post-rebase re-verification (run in full, not skipped on a clean rebase): version `0.9.1-qcli.6` in frontmatter; R2 step 5's three citations each resolving to the step that prescribes the named check (1 = "Working tree clean?", 3 = `gh pr list`, 4 = worktree `git log`); the old "and later `merge-pending`" parenthetical absent; (f)'s two-step point-of-action structure present; both branch commits' trailers parsing.

Wave-level integration review (h) over the cumulative diff `10a4293...dev`: `git diff 64d40a9 dev -- .claude/skills/backlog-handover/` empty, i.e. the merged files are byte-identical to the approved branch tip. Skill self-consistency confirmed for a cold reader: no dangling step references, every one of the six table stages now has a point of action, and (i)'s `--remove-label "in-review,merge-pending"` remains correct as a defensive no-op under (f)'s new shape. The orchestrator's own bookkeeping commits `d0c3d06` and `68ce681` were reviewed for the first time here and are clean and correctly scoped.

Two `minor` findings surfaced by (h) are recorded as proposals for the user, NOT filed (this project forbids autonomous follow-ups): `SKILL.md:90`'s "labels carry the sub-stage" summary still asserts the pre-QCLI-51 framing unqualified, and R2 step 5's signal list omits the campaign doc's in-flight table — the one substate record that IS committed on purpose. Both are the same defect class this task closed; neither is a defect in this diff. Notably, this task's own AC#5 sweep could not have caught either: the sweep grepped `in-review`/`merge-pending`, and neither passage contains those strings. The sweep was correct within its stated method.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
SKILL.md's campaign stage-state table listed `in-review` and `merge-pending` as ordinary label rows, but `reference/wave-loop.md` (f) — as amended by QCLI-49 — applies both to the working tree and discards them uncommitted before the affected branch's rebase, reconstructing the label set only at settlement. Neither label was therefore ever observable in a committed task file, while R2's crash-recovery step directed a reader to cross-check leftovers against Backlog state. `merge-pending` additionally had no stated point of action, existing only as a trailing "and later" parenthetical naming no step.

Per the owner's broader ruling (obtained at doc-12 init, recorded verbatim in this task): the stage-state table gained a `Committed to Backlog?` column covering all six rows, marking both labels working-tree-only with the shared QCLI-49 rebase-conflict rationale and each label's distinct point of action stated inline; `wave-loop.md` (f)'s numbered list now names `merge-pending`'s point of action directly — on the reviewer's `approve` verdict, before (g) — reusing (f)'s existing run-then-discard mechanism rather than adding a ceremony to (g), whose eight-step walk still mentions neither label; and R2 gained a step 5 naming the durable signals that classify a leftover branch's review substage. Skill bumped 0.9.1-qcli.5 -> 0.9.1-qcli.6 with a Provenance entry. None of the three narrower alternatives the owner declined were reintroduced, and QCLI-49's rule is extended in scope, not altered — no label edit is committed on `dev` while the branch is unmerged.

Verified by reading, independently re-derived across two review passes plus a wave-level integration pass; this repo has no automated gate for `.claude/skills/` and `lore check --strict` covers only `docs/`, which was stated rather than worked around. Pass 1 caught and closed a blocker where R2 step 5 cited the wrong step for the `git log` check. Merged as `79545d6` (PR #67); the merged files are byte-identical to the approved branch tip.
<!-- SECTION:FINAL_SUMMARY:END -->
