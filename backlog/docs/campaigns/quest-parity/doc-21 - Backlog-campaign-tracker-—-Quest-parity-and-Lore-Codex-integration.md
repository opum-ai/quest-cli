---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 20:58'
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
| quest-cli | QCLI-97 campaign and QCLI-98 through newly discovered qualification findings | origin/dev a0898da60d3453ea29860cc23009ea28b06f112f; QCLI-100 branch campaign/qcli-100-help-modes | Focused tests, full suite, typecheck, lint, format, layer, package and packed-CLI qualification, Lore strict gates, diff check, CI review. |

## Frontier

- Resolved on dev: QCLI-97.1 through QCLI-97.4, QCLI-97.7, QCLI-97.8, QCLI-98, QCLI-99, QCLI-101, QCLI-105, and QCLI-108.
- Delivery pending: reviewed QCLI-100 candidate 4076fbe with complete 0.2.4 native artifacts.
- Blocked: QCLI-97.5 requires separate Lore CLI authority or a published adapter contract.
- Ready after QCLI-100: QCLI-103, QCLI-104, QCLI-106, QCLI-107, QCLI-102, QCLI-109, and QCLI-110.
- Held: QCLI-97.6 now depends only on blocked QCLI-97.5; parent QCLI-97 remains open until its children settle.

## Queue

| Order | Task | State | Wave | Dependency or likely paths |
| --- | --- | --- | --- | --- |
| 1 | QCLI-100 | Reviewed candidate; delivery pending | 4 | Help target mode handling and 0.2.4 artifacts. |
| 2 | QCLI-103 | Ready | next | Planning mutation response contracts; precedes QCLI-104. |
| 3 | QCLI-104 | Ready | next | Milestone task-reference preservation after QCLI-103. |
| 4 | QCLI-106 | Ready | next | Agent check exit semantics. |
| 5 | QCLI-107 | Ready | next | Error classification. |
| 6 | QCLI-102 | Ready | next | Version and help aliases. |
| 7 | QCLI-109 | Ready | next | Escaped flag-shaped values. |
| 8 | QCLI-110 | Ready | next | Output modes before commands. |
| Held | QCLI-97.5 | Blocked | none | Separate Lore CLI authority or published contract. |
| Held | QCLI-97.6 | Held | none | QCLI-97.5. |

## Resolved

| Task | Wave | Disposition | Evidence pointer |
| --- | --- | --- | --- |
| QCLI-97.1 through QCLI-97.4 | prior | Done | Parity audit, bootstrap, planning, lifecycle, and draft surfaces integrated before this wave. |
| QCLI-105 and QCLI-97.7 | prior | Done and merged | Nested workspace resolution and layer gate restored through PR 105. |
| QCLI-98 and QCLI-108 | 1 | Done and merged | PR 106 merged at 8606e54 with human rendering, Treehouse-safe checks, independent review, and 13 CI checks. |
| QCLI-97.8 and QCLI-101 | 2 | Done and merged | PR 107 merged at 47e1ddf with migration lifecycle, parser hardening, packed flow, rebuilt artifacts, and full CI. |
| QCLI-99 | 3 | Done and merged | PR 108 merged at a0898da; 0.2.3 principal conformance, two reviews, 155 local tests, and 13 CI checks passed. |

## Human decisions and blockers

- QCLI-97.5 cannot proceed without explicit authority to change the separate Lore CLI repository or an owner-approved published adapter contract.
- The coordinator checkout retains the original QCLI-101 source/package state until equivalence cleanup is performed without disturbing its user-owned bin/quest.cjs mode-only change.
- Zero-byte stale Git index locks are quarantined under /private/tmp/quest-cli-index.lock.stale-* until retained coordinator state is reconciled.
- Local global npm replacement EPERM is a managed host restriction, not a repository defect.

## Wave log

- 2026-08-17 — Integrated parity bootstrap, lifecycle, planning, agent, discovery, and browser surfaces through d2aeacc; merged QCLI-105/QCLI-97.7 through PR 105.
- 2026-08-17 — Reinitialized with QCLI-98 first and merged QCLI-98/QCLI-108 through PR 106 at 8606e54 after local, independent, Lore, and CI checks.
- 2026-08-17 — Reconciled QCLI-97.8/QCLI-101 through PR 107 at 47e1ddf with all-six 0.2.2 artifacts and final-SHA source/immutable/projection gates.
- 2026-08-17 — Merged QCLI-99 through PR 108 at a0898da with byte-identical tree proof after two reviews, 155 local tests, and all 13 CI checks; cleaned its branches and lease.
- 2026-08-17 — QCLI-100 normalized help modes before topic resolution, covered all eight spelling/mode combinations, rebuilt all six 0.2.4 binaries, passed 156 full tests plus package gates, received two independent approvals, and committed candidate 4076fbe.
- 2026-08-17 — Recomputed the ready queue and added newly present QCLI-109/QCLI-110 after existing medium-priority tasks and QCLI-102.
