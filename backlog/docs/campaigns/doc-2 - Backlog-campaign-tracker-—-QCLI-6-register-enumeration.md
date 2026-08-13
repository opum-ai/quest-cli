---
id: doc-2
title: Backlog campaign tracker — QCLI-6 register enumeration
type: other
created_date: '2026-08-05 02:50'
updated_date: '2026-08-05 05:18'
---
# Backlog campaign tracker — QCLI-6 register enumeration

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Campaign scope

Started as a single task (QCLI-6); grew to four across three
reviewer-proposed follow-ups, each approved by the user before filing.
**QCLI-6** — "Close remaining research-source-register enumeration gaps
(QCLI-2.5, 2.6, 2.8, 2.9, 2.10 not yet enumerated in 'Prior QCLI research
records')" — was the O2 follow-up the QCLI-2 campaign's wave-5 integration
review proposed (see `doc-1`, the QCLI-2 campaign's archival record, which
stays untouched as history — this doc does not supersede it). **QCLI-7** —
enumerate-or-exclude the campaign Story — was filed from QCLI-6's reviewer
finding. **QCLI-8** — reconcile QCLI-2.10's playbook — was filed from
QCLI-7's reviewer finding. **QCLI-9** — re-pin QCLI-2.10's playbook in the
register — was filed from QCLI-8's reviewer finding, closing a
pin-staleness chain that QCLI-8's own merge (correctly, and unavoidably)
opened.

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

This campaign hit variants of the same trap four more times, each resolved
differently depending on whether the task itself co-edited the pinned
document:

- **Wave 1** (QCLI-6): did not co-edit the ledger/charter — all five new
  pins correctly SHA-pinned, no trap triggered.
- **Wave 2** (QCLI-7): co-edited QCLI-2.8's own already-pinned document in
  the same pass — correctly converted that pin to a self-pin (Option A).
  Also discovered a *new* variant: Stories carry a lore-managed `tasks:`
  block `lore sync` rewrites on any coupled task's status change,
  independent of prose — no pin form (self- or SHA-) survives that. QCLI-7
  resolved it by ruling Stories out of the register's admission authority
  entirely, rather than attempting a pin. **Independent reviewer confirmed
  this was the right call**, not just accepted the worker's framing.
- **Wave 3** (QCLI-8): needed to edit QCLI-2.10's playbook for reasons
  *unrelated* to the register (fixing a stale caveat) — but that document
  was already commit-pinned in the register from wave 1. This is the
  general form of the trap: **any** task editing a register-pinned document
  for any reason invalidates that pin on merge, whether or not the task
  ever intended to touch the register. QCLI-8 correctly left the register
  alone (out of its own stated scope) and the resulting staleness became
  wave 4's task.
- **Wave 4** (QCLI-9): fixed wave 3's staleness with an exact-SHA re-pin
  (not a self-pin, since QCLI-9 itself never touches the playbook) —
  correctly the opposite fix from wave 2's, because the co-editing
  condition differs. **Reviewer independently recomputed all 14 of the
  register's pin-count entries from scratch** (not just the stated totals)
  and confirmed the fix is structurally terminal: QCLI-9's own merge cannot
  reopen the class, since it only touches the register (self-pinned),
  lore-managed sync files, and a Backlog file — none of which is itself a
  commit-pinned register member.

**Standing rule for any future task touching a document this register
pins**: before merging, check whether the register currently pins that
document. If so, the pin will go stale on merge regardless of whether the
task intended to touch the register — decide up front whether to (a)
self-pin in the same pass if the task also edits the register, or (b) file
the register correction as its own follow-up if it doesn't. The residual
hazard is generic to SHA-pinning as a mechanism, not a bug in any one fix.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave —
never trust a persisted "next wave" plan. As of settlement of wave 4,
2026-08-05: 0 ready, 0 blocked. Campaign queue is empty — all four members
Done, and no further follow-up is currently proposed (wave 4's reviewer
explicitly assessed the pin-staleness chain as structurally closed).

## Confirmed queue order

Confirmed by the user on 2026-08-05 (QCLI-6); QCLI-7, QCLI-8, and QCLI-9
each added and approved on 2026-08-05 following their originating wave's
review.

1. QCLI-6 — Close remaining research-source-register enumeration gaps
   (Done, wave 1)
2. QCLI-7 — Enumerate the campaign Story in the research-source-register's
   'Prior QCLI research records' slice (Done, wave 2)
3. QCLI-8 — Reconcile QCLI-2.10's playbook against the QCLI-2.5 enumeration
   gap QCLI-6 already closed (Done, wave 3)
4. QCLI-9 — Re-pin QCLI-2.10's playbook in the register after QCLI-8's
   merge invalidated its commit-pin (Done, wave 4)

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:provenance | Research-source-register coherence/enumeration | QCLI-6 (Done), QCLI-7 (Done), QCLI-8 (Done), QCLI-9 (Done) |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(none — all four waves fully settled)

## Needs a human / blocked

None currently outstanding.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up
work is filed. Each entry is a ready-to-run proposal.

None currently outstanding. Wave 4's reviewer explicitly assessed the
pin-staleness chain (QCLI-6 → QCLI-7 → QCLI-8 → QCLI-9) as structurally
closed: nothing in the register is currently stale, and QCLI-9's own merge
cannot reopen the class by construction. The only residual hazard is
generic to SHA-pinning as a mechanism (see "Known trap" above) and applies
to any future task, not to unfinished work from this campaign.

## Wave log

- 2026-08-05 — wave 1 (tasks: QCLI-6): Single-member wave (whole campaign was
  one task at the time). Worker implemented in treehouse slot 1
  (`fix/qcli-6-register-enumeration-gaps`, based on `dev @ d2a8469`):
  enumerated the five missing register members (SHA-pinned: QCLI-2.5→418c5eb,
  QCLI-2.6→739aa7e, QCLI-2.8→8935551, QCLI-2.9→3b5cd8c, QCLI-2.10→8935551)
  and stated process-level-response admissibility in the public-surface
  slice. Reviewer returned **approve** on all 4 ACs after re-deriving every
  SHA from `git log`/`git show`, a strict Classification-field grep, a full
  pre/post slice-text diff, and an independent re-run of
  `lore check/validate/orphans --strict` (all clean). Two non-blocking
  findings, one of which became QCLI-7. Merged squash via PR #21 as
  `d4b7123`. Settled: QCLI-6 → Done, all 4 ACs checked.

- 2026-08-05 — wave 2 (tasks: QCLI-7): Task created and onboarded directly
  into this campaign (deps QCLI-6, QCLI-2.8, both Done — ready-now). Worker
  made the real judgment call to rule Stories out of scope for the register's
  admission authority, reasoning a Story's lore-managed `tasks:` block makes
  every pin form structurally unstable — empirically confirmed live (Story's
  `tasks:` count churned 16→17 from linking QCLI-7 alone, zero prose
  changes). Also converted QCLI-2.8's own register pin from commit- to
  self-pinned, since this task's pass co-edited that document. Reviewer
  independently re-derived the Story's instability claim from its own git
  history and **concurred** with the rule-out-of-scope call; verdict
  **approve**, all 4 ACs confirmed. Merge hit two mechanical rebase
  conflicts in QCLI-7's own task-file frontmatter — resolved by the
  orchestrator directly (not a content conflict; Backlog frontmatter, not
  product content). Merged squash via PR #22 as `5f47b02`. Settled: QCLI-7
  → Done, all 4 ACs checked. Reviewer's finding became QCLI-8.

- 2026-08-05 — wave 3 (tasks: QCLI-8): Task created and onboarded (deps
  QCLI-6, QCLI-2.10, both Done — ready-now). Worker reconciled two stale
  references in QCLI-2.10's own playbook to the register's current state,
  following QCLI-7's inline-supersession precedent, without touching the
  register itself (correctly out of scope). Also fixed pre-existing,
  task-unrelated drift (QCLI-8 itself never `lore link`-coupled; QCLI-7's
  Done status never synced into the Story's managed block) via the sanctioned
  `lore link` + `lore sync` path — confirmed genuinely pre-existing and
  mechanical by the reviewer. Verdict **approve**, all 3 ACs confirmed. One
  mechanical rebase conflict, resolved the same way as wave 2. Reviewer
  identified a required, non-blocking follow-up: this merge invalidates the
  register's own pin for the very document QCLI-8 edited — became QCLI-9.
  Merged squash via PR #23 as `1a61989`. Settled: QCLI-8 → Done, all 3 ACs
  checked.

- 2026-08-05 — wave 4 (tasks: QCLI-9): Task created and onboarded (deps
  QCLI-8, QCLI-6, both Done — ready-now). Worker re-derived the playbook's
  true current last-touch commit live via `git log` (`1a61989`, QCLI-8's own
  squash-merge) rather than trusting the task description, and re-pinned the
  register accordingly (exact-SHA, correctly not a self-pin since this task
  does not co-edit the playbook), correcting the running pin-count arithmetic
  to match. Also fixed a pre-existing orphan-gate failure (QCLI-9 itself
  never linked) via the same sanctioned path as prior waves. Reviewer
  independently re-derived the commit hash and **recomputed all 14 of the
  register's pin entries from scratch** (not the stated totals) rather than
  trusting either party's arithmetic, confirmed zero live references to the
  retired `8935551` SHA remain anywhere, and re-ran all three lore gates
  clean; verdict **approve**, all 4 ACs confirmed, explicitly assessed as
  **closing the pin-staleness chain structurally** — no further follow-up
  warranted, since this task's own merge cannot reopen the class (it touches
  only self-pinned/non-member files). Merge hit the same two mechanical
  rebase conflicts as prior waves — resolved the same way; also required a
  post-rebase `lore sync` to reconcile the Story's managed block against
  dev's moved state (mechanical, no content change). Merged squash via PR
  #24 as `b9475f2`. Settled: QCLI-9 → Done, all 4 ACs checked.

Campaign complete: the queue holds four Done tasks (QCLI-6, QCLI-7, QCLI-8,
QCLI-9) and 0 ready/blocked/proposed. No further waves to run without a new
task. See the R6 report for the full session summary.
