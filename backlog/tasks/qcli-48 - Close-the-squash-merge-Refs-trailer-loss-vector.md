---
id: QCLI-48
title: Close the squash-merge Refs trailer-loss vector
status: Done
assignee: []
created_date: '2026-08-07 20:27'
updated_date: '2026-08-08 01:29'
labels:
  - campaign
  - 'cluster:campaign-machinery'
  - wave-2
dependencies: []
priority: medium
type: chore
ordinal: 67000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A `Refs: QCLI-<N>` line separated from the final trailer block by a blank line is **not** parsed by git as a trailer. `git interpret-trailers --parse` returns only the trailing `Co-Authored-By:` block, and `%(trailers:key=Refs)` reports empty — silently defeating the exact measurement `QCLI-47`'s evidence and provenance record depend on.

Discovered during doc-11 wave-1 review (2026-08-07) and confirmed to predate that wave:

- `QCLI-47`'s own branch commit `6f3236f` carried the line but not a parseable trailer. Fixed at merge by authoring the squash message explicitly; the merged `694e109` parses correctly.
- **`7efc1a4` — the already-merged `QCLI-43` squash commit — carries no parseable `Refs` trailer on `dev` today.** Compare `342e76d`, a directly-authored settlement commit, which parses correctly.

The pattern: directly-authored commits keep their trailer; PR squash-merges lose it when the generated body places `Refs:` above a blank line and another trailer block. This means some commits counted as "untrailered" by a `%(trailers:key=Refs)` sweep may in fact contain the text — so any future sweep using that method needs to distinguish the two.

Scope: a verification rule plus a sweep. Does **not** rewrite history — no existing commit is amended or re-trailered.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A sweep of `dev` identifies every merged commit whose message text contains a `Refs:` line that `git interpret-trailers --parse` does not report, with the command and the per-commit result recorded
- [x] #2 The backlog-handover skill states that a Refs trailer must sit in the final trailer block with no blank line separating it from other trailers, and names `git interpret-trailers --parse` as the verification
- [x] #3 The skill shows a worked correct example and a worked incorrect example, so the failure mode is recognizable without re-deriving it
- [x] #4 The disposition of the already-merged non-parseable commits (notably `7efc1a4`) is recorded as an explicit decision rather than left implicit
- [x] #5 No existing commit is amended or re-trailered; `git log` on `dev` shows no rewritten history
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Sweep `dev` (258 commits) distinguishing Refs text-present from Refs trailer-parseable, using:
   `git log dev --format='%H' | while read c; do msg=$(git log -1 --format=%B "$c"); echo "$msg" | grep -qE '^Refs:' && { parsed=$(git interpret-trailers --parse <<<"$msg" | grep -E '^Refs:'); [ -z "$parsed" ] && echo UNPARSEABLE $c || echo OK $c; }; done`
   Result: 202/258 carry Refs: text, 36 of those unparseable (list captured for task notes). Confirms 7efc1a4 and finds 35 more, mostly pre-QCLI-35 squash merges plus a handful of newer ones (d0b5f41, 9c63769, 146956d, 8721feb, c9353bc, ed14115, fb8e8e3, etc).
2. Edit `.claude/skills/backlog-handover/reference/wave-loop.md` section i ("Commit trailer convention"): add a subsection stating the placement rule (Refs must be in the final trailer block, no blank line separating it from other trailers e.g. a squash-merge's Co-Authored-By: block) and naming `git interpret-trailers --parse` as verification, with 342e76d as the worked correct example and 7efc1a4 as the worked incorrect example (real excerpts + command output).
3. Edit SKILL.md's Commits convention row: append a pointer sentence naming the placement rule and verification command, referencing wave-loop.md section i for detail.
4. Record the AC #4 disposition inline in wave-loop.md and in a new SKILL.md Provenance entry: already-merged unparseable commits (7efc1a4 named) are left as-is — no amend/re-trailer, per scope — and the sweep itself (re-runnable, command recorded in task notes) is the durable record of the gap; future sweeps must run both the text-grep and the interpret-trailers --parse check and report both counts rather than conflating them.
5. Bump skill version 0.9.1-qcli.3 -> 0.9.1-qcli.4 (frontmatter) and add the Provenance entry in QCLI-47's style.
6. Record sweep command, full per-commit bad list, and disposition reasoning via --append-notes.
7. Commit with `Refs: QCLI-48` as the sole line in the final trailer block; verify with `git interpret-trailers --parse <<<"$(git log -1 --format=%B)"` before pushing.
8. Push fix/qcli-48-refs-trailer-loss-vector.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep executed against dev (258 commits) at HEAD fe92535:

  git log dev --format='%H' | while read c; do
    msg=$(git log -1 --format=%B "$c")
    if echo "$msg" | grep -qE '^Refs:'; then
      parsed=$(git interpret-trailers --parse <<<"$msg" | grep -E '^Refs:' || true)
      [ -z "$parsed" ] && echo "TEXT_PRESENT_UNPARSEABLE: $c" || echo "OK_PARSES: $c"
    fi
  done

Result: 258 scanned, 202 carry Refs: text, 36 unparseable (166 parse correctly).

Unparseable commits (short SHA + subject), newest first:
7efc1a4 QCLI-43: Fold the lore log sync into campaign settlement to stop recurring docs/log.md SHA drift (#59)
d0b5f41 chore(campaign): mark QCLI-43 dispatched — wave 2 of doc-10 campaign
9c63769 chore(campaign): settle QCLI-44 and record wave 1 of doc-10
146956d chore(campaign): record wave-1 in-flight pointer for QCLI-44
8721feb chore(campaign): mark QCLI-44 dispatched — wave 1 of doc-10 campaign
3686859 chore(campaign): init doc-10 for QCLI-43 and QCLI-44 (doc-9's approved follow-ups)
34bceae chore(backlog): file doc-9's two approved follow-ups (QCLI-43, QCLI-44)
8caae19 chore(campaign): settle QCLI-40 and close out doc-9 — campaign complete
c9353bc QCLI-40: Reconcile stale file layout/naming scheme open-item bundles outside the register and delivery-graph docs (#57)
748bf5f chore(campaign): mark QCLI-40 dispatched — wave 1 of doc-9 campaign
6047774 chore(campaign): init doc-9 for QCLI-40 (doc-8's approved follow-up)
761313d QCLI-38: Reconcile 'naming scheme' terminology against QCLI-25/D4's authored-record layout (#54)
4640ab3 QCLI-37: Reconcile stale 'record layout' status in the Spec-open-questions mapping table (#53)
ce4a130 QCLI-34: Reconcile 'file layout' terminology against QCLI-25/D4's authored-record layout (#50)
2e57876 QCLI-32: Run a centralized lore sync to reconcile the Phase-1-ratification Story (#48)
6ffc401 QCLI-29: Correct stale 'nothing accepted' prose in three ratified Quest CLI proposal docs (#45)
9e7a0c0 QCLI-25: Author an ADR for the Quest CLI canonical identifier grammar and authored-record layout (#40)
ed14115 chore: fix narrow findings from the wave-2 integration review (#37)
fb8e8e3 QCLI-17: Correct the open component decisions register's Backlog.md reclassification-trigger claim (#30)
44a7ed8 QCLI-16: Audit and correct the licensing-source misattribution in the contracts and delivery graph (#29)
6b78fd0 QCLI-15: Audit two unresolved register findings (untraceable Allowed value, QCLI-2.12's F4/F5) (#28)
077d3be QCLI-14: Correct the bin-path row in the packaging contract's Description column (#27)
d871d32 QCLI-13: Backlink the adoption playbook from the component charter and migration ledger (#26)
1dd4aa6 QCLI-12: Fix the stale QCLI-2.8 dependency-order row in the research programme Spec (#25)
5464f50 chore(campaign): init the QCLI-11..QCLI-20 design-layer follow-through campaign
1330ecf QCLI-10: add the derived design layer over the QCLI research corpus
8935551 QCLI-2.8/2.10 integration-review follow-up: cross-document coherence fixes (#20)
f7c93c8 chore(backlog): file the four approved wave-2 follow-ups
61c79d5 chore(backlog): settle wave 2 and record the campaign log
79bb99d QCLI-2.9: Record the @opum-ai/quest packaging contract with dated registry evidence (#4)
2246c46 QCLI-2.7: Track Lore dependencies and Quest activation evidence (incl. lore-cli adapter alignment) (#3)
09c202d QCLI-2.2: Reconcile legacy Opum requirements into Quest CLI candidates (#2)
0a70a4c chore(backlog): commit wave-2 dispatch marking
4dd721a chore(backlog): reconcile restore-2 drift and record owner rulings 7-9
0cf0f34 chore(backlog): init backlog-handover campaign for QCLI-2
649daad docs: record OCLI-1 supersession for the backlog-handover skill port

Pattern confirmed: nearly all are either PR squash-merges (#N in subject) whose generated body concatenates multiple source commits each ending its own Refs: line, or older chore(campaign)/chore(backlog) bookkeeping commits predating the placement-rule awareness this task adds. 342e76d contrasted as the parseable, directly-authored counter-example (confirmed still parses: `Refs: QCLI-43`).

AC #4 disposition: none of the 36 are amended or re-trailered — out of scope by this task's own framing ("does not rewrite history"). Disposition is: leave them as-is, and treat this sweep (command + full list, reproducible any time) as the durable record of the gap rather than trying to fix the history. Documented inline in reference/wave-loop.md section i ("Disposition of already-merged unparseable commits") and in SKILL.md's new Provenance entry (0.9.1-qcli.4). Forward-looking mitigation: the skill now requires interpret-trailers --parse verification at every commit-authoring step, and any future sweep must report text-present vs parseable as two distinct counts rather than conflating them (the exact confusion that let 7efc1a4 go unnoticed until doc-11 wave-1 review).

Files changed: .claude/skills/backlog-handover/SKILL.md (Commits row pointer, version bump 0.9.1-qcli.3 -> 0.9.1-qcli.4, new Provenance entry), .claude/skills/backlog-handover/reference/wave-loop.md (new "Trailer placement and verification (QCLI-48)" subsection under section i, with worked correct/incorrect examples and the sweep). No docs/ files touched, no lore sync run, no existing commit amended.

SETTLEMENT (doc-11 wave 2, 2026-08-07). Merged as `c47c2a0` (PR #63), rebased onto `dev` after QCLI-46 landed and re-verified before merge.

Review ran in the skill's degraded mode — an orchestrator-run adversarial pass. Note this task's own worker completed fully (committed AND pushed) but its structured return was lost; the work was recovered by inspecting the worktree's git state directly rather than re-dispatching. That is now the 5th return-path failure across two sessions.

Independently re-derived by the orchestrator, not taken on the implementer's word:
- AC #1: the sweep was re-run from scratch by the orchestrator — 258 scanned, 202 carrying `Refs:` text, 36 unparseable, 166 parsing. Beyond matching the counts, the 36 SHAs were compared as a SET against the worker's recorded list and were byte-identical (`diff` returned empty). Counts agreeing could be coincidence; identical sets could not.
- AC #3: both worked examples reproduce literally, not just plausibly. `342e76d` → `Refs: QCLI-43`; `7efc1a4` → only `Co-authored-by:`, with `%(trailers:key=Refs)` empty. The documented mechanism was then checked against `7efc1a4`'s actual message structure and confirmed exactly: `Refs: QCLI-43` at line 76, blank line, `---------`, blank line, then a lone `Co-authored-by:` as the real final trailer block.
- AC #5: `dev` was 0/0 against `origin/dev` throughout; the branch adds exactly one commit and rewrites nothing.
- Self-referential check: this task's own commit trailer parses, which for this task of all tasks would have been an embarrassing defect to miss.

WAVE-LEVEL INTEGRATION EVIDENCE — the rule is already working. Re-running this task's own sweep on `dev` after both of this wave's merges landed: total 258 → 260 (+2), commits carrying `Refs:` text 202 → 204 (+2), unparseable unchanged at **36**. Both merges this wave were authored with explicit squash bodies and both parse. So the wave that introduced the rule introduced zero new violations of it — empirical confirmation of the forward-looking mitigation, not just a documented intention.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Closed the squash-merge `Refs` trailer-loss vector: a `Refs: QCLI-<N>` line separated from a message's final trailer block by a blank line reads like a trailer but is not one, so `git interpret-trailers --parse` and `%(trailers:key=Refs)` both silently report nothing — quietly defeating the exact measurement QCLI-47's evidence and provenance record depend on.

Added a 'Trailer placement and verification' subsection to `reference/wave-loop.md` section i stating the placement rule, naming `git interpret-trailers --parse` as the verification, and showing a worked correct example (`342e76d`) beside a worked incorrect one (`7efc1a4`) so the failure mode is recognizable without re-deriving it. SKILL.md's Commits row gained a pointer sentence and a Provenance entry; the skill is now `0.9.1-qcli.4`.

A full sweep of `dev` found 258 commits, 202 carrying `Refs:` text, of which 36 are unparseable — the command and the complete per-commit list are recorded in this task's notes, and the orchestrator's independent re-run produced a set-identical result. Disposition (AC #4), recorded explicitly rather than left implicit: none of the 36 are amended or re-trailered, since this task's scope is a verification rule plus a sweep and not a history rewrite; the re-runnable sweep itself stands as the durable record of the gap. Any future sweep must report 'no `Refs:` text at all' and '`Refs:` text present but unparseable' as two distinct counts — conflating them is what let `7efc1a4` go unnoticed. No existing commit was amended and no history was rewritten. Merged as `c47c2a0` (PR #63).
<!-- SECTION:FINAL_SUMMARY:END -->
