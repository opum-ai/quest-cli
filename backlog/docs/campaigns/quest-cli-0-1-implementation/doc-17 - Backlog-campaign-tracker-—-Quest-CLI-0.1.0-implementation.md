---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-16 03:23'
tags:
  - quest
  - quest-0.1
  - campaign
  - implementation
---
## Scope and authority

- Confirmed scope: deliver Quest CLI 0.1.0 foundation-up. Readiness is live; independent migration adapters may run in parallel when isolated.

## State

- Resolved: QCLI-72, QCLI-73, QCLI-74, QCLI-75, QCLI-76, QCLI-77, QCLI-78, QCLI-79, QCLI-80, QCLI-81, QCLI-82, QCLI-83, QCLI-84, QCLI-85, QCLI-86, QCLI-90.
- In flight: none.
- Ready: QCLI-87 Backlog.md issue importer; QCLI-89 Jira Cloud importer.
- External/owner gated: QCLI-88 requires LCLI-332; QCLI-95 and Lore publication tasks require explicit authorization.

## Frontier

| Task | State | Delivery/evidence | Next action |
| --- | --- | --- | --- |
| QCLI-86 | Done | Generic migration engine delivered at `27c8ba0`: deterministic source-guarded preview/apply, persisted mappings, bounded shadow, recovery, and safe rollback. Independent review found and remediated atomicity gaps; 97 tests and source-scoped checks pass. | Settled; release Treehouse lease. |
| QCLI-87 | Ready | Depends only on delivered QCLI-73 and QCLI-86. | Implement Backlog current-state importer in an isolated worktree. |
| QCLI-89 | Ready | Depends only on delivered QCLI-74 and QCLI-86. | Implement Jira CLI importer in a separate isolated worktree after capacity is available. |

## Queue

- QCLI-88 waits on QCLI-87 and LCLI-332; QCLI-91 waits on QCLI-87..90.

## Wave log

- 2026-08-15 — QCLI-72..75 delivered as prior foundation slices.
- 2026-08-15 — QCLI-76 through QCLI-84 and QCLI-90 delivered; their detailed evidence remains on their Backlog tasks.
- 2026-08-16 — Restored at `9e5c1cd`, reconciled stale QCLI-84 state, and implemented QCLI-85 through `7131711`. Query and adapter review findings on cache tampering and corrupt durable cursors were remediated.
- 2026-08-16 — Added representative QCLI-85 scale evidence and settled it Done. The full Biome script remains environment-blocked by Treehouse nested available-worktree configuration; source-scoped Biome, type/layer checks, focused projection tests, and the full Bun suite pass.
- 2026-08-16 — Restored QCLI-86 at `04ac42c`; dispatched one isolated Treehouse writer from the same pinned base.
- 2026-08-16 — Delivered QCLI-86 through `27c8ba0`, then checked all acceptance criteria after independent review. Full Bun suite (97), TypeScript, source-scoped Biome, layer, Lore validation/check, and diff checks pass.
- 2026-08-16 — QCLI-87 and QCLI-89 became independently ready; next wave awaits Treehouse capacity.
