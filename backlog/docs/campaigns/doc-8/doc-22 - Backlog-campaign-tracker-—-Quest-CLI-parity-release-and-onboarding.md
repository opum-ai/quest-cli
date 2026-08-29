---
id: doc-22
title: 'Backlog campaign tracker — Quest CLI parity, release, and onboarding'
type: other
created_date: '2026-08-19 03:32'
updated_date: '2026-08-29 14:10'
---
# Backlog campaign — Quest CLI parity, release, and onboarding

## Contract
- Mode: autonomous-docs
- Session role: worker
- FMC identity: quest-cli
- FMC controller: opum-doc
- Scope and queue rule: quest-cli only; dependencies, then priority and ordinal.
- Standing owner instruction 2026-08-29: IGNORE the `pi` tooling. It commits its own runtime
  state and reports onto local `dev` in this shared checkout, unpushed. Do not preserve, branch,
  deliver, revert or report those commits. Work from a leased worktree based on `origin/dev` and
  leave the primary checkout's local `dev` and `.pi/` alone.
- Contract challenged and restored 2026-08-29: a `pi` migration briefly replaced AGENTS.md and
  deleted CLAUDE.md in the working tree; its author rolled it back. Both files are back at
  committed HEAD and the tree is clean. This contract stands.

## Repositories and routing
| Repository | Task ids | Mutation owner/FMC identity | AGENTS authority | Integration branch and pinned base | Required gates |
| --- | --- | --- | --- | --- | --- |
| quest-cli | QCLI-97.x, QCLI-134..146 | quest-cli (FMC Worker) | autonomous-docs, dev only | dev @ e3019dbcc5f99c42062806fb6d4b05692cd50912 | source-gates + 6 platform jobs, typecheck/lint/layer/format, Lore strict gates |

## Frontier
Resolved 10 (QCLI-125..133, QCLI-138). In flight 3: QCLI-97.5 and QCLI-97.11 are blocked;
QCLI-139 is implemented on branch `quest/qcli-139-list-filters` @ 681a4224 by a concurrent
operator session in this shared checkout and is under independent review, not yet delivered.
Ready 3 (QCLI-140, 141, 146) plus QCLI-137, which carries a product question.

## Queue
| Order | Task | Repository/owner | Dependencies | State | Wave | Likely paths |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | QCLI-140 | quest-cli | QCLI-134 | ready — data-integrity, mirrors task/draft archive | 6 | src/cli/main.ts |
| 2 | QCLI-141 | quest-cli | QCLI-134, QCLI-129 | ready — must reconcile the Quest skill, no "all" guide | 6 | agent-instructions.ts, .claude/skills/quest/SKILL.md |
| 3 | QCLI-146 | quest-cli | QCLI-138 | ready — third transport over the shared fold | 6 | src/contract/tracker/index.ts |
| 4 | QCLI-137 | quest-cli | none | ready, but AC1 is a product call (implement timestamps vs stop advertising them) | 6 | command-contract.ts, src/domain/tasks/tasks.ts |
| — | QCLI-139 | quest-cli | QCLI-134 | in flight — implemented off-session on `quest/qcli-139-list-filters` @ 681a4224; under review | 6 | src/cli/main.ts, src/application/tasks/tasks.ts |
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
| /Volumes/external/repos/quest-cli @ 681a4224 | quest-cli | primary, not leased | checked out on quest/qcli-139-list-filters, clean; local dev == origin/dev @ e3019db | return to dev after QCLI-139 lands |
| pool slots 1 and 3 | quest-cli | available | QCLI-138 and an unused QCLI-139 lease both returned this session | reusable |
| pool slot 2 — lease 2ee86dc2783cc2e01a588f3a15317948, branch quest/odoc-71.8-stdin-transport | foreign holder | leased, untouched | possible unlanded foreign work | owner-managed |
| local retention/primary-dirty-estate-20260828 @ e74f2b7 | quest-cli | local-only, never push | predecessor dirty estate, byte-preserved | never; restore paths on demand |
| .pi/ | another actor | untracked | residue of the rolled-back pi migration; archive/pre-pi/ is gone | not this session's to remove |

## Resolved
| Task | Wave | Disposition | Evidence pointer |
| --- | --- | --- | --- |
| QCLI-125, QCLI-127 | 2 | Done — actionable no-git-repo error; human-readable quest help | PR #162 |
| QCLI-131 | 2 | Done — bun.lock drift that was failing CI for every src PR | PR #163 |
| QCLI-130 | 2 | Done — false alarm, local bun 1.2.23 vs CI-pinned 1.3.14 | task record |
| QCLI-126, QCLI-128, QCLI-129 | 3 | Done — init wizard; instructions reviewed; Quest skill scaffolded and auto-installed | PRs #165, #166, #170 |
| QCLI-132 | 4 | Done — canonical task-ID prefix made workspace-configurable | PR #170 |
| QCLI-133 | 4 | Done — task edit can mutate title/priority/type/ordinal | PR #172 |
| QCLI-138 | 5 | Done — index-addressed AC/DoD operations; also closed a tracker-contract drift that had been failing probe() since QCLI-133 | PR #176 |

## Human decisions and blockers
- RESOLVED 2026-08-29 by its author: a `pi` migration replaced AGENTS.md with a single-coordinator
  contract (quest CLI, T-<n> ids, task/<ID> branches, npm test + lore check gates, pi_messenger)
  and deleted CLAUDE.md, uncommitted. This session stopped rather than execute under an unknown
  authority; the migration was then rolled back and both files are back at committed HEAD. Only an
  untracked .pi/ remains. The FMC Worker / autonomous-docs / Backlog.md contract governs.
- OPEN — release authority: QCLI-135 and QCLI-136 AC5 need a published release. Owner deferred;
  registry writes and dev to main are never standing Worker authority.
- OPEN — cross-repo: QCLI-97.5 needs an owner-approved Lore-side Quest adapter contract. Blocks QCLI-97.6.
- OPEN — QCLI-134 AC3/AC4: write the doc/config/mcp exclusions down as product policy, and record
  whether the Quest and Backlog envelopes are ever meant to converge.
- RESOLVED 2026-08-29: QCLI-134's 8-gap triage. Owner decided each individually — implement
  QCLI-138/139/140/141; defer QCLI-142/143/144/145 as future-not-scheduled. No "all" instructions
  guide. QCLI-141 must reconcile the QCLI-129 skill rather than fork guidance.
- RESOLVED 2026-08-29: the createdAt/updatedAt contract gap is filed as QCLI-137.

## Wave log
- Wave 1 (2026-08-17..19): QCLI-123, QCLI-124 settled.
- Wave 2 (2026-08-28): reconciled a stale tracker pointer and the release-truth doc against live npm/GitHub state; removed the forbidden repo-level backlog-handover shadow; QCLI-125/127/130/131 settled. Found and fixed bun.lock drift silently failing source-gates for any src-touching PR.
- Wave 3 (2026-08-28): QCLI-126/128/129 settled. Reconciled a real divergence with a concurrent operator session (unpushed QCLI-136 commit merged rather than stranded, PR #168).
- Wave 4 (2026-08-28): QCLI-132 unblocked QCLI-126's last AC and most of QCLI-136; QCLI-133 closed the edit-field gap and its AC4 re-verification surfaced the createdAt/updatedAt contract gap.
- Wave 4 settlement (2026-08-29): owner triaged all 8 remaining parity gaps individually; filed QCLI-137..145. Verified against Lore 0.3.4's shipped binary that no parity gap blocks Lore. Queue reopened with 4 ready implementation tasks.
- Wave 6 (2026-08-29, open): QCLI-139 arrived already implemented on quest/qcli-139-list-filters @ 681a4224 from a concurrent operator session in this shared checkout, rather than from a wave this session dispatched. Local dev never diverged. Under independent review before delivery; Backlog still shows it To Do until it lands.
- Wave 5 (2026-08-29): QCLI-138 settled through PR #176, all 7 CI checks green. Independent review of the first commit returned six findings, all fixed in a second commit. The HIGH one was outside the task's own surface: the tracker contract compares its required `task edit` field list to the manifest by exact sorted equality, and it had drifted by four fields since QCLI-133, so QuestTrackerClient.probe() was failing closed against a real Quest. It stayed invisible because every test drove the client from a hand-written fixture manifest that nothing compared to commandManifest. Both lists now carry all twelve fields, and two new drift guards — a probe against the manifest Quest actually publishes, and a binding from every documented `task edit` flag to the flag it accepts — were each confirmed red by reintroducing the drift they catch. QCLI-146 filed for the one review finding outside scope. Wave 6 was not started: the repository's AGENTS.md contract was found replaced.
