---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-15 23:04'
tags:
  - quest
  - quest-0.1
  - campaign
  - implementation
---
## Scope and authority

- Confirmed scope: deliver Quest CLI 0.1.0 foundation-up. Readiness is live; sequential one-task waves are the confirmed execution model.

## State

- Resolved: QCLI-72, QCLI-73, QCLI-74, QCLI-75, QCLI-76, QCLI-77, QCLI-78, QCLI-79, QCLI-80, QCLI-81, QCLI-82, QCLI-83, QCLI-90.
- In flight: QCLI-84 on `campaign/qcli-84-projection`, pinned from `fa8ec73496da64749439532eedb05508baa79982`, in Treehouse lease `1b8742202f81d1547956696b3d434e81`.
- Ready: none.
- External/owner gated: QCLI-88 requires LCLI-332; QCLI-95 and Lore publication tasks require explicit authorization.

## Frontier

| Task | State | Delivery/evidence | Next action |
| --- | --- | --- | --- |
| QCLI-81 | Done | Integrated at `5463658`; independent review remediation added deterministic clock-regression and early-reclamation anomalies; 61-test cumulative suite and all strict local gates passed | Push and retain normal source history |
| QCLI-90 | Done | Integrated at `5463658`; independent review remediation extracted a ports-layer public Lore projection contract and runtime decoder; 61-test cumulative suite and all strict local gates passed | Push and retain normal source history |
| QCLI-83 | Done | Integrated at `e0589a7`; independent review approved production tracker CLI, runtime payload drift checks, a versioned external conformance fixture, and bounded conflict-safe local storage | QCLI-82 and its dependent QCLI-84 are now settled/active |
| QCLI-82 | Done | Integrated at `ef0e4b8`; independent review approved authored event-only gates/evidence, including adversarial history-erasure and inline satisfied-gate bypass coverage | QCLI-84 is active |
| QCLI-84 | In Progress | Isolated from `fa8ec73` in Treehouse worktree `quest-cli-40ae4d/1`; QCLI-82 dependency is live Done | Implement, independently review, integrate, and deliver projection schema/rebuild |

## Queue

- QCLI-84 is the sole active task. QCLI-85 follows QCLI-84; remaining work follows formal dependencies or is owner-gated.

## Wave log

- 2026-08-15 — QCLI-72..75 delivered as prior foundation slices.
- 2026-08-15 — QCLI-76 delivered to `origin/dev` at `1f2fc44`: command-contract shell, independent review, and cumulative checks.
- 2026-08-15 — QCLI-77 delivered to `origin/dev` at `e9aebb0`: authored records hardened with Git-CAS counter port, typed codecs, actor-link and basis validation, fail-closed replay; independent review and all available gates passed.
- 2026-08-15 — QCLI-78 delivered to `origin/dev` at `a7d40e8`: safe workspace initialization/discovery/enrollment, including nested-root correction; independent review and all available gates passed.
- 2026-08-15 — QCLI-79 delivered to `origin/dev` at `90dfe78`: operation-owned isolated-index mutation, common-directory preparation locks, durable recovery journals, structured CAS/push conflicts, and deterministic synchronization; independent review and all gates passed.
- 2026-08-15 — QCLI-80 delivered to `origin/dev` at `05e41a8`: authoritative task graph, lifecycle, CRUD/search/read paths, graph validation, and claim-aware readiness; targeted and cumulative verification passed; branch and lease settled.
- 2026-08-15 — QCLI-81 and QCLI-90 integrated and independently reviewed at `5463658`: claims lifecycle and optional Lore public-link boundary respectively; review corrections included; 61 Bun tests, type, layer, source-quality, Lore strict, and diff gates passed.
- 2026-08-15 — QCLI-83 integrated at `e0589a7`: live tracker subprocess commands, manifest/probe, actor-safe writes, external conformance fixture, runtime schema checks, and bounded storage conflict behavior; independent review plus 67 Bun tests, source-scoped quality checks, Lore strict, and diff checks passed.
- 2026-08-15 — QCLI-82 integrated at `ef0e4b8`: authored gates/evidence and completion enforcement; 71 tests plus source-scoped type, layer, quality, Lore strict, and diff checks passed.
- 2026-08-15 — Restored campaign cursor at `fa8ec73`; reconciled stale QCLI-82 frontier and dispatched QCLI-84 from the pinned `dev` base in a single Treehouse writer lease.
