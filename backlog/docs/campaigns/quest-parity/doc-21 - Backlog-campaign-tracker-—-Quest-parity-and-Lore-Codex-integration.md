---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 16:54'
---
## Contract

- Mode: autonomous-docs with explicit owner authorization completed for QCLI-105 and the merge-blocking QCLI-97.7 remediation.
- Scope: quest-cli only; any Lore CLI repository change remains outside scope.
- Queue rule: dependencies, then priority and ordinal.
- Release line: continue the existing 0.2.x line under `docs/stories/harden-and-qualify-quest-cli-0-2-x.md`; no additional Story is needed.

## Repository

| Repository | Story and task scope | Integration base | Required gates |
| --- | --- | --- | --- |
| `quest-cli` | QCLI-97, QCLI-97.1 through QCLI-97.7, QCLI-98 through QCLI-108 | `dev` `2dc6dcb6b50b3fea9db34eae5a476ae884e0ec3c` via PR #105 | Task tests, full suite, layer gate, all-platform package qualification, Lore strict checks, diff check, CI review. |

## Frontier

- Resolved: QCLI-97.1, QCLI-97.2, QCLI-97.3, QCLI-97.4, QCLI-97.7, QCLI-105.
- In flight: none.
- Blocked: QCLI-97.5 requires separate Lore CLI authority or a published adapter contract.
- Ready: QCLI-98, QCLI-99, QCLI-101, QCLI-100, QCLI-103, QCLI-104, QCLI-106, QCLI-107, QCLI-108, QCLI-102.
- Held: QCLI-97.6 depends on QCLI-97.5 and QCLI-108; parent QCLI-97 remains open until its children settle.

## Queue

| Order | Task | State | Dependency or next scope |
| --- | --- | --- | --- |
| 1 | QCLI-98 | Ready | High-priority human output parity |
| 2 | QCLI-99 | Ready | High-priority success-envelope principal contract |
| 3 | QCLI-101 | Ready | High-priority flag parser correctness |
| 4 | QCLI-100 | Ready | Help target flag handling |
| 5 | QCLI-103 | Ready | Planning mutation response contracts |
| 6 | QCLI-104 | Ready | Milestone task-reference preservation |
| 7 | QCLI-106 | Ready | Agent check exit semantics |
| 8 | QCLI-107 | Ready | Error classification |
| 9 | QCLI-108 | Ready | Exclude pooled Treehouse worktrees from repository checks; blocks QCLI-97.6 |
| 10 | QCLI-102 | Ready | Version/help aliases |
| Held | QCLI-97.5 | Blocked | Separate Lore CLI repository authority or published contract |
| Held | QCLI-97.6 | Held | QCLI-97.5 and QCLI-108 |

## Resolved

| Task | Disposition | Evidence pointer |
| --- | --- | --- |
| QCLI-97.1 through QCLI-97.4 | Done | Parity audit, bootstrap, planning, lifecycle, and draft surfaces integrated before this wave. |
| QCLI-105 | Done | Nested compiled reads and writes use one initialized root; 146-test final suite and PR #105 CI passed. |
| QCLI-97.7 | Done | Layer gate passes for 64 files; path-specific composition root and forbidden-import regression are in PR #105. |

## Human decisions and blockers

- QCLI-97.5 cannot proceed without explicit authority to change the separate Lore CLI repository or an owner-approved published adapter contract.
- The remaining ready product defects are tracked but were not activated by the QCLI-105 and housekeeping request.
- QCLI-108 captures local Biome traversal of reusable pooled Treehouse worktrees. Clean CI checkout lint and format gates pass.
- The local npm global EPERM is a managed sandbox write restriction, not a repository or user configuration defect.

## Wave log

- 2026-08-17 — Integrated parity bootstrap, lifecycle, planning, agent, discovery, and browser surfaces through `d2aeacc`.
- 2026-08-17 — Fixed QCLI-105, bumped the local release candidate to 0.2.1, rebuilt all six native packages, and created the 0.2.x hardening Story.
- 2026-08-17 — Restored the architecture layer gate as QCLI-97.7 after it blocked required CI.
- 2026-08-17 — Merged PR #105 to `dev` at `2dc6dcb6b50b3fea9db34eae5a476ae884e0ec3c`; 13 CI checks, 146 local tests, typecheck, layer, package, Lore strict, and diff gates passed.
