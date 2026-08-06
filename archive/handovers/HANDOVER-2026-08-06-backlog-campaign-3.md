# Handover — QCLI-33/34/35 doc-6-follow-up campaign (waves: 0, tasks: none resolved yet)

**Date**: 2026-08-06 | **Grounded against**: `dev` @ `37c0a21`, clean, ahead of `origin/dev` by 1 commit (not yet pushed) | **Campaign doc**: doc-7 (`backlog/docs/campaigns/doc-7 - Backlog-campaign-tracker.md`)

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli. This is the
first restore of a fresh campaign (doc-7) — 0 waves completed so far, 0 tasks
resolved. Campaign was seeded this session from 3 proposed follow-ups left by
the prior campaign (doc-6, QCLI-31/32), which the user approved filing and
running as a full campaign.

Queue: QCLI-33, QCLI-34, QCLI-35 — all status To Do, label `campaign` +
cluster label, no `--dep` between them (confirmed disjoint files, unlike the
QCLI-31→32 lore-sync conflict). User confirmed priority tie-break order
33 → 35 → 34 and explicitly approved running all three as ONE parallel wave.
Do not re-ask about order or grouping unless R2 ground-truth verification
finds something changed.

The ready set is recomputed live at restore — do NOT hardcode a "next wave"
list beyond what's stated here; this is context, not a plan to execute
blindly.
```

## State

| Item | Status |
| ---- | ------ |
| Campaign doc | doc-7, created and populated this session |
| QCLI-33 | To Do, `campaign` + `cluster:architecture-spec`, not yet dispatched |
| QCLI-34 | To Do, `campaign` + `cluster:terminology-reconciliation`, not yet dispatched |
| QCLI-35 | To Do, `campaign` + `cluster:lore-log-sync`, not yet dispatched |
| Worktrees | none open |
| PRs | none open |
| Local `dev` | 1 commit ahead of `origin/dev` (the campaign-init commit `37c0a21`) — not yet pushed; this is expected per the skill (push happens at R5 re-arm, not at init) |

## This session's in-flight wave (omit if clean)

(clean — no wave dispatched this session)

## Next steps

1. R2: verify ground truth (`git fetch`, worktree/branch/PR sweep) before trusting anything above — this handover is fresh but the rule is unconditional.
2. R4: compute the ready/conflict graph live. Expect QCLI-33, QCLI-34, QCLI-35 all ready, all disjoint by file citation (`docs/specs/quest-cli-architecture.md`; `docs/registers/quest-cli-open-component-decisions.md` + `docs/specs/quest-cli-component-contracts-and-delivery-graph.md`; `docs/log.md`) — should confirm the user's approved single-wave grouping.
3. Dispatch wave 1 = {QCLI-33, QCLI-34, QCLI-35}, review, serialize merge, settle.

## Critical context / traps

- QCLI-34 is the one watch item: its determination (whether "file layout" and "authored-record layout" are the same concept) is more judgment-heavy than the other two. ACs are written so either outcome is objectively verifiable from the QCLI-25 ADR + register D4 text — but if the worker/reviewer finds the evidence genuinely ambiguous, escalate per `reference/escalation.md` rather than forcing a call. Don't let it stall QCLI-33/35.
- QCLI-35's task explicitly requires `lore sync --dry-run` first to confirm the change set is confined to `docs/log.md` before writing — this is a direct lesson from QCLI-32 (doc-6), where an unscoped `lore sync` touched `docs/log.md` as an out-of-scope side effect. Don't let the QCLI-35 worker skip the dry-run.
- All 51 prior tasks (QCLI-1..32ish) are Done. This campaign starts a clean queue — no legacy in-flight state to reconcile.

## Do not repeat

(nothing failed this session — campaign-init only: 3 tasks filed, doc-7 created, no wave attempted yet)
