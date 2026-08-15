---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-15 23:16'
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
- In flight: QCLI-84 implementation is integrated locally on `dev` at `4f4df2a`; its task remains In Progress with AC1–4 proven.
- Ready: none.
- External/owner gated: QCLI-84 requires supported OS/architecture matrix evidence or a scope/acceptance decision; QCLI-88 requires LCLI-332; QCLI-95 and Lore publication tasks require explicit authorization.

## Frontier

| Task | State | Delivery/evidence | Next action |
| --- | --- | --- | --- |
| QCLI-82 | Done | Integrated at `ef0e4b8`; authored event-only gates/evidence and adversarial protection passed | Settled |
| QCLI-84 | In Progress — external evidence gate | Projection schema/rebuild integrated at `07f2452`; 77 Bun tests, projection-scoped Biome, type/layer, Lore strict, and diff checks passed. Independent review approved after fail-closed semantic-tampering repair | Obtain macOS/Linux/Windows architecture-matrix evidence, or explicitly allow QCLI-93 to own AC5 and finalize QCLI-84 on current evidence |

## Queue

- QCLI-85 is formally downstream of QCLI-84; no independent task is ready.

## Wave log

- 2026-08-15 — QCLI-72..75 delivered as prior foundation slices.
- 2026-08-15 — QCLI-76 through QCLI-83, QCLI-81, QCLI-82, and QCLI-90 delivered in preceding campaign waves; their detailed evidence remains on their Backlog tasks.
- 2026-08-15 — Restored the campaign cursor at `fa8ec73`, reconciled the stale QCLI-82 frontier, and dispatched QCLI-84 from a pinned Treehouse base.
- 2026-08-15 — QCLI-84 implementation integrated locally at `07f2452` after independent review. Rebuild creates and validates a temporary Bun SQLite database, atomically replaces only after authoritative parity, and detects missing, corrupt, and same-count tampered projections. Local Darwin arm64 evidence passed; cross-platform matrix evidence is unavailable without an additional delivery/acceptance decision.
