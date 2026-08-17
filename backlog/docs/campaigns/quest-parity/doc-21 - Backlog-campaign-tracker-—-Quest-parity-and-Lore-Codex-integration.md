---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 20:44'
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
| quest-cli | QCLI-97 campaign and QCLI-98 through QCLI-108 qualification findings | origin/dev 47e1ddf08f2e9cbae2e1fb576855c2eb6ec7dda1; QCLI-99 branch campaign/qcli-99-success-principal | Focused tests, full suite, typecheck, lint, format, layer, package and packed-CLI qualification, Lore strict gates, diff check, CI review. |

## Frontier

- Resolved on dev: QCLI-97.1 through QCLI-97.4, QCLI-97.7, QCLI-97.8, QCLI-98, QCLI-101, QCLI-105, and QCLI-108.
- Delivery pending: reviewed QCLI-99 candidate f00ff93 with complete 0.2.3 native artifacts.
- Blocked: QCLI-97.5 requires separate Lore CLI authority or a published adapter contract.
- Ready after QCLI-99: QCLI-100, QCLI-103, QCLI-104, QCLI-106, QCLI-107, and QCLI-102.
- Held: QCLI-97.6 now depends only on blocked QCLI-97.5; parent QCLI-97 remains open until its children settle.

## Queue

| Order | Task | State | Wave | Dependency or likely paths |
| --- | --- | --- | --- | --- |
| 1 | QCLI-99 | Reviewed candidate; delivery pending | 3 | Success-envelope principal contract and manifest-wide conformance. |
| 2 | QCLI-100 | Ready | next | Help target mode handling; pair sequentially with QCLI-102. |
| 3 | QCLI-103 | Ready | next | Planning mutation response contracts; precedes QCLI-104. |
| 4 | QCLI-104 | Ready | next | Milestone task-reference preservation after QCLI-103. |
| 5 | QCLI-106 | Ready | next | Agent check exit semantics. |
| 6 | QCLI-107 | Ready | next | Error classification. |
| 7 | QCLI-102 | Ready | next | Version and help aliases; pair sequentially with QCLI-100. |
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
| QCLI-97.8 | 2 | Done and merged | PR 107 merged at 47e1ddf; public migration lifecycle, packed alias flow, all-six artifacts, and cumulative review passed. |
| QCLI-101 | 2 | Done and merged | PR 107 merged at 47e1ddf; all 19 value flags, collection semantics, combined artifacts, and independent review passed. |

## Human decisions and blockers

- QCLI-97.5 cannot proceed without explicit authority to change the separate Lore CLI repository or an owner-approved published adapter contract.
- The coordinator checkout retains the original QCLI-101 source/package state until equivalence cleanup is performed without disturbing its user-owned bin/quest.cjs mode-only change.
- Zero-byte stale Git index locks are quarantined under /private/tmp/quest-cli-index.lock.stale-* until retained coordinator state is reconciled.
- Local global npm replacement EPERM is a managed host restriction, not a repository defect.

## Wave log

- 2026-08-17 — Integrated parity bootstrap, lifecycle, planning, agent, discovery, and browser surfaces through d2aeacc.
- 2026-08-17 — Merged QCLI-105 and QCLI-97.7 through PR 105.
- 2026-08-17 — Reinitialized with QCLI-98 first and merged QCLI-98/QCLI-108 through PR 106 at 8606e54 after local, independent, Lore, and 13 CI checks.
- 2026-08-17 — Reconciled QCLI-97.8/QCLI-101 on PR 107, rebuilt all six 0.2.2 natives, added packed lifecycle and complete parser evidence, and received two independent approvals.
- 2026-08-17 — Raised only the expanded manifest matrix timeout after CI crossed Bun's default by 2 ms; micro-review approved. Final-SHA source, six immutable-candidate, and six projection jobs passed. PR 107 merged at 47e1ddf with byte-identical tree proof; its branches and lease were cleaned.
- 2026-08-17 — QCLI-99 normalized every success envelope, added manifest-wide JSON principal/key-order conformance, rebuilt all six 0.2.3 binaries, passed 155 full tests plus package gates, received two independent approvals, and committed the candidate as f00ff93.
