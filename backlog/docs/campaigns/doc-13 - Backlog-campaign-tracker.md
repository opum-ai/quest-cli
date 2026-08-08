---
id: doc-13
title: Backlog campaign tracker
type: other
created_date: '2026-08-08 14:59'
updated_date: '2026-08-08 16:53'
---
# Backlog campaign tracker

Protocol: restore -> recompute the ready/conflict graph from Backlog -> acquire
worktrees -> mark the acquired members dispatched -> implement + review in
parallel -> serialize the merge -> settle tasks and write this doc once more ->
loop until the queue is empty or blocked -> write handover.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of doc-13
wave-1 settlement (2026-08-08), **1 queued (QCLI-53), 0 in flight, 0 blocked,
0 needs-human**.

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
is filed. Each entry is a ready-to-run proposal.

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
