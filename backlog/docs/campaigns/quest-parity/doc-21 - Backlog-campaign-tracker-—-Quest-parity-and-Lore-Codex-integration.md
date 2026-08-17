---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 19:59'
---
## Contract

- Mode: autonomous-docs.
- Authorization: repository AGENTS autonomous documentation campaign authority; 2026-08-17 init explicitly makes QCLI-98 the top priority.
- Scope: quest-cli only; Lore CLI repository changes remain outside scope.
- Queue rule: QCLI-98 first, then dependencies, priority, and ordinal.
- Release line: continue the 0.2.x hardening Story; registry publication and dev-to-main promotion are excluded.

## Repository

| Repository | Story and task scope | Integration base | Required gates |
| --- | --- | --- | --- |
| quest-cli | QCLI-97 campaign and QCLI-98 through QCLI-108 qualification findings | dev 86a3b453a4147eae75b3e1b25209207dc645a953; wave-1 code tree 207c2f4484b1aa3a25f8f3e0b09d4a8059d75eb0 | Focused tests, full suite, typecheck, lint, format, layer, package-impact checks, Lore strict gates, diff check, CI review. |

## Frontier

- Resolved on dev before wave 1: QCLI-97.1 through QCLI-97.4, QCLI-97.7, and QCLI-105.
- Wave 1 reviewed and ready for delivery: QCLI-98 and QCLI-108.
- Preserved but not integrated: QCLI-97.8 at a73ee49ebf5025a1aef278c708f36879e18ed3dc; QCLI-101 as validated uncommitted source, package, test, fixture, and native-artifact changes in the coordinator checkout.
- Blocked: QCLI-97.5 requires separate Lore CLI authority or a published adapter contract.
- Ready after delivery: settle QCLI-101 and QCLI-97.8, then QCLI-99, QCLI-100, QCLI-103, QCLI-104, QCLI-106, QCLI-107, and QCLI-102.
- Held: QCLI-97.6 now depends only on blocked QCLI-97.5; parent QCLI-97 remains open until its children settle.

## Queue

| Order | Task | State | Wave | Dependency or likely paths |
| --- | --- | --- | --- | --- |
| 1 | QCLI-98 | Done; delivery pending | 1 | Human renderer and manifest-driven output coverage. |
| 2 | QCLI-108 | Done; delivery pending | 1 | Treehouse-safe repository check scope. |
| 3 | QCLI-101 | Preserved | settlement | Recover the validated dirty implementation without overwriting it, then review and integrate. |
| 4 | QCLI-97.8 | Preserved | settlement | Review and integrate branch a73ee49; resolve shared CLI/package paths serially. |
| 5 | QCLI-99 | Ready | next | Success-envelope principal contract; reconcile current partial behavior first. |
| 6 | QCLI-100 | Ready | next | Help target mode handling; cumulative review reconfirmed the exact tracked defect. |
| 7 | QCLI-103 | Ready | next | Planning mutation response contracts. |
| 8 | QCLI-104 | Ready | next | Follow QCLI-103; milestone task-reference preservation. |
| 9 | QCLI-106 | Ready | next | Agent check exit semantics. |
| 10 | QCLI-107 | Ready | next | Error classification. |
| 11 | QCLI-102 | Ready | next | Version and help aliases. |
| Held | QCLI-97.5 | Blocked | none | Separate Lore CLI authority or published contract. |
| Held | QCLI-97.6 | Held | none | QCLI-97.5. |

## Resolved

| Task | Wave | Disposition | Evidence pointer |
| --- | --- | --- | --- |
| QCLI-97.1 through QCLI-97.4 | prior | Done | Parity audit, bootstrap, planning, lifecycle, and draft surfaces integrated before this wave. |
| QCLI-105 | prior | Done | Nested compiled reads and writes share one initialized root; PR 105 passed CI. |
| QCLI-97.7 | prior | Done | Layer gate restored on dev through PR 105. |
| QCLI-98 | 1 | Done; delivery pending | Integrated code tree 207c2f4 passed focused review, cumulative review with QCLI-100 finding classified to its existing task, check:packages, and the 149-test full gate. |
| QCLI-108 | 1 | Done; delivery pending | Integrated code tree 207c2f4 passed focused and cumulative review; Treehouse regression and the 149-test full gate passed. |

## Human decisions and blockers

- QCLI-97.5 cannot proceed without explicit authority to change the separate Lore CLI repository or an owner-approved published adapter contract.
- QCLI-97.8 is preserved on feature/qcli-97-8-public-backlog-import and remains unmerged pending campaign reconciliation.
- QCLI-101 source/package work and rebuilt 0.2.2 artifacts are retained uncommitted in the coordinator checkout and under /private/tmp/quest-v0.2.2-qcli101.1NYgC7; integration work must not overwrite them.
- The coordinator checkout has a user-owned executable-bit-only change to bin/quest.cjs; campaign worktrees must not alter or discard it.
- Three zero-byte stale Git index locks were quarantined under /private/tmp/quest-cli-index.lock.stale-* after lsof found no owner; retain until campaign Git operations are healthy.
- Local global npm replacement EPERM is a managed host restriction, not a repository defect.

## Wave log

- 2026-08-17 — Integrated parity bootstrap, lifecycle, planning, agent, discovery, and browser surfaces through d2aeacc.
- 2026-08-17 — Merged QCLI-105 and QCLI-97.7 through PR 105; repository gates and CI passed.
- 2026-08-17 — Preserved completed QCLI-97.8 implementation at a73ee49 without merging.
- 2026-08-17 — Reinitialized from live state with QCLI-98 explicitly first; dispatched QCLI-98 and path-disjoint QCLI-108 from pinned dev 0c90eb2 in leased Treehouse worktrees.
- 2026-08-17 — Committed grounded campaign state at 86a3b45 using a guarded fast-forward commit-tree after ordinary Git index refresh was SIGKILLed while hashing retained QCLI-101 binaries.
- 2026-08-17 — Integrated reviewed QCLI-108 and QCLI-98 at 207c2f4; full check passed 149 tests plus type, scoped Biome, layer, repository-scope, package, and diff gates.
