# Handover — doc-11 wave 1 complete (waves: 1, tasks resolved: QCLI-45, QCLI-47)

**Date**: 2026-08-07 | **Grounded against**: `dev` @ `7b40f8e`, clean, 1 commit ahead of `origin/dev` at write time (pushed immediately after) | **Campaign doc**: `doc-11` (`backlog/docs/campaigns/doc-11 - Backlog-campaign-tracker.md`)

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli. doc-11
wave 1 is complete and settled: QCLI-45 and QCLI-47 are Done and merged.
Nothing is in flight — no branches, no worktrees, no open PRs, 6/6 pool slots
free. 4 tasks queued, all To Do with the campaign label: QCLI-46, QCLI-48,
QCLI-49, QCLI-50. The ready set is recomputed live at restore — do NOT
hardcode a "next wave" list from this file.

ALL FOUR ARE UNBLOCKED. There are zero needs-human items and zero pending
owner decisions. Do not re-ask for any ruling.

QCLI-46's former blocker is SETTLED: the owner ruled 2026-08-07 that commit
a4ae6c5 is recorded as EXPLICITLY UNCITABLE — a dated note saying no directing
task exists, citing QCLI-46 as the task that RECORDED the gap, explicitly not
as the amendment's author. Do not invent, infer, or manufacture a citation via
a retroactive task. That ruling IS AC #4's required owner disposition; it is
recorded verbatim in QCLI-46's own description. Implement it, don't re-escalate.

Conflict note: QCLI-46 and QCLI-50 share cluster:supersession-convention and
both touch docs/reference/quest-cli-activation-gate-evidence-record.md and
CLAUDE.md — they must NOT run in the same wave. QCLI-48 and QCLI-49 share
cluster:campaign-machinery and both touch .claude/skills/backlog-handover/ —
also must not run together. So a legal wave is one from each cluster, e.g.
QCLI-46 + QCLI-48.

CRITICAL — read "Do not repeat" below before dispatching. The subagent return
path failed four times last session and the merge queue broke on dirty
dispatch-marking writes. Both have known workarounds.
```

## State

| Item | Status |
| ---- | ------ |
| Campaign doc | `doc-11`, wave-1 log and follow-up table written |
| Queue | 4 To Do (QCLI-46, 48, 49, 50), 0 In Progress, 65 Done |
| Ready now | **all 4** — no dependencies, no needs-human, no pending rulings |
| Waves run | 1 (QCLI-45 + QCLI-47, both merged and settled `Done`) |
| `dev` | `7b40f8e`, clean, pushed to `origin/dev` |
| Campaign branches | none, local or remote |
| Open PRs | none (#60 and #61 both merged and their branches deleted) |
| Treehouse pool | 6/6 slots available, zero leases |
| Blocked / needs-human | **none** |

## What wave 1 landed

| Task | Merged | Notes |
| ---- | ------ | ----- |
| QCLI-45 | `866b184` (PR #60) | Preserve-and-amend ruling recorded in `CLAUDE.md`; QCLI-42's deleted gate-result paragraph restored byte-verbatim. Zero deletion lines across `CLAUDE.md` and `docs/`. All 4 ACs confirmed. |
| QCLI-47 | `694e109` (PR #61) | Hybrid `Refs` trailer rule in SKILL.md with both exceptions named; per-commit-type table added to `wave-loop.md` section i; skill at `0.9.1-qcli.3`. All 4 ACs confirmed. |

Also on `dev` this session: `f955033` (R3 lore-log catch-up), `69c9494` (`lore sync`'s backlog auto-commit), `82ec77d` (wave-1 docs sync), `7b40f8e` (follow-up filing + QCLI-46 ruling).

## This session's in-flight wave

**None.** Wave 1 fully settled, both worktrees returned to the pool, both branches deleted local and remote.

## Next steps

1. R2 should find nothing to reconcile — `dev` was verified clean on every axis at `7b40f8e` and pushed. Confirm rather than assume.
2. R3's `lore sync` **will** produce a `docs/log.md` change, and that is expected, not drift: `82ec77d` and any later `docs/`-touching commit cannot record themselves. Gate with `lore check --strict` and commit it; do not treat it as a defect.
3. Build the wave from the cluster constraint above — one task per cluster. QCLI-46 + QCLI-48 is the natural first pair (highest-value from each side).
4. QCLI-46 must **re-derive** its site set. QCLI-44's counts are wrong in both directions and its notes are append-only, so both wrong figures are still present. Known floor: `research-source-register.md:420`, `backlog-migration-fidelity-contract.md:561`, `activation-gate-evidence-record.md:67` (the a4ae6c5 site — apply the uncitable ruling).

## Critical context / traps

- **QCLI-50 partially overlaps QCLI-45's finished work and must not undo it.** QCLI-50 asks whether *tense-only* edits fall under preserve-and-amend. If the owner's answer is "yes", it restores QCLI-42's re-tensed clause ("the Spec **now reports**" → "reported"). It must amend `CLAUDE.md`'s existing QCLI-45 ruling paragraph **inline and dated**, never rewrite it.
- **QCLI-48 will find that `7efc1a4` has no parseable trailer on `dev` today.** That is the known finding, not a new discovery. The task's job includes deciding the disposition of already-merged non-parseable commits — it explicitly does **not** rewrite history.
- **Everything under `docs/` is lore-managed.** Workers touching it must use `lore` and must **never** run `lore sync` on a per-task branch (six documented SHA-drift episodes). Only settlement syncs, on `dev`.
- **`.claude/skills/` is NOT lore-managed and NOT a historical record.** QCLI-48/49 may rewrite skill prose freely — the supersession convention governs `docs/`, not the skill. Do not apply preserve-and-amend there.

## Do not repeat

Two things failed this session. Both cost real time and both have workarounds.

1. **The subagent return path failed four times.** Two reviewer subagents, then two re-dispatched with an explicit "your final message IS the return value" instruction, all terminated idle without delivering a verdict. `SendMessage` to a stalled one also returned nothing. Workers returned fine — only reviewers failed. **Do not burn more dispatches on it.** If the first reviewer returns nothing, go straight to the skill's degraded mode: run the review yourself as an explicit adversarial pass (re-run the gates, re-derive the evidence, don't replay the worker's self-report). That is sanctioned by SKILL.md and it is what caught QCLI-47's trailer defect, which the worker's own report had claimed was fine. Budget one wave per session while in degraded mode.

2. **The merge queue broke on dirty dispatch-marking writes** — `error: cannot rebase: You have unstaged changes`. Root cause: with `auto_commit: false`, the orchestrator's `--add-label wave-N` edits leave `dev`'s copy of the task file dirty, while each worker commits its **own** copy in its worktree. Workaround used: verify the dirty file contains only labels + `updated_date` (no plan/notes — those live on the branch), `git checkout --` it, merge, then reconstruct labels at settlement. **QCLI-49 exists to fix this properly.** Until it lands, either avoid mid-wave label churn or clean the orchestrator checkout before rebasing any member.

Corrected, not failed, and worth not re-deriving: `%(trailers:key=Refs)` reporting empty does **not** mean the commit lacks a `Refs:` line — a blank line between it and the final trailer block hides it from git's parser. Verify with `git interpret-trailers --parse`, and author squash messages explicitly so the trailer lands in the final block. Both wave-1 merges and the docs-sync commit were verified parseable this way.
