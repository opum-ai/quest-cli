# Handover — QCLI-36/37/38/39 doc-7-follow-up campaign (waves: 0, tasks: none resolved yet)

**Date**: 2026-08-06 | **Grounded against**: `dev` @ `967dd65`, clean, in sync with `origin/dev` (0 ahead, 0 behind) | **Campaign doc**: doc-8 (`backlog/docs/campaigns/doc-8 - Backlog-campaign-tracker.md`)

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli. This is the
first restore of a fresh campaign (doc-8) — 0 waves completed so far, 0 tasks
resolved. Campaign was seeded this session from 4 proposed follow-ups left by
the prior campaign (doc-7, QCLI-33/34/35), which the user approved filing and
running as a full campaign.

Queue: QCLI-36, QCLI-37, QCLI-38, QCLI-39 — all status To Do, label `campaign`
+ cluster label. User confirmed priority tie-break order 36 -> 37 -> 38 -> 39.
Do not re-ask about order unless R2 ground-truth verification finds something
changed.

UNRESOLVED at init, must be resolved live at R4b: QCLI-36, QCLI-37, and
QCLI-38 all potentially touch docs/reference/quest-cli-open-component-decisions.md
at different line ranges (QCLI-36 touches no doc content, only the QCLI-34
backlog task file; QCLI-37 touches ~line 167's mapping table; QCLI-38 touches
the open-item table row(s), analogous to QCLI-34's ~line 193 edit). Do the
real file-citation read before building the wave — do not assume they're
either all-conflicting or all-disjoint. QCLI-39 (log sync) should run last
regardless, so it can capture the other three's merge commits — the same
lesson wave 1 (doc-7) learned the hard way.

The ready set is recomputed live at restore — do NOT hardcode a "next wave"
list beyond what's stated here; this is context, not a plan to execute
blindly.
```

## State

| Item | Status |
| ---- | ------ |
| Campaign doc | doc-8, created and populated this session |
| QCLI-36 | To Do, `campaign` + `cluster:task-metadata`, not yet dispatched |
| QCLI-37 | To Do, `campaign` + `cluster:register-mapping-table`, not yet dispatched |
| QCLI-38 | To Do, `campaign` + `cluster:naming-scheme-reconciliation`, not yet dispatched |
| QCLI-39 | To Do, `campaign` + `cluster:lore-log-sync`, not yet dispatched |
| Worktrees | none open (all 6 treehouse pool slots available) |
| PRs | none open |
| Local `dev` | in sync with `origin/dev` at `967dd65` (the campaign-init commit), already pushed |

## This session's in-flight wave (omit if clean)

(clean — no wave dispatched this session)

## Next steps

1. R2: verify ground truth (`git fetch`, worktree/branch/PR sweep) before trusting anything above — this handover is fresh but the rule is unconditional.
2. R4b: do the live file-citation read for QCLI-36/37/38 against `docs/reference/quest-cli-open-component-decisions.md` — this is the one thing init deliberately left unresolved. Confirm whether QCLI-37 and QCLI-38 land in the same wave or need sequencing.
3. Dispatch wave(s) per whatever the conflict graph actually says; QCLI-39 last regardless.

## Critical context / traps

- QCLI-38 is the judgment-heavy one, same shape as QCLI-34 (which resolved cleanly without escalation): read the QCLI-25 ADR and register D4 closely, determine same-concept-vs-distinct for "naming scheme". ACs are written so either outcome is objectively verifiable. If the evidence is genuinely ambiguous, escalate per `reference/escalation.md` rather than forcing a call — don't let it stall QCLI-36/37/39.
- QCLI-39's AC3 ("no file other than docs/log.md is modified or committed") has an examined precedent from doc-7's QCLI-35: the `lore sync` tool's own documented contract requires committing dirty `backlog/` as part of regenerating docs/log.md, and that auto-commit is not a violation — it's the task's own bookkeeping, not "unrelated work". Don't let a worker/reviewer re-litigate this from scratch; point them at QCLI-35's notes and doc-7's wave-1 log entry.
- **Known hazard from doc-7's wave 1, not yet root-caused**: at some point during settlement, an unattributed `backlog`/`lore` interaction in the orchestrator's own checkout auto-committed dirty task-metadata files and left `docs/log.md` regenerated-but-uncommitted, causing local `dev` to diverge from `origin/dev` mid-wave. It was recoverable (reset to origin, redo the reproducible settlement writes) but the trigger was never identified. Watch for `git status`/`git log` showing unexpected commits or dirty files after routine `backlog task view`/`edit` calls in the main checkout, especially after a `git pull`.
- Docs/log.md will be stale again by the time QCLI-39 runs (it's the whole point of the task) — do not treat that staleness as a problem to fix in QCLI-36/37/38's own review; it's QCLI-39's job alone.

## Do not repeat

(nothing failed this session — campaign-init only: 4 tasks filed, doc-8 created, no wave attempted yet)
