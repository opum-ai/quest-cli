---
id: doc-23
title: Backlog campaign tracker — QCLI-115 harness adoption
type: other
created_date: '2026-08-21 01:51'
updated_date: '2026-08-21 01:51'
---
# Backlog campaign tracker — QCLI-115 harness adoption

## Contract
- Mode: fmc-worker (Controller opum-doc work order, policy opencode-qwen-2026-08-20-v4-spike1)
- Scope: quest-cli only; harness/policy adoption, no product work
- Queue rule: single directed task QCLI-115

## Repository
| Repository | Task ids | AGENTS authority | Integration base | Required gates |
|---|---|---|---|---|
| quest-cli | QCLI-115 | FMC Worker quest-cli / Controller opum-doc, dev only | 019e2ee06458e3696d079dd2d6e5df6e66dbfd03 | lore check --strict, lore agent list/show/context, bun run check, bun run check:packages, git diff --check, zero product-source delta |

## Frontier
Resolved 1; in flight 0; blocked 1 (QCLI-97.5 external Lore-side owner decision edge); ready 0.

## Queue
| Order | Task | Dependencies | State | Wave | Likely paths |
|---|---|---|---|---|---|
| 1 | QCLI-115 | none | Done | wave 1 | .lore/agents/*.toml, backlog/tasks/qcli-115*.md |

## Resolved
| Task | Wave | Disposition | Evidence pointer |
|---|---|---|---|
| QCLI-115 | wave 1 | Done, all 5 ACs checked; PR #132 merged 8c35b9eb4ed7fac73874a6cda941b1f3476d659a + settlement PR #133 merged cd0e437ff3928d54840ba96e23b6e0dc2ad9295f; lease 9dde8a9559eb35480f5c1226b51953fa returned with ID/holder fencing | task notes + final summary |

## Human decisions and blockers
- QCLI-97.5 remains blocked on the external Lore-side owner decision edge (published Lore 0.1.0 lacks Quest adapter); no Quest-side action unblocks it. Not resumed by this session.

## Wave log
- wave 1 (2026-08-21): QCLI-115 executed in leased Treehouse worktree .treehouse/.treehouse/quest-cli-40ae4d/1/quest-cli from pinned base 019e2ee; rebased via --autostash (sole tracked dirty file proven byte-identical to integrated dev state, sha256 0df3eb73cf3a3d2ab229fd924dc65a656e94e6071f8c024ce4e6b94f2aed0dee both sides); unique artifacts (task record sha256 ac7906b7f71543da978d1301e280956dd4e762fd51300a1e75e79dffd2069b0c + three profile TOMLs) committed as 484286c with parseable Refs: QCLI-115 trailer; two-axis review dispatched (standards+spec returned empty — model-side failure), fallback code-reviewer single-pass approve with zero blocking findings; independent verify re-ran all 7 gates exit 0; delivered non-force via PR #132 (squash 8c35b9e) and settlement PR #133 (squash cd0e437); primary fast-forwarded to cd0e437 == origin/dev; older superseded draft profiles retained at /var/folders/lf/1qgs5_xd7js_y63j1_5jhwk00000gn/T/opencode/qcli-115-retained/agents/ before removal; opencode.jsonc kept as untracked local generated link by design.
