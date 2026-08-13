# Handover — init doc-13 over doc-12's two approved follow-ups (waves: 0, tasks: none yet)

**Date**: 2026-08-08 | **Grounded against**: `dev` @ `d63c9cf`, clean, 1 ahead of `origin/dev`, 0 behind | **Campaign doc**: doc-13 (`backlog/docs/campaigns/doc-13 - Backlog-campaign-tracker.md`)

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli. This is a
fresh campaign (doc-13) at init — 0 waves completed, 0 tasks resolved. The queue
is QCLI-52 and QCLI-53, both labelled campaign + cluster:skill-docs, both To Do.

Queue order confirmed by the user on 2026-08-08: QCLI-52 first, then QCLI-53. Do
not re-ask. The ready set is recomputed live at restore — do NOT hardcode a
"next wave" list.

Two locked decisions from init, both recorded in doc-13:

1. These two tasks CONFLICT and cannot share a wave — both AC#5 requires an
   entry in .claude/skills/backlog-handover/SKILL.md's Provenance section, on
   shared adjacent lines, with a sequentially numbered version bump. This is
   deliberately NOT modelled as a native --dep (neither needs the other's
   content). Expect two waves of one task each. A wave of size 1 here is the
   wave builder correctly degrading to sequential, not a defect.

2. This campaign edits its own driver. Both tasks modify SKILL.md and/or
   reference/wave-loop.md. The user ruled at init: follow the version read at
   init for the whole campaign; merged changes take effect for the NEXT
   campaign, not mid-flight. After wave 1 merges, the on-disk skill will differ
   from the one this campaign is executed under — that is expected, not drift.

Wave 2's worker must read the Provenance section as it exists in its REBASED
worktree, not as it existed at init, before choosing its version string
(0.9.1-qcli.7 is unclaimed as of init; the last recorded is .6 from QCLI-51).

Nothing is in flight. No branches, no worktree leases, no open PRs.
```

## State

| Item | Status |
| ---- | ------ |
| Campaign doc | doc-13, created and populated at init |
| Queue | 2 `To Do` (QCLI-52, QCLI-53), 70 `Done`, 72 total |
| In flight | None |
| Blocked / needs-human | None |
| Waves completed | 0 |
| Branch | `dev` @ `d63c9cf`, clean, 1 commit ahead of `origin/dev` (the init commit — unpushed) |
| Campaign branches | None, local or remote |
| Open PRs | None |
| Worktree pool | 6 treehouse slots, all `available`, zero leases |
| Active handover | This file |
| `.gitignore` / `archive/handovers/` | Both already in place — I3 setup was a no-op, no commit |

## This session's in-flight wave

None — init only. No worktree was acquired and no worker was dispatched.

## Next steps

1. `/backlog-handover restore`. R2 should find clean ground truth matching the State table above; the one expected difference is the unpushed init commit `d63c9cf` if it has not been pushed yet.
2. Wave 1 = QCLI-52 alone (conflict-serialized, not dependency-serialized). Its ACs are in the task; the description carries a method note that matters — **the sweep must search for prose about where campaign substate is recorded, not for the strings `in-review`/`merge-pending`**. QCLI-51's own AC#5 sweep grepped the label names and provably could not have caught either passage QCLI-52 targets.
3. Wave 2 = QCLI-53 alone, after wave 1 merges. Its disposition is open by design — AC#2 requires the choice be derived from the current text with reasoning, including why the rejected wording was not adopted.

## Critical context / traps

- **The campaign edits the skill running it.** Locked ruling: execute under the init-time version. Do not re-read SKILL.md after wave 1's merge and switch procedures mid-campaign.
- **Version numbering is a serialization point.** `0.9.1-qcli.6` (QCLI-51) is the last recorded Provenance version as of init. Wave 1 takes `.7`, wave 2 takes `.8` — but wave 2's worker must confirm from its rebased worktree rather than assuming, since AC#5 on both tasks permits an explicitly justified *absence* of a bump, which would change the numbering.
- **Both AC#5s allow "no bump, explicitly justified."** A worker that bumps reflexively without considering that branch has not satisfied the criterion as written.
- **QCLI-53 is pre-existing QCLI-49 debt, not a QCLI-51 defect.** Its description says so explicitly. A worker or reviewer that treats it as a regression in QCLI-51's merged diff will reach the wrong disposition.
- Per CLAUDE.md, `in-review` and `merge-pending` never appear in committed task state — do not expect them from `backlog task view` when classifying leftovers.

## Do not repeat

Nothing failed this session — init ran clean end to end. No approach was abandoned, so there is nothing to warn the next session away from.
