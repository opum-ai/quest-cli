---
id: doc-22
title: 'Backlog campaign tracker — Quest CLI parity, release, and onboarding'
type: other
created_date: '2026-08-19 03:32'
updated_date: '2026-08-29 15:23'
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
- The `pi` migration briefly replaced AGENTS.md and deleted CLAUDE.md on 2026-08-29; its author
  rolled it back. Both files are at committed HEAD. This contract stands.

## Repositories and routing
| Repository | Task ids | Mutation owner/FMC identity | AGENTS authority | Integration branch and pinned base | Required gates |
| --- | --- | --- | --- | --- | --- |
| quest-cli | QCLI-97.x, QCLI-134..149 | quest-cli (FMC Worker) | autonomous-docs, dev only | dev @ 2799d0e17c2f19a9e9dc9c0bbbecc2ec1e5c9e04 | source-gates + 6 platform jobs, typecheck/lint/layer/format, Lore strict gates |

## Frontier
The owner-approved queue is EMPTY. Resolved 16 (QCLI-125..133, 137..141, 146, 147). In flight 2,
both blocked cross-repo. Nothing remaining is authorized: QCLI-148 and QCLI-149 were filed from
this session's reviews and have no owner ruling; QCLI-142..145 are explicitly not scheduled;
QCLI-134 AC3 is Lore-owned; QCLI-135/136 need a release the owner deferred.

## Queue
| Order | Task | Repository/owner | Dependencies | State | Wave | Likely paths |
| --- | --- | --- | --- | --- | --- | --- |
| — | QCLI-148 | quest-cli | QCLI-141 | filed from review, awaiting an owner ruling | — | test/, guides.ts |
| — | QCLI-149 | quest-cli | QCLI-147 | filed from review, awaiting an owner ruling | — | edit-patch.ts, main.ts |
| — | QCLI-134 | quest-cli | — | AC1/AC2/AC4 closed; AC3 is the Lore-owned exclusions policy | 4 | consolidated Lore namespace |
| — | QCLI-142..145 | quest-cli | QCLI-134 | FUTURE, explicitly not scheduled by the owner | — | — |
| — | QCLI-135, QCLI-136 | quest-cli | — | blocked — release deferred by the owner 2026-08-29 and reaffirmed | — | release process |
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
| /Volumes/external/repos/quest-cli | quest-cli | primary, not leased | local `dev` diverged by pi commits; ignored per standing instruction | none; do not reset |
| pool slot 1 — lease d419d980c3c913f6327486b295b98602, branch quest/settle-campaign-wave6 | quest-cli | leased | this settlement | return after delivery |
| pool slot 3 | quest-cli | available | every campaign lease taken this session was returned | reusable |
| pool slot 2 — lease 2ee86dc2783cc2e01a588f3a15317948, branch quest/odoc-71.8-stdin-transport | foreign holder | leased, untouched | possible unlanded foreign work | owner-managed |
| local retention/primary-dirty-estate-20260828 @ e74f2b7 | quest-cli | local-only, never push | predecessor dirty estate, byte-preserved | never; restore paths on demand |

## Resolved
| Task | Wave | Disposition | Evidence pointer |
| --- | --- | --- | --- |
| QCLI-125, QCLI-127 | 2 | Done — actionable no-git-repo error; human-readable quest help | PR #162 |
| QCLI-131 | 2 | Done — bun.lock drift that was failing CI for every src PR | PR #163 |
| QCLI-130 | 2 | Done — false alarm, local bun 1.2.23 vs CI-pinned 1.3.14 | task record |
| QCLI-126, QCLI-128, QCLI-129 | 3 | Done — init wizard; instructions reviewed; Quest skill scaffolded | PRs #165, #166, #170 |
| QCLI-132 | 4 | Done — canonical task-ID prefix made workspace-configurable | PR #170 |
| QCLI-133 | 4 | Done — task edit can mutate title/priority/type/ordinal | PR #172 |
| QCLI-138 | 5 | Done — index-addressed AC/DoD ops; closed a tracker-contract drift failing probe() since QCLI-133 | PR #176 |
| QCLI-139 | 6 | Done — task list --ready and ten selection filters; arrived off-session, validated and corrected | PR #177 |
| QCLI-140 | 6 | Done — milestone archive; four other writers had to learn about the flag | PR #178 |
| QCLI-141 | 6 | Done — instructions <guide> and --list; guidance consolidated out of the skill | PR #179 |
| QCLI-146 | 6 | Done — tracker adapter reaches the index ops; vocabulary parity now compile-time | PR #180 |
| QCLI-137 | 6 | Done — task timestamps stored and returned; sort fields restored | PR #181 |
| QCLI-147 | 6 | Done — task edit --final-summary; reverted QCLI-141's caveat | PR #182 |

## Human decisions and blockers
- OPEN — QCLI-148 and QCLI-149 were filed from this session's reviews and are the only unblocked
  work left. They are new capability rather than completion of shipped work, so they need an owner
  ruling before a wave takes them.
- OPEN — release authority: QCLI-135 and QCLI-136 AC5 need a published release. Owner deferred
  2026-08-29 and reaffirmed later the same day; eight PRs have landed since 0.2.9 with no soak.
- OPEN — cross-repo: QCLI-97.5 needs an owner-approved Lore-side Quest adapter contract. Blocks QCLI-97.6.
- OPEN — QCLI-134 AC3: the doc/config/mcp exclusions still need writing down as product policy.
  Lore owns documentation, so that record belongs in the consolidated namespace, not here.
- RESOLVED 2026-08-29: QCLI-134 AC1/AC2 (nine-gap triage) and AC4. The Quest and Backlog envelopes
  are separate contracts and are not meant to converge; Quest is its own tool, and Backlog is the
  reference it was built from, so shape ALIGNMENT is expected but the serialization is not shared.
  An envelope-structure difference is a design fact; a concept or field-name difference is a defect.
- RESOLVED 2026-08-29: QCLI-137 implements timestamps rather than de-advertising them, and
  restores the two sort fields QCLI-139 had to drop.

## Wave log
- Waves 1-4 (2026-08-17..28): QCLI-123..133 settled. Reconciled a stale tracker pointer, a
  forbidden repo-level skill shadow, and bun.lock drift that was silently failing source-gates for
  every src PR. Wave 4 settlement triaged all nine remaining parity gaps individually.
- Wave 5 (2026-08-29): QCLI-138. Its review found the tracker contract's required field list had
  drifted since QCLI-133, so QuestTrackerClient.probe() was failing closed against a real Quest —
  invisible because every test drove the client from a fixture nothing compared to the manifest.
- Wave 6 (2026-08-29): QCLI-139, 140, 141, 146, 137, 147 settled; PRs #177-#182, all green.
  QCLI-139 arrived already implemented from a concurrent operator session and was validated rather
  than rewritten. Every task went through independent review, and every review found something the
  tests did not — overwhelmingly one class: a published surface promising what the code never
  delivers. That class is now closed by five guards, each confirmed red by reintroducing the drift
  it catches: manifest-vs-CLI emitted fields, skill-vs-guides duplication, adapter-vs-vocabulary
  parity (compile-time), CLI-vs-application sort fields, and help-vs-parser flags in both
  directions. QCLI-147's own review mutation-tested all ten publishing surfaces to find the last
  unguarded one.
