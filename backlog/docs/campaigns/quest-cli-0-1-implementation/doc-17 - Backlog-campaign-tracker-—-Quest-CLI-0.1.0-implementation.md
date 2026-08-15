---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-15 19:51'
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
- In flight: QCLI-81, QCLI-83, QCLI-90, all dispatched from `05e41a8`.
- Ready: none; the live ready set is fully allocated.
- External/owner gated: QCLI-88 requires LCLI-332; QCLI-95 and Lore publication tasks require explicit authorization.

## Frontier

| Task | State | Delivery/evidence | Next action |
| --- | --- | --- | --- |
| QCLI-80 | Done | Delivered to `origin/dev` at `05e41a8`; 9 targeted Bun tests, typecheck, layer check, source-scoped Biome lint/format, Lore strict gates, and diff check passed; patch-equivalent Treehouse lease returned and branch deleted | Delivered |
| QCLI-81 | In flight | Treehouse lease `57d374ca7c9de87a4ffa293ca787d0a8`, branch `campaign/qcli-81-claims`, isolated claims paths | Await implementation and independent review |
| QCLI-83 | In flight | Branch `campaign/qcli-83-tracker`, isolated `/private/tmp/quest-cli-qcli-83` worktree and tracker-contract paths | Await implementation and independent review |
| QCLI-90 | In flight | Branch `campaign/qcli-90-lore-links`, isolated `/private/tmp/quest-cli-qcli-90` worktree and optional Lore-link paths | Await implementation and independent review |

## Queue

- QCLI-81, QCLI-83, and QCLI-90 were the full conflict-free ready set after QCLI-80. Remaining work follows formal Backlog dependencies or remains owner-gated.

## Wave log

- 2026-08-15 — QCLI-72..75 delivered as prior foundation slices.
- 2026-08-15 — QCLI-76 delivered to `origin/dev` at `1f2fc44`: command-contract shell, independent review, and cumulative checks.
- 2026-08-15 — QCLI-77 delivered to `origin/dev` at `e9aebb0`: authored records hardened with Git-CAS counter port, typed codecs, actor-link and basis validation, fail-closed replay; independent review and all available gates passed.
- 2026-08-15 — QCLI-78 delivered to `origin/dev` at `a7d40e8`: safe workspace initialization/discovery/enrollment, including nested-root correction; independent review and all available gates passed.
- 2026-08-15 — QCLI-79 delivered to `origin/dev` at `90dfe78`: operation-owned isolated-index mutation, common-directory preparation locks, durable recovery journals, structured CAS/push conflicts, and deterministic synchronization; independent review and all gates passed.
- 2026-08-15 — QCLI-80 delivered to `origin/dev` at `05e41a8`: authoritative task graph, lifecycle, CRUD/search/read paths, graph validation, and claim-aware readiness; targeted and cumulative verification passed; branch and lease settled.
- 2026-08-15 — QCLI-81, QCLI-83, and QCLI-90 activated with recorded plans and dispatched from the same pinned `05e41a8` integration base to non-overlapping isolated path budgets.
