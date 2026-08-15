---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-15 17:29'
tags:
  - quest
  - quest-0.1
  - campaign
  - implementation
---
# Backlog campaign tracker — Quest CLI 0.1.0 implementation

## Scope and authority

- Confirmed scope: deliver Quest CLI 0.1.0 foundation-up. Readiness is live; sequential one-task waves are the confirmed execution model.

## State

- Resolved: QCLI-72, QCLI-73, QCLI-74, QCLI-75, QCLI-76.
- In flight: QCLI-77.
- Ready: none.
- External/owner gated: QCLI-88 requires LCLI-332; QCLI-95 and Lore publication tasks require explicit authorization.

## Frontier

| Task | State | Delivery/evidence | Next action |
| --- | --- | --- | --- |
| QCLI-76 | Done | Delivered to `origin/dev` at `1f2fc44`; code/Lore gates passed | Delivered |
| QCLI-77 | In progress | Record primitives at `22d3809` and complete Unicode folding at `0592592`; isolated writer check passed (14 tests/63 assertions) | Resolve primary-checkout Bun temp/install and Treehouse nested-Biome verification, then review and finalize |

## Queue

- QCLI-78 awaits QCLI-77; all later tasks follow formal Backlog dependencies and must be recomputed after QCLI-77 settlement.

## Wave log

- 2026-08-15 — QCLI-72..75 delivered as prior foundation slices.
- 2026-08-15 — QCLI-76 delivered to `origin/dev` at `1f2fc44`: command-contract shell, independent review, and cumulative checks.
- 2026-08-15 — QCLI-77 implementation integrated locally at `0592592`; full Unicode-folding dependency added, pending final primary-checkout gate.
