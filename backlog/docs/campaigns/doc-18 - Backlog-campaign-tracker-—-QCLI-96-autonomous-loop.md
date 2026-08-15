---
id: doc-18
title: Backlog campaign tracker — QCLI-96 autonomous loop
type: other
created_date: '2026-08-14 20:01'
updated_date: '2026-08-14 20:31'
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
- Status: complete

## Repository
| Repository | Task ids | AGENTS authority | Integration base | Required gates |
|---|---|---|---|---|
| quest-cli | QCLI-96 | autonomous-docs, dev only | 78258e0206612739cb3babc19ced563dda95cd93 | lifecycle/tracker fixtures, skill validation, Lore strict gates, agent bridge, diff check, independent review |

## Frontier
Resolved 1; in flight 0; blocked 0; ready 0.

## Queue
| Order | Task | Dependencies | State | Wave | Likely paths |
|---|---|---|---|---|---|
| 1 | QCLI-96 | none | Done | 1 | AGENTS, Codex campaign skill/audits, Treehouse skill, Lore operating record |

## Resolved
| Task | Wave | Disposition | Evidence pointer |
|---|---|---|---|
| QCLI-96 | 1 | Core merged; post-merge cleanup complete; Codex-only cursor settlement approved | PR #96; merge fe0dfcf3225e5140522a56603aef73922fcfc342; task final summary |

## Human decisions and blockers
- None.

## Wave log
- Wave 1: implementation merged to dev in PR #96 at fe0dfcf3225e5140522a56603aef73922fcfc342.
- Independent cumulative review approved the settlement tree after explicit Codex cursor migration and Terra/medium profile alignment.
- Removed the clean patch-equivalent QCLI-96 implementation worktree, its nested returned Treehouse lease worktree, and the campaign-created feature branch.
- Retained six reusable external Treehouse pool worktrees and unrelated diverged branches.
- The clean primary checkout remains behind origin/dev because the running environment cannot unlink loaded Codex skill files; settlement continued in the isolated worktree without destructive recovery.
