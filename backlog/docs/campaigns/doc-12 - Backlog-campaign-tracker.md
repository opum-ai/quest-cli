---
id: doc-12
title: Backlog campaign tracker
type: other
created_date: '2026-08-08 13:46'
updated_date: '2026-08-08 14:44'
---
# Backlog campaign tracker

Protocol: restore -> recompute the ready/conflict graph from Backlog -> acquire
worktrees -> mark the acquired members dispatched -> implement + review in
parallel -> serialize the merge -> settle tasks and write this doc once more ->
loop until the queue is empty or blocked -> write handover.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan.

**CAMPAIGN COMPLETE as of 2026-08-08.** Queue empty: **70 tasks, all 70 `Done`**,
0 in flight, 0 blocked, 0 needs-human, 0 ready. Wave 1 resolved the single
queued task (QCLI-51) and no further wave was dispatched.

It ran as the predicted one-task campaign: wave 1 had a single member, which is
the wave builder correctly degrading to sequential, not a defect. Two follow-up
proposals surfaced by the wave-level integration review are recorded below,
**unfiled**, awaiting the user's approval.

## Origin of this campaign

Seeded 2026-08-08 from doc-11's single unfiled proposed follow-up — the
`merge-pending` gap that QCLI-49's worker surfaced as an out-of-scope discovery
during doc-11 wave 3 and correctly left alone there.

Init ran as a standalone `/backlog-handover init`, not inline during a restore.
I1 ground truth: **69 tasks, all 69 `Done`** — the queue was genuinely empty, 0
drafts, so the only candidate work was doc-11's unfiled proposal. `dev` clean at
`b2ad797` and in sync with `origin/dev`; zero campaign branches local or remote;
zero open PRs; all six treehouse pool slots `available` with zero leases;
`.claude/handovers/` empty (doc-11 closed correctly under the campaign-complete
rule, archiving its final handover with no successor). `.gitignore` already
carries `.claude/handovers/` and `archive/handovers/` already exists, so I3's
one-time gitignore setup was a no-op and produced no commit. Nothing to
reconcile.

### Verification that changed what got filed

Following doc-11's own precedent, the inherited proposal was re-verified against
the working tree at `b2ad797` rather than taken on the campaign doc's word. The
check corrected doc-11's framing in **two** ways, and both corrections are
written into QCLI-51's description so they travel with the task:

- **"No step anywhere adds it" is wrong.** An add instruction *does* exist, at
  `reference/wave-loop.md:130`: `--add-label in-review`, "and later
  `merge-pending`". What is actually missing is a **point of action** — "later"
  names no step, and section (g)'s eight-step merge walk never mentions it.
- **The finding is not scoped to `merge-pending`.** `in-review` sits in exactly
  the same position: (f) steps 3-4 write it to the working tree, leave it
  uncommitted, and discard it before the branch's rebase; line 222 says these
  labels "are deliberately never committed at all"; settlement (i) removes both
  at lines 195 and 200. **Two** rows of SKILL.md's stage-state table describe
  states that can never appear in committed Backlog state, not one.

The second correction is what made the owner's broader ruling the one that
matches reality — a fix scoped to `merge-pending` alone would have left the
identical defect standing in the adjacent row.

## Owner ruling obtained at init

QCLI-51 was **not dispatchable as filed** — its disposition turns on a
convention question only the owner can settle. Following doc-10's and doc-11's
precedent (both obtained blocking rulings at init rather than labelling the task
`needs-human`), the ruling was taken up front, before dispatch. It is recorded
verbatim in QCLI-51's own description as well as here.

**Ruling (2026-08-08) — QCLI-51: broader, reconcile the whole table.** The fix
is not to settle `merge-pending` in isolation. SKILL.md's stage-state table must
distinguish stages durably recorded in committed Backlog state from those
existing only as uncommitted working-tree edits, covering `in-review` as well as
`merge-pending`, and R2's crash-recovery consequence must be addressed directly
rather than left as an implication for a reader to derive.

Three narrower alternatives were offered and **not** taken, recorded here so a
later reader does not re-propose one as an improvement: treating `merge-pending`
as vestigial and deleting the row; giving it a point of action in (g) at the
cost of a write-then-discard ceremony; and leaving the disposition for the
worker to derive (rejected on this campaign's own precedent that convention
calls stall mid-wave without an owner ruling).

## Confirmed queue order

Confirmed by the user on 2026-08-08. With a single queued task there is no
ordering decision to make; the entry is recorded for form, and the note below
still governs.

1. QCLI-51 — Reconcile the campaign stage-state table with the never-committed
   reality of `in-review` and `merge-pending`

This is the wave-builder's tie-break, NOT a guarantee that any task lands in any
particular wave.

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:campaign-machinery | The `backlog-handover` skill's own lifecycle, commit, and settlement contract | QCLI-51 |

QCLI-51 touches only `.claude/skills/backlog-handover/` and never `docs/`, so it
carries no `lore` gate exposure of its own beyond the per-wave settlement sync.
No dependencies recorded — there is nothing for it to depend on.

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(clean — wave 1 settled. QCLI-51 merged as `79545d6`, worktree returned to the
pool, branch deleted local and remote, 6/6 slots `available`, zero leases.)

## Needs a human / blocked

(none — QCLI-51's only blocking question was settled by the init ruling above,
and it is fully dispatchable.)

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed.

Two proposals from wave 1's integration review (h), 2026-08-08. **Both were
approved by the user at R6 and filed** — Proposal A as **QCLI-52** (medium),
Proposal B as **QCLI-53** (low), each carrying five acceptance criteria and no
implementation plan (per `backlog instructions task-creation`: creation captures
durable intent; the worker researches and records the plan at pickup). They are
retained below as the record of what was proposed and why. Both are `minor`,
neither is a defect in QCLI-51's merged diff, and neither blocks anything. The reviewer recommended this exact split — they divide
along a real seam (documentation legibility in `SKILL.md` vs. mechanics timing in
`wave-loop.md`), and folding them together would blur the two axes.

**Proposal A — finish the stage-state legibility sweep QCLI-51 started.**
Two passages still describe where campaign substate is legible without
accounting for what is actually committed:

- `SKILL.md`'s "Stage state" convention row ("Status carries the coarse state,
  labels carry the sub-stage") asserts the pre-QCLI-51 framing unqualified, and
  sits ~15 lines upstream of the table that now corrects it — so a cold reader
  forms the impression QCLI-51 was chartered to remove before reaching the fix.
- R2 step 5's list of durable signals omits the campaign doc's **in-flight
  table** — the one substate record this campaign commits on purpose
  (`reference/templates.md`; `wave-loop.md`'s scope note says it "is always
  committed immediately"; `68ce681` in this very wave is a worked example). The
  enumeration reads as exhaustive and is not.

Both are one-sentence fixes in the same file. **Method note for whoever picks
this up:** QCLI-51's own AC#5 sweep could not have caught either, because it
grepped `in-review`/`merge-pending` and neither passage contains those strings.
The sweep was correct within its stated method — a next sweep should not be
scoped the same way.

**Proposal B — settle the discard-timing looseness between (f) and (g).**
`wave-loop.md` (f) discards the accumulated label edit "before that task's branch
reaches (g)'s **rebase step**," while (g)'s precondition demands a clean checkout
"before this **walk starts**" and re-checks at step 0. Reconcilable in practice
(discarding right after (f)'s confirm satisfies both) and inherited verbatim from
QCLI-49's `in-review` wording — but `merge-pending`'s new edit sits closer to (g)
than the first did, so the looseness is now easier to trip over. Pre-existing
QCLI-49 debt, not introduced by QCLI-51.

## Standing guidance carried forward from doc-11

Not re-derived each session; recorded here because it cost doc-11 real dispatch
budget to learn.

- **Subagent return-path failures are expected, and re-dispatching is the wrong
  response.** Across doc-11's sessions, six worker/reviewer returns went missing
  while the underlying work had in several cases completed *and pushed*. The
  reliable procedure is: **never re-dispatch on a missing return — verify the
  worktree's own git state and review from that.** Four dispatches were burned
  on this before the pattern was recognized; none were wasted after.
- **The review gate is mandatory even when dispatch fails.** doc-11 ran reviews
  in the skill's degraded mode — an explicit in-session adversarial pass that
  independently re-derived every claim rather than replaying the worker's
  self-report. That pass caught defects the workers' self-reports missed.
- **Wave-level integration review earns its keep even on small waves.** doc-11
  wave 3's caught a real cross-file contradiction (SKILL.md's `Commits` row
  contradicting the `wave-loop.md` table it points at) that was structurally
  invisible to both single-task reviews. On a one-task wave this pass degenerates
  toward the single-task review, but the cumulative-diff check against the wave
  base is still run.
- **`lore` gates cannot catch a wrong prose cross-reference.** doc-11 wave 3's
  single `request_changes` cycle was a locator pointing at the wrong block;
  both `lore` gates passed on the defective version. Review is the only thing
  that catches this class, and QCLI-51 is locator-heavy by nature.

## Wave log

- 2026-08-08 — **campaign init (doc-12), standalone `/backlog-handover init`.**
  I1 found the queue **empty**: 69 tasks, 69 `Done`, 0 drafts. `dev` clean at
  `b2ad797`, in sync with `origin/dev`; 6/6 treehouse slots `available` with
  zero leases; zero campaign branches (local or remote); zero open PRs; no
  active handover; `.gitignore` and `archive/handovers/` already in place.
  Nothing to reconcile.

  doc-11's single unfiled proposal was re-verified against the working tree
  before filing, which corrected its framing in two ways (see "Verification that
  changed what got filed" — an add instruction does exist, and `in-review` is
  equally affected). Approved by the owner and filed as **QCLI-51** with
  `campaign` and `cluster:campaign-machinery` labels, six acceptance criteria,
  and the init ruling recorded verbatim in its description. The owner's broader
  disposition was obtained before dispatch, so the task enters wave 1 with no
  open convention question.

- 2026-08-08 — **wave 1 (single member: QCLI-51). Merged, settled, campaign
  complete.** Restore found zero drift: `dev` clean at `8f55c56`, no branches,
  no worktrees, no PRs, 6/6 slots free — exactly as the handover predicted. R3's
  mandatory `lore sync` found the expected one-commit lag (doc-11's own wave-3
  settlement commit `ceab348`), gated it with `lore check --strict` (47 files, 0
  errors, 0 warnings), and committed it as `10a4293`, which became the wave base.

  Dispatch marking committed as `d0c3d06`, worktree re-pinned onto it, in-flight
  pointer recorded as `68ce681`. Worker implemented in one commit; review pass 1
  returned **`request_changes`** on a blocker — R2 step 5 attributed the `git
  log` check to step 2 (enumeration only) when step 4 prescribes it, precisely
  the wrong-prose-cross-reference class doc-11 warned about and that both `lore`
  gates pass on. A fresh worker fixed it in a two-character word-diff; pass 2
  returned **`approve`** with all six ACs confirmed against named file+line
  evidence. Merged as `79545d6` (PR #67).

  Three operational notes worth carrying forward. (1) `origin/dev` was stale at
  the merge queue because the in-flight pointer commit was local-only — the first
  rebase reported "up to date" against a base two commits behind; pushing `dev`
  first made the rebase target real. (2) The squash body was hand-authored: the
  branch carried two commits each ending in their own `Refs:` line, exactly
  QCLI-48's unparseable shape had it been generated. (3) `--delete-branch` failed
  because the worktree still held the branch — the documented ordering, not a
  fault; release the worktree first.

  Both subagent return paths misfired again, as doc-11 predicted: the worker's
  return and the reviewer's pass-1 verdict each arrived late or not at all. Neither
  was re-dispatched — the worker's work was verified from the worktree's own git
  state, and the reviewer was re-queried by message with its context intact. Zero
  dispatches wasted.

  Integration review (h) confirmed the merged files byte-identical to the approved
  branch tip and reviewed the orchestrator's own two bookkeeping commits — their
  first review — finding both correctly scoped. It surfaced the two unfiled
  proposals above.
