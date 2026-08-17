---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 22:15'
---
## Contract

- Mode: autonomous-docs.
- Authorization: repository AGENTS autonomous campaign authority; the 2026-08-17 init made QCLI-98 the top priority.
- Scope: quest-cli only. Lore CLI repository changes, registry publication, global package mutation, and dev-to-main promotion remain excluded unless separately authorized.
- Queue rule: dependencies, priority, then ordinal after QCLI-98.

## Repository

| Repository | Integration base | Required gates |
| --- | --- | --- |
| quest-cli | remote dev at 764775a5070ffd39945fa7543dddd1f5b7079a8c; QCLI-106/QCLI-107 candidate at 41565b38924b638e9ac89c5dc9c1abd67779b57c | Focused and full tests, package checks when impacted, Lore strict gates, diff check, independent review, required CI. |

## Frontier

- Resolved on dev: QCLI-97.1 through QCLI-97.4, QCLI-97.7, QCLI-97.8, QCLI-98 through QCLI-101, QCLI-103 through QCLI-105, and QCLI-108.
- Delivery in flight: QCLI-106 and QCLI-107 are Done in Backlog and independently approved on campaign/qcli-106-agent-check; the reviewed 0.2.6 candidate is ready for metadata sync and PR delivery.
- Blocked or held: QCLI-97.5 requires separate Lore CLI authority or a published adapter contract. QCLI-97.9 records the stale installed Quest migration surface and requires separate authority before registry publication or global package mutation. QCLI-97.6 depends on both.
- Ready after delivery: QCLI-111, QCLI-112, QCLI-102, QCLI-109, and QCLI-110.

## Queue

| Order | Task | State | Next action |
| --- | --- | --- | --- |
| Delivery | QCLI-106 + QCLI-107 | Done; PR pending | Sync final task metadata, open the reviewed 0.2.6 PR, pass CI, merge to dev, and settle the lease. |
| 1 | QCLI-111 | Ready | Diagnose Windows ARM64 projection hangs and restore it as a required lane. |
| 2 | QCLI-112 | Ready | Replace manual Git/index surgery for six large Bun artifacts with a supported workflow. |
| 3 | QCLI-102 | Ready | Version and short-help manifest invocability. |
| 4 | QCLI-109 | Ready | Flag values beginning with two dashes. |
| 5 | QCLI-110 | Ready | Output-mode flags before the command. |
| Held | QCLI-97.9 | Authority boundary | Qualify the installed migration artifact; publication/global install mutation needs separate authority. |
| Held | QCLI-97.5 | Authority boundary | Separate Lore CLI authority or published adapter contract. |
| Held | QCLI-97.6 | Dependencies | Depends on QCLI-97.5 and QCLI-97.9. |

## Current worktree

- Path: /Volumes/external/repos/quest-cli/.treehouse/.treehouse/quest-cli-40ae4d/1/quest-cli.
- Branch: campaign/qcli-106-agent-check.
- Lease: 7d845d41d3da699aac657438517b56c9 held by qcli-106-writer.
- Base: 764775a5070ffd39945fa7543dddd1f5b7079a8c.
- Candidate: 41565b38924b638e9ac89c5dc9c1abd67779b57c.
- Qualification: focused 26 tests / 867 expectations; full bun run check 160 tests / 1404 expectations; package checks and packed tests; six 0.2.6 artifacts and checksums; diff check; independent task approvals; cumulative artifact review pending.

## QCLI-103/QCLI-104 settlement

- PR 110 merged to dev at 764775a5070ffd39945fa7543dddd1f5b7079a8c with a tree identical to candidate 10cc376.
- All 13 checks passed: source gates, six immutable package candidates, and six projection lanes. Windows ARM64 passed in 1m54s while remaining quarantined pending QCLI-111's diagnostic/restoration criteria.
- The remote branch was deleted and lease 12e81cf5ce0e6cba03e16a1ed4ef8dd6 was returned with identity fencing.

## Follow-up evidence

- QCLI-111 owns the repeated Windows ARM64 projection hang. Runs 32068726985, 32069419875, and 32069839094 failed only that lane; later merge-qualifying executions have passed but do not replace the required diagnostic and three clean restoration runs.
- QCLI-112 owns Bun artifact delivery failures: six roughly 64–99 MB binaries have caused Git refresh/add/commit exit 137 in constrained Treehouse worktrees, requiring manual object/index operations and assume-unchanged hints.
- QCLI-97.9 owns Lore's installed-surface blocker. Live quest is a symlink into /private/tmp/quest-v0.2.2-qcli101.1NYgC7/candidate, reports 0.2.2, and omits all four migration backlog commands even though dev contains them.

## Retained artifacts

| Artifact | Owner | Reason | Cleanup condition |
| --- | --- | --- | --- |
| QCLI-106/QCLI-107 Treehouse lease and branch | campaign coordinator | Reviewed delivery candidate awaiting PR settlement. | Return only after reviewed work is merged or deliberately preserved. |
| /private/tmp/quest-v0.2.2-qcli101.1NYgC7 | campaign coordinator | Recovery copy and current stale global Quest link target. | Do not remove while the global launcher points to it; replace only under explicit install authority. |
| Coordinator checkout changes, including bin/quest.cjs executable-bit change | user | Pre-existing user work. | Never discard or overwrite. |
| /private/tmp/quest-cli-index.lock.stale-* | campaign coordinator | Quarantined zero-byte stale locks. | Remove only after campaign Git operations settle and no recovery need remains. |

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
- 2026-08-17 — QCLI-106 and QCLI-107 reached Done with independent approvals; 0.2.6 candidate 41565b3 prepared for delivery.
