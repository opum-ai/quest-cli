---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 20:20'
---
## Contract

- Mode: autonomous-docs.
- Authorization: repository AGENTS autonomous documentation campaign authority; 2026-08-17 init explicitly made QCLI-98 the top priority.
- Scope: quest-cli only; Lore CLI repository changes remain outside scope.
- Queue rule: QCLI-98 first, then dependencies, priority, and ordinal.
- Release line: continue the 0.2.x hardening Story; registry publication and dev-to-main promotion are excluded.

## Repository

| Repository | Story and task scope | Integration base | Required gates |
| --- | --- | --- | --- |
| quest-cli | QCLI-97 campaign and QCLI-98 through QCLI-108 qualification findings | origin/dev 8606e54e153644a5913bb56ad4a17e8697a511fb; wave-2 branch campaign/wave-2-reconcile-preserved | Focused tests, full suite, typecheck, lint, format, layer, package and packed-CLI qualification, Lore strict gates, diff check, CI review. |

## Frontier

- Resolved on dev: QCLI-97.1 through QCLI-97.4, QCLI-97.7, QCLI-98, QCLI-105, and QCLI-108.
- Delivery pending: reviewed QCLI-101/QCLI-97.8 reconciliation commits c271a6d and ee0ecdb on the wave-2 branch.
- Blocked: QCLI-97.5 requires separate Lore CLI authority or a published adapter contract.
- Ready after wave-2 settlement: QCLI-99, QCLI-100, QCLI-103, QCLI-104, QCLI-106, QCLI-107, and QCLI-102.
- Held: QCLI-97.6 now depends only on blocked QCLI-97.5; parent QCLI-97 remains open until its children settle.

## Queue

| Order | Task | State | Wave | Dependency or likely paths |
| --- | --- | --- | --- | --- |
| 1 | QCLI-101 | Reviewed candidate; delivery pending | 2 | Parser hardening, complete repeatable-flag evidence, combined 0.2.2 artifacts. |
| 2 | QCLI-97.8 | Reviewed candidate; delivery pending | 2 | Public Backlog lifecycle, manifest human matrix, packed lifecycle and aliases. |
| 3 | QCLI-99 | Ready | next | Success-envelope principal contract; reconcile current partial behavior first. |
| 4 | QCLI-100 | Ready | next | Help target mode handling; wave-1 review reconfirmed the exact tracked defect. |
| 5 | QCLI-103 | Ready | next | Planning mutation response contracts. |
| 6 | QCLI-104 | Ready | next | Follow QCLI-103; milestone task-reference preservation. |
| 7 | QCLI-106 | Ready | next | Agent check exit semantics. |
| 8 | QCLI-107 | Ready | next | Error classification. |
| 9 | QCLI-102 | Ready | next | Version and help aliases. |
| Held | QCLI-97.5 | Blocked | none | Separate Lore CLI authority or published contract. |
| Held | QCLI-97.6 | Held | none | QCLI-97.5. |

## Resolved

| Task | Wave | Disposition | Evidence pointer |
| --- | --- | --- | --- |
| QCLI-97.1 through QCLI-97.4 | prior | Done | Parity audit, bootstrap, planning, lifecycle, and draft surfaces integrated before this wave. |
| QCLI-105 | prior | Done | Nested compiled reads and writes share one initialized root; PR 105 passed CI. |
| QCLI-97.7 | prior | Done | Layer gate restored on dev through PR 105. |
| QCLI-98 | 1 | Done and merged | PR 106 merged at 8606e54; candidate tree was byte-identical to validated d96f44b, with 149 local tests and 13 CI checks passing. |
| QCLI-108 | 1 | Done and merged | PR 106 merged at 8606e54; Treehouse regression, focused/cumulative reviews, and all local/CI gates passed. |

## Human decisions and blockers

- QCLI-97.5 cannot proceed without explicit authority to change the separate Lore CLI repository or an owner-approved published adapter contract.
- The coordinator checkout retains the original QCLI-101 source/package state until the wave-2 merge proves equivalent preservation.
- The coordinator checkout has a user-owned executable-bit-only change to bin/quest.cjs; campaign worktrees must not alter or discard it.
- Zero-byte stale Git index locks are quarantined under /private/tmp/quest-cli-index.lock.stale-*; cleanup waits until retained coordinator work is preserved.
- Local global npm replacement EPERM is a managed host restriction, not a repository defect.

## Wave log

- 2026-08-17 — Integrated parity bootstrap, lifecycle, planning, agent, discovery, and browser surfaces through d2aeacc.
- 2026-08-17 — Merged QCLI-105 and QCLI-97.7 through PR 105.
- 2026-08-17 — Preserved completed QCLI-97.8 implementation at a73ee49 without merging.
- 2026-08-17 — Reinitialized with QCLI-98 first; dispatched QCLI-98 and path-disjoint QCLI-108 from pinned dev 0c90eb2.
- 2026-08-17 — Merged PR 106 at 8606e54 after 149 local tests, strict Lore gates, independent reviews, and 13 CI checks; one Windows ARM64 timeout passed on the authorized transient rerun.
- 2026-08-17 — Released all three wave-1 Treehouse leases, removed the merged remote branch and proven merged/patch-equivalent local branches, and started wave-2 reconciliation at origin/dev 8606e54.
- 2026-08-17 — Reconciled QCLI-97.8 and QCLI-101 without regressing QCLI-98/QCLI-108, rebuilt all six 0.2.2 natives, passed focused/full/package/packed gates, received two independent approvals, and committed the candidate as c271a6d plus ee0ecdb.
