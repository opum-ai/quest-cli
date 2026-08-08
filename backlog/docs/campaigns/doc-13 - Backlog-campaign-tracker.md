---
id: doc-13
title: Backlog campaign tracker
type: other
created_date: '2026-08-08 14:59'
updated_date: '2026-08-08 14:59'
---
# Backlog campaign tracker

Protocol: restore -> recompute the ready/conflict graph from Backlog -> acquire
worktrees -> mark the acquired members dispatched -> implement + review in
parallel -> serialize the merge -> settle tasks and write this doc once more ->
loop until the queue is empty or blocked -> write handover.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of init
(2026-08-08), **2 queued, 0 in flight, 0 blocked, 0 needs-human**.

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

## Needs a human / blocked

None at init. Both queued tasks were classified agent-resolvable: their
acceptance criteria are wording-consistency checks, scoped prose sweeps with
recorded method, and a disposition derived from current text — all objectively
verifiable by an agent, with the mandatory reviewer gate covering the judgment
calls (QCLI-53 AC#2 in particular).

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed. Each entry is a ready-to-run proposal.

_(none yet — populated by wave-level integration review)_

## Wave log

_(none yet)_
