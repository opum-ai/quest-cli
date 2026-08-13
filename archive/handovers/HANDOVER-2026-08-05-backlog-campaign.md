# Handover — init the QCLI-11..QCLI-20 design-layer follow-through campaign (waves: 0, tasks: none dispatched)

**Date**: 2026-08-05 | **Grounded against**: `dev` @ `ffe8487`, clean, in sync with `origin/dev` | **Campaign doc**: `doc-3` — `backlog/docs/campaigns/doc-3 - Backlog-campaign-tracker-—-QCLI-11..QCLI-20-design-layer-follow-through.md`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli. Init only —
0 waves run, 0 tasks dispatched, nothing in flight. 10 tasks queued
(QCLI-11..QCLI-20), all To Do, all labelled campaign, all with a distinct
cluster: label. Queue order confirmed by the user on 2026-08-05 as
lowest-risk-first; do not re-ask. The ready set is recomputed live at restore —
do NOT hardcode a "next wave" list.

No task carries a Backlog dependencies entry, so wave composition is bounded by
authored-file ownership and the wave-size cap (6), not by dependency order. The
campaign doc's "Authored-file ownership" table pre-computes the conflict graph;
re-verify it rather than trusting it.

Traps: (1) any task editing a register-pinned document invalidates that pin on
merge whether or not it meant to touch the register — QCLI-12/13/14/16 each
carry an AC for this; (2) QCLI-17 may need to reach into the delivery roadmap
and functional requirements Specs, so serialize anything else touching those
two against it; (3) avoid raw < > { } in commit subjects — lore sync embeds
them unescaped into docs/log.md and lore check then fails on its own generated
content (upstream LCLI-316).
```

## State

| Item | Status |
| ---- | ------ |
| Default branch | `dev` @ `ffe8487`, clean, in sync with `origin/dev` |
| Campaign doc | `doc-3`, populated (frontier, confirmed order, clusters, authored-file ownership, needs-human, wave log) |
| Owning Story | `docs/stories/follow-through-on-the-quest-cli-design-layer.md` owns QCLI-12..QCLI-20; `docs/stories/prepare-quest-cli-for-implementation-activation.md` owns QCLI-11 |
| Queue | 10 To Do (QCLI-11..QCLI-20), 0 In Progress, 0 blocked |
| Campaign branches | none |
| Worktrees | 4 treehouse slots, **all `available`** — no leases held |
| Open PRs | none |
| Lore gates | `lore check` 38 files 0/0 · `lore validate --strict` 38 files 0/0 6 skipped · `lore orphans` 0/0 |
| Test/build/lint gate | **none exists in this repo** — the Lore gates are the only gates |
| Commits this session | `1330ecf` design layer, `dde1242` log sync, `3f78746` + `2dc263e` lore auto-commits, `ffe8487` campaign init (+ log sync). All pushed |

## This session's in-flight wave

None. Init only — no wave dispatched, nothing to resume.

## Next steps

1. `/backlog-handover restore`. R2's drift check should find nothing: no branches, no held leases, no open PRs, no `In Progress` tasks.
2. Wave 1 will be the first 6 of the confirmed order — QCLI-12 through QCLI-17 — if the live conflict graph confirms them disjoint. All six are pre-verified to write to distinct pre-existing documents.
3. Wave 2 picks up QCLI-11 and the three proposal tasks (QCLI-18, QCLI-19, QCLI-20), all of which write new documents only.

## Critical context / traps

- **`lore sync` does not auto-commit `docs/` in this environment.** It only commits `backlog/` when `lore link`/`unlink` left it dirty. Commit `docs/` explicitly. One trailing "would update docs/log.md" is the expected end state.
- **The SHA-pinning trap is generic to the mechanism, not a bug in any one fix.** Any task editing a document the research source register pins invalidates that pin on merge. Decide up front per task: self-pin in the same pass if the task also edits the register, or file the register correction separately. Carried forward from `doc-2`.
- **Implementation is still gated.** `lore-doc`'s `LDOC-4` was To Do when last observed 2026-08-04 — a moving reference. No campaign member produces product source, package metadata, a runtime dependency, or scaffolding, and none may.
- **Proposal tasks propose; they do not decide.** QCLI-18/19/20 produce documents for an owner ruling. No ADR, no accepted decision, and explicitly no edit to the open component decisions register — that reconciliation happens after a ruling, so the three do not contend for one file.
- **Confirming something is already fine is a real outcome.** QCLI-15 and QCLI-16 are audits; "already closed, here is the evidence" satisfies them. Two residuals were already narrowed at init because a live check disagreed with the note that recorded them.
- **This project files no follow-up without approval.** Wave-level integration findings are surfaced at R6 as drafted proposals and wait.
- **Never archive completed work.** No `backlog task archive` / `task complete` on campaign tasks.

## Do not repeat

- **Do not re-file a "Backlog.md v1.49.3 re-verification" task.** The user approved one at init; a live check the same hour showed the pin is current (`npm view backlog.md version` → `1.49.3`, `dist-tags.latest` `1.49.3`, `time.modified` 2026-08-03). The trigger has not fired. That task became QCLI-17, which corrects the register's own false claim instead. Re-running the v1.49.3 enumeration now would burn a wave slot to confirm what is already confirmed.
- **Do not widen QCLI-13 back to "add backlinks in both directions".** The playbook already cites the charter and the migration ledger at lines 75 and 427-428. Only the inbound direction is missing. The original QCLI-2.10 note said "or vice versa" and reading it literally would produce duplicate outbound links.
- **Do not assume QCLI-2.12's F4/F5 are open.** That task carries two different F-numbering schemes: an out-of-scope note about F4/F5, and a separate wave-4 integration escalation over F2/F3/F4 that **was resolved** on 2026-08-04 via the Option A self-pin. QCLI-15 must establish which scheme the out-of-scope note meant before treating anything as open.
- **Do not commit to `dev` without asking.** This session did (user asked explicitly), but the repo's own history is one PR per task, squash-merged, with a `Refs: QCLI-<N>` trailer. Two `lore`-auto-commits also landed on `dev` before a branch could be made — `lore link` and `lore sync` commit `backlog/` themselves, so branch *before* running them in a wave.
