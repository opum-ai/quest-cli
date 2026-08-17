---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 06:38'
---
## Contract

- Mode: autonomous-docs.
- Scope: quest-cli documentation and repository-process work only, under the governing `AGENTS.md` bare-init authority.
- Queue rule: dependencies, then priority and ordinal.

## Repository

| Repository | Task ids | AGENTS authority | Integration base | Required gates |
| --- | --- | --- | --- | --- |
| `quest-cli` | QCLI-97, QCLI-97.2 through QCLI-97.6 | Bare init authorizes documentation/repository-process work only; product-code work requires explicit authority. | `dev` `d2d047e658b016abc92d1bd800c6e011a06aa6a8` | Task-specific tests, `lore check --strict` for docs, diff check, review. |

## Frontier

- Resolved: 1; in flight: 0; blocked: 1 parent feature; ready within the authorized documentation/repository-process scope: 0.

## Queue

| Order | Task | Dependencies | State | Wave | Likely paths |
| --- | --- | --- | --- | --- | --- |
| 1 | QCLI-97.2 | none | To Do, outside bare-init scope | Held | CLI, workspace config, agent instructions, tests |
| 2 | QCLI-97.3 | none | To Do, outside bare-init scope | Held | CLI, domain/application, operations tests |
| 3 | QCLI-97.4 | none | To Do, outside bare-init scope; archival decision required | Held | task lifecycle/drafts, migration/fault tests |
| 4 | QCLI-97.5 | QCLI-97.2 | To Do, outside bare-init scope; public Lore adapter contract required | Held | Quest adapter and cross-product conformance |
| 5 | QCLI-97.6 | QCLI-97.2, QCLI-97.3, QCLI-97.4, QCLI-97.5 | To Do, outside bare-init scope | Held | qualification and release evidence |

## Resolved

| Task | Wave | Disposition | Evidence pointer |
| --- | --- | --- | --- |
| QCLI-97.1 | Pre-campaign audit | Done | `docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md` at `d2d047e`. |

## Human decisions and blockers

- Explicit product-code authority is required to implement QCLI-97.2 through QCLI-97.6. The requested work changes the public Quest CLI (`init`, agent instructions, lifecycle, planning/operations) and defines a public Lore adapter contract; bare autonomous-docs authority does not cover it.
- Any Lore CLI repository change or cross-repository release coordination needs separate authority because the campaign is quest-cli-only.

## Wave log

- 2026-08-17 — Initialized after grounding `dev` at `d2d047e`. The new parity audit is complete, but all remaining ready tasks are product-code features outside bare-init authority; no implementation wave dispatched.
