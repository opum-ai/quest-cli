---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-15 01:22'
tags:
  - quest
  - quest-0.1
  - campaign
  - implementation
---
# Backlog campaign tracker — Quest CLI 0.1.0 implementation

## Scope and authority

- Scope: deliver Quest CLI 0.1.0 foundation-up, including the Git-native task system, Lore tracker compatibility, Backlog.md and Jira adoption, packaging, qualification, and release gates.
- Confirmed by the user: "Implement the plan." on 2026-08-14. Order is a tie-break; live dependencies, gates, repository state, and conflict edges determine readiness.
- Execution model: sequential one-task waves; no subagents were requested or authorized.

## Frontier

- QCLI-72 is delivered to `origin/dev` at `70e416c02a7f0e115b65028f97190a11a75ed051`.
- Ready next, with independent file budgets: QCLI-73 (Backlog public-surface requalification), QCLI-74 (Jira fidelity qualification), and QCLI-75 (Bun package scaffold). Execute serially under the confirmed sequential model.
- QCLI-95 and Lore release tasks LCLI-332/LCLI-333 remain explicit owner-authorized publication gates.

## Queue

| Order | Task | Cluster | Dependencies | State | Likely files | Note |
| ---: | --- | --- | --- | --- | --- | --- |
| 2 | QCLI-73 | contracts | QCLI-72 | Ready | Backlog migration docs/fixtures | Public-contract clean-room requalification |
| 3 | QCLI-74 | contracts | QCLI-72 | Ready | Jira fidelity docs/fixtures | jira-cli-only qualification |
| 4 | QCLI-75 | foundation | QCLI-72 | Ready | package.json, bun.lock, src/ | Lore-aligned scaffold and layer gate |
| 5 | QCLI-76 | foundation | QCLI-75 | Blocked | CLI/application contract | Results, diagnostics, config, manifest |
| 6 | QCLI-77 | foundation | QCLI-73, QCLI-74, QCLI-76 | Blocked | domain/records | IDs, aliases, actors, events, replay |
| 7–24 | QCLI-78–QCLI-95 | core through publication | Formal dependencies in Backlog | Blocked/deferred | See task metadata | Recompute after each settlement; QCLI-88 also needs LCLI-332 and QCLI-95 remains publication-gated |

## Resolved

| Task | Date/wave | Evidence and disposition |
| --- | --- | --- |
| QCLI-72 | 2026-08-15 / wave 1 | Reconciled Bun/Bun SQLite, ODOC-57 actors, Lore tracker seam, lifecycle timing, aliases, and migration preview semantics. `lore sync`, `lore validate --strict`, `lore check --strict`, and `git diff --check` passed; delivered at `70e416c`. |

## External or human-gated

- LCLI-330 -> LCLI-331 -> LCLI-332 (lore-cli) gates QCLI-88.
- LCLI-315.4 and LCLI-333 remain downstream of Quest publication.
- QCLI-95, LCLI-332, and LCLI-333 require explicit owner authorization for publication.

## Wave log

- 2026-08-14 — Initialized the confirmed campaign, created QCLI-72 through QCLI-95 and their dependencies, and coupled them to the Deliver Quest CLI 0.1.0 Story.
- 2026-08-14 — QCLI-72 activated after ODOC-57 was verified Done; first baseline reconciliation committed at `c7b1418`.
- 2026-08-15 — QCLI-72 final residual-claim sweep passed strict Lore gates, was finalized in Backlog, and delivered to `origin/dev` at `70e416c`. Next automatic action: activate QCLI-73 and record its plan.
