---
id: doc-11
title: Backlog campaign tracker
type: other
created_date: '2026-08-07 18:52'
updated_date: '2026-08-07 20:20'
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

(clean — wave 1 fully settled, both worktrees returned to the pool, both
branches deleted local and remote, 6/6 pool slots available)

## Needs a human / blocked

**QCLI-46's AC #4 needs an owner disposition before that task can reach
`Done`.** Commit `a4ae6c5` ("docs: flag the superseded tail of the quoted gate
predicate") amended `docs/reference/quest-cli-activation-gate-evidence-record.md`
with **no directing task at all** — no trailer on the commit, and no task file
in `backlog/` references it. QCLI-44 confirmed this by exhausting the task
store. CLAUDE.md's QCLI-44 ruling requires every inline supersession amendment
to cite its directing task, and this one has none to cite. AC #4 requires a
*recorded owner disposition*, explicitly not an invented or inferred citation.
The task is otherwise dispatchable — every other site in its sweep proceeds
without this answer — but it cannot be settled until the owner rules.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed. Each entry is a ready-to-run proposal.

**1. Fix the squash-merge trailer-loss vector.** Discovered during QCLI-47's
review and confirmed to predate it. A `Refs: QCLI-<N>` line separated from the
final trailer block by a blank line is **not** parsed by git as a trailer:
`git interpret-trailers --parse` returns only the `Co-Authored-By:` block. This
silently defeats the `%(trailers:key=Refs)` measurement QCLI-47's own evidence
depends on. Confirmed on QCLI-47's branch commit `6f3236f` (fixed at merge by
authoring the squash message) **and on the already-merged QCLI-43 squash commit
`7efc1a4`**, which carries no parseable trailer on `dev` today. Proposed scope:
sweep `dev` for merged commits whose message text contains `Refs:` but whose
parsed trailers do not; decide whether the existing ones are left as recorded
history or noted; and add an explicit "the trailer must be in the final trailer
block, verified with `git interpret-trailers --parse`" instruction to the
backlog-handover skill so future squash messages cannot reintroduce it.
*Acceptance criteria would include:* the sweep is run and its result recorded;
the skill states the placement rule and the verification command; a worked
example shows a correct and an incorrect message.

**2. Give the orchestrator's dispatch-marking writes a defined commit step.**
Reported by QCLI-47's worker as out-of-scope, then hit for real during this
wave's merge queue. With `backlog/config.yml` setting `auto_commit: false`,
`backlog task edit ... --add-label wave-<N>` leaves the task file dirty in
whichever checkout ran it. The orchestrator runs those edits on `dev` while
each worker commits its *own* copy of the same file in its worktree, so the two
diverge and collide at merge — which is what blocked the QCLI-45 rebase this
session ("cannot rebase: You have unstaged changes"). `reference/wave-loop.md`
sections d and i never say to commit the dispatch-marking write. Proposed
scope: define whether dispatch/in-flight label writes are committed (and by
whom, on which ref) or deliberately left uncommitted and discarded at
settlement, and state it in the skill. *Acceptance criteria would include:* the
rule is stated at the point of action in section d; the merge queue's
precondition ("the orchestrator's checkout is clean before rebasing any
member") is explicit; and the interaction with the worker's own committed copy
of the task file is described.

**3. Decide whether QCLI-42's re-tensed clause is also owed restoration.**
Raised as a minor finding in QCLI-45's review and deliberately not acted on.
Alongside deleting the gate-result paragraph, QCLI-42 re-tensed a clause in the
preceding paragraph — "the Spec **now reports** items 2, 3, and 4" became "the
Spec **reported** items 2, 3, and 4". QCLI-45 restored the deleted paragraph
but not this. The reviewer judged it outside AC #2 because no dated reading was
destroyed — the recorded fact survives intact, so there is nothing to mark
superseded. But the ruling QCLI-45 itself wrote into CLAUDE.md names "deleting
**or re-tensing**", so the two can be read as in tension. *Acceptance criteria
would include:* an owner decision recorded on whether tense-only edits fall
under preserve-and-amend, and CLAUDE.md's wording reconciled with that answer.

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

- 2026-08-07 — **wave 1: QCLI-45 + QCLI-47, both merged and settled `Done`.**
  Wave base pinned at `f955033`. Ran in parallel from disjoint clusters with
  zero file overlap (verified after the fact against the cumulative diff), so
  the conflict graph held exactly as computed.

  **R3 was not a no-op.** `lore sync` at restore found `docs/log.md` missing an
  entry for `a4f6212` — doc-10's own wave-2 settlement docs commit, which by
  construction cannot appear in the log entry it generates. This is the
  documented one-commit lag, not drift. Gated with `lore check --strict`
  (47 files, 0 errors, 0 warnings) and committed as `f955033`, which then
  became the wave base.

  - **QCLI-45** → merged `866b184` (PR #60). Ruling recorded in CLAUDE.md
    (dated, citing QCLI-45, inserted after the QCLI-44 ruling without touching
    it); the gate-result paragraph QCLI-42 deleted restored byte-verbatim as
    blockquoted preserved-and-superseded text. Zero deletion lines across
    `CLAUDE.md` and `docs/`. All 4 ACs confirmed.
  - **QCLI-47** → merged `694e109` (PR #61), rebased onto `866b184` and
    re-verified before merge. Hybrid trailer rule in SKILL.md with both
    exceptions named, per-commit-type table added to `wave-loop.md` section i,
    skill bumped to `0.9.1-qcli.3`. All 4 ACs confirmed.

  **Review ran in the skill's degraded mode, and this is the wave's most
  important process note.** Four dispatched reviewer subagents (two initial,
  two re-dispatched with an explicit return-shape instruction) all terminated
  without delivering a verdict — the subagent return path was broken in this
  session, not the reviews. Because the review gate is mandatory and cannot be
  skipped, the orchestrator ran it in-session as an explicit adversarial pass
  against each branch: re-running both `lore` gates itself, byte-comparing
  QCLI-45's restoration against `git show 3b1e9f5`, and running its own
  absolutist-claim sweep for QCLI-47 rather than replaying the worker's. That
  pass caught the trailer defect the worker's own self-report had missed.

  Two real defects found and both surfaced as proposed follow-ups above: the
  squash-merge trailer-loss vector (which also affects the already-merged
  `7efc1a4`), and the uncommitted dispatch-marking writes that collided at
  rebase time.
