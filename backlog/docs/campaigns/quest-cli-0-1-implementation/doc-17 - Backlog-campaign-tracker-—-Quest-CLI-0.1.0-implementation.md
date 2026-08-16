---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-16 12:31'
tags:
  - quest
  - quest-0.1
  - campaign
  - implementation
---
## Scope and authority

- Confirmed scope: deliver Quest CLI 0.1.0 foundation-up.

## State

- Resolved: QCLI-72 through QCLI-87, plus QCLI-90.
- In flight: none.
- Blocked: QCLI-88 requires LCLI-332.
- Ready: QCLI-89 Jira Cloud importer.

## Frontier

| Task | State | Delivery/evidence | Next action |
| --- | --- | --- | --- |
| QCLI-86 | Done | Generic engine now detects post-apply source drift and safely compensates unchanged migration-owned target records. | Settled. |
| QCLI-87 | Done | Read-only Backlog importer delivered with lifecycle/fidelity/provenance mapping, configurable directory and full symlink containment, and compensation integration. 112 tests passed before settlement. | Settled. |
| QCLI-89 | Ready | Depends on delivered QCLI-74 and QCLI-86. | Activate, plan, and implement Jira CLI importer in an isolated worktree. |

## Queue

- QCLI-88 waits on QCLI-87 and LCLI-332; QCLI-91 waits on QCLI-87..90.

## Wave log

- 2026-08-16 — QCLI-86 drift compensation delivered through `40dbd8a`, independently reviewed, and validated.
- 2026-08-16 — QCLI-87 delivered through `9ea0e08`: source inventory and provenance, bounded path containment, approved drift compensation, Backlog/Lore settlement, and Treehouse cleanup completed.
- 2026-08-16 — Session renewal requested after housekeeping; QCLI-89 is the next automatic action.
