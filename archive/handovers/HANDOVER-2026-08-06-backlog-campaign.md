# Handover — Doc-cleanup campaign (waves: 0, tasks: QCLI-29, QCLI-30)

**Date**: 2026-08-06 | **Grounded against**: `dev` @ `1e3f89b`, clean, in sync with `origin/dev` (pushed) | **Campaign doc**: `doc-5`, `backlog/docs/campaigns/doc-5 - Backlog-campaign-tracker.md`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli. This is
the FIRST restore for this campaign — 0 waves completed so far, campaign was
just initialized. 2 tasks are filed and campaign-labelled: QCLI-29 and
QCLI-30, both independent (no dependencies, disjoint files). Queue order
confirmed by the user on 2026-08-06; do not re-ask — see doc-5's "Confirmed
queue order" section.
The ready set is recomputed live at restore — do NOT hardcode a "next wave"
list here; QCLI-29 and QCLI-30 are expected to be wave 1 together, but
recompute rather than assume.
dev is already pushed and in sync with origin/dev as of this handover.
```

## State

| Item | Status |
| ---- | ---- |
| Campaign doc | `doc-5`, populated, current |
| Tasks filed | QCLI-29 (To Do, no deps), QCLI-30 (To Do, no deps) |
| Waves run | 0 |
| Worktrees | 6 `treehouse` pool slots, all `status: "available"` (no lease held) — normal idle state, not orphaned |
| Branches | none created yet for this campaign |
| Open PRs | none |
| `dev` vs `origin/dev` | in sync — `0403b32`, `1e3f89b` both pushed |

## This session's in-flight wave (omit if clean)

(clean — no wave dispatched this session)

## Next steps

1. Recompute the ready set live (`backlog task list --json` + `task view --json` on QCLI-29, QCLI-30) — expect both ready, no blockers.
2. Dispatch wave 1 = {QCLI-29, QCLI-30} — both fit under the wave-size cap of 6, conflict-disjoint (QCLI-29 touches `docs/reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md`, `docs/reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md`, `docs/reference/quest-cli-scale-target-proposal.md`; QCLI-30 touches `docs/reference/quest-cli-component-contracts-and-delivery-graph.md`, `docs/specs/quest-cli-delivery-roadmap.md`, `docs/specs/quest-cli-architecture.md` — no file overlap).
3. Campaign is expected to be complete after this single wave — recompute the queue at settlement rather than assuming.

## Critical context / traps

- **Both tasks are pure doc-prose fixes with a tight "no other content changes" AC.** Reviewers should scrutinize scope creep past the named passages, same discipline as the QCLI-28 reviewer applied last campaign.
- **`lore sync` conflict risk from wave 1 of the prior campaign (doc-4) may not recur here but watch for it anyway**: last time, multiple workers each ran `lore sync` from a partial single-task view and regenerated shared index files (`docs/adr/index.md`, `docs/reference/index.md`, `docs/log.md`) independently, causing a cross-branch conflict caught at review. QCLI-29 and QCLI-30 only *edit* existing docs (no new docs created), so `lore sync` may not even be triggered — but if a worker's `lore validate --strict` prompts a sync, prefer deferring it to a centralized wave-level integration pass over letting both workers run it independently, per last campaign's resolution.
- **QCLI-30's three fixes are independent of each other within the task** (different files: contracts-and-delivery-graph.md, delivery-roadmap.md, architecture.md) — nothing here requires them to land in a particular order relative to each other, only that all three land in one task/PR per its AC.
- Fleet-routing convention (this repo's CLAUDE.md): re-verify `opum-ai/quest-cli` org ownership via `gh api repos/opum-ai/quest-cli --jq .full_name` if it's been a while since 2026-08-04 — do not trust a redirecting old URL.

## Do not repeat

(nothing failed this session — clean init)
