---
id: doc-22
title: 'Backlog campaign tracker — Quest CLI parity, release, and onboarding'
type: other
created_date: '2026-08-19 03:32'
updated_date: '2026-08-29 00:33'
---
# Backlog campaign — Quest CLI parity, release, and onboarding

## Contract
- Mode: autonomous-docs
- Session role: worker
- FMC identity: quest-cli
- FMC controller: opum-doc
- Scope and queue rule: quest-cli only; dependencies, then priority and ordinal.

## Repositories and routing
| Repository | Task ids | Mutation owner/FMC identity | AGENTS authority | Integration branch and pinned base | Required gates |
| --- | --- | --- | --- | --- | --- |
| quest-cli | QCLI-97.x, QCLI-134..145 | quest-cli (FMC Worker) | autonomous-docs, dev only | dev @ 384df4fa1edf8ef717b3f8009365925adb0e342e | source-gates + 6 platform jobs, typecheck/lint/layer/format, Lore strict gates |

## Frontier
Resolved 9 (QCLI-125..133). In flight 2 (QCLI-97.5, QCLI-97.11), both blocked. Ready 4 and newly actionable: QCLI-138, 139, 140, 141 — all filed from the QCLI-134 triage the owner completed 2026-08-29. QCLI-137 is also ready but carries a product question inside it.

## Queue
| Order | Task | Repository/owner | Dependencies | State | Wave | Likely paths |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | QCLI-138 | quest-cli | QCLI-134 | ready — HIGH, only gap with a correctness dimension | 5 | src/application/tasks/edit-patch.ts, command-contract.ts |
| 2 | QCLI-139 | quest-cli | QCLI-134 | ready — --ready first, then remaining filters | 5 | src/cli/main.ts, src/domain/tasks/tasks.ts |
| 3 | QCLI-140 | quest-cli | QCLI-134 | ready — data-integrity, mirrors task/draft archive | 5 | src/cli/main.ts |
| 4 | QCLI-141 | quest-cli | QCLI-134, QCLI-129 | ready — must reconcile the Quest skill, no "all" guide | 5 | agent-instructions.ts, .claude/skills/quest/SKILL.md |
| 5 | QCLI-137 | quest-cli | none | ready, but AC1 is a product call (implement timestamps vs stop advertising them) | 5 | command-contract.ts, src/domain/tasks/tasks.ts |
| — | QCLI-134 | quest-cli | — | 8 of 8 gaps triaged; AC3/AC4 (exclusions-as-policy, envelope convergence) still open | 4 | docs/ policy record |
| — | QCLI-142..145 | quest-cli | QCLI-134 | FUTURE, explicitly not scheduled by the owner | — | — |
| — | QCLI-135, QCLI-136 | quest-cli | — | blocked — need an authorized release; owner deferred 2026-08-29 | — | release process |
| — | QCLI-97.5, 97.6 | quest-cli | cross-repo | blocked — Lore-side adapter contract, open since 2026-08-19 | carried | src/ports |
| — | QCLI-97, 97.11, 97.11.4, 97.11.5 | quest-cli | ODOC-63.2 chain | carried, not triaged | carried | — |

## FMC coordination
| Message/approval id | Sender | Recipient | Status | Next action |
| --- | --- | --- | --- | --- |
| history retained in prior handovers | opum-doc | quest-cli | 10 correlations delivered/closed through 2026-08-28 | none outstanding; no reply owed |
| approvals | none | none | 0 pending | none |

## Worktrees and retained artifacts
| Repository/path/ref | Owner | Lease/status | Disposition | Cleanup condition |
| --- | --- | --- | --- | --- |
| /Volumes/external/repos/quest-cli / dev | quest-cli | primary, not leased | clean, == origin/dev | none; owner-local |
| pool slots 1 and 3 | quest-cli | available | all campaign leases returned | reusable |
| pool slot 2 — lease 2ee86dc2783cc2e01a588f3a15317948, branch quest/odoc-71.8-stdin-transport | foreign holder | leased, untouched | possible unlanded foreign work | owner-managed |
| local retention/primary-dirty-estate-20260828 @ e74f2b7 | quest-cli | local-only, never push | predecessor dirty estate, byte-preserved | never; restore paths on demand |

## Resolved
| Task | Wave | Disposition | Evidence pointer |
| --- | --- | --- | --- |
| QCLI-125, QCLI-127 | 2 | Done — actionable no-git-repo error; human-readable quest help | PR #162 |
| QCLI-131 | 2 | Done — bun.lock drift that was failing CI for every src PR | PR #163 |
| QCLI-130 | 2 | Done — false alarm, local bun 1.2.23 vs CI-pinned 1.3.14 | task record |
| QCLI-126, QCLI-128, QCLI-129 | 3 | Done — init wizard; instructions reviewed; Quest skill scaffolded and auto-installed | PRs #165, #166, #170 |
| QCLI-132 | 4 | Done — canonical task-ID prefix made workspace-configurable | PR #170 |
| QCLI-133 | 4 | Done — task edit can mutate title/priority/type/ordinal | PR #172 |

## Human decisions and blockers
- RESOLVED 2026-08-29: QCLI-134's 8-gap triage. Owner decided each individually — implement QCLI-138/139/140/141; defer QCLI-142/143/144/145 as future-not-scheduled. No "all" instructions guide. QCLI-141 must reconcile the QCLI-129 skill rather than fork guidance.
- RESOLVED 2026-08-29: the createdAt/updatedAt contract gap is filed as QCLI-137.
- OPEN — release authority: QCLI-135 and QCLI-136 AC5 need a published release. Owner deferred; registry writes and dev→main are never standing Worker authority.
- OPEN — cross-repo: QCLI-97.5 needs an owner-approved Lore-side Quest adapter contract. Blocks QCLI-97.6.
- OPEN — QCLI-134 AC3/AC4: write the doc/config/mcp exclusions down as product policy, and record whether the Quest and Backlog envelopes are ever meant to converge.

## Wave log
- Wave 1 (2026-08-17..19): QCLI-123, QCLI-124 settled.
- Wave 2 (2026-08-28): reconciled a stale tracker pointer and the release-truth doc against live npm/GitHub state; removed the forbidden repo-level backlog-handover shadow; QCLI-125/127/130/131 settled. Found and fixed bun.lock drift silently failing source-gates for any src-touching PR.
- Wave 3 (2026-08-28): QCLI-126/128/129 settled. Reconciled a real divergence with a concurrent operator session (unpushed QCLI-136 commit merged rather than stranded, PR #168).
- Wave 4 (2026-08-28): QCLI-132 unblocked QCLI-126's last AC and most of QCLI-136; QCLI-133 closed the edit-field gap and its AC4 re-verification surfaced the createdAt/updatedAt contract gap.
- Wave 4 settlement (2026-08-29): owner triaged all 8 remaining parity gaps individually; filed QCLI-137..145. Verified against Lore 0.3.4's shipped binary that no parity gap blocks Lore. Queue reopened with 4 ready implementation tasks.
