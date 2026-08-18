---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-18 01:53'
---
## Contract

- Mode: autonomous-docs.
- Scope: quest-cli only. Lore repository work, npm publication, and dev-to-main promotion remain outside standing authority.
- Global local installation was explicitly authorized for QCLI-97.9, but the session filesystem denied both home-prefix writes with EPERM.

## Repository

- Public repository: opum-ai/quest-cli.
- Integration base: dev at 4b1ed59e3553aca54a60de146cf531b35e6aee19.
- QCLI-97.9 PR 121 merged after source, six immutable-package, and six projection checks passed.

## Frontier

- Resolved on dev: QCLI-97.1 through QCLI-97.4, QCLI-97.7 through QCLI-97.9 repository delivery, and QCLI-98 through QCLI-112.
- Active: QCLI-97.9 remains In Progress only for active global-install proof.
- Held: QCLI-97.5 needs separate Lore CLI repository authority.
- Held: QCLI-97.6 and parent QCLI-97 depend on QCLI-97.5 and final QCLI-97.9 settlement.

## Queue

| Order | Task | State | Exact next action |
| --- | --- | --- | --- |
| Active | QCLI-97.9 | External install blocker | Install the retained root and darwin-arm64 0.2.7 tarballs into a writable global prefix, prove command and native realpaths plus version, rerun qualify:migration-artifact with provenance, then finalize. |
| Held | QCLI-97.5 | Authority boundary | Authorize work in the separate Lore CLI repository or supply its corrected external Quest contract. |
| Held | QCLI-97.6 | Dependencies | Resume after QCLI-97.5 and QCLI-97.9 settle. |
| Held | QCLI-97 | Parent frontier | Complete after all remaining children settle. |

## QCLI-97.9 evidence

- Source and shared qualifier: 5f94475.
- Six checksum-coupled Bun 1.3.14 artifacts: 436f4f6.
- Merged dev commit: 4b1ed59.
- Local gates: check:packages, test:packages, Lore strict validation/check, and bun run check with 166 tests.
- CI: projection run 32089435862 passed all six lanes; prepublication run 32089435865 passed source and all six immutable package candidates.
- Isolated root plus darwin-arm64 tarball install passed version 0.2.7, exact four migration manifest tuples, actor-free apply and rollback denied with exit 4, LCLI-315.4 alias, and full preview/apply/status/rollback.
- npm registry was not published or mutated.
- Active quest still reports 0.2.2 because both authorized home-prefix install attempts returned EPERM.

## Retained artifacts

| Artifact | Reason | Cleanup condition |
| --- | --- | --- |
| /private/tmp/quest-v0.2.7-qcli97.9.XdMfmc/tarballs | Seven attributable 0.2.7 local tarballs for the external global install and Lore handoff. | Remove after active global qualification and evidence capture. |
| /private/tmp/quest-v0.2.2-qcli101.1NYgC7 | Current stale global Quest link target and recovery copy. | Remove only after the global launcher no longer points to it. |
| /private/tmp/quest-bun-targets | Pinned Bun 1.3.14 cross-target compilers. | Remove after no further package rebuild is needed. |
| Treehouse lease e2267d974a0ae1932a343381fa2225d7 | Retained worktree at merged dev for QCLI-97.9 continuation. | Return after global qualification and task settlement. |
| Coordinator checkout changes | User-owned dirty state. | Never discard or overwrite. |

## Exact external install handoff

```sh
npm install --global --prefix /Users/jdnewhouse/.local \
  /private/tmp/quest-v0.2.7-qcli97.9.XdMfmc/tarballs/opum-ai-quest-0.2.7.tgz \
  /private/tmp/quest-v0.2.7-qcli97.9.XdMfmc/tarballs/opum-ai-quest-darwin-arm64-0.2.7.tgz \
  --ignore-scripts --no-audit --no-fund
command -v quest
quest --version
```

If the stale NVM symlinks must be removed first, preserve or unlink only the exact Quest launcher and package links; do not remove the retained 0.2.2 directory until realpath proves it is unused.
