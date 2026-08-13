---
id: doc-10
title: Backlog campaign tracker
type: other
created_date: '2026-08-07 11:42'
updated_date: '2026-08-07 13:55'
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
2026-08-07 after wave 2, **the campaign is complete** — 0 ready, 0 blocked,
2/2 Done. Both of doc-9's approved follow-ups are settled. A fresh queue
needs `/backlog-handover init`.

## Origin of this campaign

Seeded 2026-08-07 from doc-9's two approved follow-ups, QCLI-43 and QCLI-44.
Both were filed at `34bceae` **after** doc-9 closed, so neither carried a
`campaign` label and no live campaign covered them. R2 ground truth for this
session found doc-9 complete (QCLI-40 Done, handover correctly archived with
no successor per the campaign-complete rule), local `dev` clean at `34bceae`
and in sync with `origin/dev`, all six treehouse pool slots available with
zero leases, zero campaign branches local or remote, and zero open PRs —
nothing to reconcile at R3.

The owner chose init-and-drain inline over a separate `/backlog-handover init`
round-trip, the same path doc-9 took for QCLI-40.

## Owner ruling obtained at init (QCLI-44)

QCLI-44 was **not dispatchable as filed**: its own description says an owner
ruling on which citation form is normative is required *before* any editing,
and its AC #1 requires that ruling to be recorded and dated. An agent cannot
manufacture an owner ruling, so the ruling was obtained at init rather than
labelling the task `needs-human`.

**Ruling (2026-08-07): option (a) — a directing-task citation IS required.**
An inline supersession amendment must cite the directing task in addition to
whatever closing decision it names. CLAUDE.md line 90 stands as written and is
NOT relaxed; the amendments citing only the closing decision are what gets
reconciled.

Owner's rationale: agents read `docs/` without git history in context, so the
directing-task citation is what makes the full reasoning (task description,
ACs, implementation notes) reachable from the document itself. Git preserves
the same trace but not in a form a docs reader can follow.

Recorded verbatim as a comment on QCLI-44 so it travels with the task rather
than living only here. Now also recorded normatively in CLAUDE.md itself
(lines 93–104) by QCLI-44's merge.

## Confirmed queue order

Confirmed by the user on 2026-08-07. This is the wave-builder's tie-break, NOT
a guarantee that any task lands in any particular wave.

1. QCLI-44 — Settle whether inline supersession amendments must cite the
   directing task — **Done, wave 1** (`5b2234b`, PR #58)
2. QCLI-43 — Fold the lore log sync into campaign settlement to stop recurring
   `docs/log.md` SHA drift — **Done, wave 2** (`7efc1a4`, PR #59)

Rationale for this order (owner-selected): QCLI-43's `lore sync` is what
closes `docs/log.md` drift, so running it *last* means it also covers QCLI-44's
merge and the session ends with the log caught up through both — which is
precisely what QCLI-43 exists to guarantee, and makes its AC #1 verifiable at
maximum coverage. The reverse order would re-open drift at QCLI-44's merge and
require a second manual sync pass.

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:supersession-convention | The inline-supersession citation convention and the amendments that must conform to it | QCLI-44 |
| cluster:campaign-machinery | The `backlog-handover` skill's settlement contract and the `docs/log.md` sync it owns | QCLI-43 |

**These two are treated as conflicting despite different clusters.** QCLI-43
runs `lore sync`, which regenerates managed blocks across `docs/` and
auto-commits `backlog/` bookkeeping; QCLI-44 edits three files under `docs/`.
The file-citation read gives disjoint *authored* sets, but `lore sync`'s blast
radius overlaps them, so the wave builder over-approximates per R4b ("ambiguous
match → keep every candidate"). Consequence: two waves of one, not one wave of
two. With a two-task queue the parallelism cost is nil.

The wave-1 reviewer independently confirmed the sequencing requirement: no
`docs/` file QCLI-44 touched carries a `lore:` managed block, and `docs/log.md`
was untouched, so `lore sync` will regenerate the log and rewrite nothing
QCLI-44 wrote — but sync also auto-commits `backlog/`, which would have raced
the QCLI-44 task file. Merging QCLI-44 first was therefore correct.

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(clean — wave 2 settled, worktree returned, all six pool slots available)

**Wave 2 was recovered, not restarted.** The session that dispatched it crashed
after the worker pushed and before the reviewer ran, leaving no handover. R2
found the branch pushed to `origin` at `28e4018`, no PR open, the lease still
held with zero live processes, and QCLI-43 correctly at `In Progress` +
`wave-2` — Backlog state and worktree state agreed, so R3 resumed it at its
recorded stage (5, pushed) rather than restarting. **The crash cost nothing:**
every stage the dead session completed was durable and was picked up as-is.
This is the dispatch-marking fix (R4d) and stage-numbered in-flight table
working exactly as designed.

## Needs a human / blocked

(none — QCLI-44's blocking ruling was obtained at init, see above)

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed. Each entry is a ready-to-run proposal, surfaced at the session report.

1. **Reconcile the three remaining non-conformant supersession amendments.**
   From wave 1. QCLI-44 brought seven sites into conformance and recorded three
   it could not: `quest-cli-research-source-register.md:420` and
   `quest-cli-backlog-migration-fidelity-contract.md:561` (both outside
   QCLI-44's authorized file scope), and
   `quest-cli-activation-gate-evidence-record.md:67`/`:73`, where **no citable
   directing task exists at all** — commit `a4ae6c5` carries no trailer and
   nothing in `backlog/` references it, confirmed by exhausting the task store.
   That third one needs an owner decision on what to cite when the authoring
   work has no task, not just an edit.
   ACs would be: each of the three either cites a directing task or carries an
   owner-approved alternative; the `a4ae6c5` gap has a recorded owner
   disposition; `lore validate --strict` and `lore check` clean; no historical
   text rewritten.

2. **Rule on whether QCLI-42's replace-rather-amend was permitted.**
   From wave 1's review. QCLI-42 (`3b1e9f5`) deleted and re-tensed QCLI-41's
   gate-result paragraph in the activation-gate evidence record instead of
   appending a dated amendment. The reviewer assessed this as **defensible**
   under CLAUDE.md's own "prose a reader would act on today gets corrected in
   place" branch — the deleted sentence was "the gate result is unchanged:
   closed", which is actionable prose — but at odds with that document's
   stronger self-declared preserve-and-amend methodology. This is a question
   about which convention governs an evidence record, not an asserted defect,
   and the reviewer explicitly declined to assert a violation.
   ACs would be: a dated owner ruling on which convention governs evidence
   records; the record amended inline if the ruling requires it.

3. **Give the campaign's own bookkeeping commits `Refs:` trailers.**
   From wave 2's review. SKILL.md's Commits convention says "always a
   `Refs: QCLI-<N>` trailer", and QCLI-43 just carved out the single blessed
   exception (`lore sync`'s hardcoded `chore(backlog): sync task changes`).
   But the reviewer found the orchestrator's *own* campaign bookkeeping commits
   routinely lack the trailer in practice — `d0b5f41`, `9c63769`, `146956d`,
   `8721feb` all have an empty `%(trailers:key=Refs)`. That is pre-existing
   practice drift, not something QCLI-43 introduced, and it sits awkwardly next
   to a convention that now names exactly one exception. Two defensible
   dispositions: make the orchestrator emit trailers on bookkeeping commits, or
   widen the documented exception to cover them. Someone should pick one.
   ACs would be: the convention and actual practice agree; whichever way it is
   resolved is recorded in SKILL.md; no claim in either document is left false.

## Wave log

- 2026-08-07 — campaign init (doc-10), run inline during a `restore`. R2
  ground truth clean on every axis: `dev` at `34bceae` clean and in sync,
  6/6 treehouse slots available with zero leases, no campaign branches
  (local or remote — remote carries only `dev` and `main`), no open PRs,
  63 tasks of which 61 Done. R3 had nothing to reconcile. Labelled QCLI-43
  `campaign` + `cluster:campaign-machinery` and QCLI-44 `campaign` +
  `cluster:supersession-convention`. Obtained the owner ruling QCLI-44
  required before dispatch (see above) and recorded it as a task comment.

- 2026-08-07 — wave 1 (QCLI-44, single member). Pool slot 1, lease
  `f47c4204…`, branch `fix/qcli-44-supersession-citation` cut from `8721feb`
  (the dispatch-marking commit) per doc-9's process fix — **zero task-file
  rebase conflicts, confirming that fix generalizes.** Merged `5b2234b`
  (PR #58, squash). Settled with all 4 ACs checked.

  **3 review passes, 2 fix cycles.** The review gate did real work here and
  the detail is worth keeping:

  - **Pass 1 → `request_changes` (4 blocking).** The implementation had
    written a **false factual claim into CLAUDE.md** — that directing-task
    citation was first practiced 2026-08-06 10:07:22 by QCLI-34 "citing
    itself". The reviewer checked with `git log -S'reconciled here by'
    -- docs/` and `git log -L 167,167:…` instead of trusting it: QCLI-34
    never touched that line and never self-cited anywhere; the string was
    authored by **QCLI-37 at 14:51:34, *about* QCLI-34**. A citation *of* a
    task had been read as a citation *by* it. The reviewer also found the
    inclusion criterion ("these tasks already self-cited elsewhere in the
    same commit") was false for all three members of the included set, and
    that the ruling text carried a temporal carve-out narrowing a rule the
    owner had ruled must not be relaxed. Plus two amendment sites the sweep
    missed, both post-dating the implementation's own threshold.
  - **The remedy stayed inside the owner's ruling rather than reopening it**:
    carve the *remediation scope*, not the rule. Deleting the threshold
    apparatus outright made the false claim unnecessary rather than merely
    corrected, and required no new owner input.
  - **Pass 2 → `request_changes` (1 blocking, notes-only).** The fix pass
    established the original "~30+ uniformly non-conformant" estimate was
    substantially wrong *in the other direction* — self-citation was already
    the norm well before 2026-08-06 (QCLI-2.12, QCLI-12, QCLI-14, QCLI-21
    and others all self-cite on 2026-08-04/05). Real gap: three sites, not
    thirty. The reviewer's own double-sweep then found one more the fix pass
    had missed, falsifying its "1 site" total. Notably **CLAUDE.md carried
    no count**, so the second-false-fact-in-binding-law risk never
    materialized; the overstatement stayed confined to task notes.
  - **Pass 3 → `approve`**, all four ACs confirmed on reviewer-generated
    evidence.
  - **Orchestrator merge-queue catch.** A line-level append-only check
    reported 3 removed lines in `docs/`, appearing to contradict the
    reviewer's "zero deletions". Wrong granularity: these are table rows
    where the citation is appended *inside a cell*, before the trailing
    pipe, so the old line is not a prefix of the new while the old cell is.
    Cell-level comparison confirmed pure appends. **Recorded because the
    naive check will fire again on any table-cell amendment** — check cells,
    not lines, when verifying append-only in this repo's tables.
  - Post-rebase gates re-run (mandatory, not skipped): `lore validate
    --strict` and `lore check` both 0 errors / 0 warnings. Squash
    completeness verified before branch deletion (`git diff 33efd69 dev`
    empty over the touched paths). Worktree returned, both branches deleted,
    pool restored to 6/6.
  - **Wave-level integration review: not dispatched, deliberately.** A
    single-member wave has no cross-task surface — the cumulative wave diff
    is the task diff the reviewer had already examined three times, so R4h
    would re-review identical bytes. Recorded rather than silently skipped.
  - Residual, not fixed: one cosmetic dangling participle at
    `quest-cli-activation-gate-evidence-record.md:225`, an artifact of an
    orchestrator-directed trim; reviewer explicitly judged it not worth a
    fix cycle. Two owner-decision items promoted to Proposed follow-ups
    above.

- 2026-08-07 — wave 2 (QCLI-43, single member). **Recovered from a crashed
  session**, not dispatched fresh: R2 found the branch already implemented,
  committed and pushed at `28e4018` with the lease still held and zero live
  processes, and Backlog agreeing (`In Progress` + `wave-2`). Resumed at
  stage 5 per R3. Pool slot 1, lease `28eadc44…`, branch
  `chore/qcli-43-settlement-log-sync`. Merged `7efc1a4` (PR #59, squash).

  **3 review passes, 2 fix cycles — and the last one mattered most.**

  - **Pass 1 → `request_changes` (3 blocking).** (i) A false causal claim
    written into binding contract text. (ii) `lore check` prescribed as a
    "0 errors and 0 warnings" gate — but plain `lore check` exits 0 with
    warnings present; the threshold needs `--strict`. A gate that cannot
    enforce the threshold it states is worse than no gate. (iii) The text
    blessed `lore sync`'s auto-commit without noting it carries no `Refs:`
    trailer, contradicting SKILL.md's "always a trailer" rule.
  - **Pass 2 → `request_changes` (1 blocking).** The *corrected* causal
    account was **still wrong**, and wrong in the dangerous direction. The
    fix pass had restated pass 1's notes instead of re-measuring. The
    reviewer measured: the four dangling SHAs came from **QCLI-28 / #44**
    (`43bc22e`), not QCLI-32 / #48 — proven two ways, by `git log -S<sha>`
    attribution and by the bad-set at `43bc22e` being byte-identical to the
    one at `2e57876`. And "fired once" was false: it fired **six times**
    (QCLI-16, 17, 19, 21, 22, 28), each "fixed for good" by a one-shot
    regeneration that the next per-task-branch sync reopened — three such
    fixes before QCLI-35's. **Why that blocked rather than being pedantry:**
    the contract's one load-bearing constraint is *never run the sync on a
    per-task branch*, and the text was framing the very mechanism that
    constraint prevents as a one-time fluke closed four tasks earlier —
    handing a future maintainer a ready-made case to relax it. The measured
    history is the strongest argument *for* the rule.
  - **The process fix that worked.** The final fix worker was instructed to
    measure every historical claim itself and quote its command output
    rather than paste the reviewer's numbers, and to report disagreement
    rather than silently pick a side. It reproduced all ten rows of the
    drift walk independently and found no disagreement. **Pass 3 →
    `approve`**, every SHA, PR number, task ID and count re-verified.
  - **Two false-claims-in-binding-text defects in two consecutive
    campaigns.** Wave 1 of this same campaign caught a false factual claim
    written into CLAUDE.md. The recurring shape is an agent inheriting a
    plausible claim from an upstream artifact (task description, prior
    notes) and restating it as measured fact. Both times the reviewer caught
    it only by re-running the measurement. **Treat any historical/forensic
    claim in a task description as unverified input, not as evidence.**
  - The task description's own headline example was itself wrong from the
    start: `2e57876` is not a dangling branch SHA, it is PR #48's squash
    commit on `dev`, and QCLI-32 never touches `docs/log.md` at all
    (`git diff-tree` shows only the Story file and its own task record).
    "30+ unrecorded commits" was really 3.
  - **Merge queue.** Rebase onto `0b63077` conflicted exactly once, in
    QCLI-43's own record and only on the `updated_date` frontmatter line
    (twice — once per fix commit); resolved by keeping the later timestamp.
    Predicted in advance by the reviewer, including that there was no
    content risk (dev's copy had no PLAN/NOTES sections at all). **This is
    the cost of the orchestrator writing a task file on `dev` mid-flight**
    (the `in-review` label) after the branch was cut — doc-9's
    cut-from-the-dispatch-commit fix does not protect against it. Cheap and
    mechanical, but worth expecting rather than rediscovering.
  - Post-rebase gates re-run (mandatory, not skipped): `lore validate
    --strict` and `lore check --strict` both 0 errors / 0 warnings. Content
    verified byte-identical to the approved `bb1a0d0` across both skill
    files. Squash completeness confirmed before branch deletion. Worktree
    returned, both branches deleted, pool restored to 6/6.
  - **Wave-level integration review: not dispatched, deliberately** — a
    single-member wave has no cross-task surface, so R4h would re-review
    bytes the reviewer had already examined three times. Recorded rather
    than silently skipped, as in wave 1.
  - **AC #1 pre-sync baseline** (on `dev` at `7efc1a4`): 95 recorded SHAs,
    `total=95 bad=0`; 98 `docs/`-touching commits on `dev`, so exactly 3
    unrecorded (`3b1e9f5`, `c9353bc`, `5b2234b`). Staleness mode, not the
    dangling-SHA mode — matching the corrected two-mode account.
  - **Bootstrap ordering deviation, one-off and recorded.** The contract
    QCLI-43 establishes runs `lore sync` strictly last in settlement, but
    QCLI-43's own AC #1 is only provable *by* that sync. So ACs 2–5 were
    checked first, the sync then ran as the contract's first real execution,
    AC #1 was verified against its output, and only then was AC #1 checked
    and the task moved to `Done`. This chicken-and-egg is unique to the one
    task whose acceptance depends on the settlement step it defines; it was
    recorded in the task notes rather than carved into the contract, which
    would have been unprompted scope. Post-sync AC #1 evidence lives in
    QCLI-43's implementation notes.

- 2026-08-07 — **campaign complete.** Both of doc-9's approved follow-ups
  (QCLI-44, QCLI-43) are `Done`. Three proposed follow-ups await the owner's
  decision above; none were created, per this project's no-autonomous-
  follow-up rule. Tasks left in `Done` — no archiving, per the same rule.
