---
id: doc-22
title: 'Backlog campaign tracker — Quest CLI parity, release, and onboarding'
type: other
created_date: '2026-08-19 03:32'
updated_date: '2026-08-28 19:09'
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
| quest-cli | QCLI-97, QCLI-97.5, QCLI-97.6, QCLI-125..129 | quest-cli (FMC Worker) | autonomous-docs, dev only | dev @ 672e8d07bd5e43ba265bba1278c7d41d3d58c7f2 | CI checks, tracker audit, lifecycle audit, Lore strict gates, clean Git grounding |

## Frontier
Resolved 2 (QCLI-123, QCLI-124) since the 2026-08-19 wave; in flight 1 (QCLI-97.5); blocked 1 (QCLI-97.6, on QCLI-97.5); ready 4 (QCLI-125, QCLI-126, QCLI-127, QCLI-128), with QCLI-129 depending on QCLI-126.

## Queue
| Order | Task | Repository/owner | Dependencies | State | Wave | Likely paths |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | QCLI-125 | quest-cli | none | ready | 2 | src/adapters/workspaces/local-workspaces.ts, src/cli/main.ts |
| 2 | QCLI-127 | quest-cli | none | ready | 2 | src/cli/main.ts |
| 3 | QCLI-128 | quest-cli | QCLI-124 (Done) | ready | 2 | docs/ (via lore), src/cli/main.ts (read-only) |
| 4 | QCLI-126 | quest-cli | none | ready | 2 | src/cli/main.ts |
| 5 | QCLI-129 | quest-cli | QCLI-126 | blocked until order 4 lands | 3 | .claude/skills/quest/ (new), src/cli/main.ts |
| — | QCLI-97.5 | quest-cli | QCLI-97.2 (Done) | blocked — cross-repo Lore adapter-contract ownership | carried | src/ports, Lore adapter contract |
| — | QCLI-97.6 | quest-cli | QCLI-97.5 (+6 other deps Done) | blocked on QCLI-97.5 | carried | — |

## FMC coordination
| Message/approval id | Sender | Recipient | Status | Next action |
| --- | --- | --- | --- | --- |
| b339f18302aa41af8d8ec87332b07d73 | opum-doc | quest-cli | superseded | closed by later correlations recorded in .codex/handovers/active.md history; no reply owed |
| (see .codex/handovers/active.md) | opum-doc | quest-cli | 10 delivered/closed through 2026-08-28 | continue addressed $codex-worker polling for new orders |

## Worktrees and retained artifacts
| Repository/path/ref | Owner | Lease/status | Disposition | Cleanup condition |
| --- | --- | --- | --- | --- |
| /Volumes/external/repos/quest-cli / dev | quest-cli | primary, not leased | coordination-only; clean, synced to origin/dev = origin/main @ 672e8d0 | none; owner-local |
| slot 1 - lease e62b04ac49071020360c51bbde2be4df, branch quest/qcli-123-opum-stdin-envelope (merged, tip in dev) | quest-cli worker | leased, return-eligible | none pending | return on a later order |
| slot 2 - lease 2ee86dc2783cc2e01a588f3a15317948, branch quest/odoc-71.8-stdin-transport | foreign holder | leased, untouched | possible unlanded foreign work | owner-managed |
| slot 3 - lease 0d1de965da1a11fd9ded949c974a0972, branch quest/campaign-reconcile-20260828 | this reconciliation | leased | tracker + release-truth + shadow-skill fix | return after this PR merges |
| local retention/primary-dirty-estate-20260828 @ e74f2b7 | quest-cli | local-only, never push | predecessor's 15-entry dirty/untracked estate, byte-preserved | never; restore individual paths on demand only |

## Resolved
| Task | Wave | Disposition | Evidence pointer |
| --- | --- | --- | --- |
| QCLI-123 | 1 | Done via PR #157 | task record final summary |
| QCLI-124 | 1 | Done via PRs #158/#159; 0.2.9 corrective candidate + install proof | task record; docs/reference/quest-cli-release-truth.md |
| Quest tracker-client public conformance | 1 | 3 passing tests | carried from 2026-08-19 wave |

## Human decisions and blockers
- QCLI-97.5 needs an owner-approved Lore-side Quest adapter contract (binary selection, probe behavior, write-response support) before it or QCLI-97.6 can settle. Cross-repository: Lore owns the adapter-contract side. Unresolved since 2026-08-19.
- RESOLVED 2026-08-28 (previously open): npm publication. 0.2.8 and 0.2.9 are both published; root and platform dist-tag latest = 0.2.9, verified live via npm view; GitHub Release v0.2.9 published. This does not unblock QCLI-97.6, which is gated on QCLI-97.5, not on publication.

## Wave log
- Wave 1 (2026-08-17..19): QCLI-123 and QCLI-124 settled (PRs #157/#158/#159); repaired handover cursor; resumed correlation b339f18302aa41af8d8ec87332b07d73.
- Wave 2 (2026-08-28, reconciliation): .codex/handovers/active.md was found pointing at completed, unrelated tracker doc-19 (empty frontier, 2026-08-14) and carrying a stale "npm latest still pending" claim contradicted by live registry state. Corrected the cursor's tracker pointer to this doc (doc-22, formerly "Quest CLI Wave A campaign doc-8"); confirmed QCLI-97.6 remains correctly blocked on QCLI-97.5 and not on publication; updated docs/reference/quest-cli-release-truth.md via lore to record actual 0.2.8/0.2.9 publication (root + platform dist-tags, GitHub Release v0.2.9); removed the stale repository-level .claude/skills/backlog-handover shadow that AGENTS.md forbids; filed QCLI-125..129 (quest init/help/instructions/skill gaps) and opened wave 2/3 for them.
