---
id: doc-11
title: Backlog campaign tracker
type: other
created_date: '2026-08-07 18:52'
updated_date: '2026-08-07 18:53'
---
# Backlog campaign tracker

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of
2026-08-07 at init, 2 ready (QCLI-45, QCLI-47), 1 blocked on a dependency
(QCLI-46, waiting on QCLI-45), 0 needs-human, 0 Done.

## Origin of this campaign

Seeded 2026-08-07 from doc-10's three proposed follow-ups, all approved by the
owner at this init. Each was re-verified against the working tree before
filing rather than taken on the doc's word — one of the three needed its
framing corrected as a result (see QCLI-47 below).

Init ran as a standalone `/backlog-handover init`, not inline during a restore.
I1 ground truth: 63 tasks, **all 63 Done** — the queue was genuinely empty, so
there was nothing to inventory in the ordinary sense and the only candidate
work was doc-10's unfiled proposals. `dev` clean at `342e76d` and in sync with
`origin/dev`; zero campaign branches local or remote; zero open PRs; all six
treehouse pool slots available with zero leases; `.claude/handovers/` empty
(doc-10 closed correctly under the campaign-complete rule, archiving its final
handover with no successor). Nothing to reconcile.

### Verification that changed what got filed

- **QCLI-46 (supersession debt).** doc-10 named three outstanding sites;
  QCLI-44's own final inventory names **one** and does not list
  `quest-cli-backlog-migration-fidelity-contract.md` at all. Checked at init:
  that file's line 561 marker ("**Review-round fix (2026-08-04).**") carries no
  `QCLI-` id within ±50 lines and *is* non-conformant. So QCLI-44's first-pass
  "~30+" figure and its corrected "1 site" figure are **both** wrong, in
  opposite directions, and two independent sweeps have each missed a site the
  other found. QCLI-46 is therefore written to **re-derive** the set rather
  than inherit any count — that is AC #1, not an implementation detail.
- **QCLI-47 (Refs trailers).** doc-10 framed this as bookkeeping commits
  "routinely lacking" the trailer. Checked at init: practice is *inconsistent*,
  not uniformly absent. `8721feb`, `146956d`, `9c63769`, `d0b5f41`, `3686859`,
  `34bceae`, `8caae19`, `748bf5f`, `6047774` have an empty
  `%(trailers:key=Refs)`; `0b63077` and `342e76d` both carry `Refs: QCLI-43`.
  Single-task commits get the trailer, campaign-scoped ones do not — which is
  what made the hybrid ruling the one that matches reality.

## Owner rulings obtained at init

Two of the three tasks were **not dispatchable as filed** — each turned on a
convention question only the owner can settle. Following doc-10's precedent
(which obtained QCLI-44's blocking ruling at init rather than labelling it
`needs-human`), both rulings were taken up front. Each is recorded verbatim in
its own task's description so it travels with the task rather than living only
here.

**Ruling 1 (2026-08-07) — QCLI-45: preserve-and-amend governs evidence
records.** The record's own stronger methodology wins over CLAUDE.md's general
correct-in-place branch. QCLI-42 should have appended a dated amendment rather
than deleting and re-tensing QCLI-41's paragraph.

Owner's rationale: the document's stated value is fidelity to what was read on
a given date, so deleting the prior reading destroys the thing the record
exists to hold. Preserve-and-amend still stops the stale sentence misleading a
reader — it is marked superseded rather than left to read as current — so the
correct-in-place branch's concern is met without the loss.

**Ruling 2 (2026-08-07) — QCLI-47: hybrid.** Emit `Refs: QCLI-<N>` on
bookkeeping commits that have a single directing task, and document an
exception in SKILL.md for genuinely campaign-scoped commits (init, close,
gitignore) that have none.

Owner's rationale: it matches what the evidence already shows the orchestrator
doing correctly, and preserves the traceability the recent single-task commits
provide rather than discarding it to make the rule simpler.

## Confirmed queue order

Confirmed by the user on 2026-08-07 (**ruling-first**). This is the
wave-builder's tie-break, NOT a guarantee that any task lands in any
particular wave.

1. QCLI-45 — Record the evidence-record amendment ruling and reconcile
   QCLI-42's in-place replacement
2. QCLI-46 — Re-derive and reconcile the outstanding inline
   supersession-citation debt across `docs/`
3. QCLI-47 — Reconcile the `Refs:` trailer convention with campaign
   bookkeeping practice (parallel-eligible with either of the above)

Rationale for this order (owner-selected): QCLI-45's ruling governs *how*
`quest-cli-activation-gate-evidence-record.md` may be amended, and QCLI-46
amends that same file. Ruling-first avoids QCLI-46 amending in a style QCLI-45
then overturns. The reverse order would require re-doing QCLI-46's work on
that file.

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:supersession-convention | Which convention governs inline amendments to `docs/`, and the outstanding citation debt against it | QCLI-45, QCLI-46 |
| cluster:campaign-machinery | The `backlog-handover` skill's own commit and settlement contract | QCLI-47 |

**QCLI-45 and QCLI-46 conflict and must serialize** — hard-encoded as a native
Backlog dependency (`QCLI-46 --dep QCLI-45`), not left to the wave builder's
file-overlap heuristic. Both touch
`docs/reference/quest-cli-activation-gate-evidence-record.md`, and the
dependency is semantic as well as file-level: QCLI-45 decides the rule QCLI-46
applies.

**QCLI-47 is disjoint from both** — it touches only
`.claude/skills/backlog-handover/` and never `docs/`. It is genuinely
parallel-eligible, so the first wave can legitimately be QCLI-45 + QCLI-47
together.

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(clean — campaign initialized, no wave dispatched yet)

## Needs a human / blocked

(none — both blocking rulings were obtained at init, see above. QCLI-46 is
dependency-blocked on QCLI-45, which is an ordinary graph edge, not a
needs-human condition.)

**One in-task escalation is expected, not a blocker:** QCLI-46's AC #4 requires
an owner disposition on commit `a4ae6c5`, which has no directing task to cite
at all. That surfaces at the session report; the task is dispatchable in the
meantime because everything else in its scope proceeds without it.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed. Each entry is a ready-to-run proposal.

(none yet — this campaign has run no waves)

## Wave log

- 2026-08-07 — campaign init (doc-11), standalone `/backlog-handover init`.
  I1 found the queue **empty**: 63 tasks, 63 Done, 0 drafts. `dev` clean at
  `342e76d` in sync with `origin/dev`, 6/6 treehouse slots available with zero
  leases, zero campaign branches (local or remote), zero open PRs, no active
  handover. All three of doc-10's proposed follow-ups were re-verified against
  the working tree, two had their framing corrected by that check (see
  "Verification that changed what got filed"), and all three were approved by
  the owner and filed as QCLI-45, QCLI-46, QCLI-47 with `campaign` and
  `cluster:*` labels. Obtained the two owner rulings QCLI-45 and QCLI-47
  required before dispatch (see above). `QCLI-46 --dep QCLI-45` recorded
  natively.
