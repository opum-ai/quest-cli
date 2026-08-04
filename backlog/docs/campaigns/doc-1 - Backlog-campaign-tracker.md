---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-04 06:01'
updated_date: '2026-08-04 16:06'
---
# Backlog campaign tracker


Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Campaign scope

QCLI-2 "Prepare Quest's clean-room research foundation before implementation"
and its 10 spike subtasks (QCLI-2.1–QCLI-2.10). QCLI-2 itself is the parent
epic — it is not dispatched as a worker task; it is satisfied once its
children are Done and settled separately by the user/orchestrator, not
checked off mechanically.

Every task in this campaign is research/documentation output under the
project's clean-room gate: no product source, runtime dependency, executable
scaffolding, package publication, or release. The governing documents are
`docs/reference/quest-cli-component-charter.md`,
`docs/reference/former-ocli-to-qcli-migration-ledger.md`, and — as of wave 1 —
`docs/reference/quest-cli-research-source-register.md`, which is now the
**per-slice admission authority**: a source may inform a QCLI requirement only
if the register classifies it Allowed. Any Quest-wide
vocabulary/architecture/roadmap finding is a proposal to `quest-doc`, never
normative here.

## Owner rulings — 2026-08-04, restore #1

Recorded verbatim because they change task scope. Do not re-litigate; do not
re-ask.

1. **Backlog.md source stays EXCLUDED — strict clean-room.** The owner was
   offered a contextual/allowed reclassification (backlog.md is MIT, so source
   reading would be legally permissible) and declined. The constraint is
   authorship independence, not licensing. Permitted evidence is published
   documentation, `backlog --help` and each command's own help,
   `--plain`/`--json` output, and on-disk artifacts produced by running the
   tool. Undocumented behavior is a finding to record, never a reason to open
   the source.
2. **Coverage must be exhaustive, not representative.** The backlog CLI's help
   and commands must be "fully enumerated and tested for complete coverage of
   all functionality end to end." QCLI-2.5 gained ACs #4/#5/#6 for this.
3. **Pinned Backlog revision: v1.49.3.** The owner named v1.49.1; v1.49.3 is
   the current npm release and the locally installed build, and the owner chose
   to pin current. A newer release is a reclassification trigger.
4. **QCLI-2.10 approved and created** — the Backlog→Quest adoption/migration
   playbook, dependent on QCLI-2.5, `cluster:migration`.
5. **lore-cli's Backlog.md corpus is CONTEXTUAL — readable, not citable.**
   `opum-ai/lore-cli` carries ADR-0002 (JSON-only integration), ADR-0012
   (coexistence and git ownership), `reference/backlog-cli-contract.md`,
   `reference/backlog-json-schema.md`, and `runbooks/backlog-json-patch.md` —
   effectively the prior art QCLI-2.5/2.10 are chartered to produce. But
   ADR-0012 states in its own Context section that its findings were "verified
   against the Backlog.md source," so citing it would launder source-derived
   knowledge into Quest around ruling 1. Workers may read it **for question
   discovery only** — which behaviors bite, which edge cases exist, which
   hazards to look for — and may cite **nothing** from it. Every Quest
   assertion about Backlog.md must be independently re-derived from the public
   surface at v1.49.3 and cited to that observation. lore-cli's **non-Backlog**
   documents are unaffected: `reference/lore-cli-release-truth.md` and
   `runbooks/release-publishing.md` are QCLI-2.7 release-gate evidence.
6. **The local Backlog.md clone is QUARANTINED.** A full source clone sits at
   `/Volumes/external/repos/Backlog.md`. Its presence is permitted (it is
   outside quest-cli, so AC3 is unaffected) but no Quest research may open,
   read, grep, or cite it. It earns an explicit register entry because the
   hazard is proximity — a worker can reach it with a single relative path. Its
   reclassification trigger is tied to the owner's ruling, not to the clone's
   existence; deleting the clone does not lift the rule.

## Owner rulings — 2026-08-04, restore #2

7. **Lore adapter alignment folds into QCLI-2.7**, rather than becoming a new
   task. The component charter (`quest-cli-component-charter.md:30`) states
   quest-cli owns "versioned Lore import/link/adapter behavior", but no
   campaign task produced the adapter-contract evidence QCLI-2.8's AC2 would
   synthesize from — QCLI-2.7 was framed one-directionally (does Lore's
   release gate hold?) and never asked what Lore requires *of a task CLI*.
   QCLI-2.7 gained ACs #4/#5/#6/#7 to close that gap. It stays research:
   describe the contract and name the divergences, never implement an adapter.
8. **The SPLIT RULE for lore-cli source admissibility.** The register
   previously excluded all design derivation from lore-cli TypeScript. That
   single exclusion is now split in two:
   - **Admissible** — lore-cli source and lore-cli's own ADRs as evidence of
     what **Lore requires of any task-tracker backend**: the adapter interface
     shape, the structured-output envelope and schema-version expectation,
     capability-probe and fail-loud semantics, the write path, new-identifier
     capture, and the back-reference/metadata-storage constraint. This is
     Opum-owned MIT code describing Lore's own design, and quest-cli is
     chartered to honor it.
   - **Not admissible** — any assertion about **how Backlog.md behaves**, even
     when lore-cli source or a lore-cli ADR states it. Rulings 1 and 5 are
     unchanged. Every Quest assertion about Backlog.md must still be
     independently re-derived from the public surface at v1.49.3.
   - The line, stated for reuse: **cite Lore for what Lore needs; never cite
     Lore for what Backlog does.** QCLI-2.7 records this rule in the register.
9. **QCLI-2.9's name decision is closed — the task shifts from deciding to
   evidencing.** Restore #1 flagged that QCLI-2.9's ACs might no longer fit
   because the owner had already chosen `@opum-ai/quest`. On re-reading, all
   five ACs remain satisfiable as written (AC3's "scoped fallback" reads as the
   already-accepted `@opum-ai/quest`), so the task is dispatchable with a
   framing note rather than an AC rewrite. If gathered evidence contradicts the
   decision, the worker records the contradiction and reports it — it does not
   act on or reverse it.

## Reconciliation — restore #2, 2026-08-04

Drift found between the restore-#1 handover's claims and live ground truth, all
resolved before wave 2 was built:

| Handover claim | Verified state at restore #2 |
| --- | --- |
| Grounded at `dev @ d99cf9c` | `dev @ de4693d`, clean, in sync with `origin/dev` — five commits landed after the handover was written |
| "Transfer **not yet executed** — `git remote -v` still says `salient-data/quest-cli`" | **Executed.** `origin` is `git@github.com:opum-ai/quest-cli.git` |
| Pending decision 1: charter `:23` and ADR decision #1 contradict the register; "fix before QCLI-2.9 runs" | **Resolved by QCLI-5** (Done, commit `942da73`), which executed this doc's restore-#1 proposed follow-up 1 and amended a fourth and fifth site the proposal had missed (the migration ledger's repository-history note, and the register's own classification-vocabulary example) |
| Wave 1 "branch deleted" | Local branch was deleted; the **remote** copy `origin/feat/qcli-2.1-revalidate-provenance` survived `gh pr merge --delete-branch`. Pruned at restore #2. Treat remote-branch deletion as unverified until checked |

Restore-#1 proposed follow-up 1 is therefore **discharged**. Proposed follow-ups
2 and 3 are folded into QCLI-2.7's expanded scope (the register work its AC7
requires) rather than being filed as separate tasks.

## Dated evidence — 2026-08-04

Verified by the orchestrator and re-derived independently by the QCLI-2.1
worker. Each is dated because each can drift.

| Fact | Value as of 2026-08-04 | Owning task |
| --- | --- | --- |
| `backlog.md` latest npm release | 1.49.3, MIT, `github.com/MrLesk/Backlog.md` | QCLI-2.5, QCLI-2.10 |
| `backlog` binary installed locally | 1.49.3 | QCLI-2.5 |
| Lore repository | **`opum-ai/lore-cli`** (private), GitHub release `v0.1.0` at 2026-08-04T02:44:47Z. `salient-data/lore-cli` resolves to the same repo id via GitHub's post-transfer redirect — a stale identity, not a second repo | QCLI-2.7 |
| Lore npm package | **`@opum-ai/lore`** v0.1.0, MIT, bin `lore`. Note the naming pattern: repo `<name>-cli`, package `@opum-ai/<name>`, executable `<name>` | QCLI-2.7, QCLI-2.9 |
| npm `lore` / `lore-cli` | Held by an **unrelated** third party (`github.com/lore/lore`, a React/Redux framework) — not Salient Data's, not Opum's | QCLI-2.9 |
| npm `quest` | **Occupied** at v0.4.0 (`Clever/quest`, "simple request library for node"). Now only the *rationale* for going scoped, not an open allocation question | QCLI-2.9 |
| npm `quest-cli` | Occupied at v1.0.0, ISC, no repository or description | QCLI-2.9 |
| npm `@opum-ai/quest` | **404 — unclaimed.** This is the owner's chosen name | QCLI-2.9 |
| quest-cli repository | **`opum-ai/quest-cli`** — transfer executed and verified live at restore #2 | QCLI-5 (Done) |

### lore-cli release/development drift — measured at restore #2

Orchestrator-verified, and the starting evidence for QCLI-2.7's AC6:

| Measurement | Value | Command |
| --- | --- | --- |
| Published npm `@opum-ai/lore` | `0.1.0` | `npm view @opum-ai/lore version` |
| Locally installed `lore` | `0.1.0` | `lore --version` |
| Tag `v0.1.0` commit | `e621d209be2cc8867d1c38c7c78b4b4acc96d82e` | `git rev-list -n1 v0.1.0` |
| lore-cli `dev` HEAD | `405606891a227a9012b87de625d909eba56fec6b`, **29 commits ahead** of `v0.1.0`; the tag is **not** an ancestor of `dev` | `git rev-list --left-right --count v0.1.0...HEAD` |
| Documented CLI/adapter surface drift since `v0.1.0` | **None.** `docs/reference/cli-surface.md`, `cli-contract.md`, `okf-projection-contract.md`, and `.lore/schemas/` are byte-unchanged | `git diff --stat v0.1.0..HEAD -- …` |
| What the 29 unreleased commits do change | `architecture.md`, `lore-cli-release-truth.md`, `tech-stack.md`, `release-publishing.md`, ladybugdb benchmark strategy, and the release story — graph-platform work, not CLI surface | `git diff --stat v0.1.0..HEAD -- docs` |

Reading: the register's pin on the **published** artifact is still accurate,
and the adapter contract quest-cli must honor has not moved. QCLI-2.7 must
re-verify this rather than inherit it — the measurement is dated and the
development line is active.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of the start of
restore #2, QCLI-2.1 is Done and 9 remain; QCLI-2.2, QCLI-2.7, and QCLI-2.9 are
dependency-clear with disjoint clusters, and everything else is blocked behind
QCLI-2.2 or QCLI-2.4.

## Confirmed queue order

Confirmed by the user on 2026-08-04. The wave-builder's tie-break, NOT a
guarantee that any task lands in any particular wave.

1. ~~QCLI-2.1~~ — **Done**, wave 1
2. QCLI-2.2 — Reconcile legacy Opum requirements into Quest CLI candidates
3. QCLI-2.7 — Track Lore dependencies and Quest activation evidence
4. QCLI-2.9 — Resolve the `quest` npm package allocation and provenance gate
5. QCLI-2.3 — Turn prototype failures into Quest black-box scenarios
6. QCLI-2.4 — Define Quest CLI actors, workflows, and domain-language candidates
7. QCLI-2.5 — Research Backlog migration fidelity through public contracts
8. QCLI-2.6 — Model Quest Git, filesystem, and concurrency threats
9. QCLI-2.10 — Author the Backlog-to-Quest adoption and migration playbook
10. QCLI-2.8 — Synthesize Quest CLI research into activation-ready contracts

## Clusters

| Cluster label | Covers | Tasks |
| --- | --- | --- |
| cluster:provenance | Source/provenance register revalidation | QCLI-2.1 (Done) |
| cluster:requirements | Legacy Opum requirement reconciliation | QCLI-2.2 |
| cluster:lore-gate | Lore dependency/evidence matrix + adapter alignment | QCLI-2.7 |
| cluster:packaging | npm package allocation/provenance | QCLI-2.9 |
| cluster:scenarios | Black-box acceptance scenarios | QCLI-2.3 (Done) |
| cluster:domain | Actors/workflows/domain language | QCLI-2.4 (Done) |
| cluster:migration | Backlog migration fidelity + adoption playbook | QCLI-2.5, QCLI-2.10 |
| cluster:threat-model | Git/filesystem/concurrency threat model | QCLI-2.6 |
| cluster:synthesis | Final activation-ready synthesis | QCLI-2.8 |
| cluster:provenance (wave-2 follow-up) | Cross-task staleness correction + register coherence | QCLI-2.11 (Done), QCLI-2.12 |
| cluster:convention | Moving-vs-immutable reference convention + scope re-homing | QCLI-2.13 (Done), QCLI-2.14 |

### Shared-file rule for concurrent doc waves

Cluster disjointness is not sufficient in this repository, because every task
authors into the same `docs/` bundle and every `lore sync` regenerates the same
managed artifacts. Two rules make a multi-member wave safe:

1. **Authored-file ownership is assigned per wave.** Exactly one member may edit
   any given pre-existing document. For wave 2, QCLI-2.7 owns
   `docs/reference/quest-cli-research-source-register.md`; QCLI-2.2 and
   QCLI-2.9 cite it read-only and each author a new document of their own.
2. **Generated-file conflicts are mechanical, never hand-merged.**
   `docs/log.md`, `docs/index.md`, `docs/reference/index.md`, and the owning
   Story's `<!-- lore:tasks:begin -->` managed block are regenerated by
   `lore sync`, which is idempotent and derives from live Backlog state. A
   rebase conflict in any of them is resolved by re-running `lore sync` on the
   rebased worktree and re-running the gates — never by editing the conflicted
   region. Hand-editing inside a managed block is silently overwritten by the
   next sync.


## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of the end of
restore #2, QCLI-2.1, QCLI-2.2, QCLI-2.7, and QCLI-2.9 are Done; six remain
(QCLI-2.3, 2.4, 2.5, 2.6, 2.8, 2.10) plus the QCLI-2 parent epic. QCLI-2.2's
settlement unblocked QCLI-2.3 and QCLI-2.4.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of the end of
wave 3 (including its follow-up fix batch), QCLI-2.1, 2.2, 2.3, 2.4, 2.7, 2.9,
2.11, and 2.13 are Done (8 of 14 subtasks); six remain (QCLI-2.5, 2.6, 2.8,
2.10, 2.12, 2.14) plus the QCLI-2 parent epic. Dependency-clear as of this
writing: **QCLI-2.5** (deps 2.1+2.4, both Done, `cluster:migration`),
**QCLI-2.6** (deps 2.2+2.3+2.4, all Done, `cluster:threat-model`), **QCLI-2.12**
(deps 2.11, Done, `cluster:provenance`), **QCLI-2.14** (deps 2.13, Done,
`cluster:convention`) — four disjoint clusters, a full wave under the size cap.
Still blocked: QCLI-2.10 (needs 2.5), QCLI-2.8 (needs 2.5+2.6, plus everything
else already Done).

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

None — wave 3 (and its follow-up fix batch) fully settled. All seven
treehouse worktrees used this session returned to the pool; all branches
deleted local and remote (verified explicitly for every one of PRs #5-#11 —
`gh pr merge --delete-branch` failed its local half on all seven, exactly the
known trap; each was completed manually: return worktree, `git branch -d`,
`git push origin --delete`, then `git ls-remote` to confirm).

## Needs a human / blocked

No task is labelled `needs-human`. No escalation occurred in wave 3 or its
follow-up batch — every review reached `approve`, one after exactly one
`request_changes` cycle (QCLI-2.3, a single false commit-pin).

## Proposed follow-ups — status as of end of wave 3, 2026-08-04

**A and C — FILED, DISPATCHED, DONE.** QCLI-2.11 and QCLI-2.13 (both from the
wave-2 integration review's four proposals) ran in wave 3, were approved, and
are settled `Done`. See the wave-3 log entry below.

**B and D — still queued, not yet dispatched.** QCLI-2.12 (`cluster:provenance`,
deps: QCLI-2.11 — now Done, so QCLI-2.12 is dependency-clear) and QCLI-2.14
(`cluster:convention`, deps: QCLI-2.13 — now Done, so QCLI-2.14 is also
dependency-clear). Both are ready for the next wave.

**NEW — awaiting owner approval, surfaced by the wave-3 integration review
(finding F2).** Do not dispatch until approved; this project forbids
autonomous follow-up task creation, and expanding an existing queued task's
acceptance criteria is the same kind of scope commitment. Proposed: **extend
QCLI-2.12** (not a new sibling task — same file, same forbidden-to-reclassify
constraint, same reviewer context QCLI-2.12 already carries) with two
additional acceptance criteria:

> **AC#6** — Every in-repo document cited by a merged QCLI-2.x deliverable
> under the register's `Prior QCLI research records` slice is enumerated by
> that slice, specifically the research source register itself (cited by
> QCLI-2.3) and QCLI-2.2's legacy requirement reconciliation (also cited by
> QCLI-2.3) — neither is currently named in the slice's own enumeration.
>
> **AC#7** — The `quest-doc canonical product records` slice's permitted use
> states explicitly whether it governs only the register's own citations or
> any QCLI deliverable's, and confirms it covers the execution graph's
> behavioral-contract vocabulary as QCLI-2.4 actually cites it (a different
> document section / use than the slice's register-first-person wording
> straightforwardly enumerates). No permitted use is narrowed below what a
> merged deliverable already relies on.

Both gaps were newly exercised by wave 3's two new documents (QCLI-2.3,
QCLI-2.4) citing the register in ways wave 1/2 never did — not a defect
introduced by QCLI-2.11 (which correctly reclassified nothing) but a coverage
gap the register's existing enumeration doesn't reach. Full detail in the
wave-3 log entry below.

**Still not done, deliberately, carried forward a second session: QCLI-2.8's
dependency list remains untouched.** QCLI-2.8 synthesizes from QCLI-2.2-2.7 and
will inherit the defects QCLI-2.11-2.14 correct unless its dependency list is
widened — this was flagged as an explicit owner decision at the end of wave 2
and has still not been raised with the owner (this session ran wave 3 and its
follow-ups without revisiting it). `--dep` at edit *replaces* the list rather
than appending, so widening it requires citing the full current list plus the
new edges, not just the new edges. Raise at the next opportunity; do not do it
silently.

## Campaign conventions learned in wave 2

Recorded because each cost real time and will recur.

1. **Per-wave authored-file ownership.** Cluster disjointness is insufficient
   here — every task authors into one `docs/` bundle. Exactly one wave member
   may edit any pre-existing document. Wave 2 assigned the source register to
   QCLI-2.7; both siblings cited it read-only and neither collided. It worked:
   QCLI-2.9 needed a register change, routed it to QCLI-2.7, and did not touch
   the file — the boundary held under pressure rather than merely on paper.
2. **Generated-file conflicts are never hand-merged.** `docs/log.md`,
   `docs/reference/index.md`, and Story managed blocks are regenerated by
   `lore sync`, which is idempotent and derives from live Backlog state. Every
   wave-2 rebase conflicted only on each branch's own task file
   (`updated_date`); `-X theirs` plus a post-rebase `lore sync` resolved all
   three mechanically.
3. **Stop chasing the `lore sync` log tail.** `docs/log.md` regenerates from
   git history and cannot contain the commit that writes it, so every
   log-sync commit mints a fresh tail. QCLI-2.7's branch accumulated **five**
   log-only commits — 31% of its commits, zero content. The cost is paid by
   reviewers: two of three review passes opened with "the branch moved under
   you," and in both cases the delta was this. Convention: run `lore sync`
   once as the final action before pushing, accept that its own commit will
   not appear in `log.md`, and stop. One trailing `would update docs/log.md`
   is the expected end state and resolves at merge.
4. **`gh pr merge --delete-branch` cannot be trusted.** It aborts the *remote*
   deletion when the *local* deletion fails, and the local deletion fails
   whenever a worktree still holds the branch. This left an orphan remote
   branch in both waves. Return the worktree first, then merge, then verify
   remote deletion explicitly.
5. **Never `git stash` on the default branch mid-merge-queue.** Label
   bookkeeping is trivially reconstructable with `backlog task edit`; a
   stash pop against a just-merged task file conflicts. Discard and re-apply.
6. **Commit the dispatch marking.** Wave 2's marking sat uncommitted on `dev`,
   so worktrees pinned at the wave base showed `To Do` and two workers
   reported the discrepancy. R4d's ordering exists to make a crashed session
   reconcilable — an uncommitted marking defeats it.

## Campaign conventions learned in wave 3

Recorded because each cost real time and will recur.

1. **Never infer a verdict from an idle notification, in either direction,
   for any agent role.** Every single reviewer AND worker this wave (not just
   reviewers, as wave 2 first found) went idle without its payload arriving in
   the same message — the actual report always arrived in a separate,
   subsequent message only after an explicit "resend your verdict" ask. This
   happened for all four wave-3 reviewers, the integration reviewer, and two
   of the three follow-up reviewers. Treat "idle" as "the agent stopped
   running," nothing more; always explicitly re-request output that hasn't
   arrived rather than proceeding on silence or assuming approval.
2. **Cross-pool worktree orphans exist and are invisible to scoped
   `treehouse status`/`prune`.** R2 found a leftover worktree in a *different*
   treehouse pool (`quest-cli-033df3`) than the one this session's config
   resolved to (`quest-cli-f11e72`) — already-merged, clean, unleased, but
   `treehouse prune` (scoped to the repo) never listed it; only
   `treehouse prune --all` (global, cross-pool) or `treehouse destroy <exact
   path>` found/reclaimed it. Check `git worktree list` against
   `treehouse status --json` explicitly at every restore; a worktree entry
   with no corresponding pool member is the signal, not an error message.
3. **A squash-merged branch's own `lore sync` commit always goes dangling in
   `docs/log.md` after squash — every time, not occasionally.** All seven
   wave-3 PRs (#5-#11) exhibited this: the branch's pre-squash SHA appears in
   `log.md` but does not exist on `dev` post-squash-merge. The fix
   (`lore sync` on `dev` directly, once per merge batch) is mechanical and
   was applied after the main wave (4 merges) and again after the follow-up
   batch (3 merges) — do it after *every* batch of squash-merges, not once
   per wave.
4. **Correct the wave-2-era assumption that `lore sync` auto-commits
   `docs/`.** It does not, in this environment/version: auto-commit is scoped
   to `commit backlog/`, and only fires when `lore link`/`unlink` left it
   dirty. `docs/log.md`, `docs/reference/index.md`, and Story managed blocks
   are regenerated into the working tree and must be committed explicitly by
   whoever ran the sync. Confirmed independently by three different workers/
   reviewers via `--help`, `--dry-run --json`, and a full-history search for
   any lore-authored commit (found none). Every future dispatch prompt in this
   campaign should state this plainly rather than the old assumption.
5. **The wave-level integration review earns its cost even when every
   single-task review was clean.** Wave 3's four tasks each got an
   independent `approve` with zero unresolved findings, yet the integration
   pass still found six real cross-task issues (one provably false citation
   in an already-approved doc, one AC satisfied only in one of two required
   directions, one dangling log SHA, one fired-but-unclosed forward-condition
   in a *different* wave's document, one ownership pointer between two
   siblings merged 90 seconds apart, one register-coverage gap newly exercised
   by this wave's citations) — replicating wave 2's finding that this class of
   defect is structurally invisible to single-task review.
6. **Narrow-fix-and-re-review is cheap when scoped to one clause/file.** All
   three wave-3 follow-up fixes (each single-file or two-file, single-clause
   to medium edits, with the reviewer's finding pasted verbatim into the
   worker's brief) reached `approve` on the first pass — no `request_changes`
   cycles, unlike the original wave's one retry. Tight scoping plus a
   verbatim finding, not a re-derived summary, appears to be why.

## Wave log

### Wave 1 — 2026-08-04 — QCLI-2.1 — merged, settled

Base `dev @ 0cf0f34`, rebased onto `3107d3a`, merged as squash commit
**`1f51cce`** via PR #1. Delivered
`docs/reference/quest-cli-research-source-register.md` — 17 source slices with
explicit `Classification` fields. Two review passes; pass 1 `request_changes`
because the register asserted an admission rule it could not satisfy for 5 of
its own 15 slices, which would have locked out QCLI-2.2's and QCLI-2.3's
primary evidence. Pass 2 `approve` after auditing that the fix silently
reclassified nothing — zero reclassifications against a byte-identical
vocabulary table.

Wave-level integration review not run, by construction: a single-member wave
has no cross-task surface.

### Interlude — QCLI-5 — 2026-08-04 — outside the campaign

Not a campaign task and not dispatched by this skill, but it discharged
restore-#1's proposed follow-up 1 and lifted the gate on QCLI-2.9. Commit
`942da73`. Two reusable findings: `lore link` takes a **concept id, not a
path** — a path fails with "not in the bundle" while still exiting `0`, so the
exit code alone does not prove a link landed; `lore orphans` is the check that
catches it.

### Wave 2 — 2026-08-04 — QCLI-2.2, QCLI-2.7, QCLI-2.9 — all merged and settled

Base `dev @ 4dd721a`. Three members, disjoint clusters, disjoint authored
files. Merged serially in confirmed queue order, each rebased onto the moving
`dev` with mandatory re-verification:

| Task | PR | Squash commit | Review |
| --- | --- | --- | --- |
| QCLI-2.2 | #2 | `09c202d` | approve, pass 2 |
| QCLI-2.7 | #3 | `2246c46` | approve, pass 3 |
| QCLI-2.9 | #4 | `79bb99d` | approve, pass 2 |

Final state: `lore check --strict` 19 files 0 errors 0 warnings;
`lore validate --strict` 19 files 0 errors 0 warnings 6 skipped;
`lore orphans` 0 orphans 0 dangling links. No test, build, or lint gate exists
in this repository and none was claimed at any point.

**Owner directive that shaped the wave.** The lore adapter alignment was folded
into QCLI-2.7 as ACs #4-#7 rather than becoming a new task, and the split rule
(ruling 8) was recorded on the task itself before dispatch so a crash could not
lose it.

**The headline finding — there is no adapter seam.** `BacklogAdapter` is
lore-cli's only task-tracker adapter type: 27 files reference it by name,
searches for `TaskAdapter`/`TrackerAdapter`/`pluggable`/`tracker backend`
across `src/`, `docs/specs/`, and `docs/adr/` return zero, and `src/adapters/`
holds only `backlog.ts` and `git.ts`. Independently reproduced by the reviewer.
Consequence: several adapter requirements are classified as needing a
**lore-doc boundary decision**, not as Quest's to satisfy unilaterally.

**Sharpest divergence.** Lore's *inbound* envelope requirement (numeric
`schemaVersion`, hyphenated per-response `kind`, per-command payload key, **no**
shared `data` key) differs deliberately from lore's *own outbound* contract as
documented in `cli-contract.md` — which itself claims the two "share a shape on
purpose". Building Quest by mirroring lore's documented `--json` output would
produce the wrong shape. The deliverable prefers source over doc, correctly.

**Every review caught something real.** Six review passes across three tasks,
five `request_changes` findings, all confirmed by orchestrator re-derivation
before any fix was dispatched:

- **QCLI-2.9** claimed the npm package `quest` had 29 releases; the registry
  has **26**. A wrong figure inside a dated evidence table whose whole purpose
  is downstream re-verification.
- **QCLI-2.2** asserted five named legacy artifacts were unlocatable and
  unadmitted. They sit at opum-doc `d42c016` in a table titled "Authoritative
  owned requirement sources", inside a slice the register classifies
  **Allowed**. The search had been scoped to the working tree; the evidence
  lives in history. The disposition was right, the stated ground was false —
  and it would have shipped a false premise into the owner's OCLI-7 queue. The
  worker's plan step 2 had pre-committed to the conclusion ("confirm the
  artifacts *are absent*… treat as unlocatable"), which is likely why the
  search stopped where it did.
- **QCLI-2.2** mis-pinned a revision: the cited file is absent at both cited
  commits. Root cause in the **register**, which had verified commit
  *reachability* and silently substituted it for *content identity*. Routed to
  QCLI-2.7 as the register's owner rather than fixed in place.
- **QCLI-2.7's register** asserted its release-gate evidence documents were
  uniformly non-Backlog-derived; `release-publishing.md` §Prerequisites states
  a dated Backlog.md release-history fact, and the slice's own permitted use
  admitted that class — a live laundering path, on a false premise, in a slice
  authored that wave.
- **QCLI-2.7's deliverable** carried a blanket "no Backlog-behavior claim here
  is sourced from Lore" disclaimer falsified by three source-comment quotes it
  reproduces.

**A defect the orchestrator introduced and the reviewer caught.** QCLI-2.7's
widened npm permitted use ended "**all** `npm view`-surfaced registry
metadata" — which literally admits `npm view <pkg> readme`, the full authored
README, i.e. package *content*. It would have undercut the source/test bar
hardened in the same edit. Now bounded: "exhaustive, not illustrative", naming
`readme` and `dependencies` as excluded.

**A self-graded sweep that was right for the wrong reason.** Asked to check
whether any other register slice shared the reachability defect, QCLI-2.7's
worker concluded none did — but justified the recovery-commits slice as safe
because "reachability establishes the text at that commit", when that slice
actually asserts specific **row counts** (14 and 24), which reachability cannot
establish. The reviewer content-verified the counts itself (both true at both
commits) and recorded that the conclusion held by luck of the facts, not by
valid reasoning. This is why a worker's audit of its own work is routed through
review.

**Correction of record — the orchestrator was wrong about lore-cli topology.**
The campaign doc previously recorded that tag `v0.1.0` "is **not** an ancestor"
of lore-cli's `dev` HEAD. Incomplete and misleading: both of the tag's merge
parents **are** ancestors of `dev`; the tag sits on `main` only because `dev`
never merges `main` back, and `git rev-list --left-right --count` returns `1`
on the left solely because of the merge node itself.
`src/adapters/backlog.ts` and the three published surface docs are
byte-unchanged since the tag. **Retire the "not an ancestor" reading.**

**Wave-level integration review — seven cross-task findings, none blocking.**
No factual contradiction between the three deliverables and every shared figure
consistent (284/287/292/120 line counts, `@opum-ai/lore` 0.1.0,
`@opum-ai/quest` 404, `quest` 26 releases, backlog.md v1.49.3, repo id
`1319427259`). What it found instead was staleness created *by the merges
themselves* — five instances where one sibling invalidated another's text — plus
a genuine precedence gap in the admission authority and one dangling scope
cession. All four follow-up proposals above derive from it. The pass earned its
cost: every one of these was invisible to the single-task reviews, because each
document was correct when it was written and reviewed.

**The third method-vs-claim mismatch exists** — in QCLI-2.2 line 64, mirroring
in identical wording the defect QCLI-2.7 corrected in the register. QCLI-2.7
could not reach it (already merged, outside its edit scope). A fourth sweep of
the remaining seventeen slices found no further instance: two slices state weak
methods but are correctly *bounded* to what those methods support.

### Wave 3 — 2026-08-04 — QCLI-2.3, QCLI-2.4, QCLI-2.11, QCLI-2.13 — all merged and settled, plus a full follow-up fix batch

Base `dev @ 98f1f27`. Four members — two newly ready (QCLI-2.3, QCLI-2.4, both
unblocked when QCLI-2.2 settled) and two of wave 2's four approved follow-ups
(QCLI-2.11, QCLI-2.13, exactly as predicted) — disjoint clusters, disjoint
authored files (QCLI-2.3/2.4 each authored a new doc; QCLI-2.11 owned the
three sibling reference docs it corrects; QCLI-2.13 owned the research
program Spec). Merged serially in ordinal order, each rebased onto the moving
`dev` with mandatory re-verification; every branch's own Backlog task file
conflicted against the dispatch/in-review label commits (expected, resolved
by taking the branch's content and reapplying labels via the `backlog` CLI,
never by hand-editing):

| Task | PR | Squash commit | Review |
| --- | --- | --- | --- |
| QCLI-2.3 | #5 | `4ed6ee1` | approve, pass 2 (pass 1 `request_changes` on one false commit-pin) |
| QCLI-2.4 | #6 | `0d127ee` | approve, pass 1 |
| QCLI-2.11 | #7 | `3b5cd8c` | approve, pass 1 |
| QCLI-2.13 | #8 | `eaa8a0c` | approve, pass 1 |

Final state after the main wave: `lore check --strict` 21 files 0/0;
`lore validate --strict` 21 files 0/0 6 skipped; `lore orphans` 0/0. Still no
test/build/lint gate in this repository.

**The one review-cycle finding.** QCLI-2.3 cited the OCLI-3.3 task narrative's
last-touch commit as `5da8949` — an unrelated, later commit that never
touches that file. True commit (`3023468`) was already correctly dated in the
same citation; only the hash was wrong. Reviewer's evidence-backed finding,
fixed in one token by a fresh worker, re-confirmed on re-review including the
stronger check the original defect lacked (`git show --stat <sha>` path
presence, not mere reachability — the same standard QCLI-2.11 was
simultaneously establishing for the register).

**QCLI-2.11's premise-mismatch, independently re-derived and confirmed
correct.** The task text said 4 of 8 `d7ca18f` citation sites lacked a read
date; the worker found and fixed 5, flagging the discrepancy via `--comment`
rather than silently matching the stated count. The reviewer recomputed the
count from `dev` independently (catching a date that wrapped onto a
following line, which a naive single-line grep would have miscounted) and
confirmed 5 was right and the task text's 4 was the error.

**QCLI-2.13's AC4 — confirmed correct-as-scoped on the original pass, then
completed by a follow-up.** AC4 required the convention to be
"cross-referenced from the source register's GitHub-redirect reclassification
trigger" — the original implementation built only the Spec→register
direction (correctly declining to edit the register, owned by QCLI-2.11 that
wave). The wave-level integration review adjudicated the literal wording as
requiring the missing register→Spec direction specifically, not merely
"nice-to-have bidirectionality," and recommended a one-clause fix. See below.

**Wave-level integration review — six cross-task findings, all resolved or
queued this session.**

| # | Finding | Disposition |
| - | --- | --- |
| F1 | QCLI-2.3 pointed command-vocabulary/JSON-envelope/exit-code ownership at QCLI-2.4, which explicitly disclaims that scope 90 seconds later | **Fixed** — narrow follow-up, repointed to QCLI-2.8 AC2 + Spec Required Outputs |
| F2 | Register `Prior QCLI research records` slice doesn't enumerate two documents QCLI-2.3 cites under it; `quest-doc canonical product records` slice's permitted use may not cover how QCLI-2.4 actually cites it | **Proposed** as two new ACs on QCLI-2.12 — awaiting owner approval, see Proposed follow-ups above |
| F3 | QCLI-2.13's AC4 satisfied in only one direction (Spec→register) | **Fixed** — narrow follow-up, register-side back-reference added, empirically proven to resolve (broken-link/broken-anchor negative control) |
| F4 | `docs/log.md` cited a pre-squash SHA absent from `dev`'s object graph after QCLI-2.13's squash merge | **Fixed** — mechanical `lore sync` on `dev` |
| F5 | Migration ledger's wave-1 forward-condition ("...until QCLI-2.3 authors the current black-box corpus") fired but was never closed | **Fixed** — narrow follow-up, inline-supersession amendment, dated, citing QCLI-2.3, original text preserved |
| F6 | QCLI-2.3's and QCLI-2.4's new docs cited moving references (`opum-doc`/`quest-doc` HEAD SHAs) without the recheck-clause convention QCLI-2.13 introduced in the same wave | **Fixed** — two narrow follow-ups, one per document, each with an independently-verified-runnable recheck clause |

Two checks came back clean with no finding: QCLI-2.11's citation-standard
(content-verification vs. reachability) was correctly applied by both new
documents, and the register's internal coherence (classification/permitted-use
fields) survived wave 3 with no contradiction — F2 is a coverage gap in the
register's enumeration, not an internal inconsistency.

**Follow-up fix batch — three narrow fixes, each one worker+reviewer cycle,
zero `request_changes`.** Branched off `dev @ f30b0c5` (post-F4 mechanical
fix), merged serially:

| Fix | Task | PR | Squash commit | Review |
| --- | --- | --- | --- | --- |
| F1+F2(F6a)+F5 | QCLI-2.3 | #9 | `883b445` | approve, pass 1 |
| F6b | QCLI-2.4 | #10 | `63b1e0a` | approve, pass 1 |
| F3 | QCLI-2.13 | #11 | `c09ed47` | approve, pass 1 |

One more mechanical `lore sync` on `dev` after this batch (three more
pre-squash SHAs went dangling, exactly as F4 predicted would recur — see
conventions item 3). Final state after settlement: `lore check --strict` 21
files 0/0; `lore validate --strict` 21 files 0/0 6 skipped; `lore orphans`
0/0.

**Relay reliability — same defect as wave 2, now confirmed to affect workers
too, not only reviewers.** Every agent's idle notification this wave arrived
without its payload; the actual report always required an explicit
"resend your verdict/report" message. No verdict was ever inferred from
silence or an idle signal — each was asked for explicitly and the true
verdict recorded only once received in full.
