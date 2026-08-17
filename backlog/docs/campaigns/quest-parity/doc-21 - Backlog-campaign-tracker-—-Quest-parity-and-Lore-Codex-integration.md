---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 21:27'
---
## Contract

- Mode: autonomous-docs.
- Authorization: repository AGENTS autonomous campaign authority; the 2026-08-17 init made QCLI-98 the top priority.
- Scope: quest-cli only. Lore CLI repository changes, registry publication, global package mutation, and dev-to-main promotion remain excluded unless separately authorized.
- Queue rule: dependencies, priority, then ordinal after QCLI-98.

## Repository

| Repository | Integration base | Required gates |
| --- | --- | --- |
| quest-cli | remote dev at a0898da60d3453ea29860cc23009ea28b06f112f; QCLI-100 quarantine source commit aa4ea24 | Focused and full tests, package checks, Lore strict gates, diff check, independent review, required CI. |

## Frontier

- Resolved on dev: QCLI-97.1 through QCLI-97.4, QCLI-97.7, QCLI-97.8, QCLI-98, QCLI-99, QCLI-101, QCLI-105, and QCLI-108.
- In flight: QCLI-100 is Done in Backlog and fully qualified locally on PR 109. The owner approved quarantining Windows ARM64 while retaining it as a visible allowed-failure matrix lane; required CI rerun is next.
- Blocked or held: QCLI-97.5 requires separate Lore CLI authority or a published adapter contract. QCLI-97.9 records the stale installed Quest migration surface and requires separate authority before registry publication or global package mutation. QCLI-97.6 depends on both.
- Ready after QCLI-100 delivery: QCLI-103, QCLI-104, QCLI-106, QCLI-107, QCLI-111, QCLI-112, QCLI-102, QCLI-109, and QCLI-110.

## Queue

| Order | Task | State | Next action |
| --- | --- | --- | --- |
| 1 | QCLI-100 | PR open | Push quarantine plus task/docs checkpoint, rerun required CI, merge PR 109, and settle the lease. |
| 2 | QCLI-103 | Ready | Planning mutation response records and specific kinds. |
| 3 | QCLI-104 | Ready | Follow QCLI-103; explicit add, remove, and replace task flags. |
| 4 | QCLI-106 | Ready | Strict installed-agent check semantics. |
| 5 | QCLI-107 | Ready | Concurrency and permission error classification. |
| 6 | QCLI-111 | Ready | Diagnose Windows ARM64 projection hangs and restore it as a required lane. |
| 7 | QCLI-112 | Ready | Replace manual Git/index surgery for six large Bun artifacts with a supported workflow. |
| 8 | QCLI-102 | Ready | Version and short-help manifest invocability. |
| 9 | QCLI-109 | Ready | Flag values beginning with two dashes. |
| 10 | QCLI-110 | Ready | Output-mode flags before the command. |
| Held | QCLI-97.9 | Authority boundary | Qualify the installed migration artifact; publication/global install mutation needs separate authority. |
| Held | QCLI-97.5 | Authority boundary | Separate Lore CLI authority or published adapter contract. |
| Held | QCLI-97.6 | Dependencies | Depends on QCLI-97.5 and QCLI-97.9. |

## QCLI-100 delivery evidence

- Branch: campaign/qcli-100-help-modes.
- Worktree: /Volumes/external/repos/quest-cli/.treehouse/.treehouse/quest-cli-40ae4d/1/quest-cli.
- Lease: 72e772f03fc7b7cab11319a897fddfd6 held by next-wave-coordinator.
- PR: 109.
- Product qualification: focused 24/24, full 156/156 with 1108 expectations, package checks, packed lifecycle, Lore strict gates, diff check, six 0.2.4 native artifacts, and two independent approvals.
- Owner decision: Windows ARM64 remains visible but allowed to fail; the other five lanes remain required. QCLI-111 owns restoration.
- Quarantine validation: YAML parse, actionlint, diff check, and independent review pass at source commit aa4ea24.

## Follow-up evidence

- QCLI-111 owns the repeated Windows ARM64 projection hang. Runs 32068726985, 32069419875, and 32069839094 failed only that lane; the failure moved between recovery cases and exhausted 5s and 15s bounds.
- QCLI-112 owns Bun artifact delivery failures: six roughly 64–99 MB binaries have caused Git refresh/add/commit exit 137 in constrained Treehouse worktrees, requiring manual object/index operations and assume-unchanged hints.
- QCLI-97.9 owns Lore's installed-surface blocker. Live quest is a symlink into /private/tmp/quest-v0.2.2-qcli101.1NYgC7/candidate, reports 0.2.2, and omits all four migration backlog commands even though origin/dev contains them.

## Retained artifacts

| Artifact | Owner | Reason | Cleanup condition |
| --- | --- | --- | --- |
| QCLI-100 Treehouse lease and branch | campaign coordinator | Unmerged, fully qualified 0.2.4 candidate and quarantine change. | Return only after PR 109 merges or is deliberately superseded. |
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
- 2026-08-17 — QCLI-100 completed and opened as PR 109 with 0.2.4 artifacts.
- 2026-08-17 — Owner chose quarantine after repeated Windows ARM64 projection failures. QCLI-111, QCLI-112, and QCLI-97.9 were filed from the resulting evidence.
