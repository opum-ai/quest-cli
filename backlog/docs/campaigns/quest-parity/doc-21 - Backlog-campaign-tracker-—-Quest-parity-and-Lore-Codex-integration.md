---
id: doc-21
title: Backlog campaign tracker — Quest parity and Lore/Codex integration
type: other
created_date: '2026-08-17 06:38'
updated_date: '2026-08-17 14:11'
---
## Contract

- Mode: autonomous-docs with explicit owner authorization for QCLI-97 product-code implementation in `quest-cli`.
- Scope: quest-cli only; any Lore CLI repository change remains outside scope.
- Queue rule: dependencies, then priority and ordinal.

## Repository

| Repository | Task ids | AGENTS authority | Integration base | Required gates |
| --- | --- | --- | --- | --- |
| `quest-cli` | QCLI-97, QCLI-97.2 through QCLI-97.6 | Explicit owner authorization covers product code in quest-cli; no sibling repository writes. | `dev` `38b77db5cd7717edf89d76f2bdba232fad5b93d1` | Task-specific tests, all-platform package qualification, Lore strict checks for docs, diff check, review. |

## Frontier

- Resolved: QCLI-97.1, QCLI-97.2, QCLI-97.3, QCLI-97.4; in flight: none; blocked: QCLI-97.5 cross-repository adapter coordination; ready: none.

## Queue

| Order | Task | Dependencies | State | Wave | Likely paths |
| --- | --- | --- | --- | --- | --- |
| 1 | QCLI-97.5 | QCLI-97.2 | Blocked | Held | Quest adapter and cross-product conformance; no Lore repo authority |
| 2 | QCLI-97.6 | QCLI-97.2, QCLI-97.3, QCLI-97.4, QCLI-97.5 | To Do | Held | qualification and release evidence |

## Resolved

| Task | Wave | Disposition | Evidence pointer |
| --- | --- | --- | --- |
| QCLI-97.1 | Pre-campaign audit | Done | `docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md` at `d2d047e`. |
| QCLI-97.2 | 1 | Done | Packed init/agent onboarding/help plus all-platform package checks passed. |
| QCLI-97.3 | 1 | Done | Subprocess planning/operator and loopback browser coverage plus all-platform package checks passed. |
| QCLI-97.4 | 2 | Done | Lifecycle/draft recovery tests and documented Backlog compatibility map passed. |

## Human decisions and blockers

- The owner authorized QCLI-97 product-code work on 2026-08-17, including Backlog-compatible archival/retention behavior.
- QCLI-97.5 requires a public Quest-to-Lore adapter contract and real cross-product conformance. It cannot proceed without explicit authority to change the separate Lore CLI repository or a published Lore-side adapter contract.
- The all-platform build now uses five verified Bun 1.3.14 target executables through `QUEST_BUN_TARGETS_DIR`; all package artifact and packed-install checks pass.
- Repository-wide lint is blocked by pre-existing nested Treehouse `biome.json` files. The layer gate reports pre-existing adapter-to-application and CLI-to-adapter imports; focused checks for changed paths pass.

## Wave log

- 2026-08-17 — Initialized after grounding `dev` at `d2d047e`; parity audit QCLI-97.1 was already complete.
- 2026-08-17 — Integrated lifecycle, planning, bootstrap, agent, discovery, and browser surfaces through `38b77db`.
- 2026-08-17 — Rebuilt all six platform packages through verified Bun targets; package artifacts, packed clean-install onboarding, full 142-test suite, typecheck, focused Biome, Lore strict validation/check, and diff check passed.
- 2026-08-17 — Settled QCLI-97.2, QCLI-97.3, and QCLI-97.4; refreshed the parity matrix, compatibility map, and Lore-managed Story state. The campaign now pauses only at QCLI-97.5’s separate-repository boundary.
