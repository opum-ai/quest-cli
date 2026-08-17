---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 21:56'
---
## Contract

- Mode: autonomous-docs.
- Authorization: repository AGENTS autonomous campaign authority; the 2026-08-17 init made QCLI-98 the top priority.
- Scope: quest-cli only. Lore CLI repository changes, registry publication, global package mutation, and dev-to-main promotion remain excluded unless separately authorized.
- Queue rule: dependencies, priority, then ordinal after QCLI-98.

## Repository

| Repository | Integration base | Required gates |
| --- | --- | --- |
| quest-cli | remote dev at e5e80ddb4daac4f666510d4343f861bc867a8629; QCLI-103/QCLI-104 candidate at 80ec9546657dab921e70e086155c11445679f57a | Focused and full tests, package checks when impacted, Lore strict gates, diff check, independent review, required CI. |

## Frontier

- Resolved on dev: QCLI-97.1 through QCLI-97.4, QCLI-97.7, QCLI-97.8, QCLI-98, QCLI-99, QCLI-100, QCLI-101, QCLI-105, and QCLI-108.
- Delivery in flight: QCLI-103 and QCLI-104 are Done in Backlog and independently approved on campaign/qcli-103-planning-results; the reviewed 0.2.5 candidate is ready for metadata sync and PR delivery.
- Blocked or held: QCLI-97.5 requires separate Lore CLI authority or a published adapter contract. QCLI-97.9 records the stale installed Quest migration surface and requires separate authority before registry publication or global package mutation. QCLI-97.6 depends on both.
- Ready after delivery: QCLI-106, QCLI-107, QCLI-111, QCLI-112, QCLI-102, QCLI-109, and QCLI-110.

## Queue

| Order | Task | State | Next action |
| --- | --- | --- | --- |
| Delivery | QCLI-103 + QCLI-104 | Done; PR pending | Sync final task metadata, open the reviewed 0.2.5 PR, pass CI, merge to dev, and settle the lease. |
| 1 | QCLI-106 | Ready | Strict installed-agent check semantics. |
| 2 | QCLI-107 | Ready | Concurrency and permission error classification. |
| 3 | QCLI-111 | Ready | Diagnose Windows ARM64 projection hangs and restore it as a required lane. |
| 4 | QCLI-112 | Ready | Replace manual Git/index surgery for six large Bun artifacts with a supported workflow. |
| 5 | QCLI-102 | Ready | Version and short-help manifest invocability. |
| 6 | QCLI-109 | Ready | Flag values beginning with two dashes. |
| 7 | QCLI-110 | Ready | Output-mode flags before the command. |
| Held | QCLI-97.9 | Authority boundary | Qualify the installed migration artifact; publication/global install mutation needs separate authority. |
| Held | QCLI-97.5 | Authority boundary | Separate Lore CLI authority or published adapter contract. |
| Held | QCLI-97.6 | Dependencies | Depends on QCLI-97.5 and QCLI-97.9. |

## Current worktree

- Path: /Volumes/external/repos/quest-cli/.treehouse/.treehouse/quest-cli-40ae4d/1/quest-cli.
- Branch: campaign/qcli-103-planning-results.
- Lease: 12e81cf5ce0e6cba03e16a1ed4ef8dd6 held by qcli-103-writer.
- Base: e5e80ddb4daac4f666510d4343f861bc867a8629.
- Candidate: 80ec9546657dab921e70e086155c11445679f57a.
- Qualification: focused 28 tests / 690 expectations; full bun run check; package checks and packed tests; six 0.2.5 artifacts and checksums; strict Lore gates; diff check; cumulative independent approval.

## QCLI-100 settlement

- PR 109 merged to dev at e5e80ddb4daac4f666510d4343f861bc867a8629 with a tree identical to candidate e62f98c.
- Five projection lanes remain required. Windows ARM64 still runs as a visible step-level allowed failure and passed all 10 cases on the merge-qualifying run.
- QCLI-111 owns three-run diagnosis and restoration of Windows ARM64 as required.
- Merged branch and remote ref were deleted; lease 72e772f03fc7b7cab11319a897fddfd6 was returned with identity fencing.

## Follow-up evidence

- QCLI-111 owns the repeated Windows ARM64 projection hang. Runs 32068726985, 32069419875, and 32069839094 failed only that lane; the failure moved between recovery cases and exhausted 5s and 15s bounds.
- QCLI-112 owns Bun artifact delivery failures: six roughly 64–99 MB binaries have caused Git refresh/add/commit exit 137 in constrained Treehouse worktrees, requiring manual object/index operations and assume-unchanged hints.
- QCLI-97.9 owns Lore's installed-surface blocker. Live quest is a symlink into /private/tmp/quest-v0.2.2-qcli101.1NYgC7/candidate, reports 0.2.2, and omits all four migration backlog commands even though dev contains them.

## Retained artifacts

| Artifact | Owner | Reason | Cleanup condition |
| --- | --- | --- | --- |
| QCLI-103/QCLI-104 Treehouse lease and branch | campaign coordinator | Reviewed delivery candidate awaiting PR settlement. | Return only after reviewed work is merged or deliberately preserved. |
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
- 2026-08-17 — QCLI-103 and QCLI-104 reached Done with cumulative review approval; 0.2.5 candidate 80ec954 prepared for delivery.
