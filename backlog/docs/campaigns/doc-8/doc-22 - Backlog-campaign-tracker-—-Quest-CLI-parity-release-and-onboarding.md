---
id: doc-22
title: 'Backlog campaign tracker — Quest CLI parity, release, and onboarding'
type: other
created_date: '2026-08-19 03:32'
updated_date: '2026-08-28 23:51'
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
| quest-cli | QCLI-97.x, QCLI-134..136 | quest-cli (FMC Worker) | autonomous-docs, dev only | dev @ 3852c3c62de3bce3d15952a6fe0955bd2b9bf05d | source-gates + 6 platform jobs, typecheck/lint/layer/format, Lore strict gates |

## Frontier
Resolved 9 this session (QCLI-125..133). In flight 2 (QCLI-97.5, QCLI-97.11), both blocked. Ready 0: every remaining item needs an owner decision, a release action, or a cross-repo contract.

## Queue
| Order | Task | Repository/owner | Dependencies | State | Wave | Likely paths |
| --- | --- | --- | --- | --- | --- | --- |
| — | QCLI-134 | quest-cli | QCLI-133 (Done) | blocked — every AC is a product decision | 4 | docs/ policy record |
| — | QCLI-135 | quest-cli | none | blocked — release artifact + CI wiring, owner-authorized | 4 | .github/workflows, release process |
| — | QCLI-136 | quest-cli | QCLI-126, QCLI-132 (both Done) | blocked on AC5 only — needs a release stating the version floor | 4 | release notes |
| — | QCLI-97.5 | quest-cli | QCLI-97.2 (Done) | blocked — cross-repo Lore adapter contract, open since 2026-08-19 | carried | src/ports, Lore adapter |
| — | QCLI-97.6 | quest-cli | QCLI-97.5 | blocked behind QCLI-97.5 | carried | — |
| — | QCLI-97, 97.11, 97.11.4, 97.11.5 | quest-cli | ODOC-63.2 chain | carried, not triaged this session | carried | — |

## FMC coordination
| Message/approval id | Sender | Recipient | Status | Next action |
| --- | --- | --- | --- | --- |
| (history in .codex/handovers/active.md) | opum-doc | quest-cli | 10 delivered/closed through 2026-08-28 | none outstanding; no reply owed |
| approvals | none | none | 0 pending | none |

## Worktrees and retained artifacts
| Repository/path/ref | Owner | Lease/status | Disposition | Cleanup condition |
| --- | --- | --- | --- | --- |
| /Volumes/external/repos/quest-cli / dev | quest-cli | primary, not leased | clean, == origin/dev @ 3852c3c | none; owner-local |
| pool slot 1, slot 3 | quest-cli | available | all campaign leases returned this session | reusable |
| pool slot 2 — lease 2ee86dc2783cc2e01a588f3a15317948, branch quest/odoc-71.8-stdin-transport | foreign holder | leased, untouched | possible unlanded foreign work | owner-managed |
| local retention/primary-dirty-estate-20260828 @ e74f2b7 | quest-cli | local-only, never push | predecessor dirty estate, byte-preserved | never; restore paths on demand |

## Resolved
| Task | Wave | Disposition | Evidence pointer |
| --- | --- | --- | --- |
| QCLI-125 | 2 | Done — actionable no-git-repo message | PR #162 |
| QCLI-127 | 2 | Done — human-readable quest help | PR #162 |
| QCLI-131 | 2 | Done — bun.lock drift that was failing CI for every src PR | PR #163 |
| QCLI-130 | 2 | Done — false alarm, local bun 1.2.23 vs CI-pinned 1.3.14 | task record |
| QCLI-126 | 3 | Done — init wizard (name + prefix + instructions) | PRs #165, #170 |
| QCLI-128 | 3 | Done — quest instructions reviewed, zero discrepancies | task record |
| QCLI-129 | 3 | Done — Quest skill scaffolded and auto-installed by agents/init | PR #166 |
| QCLI-132 | 4 | Done — canonical task-ID prefix made workspace-configurable | PR #170 |
| QCLI-133 | 4 | Done — task edit can mutate title/priority/type/ordinal | PR #172 |

## Human decisions and blockers
- QCLI-134: all four ACs are product judgments (implement vs accept-as-exclusion for 8 remaining gaps, the AC-checkbox correctness call, writing exclusions down as policy, envelope convergence). Gap 1 of 9 closed by QCLI-133.
- QCLI-135 / QCLI-136 AC5: need a published release. Registry writes and dev→main promotion are never standing Worker authority per AGENTS.md.
- QCLI-97.5: needs an owner-approved Lore-side Quest adapter contract; Lore owns that side. Blocks QCLI-97.6.
- NEW, unfiled: manifest declares createdAt/updatedAt on task list/view/create, but the CLI never returns them and the store never holds them. Same class as QCLI-133. Recorded on QCLI-134; owner to decide whether to file.

## Wave log
- Wave 1 (2026-08-17..19): QCLI-123, QCLI-124 settled.
- Wave 2 (2026-08-28): reconciled a stale tracker pointer and the release-truth doc against live npm/GitHub state; removed the forbidden repo-level backlog-handover shadow; QCLI-125/127/130/131 settled. Found and fixed bun.lock drift that was silently failing source-gates for any src-touching PR.
- Wave 3 (2026-08-28): QCLI-126/128/129 settled. Reconciled a real divergence with a concurrent operator session (unpushed QCLI-136 commit merged rather than stranded, PR #168); persisted its QCLI-133..135 findings.
- Wave 4 (2026-08-28): QCLI-132 unblocked QCLI-126's last AC and most of QCLI-136; QCLI-133 closed the edit-field gap and its AC4 re-verification surfaced the createdAt/updatedAt contract gap. Queue then reached zero agent-resolvable items.
