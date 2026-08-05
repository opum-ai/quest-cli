---
id: doc-2
title: Backlog campaign tracker — QCLI-6 register enumeration
type: other
created_date: '2026-08-05 02:50'
updated_date: '2026-08-05 03:47'
---
# Backlog campaign tracker — QCLI-6 register enumeration

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Campaign scope

Started as a single task (QCLI-6); grew to two after wave 1's reviewer
proposed a follow-up the user approved. **QCLI-6** — "Close remaining
research-source-register enumeration gaps (QCLI-2.5, 2.6, 2.8, 2.9, 2.10 not
yet enumerated in 'Prior QCLI research records')" — was the O2 follow-up the
QCLI-2 campaign's wave-5 integration review proposed (see `doc-1`, the QCLI-2
campaign's archival record, which stays untouched as history — this doc does
not supersede it). **QCLI-7** — "Enumerate the campaign Story in the
research-source-register's 'Prior QCLI research records' slice" — was filed
directly from QCLI-6's own reviewer finding, with the user's explicit
approval to proceed.

Governing documents are the same as the QCLI-2 campaign:
`docs/reference/quest-cli-component-charter.md`,
`docs/reference/former-ocli-to-qcli-migration-ledger.md`, and
`docs/reference/quest-cli-research-source-register.md` (the per-slice
admission authority). Documentation only — no product source, runtime
dependency, executable scaffolding, package publication, or release.

## Known trap — read before dispatch

`doc-1`'s "Needs a human / blocked" section documents a SHA-pinning
self-reference trap: QCLI-2.12's fix passes routinely edited the migration
ledger in the same pass as the register, and any SHA pin of a co-edited
sibling document is structurally invalidated by construction. It cost 3
review cycles (escalated to `human_needed`) before the owner chose Option A
(self-pin the co-edited sibling to its own current state on the branch,
rather than to an exact commit SHA) — see PR #17.

Confirmed avoided in **wave 1** (QCLI-6): did not co-edit the migration
ledger or component charter, so all five new register members were
correctly SHA-pinned.

Confirmed correctly *applied* in **wave 2** (QCLI-7): this task co-edited
`quest-cli-component-contracts-and-delivery-graph.md` (QCLI-2.8's own
deliverable), which was already a SHA-pinned register member from wave 1 —
the worker converted that specific pin to a self-pin in the same pass,
exactly per the rule, and left QCLI-2.10's untouched, unrelated pin alone.
Reviewer independently re-verified all three sub-claims.

**New trap surfaced by wave 2, worth carrying into any future task touching
this register**: pinning discipline (self-pin / exact-SHA) assumes the pinned
document's content is fixed once its owning task's edits land. A Backlog.md
**Story** breaks that assumption — it carries a lore-managed `tasks:` block
that `lore sync` rewrites on *any* coupled task's status change, independent
of authored-prose edits, so no pin form stays valid against one. QCLI-7
resolved this by ruling Stories out of scope for the register's admission
authority entirely (see the register's Exclusions field, dated 2026-08-05)
rather than attempting a pin. If a future task considers admitting any other
lore-managed, task-coupled document type into this register, re-check this
same instability before assuming self-pin/SHA-pin covers it.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave —
never trust a persisted "next wave" plan. As of settlement of wave 2,
2026-08-05: 0 ready, 0 blocked. Campaign queue is empty — both members Done.
One further follow-up proposed below, awaiting user approval.

## Confirmed queue order

Confirmed by the user on 2026-08-05 (QCLI-6); QCLI-7 added and approved
2026-08-05 following wave 1's review.

1. QCLI-6 — Close remaining research-source-register enumeration gaps
   (Done, wave 1)
2. QCLI-7 — Enumerate the campaign Story in the research-source-register's
   'Prior QCLI research records' slice (Done, wave 2)

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:provenance | Research-source-register coherence/enumeration | QCLI-6 (Done), QCLI-7 (Done) |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(none — both waves fully settled)

## Needs a human / blocked

None currently outstanding.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up
work is filed. Each entry is a ready-to-run proposal.

- From wave 2's reviewer (QCLI-7 review, 2026-08-05): **Reconcile
  QCLI-2.10's playbook against the QCLI-2.5 enumeration gap QCLI-6 already
  closed**
  `docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md` is
  stale in two places, not the one QCLI-7's worker originally flagged: (1) a
  narrative caveat paragraph (around line 431) stating the register's slice
  "lists nine specific members ... and the fidelity contract is not one of
  them" — false since QCLI-6, the slice now enumerates fourteen including
  QCLI-2.5's contract; (2) the Sources table's own *Register classification*
  cell for the QCLI-2.5 row (around line 426), which is arguably the worse
  staleness since it is a load-bearing classification claim, not narrative.
  Same reconciliation pattern QCLI-7 already applied to QCLI-2.8's caveat
  (append a dated "Resolved" note, preserve the original as historical
  record).
  ACs (draft): (1) both stale references in
  `quest-cli-backlog-adoption-and-migration-playbook.md` are reconciled
  against the register's current state (fourteen members, QCLI-2.5's
  contract SHA-pinned since QCLI-6); (2) no Classification field lost, no
  permitted use narrowed; (3) `lore check/validate/orphans --strict` all
  clean.

## Wave log

- 2026-08-05 — wave 1 (tasks: QCLI-6): Single-member wave (whole campaign was
  one task at the time). Worker implemented in treehouse slot 1
  (`fix/qcli-6-register-enumeration-gaps`, based on `dev @ d2a8469`):
  enumerated the five missing register members (SHA-pinned: QCLI-2.5→418c5eb,
  QCLI-2.6→739aa7e, QCLI-2.8→8935551, QCLI-2.9→3b5cd8c, QCLI-2.10→8935551)
  and stated process-level-response admissibility in the public-surface
  slice. Reviewer (independent, top-tier) returned **approve** on all 4 ACs
  after re-deriving every SHA from `git log`/`git show`, a strict
  Classification-field grep, a full pre/post slice-text diff, and an
  independent re-run of `lore check/validate/orphans --strict` (all clean).
  Two non-blocking findings: (1) QCLI-2.8's caveat names a third
  unenumerated source (the campaign Story) beyond the two this task closed
  — became the proposal that turned into QCLI-7; (2) the worker's own
  out-of-scope note overstated closure of QCLI-2.8's caveat — corrected in
  the task's settlement notes. No wave-level integration review dispatched
  (single-task wave). Rebase onto `origin/dev` at merge time was a no-op
  (dev had not moved); gates re-verified clean anyway per the
  mandatory-reverify rule. Merged squash via PR #21 as `d4b7123`. Settled:
  QCLI-6 → Done, all 4 ACs checked.

- 2026-08-05 — wave 2 (tasks: QCLI-7): User approved filing wave 1's
  proposed follow-up and proceeding immediately; task created and onboarded
  directly into this campaign (deps QCLI-6, QCLI-2.8, both already Done —
  ready-now). Single-member wave. Worker implemented in treehouse slot 1
  (`fix/qcli-7-story-enumeration`, based on `dev @ bea8f26`): made the real
  judgment call to rule Stories out of scope for the slice's admission
  authority (not admit the campaign Story as a member), reasoning that a
  Story's lore-managed `tasks:` block makes every pin form structurally
  unstable — empirically confirmed live during the task's own pass (the
  Story's `tasks:` count churned 16→17 from linking QCLI-7 alone, zero prose
  changes). Also correctly converted QCLI-2.8's own register pin from
  commit- to self-pinned, since this task's pass co-edited that document.
  Reviewer independently re-derived the Story's instability claim from its
  own git history (diffed its 8 most recent commits — all metadata-only) and
  **concurred** with the rule-out-of-scope call after applying the
  decide-vs-defer test; verdict **approve**, all 4 ACs confirmed. Merge hit
  two purely-mechanical rebase conflicts in QCLI-7's own task-file
  frontmatter (labels/updated_date/assignee — the orchestrator's wave-2 and
  in-review label commits on `dev` collided with the worker's own metadata
  edits on the branch; substantive register/component-contracts content was
  untouched). Orchestrator resolved both directly (merging both sides'
  metadata, not discarding either) rather than treating them as a
  reviewer-escalation-worthy content conflict — Backlog task frontmatter is
  mechanical, not product content. Gates re-verified clean post-rebase.
  Merged squash via PR #22 as `5f47b02`. Settled: QCLI-7 → Done, all 4 ACs
  checked. Reviewer surfaced a broader version of QCLI-7's own flagged
  out-of-scope discovery (QCLI-2.10's playbook has two stale references, not
  one) — see the proposed follow-up above.

Campaign complete: the queue holds two Done tasks (QCLI-6, QCLI-7) and 0
ready/blocked. No further waves to run without a new task. See the R6 report
for the full session summary and the proposed follow-up above, pending user
approval.
