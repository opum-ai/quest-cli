---
id: QCLI-60
title: >-
  Push the orchestrator's default-branch bookkeeping commits and fix (g) step
  5's failed-fast-forward diagnosis
status: In Progress
assignee: []
created_date: '2026-08-08 21:43'
updated_date: '2026-08-08 22:22'
labels:
  - campaign
  - 'cluster:skill-docs'
  - wave-1
dependencies: []
priority: medium
type: bug
ordinal: 79000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

doc-13 wave 2 hit a reproducible loop failure at `reference/wave-loop.md` (g) step 5: `git pull --ff-only origin dev` → "Diverging branches can't be fast-forwarded."

### Mechanism, verified from history

1. (d) step 4 commits the dispatch-marking pass on `<default>` and **does not push it**. Wave 2's marking commit was `e532f22` (parent `626f369`); `git reflog show origin/dev` confirms the last push before the wave was `626f369`.
2. (d) step 5 re-pins each worktree onto it, so it becomes an ancestor of the task branch — and reaches `origin` via the worker's branch push at (e) step 5, but **not** `origin/<default>`.
3. GitHub therefore counted it as branch content: `gh pr view 69 --json commits` lists `e532f22` as PR #69's first commit.
4. `gh pr merge --squash` folded its content into `ed3959b`, whose parent is `626f369` — not `e532f22`.
5. Local `dev` sat at `e532f22`; `git merge-base --is-ancestor e532f22 ed3959b` is false, both being children of `626f369`. Siblings, so no fast-forward.

### It is a gap in the procedure, not a misexecution

(d) step 4 mandates a commit and no push, and `wave-loop.md:87` explicitly contemplates the unpushed state ("even if the process dies before the next push"). The orchestrator followed it exactly.

The gap is a false assertion at `wave-loop.md:167` ((g) step 2): the marking commit "**is already an ancestor of `origin/<default>`**." Under (d) as written that is false for every wave from (d) step 5 until the next `<default>` push. doc-13 wave 1 escaped only because the orchestrator pushed `dev` incidentally while resolving something else.

### (g) step 5's diagnosis is wrong

`wave-loop.md:172` attributes a failed fast-forward to the clean-checkout precondition. That precondition was satisfied; working-tree cleanliness cannot cause this error, which is purely committed-history topology. The instruction ("a bug in the loop, not a routine conflict to resolve inline") is correct; the named cause is not.

### Scope: two commit types

The in-flight-pointer-recording commit has the identical exposure. Any orchestrator-authored `<default>` commit landing between the wave base and (g)'s walk fails the same way. Settlement and docs-sync commits are unaffected — they run after (g), and (i) step 3 pushes.

### Consequence if unfixed

At wave size 1 the blast radius was one halted pull and a hand-improvised `git reset --hard origin/dev`. At size > 1 the walk halts at step 5 of the first member with the rest rebased, pushed, and unmerged, in a state `escalation.md` does not cover.

## Proposed minimal fix

Push `<default>` immediately after (d) step 4's trailer check, and after the in-flight-pointer-recording commit, subject to the skill's existing no-remote convention. This makes (g) step 2's ancestor claim true by construction rather than incidental, and requires **no change to (d) step 5's re-pin**, which reads local `HEAD` and is unaffected by whether that commit has been published.

Alternatives, recorded so they are not re-proposed: dropping `--squash` at (g) step 4 (reverses a deliberate convention, far wider blast radius); loosening (g) step 5 to `--rebase` or a reset (hides the defect, contradicts step 5's own stance); not committing the marking pass (reverts `QCLI-49`, reopens doc-11 wave 1's `cannot rebase: You have unstaged changes`).

Interaction to reconcile: `wave-loop.md:87`'s parenthetical is written against the unpushed state. The crash-visibility rationale for *committing* survives and strengthens, but that clause's framing goes stale.

## Origin

Surfaced by doc-13 wave 2's integration review, which hit the failure live at merge time. Filed 2026-08-08 with the user's explicit approval at doc-14 init.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 reference/wave-loop.md (d) step 4 states whether the dispatch-marking commit is pushed to origin/<default> before any worker is dispatched, with reasoning recorded and the no-remote path named
- [ ] #2 The same decision is applied to the in-flight-pointer-recording commit, or its exemption is stated with reasoning — these two are the only orchestrator-authored <default> commits landing between the wave base and (g)'s walk
- [ ] #3 If a push is mandated, the procedure states what to do when it is rejected as non-fast-forward, rather than leaving it to improvisation
- [ ] #4 (g) step 2's claim that the re-pinned marking commit is already an ancestor of origin/<default> is either made true by construction and cross-referenced to what (d) step 4 mandates, or corrected to state the conditions under which it holds
- [ ] #5 (g) step 5's failed-fast-forward text names the actual cause class (an unpushed local <default> commit folded into a squash-merge) instead of attributing it solely to the clean-checkout precondition, and retains the bug-in-the-loop instruction
- [ ] #6 A documented recovery exists for an already-diverged <default>, including the check that proves no content was lost before any history-discarding command runs
- [ ] #7 reference/escalation.md's error-handling table carries a row for a failed fast-forward at (g) step 5, consistent with the above
- [ ] #8 SKILL.md's Provenance records the change per repo convention, and the version is bumped or the absence explicitly justified
- [ ] #9 doc-13 wave 2 is cited as worked evidence, naming e532f22, ed3959b, PR #69, and the contrasting clean wave-1 case
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Re-verify the mechanism myself (not on faith): confirm e532f22 (doc-13 wave-2 dispatch-marking, parent 626f369) is NOT an ancestor of ed3959b (PR #69 squash-merge, parent 626f369); confirm gh pr view 69 lists e532f22 as PR #69's first commit. Additionally verify the wave-1 contrast: fe0e46f (doc-13 wave-1 dispatch-marking) was also not pushed by itself, but IS an ancestor of origin/dev because 82fca71 (wave-1's in-flight-pointer-recording commit, committed on top) was pushed shortly after (reflog: "82fca71 ... update by push") -- an incidental rescue, not a rule. No in-flight-pointer commit exists for wave 2, which is why it had no such rescue.
2. Disposition: adopt the proposed push rule (push <default> immediately after (d) step 4's trailer check, and after the in-flight-pointer-recording commit in section i's scope note), rejecting the three recorded alternatives (drop --squash; loosen (g) step 5 to --rebase/reset; don't commit the marking pass) for the reasons already on record in the task description -- I found no better alternative during research.
3. Edit reference/wave-loop.md:
   a. (d) step 4: add a `git push origin <default>` block (no-remote skip) immediately after the trailer-parse check, before step 5's re-pin, plus a non-fast-forward rejection procedure (fetch, rebase, re-verify trailer, retry once, else escalate) -- satisfies AC#1 and AC#3.
   b. (d) step 4's crash-visibility paragraph (current line 87): rewrite to drop the stale "even if the process dies before the next push" framing (written against the old deferred-push state) and state that an unpushed marking commit found by R2 is no longer benign now that push is immediate -- it means the push failed/never ran and R3 must retry it.
   c. Section (i)'s Scope note (QCLI-49) on in-flight-pointer recording: extend to state it is now pushed immediately too, same rule/recovery, and name settlement/docs-sync commits as exempt because (i) step 3 already pushes them, after (g) -- satisfies AC#2.
   d. (g) step 2: rewrite "which is already an ancestor of origin/<default>" to state this is true by construction because of (d) step 4's new push, cross-referenced -- satisfies AC#4.
   e. (g) step 5: rewrite the diagnosis to name the real cause class (unpushed local <default> commit folded into a squash-merge), explicitly reject the clean-checkout precondition as the cause, keep the "bug in the loop, not a routine conflict" instruction, and cite doc-13 wave 2 (e532f22/ed3959b/PR#69) plus wave-1's contrasting incidental rescue (fe0e46f/82fca71) as worked evidence -- satisfies AC#5 and AC#9.
   f. Add a "Recovery when step 5 fails" block after step 5: STOP the walk for that member; prove no content was lost (diff local-only vs origin-only commits, confirm every local-only commit is an accounted-for unpushed marking/in-flight commit or pre-QCLI-60) BEFORE any history-discarding command; only then git reset --hard origin/<default>; re-verify; resume at step 6; record in the wave log -- satisfies AC#6.
4. Edit reference/escalation.md: add one row to the Error handling table for "Failed fast-forward at (g) step 5", consistent with the recovery procedure above -- satisfies AC#7.
5. Sweep both files (grep for "already an ancestor", "ff-only", "fast-forward", "clean-checkout precondition", "diverg", "even if the process dies") to confirm no other passage asserts the false claim or wrong diagnosis, before and after editing.
6. Update SKILL.md: bump version 0.9.1-qcli.8 -> 0.9.1-qcli.9 in frontmatter, add a dated Provenance entry (style-matched to QCLI-47/48/49/51/52/53) naming the defect, disposition, both commit types covered, the wave-loop.md:87 reconciliation, sweep commands/results, and the doc-13 wave-1/wave-2 evidence -- satisfies AC#8.
7. Confirm git diff --stat touches nothing under docs/.
8. Record implementation notes, commit with Refs: QCLI-60 trailer, verify with git interpret-trailers --parse, push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation complete. Files touched: .claude/skills/backlog-handover/{SKILL.md, reference/wave-loop.md, reference/escalation.md}. Nothing under docs/ (confirmed: git diff --stat -- docs/ is empty).

MECHANISM RE-VERIFIED (not taken on the task's word):
- e532f22 (doc-13 wave-2 dispatch-marking, parent 626f369) is NOT an ancestor of ed3959b (PR #69 squash-merge, parent 626f369): `git merge-base --is-ancestor e532f22 ed3959b` -> exit 1 (false).
- `gh pr view 69 --json commits` lists e532f22 as PR #69's first commit (confirms it reached GitHub only as branch content).
- `gh pr view 69 --json mergeCommit` confirms ed3959b as the merge commit.
- Contrast (doc-13 wave 1, "escaped only incidentally" claim): fe0e46f (wave-1 dispatch-marking) was also never pushed by itself -- `git log dev --oneline | grep fe0e46f` shows it only as an ancestor of 82fca71 (wave-1's in-flight-pointer-recording commit). `git reflog show origin/dev --format='%H %gs'` shows 82fca71 itself was the commit actually pushed ("update by push"), incidentally carrying fe0e46f to origin/dev before the merge walk ran. `git log --format='%h %s' | grep -i "record doc-13"` finds only 82fca71 -- no in-flight-pointer commit was recorded for wave 2, which is exactly why wave 2 (and not wave 1) hit the failure.
- Live evidence cited in the handoff (doc-14 wave-1's b332669, pushed by hand): verified `git merge-base --is-ancestor b332669 origin/dev` is true and b332669 is currently origin/dev's own tip -- consistent with, but not independent proof of, the push rule (it's this session's own worktree state, not a separate observation).

DISPOSITION: adopted the proposed push rule as-is. Rejected the three recorded alternatives for the reasons already on record in the task description (dropping --squash: wider blast radius; loosening (g) step 5 to --rebase/reset: hides the defect; not committing the marking pass: reverts QCLI-49). Research surfaced no better alternative.

CHANGES:
1. reference/wave-loop.md (d) step 4: added `git push origin <default>` immediately after the trailer-parse check (no-remote skip), before step 5's re-pin, plus a non-fast-forward rejection procedure (fetch, rebase -- safe pre-dispatch since nothing has re-pinned onto it yet -- re-confirm trailer, retry once, else escalate per escalation.md). AC#1, AC#3.
2. reference/wave-loop.md (d) step 4's crash-visibility paragraph (was line 87): rewrote to drop the stale "even if the process dies before the next push" framing (described a deliberate deferred-push gap that no longer exists) and state that an unpushed marking commit found by R2 is now a signal the push failed/never ran, requiring R3 retry -- not a benign tolerated state. This is the wave-loop.md:87 reconciliation called out in the handoff.
3. reference/wave-loop.md section (i) Scope note (QCLI-49): extended to state the in-flight-pointer-recording commit gets the identical push + recovery rule, and named settlement/docs-sync commits as exempt with reasoning (both run strictly after (g)'s walk; (i) step 3 already pushes them). AC#2.
4. reference/wave-loop.md (g) step 2: rewrote "which is already an ancestor of origin/<default>" to state this is true by construction, cross-referenced to (d) step 4's push. AC#4.
5. reference/wave-loop.md (g) step 5: rewrote the diagnosis to name the real cause class (unpushed local <default> commit folded into a squash-merge instead of being origin/<default> history already), explicitly rejected the clean-checkout precondition as the cause (step 0 already reconfirmed clean), kept the "bug in the loop, not a routine conflict" instruction verbatim in effect, and added the doc-13 wave-2 (e532f22/ed3959b/PR#69) vs wave-1 (fe0e46f/82fca71) worked contrast by name. AC#5, AC#9.
6. reference/wave-loop.md (g), new "Recovery when step 5 fails to fast-forward" block after step 5: STOP the walk for that member; prove no content was lost (diff local-only vs origin-only commits via git log A..B / B..A, individually account for every local-only commit as this wave's own unpushed marking/in-flight commit or pre-QCLI-60, else escalate) BEFORE any history-discarding command; only then git reset --hard origin/<default>; re-verify; resume at step 6; record in the wave log. AC#6.
7. reference/escalation.md: added one row to the Error handling table for "Failed fast-forward at (g) step 5", consistent with the recovery above. AC#7.
8. SKILL.md: version bumped 0.9.1-qcli.8 -> 0.9.1-qcli.9 (behavioral change: new mandatory push at two commit points, new recovery procedure, new escalation row -- not merely evidentiary, so it earns its own bump per the qcli.7-vs-qcli.8 precedent already in Provenance). Added a dated Provenance entry naming the defect, disposition, both commit types, the wave-loop.md:87 reconciliation, sweep commands/results, and the wave-1/wave-2 evidence. AC#8.

SWEEP (AC's "no other passage asserts the ancestor claim or wrong diagnosis"): `grep -c -i -E 'already an ancestor|ff-only|fast-forward|clean-checkout precondition|diverg|even if the process dies' SKILL.md reference/*.md`, run against `git show HEAD:<path>` copies of all four files (before) and the edited worktree (after).
- Before: 12 total (SKILL.md 4, wave-loop.md 7, escalation.md 1, templates.md 0). 3 were the target passages (wave-loop.md then-lines 87, 167, 172); 9 were pre-existing and unrelated, individually inspected and confirmed correct: SKILL.md:99 (PR row's --ff-only fallback), SKILL.md:159 (QCLI-53's distinct clean-checkout-precondition text), SKILL.md:211/213 + wave-loop.md:276 ("Deliberate divergence" Provenance headers, matching only on "diverg"), wave-loop.md:96/133/281 ("diverging from it" in (d) step 5, (f)'s own clean-checkout-precondition text, lore-sync's "fast-forward only" aside), escalation.md:38 (gh-missing row's git merge --ff-only fallback).
- After: 25 total (SKILL.md 8, wave-loop.md 15, escalation.md 2, templates.md 0). The 9 unrelated hits are unchanged in content (only line-shifted); the 3 target passages now state the corrected text; the remaining 13 are new hits from this task's own additions (push/recovery text in d and g, section i's scope-note extension, the new escalation.md row, and this Provenance entry itself, which necessarily repeats the search vocabulary while describing it).
- Also confirmed by direct reading (grep alone would not catch these -- neither line contains any search term): wave-loop.md (i) step 3's pre-existing `git push origin <default>` (docs-sync push) and SKILL.md R5.3's `git push origin <default>` (handover re-arm push) both already push unconditionally after (g); confirmed unaffected and requiring no change.

VERSION (AC#8): bumped, not exempted -- see reasoning under CHANGES item 8 above.

NOT VERIFIED / OUT OF SCOPE (recorded, not silently assumed): whether the new push has ever actually failed non-fast-forward in live practice (no recorded case to check against -- the recovery procedure is untested against a real occurrence); whether every historical dispatch-marking/in-flight-pointer commit predating this rule is itself an ancestor of origin/<default> today (explicitly out of scope -- this task governs future waves, not a retroactive audit, and no history is rewritten or amended).

FIX PASS (mandatory review, attempt 1/2): reviewer returned request_changes, confirming ACs #1-#5,#8,#9 and failing #6 (holding #7 on it). Four required findings + one nit, all addressed. Working dir: fix/qcli-60-default-branch-push worktree, new commits on top of 007dd56.

Fix 1 (AC#6/#7, HIGH): the recovery's "no content was lost" check tested commit CLASS (dispatch-marking/in-flight-pointer whose push failed, or predates QCLI-60), not content PRESENCE, and then unconditionally asserted "already folded into origin/<default> by the squash-merge" before discarding via reset --hard. True for the dispatch-marking commit (rides a re-pinned worker branch into the squash by construction) but false for a mid-wave/R3-recovery in-flight-pointer commit -- it postdates every worktree's re-pin, so no worker branch carries it, and a failed push means the squash that caused the divergence never had it either. reset --hard would have silently destroyed the campaign doc's in-flight-table update.

Fixed: reference/wave-loop.md (g)'s recovery now adds a content-presence check per local-only commit that passes the class check -- git merge-base --is-ancestor <sha> <branch> (this iteration's own just-squash-merged branch, still checked out), falling back to a path-scoped content diff (git show --name-only --format= for paths, then git diff <default> origin/<default> -- <paths>) if that branch ref is gone. Only a commit passing BOTH checks is discarded; one passing the class check but failing the content check is preserved instead: reset --hard origin/<default>, then git cherry-pick <sha>, then push (escalate on conflict or repeated push failure). reference/escalation.md:38's row is narrowed the same way.

Traced explicitly against the mid-wave in-flight-pointer scenario: wave with members A, B; mid-wave commit P (campaign doc only) sits on top of already-pushed dispatch-marking commit M; P's push fails, walk proceeds anyway. A's branch (re-pinned onto M before P existed) rebases clean, merges, squashes to S_A (parented on M, never touching the campaign doc). (g) step 5 fails: local-only=[P]. Class check passes (P is this wave's unpushed in-flight-pointer commit). Content check: git merge-base --is-ancestor P <branch-A> is FALSE (P postdates the re-pin); diff fallback on the campaign-doc path is non-empty (S_A never touched it). P fails the content check -> NOT discarded: reset --hard to S_A, cherry-pick P (clean), push -- P's content survives as a new SHA on top of S_A. Under the original unfixed text this would have been silently destroyed. Confirms the finding and confirms the fix closes it.

Fix 2 (required): sweep decomposition was off by one (25 after = "9 unrelated + 3 targets + 13 new", should be "9 unrelated + 2 targets + 14 new" -- (g) step 2's corrected text no longer matches the search pattern). Re-ran the sweep myself against the fully edited tree (which also includes this fix pass's own additions, not just 007dd56's): grep -c -i -E 'already an ancestor|ff-only|fast-forward|clean-checkout precondition|diverg|even if the process dies' SKILL.md reference/*.md -> SKILL.md 12, wave-loop.md 15, escalation.md 2, templates.md 0 = 29 total. Verified by grep -n listing every matching line and classifying each: 9 unrelated (unchanged, same lines as before), 2 targets still matching (the (d) step 4 crash-visibility parenthetical and (g) step 5's diagnosis; (g) step 2's "by construction" text still does not match, confirmed), 18 new (9 in SKILL.md, 9 in wave-loop.md/escalation.md combined -- wave-loop 9 + escalation 1). 9+2+18=29, matches the raw count exactly. Documented in SKILL.md's sweep paragraph with the corrected decomposition and an explicit note that (g) step 2's corrected text no longer matches.

Fix 3 (required): reference/wave-loop.md:102's "R3 must retry it" duty had no counterpart in SKILL.md's R3 (unlike the lore-sync precedent at wave-loop.md:333, which ends "(SKILL.md's R3 carries a pointer to this bullet.)"). Fixed: added the identical back-reference at wave-loop.md:104 (line shifted from insertions), and added a matching sentence to SKILL.md's R3 stating the retry duty and citing wave-loop.md (d) step 4.

Fix 4 (required): SKILL.md's sweep paragraph cited `git show HEAD:<path>` for the "before" tree, which is not re-runnable post-commit (HEAD is the after-state on this branch). Fixed: cited `git show dev:<path>` instead. Re-ran against dev: and confirmed the before-numbers are unchanged (12 total: SKILL.md 4, wave-loop.md 7, escalation.md 1, templates.md 0).

Fix 5 (nit, adopted): (d) step 4's non-fast-forward recovery covered only a non-ff rejection, leaving auth/network/unset-origin/HEAD push failures unhandled -- a live path to the same divergence. Added one clause: any other push failure -> STOP and escalate immediately, do not fetch/rebase/retry.

Added a "Fix pass (mandatory review, 2026-08-08)" Provenance paragraph in SKILL.md documenting all five findings and dispositions, per-finding, plus the mid-wave-in-flight-pointer trace. Version stays 0.9.1-qcli.9 -- QCLI-60 has not yet settled, so this fix pass is still part of finishing the one task the existing bump covers, not a new task; finding 1 is a real behavior change but corrects qcli.9's own not-yet-landed behavior rather than adding new behavior on top of already-landed history.

Confirmed: git diff --stat dev...HEAD -- docs/ is empty (docs/ untouched). Version frontmatter still "0.9.1-qcli.9". Only .claude/skills/backlog-handover/{SKILL.md,reference/wave-loop.md,reference/escalation.md} touched (3 files, 51 insertions/11 deletions per git diff --stat).
<!-- SECTION:NOTES:END -->
