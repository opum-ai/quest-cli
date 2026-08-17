---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 22:59'
---
## Contract

- Mode: autonomous-docs.
- Authorization: repository AGENTS autonomous campaign authority; the 2026-08-17 init made QCLI-98 the top priority.
- Scope: quest-cli only. Lore CLI repository changes, registry publication, global package mutation, and dev-to-main promotion remain excluded unless separately authorized.
- Queue rule: dependencies, priority, then ordinal after QCLI-98.

## Repository

| Repository | Integration base | Required gates |
| --- | --- | --- |
| quest-cli | pinned dev settlement at 04cc4f6d2c58aab71c11f4fdca368d791400ca22 | Focused and full tests, package checks when impacted, Lore strict gates, diff check, independent review, required CI. |

## Frontier

- Resolved on dev: QCLI-97.1 through QCLI-97.4, QCLI-97.7, QCLI-97.8, QCLI-98 through QCLI-101, QCLI-103 through QCLI-108.
- Qualified for dev delivery: QCLI-111 is Done on branch campaign/qcli-111-windows-arm64; all acceptance criteria and three fresh six-lane runs pass.
- Blocked or held: QCLI-97.5 requires separate Lore CLI authority or a published adapter contract. QCLI-97.9 records the stale installed Quest migration surface and requires separate authority before registry publication or global package mutation. QCLI-97.6 depends on both.
- Ready after delivery: QCLI-112, QCLI-102, QCLI-109, and QCLI-110.

## Queue

| Order | Task | State | Next action |
| --- | --- | --- | --- |
| 1 | QCLI-111 | Done; delivery pending | Candidate d665b62 passed runs 32078281649, 32078283394, and 32078284926 across all six required lanes. |
| 2 | QCLI-112 | Ready | Replace manual Git/index surgery for six large Bun artifacts with a supported workflow. |
| 3 | QCLI-102 | Ready | Version and short-help manifest invocability. |
| 4 | QCLI-109 | Ready | Flag values beginning with two dashes. |
| 5 | QCLI-110 | Ready | Output-mode flags before the command. |
| Held | QCLI-97.9 | Authority boundary | Qualify the installed migration artifact; publication/global install mutation needs separate authority. |
| Held | QCLI-97.5 | Authority boundary | Separate Lore CLI authority or published adapter contract. |
| Held | QCLI-97.6 | Dependencies | Depends on QCLI-97.5 and QCLI-97.9. |

## Current worktree

- Lease 09a66ac0996d6ca33bd3d96e569eb5a9 is held by qcli-111-writer at /Volumes/external/repos/quest-cli/.treehouse/.treehouse/quest-cli-40ae4d/1/quest-cli.
- Branch: campaign/qcli-111-windows-arm64 from pinned 04cc4f6d2c58aab71c11f4fdca368d791400ca22.
- Last completed stage: QCLI-111 finalized after independent review, local 160-test qualification, one diagnosed remediation, and three clean exact-candidate matrices at d665b62.
- Next automatic action: commit task/tracker finalization, update the remote branch, open one PR to dev, verify required checks and merge, then settle the lease and activate QCLI-112.

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
