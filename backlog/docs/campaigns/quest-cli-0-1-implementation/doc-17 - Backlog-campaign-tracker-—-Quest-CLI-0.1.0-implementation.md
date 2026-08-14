---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-14 18:27'
tags:
  - quest
  - quest-0.1
  - campaign
  - implementation
---
# Backlog campaign tracker — Quest CLI 0.1.0 implementation

## Scope and order confirmation

- Scope: deliver Quest CLI 0.1.0 foundation-up, including the standalone Git-native task system, Lore tracker compatibility, Backlog.md and Jira adoption, packaging, qualification, and release gates.
- Confirmed by the user: "Implement the plan." on 2026-08-14, following the approved decision-complete implementation plan.
- Order is a tie-break; readiness is recomputed live from Backlog dependencies, external gates, repository state, and file conflicts.
- Execution model: sequential one-task waves. No subagents were requested or authorized for this campaign.
- Coordinator worktree basis: local origin/dev at f17616791937ecaa5bd9067c29a6bd46de55a527 when initialized.

## Frontier

Informational snapshot only; never a promised next wave.

- No Quest task is ready at initialization: QCLI-72 has no local dependency but consumes the external actor ruling ODOC-57.
- External contract work may proceed independently: ODOC-57; Lore LCLI-330 -> LCLI-331 -> LCLI-332.
- QCLI-95 and Lore release tasks LCLI-332/LCLI-333 remain owner-authorized publication gates even after technical dependencies pass.

## Queue

| Order | Task | Cluster | Formal dependencies | State | Wave | Likely files | Note |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | QCLI-72 | contracts | — | externally gated | — | docs design layer | Consume ODOC-57 and freeze the implementation baseline. |
| 2 | QCLI-73 | contracts | QCLI-72 | To Do | — | Backlog migration docs/fixtures | Public-contract clean-room requalification. |
| 3 | QCLI-74 | contracts | QCLI-72 | To Do | — | Jira fidelity docs/fixtures | jira-cli-only qualification. |
| 4 | QCLI-75 | foundation | QCLI-72 | To Do | — | package.json, bun.lock, src/ | Lore-aligned scaffold and layer gate. |
| 5 | QCLI-76 | foundation | QCLI-75 | To Do | — | CLI/application contract | Results, diagnostics, config, manifest. |
| 6 | QCLI-77 | foundation | QCLI-73, QCLI-74, QCLI-76 | To Do | — | domain/records | IDs, aliases, actors, events, replay. |
| 7 | QCLI-78 | foundation | QCLI-77 | To Do | — | workspace adapters | Initialization and enrollment. |
| 8 | QCLI-79 | foundation | QCLI-78 | To Do | — | Git mutation adapter | CAS, sync, crash recovery. |
| 9 | QCLI-80 | core | QCLI-79 | To Do | — | task domain/application | Task graph, lifecycle, readiness. |
| 10 | QCLI-81 | core | QCLI-80 | To Do | — | claims domain/application | Leases and delegation. |
| 11 | QCLI-82 | core | QCLI-81 | To Do | — | gates domain/application | Evidence and completion enforcement. |
| 12 | QCLI-83 | interop | QCLI-80 | To Do | — | tracker contract/tests | Lore TrackerAdapter subprocess surface. |
| 13 | QCLI-84 | projection | QCLI-82 | To Do | — | Bun SQLite adapter | Projection schema and rebuild. |
| 14 | QCLI-85 | projection | QCLI-84 | To Do | — | projection queries/scale | Incremental freshness and scale. |
| 15 | QCLI-86 | migration | QCLI-85 | To Do | — | generic migration engine | Plan, approval, shadow, cutover, rollback. |
| 16 | QCLI-87 | migration | QCLI-73, QCLI-86 | To Do | — | Backlog importer | Current-state issue adoption. |
| 17 | QCLI-88 | migration | QCLI-87 | externally gated | — | Lore saga adapter | Also requires released Lore contract LCLI-332. |
| 18 | QCLI-89 | migration | QCLI-74, QCLI-86 | To Do | — | Jira importer | Core-plus-comments adoption. |
| 19 | QCLI-90 | interop | QCLI-76, QCLI-80 | To Do | — | Lore linking adapter | Optional public-record linking. |
| 20 | QCLI-91 | qualification | QCLI-87, QCLI-88, QCLI-89, QCLI-90 | To Do | — | end-to-end/fault suites | Migration and interop release gate. |
| 21 | QCLI-92 | release | QCLI-83, QCLI-85, QCLI-91 | To Do | — | launcher and npm packages | Six compiled platform packages. |
| 22 | QCLI-93 | release | QCLI-92 | To Do | — | CI/qualification | Full release and supply-chain gate. |
| 23 | QCLI-94 | release docs | QCLI-91, QCLI-92 | To Do | — | docs/runbooks, README | Lore-managed operating documentation. |
| 24 | QCLI-95 | publication | QCLI-93, QCLI-94 | owner gated | — | release truth/package docs | Explicit authorization required to publish. |

## Resolved

| Task | Date/wave | Evidence and disposition |
| --- | --- | --- |
| — | — | No implementation task resolved at campaign initialization. |

## Not queued — blocked, deferred, or human decision required

- ODOC-57 (opum-doc): ratify the minimal local actor and delegation vocabulary; external gate for QCLI-72.
- LCLI-330 -> LCLI-331 -> LCLI-332 (lore-cli): specify, implement, and release Lore's Backlog knowledge-adoption contract; LCLI-332 gates QCLI-88.
- LCLI-315.4 (lore-cli): implement Quest as the default tracker only after QCLI-95 proves publication.
- LCLI-333 (lore-cli): publish the subsequent Lore default-backend release; depends on LCLI-315.4 and LCLI-332.
- Lore Story `stories/deliver-quest-cli-0-1-0` owns QCLI-72 through QCLI-95; Lore created the reciprocal `doc:stories/deliver-quest-cli-0-1-0` task labels after commit authority was granted.
- Remote delivery of these campaign-planning artifacts was explicitly authorized on 2026-08-14. Publication remains separately gated: QCLI-95, LCLI-332, and LCLI-333 must stop for explicit owner authorization.

## Wave log

- 2026-08-14 — Initialized the confirmed implementation campaign from local origin/dev f1761679. Created milestone Quest CLI 0.1.0 and QCLI-72 through QCLI-95 with formal dependencies, documentation references, acceptance criteria, and likely-file metadata. Created external companion records ODOC-57 and LCLI-330 through LCLI-333, refining existing LCLI-315.4 rather than duplicating it. No implementation task was activated.
- 2026-08-14 — Commit and push authority granted. Created Lore Story `stories/deliver-quest-cli-0-1-0`, coupled QCLI-72 through QCLI-95, and prepared the three campaign branches for remote delivery; publication authority remains excluded.
