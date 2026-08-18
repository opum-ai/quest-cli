---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-18 01:27'
---
## Contract

- Mode: autonomous-docs.
- Authorization: repository AGENTS autonomous campaign authority; the 2026-08-17 init made QCLI-98 the top priority.
- Scope: quest-cli only. Lore CLI repository changes, registry publication, global package mutation, and dev-to-main promotion remain excluded unless separately authorized.
- Queue rule: dependencies, priority, then ordinal after QCLI-98.

## Repository

| Repository | Integration base | Required gates |
| --- | --- | --- |
| quest-cli | public; merged dev at 7044c8629f8553fdab7c0afc4ebc9a8ca6ba7ab2 | Focused and full tests, package checks when impacted, Lore strict gates, diff check, independent review, required CI. |

## Frontier

- Resolved on dev: QCLI-97.1 through QCLI-97.4, QCLI-97.7, QCLI-97.8, QCLI-98 through QCLI-101, QCLI-103 through QCLI-108.
- Resolved on dev: QCLI-111 merged through PR 113 at 70a6283 after all acceptance criteria and three fresh six-lane runs passed.
- Resolved on dev: QCLI-112 merged through PR 114 at 6f247cc after source, six immutable-package, and six projection lanes passed; the merge tree matched the exact candidate.
- Resolved on dev: QCLI-102 merged through PR 115 at b048d2c after source and all six immutable package jobs passed.
- Resolved on dev: QCLI-109 merged through PR 116 at 7286e23 after exact candidate 93ca3b0 passed source and all six public package lanes; the repository is now public.
- Active: QCLI-97.9 is authorized for an unpublished 0.2.7 candidate, six-platform rebuild, local packed artifacts, and global local-install replacement. npm publication remains unauthorized. QCLI-97.5 still requires separate Lore CLI authority; QCLI-97.6 and parent QCLI-97 depend on both.
- Resolved on dev: QCLI-110 merged through PR 118 at d35e794 after exact candidate 9c8d90a passed source and all six public package lanes.

## Queue

| Order | Task | State | Next action |
| --- | --- | --- | --- |
| Done | QCLI-111 | Delivered | PR 113 merged to dev at 70a6283; the exact source candidate passed three six-lane runs. |
| Done | QCLI-112 | Delivered | PR 114 merged to dev at 6f247cc; exact head passed source, six package, and six projection checks. |
| Done | QCLI-102 | Delivered | PR 115 merged to dev at b048d2c; exact head passed source plus six immutable-package checks. |
| Done | QCLI-109 | Delivered | PR 116 merged to dev at 7286e23; exact head passed source plus six public package jobs. |
| Done | QCLI-110 | Delivered | PR 118 merged to dev at d35e794; exact head passed source plus six public package jobs. |
| Active | QCLI-97.9 | In progress | Build, pack, locally install, and qualify Quest 0.2.7 without npm publication. |
| Held | QCLI-97.5 | Authority boundary | Separate Lore CLI authority or published adapter contract. |
| Held | QCLI-97.6 | Dependencies | Depends on QCLI-97.5 and QCLI-97.9. |
| Held | QCLI-97 | Parent frontier | Cannot complete until QCLI-97.5, QCLI-97.6, and QCLI-97.9 resolve. |

## Current worktree

- Lease e2267d974a0ae1932a343381fa2225d7 is held by qcli-97-9-writer at /Volumes/external/repos/quest-cli/.treehouse/.treehouse/quest-cli-40ae4d/1/quest-cli.
- Branch: campaign/qcli-97-9-installed-artifact from merged dev 2457ac2e36103ed73b70f41e4f476cbefeac0159.
- Last completed stage: owner authorized the local candidate/global-install path; QCLI-97.9 was activated with a 0.2.7 build, pack, installed qualification, and Lore handback plan.
- Next action: implement version and packed migration assertions, review and commit source, rebuild six packages, then perform isolated and authorized global local-install qualification.

## QCLI-106/QCLI-107 settlement

- PR 111 merged to dev at 1fdd1382b71cc6237c2e9dd023e27b76365a3409 with a tree identical to candidate 80ce2ad.
- Local qualification passed 160 tests / 1404 expectations, package checks, packed tests, six 0.2.6 artifacts and hashes, strict Lore gates, diff check, and cumulative independent review.
- The first source-gate run exposed only the new contention test exceeding Bun's default five-second timeout on the slower runner. A test-local 30-second bound preserved all five independent 12-writer rounds; the exact prepublication command then passed locally and in CI.
- Final CI passed the replacement source gate and all six immutable package candidates. The unchanged candidate also passed all six projection lanes; Windows ARM64 completed cleanly in 1m12s.
- The remote branch was deleted, both merged local campaign branches were removed after ancestor verification, and lease 7d845d41d3da699aac657438517b56c9 was returned with identity fencing.

## Follow-up evidence

- QCLI-111 owns the repeated Windows ARM64 projection hang. Runs 32068726985, 32069419875, and 32069839094 failed only that lane. Runs 32071578797 and 32075311643 are genuine clean ARM64 passes at pinned Bun 1.3.14; run 32073732956 contains a failed ARM64 test step masked by continue-on-error, so three fresh clean runs are still required.
- QCLI-112 owns Bun artifact delivery failures: six roughly 64–99 MB binaries have caused Git refresh/add/commit exit 137 in constrained Treehouse worktrees, requiring manual object/index operations and assume-unchanged hints.
- QCLI-97.9 owns Lore's installed-surface blocker. Live quest is a symlink into /private/tmp/quest-v0.2.2-qcli101.1NYgC7/candidate, reports 0.2.2, and omits all four migration backlog commands even though dev contains them.

## Retained artifacts

| Artifact | Owner | Reason | Cleanup condition |
| --- | --- | --- | --- |
| /private/tmp/quest-v0.2.2-qcli101.1NYgC7 | campaign coordinator | Recovery copy and current stale global Quest link target. | Do not remove while the global launcher points to it; replace only under explicit install authority. |
| Coordinator checkout changes, including bin/quest.cjs executable-bit change | user | Pre-existing user work. | Never discard or overwrite. |
| /private/tmp/quest-cli-index.lock.stale-* | campaign coordinator | Quarantined zero-byte stale locks. | Remove only after campaign Git operations settle and no recovery need remains. |
| /private/tmp/quest-bun-targets | campaign coordinator | Cached pinned Bun 1.3.14 cross-target compilers for six-artifact rebuilds. | Retain until QCLI-112 supplies the supported replacement workflow or the campaign ends. |

## Human decisions and blockers

- QCLI-97.9 cannot mutate the registry or global installed package without separate explicit authority. The issue is filed and does not block other repository-local ready work.
- QCLI-97.5 remains outside current authority because it needs changes in the separate Lore CLI repository or an owner-approved published contract.

## Wave log

- 2026-08-17 — PR 106 merged QCLI-98 and QCLI-108 at 8606e54.
- 2026-08-17 — PR 107 merged reconciled QCLI-97.8 and QCLI-101 at 47e1ddf.
- 2026-08-17 — PR 108 merged QCLI-99 at a0898da.
- 2026-08-17 — PR 109 merged QCLI-100 and the Windows ARM64 quarantine at e5e80dd.
- 2026-08-17 — QCLI-111, QCLI-112, and QCLI-97.9 were filed from live CI, Bun artifact, and Lore installation evidence.
- 2026-08-17 — PR 110 merged QCLI-103 and QCLI-104 at 764775a.
- 2026-08-17 — PR 111 merged QCLI-106 and QCLI-107 at 1fdd138 after one diagnosed test-timeout remediation and a clean rerun.
- 2026-08-17 — Restored QCLI-111 from the renewal cursor, corrected one masked ARM64 run, implemented phase diagnostics and cleanup proof, and obtained independent local approval with 160 tests passing.
- 2026-08-17 — Candidate 8086ad0 passed two full matrices; run 32077943944 isolated destination replacement EBUSY through 10.98s with immediate cleanup, prompting one measured retry-window remediation.
- 2026-08-17 — Remediated candidate d665b62 passed three fresh full six-lane runs (32078281649, 32078283394, 32078284926); every ARM64 test step passed 10 tests with terminal teardown success.
- 2026-08-17 — PR 113 merged QCLI-111 to dev at 70a6283 with a tree identical to the finalized candidate; branch cleanup and lease return completed before QCLI-112 activation.
- 2026-08-17 — QCLI-112 added the ordinary-porcelain six-target delivery command, portable constrained-failure fixture, package mapping checks, and source-qualification coverage; independent re-review accepted the finalized candidate after all local gates passed.
- 2026-08-17 — PR 114 run 32080175938 exposed QCLI-111's 5s afterEach hook timeout during EBUSY fixture cleanup; the narrow hook-bound remediation passed 160 tests and independent review before rerun.
- 2026-08-17 — PR 114 rerun 32080577863 exhausted the full teardown retry window and isolated cached SQLite statement zombies; explicit finalize plus close(true) passed 160 tests, scale budgets, and independent review before a fresh rerun.
- 2026-08-17 — Exact candidate 52e4cc2 passed run 32081140380 across all six projection lanes and run 32081140427 across source plus six immutable packages; PR 114 merged to dev at 6f247cc with an identical tree, then branch and lease cleanup completed.
- 2026-08-17 — QCLI-102 candidate f3d1ea5 passed source plus all six immutable package jobs in run 32082195825; PR 115 merged to dev at b048d2c with an identical tree, then campaign branch and lease cleanup completed.
- 2026-08-17 — QCLI-109 candidate da7e8c2 passed 164 local tests, package and Lore gates, and independent review; PR 116 run 32083278133 failed before any step because GitHub Actions billing capacity is unavailable, so the exact branch and lease are retained.

- 2026-08-17 — A read-only public-readiness audit found no accessible credential or license blocker; owner-approved visibility changed to public, generated platform binaries were added to `.gitignore`, exact candidate 93ca3b0 passed public run 32085979050 across source and all six package lanes, and PR 116 merged QCLI-109 to dev at 7286e23 with an identical tree.

- 2026-08-17 — QCLI-110 exact candidate 9c8d90a passed 166 local tests, independent review, and public run 32086897923 across source plus all six package lanes; PR 118 merged to dev at d35e794 with an identical tree.

- 2026-08-17 — PR 119 merged QCLI-110 settlement at 7044c86; the final merged-dev queue audit found no ready repository-local work, leaving only QCLI-97.5 and QCLI-97.9 owner-authority decisions plus their dependent QCLI-97.6 and parent QCLI-97.
