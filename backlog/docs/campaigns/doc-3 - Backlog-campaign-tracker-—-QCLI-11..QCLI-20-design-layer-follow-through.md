---
id: doc-3
title: Backlog campaign tracker — QCLI-11..QCLI-20 design-layer follow-through
type: other
created_date: '2026-08-05 12:33'
updated_date: '2026-08-05 12:34'
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
(init, before wave 1), 10 ready, 0 blocked, 0 in flight.

No task in this campaign has a Backlog `dependencies` entry. Every member is
independently startable; wave composition is bounded by the file-conflict graph
and the wave-size cap, not by dependency order.

## Confirmed queue order

Confirmed by the user on 2026-08-05 via the init interview, principle
"lowest-risk first": cheapest and most mechanical work validates the wave
machinery before anything consequential runs through it. This is the
wave-builder's tie-break, NOT a guarantee that any task lands in any particular
wave.

1. QCLI-12 — Fix the stale QCLI-2.8 dependency-order row in the research programme Spec
2. QCLI-13 — Backlink the adoption playbook from the component charter and migration ledger
3. QCLI-14 — Correct the bin-path row in the packaging contract's Description column
4. QCLI-15 — Audit two unresolved register findings: the untraceable Allowed value and QCLI-2.12's F4 and F5
5. QCLI-16 — Audit and correct the licensing-source misattribution in the contracts and delivery graph
6. QCLI-17 — Correct the open component decisions register's Backlog.md reclassification-trigger claim
7. QCLI-11 — Record quest-cli's activation-gate evidence and decision time
8. QCLI-18 — Propose the CLI result contract: envelope shape, exit-code table, not-found convention, and anomaly placement
9. QCLI-19 — Propose the canonical identifier grammar and authored-record layout
10. QCLI-20 — Propose the scale target and the projection sizing basis it implies

## Clusters

Every member carries a distinct cluster label, because every member writes to a
distinct file. Cluster collision is not the real constraint here — authored-file
ownership is — but the labels are kept disjoint so the wave builder does not
serialize work that is genuinely parallel.

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| `cluster:convention` | The research programme Spec | QCLI-12 |
| `cluster:adoption` | The adoption playbook and its inbound links | QCLI-13 |
| `cluster:packaging` | The packaging contract | QCLI-14 |
| `cluster:provenance` | The research source register | QCLI-15 |
| `cluster:synthesis` | The component contracts and delivery graph | QCLI-16 |
| `cluster:migration` | The open component decisions register, migration slice | QCLI-17 |
| `cluster:lore-gate` | The activation-gate evidence record (new document) | QCLI-11 |
| `cluster:cli-contract` | CLI result contract proposal (new document) | QCLI-18 |
| `cluster:identity` | Identifier grammar proposal (new document) | QCLI-19 |
| `cluster:projection` | Scale target proposal (new document) | QCLI-20 |

### Authored-file ownership

Exactly one wave member may edit any pre-existing document. Pre-verified
disjoint targets, so all ten could in principle run concurrently were it not for
the wave-size cap of 6:

| Task | Writes to |
| ---- | --------- |
| QCLI-12 | `docs/specs/quest-cli-pre-implementation-research-program.md` |
| QCLI-13 | `docs/reference/quest-cli-component-charter.md`, `docs/reference/former-ocli-to-qcli-migration-ledger.md` |
| QCLI-14 | `docs/reference/quest-cli-packaging-contract.md` |
| QCLI-15 | `docs/reference/quest-cli-research-source-register.md` |
| QCLI-16 | `docs/reference/quest-cli-component-contracts-and-delivery-graph.md` |
| QCLI-17 | `docs/reference/quest-cli-open-component-decisions.md`, and possibly `docs/specs/quest-cli-delivery-roadmap.md` and `docs/specs/quest-cli-functional-requirements.md` |
| QCLI-11, 18, 19, 20 | New documents only |

QCLI-17's contingent reach into the roadmap and requirements Specs is the one
soft edge. If a later task needs either of those files, serialize it against
QCLI-17 rather than assuming disjointness.

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(empty — no wave dispatched yet)

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

None outstanding at init. The residual items the register enumerates were
reviewed with the user on 2026-08-05; the agent-resolvable ones became QCLI-12
through QCLI-17, and the rest are recorded under Needs a human above or are
out-of-repository.

Two register entries were deliberately NOT filed and are recorded here so the
decision is legible rather than silent:

- **The `browser` HTTP endpoint boundary** (QCLI-2.5 finding 13). Flagged for
  QCLI-2.8, which declined to rule. It is a decision, not a defect, and it only
  matters if Quest ever mirrors that surface.
- **`LCLI-316`, filed in `lore-cli` and left uncommitted.** Out of repository.
  Whoever next works in `lore-cli` should commit it; no quest-cli mechanism
  tracks it.

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
