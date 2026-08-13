# Handover — Init the QCLI-2 clean-room research campaign (waves: 0, tasks: none resolved yet)

**Date**: 2026-08-04 | **Grounded against**: `dev` @ `0cf0f34`, clean, 0 unpushed (pushed at handover time — confirm with `git log origin/dev..dev`) | **Campaign doc**: `doc-1` at `backlog/docs/campaigns/doc-1 - Backlog-campaign-tracker.md`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli. This is
the first restore after init — no waves have run yet. The campaign is
QCLI-2's 9 research subtasks (QCLI-2.1–QCLI-2.9), all clean-room /
no-implementation research spikes, all labeled `campaign` +
`cluster:<name>`. Queue order was confirmed by the user on 2026-08-04; do
not re-ask. The ready set is recomputed live at restore — QCLI-2.1 is the
only task ready now (everything else depends on it, directly or
transitively). Do NOT hardcode a "next wave" list here.

Read docs/reference/quest-cli-component-charter.md and
docs/reference/former-ocli-to-qcli-migration-ledger.md before dispatching
any worker — every worker prompt must carry the clean-room constraints
(no product source/runtime deps/executable scaffolding/package
publication/release; do not inspect or port legacy Opum/OCLI implementation
source or tests; any Quest-wide vocabulary/architecture/roadmap finding is
a proposal to quest-doc, not normative here).

QCLI-2 (the parent) is not itself dispatched — it's satisfied once all 9
children are Done, settled by the user/orchestrator afterward, not
mechanically checked off.
```

## State

| Item | Status |
| ---- | ------ |
| Campaign doc | Created and populated: `doc-1` |
| Labels | `campaign` + `cluster:*` applied to all 9 subtasks (QCLI-2.9 newly included at owner's confirmation) |
| Waves run | 0 |
| Tasks resolved | 0 |
| `.claude/handovers/` gitignored | Yes |
| `archive/handovers/` exists | Yes |
| Local `dev` vs `origin/dev` | in sync as of commit `0cf0f34` (verify before acting — this session pushed through `649daad`; confirm `0cf0f34` is pushed too) |

## This session's in-flight wave (omit if clean)

None — clean, nothing dispatched yet.

## Next steps

1. `git fetch` and re-verify `dev`/`origin/dev` match before doing anything (R2).
2. Compute the ready set live: QCLI-2.1 is unblocked now; everything else waits on it directly or transitively.
3. Dispatch wave 1 = QCLI-2.1 alone (cluster `provenance`). Review, merge, settle.
4. Recompute — wave 2 should open up QCLI-2.2, QCLI-2.7, and QCLI-2.9 in parallel (no cluster overlap).

## Critical context / traps

- The migration ledger (`docs/reference/former-ocli-to-qcli-migration-ledger.md`) and component charter (`docs/reference/quest-cli-component-charter.md`) are the governing documents for every task in this campaign — read them, don't skip because a task's own description looks self-contained.
- QCLI-2.9 was deliberately added late and initially lacked the `campaign` label — this was a conscious inclusion decision by the repository owner during init, not an oversight to "fix" by excluding it.
- Backlog/Lore tooling (`lore link`, `lore sync`) auto-commits `backlog/` changes it touches; direct `backlog task edit`/hand-edited `docs/` files do not auto-commit — this session committed those manually, matching the established repo convention of one commit per unit of work.
- This repo is shared with another agent identity (`@codex`) that has independently done real, well-governed work here (QCLI-1, QCLI-3, the ledger, the charter). Re-check ground truth every restore — do not assume this session's view of the queue is still current.

## Do not repeat

- (none yet — first handover, nothing failed)
