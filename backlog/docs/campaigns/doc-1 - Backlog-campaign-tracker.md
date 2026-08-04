---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-04 06:01'
updated_date: '2026-08-04 06:01'
---
# Backlog campaign tracker

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Campaign scope

QCLI-2 "Prepare Quest's clean-room research foundation before implementation"
and its 9 spike subtasks (QCLI-2.1–QCLI-2.9). QCLI-2 itself is the parent
epic — it is not dispatched as a worker task; it is satisfied once its
children are Done and settled separately by the user/orchestrator, not
checked off mechanically.

Every task in this campaign is research/documentation output under the
project's clean-room gate (see `docs/reference/quest-cli-component-charter.md`
and `docs/reference/former-ocli-to-qcli-migration-ledger.md`): no product
source, runtime dependency, executable scaffolding, package publication, or
release. Workers must not inspect or port legacy Opum/OCLI implementation
source or tests — only admitted, cited requirements/narratives. Any
Quest-wide vocabulary/architecture/roadmap finding is a proposal to
`quest-doc`, never treated as normative here.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of
2026-08-04 (init), 9 tasks queued, 1 ready now (QCLI-2.1), 8 blocked on
dependencies.

## Confirmed queue order

Confirmed by the user on 2026-08-04. This is the wave-builder's tie-break, NOT
a guarantee that any task lands in any particular wave.

1. QCLI-2.1 — Revalidate Quest research provenance and the migration boundary
2. QCLI-2.2 — Reconcile legacy Opum requirements into Quest CLI candidates
3. QCLI-2.7 — Track Lore dependencies and Quest activation evidence
4. QCLI-2.9 — Resolve the `quest` npm package allocation and provenance gate
5. QCLI-2.3 — Turn prototype failures into Quest black-box scenarios
6. QCLI-2.4 — Define Quest CLI actors, workflows, and domain-language candidates
7. QCLI-2.5 — Research Backlog migration fidelity through public contracts
8. QCLI-2.6 — Model Quest Git, filesystem, and concurrency threats
9. QCLI-2.8 — Synthesize Quest CLI research into activation-ready component contracts

## Clusters

| Cluster label | Covers | Tasks |
| --- | --- | --- |
| cluster:provenance | Source/provenance register revalidation | QCLI-2.1 |
| cluster:requirements | Legacy Opum requirement reconciliation | QCLI-2.2 |
| cluster:lore-gate | Lore dependency/evidence matrix | QCLI-2.7 |
| cluster:packaging | npm package allocation/provenance | QCLI-2.9 |
| cluster:scenarios | Black-box acceptance scenarios | QCLI-2.3 |
| cluster:domain | Actors/workflows/domain language | QCLI-2.4 |
| cluster:migration | Backlog migration fidelity contract | QCLI-2.5 |
| cluster:threat-model | Git/filesystem/concurrency threat model | QCLI-2.6 |
| cluster:synthesis | Final activation-ready synthesis (depends on all above) | QCLI-2.8 |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

## Needs a human / blocked

None currently.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up
work is filed. Each entry is a ready-to-run proposal.

## Wave log

None yet — campaign initialized 2026-08-04, no waves dispatched.
