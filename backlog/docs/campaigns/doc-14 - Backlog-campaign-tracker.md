---
id: doc-14
title: Backlog campaign tracker
type: other
created_date: '2026-08-08 21:44'
updated_date: '2026-08-08 21:45'
---
# Backlog campaign tracker

Protocol: restore -> recompute the ready/conflict graph from Backlog -> acquire
worktrees -> mark the acquired members dispatched -> implement + review in
parallel -> serialize the merge -> settle tasks and write this doc once more ->
loop until the queue is empty or blocked -> write handover.

## Why this campaign exists — the pivot

doc-13 closed having resolved two tasks, both about the campaign machinery
itself. Asked directly whether the project was still working on docs and when
implementation could start, the honest answer was that the last eleven completed
tasks (QCLI-43..QCLI-53) had all been process and convention work, and that the
repository contains **zero product source** — 86 backlog files, 47 docs files,
and no `src/`, no tests, no entry point.

This campaign is scoped by the user to exactly one thing: **the issues required
to begin implementation.** Campaign-tooling work is deliberately excluded except
where it would halt this campaign itself.

## The gate situation, established at init by reading the corpus

A correction the init investigation produced, worth stating because the earlier
framing was wrong:

- **The Lore-owned gate is already open.** Its owner accepted the Lore `0.1.1`
  release boundary in `LDOC-4` on 2026-08-06, and `lore-doc`'s gate Spec reports
  the result as **open** — read as the owner's own conclusion, per
  `docs/reference/quest-cli-activation-gate-evidence-record.md`.
- **CLAUDE.md's packaging prohibition is not arbitrary.** It restates the
  research programme Spec's "Prohibited work before activation" list. The gate
  binds it, so it is amended by establishing activation, never by routing around.
- **But an open Lore gate is not activation.** The evidence record says so
  explicitly. This repository still owes its own Phase 0 recheck, and that
  recheck clause is emphatic: a worker must re-run every command, must not reuse
  the 2026-08-05 capsule, and must **never** compute a Pass/Fail itself — only
  read the owner's own live statement.
- The pins have moved twice. The capsule pins `lore-doc` at `45d0d90f68a6` and
  notes it advanced to `d2a9a9e11ddf`; a read-only spot check on 2026-08-08 found
  HEAD `101f9bb`. The recheck is genuinely owed, not a formality.
- Phase 1 is nearly closed. Envelope shape, exit-code table, identifier grammar,
  license, platform, scale target, and anomaly placement are all recorded
  **Closed**. What remains Quest-owned is one standing pin re-verification
  (QCLI-57) and D2, the runtime, which is **owned but not closed** (QCLI-58).
- Two open items are explicitly **not Quest's to decide**: D6's product-wide
  actor model belongs to `quest-doc`, and the `lore-doc` half of the not-found
  convention belongs to that owner. A phase that decides either unilaterally has
  overstepped. Neither is in this queue.

## Confirmed queue order

Confirmed by the user on 2026-08-08. This is the wave-builder's tie-break, NOT a
guarantee that any task lands in any particular wave.

1. QCLI-56 — Discharge the Phase 0 activation recheck (the gating task)
2. QCLI-57 — Re-verify the Backlog.md v1.49.3 pin
3. QCLI-58 — Assemble a decision-ready D2 runtime proposal
4. QCLI-59 — Amend CLAUDE.md, conditional on a verified Pass
5. QCLI-60 — Push the orchestrator's bookkeeping commits (tooling; see below)

## Frontier

The ready set is ALWAYS recomputed live at the start of every restore/wave —
never trust a persisted "next wave" plan. Informational hint only: as of init
(2026-08-08), **5 queued, 0 in flight, 0 blocked, 0 needs-human**.

## Dependency and conflict structure

One native dependency: **QCLI-59 depends on QCLI-56**, declared with `--dep`,
because CLAUDE.md may only be amended once the recheck establishes what is true.
That ordering is the mechanism; the conditional inside QCLI-59 is the actual
obligation — a `Done` predecessor whose capsule reports anything other than Pass
still means do not amend.

Conflicts, by cluster:

| Cluster | Tasks | Primary file target |
| --- | --- | --- |
| `cluster:gate` | QCLI-56 | `docs/reference/quest-cli-activation-gate-evidence-record.md` |
| `cluster:decisions` | QCLI-57, QCLI-58 | both may touch `docs/reference/quest-cli-open-component-decisions.md` |
| `cluster:governance` | QCLI-59 | `CLAUDE.md` |
| `cluster:skill-docs` | QCLI-60 | `.claude/skills/backlog-handover/**` |

QCLI-57 and QCLI-58 share a cluster because both may edit the open component
decisions register — a real file-level conflict, so they serialize. Every other
pair is disjoint, which makes this the first campaign in this series able to run
a genuinely parallel wave rather than degrading to size 1.

## Known defect in the driver, active during this campaign

QCLI-60 fixes it, but it is unfixed while this campaign runs, and **this campaign
is the first to run waves larger than one task — exactly where it bites.**
`reference/wave-loop.md` (d) step 4 commits the dispatch-marking pass on
`<default>` without pushing it; the squash-merge then folds that commit's content
into the merge commit and local `<default>` diverges, halting (g) step 5.

**Orchestrator workaround, applied deliberately until QCLI-60 merges:** push
`<default>` immediately after every dispatch-marking and in-flight-pointer
commit. This is the fix QCLI-60 proposes, applied by hand — not a departure from
the procedure, since (d) step 4 never forbade the push, it merely failed to
require it.

## Clusters

| Cluster label | Covers | Tasks |
| --- | --- | --- |
| `cluster:gate` | The activation-gate evidence record | QCLI-56 |
| `cluster:decisions` | Phase 1's remaining Quest-owned decision surface | QCLI-57, QCLI-58 |
| `cluster:governance` | CLAUDE.md's prohibition text | QCLI-59 |
| `cluster:skill-docs` | The backlog-handover skill's own mechanics | QCLI-60 |

## Deliberately excluded

QCLI-54 and QCLI-55 remain filed, `To Do`, and **unlabelled**, so the ready-set
computation never considers them. Both are campaign-tooling documentation fixes,
not implementation blockers; the user scoped them out explicitly at init. The
four further proposals recorded in doc-13 are likewise unfiled. Nothing is lost —
all of it is available to a later campaign.

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

## Needs a human / blocked

None queued. Two known items are out of scope because they belong to other
owners, recorded here so a later session does not mistake them for oversights:

- **D6, the product-wide actor model** — must be authored into `quest-doc`. No
  task in any repository has done so. Phase 2 can build the gate *mechanism*
  without it; gate *actor eligibility* cannot be built without it.
- **The `lore-doc` half of the not-found convention** — needs that owner.

One item inside the queue carries a decision that is the owner's, not an agent's:
**QCLI-58 prepares the D2 runtime comparison but does not decide it.** The ruling
is the user's, and the task is written to stop short of it.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed.

_(none yet — populated by wave-level integration review)_

## Wave log

_(none yet)_
