---
id: doc-11
title: Backlog campaign tracker
type: other
created_date: '2026-08-07 18:52'
updated_date: '2026-08-08 01:50'
---
# Backlog campaign tracker

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Frontier

**CAMPAIGN COMPLETE — 2026-08-07.** Queue empty: **69 tasks, all 69 `Done`**,
0 in flight, 0 blocked, 0 needs-human. All six of this campaign's tasks
(QCLI-45..QCLI-50) merged and settled across three waves. Nothing is left to
recompute; a future restore should report completion and suggest `init` for a
fresh queue. Do **not** archive the tasks themselves.

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

(clean — wave 2 fully settled, both worktrees returned to the pool, both
branches deleted local and remote, 6/6 pool slots available)

## Needs a human / blocked

**(none — resolved 2026-08-07 at the wave-1 report.)** QCLI-46's AC #4 blocker
is settled: the owner ruled that commit `a4ae6c5` is to be **recorded as
explicitly uncitable** — a dated note stating no directing task exists, citing
`QCLI-46` as the task that *recorded* the gap and explicitly not as the
amendment's author. No citation is to be invented, inferred, or manufactured
via a retroactive task. The ruling is recorded verbatim in QCLI-46's own
description so it travels with the task. **QCLI-46 is now fully dispatchable
and settleable.**

## Proposed follow-ups

Never created unprompted — this project requires owner approval before
follow-up work is filed.

**Filed earlier this campaign** (approved at the wave-1 report): QCLI-48,
QCLI-49, QCLI-50 — all three now `Done`.

**Awaiting owner approval (from wave 3, NOT filed):**

- From QCLI-49's worker, as an out-of-scope discovery; independently verified
  by the orchestrator via `grep -rn 'merge-pending' .claude/skills/backlog-handover/`:
  **The skill never states where the `merge-pending` label is first applied.**
  It appears in SKILL.md's campaign-stage state table as a lifecycle stage, and
  in `reference/wave-loop.md` only as something discarded (section f) or removed
  at settlement (section i) — no step anywhere adds it. So a stage the state
  table treats as real is never entered by any documented action.
  Pre-existing; unrelated to QCLI-49's commit-policy scope, which is why it was
  correctly left alone rather than fixed opportunistically.
  Proposed ACs: the skill states at the point of action where `merge-pending` is
  applied (or that the stage is vestigial and should be removed from the state
  table); the answer is consistent with QCLI-49's rule that mid-wave task-file
  label edits are never committed on `<default>` while the branch is unmerged.

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

- 2026-08-07 — **post-wave-1 owner rulings and follow-up filing.** All three
  wave-1 proposals approved and filed as `QCLI-48`, `QCLI-49`, `QCLI-50` with
  `campaign` and `cluster:*` labels. QCLI-46's `a4ae6c5` blocker settled by
  owner ruling (record as explicitly uncitable) and written into QCLI-46's
  description. Queue at handover: **4 To Do** (QCLI-46, 48, 49, 50), 0 In
  Progress, 65 Done, 0 needs-human.

- 2026-08-07 — **wave 2: QCLI-46 + QCLI-48, both merged and settled `Done`.**
  Wave base pinned at `fe92535`. One task from each cluster, the maximum legal
  wave size here since both clusters hold exactly two tasks. Verified after the
  fact that the two tasks' file sets are **disjoint (empty intersection)**, so
  the conflict graph held exactly as computed.

  **A pending owner decision was found that the wave-1 handover had recorded as
  absent.** The handover stated "zero pending owner decisions"; that was true of
  QCLI-46's blocker but not of QCLI-50, whose AC #1 requires an owner ruling
  that had never been obtained and whose description explicitly says not to
  presume the answer. Obtained at this restore before dispatch, following this
  campaign's own precedent: **tense-only edits that preserve the recorded fact
  are ordinary housekeeping, not preserve-and-amend.** `CLAUDE.md`'s "or
  re-tensing" wording is to be narrowed by an inline dated amendment citing
  QCLI-50, to the test "covered only when the edit alters or obscures what the
  record asserts was read"; nothing is restored in the evidence record. Recorded
  verbatim in QCLI-50's own description (`a0ebdfc`) so it travels with the task.
  Owner's rationale: it ratifies the scope judgment QCLI-45's review already
  made, and a logging-every-instance variant was considered and rejected as
  recreating most of the burden the ruling lifts.

  **R3 was not a no-op.** `lore sync` at restore found `docs/log.md` missing
  `82ec77d` — doc-11 wave-1's own settlement docs commit, which by construction
  cannot record itself. The documented one-commit lag, not drift. Gated with
  `lore check --strict` (47 files, 0 errors, 0 warnings) and committed as
  `4c1609c`.

  - **QCLI-46** → merged `a4276e0` (PR #62). Three-pass sweep over all 44
    authored `docs/` files re-derived the outstanding set from scratch,
    confirming the 3-site floor and finding no fourth site. register.md:420 now
    cites QCLI-2.7 and fidelity-contract.md:561 now cites QCLI-2.5, each traced
    by `git blame` to the commit that actually authored the amendment
    (`2246c46`, `407ea61`) rather than guessed. The `a4ae6c5` site implements
    the owner's uncitable ruling verbatim, with the recorder/author distinction
    explicit in the prose. 37 insertions, **0 deletions** across the three
    files. All 6 ACs confirmed.
  - **QCLI-48** → merged `c47c2a0` (PR #63), rebased onto `a4276e0` and
    re-verified before merge. Placement rule plus `git interpret-trailers
    --parse` verification and a worked correct/incorrect pair added to
    `wave-loop.md` section i; SKILL.md pointer and Provenance entry; skill at
    `0.9.1-qcli.4`. Sweep: 258 commits, 202 carrying `Refs:` text, 36
    unparseable. Disposition recorded explicitly: none amended or re-trailered.
    All 5 ACs confirmed.

  **Review again ran in degraded mode, and the return-path failure has now
  spread from reviewers to workers.** QCLI-48's worker completed its work fully
  — committed *and* pushed — but its structured return never arrived; the work
  was recovered by inspecting the worktree's git state directly rather than
  re-dispatching. That is the 5th return-path failure across two sessions. Per
  the wave-1 handover's standing guidance, no further dispatches were burned on
  it; the orchestrator ran both reviews itself as explicit adversarial passes,
  re-deriving every claim rather than replaying the workers' self-reports. Two
  checks were decisive: QCLI-48's 36 unparseable SHAs were compared as a **set**
  against the worker's list and were identical (counts agreeing could be
  coincidence; identical sets could not), and QCLI-46's two **new** citations
  were independently confirmed by `git blame` — the highest-risk part of that
  change, since a wrong attribution would have written a false citation into a
  historical record.

  **Wave-level integration review: no findings, and positive confirmation.**
  The two tasks' file sets are disjoint. Re-running QCLI-48's own sweep on `dev`
  after both merges landed: total 258 → 260 (+2), `Refs:`-carrying 202 → 204
  (+2), unparseable **unchanged at 36**. Both of this wave's merges were
  authored with explicit squash bodies and both parse — so the wave that
  introduced the rule introduced zero violations of it. `lore check --strict` on
  `dev` post-merge: 47 files, 0 errors, 0 warnings. No follow-up tasks proposed.

  **Merge-queue hazard reproduced and characterized (evidence for QCLI-49).**
  The orchestrator's `--add-label in-review` write on `dev` left QCLI-48's task
  file dirty while that task's *branch* had also committed its own copy of the
  same file — so committing the label edit would have conflicted at rebase on
  the same frontmatter block. Verified the dirty diff contained only
  `updated_date` and the label (no plan or notes, which live on the branch),
  discarded it, and reconstructed labels at settlement. This sharpens wave 1's
  finding: the operative rule is not merely "clean the checkout before
  rebasing" but **the orchestrator must not edit a task file on `<default>`
  while that task's branch is unmerged.** Separately, this wave committed its
  dispatch marking (`fe92535`) and re-pinned both worktrees onto that commit, so
  each branch already carried its own task file's `wave-2` label and could not
  conflict on it — which worked cleanly and is offered to QCLI-49 as evidence,
  not as a pre-empted decision.

- 2026-08-07 — **wave 3: QCLI-49 + QCLI-50, both merged and settled `Done`.
  Campaign complete.** Wave base pinned at `3633bc1`. One task per cluster
  again — the maximum legal wave here. File sets verified disjoint after the
  fact.

  **A pending owner decision was found that the wave-1 handover had recorded as
  absent** (see wave 2's entry): QCLI-50's AC #1 required a ruling never
  obtained. Taken at the wave-2/3 restore before dispatch and recorded verbatim
  in QCLI-50's own description (`a0ebdfc`).

  - **QCLI-49** → merged `7c68170` (PR #64). Decision: commit the
    dispatch-marking pass on `<default>` immediately, one `Refs:` trailer per
    task in the pass, then re-pin every just-acquired worktree onto that commit
    before dispatch. Sections d, f, g, i updated with runnable commands and
    worked SHAs; (g) gained a clean-checkout precondition that holds by
    construction. All 4 cited example commits independently verified against
    real history. All 5 ACs confirmed.
  - **QCLI-50** → merged `0f07c27` (PR #65), rebased onto `7c68170` and
    re-verified. Owner ruling recorded in `CLAUDE.md`, narrowing the "or
    re-tensing" wording to an explicit test; nothing restored in the evidence
    record; reason recorded in both `CLAUDE.md` and the record itself. 0
    deletion lines in `CLAUDE.md` and `docs/`. All 5 ACs confirmed.

  **One `request_changes` cycle (QCLI-50), resolved.** The evidence-record note
  located the re-tensed clause as "the paragraph preceding this note" — but that
  block is the `LDOC-4` blockquote; the clause sits two blocks earlier. Fixed
  with a structure-independent locator (paragraph named by its opening words) so
  the reference survives future insertions. Notable: **both `lore` gates pass on
  the defective version** — a wrong prose cross-reference is invisible to a link
  checker, so review was the only thing that could catch it. Fixing pre-merge
  mattered because once merged the note becomes permanent preserve-and-amend
  text, and correcting it later would itself cost a dated amendment.

  **Wave-level integration review earned its keep — it caught a real defect.**
  QCLI-49 updated `wave-loop.md`'s trailer table (dispatch marking and in-flight
  pointer recording became one commit *per pass*, multiple trailers) but left
  SKILL.md's `**Commits**` row — the summary that explicitly points at that
  table — still calling both single-task. Two files governing the trailer
  convention, contradicting each other: precisely the "rule sitting next to
  contradicting practice" defect QCLI-47 exists to fix. Structurally invisible
  to both single-task reviews; only the cumulative-diff pass could see it. Fixed
  as a narrow worker follow-up in `42bc64e` (PR #66) — three cases stated
  explicitly, plus "has *one* directing task" → "has *a* directing task", with
  both exceptions and QCLI-48's verification sentence preserved. No version bump:
  a correction within QCLI-49's own `0.9.1-qcli.5` divergence.

  **No trailer regression:** re-running QCLI-48's sweep after all wave-3 merges,
  commits carrying `Refs:` text rose 204 → 208 while unparseable stayed
  **unchanged at 36**. `lore check --strict` on `dev`: 47 files, 0 errors, 0
  warnings.

  **Return-path failures continued and are now characterized.** Across this
  session: QCLI-48's worker completed fully but its return vanished; QCLI-46's,
  QCLI-49's, QCLI-50's and both fix workers' returns arrived, several only long
  after the work was already reviewed and merged from worktree state. The
  reliable procedure is therefore: **never re-dispatch on a missing return —
  verify the worktree's own git state, and review from that.** No dispatch was
  wasted on the failure this session.

- 2026-08-07 — **campaign closed.** All 6 tasks (QCLI-45..QCLI-50) `Done` across
  3 waves; 6 PRs merged (#60, #61, #62, #63, #64, #65) plus one integration-fix
  PR (#66). Zero needs-human items, zero unresolved escalations, zero campaign
  branches or worktrees remaining, 6/6 pool slots free. One proposed follow-up
  awaits owner approval (see above) and is deliberately unfiled.
