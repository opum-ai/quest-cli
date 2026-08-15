---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-15 20:01'
tags:
  - quest
  - quest-0.1
  - campaign
  - implementation
---
## Scope and authority

- Confirmed scope: deliver Quest CLI 0.1.0 foundation-up. Readiness is live; sequential one-task waves are the confirmed execution model.

## State

- Resolved: QCLI-72, QCLI-73, QCLI-74, QCLI-75, QCLI-76, QCLI-77, QCLI-78, QCLI-79, QCLI-80, QCLI-81, QCLI-90.
- In flight: QCLI-83 on `dev`; implementation is partially integrated but independent review found its live CLI/fixture delivery incomplete.
- Ready: QCLI-82.
- External/owner gated: QCLI-88 requires LCLI-332; QCLI-95 and Lore publication tasks require explicit authorization.

## Frontier

| Task | State | Delivery/evidence | Next action |
| --- | --- | --- | --- |
| QCLI-81 | Done | Integrated at `5463658`; independent review remediation added deterministic clock-regression and early-reclamation anomalies; 61-test cumulative suite and all strict local gates passed | Push and retain normal source history |
| QCLI-90 | Done | Integrated at `5463658`; independent review remediation extracted a ports-layer public Lore projection contract and runtime decoder; 61-test cumulative suite and all strict local gates passed | Push and retain normal source history |
| QCLI-83 | In flight | Helper contract/client/fixtures integrated, but reviewer proved live CLI has only scaffold commands, development version, no task storage/routing, and no public fixture artifact | Implement production CLI repository composition, argv JSON commands/diagnostics, live manifest/version, public fixture artifact, and black-box tests |
| QCLI-82 | Ready | QCLI-81 dependency is done | Dispatch only after QCLI-83 continuation is bounded against its shared task lifecycle surface |

## Queue

- QCLI-82 is the sole ready unallocated task. QCLI-83 remains in flight pending its operational CLI completion; remaining work follows formal dependencies or is owner-gated.

## Wave log

- 2026-08-15 — QCLI-72..75 delivered as prior foundation slices.
- 2026-08-15 — QCLI-76 delivered to `origin/dev` at `1f2fc44`: command-contract shell, independent review, and cumulative checks.
- 2026-08-15 — QCLI-77 delivered to `origin/dev` at `e9aebb0`: authored records hardened with Git-CAS counter port, typed codecs, actor-link and basis validation, fail-closed replay; independent review and all available gates passed.
- 2026-08-15 — QCLI-78 delivered to `origin/dev` at `a7d40e8`: safe workspace initialization/discovery/enrollment, including nested-root correction; independent review and all available gates passed.
- 2026-08-15 — QCLI-79 delivered to `origin/dev` at `90dfe78`: operation-owned isolated-index mutation, common-directory preparation locks, durable recovery journals, structured CAS/push conflicts, and deterministic synchronization; independent review and all gates passed.
- 2026-08-15 — QCLI-80 delivered to `origin/dev` at `05e41a8`: authoritative task graph, lifecycle, CRUD/search/read paths, graph validation, and claim-aware readiness; targeted and cumulative verification passed; branch and lease settled.
- 2026-08-15 — QCLI-81 and QCLI-90 integrated and independently reviewed at `5463658`: claims lifecycle and optional Lore public-link boundary respectively; review corrections included; 61 Bun tests, type, layer, source-quality, Lore strict, and diff gates passed. QCLI-83 remains open because its operational contract is not yet exposed by the live CLI.
