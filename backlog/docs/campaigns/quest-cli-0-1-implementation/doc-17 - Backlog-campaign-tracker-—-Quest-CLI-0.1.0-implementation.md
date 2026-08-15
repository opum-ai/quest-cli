---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-15 19:50'
tags:
  - quest
  - quest-0.1
  - campaign
  - implementation
---
## Scope and authority

- Confirmed scope: deliver Quest CLI 0.1.0 foundation-up. Readiness is live; sequential one-task waves are the confirmed execution model.

## State

- Resolved: QCLI-72, QCLI-73, QCLI-74, QCLI-75, QCLI-76, QCLI-77, QCLI-78, QCLI-79, QCLI-80.
- In flight: none.
- Ready: QCLI-81, QCLI-83, QCLI-90.
- External/owner gated: QCLI-88 requires LCLI-332; QCLI-95 and Lore publication tasks require explicit authorization.

## Frontier

| Task | State | Delivery/evidence | Next action |
| --- | --- | --- | --- |
| QCLI-80 | Done | Integrated on `dev` at `f993e6b`; task acceptance criteria verified by 9 targeted Bun tests, typecheck, layer check, source-scoped Biome lint/format, Lore strict gates, and diff check; clean Treehouse branch is patch-equivalent | Push the integrated wave, settle its lease, then activate the widest conflict-free ready wave |
| QCLI-81 | Ready | Depends only on QCLI-80 | Dispatch claims/leases slice after QCLI-80 delivery |
| QCLI-83 | Ready | Depends only on QCLI-80 | Assess independent contract-surface budget for concurrent dispatch |
| QCLI-90 | Ready | Optional Lore concept linking | Assess file and Lore-surface conflict edge after current-wave settlement |

## Queue

- Readiness recomputed after QCLI-80 completion: QCLI-81, QCLI-83, and QCLI-90 are eligible. All other work follows formal Backlog dependencies or remains owner-gated.

## Wave log

- 2026-08-15 — QCLI-72..75 delivered as prior foundation slices.
- 2026-08-15 — QCLI-76 delivered to `origin/dev` at `1f2fc44`: command-contract shell, independent review, and cumulative checks.
- 2026-08-15 — QCLI-77 delivered to `origin/dev` at `e9aebb0`: authored records hardened with Git-CAS counter port, typed codecs, actor-link and basis validation, fail-closed replay; independent review and all available gates passed.
- 2026-08-15 — QCLI-78 delivered to `origin/dev` at `a7d40e8`: safe workspace initialization/discovery/enrollment, including nested-root correction; independent review and all available gates passed.
- 2026-08-15 — QCLI-79 delivered to `origin/dev` at `90dfe78`: operation-owned isolated-index mutation, common-directory preparation locks, durable recovery journals, structured CAS/push conflicts, and deterministic synchronization; independent review and all gates passed.
- 2026-08-15 — QCLI-80 delivered locally on `dev` at `f993e6b`: authoritative task graph, lifecycle, CRUD/search/read paths, graph validation, and claim-aware readiness; 9 targeted Bun tests plus type, layer, source-quality, Lore strict, and diff gates passed; pending authorized `origin/dev` delivery and clean branch/lease settlement.
