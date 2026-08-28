---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-18 22:41'
---
## Contract

- Mode: autonomous-docs.
- Scope: quest-cli only. Separate Lore repository work, npm publication, and dev-to-main promotion remain outside standing authority.
- Queue rule: dependencies, priority, then ordinal.

## Repository

- Public repository: opum-ai/quest-cli.
- Integration base before final settlement: dev at 2b2f34daf3afea34a2d2a5295fc8d97c68a8fbec.
- QCLI-97.9 implementation PR 121 merged at 4b1ed59; handoff PR 122 merged at 2b2f34d.

## Frontier

- Resolved on dev: QCLI-97.1 through QCLI-97.4, QCLI-97.7 through QCLI-97.9, and QCLI-98 through QCLI-112.
- Held: QCLI-97.5 needs separate authority for changes in the Lore CLI repository.
- Held: QCLI-97.6 and parent QCLI-97 depend on QCLI-97.5.
- No ready quest-cli-only repository task remains.

## Queue

| Order | Task | State | Exact next action |
| --- | --- | --- | --- |
| Done | QCLI-97.9 | Qualified | Active quest resolves ~/.local/bin/quest, reports 0.2.7, and passed the installed migration qualifier with complete provenance. |
| Held | QCLI-97.5 | Authority boundary | Authorize work in the separate Lore CLI repository, or supply its corrected external Quest contract. |
| Held | QCLI-97.6 | Dependency | Resume after QCLI-97.5 settles. |
| Held | QCLI-97 | Parent frontier | Complete after QCLI-97.5 and QCLI-97.6 settle. |

## QCLI-97.9 final evidence

- Source and shared qualifier: 5f94475.
- Six checksum-coupled Bun 1.3.14 artifacts: 436f4f6.
- Implementation merge: 4b1ed59.
- Local gates: check:packages, test:packages, Lore strict validation/check, and bun run check with 166 tests.
- CI: projection run 32089435862 passed all six lanes; prepublication run 32089435865 passed source and all six immutable package candidates.
- Active command: /Users/jdnewhouse/.local/bin/quest.
- Active launcher realpath: /Users/jdnewhouse/.local/lib/node_modules/@opum-ai/quest/bin/quest.cjs.
- Active native realpath: /Users/jdnewhouse/.local/lib/node_modules/@opum-ai/quest-darwin-arm64/bin/quest.
- Active version: 0.2.7.
- Active qualifier: exact preview/apply/status/rollback manifest tuples; actor-free apply and rollback denied exit 4; TASK-1, LCLI-315.4, and TASK-2.1 aliases; full preview/apply/status/rollback; source, artifact, tarball, and installed-path provenance.
- Independent closure review accepted AC1 through AC6.
- No npm publication or registry mutation occurred; registry lookup for 0.2.7 remained E404.

## Retained state pending settlement

| Artifact | Reason | Cleanup condition |
| --- | --- | --- |
| Historical Treehouse lease `e2267d974a0ae1932a343381fa2225d7` | Former coordinator worktree for final-evidence delivery; live Treehouse status is `[]`, so it is no longer retained state. | No cleanup action: no live lease or corresponding worktree exists. |
| `/private/tmp/quest-bun-targets` | Confirmed absent during ODOC-65 housekeeping; the stale retained-artifact claim was removed from the executable cursor. | No cleanup action: path is already absent. |
| Coordinator checkout changes | Historical record reconciled against the primary checkout, now clean at `bb117004544967880ba8489ea43e005f4af1c1fc`. | Preserve any future user-owned dirty state; do not discard or overwrite it. |

## Human decision

QCLI-97.5 is the only remaining campaign frontier. Continuing it requires explicit authorization to modify the separate Lore CLI repository.
