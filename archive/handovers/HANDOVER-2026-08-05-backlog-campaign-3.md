# Handover — Ratify Quest CLI Phase 1 component decisions (waves: 0, tasks: QCLI-24..28)

**Date**: 2026-08-05 | **Grounded against**: `dev` @ `f8b951a`, clean, in sync with `origin/dev` (pushed) | **Campaign doc**: `doc-4`, `backlog/docs/campaigns/doc-4 - Backlog-campaign-tracker.md`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli. This is
the FIRST restore for this campaign — 0 waves completed so far, campaign was
just initialized. 5 tasks are filed and campaign-labelled: QCLI-24, QCLI-25,
QCLI-26, QCLI-27 (independent, no dependencies) and QCLI-28 (depends on all
four). Queue order confirmed by the user on 2026-08-05; do not re-ask — see
doc-4's "Confirmed queue order" section.
The ready set is recomputed live at restore — do NOT hardcode a "next wave"
list here; QCLI-24..27 are expected to be wave 1 and QCLI-28 wave 2, but
recompute rather than assume.
dev is already pushed and in sync with origin/dev as of this handover.
```

## State

| Item | Status |
| ---- | ---- |
| Campaign doc | `doc-4`, populated, current |
| Story | `docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md`, linked to QCLI-24..28 via `lore link`, `lore sync`/`check`/`orphans` all clean |
| Tasks filed | QCLI-24, QCLI-25, QCLI-26, QCLI-27 (To Do, no deps), QCLI-28 (To Do, depends on all four) |
| Waves run | 0 |
| Worktrees | 6 `treehouse` pool slots, all `status: "available"` (no lease held) — normal idle state, not orphaned |
| Branches | none created yet for this campaign |
| Open PRs | none |
| `dev` vs `origin/dev` | in sync — `31db56e`, `cca60a8`, `ef15e16`, `f8b951a` all pushed |

## This session's in-flight wave (omit if clean)

(clean — no wave dispatched this session)

## Next steps

1. Recompute the ready set live (`backlog task list --json` + `task view --json` on QCLI-24..28) — expect QCLI-24/25/26/27 ready, QCLI-28 blocked on them.
2. Dispatch wave 1 = {QCLI-24, QCLI-25, QCLI-26, QCLI-27} (all four fit under the wave-size cap of 6, and are conflict-disjoint — each touches a distinct new ADR file plus its own task).
3. After wave 1 settles, wave 2 = {QCLI-28} — it reconciles three shared reference/spec files (`quest-cli-open-component-decisions.md`, `quest-cli-component-contracts-and-delivery-graph.md`, `quest-cli-delivery-roadmap.md`) and must NOT run until all four ADRs are merged, since its acceptance criteria require citing each one's actual accepted filename.

## Critical context / traps

- **The kind/outcome split is a deliberate deviation, not a mistake.** QCLI-24's task body records that the owner rejected `QCLI-18`'s recommended fused `<command>_<outcome-class>` `kind` form in favor of two separate `kind` + `outcome` fields (Kubernetes/Stripe-style), for alignment with common external convention. The dispatched worker must write the ADR to record this deviation explicitly, with its stated reason — not silently follow QCLI-18's original recommendation.
- **QCLI-27's LICENSE file**: MIT, copyright line dated 2026 attributed to `opum-ai` (confirmed via `gh api repos/opum-ai/quest-cli --jq .full_name` as the current org during this session — re-verify per this repo's standing fleet-routing convention if it's been a while).
- **QCLI-28 is genuinely blocked**, not just ordered — its ACs require citing the specific ADR/reference document that closed each register row, so it cannot start (even in draft) until QCLI-24..27 are merged and their final filenames/commit SHAs are known.
- **Scope boundary the reviewer must hold the line on**: none of these five tasks may freeze the runtime, native packaging, or projection storage/index engine (D2 stays blocked post-activation); D6, D7a, D7b, and the not-found convention's `lore-doc` half must stay untouched and unmarked-closed. QCLI-28's own ACs restate this, but it's worth a reviewer gut-check on every task, not just the reconciliation one.
- **Full decision record**: this session's transcript carries the complete ruling with rationale for every sub-decision (schemaVersion, kind/outcome, payload keys, exit codes, not-found, anomaly, ID grammar shape/prefix/layout/case-folding, scale target figures, license, contributor model, platforms). If a worker needs the reasoning behind a ruling beyond what QCLI-24..27's ACs already state, it is not otherwise written down anywhere in the repo yet — the task ACs are the durable record.

## Do not repeat

(nothing failed this session — clean init)
