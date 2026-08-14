---
id: doc-18
title: Backlog campaign tracker — QCLI-96 autonomous loop
type: other
created_date: '2026-08-14 20:01'
updated_date: '2026-08-14 20:01'
tags:
  - campaign
  - automation
  - codex
---
# Backlog campaign — Quest Codex continuous loop

## Contract
- Mode: autonomous-docs
- Scope: quest-cli only
- Queue rule: dependencies, then priority and ordinal
- Stop rule: queue empty, exact human decision, or grounded session renewal only

## Repository
| Repository | Task ids | AGENTS authority | Integration base | Required gates |
|---|---|---|---|---|
| quest-cli | QCLI-96 | autonomous-docs, dev only | 78258e0206612739cb3babc19ced563dda95cd93 | lifecycle/tracker fixtures, skill validation, Lore strict gates, agent bridge, diff check, independent review |

## Frontier
Resolved 0; in flight 1; blocked 0; ready 0.

## Queue
| Order | Task | Dependencies | State | Wave | Likely paths |
|---|---|---|---|---|---|
| 1 | QCLI-96 | none | In Progress | 1 | AGENTS, Codex campaign skill/audits, Treehouse skill, Lore operating record |

## Resolved
| Task | Wave | Disposition | Evidence pointer |
|---|---|---|---|

## Human decisions and blockers
- None. Dirty legacy worktrees require content classification, not a bulk discard decision.

## Wave log
- Wave 1: QCLI-96 implementation active on fix/qcli-autonomy-loop from pinned dev 78258e0206612739cb3babc19ced563dda95cd93; three read-only review lanes completed.
