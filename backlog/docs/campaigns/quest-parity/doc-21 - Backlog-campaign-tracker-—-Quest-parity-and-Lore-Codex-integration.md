---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 19:47'
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
| quest-cli | QCLI-97 campaign and QCLI-98 through QCLI-108 qualification findings | dev 0c90eb28a122376b7ba35b153f826fddf2c9f034 | Focused tests, full suite, typecheck, lint, format, layer, package-impact checks, Lore strict gates, diff check, CI review. |

## Frontier

- Resolved on dev: QCLI-97.1 through QCLI-97.4, QCLI-97.7, and QCLI-105.
- Preserved but not integrated: QCLI-97.8 at a73ee49ebf5025a1aef278c708f36879e18ed3dc.
- In flight: QCLI-98 first; QCLI-108 is the only path-disjoint companion in wave 1.
- Blocked: QCLI-97.5 requires separate Lore CLI authority or a published adapter contract.
- Ready after wave 1: QCLI-99, QCLI-100, QCLI-103, QCLI-104, QCLI-106, QCLI-107, and QCLI-102.
- Reconciliation: QCLI-101 is Done in Backlog but its described source change is absent from dev and has no local branch ref; recover or reopen after QCLI-98.
- Held: QCLI-97.6 depends on QCLI-97.5 and QCLI-108; parent QCLI-97 remains open until its children settle.

## Queue

| Order | Task | State | Wave | Dependency or likely paths |
| --- | --- | --- | --- | --- |
| 1 | QCLI-98 | In Progress | 1 | Human renderer; src/cli and CLI contract tests. |
| 2 | QCLI-108 | In Progress | 1 | Path-disjoint repository check scope; package.json and scripts. |
| 3 | QCLI-99 | Ready | next | Success-envelope principal contract; reconcile current partial behavior first. |
| 4 | QCLI-100 | Ready | next | Help target mode handling; overlaps src/cli/main.ts. |
| 5 | QCLI-101 | Reconcile | next | Backlog says Done, but implementation is absent from dev. |
| 6 | QCLI-103 | Ready | next | Planning mutation response contracts. |
| 7 | QCLI-104 | Ready | next | Follow QCLI-103; milestone task-reference preservation. |
| 8 | QCLI-106 | Ready | next | Agent check exit semantics. |
| 9 | QCLI-107 | Ready | next | Error classification. |
| 10 | QCLI-102 | Ready | next | Version and help aliases. |
| Held | QCLI-97.5 | Blocked | none | Separate Lore CLI authority or published contract. |
| Held | QCLI-97.6 | Held | none | QCLI-97.5 and QCLI-108. |

## Resolved

| Task | Wave | Disposition | Evidence pointer |
| --- | --- | --- | --- |
| QCLI-97.1 through QCLI-97.4 | prior | Done | Parity audit, bootstrap, planning, lifecycle, and draft surfaces integrated before this wave. |
| QCLI-105 | prior | Done | Nested compiled reads and writes share one initialized root; PR 105 passed CI. |
| QCLI-97.7 | prior | Done | Layer gate restored on dev through PR 105. |

## Human decisions and blockers

- QCLI-97.5 cannot proceed without explicit authority to change the separate Lore CLI repository or an owner-approved published adapter contract.
- QCLI-97.8 is preserved on feature/qcli-97-8-public-backlog-import and remains unmerged pending campaign reconciliation.
- The coordinator checkout has a user-owned executable-bit-only change to bin/quest.cjs; campaign worktrees must not alter or discard it.
- Local global npm replacement EPERM is a managed host restriction, not a repository defect.

## Wave log

- 2026-08-17 — Integrated parity bootstrap, lifecycle, planning, agent, discovery, and browser surfaces through d2aeacc.
- 2026-08-17 — Merged QCLI-105 and QCLI-97.7 through PR 105; repository gates and CI passed.
- 2026-08-17 — Preserved completed QCLI-97.8 implementation at a73ee49 without merging.
- 2026-08-17 — Reinitialized from live state with QCLI-98 explicitly first; dispatched QCLI-98 and path-disjoint QCLI-108 from pinned dev 0c90eb2 in leased Treehouse worktrees.
