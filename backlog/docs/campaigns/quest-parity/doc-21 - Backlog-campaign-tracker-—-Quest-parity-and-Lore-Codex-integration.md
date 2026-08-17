---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 21:15'
---
## Contract

- Mode: autonomous-docs.
- Authorization: repository AGENTS autonomous campaign authority; the 2026-08-17 init made QCLI-98 the top priority.
- Scope: quest-cli only. Lore CLI repository work, registry publication, and dev-to-main promotion remain excluded.
- Queue rule: dependencies, priority, then ordinal after QCLI-98.

## Repository

| Repository | Integration base | Required gates |
| --- | --- | --- |
| quest-cli | remote dev at a0898da60d3453ea29860cc23009ea28b06f112f; QCLI-100 candidate at 7313237a | Focused and full tests, package checks, Lore strict gates, diff check, independent review, required CI. |

## Frontier

- Resolved on dev: QCLI-97.1 through QCLI-97.4, QCLI-97.7, QCLI-97.8, QCLI-98, QCLI-99, QCLI-101, QCLI-105, and QCLI-108.
- In flight: QCLI-100 is Done in Backlog and fully qualified locally on PR 109, but delivery is blocked by the required Windows ARM64 projection check.
- Blocked: QCLI-97.5 requires separate Lore CLI authority or a published adapter contract. QCLI-97.6 remains held by QCLI-97.5.
- Ready after delivery resumes: QCLI-103, QCLI-104, QCLI-106, QCLI-107, QCLI-102, QCLI-109, and QCLI-110.

## Queue

| Order | Task | State | Next action |
| --- | --- | --- | --- |
| 1 | QCLI-100 | Delivery blocked | Decide Windows ARM64 projection policy, then make one evidence-based change or quarantine decision and rerun PR 109. |
| 2 | QCLI-103 | Ready | Start from the post-QCLI-100 dev tip; planning mutation response records and specific kinds. |
| 3 | QCLI-104 | Ready | Follow QCLI-103 in the same planning surface; explicit add, remove, and replace task flags. |
| 4 | QCLI-106 | Ready | Strict installed-agent check semantics. |
| 5 | QCLI-107 | Ready | Concurrency and permission error classification. |
| 6 | QCLI-102 | Ready | Version and short-help manifest invocability. |
| 7 | QCLI-109 | Ready | Flag values beginning with two dashes. |
| 8 | QCLI-110 | Ready | Output-mode flags before the command. |
| Held | QCLI-97.5 | Blocked | Separate Lore CLI authority or published adapter contract. |
| Held | QCLI-97.6 | Held | Depends on QCLI-97.5. |

## QCLI-100 delivery evidence

- Branch: campaign/qcli-100-help-modes.
- Worktree: /Volumes/external/repos/quest-cli/.treehouse/.treehouse/quest-cli-40ae4d/1/quest-cli.
- Lease: 72e772f03fc7b7cab11319a897fddfd6 held by next-wave-coordinator.
- Candidate: 7313237a; PR 109.
- Product qualification: focused 24/24, full 156/156 with 1108 expectations, package checks, packed lifecycle, Lore strict gates, diff check, six 0.2.4 native artifacts, and two independent approvals.
- CI: five projection platforms pass. Windows ARM64 repeatedly times out in invalid sync progress recovery: 5.01s under the default, then 15.01s under an isolated workflow-level 15s budget. The original tampering case passed at 5.28s and 1.38s after its test bound.
- Stop threshold: reached after diagnosis, two scoped remedies and reruns, plus independent review. Do not raise the timeout again without evidence.

## Retained artifacts

| Artifact | Owner | Reason | Cleanup condition |
| --- | --- | --- | --- |
| QCLI-100 Treehouse lease and branch at 7313237a | campaign coordinator | Unmerged, fully qualified product candidate and CI evidence. | Return only after PR 109 merges or is deliberately superseded. |
| /private/tmp/quest-v0.2.2-qcli101.1NYgC7 | campaign coordinator | Recovery copy of pre-reconciliation native artifacts. | Remove after campaign settlement confirms no recovery need. |
| Coordinator checkout changes, including bin/quest.cjs executable-bit change | user | Pre-existing user work. | Never discard or overwrite. |
| /private/tmp/quest-cli-index.lock.stale-* | campaign coordinator | Quarantined zero-byte stale locks. | Remove only after campaign Git operations settle and no recovery need remains. |

## Human decisions and blockers

- Required decision for PR 109: either authorize a deeper, unrelated projection-sync diagnosis/fix on Windows ARM64, or approve quarantining/removing that experimental platform projection job from the required matrix. Repeatedly increasing timeouts is not approved by current evidence.
- QCLI-97.5 remains outside current authority because it needs changes in the separate Lore CLI repository or an owner-approved published contract.

## Wave log

- 2026-08-17 — PR 106 merged QCLI-98 and QCLI-108 at 8606e54.
- 2026-08-17 — PR 107 merged reconciled QCLI-97.8 and QCLI-101 at 47e1ddf.
- 2026-08-17 — PR 108 merged QCLI-99 at a0898da.
- 2026-08-17 — QCLI-100 completed and opened as PR 109 with 0.2.4 artifacts.
- 2026-08-17 — Windows ARM64 projection validation failed repeatedly in pre-existing recovery timing; five sibling platforms pass. Campaign paused at the required-check threshold pending a repository-policy decision.
