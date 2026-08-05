---
id: doc-2
title: Backlog campaign tracker — QCLI-6 register enumeration
type: other
created_date: '2026-08-05 02:50'
updated_date: '2026-08-05 04:47'
---
# Backlog campaign tracker — QCLI-6 register enumeration

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Campaign scope

Started as a single task (QCLI-6); grew to three across two reviewer-proposed
follow-ups, each approved by the user before filing. **QCLI-6** — "Close
remaining research-source-register enumeration gaps (QCLI-2.5, 2.6, 2.8, 2.9,
2.10 not yet enumerated in 'Prior QCLI research records')" — was the O2
follow-up the QCLI-2 campaign's wave-5 integration review proposed (see
`doc-1`, the QCLI-2 campaign's archival record, which stays untouched as
history — this doc does not supersede it). **QCLI-7** — "Enumerate the
campaign Story in the research-source-register's 'Prior QCLI research
records' slice" — was filed directly from QCLI-6's own reviewer finding.
**QCLI-8** — "Reconcile QCLI-2.10's playbook against the QCLI-2.5 enumeration
gap QCLI-6 already closed" — was filed directly from QCLI-7's own reviewer
finding.

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

**Surfaced by wave 2, now recurring a third time as of wave 3**: pinning
discipline (self-pin / exact-SHA) assumes the pinned document's content is
fixed once its owning task's edits land. Wave 3 (QCLI-8) shows this same
assumption breaks not just for Stories but for **any** register-pinned
document a later, unrelated task happens to co-edit for its own reasons:
QCLI-8 needed to edit `quest-cli-backlog-adoption-and-migration-playbook.md`
(QCLI-2.10's deliverable) for reasons unrelated to the register at all
(reconciling a stale caveat), yet that document was already commit-pinned in
the register from wave 1 — so merging QCLI-8 silently invalidates that pin
the same way QCLI-2.12 and QCLI-7 each hit for other documents. See the
proposed follow-up below and the reviewer's own framing: the *recurrence*
across four separate pins (three failed migration-ledger pins + QCLI-2.8's
conversion) plus this fifth instance is arguably the real defect, not any
single stale SHA — worth an owner-level design call on whether register
pins to task-editable documents should work differently in general, separate
from patching this one instance.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave —
never trust a persisted "next wave" plan. As of settlement of wave 3,
2026-08-05: 0 ready, 0 blocked. Campaign queue is empty — all three members
Done. One further follow-up proposed below, awaiting user approval.

## Confirmed queue order

Confirmed by the user on 2026-08-05 (QCLI-6); QCLI-7 and QCLI-8 each added
and approved on 2026-08-05 following their originating wave's review.

1. QCLI-6 — Close remaining research-source-register enumeration gaps
   (Done, wave 1)
2. QCLI-7 — Enumerate the campaign Story in the research-source-register's
   'Prior QCLI research records' slice (Done, wave 2)
3. QCLI-8 — Reconcile QCLI-2.10's playbook against the QCLI-2.5 enumeration
   gap QCLI-6 already closed (Done, wave 3)

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:provenance | Research-source-register coherence/enumeration | QCLI-6 (Done), QCLI-7 (Done), QCLI-8 (Done) |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(none — all three waves fully settled)

## Needs a human / blocked

None currently outstanding.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up
work is filed. Each entry is a ready-to-run proposal.

- From wave 3's reviewer (QCLI-8 review, 2026-08-05): **Re-pin QCLI-2.10's
  playbook in the register after QCLI-8's merge invalidated its commit-pin**
  The register (`docs/reference/quest-cli-research-source-register.md`)
  still asserts `quest-cli-backlog-adoption-and-migration-playbook.md` was
  last amended at commit `8935551` (set by QCLI-6). QCLI-8 merged a new
  commit (`5efeb9d`, squashed into PR #23 as `1a61989`) that edits this same
  file, for reasons unrelated to the register — so the register's pin is now
  factually wrong the moment a reader checks it, the same live-claim
  standard that made QCLI-2.12's and QCLI-7's pin fixes non-optional. Same
  structural fix QCLI-7 already applied for QCLI-2.8's document: either
  re-pin to the new exact commit, or convert to a self-pin if a future task
  is expected to keep touching this document. Whichever follow-up task does
  this will itself co-edit the playbook and the register in the same
  pass — it must apply the QCLI-2.12 self-pin rule to its own edit too, not
  just fix the QCLI-8-introduced staleness.
  ACs (draft): (1) the register's exact-revision pin for
  `quest-cli-backlog-adoption-and-migration-playbook.md` reflects its true
  last-touch commit (or is converted to a self-pin if this task itself edits
  it again); (2) the running self-pinned/commit-pinned/distinct-SHA counts in
  the "Prior QCLI research records" slice are corrected to match; (3) no
  Classification field lost, no permitted use narrowed; (4)
  `lore check/validate/orphans --strict` all clean.
  **Separately, flagged for the user's judgment rather than drafted as an
  AC**: the reviewer noted this pin-staleness pattern has now recurred five
  times (three failed migration-ledger pins, QCLI-2.8's conversion, and this
  one) and suggested the recurrence itself — not any single stale SHA — may
  be the real defect, worth an owner-level decision on whether the register
  should pin task-editable documents differently in general (e.g., defaulting
  new admissions to self-pins) rather than continuing to patch instances one
  at a time.

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
  one) — became the proposal that turned into QCLI-8.

- 2026-08-05 — wave 3 (tasks: QCLI-8): User approved filing wave 2's
  proposed follow-up and proceeding immediately; task created and onboarded
  directly into this campaign (deps QCLI-6, QCLI-2.10, both already Done —
  ready-now). Single-member wave. Worker implemented in treehouse slot 1
  (`fix/qcli-8-playbook-reconciliation`, based on `dev @ 1354694`):
  reconciled both stale references in QCLI-2.10's playbook (a Sources-table
  classification cell and a narrative caveat paragraph) using the same
  inline-supersession pattern as QCLI-7's precedent, without touching the
  register itself (correctly out of scope). Also fixed pre-existing,
  task-unrelated drift blocking the gates: QCLI-8 itself had never been
  `lore link`-coupled to the campaign Story (orphan-gate failure), and the
  Story's managed block still showed QCLI-7 as In Progress despite its
  settlement to Done — both closed via `lore link` + `lore sync`, confirmed
  by the reviewer as genuinely pre-existing and mechanical, not scope creep.
  Reviewer re-derived every factual claim from git independently (SHA, date,
  member count), confirmed byte-for-byte preservation of both original
  caveats, and re-ran all three lore gates clean; verdict **approve**, all 3
  ACs confirmed. Merge hit one mechanical rebase conflict in QCLI-8's own
  task-file frontmatter (same class as wave 2) — resolved by the orchestrator
  the same way. Reviewer separately identified a required, non-blocking
  follow-up: this merge invalidates the register's own pin for the very
  document QCLI-8 edited (QCLI-2.10's playbook), the same pin-staleness class
  QCLI-2.12 and QCLI-7 already fixed elsewhere, now recurring a fifth time
  overall — proposed above, pending user approval, along with the reviewer's
  broader observation that the recurrence itself may warrant an owner-level
  design decision. Merged squash via PR #23 as `1a61989`. Settled: QCLI-8 →
  Done, all 3 ACs checked.

Campaign complete: the queue holds three Done tasks (QCLI-6, QCLI-7, QCLI-8)
and 0 ready/blocked. No further waves to run without a new task. See the R6
report for the full session summary and the proposed follow-up above,
pending user approval.
