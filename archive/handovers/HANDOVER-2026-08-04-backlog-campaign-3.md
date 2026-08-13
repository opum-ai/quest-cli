# Handover — QCLI-2 clean-room research campaign (waves: 2, tasks resolved: 4 of 14)

**Date**: 2026-08-04 | **Grounded against**: `dev @ f7c93c8`, clean, in sync with `origin/dev` | **Campaign doc**: `doc-1` at `backlog/docs/campaigns/doc-1 - Backlog-campaign-tracker.md`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli.

Wave 2 is done: QCLI-2.2 (09c202d), QCLI-2.7 (2246c46), QCLI-2.9 (79bb99d) all
merged and settled Done. Four of ten subtasks complete. No task is blocked, no
escalation is outstanding, and nothing is in flight.

The owner APPROVED all four wave-2 integration-review proposals and they are
FILED as QCLI-2.11 through QCLI-2.14. Do not re-ask. They correct defects in
already-merged text that QCLI-2.8's synthesis would otherwise inherit, so
prefer them ahead of new research tasks.

ONE DECISION IS LEFT FOR THE OWNER: QCLI-2.8's dependency list was deliberately
NOT edited. QCLI-2.8 synthesizes from QCLI-2.2-2.7 and will inherit the defects
QCLI-2.11/2.12/2.14 correct — notably QCLI-2.14's dangling cession, which
QCLI-2.8 would follow to an answer that does not exist. Adding those edges
changes QCLI-2.8's scheduling, and `--dep` at edit REPLACES the list rather
than appending. Raise it; do not do it silently.

Also read "Campaign conventions learned in wave 2" — six rules that each cost
real time in wave 2 and will recur.

The ready set is recomputed live — do NOT trust any persisted wave plan.

Every worker prompt must carry the clean-room constraints AND the per-slice
admission rule: docs/reference/quest-cli-research-source-register.md is the
admission authority. A source may inform a QCLI requirement only if that
register classifies it Allowed. Read it, the component charter, and the
migration ledger before dispatching anyone. Owner rulings 1-9 are in the
campaign doc; do not re-litigate or re-ask them.
```

## State

| Item | Status |
| ---- | ------ |
| Campaign doc | `doc-1`, updated with the wave-2 log, the 4 filed follow-ups, 6 conventions |
| Queue | **14 subtasks**; **4 Done** (2.1, 2.2, 2.7, 2.9), 10 To Do, plus the QCLI-2 parent epic. QCLI-2.11-2.14 were created at owner approval after wave 2 |
| Waves run | 2 |
| In flight | None — all worktrees returned to pool, all branches deleted (local **and** remote, verified) |
| Local `dev` vs `origin/dev` | in sync at `f7c93c8` |
| Open PRs | None (#1–#4 all merged) |
| Escalations | None. Every `request_changes` closed inside its fix-cycle budget |
| Gates on merged `dev` | `lore check --strict` 19 files 0/0 · `lore validate --strict` 19 files 0/0, 6 skipped · `lore orphans` 0/0 |

## What landed in wave 2

- `docs/reference/legacy-opum-requirement-reconciliation-for-quest-cli.md` — 12-row source matrix, 16 classified candidates.
- `docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md` — Lore dependency/activation matrix **plus** the folded-in lore-cli adapter alignment (owner directive).
- `docs/reference/quest-cli-packaging-contract.md` — `@opum-ai/quest` recorded against dated registry evidence, with a mandatory release-time recheck clause.
- Substantial amendments to `docs/reference/quest-cli-research-source-register.md` (owner ruling 8's split rule, two new slices, a widened-then-bounded permitted use, a retired closed list).

**The adapter answer, for the owner's original question:** there is **no adapter seam** in lore-cli today. `BacklogAdapter` is its only task-tracker adapter type — 27 files reference it by name; `TaskAdapter`/`TrackerAdapter`/`pluggable`/`tracker backend` return zero hits across `src/`, `docs/specs/`, `docs/adr/`; `src/adapters/` holds only `backlog.ts` and `git.ts`. Independently reproduced by the reviewer. Several adapter requirements are therefore classified as needing a **lore-doc boundary decision**, not as Quest's to satisfy alone.

## Next steps

1. `git fetch` and re-verify `dev`/`origin/dev` before acting (R2).
2. The four follow-ups are already filed (QCLI-2.11-2.14) — do not re-ask. Clusters are deliberate: 2.11+2.12 both edit the source register (`cluster:provenance`, 2.12 depends on 2.11); 2.13+2.14 both edit the research program Spec (`cluster:convention`, 2.14 depends on 2.13). Expect **QCLI-2.11 + QCLI-2.13** in one wave, then **QCLI-2.12 + QCLI-2.14**.
3. Recompute the ready set. QCLI-2.2's settlement unblocked **QCLI-2.3** (`cluster:scenarios`, deps 2.1+2.2 — both Done) and **QCLI-2.4** (`cluster:domain`, deps 2.2 — Done). QCLI-2.5 needs 2.4; QCLI-2.6 needs 2.2+2.3+2.4; QCLI-2.10 needs 2.5; QCLI-2.8 needs everything.
4. Note that **QCLI-2.5 carries owner ruling 2** — coverage must be *exhaustive, not representative*: enumerate the whole backlog CLI surface at pinned v1.49.3 and exercise every command end to end. It is the largest remaining task by far.

## Critical context / traps

- **The register is the admission authority and it has been wrong three times.** Wave 1: it asserted an admission rule it could not satisfy for 5 of its own slices. Wave 2: it asserted content identity it had only verified as commit *reachability*, and asserted its release-gate documents were Backlog-clean when one states a dated Backlog release fact. Treat every register claim as checkable, and check it.
- **The split rule (owner ruling 8): cite Lore for what Lore *requires*; never cite Lore for what Backlog *does*.** lore-cli source and ADRs are admissible for Lore's own requirements on a tracker backend. Any assertion about Backlog.md behavior — even stated in a lore document — is not, and must be re-derived from Backlog's public surface at v1.49.3 (QCLI-2.5's job).
- **Backlog.md source stays Excluded and the local clone at `/Volumes/external/repos/Backlog.md` is QUARANTINED.** The constraint is authorship independence, not licensing.
- **`lore sync` auto-commits; `lore sync --dry-run` does not.** Reviewers must use the dry-run form or they mutate the branch they are judging. Every wave-2 reviewer was told this explicitly and none tripped it.
- **`lore link` takes a concept id, not a path** — a path fails with "not in the bundle" while still exiting `0`. `lore orphans` is the check that catches it.
- **This repo is shared with `@codex`**, which has done real work here (QCLI-1, QCLI-3, the ledger, the charter). Re-check ground truth every restore — wave 2 began by finding QCLI-5 had landed outside the campaign and discharged a gate the previous handover said was still open.
- **CLAUDE.md now carries a fleet-routing section** (commit `271c646`) pointing at `salient-data/opum-doc`'s `docs/reference/fleet-peer-routing-and-session-invocation.md` for cross-repo ownership, package-status, and infrastructure questions, plus the DNS/infrastructure ADR as authority.
- **Do not "fix" `salient-data/*` references under `docs/`.** Most are deliberate supersession records (the ADR's original decision text, the migration ledger, the register's redirect-hazard notes). Only correct references asserting a *current* fact. One genuine stale reference remains: `docs/runbooks/quest-cli-research-handover.md:25` lists the remote as `salient-data/quest-cli` under **Prerequisites** — deferred from wave 2 at owner direction, still open.

## Do not repeat

- **Do not dispatch a reviewer while its worker may still be running, and do not message a worker you have already handed to review.** I did the latter and moved QCLI-2.7's branch under its reviewer mid-pass. Wave 1 recorded this trap; wave 2 reproduced it anyway.
- **Do not read an agent's silence as "no work in progress."** I dispatched a duplicate fixer because the first appeared unresponsive — it was merely slow. Two agents were briefly assigned the same edits in the same worktree. No damage, but verifying the *artifact* told me the work wasn't done yet; it could not tell me nobody was doing it.
- **Do not trust `gh pr merge --delete-branch`.** It aborts the *remote* deletion when the *local* deletion fails, and the local deletion fails whenever a worktree still holds the branch. This orphaned a remote branch in **both** waves. Return the worktree first, then merge, then verify remote deletion explicitly.
- **Do not `git stash` on `dev` mid-merge-queue.** The pop conflicts against the just-merged task file. Label bookkeeping is trivially reconstructable with `backlog task edit` — discard and re-apply.
- **Do not leave the dispatch marking uncommitted.** Wave 2's sat in `dev`'s working tree, so worktrees pinned at the wave base showed `To Do` and two workers reported the discrepancy. R4d's ordering exists to make a crashed session reconcilable; an uncommitted marking defeats it.
- **Do not commit the `lore sync` log tail repeatedly.** `docs/log.md` cannot contain the commit that writes it, so each log-sync commit mints a fresh tail. QCLI-2.7's branch accumulated five log-only commits (31% of its commits, zero content) and the cost landed on reviewers as repeated "the branch moved under you" re-baselines.
- **Do not write a plan step that names its expected conclusion.** QCLI-2.2's plan said "confirm the artifacts *are absent*… treat as an unlocatable finding" — and the search stopped at the working tree, missing evidence that was in git history all along.
- **Do not verify settlement against task notes' figures.** Wave 2's notes produced 415, 441, 460, and an "18-row" table that has 15 rows, against true values of 419 and 443. The artifacts were precise throughout; the prose about them drifted. Check ACs against reviewer evidence.

## Relay reliability — read this before running a fan-out

Message delivery was unreliable in **both** directions all wave. Every reviewer finished without its verdict relaying (one needed three sends); one worker missed two supplements. Every instance was caught by inspecting the artifact — the branch, the file, the line — never by trusting a report or a silence. An unreturned verdict and an approval are indistinguishable from the orchestrator's side, and only one is safe to merge on. **Ask; never infer approval from an idle notification.**
