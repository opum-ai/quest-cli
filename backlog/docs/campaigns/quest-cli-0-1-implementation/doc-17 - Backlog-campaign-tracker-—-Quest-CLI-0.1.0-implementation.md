---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-15 18:57'
tags:
  - quest
  - quest-0.1
  - campaign
  - implementation
---
## Scope and authority

- Confirmed scope: deliver Quest CLI 0.1.0 foundation-up. Readiness is live; sequential one-task waves are the confirmed execution model.

## State

- Resolved: QCLI-72, QCLI-73, QCLI-74, QCLI-75, QCLI-76, QCLI-77, QCLI-78, QCLI-79.
- In flight: QCLI-80 on isolated Treehouse lease `055d50eabd924958ae0ca44b78373c0e`, branch `campaign/qcli-80-task-graph`, pinned from `90dfe78`.
- Ready: none.
- External/owner gated: QCLI-88 requires LCLI-332; QCLI-95 and Lore publication tasks require explicit authorization.

## Frontier

| Task | State | Delivery/evidence | Next action |
| --- | --- | --- | --- |
| QCLI-79 | Done | Delivered to `origin/dev` at `90dfe78`; 37 Bun tests/169 assertions, type/layer/source-lint/source-format, Lore strict and diff gates passed; independently reviewed | Delivered |
| QCLI-80 | In flight | Isolated implementation wave dispatched from `90dfe78`; task reference `docs/reference/quest-cli-dependency-readiness-and-blocking-design.md` is stale, so the current `docs/specs/quest-cli-dependency-ready-set-and-blocking-design.md` is the governing design input | Review returned task-graph implementation, validate and deliver to `dev` |

## Queue

- QCLI-81 awaits QCLI-80; all later tasks follow formal Backlog dependencies and must be recomputed after QCLI-80 settlement.

## Wave log

- 2026-08-15 — QCLI-72..75 delivered as prior foundation slices.
- 2026-08-15 — QCLI-76 delivered to `origin/dev` at `1f2fc44`: command-contract shell, independent review, and cumulative checks.
- 2026-08-15 — QCLI-77 delivered to `origin/dev` at `e9aebb0`: authored records hardened with Git-CAS counter port, typed codecs, actor-link and basis validation, fail-closed replay; independent review and all available gates passed.
- 2026-08-15 — QCLI-78 delivered to `origin/dev` at `a7d40e8`: safe workspace initialization/discovery/enrollment, including nested-root correction; independent review and all available gates passed.
- 2026-08-15 — QCLI-79 delivered to `origin/dev` at `90dfe78`: operation-owned isolated-index mutation, common-directory preparation locks, durable recovery journals, structured CAS/push conflicts, and deterministic synchronization; independent review and all gates passed.
- 2026-08-15 — QCLI-80 activated and dispatched from `90dfe78` to isolated branch `campaign/qcli-80-task-graph`; implementation uses the live ready-set design Spec because the task’s listed design filename is stale.
