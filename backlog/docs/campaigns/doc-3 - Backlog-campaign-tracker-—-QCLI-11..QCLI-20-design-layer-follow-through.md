---
id: doc-3
title: Backlog campaign tracker — QCLI-11..QCLI-20 design-layer follow-through
type: other
created_date: '2026-08-05 12:33'
updated_date: '2026-08-05 14:39'
---
# Backlog campaign tracker — QCLI-11..QCLI-20 design-layer follow-through

Protocol: restore -> recompute the ready/conflict graph from Backlog -> acquire
worktrees -> mark the acquired members dispatched -> implement + review in
parallel -> serialize the merge -> settle tasks and write this doc once more ->
loop until the queue is empty or blocked -> write handover.

Campaign opened 2026-08-05, immediately after QCLI-10 settled. Its members are
the follow-through from the design layer QCLI-10 produced: residual defects that
lived only in settlement notes, one factual error the design layer itself
introduced, the activation-gate evidence record, and proposals for the Phase 1
component decisions.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of 2026-08-05
after wave 1 plus filing two integration-review follow-ups, 6 ready (QCLI-11,
18, 19, 20, 21, 22), 0 blocked, 0 in flight, 6 Done (QCLI-12..17).

No task in this campaign has a Backlog `dependencies` entry. Every member is
independently startable; wave composition is bounded by the file-conflict graph
and the wave-size cap, not by dependency order.

## Confirmed queue order

Confirmed by the user on 2026-08-05 via the init interview, principle
"lowest-risk first": cheapest and most mechanical work validates the wave
machinery before anything consequential runs through it. This is the
wave-builder's tie-break, NOT a guarantee that any task lands in any particular
wave.

1. QCLI-12 — Fix the stale QCLI-2.8 dependency-order row in the research programme Spec — **Done, wave 1**
2. QCLI-13 — Backlink the adoption playbook from the component charter and migration ledger — **Done, wave 1**
3. QCLI-14 — Correct the bin-path row in the packaging contract's Description column — **Done, wave 1**
4. QCLI-15 — Audit two unresolved register findings: the untraceable Allowed value and QCLI-2.12's F4 and F5 — **Done, wave 1**
5. QCLI-16 — Audit and correct the licensing-source misattribution in the contracts and delivery graph — **Done, wave 1**
6. QCLI-17 — Correct the open component decisions register's Backlog.md reclassification-trigger claim — **Done, wave 1**
7. QCLI-11 — Record quest-cli's activation-gate evidence and decision time
8. QCLI-18 — Propose the CLI result contract: envelope shape, exit-code table, not-found convention, and anomaly placement
9. QCLI-19 — Propose the canonical identifier grammar and authored-record layout
10. QCLI-20 — Propose the scale target and the projection sizing basis it implies

Appended after wave 1, approved by the user on 2026-08-05 (not part of the
original init-time order, so no relative priority is implied among 11-14 vs.
these two — the wave builder treats all six as equally ready):

11. QCLI-21 — Reconcile the open component decisions register and contracts graph against the QCLI-12..17 corrections
12. QCLI-22 — Re-pin the research source register's member pins invalidated by the QCLI-12..17 wave

## Clusters

Every member carries a distinct cluster label, because every member writes to a
distinct file. Cluster collision is not the real constraint here — authored-file
ownership is — but the labels are kept disjoint so the wave builder does not
serialize work that is genuinely parallel.

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| `cluster:convention` | The research programme Spec | QCLI-12 (Done) |
| `cluster:adoption` | The adoption playbook and its inbound links | QCLI-13 (Done) |
| `cluster:packaging` | The packaging contract | QCLI-14 (Done) |
| `cluster:provenance` | The research source register | QCLI-15 (Done), QCLI-22 |
| `cluster:synthesis` | The component contracts and delivery graph | QCLI-16 (Done) |
| `cluster:migration` | The open component decisions register, migration slice | QCLI-17 (Done) |
| `cluster:lore-gate` | The activation-gate evidence record (new document) | QCLI-11 |
| `cluster:cli-contract` | CLI result contract proposal (new document) | QCLI-18 |
| `cluster:identity` | Identifier grammar proposal (new document) | QCLI-19 |
| `cluster:projection` | Scale target proposal (new document) | QCLI-20 |
| `cluster:tracking-reconciliation` | The open component decisions register's tracking table + D1, and the contracts graph | QCLI-21 |

Note: QCLI-22 shares `cluster:provenance` with the now-Done QCLI-15 — both
touch the research source register. This is intentional; the cluster label
reflects file ownership, not wave membership, and QCLI-15 being Done means
there is no live conflict.

### Authored-file ownership

Exactly one wave member may edit any pre-existing document. Pre-verified
disjoint targets:

| Task | Writes to |
| ---- | --------- |
| QCLI-12 (Done) | `docs/specs/quest-cli-pre-implementation-research-program.md` |
| QCLI-13 (Done) | `docs/reference/quest-cli-component-charter.md`, `docs/reference/former-ocli-to-qcli-migration-ledger.md` |
| QCLI-14 (Done) | `docs/reference/quest-cli-packaging-contract.md` |
| QCLI-15 (Done) | `docs/reference/quest-cli-research-source-register.md` |
| QCLI-16 (Done) | `docs/reference/quest-cli-component-contracts-and-delivery-graph.md` |
| QCLI-17 (Done) | `docs/reference/quest-cli-open-component-decisions.md`, and `docs/specs/quest-cli-delivery-roadmap.md` (the soft edge fired — QCLI-17 did touch the roadmap; `quest-cli-functional-requirements.md` was checked and confirmed to need no edit) |
| QCLI-21 | `docs/reference/quest-cli-open-component-decisions.md`, `docs/reference/quest-cli-component-contracts-and-delivery-graph.md` |
| QCLI-22 | `docs/reference/quest-cli-research-source-register.md` |
| QCLI-11, 18, 19, 20 | New documents only |

QCLI-21 and QCLI-22 are file-disjoint from each other and from QCLI-11/18/19/20
— all six remaining members can in principle run in one wave (within the
wave-size cap of 6).

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(empty — wave 1 fully merged and settled, no wave dispatched since)

## Needs a human / blocked

No campaign member is blocked. Three items sit outside the campaign because an
agent cannot finish them:

- **Register D1, product license.** Owner-held. No admitted source records a
  choice, and licensing is a product decision, not a research finding.
- **Register D3, supported-platform matrix ownership.** Needs a human to assign
  ownership. The decision itself carries no Lore-evidence gate, so it becomes
  agent-workable once someone owns it.
- **Register D6, the product-wide actor and governance model.** Belongs in
  `quest-doc`, not this repository. No task in any repository has been filed for
  it, and filing one here would be the wrong repository.

Register D2 (runtime and native packaging) is structurally blocked
post-activation and is deliberately not in the campaign.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed.

Two register entries were deliberately NOT filed at init and are recorded here
so the decision is legible rather than silent:

- **The `browser` HTTP endpoint boundary** (QCLI-2.5 finding 13). Flagged for
  QCLI-2.8, which declined to rule. It is a decision, not a defect, and it only
  matters if Quest ever mirrors that surface.
- **`LCLI-316`, filed in `lore-cli` and left uncommitted.** Out of repository.
  Whoever next works in `lore-cli` should commit it; no quest-cli mechanism
  tracks it.

None outstanding as of 2026-08-05 post-wave-1: wave 1's integration review
drafted two follow-up tasks (tracking-document reconciliation, register
re-pinning); the user approved both on 2026-08-05 and they are now filed as
**QCLI-21** and **QCLI-22** — see Confirmed queue order and Authored-file
ownership above. No longer "proposed"; they are ordinary campaign members now.

## Wave log

- 2026-08-05 — init. Campaign created from the open queue plus user-approved
  additions. QCLI-10 settled first (all 5 subtasks Done; all 5 ACs checked
  against named evidence; merged to dev as 1330ecf, log sync dde1242).

  Two init-time verifications changed the planned scope, and both are worth
  carrying forward:

  1. **The Backlog.md v1.49.3 reclassification trigger has NOT fired.**
     `npm view backlog.md version` returns `1.49.3` on 2026-08-05, with
     `dist-tags.latest` = `1.49.3` and `time.modified` = 2026-08-03. The pinned
     version IS the current published release. The approved
     "v1.49.3 re-verification" task was therefore replaced by QCLI-17, which
     corrects the register's own false claim that the trigger had probably
     fired — an error the design layer introduced hours earlier and which was
     falsified by the first live check run against it.

  2. **The playbook backlink residual is half stale.** QCLI-2.10 recorded that
     the playbook and the charter/ledger were not backlinked "or vice versa".
     The playbook does cite both (lines 75, 427-428); only the inbound direction
     is missing. QCLI-13 was narrowed accordingly.

  Standing trap carried from doc-2, unchanged and still generic to SHA-pinning
  as a mechanism: any task editing a register-pinned document invalidates that
  pin on merge, whether or not the task intended to touch the register. QCLI-12,
  QCLI-13, QCLI-14, and QCLI-16 all edit documents the source register may pin;
  each carries an acceptance criterion requiring the pin be handled in the same
  pass or the need for a separate correction recorded.

- 2026-08-05 — wave 1 (tasks: QCLI-12, QCLI-13, QCLI-14, QCLI-15, QCLI-16,
  QCLI-17). All six dispatched into treehouse worktrees off wave base `ffe8487`,
  implemented and reviewed in parallel (mid-tier workers, top-tier reviewers),
  merged strictly serially, all settled Done.

  **Review rounds:** every one of the six required a `request_changes` round —
  none were architectural, all were fixable in a single fresh-worker fix pass
  (uncommitted notes, unrecorded downstream-invalidation findings, prose
  accuracy issues, one factual defect in an audit's own enumeration, one
  register-vs-contract wording contradiction the reviewer caught before it
  shipped). All six reached `approve` on the second review pass and merged
  clean.

  **Register-pin parallel-edit constraint held.** QCLI-12/13/14/16 were each
  instructed not to self-pin the research source register in-wave (to avoid a
  collision with QCLI-15, which owned the register this wave); all four
  complied and recorded their pin findings as notes-only follow-ups instead.
  Confirmed zero register diff for all four throughout.

  **Merge-time conflicts — two classes, both validated by disposition review
  before resolution, both proven safe by empirical dry-run:**
  1. Backlog task-file YAML frontmatter (`assignee`/`created_date`/`updated_date`)
     conflicting between the orchestrator's own campaign-bookkeeping commits on
     `dev` and each branch's own status edits. Resolution: take the branch side
     wholesale; `labels` and body content merge cleanly outside the hunk.
  2. Lore-*generated* files (`docs/log.md`, the Story's
     `<!-- lore:tasks -->` managed block) conflicting because each branch's
     local copy predates later merges. These are build artifacts regenerated
     wholesale by `lore sync` from the git DAG — resolution: clear the marker
     with either side, then run `lore sync` after the rebase completes.
     Verified via a throwaway-worktree replay of the whole wave that both
     resolution choices converge to the identical byte-for-byte `lore sync`
     output.

  All six merged via squash PRs (#25-#30), `dev` synced with `lore sync` after
  each merge. One drift found and fixed mid-wave: `dev` itself had fallen out
  of sync after the first two merges (a settlement pass skipped the post-merge
  `lore sync` step) — fixed directly on `dev`, and the post-merge-sync step was
  added to the remaining five merges to prevent recurrence. A second drift
  (story status/managed-block stale after the final settlement) was caught and
  fixed by the wave-level integration review before close.

  **Wave-level integration review** (after all six merged): found no content
  contradictions introduced by combining the six branches directly, but found
  that finishing six defects the design layer's own tracking documents
  describe left those tracking documents stale. Drafted two follow-up tasks;
  the user approved both and they were filed the same session as **QCLI-21**
  and **QCLI-22** (see Confirmed queue order). Also independently verified the
  register-pin-staleness follow-ups QCLI-12/13/14/16 recorded are all still
  genuinely outstanding (nothing in the wave incidentally fixed them), and
  folded them into QCLI-22 rather than filing four separate tasks.

  Merged SHAs: QCLI-12 `1dd4aa6` (PR #25), QCLI-13 `d871d32` (PR #26), QCLI-14
  `077d3be` (PR #27), QCLI-15 `6b78fd0` (PR #28), QCLI-16 `44a7ed8` (PR #29),
  QCLI-17 `fb8e8e3` (PR #30). `dev` head after settlement + doc updates +
  filing QCLI-21/22: `4d8224e`.
