---
id: doc-13
title: Backlog campaign tracker
type: other
created_date: '2026-08-08 14:59'
updated_date: '2026-08-08 19:14'
---
# Backlog campaign tracker

Protocol: restore -> recompute the ready/conflict graph from Backlog -> acquire
worktrees -> mark the acquired members dispatched -> implement + review in
parallel -> serialize the merge -> settle tasks and write this doc once more ->
loop until the queue is empty or blocked -> write handover.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. **Campaign complete** as of wave-2
settlement (2026-08-08): **0 queued, 0 in flight, 0 blocked, 0 needs-human** —
both queued tasks resolved. QCLI-54 and QCLI-55 were filed during this campaign
but deliberately left unlabelled, so they seed the next campaign rather than
being swept into this one.

Expected shape: **two waves of one task each**, because the two queued tasks
conflict (see Conflict note) rather than because either depends on the other. A
wave of size 1 is the wave builder correctly degrading to sequential, not a
defect.

## Origin of this campaign

Seeded 2026-08-08 from doc-12's two approved follow-up proposals — both surfaced
by doc-12 wave 1's integration review and filed with the user's explicit
approval at that campaign's R6 (commit `b3b5d99`).

I1 ground truth, verified by command: **72 tasks, 70 `Done`, 2 `To Do`**;
`dev` clean at `b3b5d99` and in sync with `origin/dev`; zero campaign branches
local or remote; zero open PRs; all six treehouse pool slots `available` with
zero leases; `.claude/handovers/` empty (doc-12 closed correctly under the
campaign-complete rule, archiving its final handover with no successor).
`.gitignore` already carries `.claude/handovers/` and `archive/handovers/`
already exists, so I3's one-time gitignore setup was a no-op and produced no
commit. Nothing to reconcile.

## Conflict note — why these two cannot share a wave

Both QCLI-52 and QCLI-53 carry an AC#5 requiring an entry in
`.claude/skills/backlog-handover/SKILL.md`'s Provenance section plus a version
decision. That is a **file-level conflict on shared, adjacent lines**, and the
version bump is sequentially numbered, so whichever merges second must read the
first's number. It is deliberately **not** modelled as a native `--dep`: neither
task needs the other's content, and Backlog's dependency field is the logical
graph, not the conflict graph. The wave builder serializes them on file overlap.

Wave 2's worker must therefore read the Provenance section as it exists in its
**rebased** worktree, not as it existed at init, before choosing its version
string.

## Confirmed queue order

Confirmed by the user on 2026-08-08. This is the wave-builder's tie-break, NOT a
guarantee that any task lands in any particular wave.

1. QCLI-52 — Finish the stage-state legibility sweep QCLI-51 started
2. QCLI-53 — Settle the discard-timing looseness between wave-loop (f) and (g)'s
   clean-checkout precondition

Rationale given at confirmation: QCLI-52 is Medium priority against QCLI-53's
Low, and it settles `SKILL.md`'s framing first, so QCLI-53's worker rebases onto
already-consistent prose.

## Self-edit hazard — the campaign edits its own driver

Both queued tasks modify `.claude/skills/backlog-handover/SKILL.md` and/or
`reference/wave-loop.md` — the skill executing this campaign. The user's ruling
at init (2026-08-08): **the orchestrator follows the version it read at init**
for the whole campaign, and merged changes take effect for the *next* campaign,
not mid-flight. This keeps the algorithm fixed between wave 1 and wave 2 rather
than having wave 1's merge alter how wave 2 is run.

Consequence for a restoring session: after wave 1 merges, the on-disk SKILL.md
will differ from the one this campaign is being executed under. That is
expected, not drift. A restore that happens after wave 1 has merged should note
which version it is reading and proceed — the two tasks' changes are
clarifications, not procedure reversals.

## Clusters

| Cluster label       | Covers                                         | Tasks              |
| ------------------- | ---------------------------------------------- | ------------------ |
| `cluster:skill-docs` | The backlog-handover skill's own documentation and mechanics text | QCLI-52, QCLI-53 |

Both tasks share one cluster. That is accurate — they are the same subsystem —
and costs nothing, since the conflict graph serializes them regardless.

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

_Cleared at wave-1 settlement. QCLI-52's row read `1 — dispatched` right up until
settlement even though the task was merged — the staleness Proposal A describes,
observed live._

## Needs a human / blocked

None at init. Both queued tasks were classified agent-resolvable: their
acceptance criteria are wording-consistency checks, scoped prose sweeps with
recorded method, and a disposition derived from current text — all objectively
verifiable by an agent, with the mandatory reviewer gate covering the judgment
calls (QCLI-53 AC#2 in particular).

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed.

**Status, corrected at wave-2 settlement:** the wave-1 proposals below are no
longer merely proposed. With the user's explicit approval at wave 1's R6,
Proposals A and B were **filed as QCLI-54 and QCLI-55** and Proposal C was
**folded into QCLI-53 as acceptance criteria #6–#8** (all in commit `626f369`).
The wave-1 text is kept below as the record of what was proposed and approved.
Wave 2's proposals, further down, remain unfiled and awaiting approval.

Three proposals from doc-13 wave 1's integration review, plus one narrow bundle.
**None filed** — awaiting the user's explicit approval.

### Proposal A — bind the `Stage reached` column to a stage scale, and settle recording cadence

Supersedes the wave's original in-flight-staleness proposal; sharpened with a
second, deeper cause. Two defects, both in `reference/`, outside the legibility
scope QCLI-52 was held to:

- **Staleness.** `reference/wave-loop.md` mandates a recording pass at dispatch
  only. Five of the six commits that ever wrote in-flight rows record stage 1.
  Observed live this wave: the table read `1 — dispatched` for QCLI-52 while the
  task was already merged.
- **No binding scale.** `reference/wave-loop.md`'s per-task stage table scopes
  itself to "**the handover's** in-flight table" and never claims jurisdiction
  over the campaign doc's `Stage reached` column; `reference/templates.md`
  defines both columns and points neither at the scale. The column is free text
  no orchestrator is bound by — the direct cause of `0b63077` writing
  `6 — under review` when stage 6 means "Reviewed to `approve`".

ACs: (1) the stage table states whether it governs the campaign doc's column,
the handover's, or both, and templates.md cites the governing scale for each;
(2) a settled decision, with reasoning, on whether any post-dispatch recording
pass is mandated — including the option of *not* mandating one with the cost to
R2's fourth signal named and accepted; (3) if mandated, each trigger point and
owner named, consistent with QCLI-49's commit-immediately rule and QCLI-47's
one-trailer-per-recorded-task rule; (4) the rule requires the annotation to be
consistent with the cited numeral, so `0b63077`'s row would be prevented or
flagged; (5) SKILL.md R2 step 5's fourth-signal wording reconciled with whatever
is settled; (6) Provenance records it, version bumped or absence justified.

### Proposal B — retire the "not yet exercised" gap statement (time-sensitive)

`reference/wave-loop.md`'s (f) Evidence paragraph states `merge-pending`'s
point-of-action edit "has not yet been separately exercised in a recorded wave."
**This wave exercised it** — see the wave log below. The statement became false
the moment that log entry was written.

Routing matters: the same sentence also sits in SKILL.md's QCLI-51 Provenance
entry, which is a dated *record* of what QCLI-51 knew, not prose a reader acts on
today. Per CLAUDE.md's record-vs-current-assertion test it must not be silently
corrected or re-tensed — QCLI-50 does not rescue it, since reversing what the
record asserts is not a tense-only edit. It gets an inline dated supersession
amendment citing the directing task per QCLI-44, or is left alone.

Not foldable into QCLI-53: the line sits inside section (f), which QCLI-53 edits,
but is outside all five of QCLI-53's ACs — fixing it there is a drive-by the
reviewer checklist flags.

ACs: (1) (f)'s Evidence paragraph cites doc-13 wave 1 as direct evidence, naming
`d652126` and what was observed, and drops the "not yet exercised" claim as
current prose; (2) SKILL.md's QCLI-51 entry is treated as a record — left intact
or amended inline, dated and citing the directing task, never silently re-tensed;
(3) the evidence cited is verifiable from committed state, not session narration;
(4) it is recorded that wave 1 was size 1 and so supplies no evidence toward
QCLI-53; (5) Provenance records it, version bumped or absence justified.

### Proposal C — preserve R2's dirty-diff signal when settling QCLI-53 (decide before QCLI-53 runs)

SKILL.md R2 step 5's **first** durable signal says a label-only dirty entry on the
orchestrator's checkout pins a crash before or after the `approve` verdict. That
works only because (f) keeps the edit dirty across a wide window. QCLI-53's own
description floats discarding "immediately after (f)'s diff-confirmation step" —
which collapses the window to near-zero and degrades signal #1 to "usually
absent." **QCLI-53's AC#4 checks only for a contradicting discard *deadline*, not
for downstream signals depending on the discard *window*, so the regression would
not be caught.**

The coupling is pre-existing (QCLI-51 wrote signal #1; QCLI-52 left it
byte-identical) — a forward risk, not a defect in what merged. Best handled by
**extending QCLI-53's acceptance criteria**, since the tradeoff must be weighed
while choosing the disposition rather than audited afterward.

Proposed additional ACs for QCLI-53: (1) the chosen timing states its effect on
R2 step 5's first signal — whether the window stays wide enough to observe the
label, and if not, that the loss is named and accepted; (2) if the window shrinks
materially, signal #1 is reworded so it promises no classification power the
mechanics no longer provide; (3) no passage is left asserting the
`in-review`/`merge-pending` distinction is observable in a dirty diff if the
settled timing makes that unreliable.

### Narrow bundle — three single-sentence corrections in SKILL.md R2 step 5

Non-behavioral, none touching `reference/`: (a) "Five … exist" → note that five
match the phrase-keyed enumeration while a content-based sweep finds six
(`3107d3a`, also stage 1), and drop the circular "every recording commit found
here uses it consistently" clause; (b) add that `0b63077` was written by the
*recovering* session with a fully disclosing annotation, and doc-10's settled text
calls the mechanism "working exactly as designed" — so the defect is the free-text
numeral, not the signal; (c) "the one substate record" → "the one *review*-substate
record."

The integration reviewer recommends bundling these into Proposal A rather than
doing them now, since (a) and (b) edit the same paragraph Proposal A's AC#5 would
revisit.

### Wave 2 proposals — unfiled, awaiting user approval

**1. Push the orchestrator's `<default>` bookkeeping commits, and fix (g) step 5's
failed-fast-forward diagnosis.** *(the sharpest finding of this campaign)*

Wave 2 hit a reproducible loop failure at (g) step 5: `git pull --ff-only origin
dev` → "Diverging branches can't be fast-forwarded." (d) step 4 mandates
committing the dispatch-marking pass on `<default>` and says nothing about
pushing it; (d) step 5 then re-pins the worktree onto it, so it reaches `origin`
via the branch push but never `origin/<default>`. GitHub counted `e532f22` as PR
#69's first commit and the squash folded its content into `ed3959b`, whose parent
is `626f369` — making local and remote `dev` siblings rather than fast-forwardable.

Verified a gap in the procedure, not a misexecution: `wave-loop.md:87` explicitly
contemplates the unpushed state. The false assertion is at `wave-loop.md:167`
("already an ancestor of `origin/<default>`"), false for every wave until the next
`<default>` push — wave 1 satisfied it only incidentally. **(g) step 5's own
diagnosis names the wrong cause**, blaming the clean-checkout precondition, which
was satisfied throughout; working-tree cleanliness cannot produce a topology error.

Scope covers **two** commit types: the dispatch-marking commit and the in-flight
pointer commit both land between the wave base and (g)'s walk. Settlement and
docs-sync commits are unaffected — they run after (g), and (i) step 3 pushes.

At wave size 1 the blast radius was one halted pull. At size > 1 the walk halts at
the first member with the rest rebased, pushed, and unmerged — a state
`escalation.md` does not cover. Nine drafted ACs cover: the push decision and its
no-remote path; the same decision for the in-flight commit; what to do when the
push is rejected; correcting (g) step 2's ancestor claim; correcting (g) step 5's
diagnosis; a documented recovery including the no-content-lost check *before* any
history-discarding command; an `escalation.md` row; Provenance; and citing this
wave as worked evidence (`e532f22`, `ed3959b`, PR #69, against wave 1's clean
`fe0e46f`/`82fca71`, PR #68, `d652126`).

**2. Define or retire `merge-blocked` in (g)'s walk-start gate.**

`wave-loop.md:163` gates the walk on "every member reached approve /
merge-blocked / escalated". `merge-blocked` is undefined — (f)'s verdict enum is
`approve`/`request_changes`/`escalate`, `escalation.md`'s dispositions are
`reviewer_decided`/`human_needed`, and a repo-wide grep returns exactly one hit:
that line. QCLI-53 raised the stakes, since (f) step 4 and (g)'s precondition now
both cite that sentence as the by-construction guarantee.

**3. Amend QCLI-54 (no new task).** Add an AC reconciling R2 step 5's internal
signal count: wave 1 added a fourth signal and closes with "none of these **four**
signals", while wave 2 inserted "corroborate … from **the two signals below**"
three clauses before naming a third. Either the count is wrong or signal #4 is
silently excluded from corroboration with no reason given — the one genuine
cross-wave composition slip, and exactly the class only a wave-level pass sees.
Also add a routing sentence: QCLI-54 AC#6 locates its three corrections in "R2
step 5", but one target lives inside QCLI-52's dated Provenance entry, where
CLAUDE.md's record-vs-current-assertion test and the QCLI-44 citation ruling apply.

**4. Amend QCLI-55 (no new task).** Its description quotes "(f) step 4's discard
deadline ('before that branch's rebase')" — wording QCLI-53 superseded, so a
worker grepping for it will find only the citation of the old text. Its AC#1
target is unaffected. AC#4's point is already partly recorded for doc-12 in
QCLI-53's Provenance, so the write should reference rather than duplicate it.

## Wave log

### Wave 1 — QCLI-52 — merged `d652126` (PR #68), settled 2026-08-08

Size 1, as predicted by the Conflict note. Base `1e268f7`.

Worker implemented; mandatory review returned **`request_changes`** (three
blocking findings), a fresh worker ran fix pass 1, review pass 2 returned
**`approve`** with all five ACs independently confirmed. Two of three review
passes used; the fix-cycle budget was not exhausted.

**The blocking finding worth remembering.** The first implementation added a rule
reading a recorded `Stage reached` of 6 as durable proof of approval. The only
stage-6 record in this repo's history — `0b63077` — records `6 — under review`
for a branch whose session died *before* the review gate ran. That rule would
have handed an unreviewed branch to the merge queue, violating SKILL.md's own
mandatory review gate. It rested on a false claim that only two
in-flight-pointer-recording commits exist; five do by phrase-keyed enumeration
and six by a content-based one. The orchestrator verified the counterexample
independently before dispatching the fix rather than taking the reviewer's word.

**First exercise of `merge-pending`'s point of action.** `reference/wave-loop.md`
(f) records that `merge-pending`'s step-2 edit "has not yet been separately
exercised in a recorded wave." **This wave exercised it**: `in-review` applied at
review dispatch, transitioned to `merge-pending` on the `approve` verdict, both
left uncommitted and discarded before the rebase, the real label set
reconstructed at settlement. Confirmed on the merged result — QCLI-52's task file
on `dev` carries neither label, and no committed task frontmatter in the repo
carries either. That is QCLI-51's durability claim confirmed empirically for the
first time under a `merge-pending` transition. This entry is what makes the
(f) Evidence paragraph's "not yet exercised" wording false — see Proposal B.

**This wave supplies no evidence toward QCLI-53.** At size 1, (f) step 4's
discard deadline ("before that branch's rebase") and (g)'s precondition ("clean
before the walk starts") collapse onto the same instant. A later session must not
mistake this clean run for a worked case discriminating the two readings —
QCLI-53 derives its disposition from the text, per its own AC#2.

Also of note: the retry path worked correctly without being documented — (f)
fires step 2 only on `approve`, so `in-review` correctly persisted across the fix
pass. Integration review verdict: `findings` (0 blocking, 2 major, 3 minor,
1 nit), all recorded as proposals above; nothing merged needs reverting.

### Wave 2 — QCLI-53 — merged `ed3959b` (PR #69), settled 2026-08-08

Size 1, as predicted. Base `626f369`. Acceptance criteria #6–#8 were added before
dispatch, with the user's explicit approval, from wave 1's integration finding.

Review returned **`request_changes`** with an unusual shape — all eight criteria
confirmed *on substance*, the rejection resting on the evidence record: the notes
claimed a sweep produced "36 total hits", reproducing under no variant (actual
14/16 lines, 22/25 occurrences, 17/27 recursive) and traceable to QCLI-48's
unrelated figure, while the shipped Provenance entry delegates its evidentiary
weight to those notes. A third defect was substantive: (f)'s escalate limb named
an instant at reviewer *dispatch*, literally directing a discard before the
verdict and contradicting the same commit's `SKILL.md:159`. Fix pass 1 reproduced
every figure independently and corrected in preserve-and-amend form; pass 2
returned **`approve`**, all eight confirmed at tip.

The orchestrator dispatched that fix rather than settling on the all-confirmed
verdict, on the ground that this campaign had already returned `request_changes`
on QCLI-52 for the same false-count class — settling here would have applied a
weaker standard to the second task than the first.

**What the task uncovered beyond its own framing.** It was filed as a wording
mismatch. The worker found, and the reviewer independently confirmed, a real hole:
(g) walks `approve` branches only, so an escalated branch never reaches a rebase
step and the old discard trigger never fired at all — its dirty `in-review` diff
would sit through the entire merge walk, since (i) runs after (h) runs after (g).

**A defect in the loop itself fired during this wave's merge** — see wave-2
proposal 1. `git pull --ff-only` failed on diverged history because (d) step 4
commits the dispatch-marking pass without pushing it. No content was lost;
recovery was verified safe before running. Wave 1 escaped the same fate only
incidentally.

### Campaign complete — 2026-08-08

Both queued tasks resolved across two waves of one task each, exactly the shape
the Conflict note predicted at init. Two review gates fired `request_changes`
before approving — one on an unsafe rule, one on a false figure in an evidence
record — and in both cases the orchestrator verified the reviewer's central claim
independently before dispatching a fix rather than acting on the report alone.

Per this project's rules, no task was archived and no follow-up was filed without
explicit approval. Wave 1's approved proposals became QCLI-54 and QCLI-55; wave
2's four proposals above remain unfiled.
