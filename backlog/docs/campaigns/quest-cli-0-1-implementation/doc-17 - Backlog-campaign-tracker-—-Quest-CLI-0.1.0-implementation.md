---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-15 18:56'
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
- In flight: none.
- Ready: QCLI-80.
- External/owner gated: QCLI-88 requires LCLI-332; QCLI-95 and Lore publication tasks require explicit authorization.

## Frontier

| Task | State | Delivery/evidence | Next action |
| --- | --- | --- | --- |
| QCLI-79 | Done | Reviewed and integrated on `dev` at source tree `8ef4417`: 37 Bun tests/169 assertions, type/layer/source-lint/source-format and diff checks passed; full lint-script exception is the reusable Treehouse nested root | Deliver validated wave to `origin/dev`; settle lease and recompute readiness |
| QCLI-80 | Ready | QCLI-79 is done; formal dependency frontier confirms eligibility | Activate, plan, and implement authoritative task graph/lifecycle in the next isolated wave |

## Queue

- QCLI-81 awaits QCLI-80; all later tasks follow formal Backlog dependencies and must be recomputed after QCLI-80 settlement.

## Wave log

- 2026-08-15 — QCLI-72..75 delivered as prior foundation slices.
- 2026-08-15 — QCLI-76 delivered to `origin/dev` at `1f2fc44`: command-contract shell, independent review, and cumulative checks.
- 2026-08-15 — QCLI-77 delivered to `origin/dev` at `e9aebb0`: authored records hardened with Git-CAS counter port, typed codecs, actor-link and basis validation, fail-closed replay; independent review and all available gates passed.
- 2026-08-15 — QCLI-78 delivered to `origin/dev` at `a7d40e8`: safe workspace initialization/discovery/enrollment, including nested-root correction; independent review and all available gates passed.
- 2026-08-15 — QCLI-79 implemented and independently reviewed through three focused remediation passes: operation-owned isolated-index mutation, common-directory preparation locks, durable recovery journals, structured CAS/push conflicts, and deterministic synchronization. Integrated source tree `8ef4417` passed 37 Bun tests/169 assertions, type/layer/source-lint/source-format and diff checks; delivery and Treehouse settlement are next.
