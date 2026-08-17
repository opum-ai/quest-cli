---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 06:45'
---
## Contract

- Mode: autonomous-docs with explicit owner authorization for QCLI-97 product-code implementation in `quest-cli`.
- Scope: quest-cli only; any Lore CLI repository change remains outside scope.
- Queue rule: dependencies, then priority and ordinal.

## Repository

| Repository | Task ids | AGENTS authority | Integration base | Required gates |
| --- | --- | --- | --- | --- |
| `quest-cli` | QCLI-97, QCLI-97.2 through QCLI-97.6 | Explicit owner authorization covers product code in quest-cli; no sibling repository writes. | `dev` `3677564509d6e0dbc142f412b6bdd6b95705f697` | Task-specific tests, `lore check --strict` for docs, diff check, review. |

## Frontier

- Resolved: 1; in flight: QCLI-97.2, QCLI-97.3, and QCLI-97.4; blocked: QCLI-97.5 cross-repository adapter coordination; ready: none.

## Queue

| Order | Task | Dependencies | State | Wave | Likely paths |
| --- | --- | --- | --- | --- | --- |
| 1 | QCLI-97.2 | none | In Progress | 1 | CLI, workspace config, agent instructions, tests |
| 2 | QCLI-97.3 | none | In Progress | 1 | CLI, typed planning records, operations tests |
| 3 | QCLI-97.4 | none | In Progress | 1 | task lifecycle/drafts, migration/fault tests |
| 4 | QCLI-97.5 | QCLI-97.2 | Blocked | Held | Quest adapter and cross-product conformance; no Lore repo authority |
| 5 | QCLI-97.6 | QCLI-97.2, QCLI-97.3, QCLI-97.4, QCLI-97.5 | To Do | Held | qualification and release evidence |

## Resolved

| Task | Wave | Disposition | Evidence pointer |
| --- | --- | --- | --- |
| QCLI-97.1 | Pre-campaign audit | Done | `docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md` at `d2d047e`. |

## Human decisions and blockers

- The owner authorized QCLI-97 product-code work on 2026-08-17, including Backlog-compatible archival/retention behavior.
- QCLI-97.5 remains blocked until a public Quest-to-Lore adapter contract can be coordinated; any required Lore CLI repository change needs separate authority.

## Wave log

- 2026-08-17 — Initialized after grounding `dev` at `d2d047e`; parity audit QCLI-97.1 was already complete.
- 2026-08-17 — Owner authorized quest-cli product implementation. QCLI-97.2, QCLI-97.3, and QCLI-97.4 activated after independent design reconnaissance; shared CLI routing and manifest integration will be serialized.
