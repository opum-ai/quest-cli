---
id: doc-12
title: Backlog campaign tracker
type: other
created_date: '2026-08-08 13:46'
updated_date: '2026-08-08 13:47'
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

Informational hint only: as of init on 2026-08-08, **1 ready** (QCLI-51), 0
blocked, 0 in flight, 0 needs-human. 70 tasks total, 69 `Done`.

**This is a one-task campaign.** Wave 1 is expected to be a single member, which
is the wave builder correctly degrading to sequential, not a defect. It is
expected to be the only wave unless the integration review surfaces approved
follow-up work.

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

(clean — campaign initialized, nothing dispatched yet, 6/6 pool slots available)

## Needs a human / blocked

(none — QCLI-51's only blocking question was settled by the init ruling above,
and it is fully dispatchable.)

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed.

(none yet — doc-11's single outstanding proposal was approved at this init and
filed as QCLI-51, clearing the inherited backlog of proposals to zero.)

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
