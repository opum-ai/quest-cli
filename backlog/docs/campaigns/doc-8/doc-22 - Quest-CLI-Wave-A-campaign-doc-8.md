---
id: doc-22
title: Quest CLI Wave A campaign doc-8
type: other
created_date: '2026-08-19 03:32'
updated_date: '2026-08-19 03:36'
---
# Backlog campaign — Quest CLI Wave A

## Contract
- Mode: autonomous-docs
- Session role: FMC worker (`quest-cli`); Controller: `opum-doc`.
- Scope: QCLI-97.5, then QCLI-97.6 and QCLI-97; quest-cli only.
- Integration: `origin/dev`; grounded SHA `044e87d96e1a7b8f059a96e1cda29ebcdb40a7a0`.

## Frontier
- QCLI-97.5 is In Progress but blocked on Lore-side adapter ownership.
- QCLI-97.6 is dependency-gated; QCLI-97 cannot settle.

## FMC coordination
| Message id | Sender | Recipient | Status | Next action |
| --- | --- | --- | --- | --- |
| b339f18302aa41af8d8ec87332b07d73 | opum-doc | quest-cli | active | reply with governed cross-repository blocker |

## Worktrees and retained artifacts
| Repository/path/ref | Owner | Lease/status | Disposition | Cleanup condition |
| --- | --- | --- | --- | --- |
| `/Volumes/external/repos/quest-cli` / `dev` | quest-cli | retained main worktree | no campaign worktree | none created |

## Resolved
- Quest tracker-client public conformance test: 3 passing tests.

## Human decisions and blockers
- Lore 0.1.0 has only `BacklogAdapter`; QCLI-97.5 needs an owner-approved Lore-side Quest adapter contract/implementation for binary selection, probe behavior, and write response support.
- npm publication remains deferred to the exact later release gate.

## Wave log
- Repaired and audited handover cursor; resumed correlation b339f18302aa41af8d8ec87332b07d73.
