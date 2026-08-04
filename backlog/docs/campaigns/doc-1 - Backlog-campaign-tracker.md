---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-04 06:01'
updated_date: '2026-08-04 14:36'
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
| cluster:scenarios | Black-box acceptance scenarios | QCLI-2.3 |
| cluster:domain | Actors/workflows/domain language | QCLI-2.4 |
| cluster:migration | Backlog migration fidelity + adoption playbook | QCLI-2.5, QCLI-2.10 |
| cluster:threat-model | Git/filesystem/concurrency threat model | QCLI-2.6 |
| cluster:synthesis | Final activation-ready synthesis | QCLI-2.8 |

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

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

None — wave 2 fully settled. All three treehouse worktrees returned to the
pool; all branches deleted local and remote (verified explicitly — see the
conventions section, `--delete-branch` cannot be trusted).

## Needs a human / blocked

No task is labelled `needs-human`. No escalation occurred in wave 2 — every
`request_changes` closed inside its fix-cycle budget.

## Proposed follow-ups — APPROVED AND FILED 2026-08-04

The owner approved all four wave-2 integration-review proposals on 2026-08-04
and they are now filed. Nothing remains awaiting approval.

| Was | Task | Cluster | Deps |
| --- | --- | --- | --- |
| A | QCLI-2.11 Correct wave-2 cross-task staleness in the three merged deliverables | `cluster:provenance` | none |
| B | QCLI-2.12 Close the register's admission-authority coherence gaps | `cluster:provenance` | QCLI-2.11 |
| C | QCLI-2.13 Adopt a moving-vs-immutable reference convention in the Spec | `cluster:convention` | none |
| D | QCLI-2.14 Re-home the runtime/native-packaging/supported-platform question | `cluster:convention` | QCLI-2.13 |

Clusters are deliberate: A and B both edit the source register, and C and D
both edit the research program Spec, so each pair is serialized by the
conflict graph while the two pairs run in parallel. Expect QCLI-2.11 +
QCLI-2.13 in one wave, then QCLI-2.12 + QCLI-2.14.

**Not done, deliberately: QCLI-2.8's dependency list was left untouched.**
QCLI-2.8 synthesizes from QCLI-2.2-2.7 and will inherit the defects QCLI-2.11,
QCLI-2.12, and QCLI-2.14 correct — in particular QCLI-2.14's dangling cession,
which QCLI-2.8 would otherwise follow to an answer that does not exist. Adding
those edges would change QCLI-2.8's scheduling, and `--dep` at edit *replaces*
the list rather than appending, so this is left as an explicit decision for the
next session to raise with the owner rather than made silently here.

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
