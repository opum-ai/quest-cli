# Handover — QCLI-6 register enumeration campaign (waves: 0, tasks: none yet)

**Date**: 2026-08-05 | **Grounded against**: `dev @ d2a8469`, clean, up to date with `origin/dev` (pushed) | **Campaign doc**: `doc-2`, `backlog/docs/campaigns/doc-2 - Backlog-campaign-tracker-—-QCLI-6-register-enumeration.md`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in this repo. This is a freshly-init'd,
single-task campaign (doc-2) — 0 waves run yet. Queue: QCLI-6 only, all
5 dependencies (QCLI-2.5/2.6/2.8/2.9/2.10) already Done, so it is
ready-now. Confirmed queue order (2026-08-05): 1. QCLI-6 — do not re-ask.
The ready set is recomputed live at restore — do NOT hardcode a "next
wave" list here; this note is informational only.

Known trap: doc-2's "Known trap" section documents the SHA-pinning
self-reference issue QCLI-2.12 hit (3 review cycles, escalated) — carry
that pointer into the QCLI-6 worker/reviewer prompts verbatim so it
isn't rediscovered unguided. QCLI-6's own task description already
names the mitigation (self-pin any of the five documents it co-edits,
per PR #17's Option A).

The prior QCLI-2 campaign (doc-1) is fully complete and untouched —
do not reopen or re-drain it.
```

## State

| Item | Status |
| ---- | ------ |
| Prior campaign (QCLI-2, doc-1) | Complete, all 14 subtasks + epic Done, archived and reported in a prior session |
| This campaign (doc-2) | Just created; 0 waves run |
| QCLI-6 | `To Do`, labelled `campaign`, `cluster:provenance`; dependencies all `Done`; ready-now |
| Working tree | Clean, `dev @ d2a8469`, pushed to `origin/dev` |
| Worktrees / leases | None acquired yet — `treehouse status` showed all 4 slots `available` as of this session |
| Open PRs | None |

## This session's in-flight wave (omit if clean)

None — clean. No wave has been dispatched yet.

## Next steps

1. `/clear` then `/backlog-handover restore` to dispatch QCLI-6 as wave 1 (a single-member wave — normal degradation, not a bug, since the whole campaign is one task).
2. Standard R4 loop: worker implements, reviewer independently re-verifies against the 4 ACs (register enumeration, Backlog.md public-surface evidence-class statement, Classification-field integrity, `lore check/validate/orphans --strict` all clean), orchestrator merges and settles.

## Critical context / traps

- QCLI-6 touches `docs/reference/quest-cli-research-source-register.md` and likely the migration ledger in the same task pass — the exact co-edit shape that caused QCLI-2.12's 3-cycle escalation. See doc-2's "Known trap" section and QCLI-2.12's own task notes / PR #17 for the durable self-pin fix.
- `doc-1` (the QCLI-2 campaign tracker) is a separate, closed campaign — do not write new wave-log entries into it; all new activity belongs in `doc-2`.

## Do not repeat

- (none — no attempts made this session)
