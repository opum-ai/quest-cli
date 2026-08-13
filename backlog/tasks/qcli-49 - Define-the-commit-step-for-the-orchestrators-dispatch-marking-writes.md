---
id: QCLI-49
title: Define the commit step for the orchestrator's dispatch-marking writes
status: Done
assignee: []
created_date: '2026-08-07 20:27'
updated_date: '2026-08-08 01:48'
labels:
  - campaign
  - 'cluster:campaign-machinery'
  - wave-3
dependencies: []
priority: medium
type: chore
ordinal: 68000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
With `backlog/config.yml` setting `auto_commit: false`, `backlog task edit QCLI-<N> -s "In Progress" --add-label "wave-<N>"` writes the task file and leaves it **dirty in whichever checkout ran it**. The orchestrator runs those edits in its own `dev` checkout; each worker independently commits its *own* copy of the same task file inside its worktree (plan, notes). The two copies diverge, and `reference/wave-loop.md` sections d and i never say whether the orchestrator's write should be committed.

**This is not theoretical — it broke doc-11 wave 1 (2026-08-07).** The merge queue hit `error: cannot rebase: You have unstaged changes` on `QCLI-45`, because `dev` still carried uncommitted `wave-1` / `in-review` label edits for both wave members. It was resolved by discarding the label churn (verified first to contain only labels and `updated_date`, no plan or notes) and reconstructing the labels at settlement — but that resolution was improvised mid-merge, not a documented procedure.

The same gap was independently flagged by `QCLI-47`'s worker as an out-of-scope discovery, which is corroboration from a second direction rather than the same observation twice.

Either answer is defensible and the task is to pick one and write it down:

- **Commit them** — dispatch marking becomes a real commit on `<default>` (and under `QCLI-47`'s hybrid rule it carries `Refs: QCLI-<N>`, since it has a single directing task).
- **Leave them uncommitted and discard at settlement** — cheaper, but then the merge queue needs an explicit "orchestrator checkout must be clean before rebasing any member" precondition, and crash recovery loses the dispatch marking that R2/R3 rely on to tell what actually got underway.

Note the interaction with `R4d`'s stated purpose: the marking exists so a crashed session's R2/R3 can tell which members were really dispatched. An uncommitted marking does not survive a crash, which is an argument the chosen answer has to address either way.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The skill states, at the point of action in `reference/wave-loop.md` section d, whether dispatch-marking and in-flight-pointer writes are committed — and if so, on which ref and with which trailer under QCLI-47 hybrid rule
- [x] #2 The merge queue (section g) carries an explicit precondition about the orchestrator own checkout being clean before rebasing a member, or an explicit statement that it cannot be dirty given the chosen answer
- [x] #3 The interaction with the worker own committed copy of the same task file is described, including what happens to it at merge
- [x] #4 The chosen answer addresses whether dispatch marking survives a crash, since R2/R3 reconciliation depends on it
- [x] #5 The rule is stated concretely enough that a future session does not re-derive it: a reader can tell what to run, in what order, without inference
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read wave-loop.md sections d/f/g/i and SKILL.md Commits row + R2/R3; corroborate fresh evidence against real git history (fe92535, 3633bc1, 61d48af).
2. Decide: commit dispatch-marking writes on <default> immediately (not left dirty), one Refs: QCLI-<N> trailer per task marked in that pass, matching the exercised and working wave-2/wave-3 pattern.
3. Edit section d: mark+commit the pass in one commit, verify trailers parse, then re-pin every just-acquired worktree onto that commit before dispatching workers (safe only pre-dispatch, since worktrees hold zero commits beyond WAVE_BASE at that point).
4. Edit section f: state the sharper root cause explicitly — mid-wave in-review/merge-pending label edits on the task file are NEVER committed on <default> while the branch is unmerged (no empty worktree left to re-pin onto); run, verify diff is label/updated_date-only, discard, reconstruct at settlement.
5. Edit section g: add an explicit clean-checkout precondition (step 0 + preamble) tied to d and f, plus explain why the rebase in step 2 is conflict-free on label lines.
6. Edit section i: update the dispatch-marking and in-flight-pointer trailer-table rows to reflect multi-task-per-pass commits (mirroring the docs-sync row), and add a scope note distinguishing in-flight-pointer commits (campaign doc, always committed) from mid-wave label edits (task file, never committed).
7. Bump SKILL.md to 0.9.1-qcli.5 with a Provenance entry in QCLI-47/48's style.
8. Verify each AC against the edited prose directly (no automated gate exists).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decision (QCLI-49): COMMIT the orchestrator's dispatch-marking writes on <default> immediately — do not leave them dirty. This is not a fresh call, it is a description of what doc-11 waves 2 and 3 already did and verified working: fe92535 (wave 2, Refs: QCLI-46 + Refs: QCLI-48, both parse) and 3633bc1 (wave 3, Refs: QCLI-49 + Refs: QCLI-50, both parse) each commit the whole wave's dispatch-marking pass in ONE commit with one Refs: trailer per task marked, then re-pin every just-acquired worktree onto that commit (git reset --hard) before any worker is dispatched. Both waves rebased and merged with zero label-line conflicts. Chose 'commit' over 'leave dirty + discard at settlement' because: (a) it is what was actually exercised twice and worked, not a hypothetical; (b) the re-pin step turns the ordering constraint (R4d: acquire-then-mark) into a conflict-preventer rather than a conflict-source, at zero cost since no worker commit exists yet to lose; (c) the 'leave dirty' alternative still needs the same clean-checkout precondition for the merge queue, but without a committed marking to point to, so it buys nothing.

Sharper root cause (fresh evidence, corroborated): the wave-1 failure and the mid-wave-2 near-miss (backlog task edit QCLI-48 --add-label in-review on dev while QCLI-48's branch was unmerged) are NOT the same bug as dispatch marking, even though both are 'orchestrator writes the task file on <default> while a worker also has a copy.' The distinguishing fact is timing relative to the worker's first commit: dispatch marking (d) runs BEFORE any worker commit exists, so committing it and re-pinning the (still-empty) worktree onto it is free — there's nothing to lose. Mid-wave label edits (f) run AFTER the worker has already committed its own copy of the task file (plan/notes), so there is no empty worktree left to re-pin onto without destroying that work — committing on <default> at that point creates a REAL frontmatter conflict. Resolution: never commit mid-wave in-review/merge-pending edits on <default> at all; run them, verify the diff is label+updated_date only, discard before that branch's rebase, and let settlement (which runs after merge, when only one copy of the file remains) set the final label state. This is now explicit in section f, not just a mid-merge improvisation. Concluded this is IN SCOPE (not declared out of scope) because the fresh evidence directly demonstrates the same failure class and the fix is a natural extension of the same reasoning.

Crash survival: because the dispatch-marking commit lands on <default> synchronously as part of (d), before any worker is dispatched, it survives a crash the same way any other commit does — visible via git log <default> even if never pushed (R2 step 1 already checks for unpushed commits). A resumed session's R2/R3 can distinguish 'lease acquired but never marked' (crash before step 4) from 'marked and dispatched' (commit present) from 'dispatched and worker made progress' (worktree's own git log has commits beyond the marking commit) — exactly the disambiguation R4d's design note says the marking exists to support, and R2 point 4 already instructs checking the worktree's own git log for this.

Also updated: wave-loop.md section i's trailer table (dispatch marking + in-flight-pointer rows now describe multi-task-per-pass commits, matching actual practice/evidence, not one-commit-per-task); section g now states an explicit clean-checkout precondition before/during the merge walk, tied to (d)'s commit-immediately rule and (f)'s never-commit-mid-wave rule, and cites escalation.md's existing 'Dirty working tree at preflight' STOP row as the fallback if the precondition is ever violated. Bumped skill to 0.9.1-qcli.5 with a Provenance entry.

Out-of-scope discovery (not fixed, recorded only): wave-loop.md never explicitly states WHERE/WHEN the merge-pending label is first applied (only its removal, at settlement and escalation, is shown). Section f's new mid-wave rule covers it generically ('and later merge-pending') but the missing origin step is a pre-existing gap unrelated to this task's scope (the commit policy, not the label-transition step list) — flagging for a future task rather than adding a new step myself, per this task's HARD CONSTRAINTS (stay in scope) and the campaign's no-unprompted-scope-expansion rule.

SETTLEMENT (doc-11 wave 3, 2026-08-07). Merged as `7c68170` (PR #64), plus integration-review follow-up `42bc64e` (PR #66).

Review ran in the skill's degraded mode — an orchestrator-run adversarial pass.

Independently verified rather than accepted from the implementer's report — this task's prose cites specific commits as worked examples, so each claim was checked against real history:
- `fe92535` → two `Refs:` trailers (QCLI-46, QCLI-48) ✔
- `3633bc1` → two `Refs:` trailers (QCLI-49, QCLI-50) ✔
- `61d48af` → touches ONLY `backlog/docs/campaigns/…`, confirming the scope note that in-flight pointer recording writes the campaign doc and never the task file ✔
- `342e76d` → single trailer ✔

The decision was not a rubber-stamp of the orchestrator's supplied evidence. It distinguished two cases the evidence had run together: dispatch marking (runs *before* any worker commit exists, so re-pinning an empty worktree costs nothing) versus mid-wave `in-review`/`merge-pending` transitions (run *after* the worker has committed its own copy, so no empty worktree remains to re-pin onto → never committed, discarded, reconstructed at settlement). It also added a scope note separating both from campaign-doc in-flight writes.

WAVE-LEVEL INTEGRATION FINDING (found and fixed this wave). Updating `wave-loop.md`'s trailer table left SKILL.md's `**Commits**` row — the summary that explicitly points at that table — still describing dispatch marking and in-flight pointer recording as single-task commits. Two files governing the trailer convention, contradicting each other: the exact defect QCLI-47 exists to prevent. Neither single-task review could see it; only the cumulative-diff pass was positioned to. Fixed in `42bc64e`: the row now states three cases (worker/implementation; settlement, single task; dispatch-marking / in-flight-pointer, one commit per pass with one trailer per task), and corrects 'has one directing task' to 'has a directing task'. Both no-trailer exceptions, QCLI-48's verification sentence, and the section-i pointer were preserved verbatim; no version bump, since this is a correction within this task's own `0.9.1-qcli.5` divergence.

OUT-OF-SCOPE DISCOVERY (verified, deliberately NOT acted on, surfaced to the owner): the skill never states where the `merge-pending` label is first applied. It appears in SKILL.md's state table as a lifecycle stage, and in `wave-loop.md` only as something discarded (section f) or removed at settlement — no step ever adds it. Confirmed by `grep -rn 'merge-pending' .claude/skills/backlog-handover/`. Pre-existing and unrelated to this task's commit-policy scope. Per this project's rule against creating follow-up work unprompted, it is proposed to the owner rather than filed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Settled the open question in `reference/wave-loop.md` sections d and i: with `auto_commit: false`, does the orchestrator commit its own dispatch-marking task-file writes when each worker independently commits its own copy of the same file? The gap broke doc-11 wave 1's merge queue outright (`error: cannot rebase: You have unstaged changes`).

Decision: **commit the dispatch-marking pass on `<default>` immediately**, one `Refs: QCLI-<N>` trailer per task marked in that pass, then re-pin every just-acquired worktree onto that commit before dispatching any worker — safe only there, because no worker commit yet exists to lose. The re-pin is what makes the marking a shared ancestor, so a worker's later commit to its own task file layers on top rather than diverging, and the merge-queue rebase never conflicts on the label lines. This is not a fresh call: doc-11 waves 2 and 3 exercised it twice (`fe92535`, `3633bc1`) with zero rebase conflicts, and all four commits the write-up cites as worked examples were independently verified against real history.

A sharper second root cause was identified and covered: mid-wave `in-review`/`merge-pending` edits run after a worker has already committed leave no empty worktree to re-pin onto, so that class is never committed on `<default>` at all — run, verified label/`updated_date`-only, discarded before rebase, reconstructed at settlement. Sections d, f, g and i now state both rules with runnable commands and worked SHAs, and (g) carries the resulting clean-checkout precondition, which holds by construction rather than by discipline. Crash survival is addressed directly: the marking is a real commit visible in `git log <default>` even unpushed, not a working-tree edit a crash discards.

Skill at `0.9.1-qcli.5`. Merged as `7c68170` (PR #64); a wave-level integration review then caught SKILL.md's summary row still contradicting the updated table, fixed in `42bc64e` (PR #66).
<!-- SECTION:FINAL_SUMMARY:END -->
