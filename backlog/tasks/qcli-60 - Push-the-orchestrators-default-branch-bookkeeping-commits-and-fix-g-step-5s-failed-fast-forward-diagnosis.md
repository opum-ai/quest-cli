---
id: QCLI-60
title: >-
  Push the orchestrator's default-branch bookkeeping commits and fix (g) step
  5's failed-fast-forward diagnosis
status: In Progress
assignee: []
created_date: '2026-08-08 21:43'
updated_date: '2026-08-08 21:45'
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
