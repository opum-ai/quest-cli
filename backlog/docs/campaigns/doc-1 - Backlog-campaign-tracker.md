---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-04 06:01'
updated_date: '2026-08-04 23:59'
---
# Backlog campaign tracker


Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

**Status: COMPLETE as of wave 5, 2026-08-04.** All 14 subtasks and the
parent epic are `Done`. One follow-up task is proposed (register
enumeration gaps) pending owner approval — see "Proposed follow-ups" below.
A fresh `init` is needed to start any new campaign in this project.

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

## Owner rulings — 2026-08-04, restore #4

10. **F2 approved — QCLI-2.12 gained AC#6/AC#7** exactly as proposed at the
    end of wave 3 (see "Reconciliation — restore #2" line for the original
    text). Applied via `backlog task edit QCLI-2.12 --ac ...` before dispatch.
11. **QCLI-2.8's dependency list widened**, discharging the item carried
    forward across two prior sessions. `--dep` at edit replaces the list, so
    the full set was cited: was `QCLI-2.2..QCLI-2.7`, now also
    `QCLI-2.11, QCLI-2.12, QCLI-2.13, QCLI-2.14`.
12. **The stale runbook reference approved for a direct fix.**
    `docs/runbooks/quest-cli-research-handover.md:25` named the pre-transfer
    remote (`salient-data/quest-cli`); corrected to `opum-ai/quest-cli`
    directly on `dev` (commit `aed386a`), outside the wave loop — a genuine
    stale reference, not a deliberate supersession record.
13. **F4 (wave-4 integration review) — QCLI-2.12's lore-cli metadata
    widening confirmed as not requiring a fresh ruling.** The owner agreed
    with the reviewer's "benign reading": the widening formalizes an
    admission already exercised under QCLI-2.7's existing owner ruling (the
    split rule) and QCLI-2.9's contemporaneous citations, not a new
    admission. Recorded in the ledger's amendment note.

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
| cluster:requirements | Legacy Opum requirement reconciliation | QCLI-2.2 (Done) |
| cluster:lore-gate | Lore dependency/evidence matrix + adapter alignment | QCLI-2.7 (Done) |
| cluster:packaging | npm package allocation/provenance | QCLI-2.9 (Done) |
| cluster:scenarios | Black-box acceptance scenarios | QCLI-2.3 (Done) |
| cluster:domain | Actors/workflows/domain language | QCLI-2.4 (Done) |
| cluster:migration | Backlog migration fidelity + adoption playbook | QCLI-2.5 (Done), QCLI-2.10 |
| cluster:threat-model | Git/filesystem/concurrency threat model | QCLI-2.6 (Done) |
| cluster:synthesis | Final activation-ready synthesis | QCLI-2.8 |
| cluster:provenance (wave-2 follow-up) | Cross-task staleness correction + register coherence | QCLI-2.11 (Done), QCLI-2.12 (Done — its integration-review follow-up, PR #17, resolved and merged this session; see "Needs a human") |
| cluster:convention | Moving-vs-immutable reference convention + scope re-homing | QCLI-2.13 (Done), QCLI-2.14 (Done) |

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
trust a persisted "next wave" plan. Informational hint only: as of the start of
restore #2, QCLI-2.1 is Done and 9 remain; QCLI-2.2, QCLI-2.7, and QCLI-2.9 are
dependency-clear with disjoint clusters, and everything else is blocked behind
QCLI-2.2 or QCLI-2.4.

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

## Frontier

**CAMPAIGN COMPLETE as of wave 5, 2026-08-04.** All 14 subtasks
(QCLI-2.1–QCLI-2.14) are `Done`, and the parent epic QCLI-2 itself is
settled `Done` — its own 4 ACs independently verified against specific
completed deliverables (not mechanically inferred from "all children Done"),
see QCLI-2's task notes. The queue has no further campaign-labelled,
non-Done tasks. Nothing to dispatch. See "Proposed follow-ups" below for one
genuine coherence gap surfaced by the final integration review, proposed as
a fresh (non-campaign) task pending owner approval — not auto-created.

## In flight

Cleared at settlement — none. All wave-5 worktrees (main dispatch + the
integration-review follow-up) returned to the pool; all branches deleted
local and remote for PRs #18, #19, #20. The one item previously listed here
(`fix/qcli-2.12-followup-f2-f3-f4`) resolved and merged this session — see
"Needs a human / blocked" below.

## Needs a human / blocked

**None currently outstanding.** One item, resolved this session — kept below
as history since it took 6 fix-and-review passes to close and the pattern
(SHA-pinning a co-edited sibling document) could recur elsewhere.

### Resolved: register/ledger revision-pin self-reference trap

`fix/qcli-2.12-followup-f2-f3-f4` — a narrow follow-up branch addressing 3
findings (F2, F3, F4) the wave-4 integration review raised against
QCLI-2.12's already-merged register/ledger work — escalated after
exhausting the campaign's 2-retry fix-cycle budget (3 total review passes,
all independently re-verified by the orchestrator's dispatched reviewers,
not rubber-stamped).

**Root cause:** the register's revision-pin field cited the migration
ledger by exact commit SHA, but QCLI-2.12's own fix passes routinely edit
the ledger in the same pass as the register. Any SHA pin of a co-edited
sibling document is structurally invalidated by construction — three
unguided passes each fixed the previously-flagged staleness while
introducing a fresh instance of the same trap.

**Owner decision (this restore, via AskUserQuestion):** Option A — pin the
migration ledger the way the register already self-pins itself ("to its own
current state on this branch, as amended live through this same edit"),
rather than (b) strict edit ordering or (c) abandoning the follow-up. Chosen
because (b) had already failed identically three times (a discipline
problem, not a structural fix) and the user's stated goal was finishing
research/design durably, not iterating further on manual ordering.

**Outcome:** two more fix-and-review cycles were needed after the decision
(pass 5 found a false git-history timing claim in the pin's forensic
narrative, blocking; pass 6 fixed it and 2 non-blocking wording issues) —
both within the normal 2-retry cap. Final reviewer verdict: **approve**,
independently re-deriving every timing claim from git history rather than
trusting the worker's report. The migration ledger's citation now carries no
commit SHA; the other 8 enumerated members keep their pins unchanged
(verified byte-identical to pass 3's exhaustive re-audit). Zero
Classification-field changes, zero permitted-use narrowing. Gates: `lore
check --strict` 23 files 0/0; `lore validate --strict` (both files) 0/0;
`lore orphans` 0/0.

Merged as PR #17, squash commit `c8dfdca`. Full pass-by-pass history is in
QCLI-2.12's task notes.

## Proposed follow-ups — status as of end of wave 4, 2026-08-04

**All four of wave 3's proposals are now resolved.** A and C (QCLI-2.11,
QCLI-2.13) were Done as of wave 3. B and D (QCLI-2.12, QCLI-2.14) ran in
wave 4, were approved, and are settled `Done`. The wave-3 F2 proposal
(QCLI-2.12's AC#6/AC#7) was approved by the owner at this restore and
applied before dispatch — see owner ruling 10 above; both ACs independently
confirmed on QCLI-2.12's re-review.

**Discharged, carried forward no longer:** QCLI-2.8's dependency list —
flagged as an open owner decision at the end of wave 2, deferred through
wave 3, raised and approved at this restore (owner ruling 11). QCLI-2.8 now
depends on QCLI-2.2 through QCLI-2.14 (excluding QCLI-2.9/2.10), so it will
synthesize from post-correction text rather than inheriting staleness
QCLI-2.11–2.14 fixed.

**Discharged:** the stale runbook reference — flagged at the end of wave 2,
deferred through wave 3, raised and approved at this restore (owner ruling
12), fixed directly on `dev` (commit `aed386a`).

**NEW, from the wave-4 integration review — narrow, mostly already fixed.**
Six findings total (F1-F6, this doc's naming restarts per wave); all were
narrow/mechanical, none required a new task or product decision:

- F1 (`docs/log.md` dangling pre-squash SHAs + missing QCLI-2.14 entry) —
  **fixed directly by the orchestrator**, mechanical `lore sync` on `dev`.
- F2/F3/F4 (register/ledger enumeration + revision-pin + attribution gaps)
  — **F2 fixed and confirmed stable across all 3 fix passes.** F3/F4
  escalated after 3 unguided passes, then **resolved this session** (Option
  A self-pin, PR #17) — see "Needs a human / blocked" above. No wave-4
  finding remains open.
- F5/F6 (QCLI-2.5's deliverable: stale scratch-repo count, incomplete
  evidence-source enumeration) — **fixed and merged**, PR #16, approved on
  first re-review.

**Discharged, folded into the wave-5 proposal below:** the low-severity
"process-level responses" register-enumeration gap flagged at the end of
wave 4 (worth raising "when QCLI-2.8 dispatches") is superseded by the
broader register-coherence gap wave 5's integration review found — see the
new proposed follow-up below, which covers both.

## Wave 5 — status as of campaign completion, 2026-08-04

QCLI-2.8 and QCLI-2.10 (PRs #18, #19) were reviewed and approved after one
fix cycle each, well within the 2-retry cap. A wave-level integration review
(top-tier reviewer, read-only investigation) then found 9 narrow cross-task
coherence issues between the two new deliverables (C1–C7, S1, S4) plus 2
orchestrator-scope items — **all resolved this session**:

- **C1–C7, S1, S4** (narrow, cross-document): fixed in a single follow-up
  branch, reviewed and approved on first pass, merged as PR #20. Details:
  dropped clauses restored (C2, C3), a misattributed restriction corrected
  (C1), a register-enumeration-gap disclosure added for symmetry (C4),
  additive cross-references added (C5), a terminology overload resolved
  (C6), a missing version-pin/recheck pointer added (C7), two mistargeted
  intra-document links fixed (S1), a loose definition corrected (S4). S3
  (brittle line-number citations) was checked and found already accurate —
  no edit needed.
- **O1** (Story↔Task coupling): confirmed — QCLI-2.10 through QCLI-2.14 were
  missing from `docs/stories/prepare-quests-clean-room-research-foundation.md`'s
  frontmatter `tasks:` list and their own `doc:` back-reference labels.
  **Fixed directly by the orchestrator** via `lore link` (never hand-edited),
  commit `8c3133e`.
- **O2** (register enumeration): confirmed as **real, not narrow** — see the
  proposed follow-up immediately below. Not fixed this session; both wave-5
  tasks' own scope boundaries explicitly excluded editing the register.

**A process defect was also found and fixed this session, unrelated to any
task's content:** a commit message the orchestrator wrote during O1's fix
(`docs: sync managed blocks after Story<->Task coupling fix`) contained a
raw `<->`, which trips `lore check --strict`'s MDX-portability lint the
moment `lore sync` embeds it into `docs/log.md` — turning the campaign's own
"zero warnings" bar into 2 warnings (exit 6). Root cause confirmed in
`lore-cli` source (`src/core/log.ts:163`): the log-sync generator embeds raw
commit subjects with no MDX escaping, while `src/core/check.ts`'s
portability rule then flags that same unescaped, generator-produced content
— a self-inflicted gate failure. **Resolved two ways, both per explicit
owner approval (AskUserQuestion):** (1) the offending commit, pushed only
moments earlier with nothing else built on it, was amended and
force-pushed (`1ebf5b6` → `8c3133e`); (2) the upstream defect was reported
as `LCLI-316` in `opum-ai/lore-cli`'s own Backlog — **created but
deliberately left uncommitted**, since that repo's local checkout already
carried substantial unrelated uncommitted/untracked work from another
session (a modified `ci.yml`, a dozen untracked `lcli-31x` task files) that
this session should not disturb. Whoever next works in `lore-cli` should
commit `LCLI-316` (or fold it into that session's own commit) — it is not
tracked by any `quest-cli` mechanism.

### Proposed follow-up (NEW) — needs owner approval, not created

**Title:** Close remaining research-source-register enumeration gaps
(QCLI-2.5, 2.6, 2.8, 2.9, 2.10 not yet members of "Prior QCLI research
records"; process-level-response evidence class undisclosed)

**Why:** the register's "Prior QCLI research records" slice
(`docs/reference/quest-cli-research-source-register.md:787-829`) enumerates
9 members. Five merged deliverables are relied upon by other campaign
outputs without being enumerated as members of that slice: QCLI-2.5's
Backlog migration fidelity contract, QCLI-2.6's Git/filesystem/concurrency
threat model, QCLI-2.8's component contracts and delivery graph, QCLI-2.9's
packaging contract, and QCLI-2.10's Backlog adoption and migration
playbook. This is the identical gap class QCLI-2.12 closed for four other
documents earlier in the campaign — the register's own text already
concedes the pattern ("None of these three was previously named in this
enumeration despite already being relied on... by merged deliverables").
Separately, the register's "Backlog.md public surface" slice does not state
whether **process-level responses** from running the installed tool (e.g.
an `mcp start` stdio JSON-RPC response, used substantively by QCLI-2.5) are
an admissible evidence class either way — flagged independently by two
reviewers across waves 4 and 5.

Neither gap blocks any settled task's own acceptance criteria (both
QCLI-2.8 and QCLI-2.10 disclose the specific instance affecting them rather
than silently relying on unenumerated coverage), but both are exactly the
class of defect this campaign has otherwise driven to zero.

**Draft acceptance criteria:**
1. `docs/reference/quest-cli-research-source-register.md`'s "Prior QCLI
   research records" slice enumerates all five identified documents, each
   correctly pinned (self-pinned if co-edited by this same task, per the
   Option-A convention QCLI-2.12's escalated follow-up established;
   SHA-pinned otherwise).
2. The "Backlog.md public surface" slice's Permitted use states explicitly
   whether process-level responses from running the installed tool are an
   admissible evidence class, with reasoning.
3. Zero Classification-field changes; zero narrowing of any permitted use a
   merged deliverable already relies on (same non-negotiable this campaign
   held throughout).
4. `lore check --strict`, `lore validate --strict`, `lore orphans` all
   clean.

**Recommended handling:** a single-task, single-branch fix (worker +
review, same pattern as QCLI-2.12's original register-coherence pass) —
does not need a full wave. Surfaced at R6 for the user's decision on
whether/when to create it; this campaign forbids autonomous follow-up
filing.

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

## Campaign conventions learned in wave 4

Recorded because each cost real time and will recur.

1. **A resumed teammate can silently stall for hours with zero progress and
   zero error — always sanity-check elapsed time against comparable work,
   not just "is it still running."** QCLI-2.14's first fix attempt was
   dispatched to a *resumed* teammate (via `SendMessage` to an already-idle
   worker) rather than a fresh background agent. It sat "running" for over 2
   hours with the worktree still exactly at its pre-fix commit — zero
   commits, zero uncommitted changes, no error, no idle notification. Every
   comparable fix this wave (dispatched as background agents via the `Agent`
   tool) completed in 2-9 minutes. Killing the stuck teammate (`TaskStop`)
   and redispatching the identical prompt as a background agent completed in
   under 2 minutes with zero lost work (the worktree was untouched, so
   nothing to reconcile). **Convention: prefer background agents
   (`Agent` tool, fresh dispatch) over resumed teammates for fix passes; if a
   resumed teammate must be used, treat "no commits after N minutes, where N
   is 2-3x this wave's median for comparable work" as a stall signal worth
   proactively checking (`TaskStop` on a bogus ID lists running
   teammates/agents without side effects — a safe way to probe liveness),
   not something to wait out indefinitely.**
2. **A tool-infrastructure bug (pane-allocation failure) was worked around by
   omitting the `name` parameter on the `Agent` tool call.** Every attempt to
   spawn a *named* teammate failed identically (`herdr pane split ... pane
   not found`) after a certain number of concurrent panes had been opened
   this session; omitting `name` produced an unnamed background agent (same
   underlying dispatch mechanism, different pane-allocation path) that
   spawned successfully every time thereafter, for the rest of the wave.
   Convention: if a named `Agent` dispatch fails on a pane error, retry once,
   then fall back to an unnamed dispatch rather than repeating the same
   failure — unnamed agents are equally capable of being resumed via their
   returned `agentId` with `SendMessage` if needed later.
3. **An accidental duplicate reviewer dispatch surfaced a real defect the
   "official" reviewer missed — a live argument for redundant review, not
   just a mistake to route around.** Trying to resume a first reviewer via
   the `Agent` tool (rather than `SendMessage`) accidentally spawned a
   second, context-less reviewer under the same name pattern. Rather than
   discard its output, it was treated as a genuinely independent second
   opinion — it disclosed its own context gap upfront, ran a full review
   from scratch, and found a real staleness the first `approve`-verdict
   reviewer had only flagged as non-blocking. The disagreement between the
   two verdicts was itself the useful signal. Convention: when a dispatch
   mistake produces a second independent read on the same subject, don't
   discard it reflexively — check whether it disagrees with the first, and
   treat disagreement as reason to dig deeper, not reason to pick one
   verdict arbitrarily.
4. **The register/ledger co-editing self-reference trap: pinning a
   co-edited sibling document by exact commit SHA is structurally
   self-defeating, and this cost 3 full review cycles to actually
   diagnose.** QCLI-2.12's own admission-authority work routinely edits both
   `quest-cli-research-source-register.md` and
   `former-ocli-to-qcli-migration-ledger.md` in the same pass. A field in the
   register that pins the ledger to "the commit that last amended it" is
   false the moment any later commit in the *same pass* touches the ledger
   again — which QCLI-2.12's own fix passes did, repeatedly, specifically
   because fixing one finding (e.g. an attribution error, B3) requires
   editing the ledger, and that edit invalidates a pin the register wrote
   moments earlier for an unrelated finding (the revision-pin field, B1).
   Three consecutive fix-and-review cycles each closed the *previously
   identified* stale pins but reintroduced exactly one new one, because none
   addressed the structural cause. **This is now flagged for a human
   decision (see "Needs a human / blocked") rather than a fourth automated
   attempt** — the campaign's 2-retry cap did its job: it stopped an
   unproductive loop rather than letting it run indefinitely on the same
   unaddressed root cause. The general lesson for future register/ledger
   work: a revision-pin field describing a document this same task-family
   routinely co-edits should either self-pin ("as amended live through this
   task's own edits", the pattern the register already uses for citing
   itself) or the edit order should be fixed by convention (content edits to
   all co-edited files first, revision-pin field last, `lore sync` last of
   all) — picking one of these BEFORE starting a fix pass, not discovering
   the need for one after three failed attempts.
5. **The wave-level integration review found real findings even in a wave
   with zero single-task `request_changes` on first pass for 3 of 4
   members** (QCLI-2.6 approved pass 1; QCLI-2.5 and QCLI-2.12 each needed
   one fix cycle, QCLI-2.14 needed one, all four eventually approved) —
   consistent with waves 2 and 3's finding that this class of defect is
   structurally invisible to single-task review. Six findings (F1-F6) this
   wave, one of which (F1, a mechanical `docs/log.md` staleness) is now
   routine enough to fix directly rather than dispatch a worker for.
6. **`gh pr merge --squash --delete-branch` worked cleanly on every one of
   this wave's 6 PRs (#12-#16, plus the original 4 from wave 4's main
   dispatch) with no local-branch-delete failures** — unlike waves 2 and 3,
   where the worktree-holds-branch trap fired on every single merge. The
   difference: this wave consistently returned the worktree (`treehouse
   return`) *before* calling `gh pr merge`, matching the fix those waves'
   conventions already prescribed. Confirms the ordering fix holds under
   repeated use, not just as a one-off recovery.

## Campaign conventions learned in wave 5

Recorded because each cost real time and will recur, or because this was the
campaign's last wave and the lesson should survive it.

1. **A restatement of another document's normative claims can silently drop
   the clause that makes it safe — check restatements against their source
   sentence-by-sentence, not just for topical coverage.** QCLI-2.8's
   synthesis restated two of QCLI-2.5's fidelity-contract properties
   (source-immutability, one-writer-coexistence) but dropped, in each case,
   the exact clause that reconciled the rule with a legitimate exception
   (the human-consented remediation path; the operational freeze
   precondition) — leaving the synthesis reading as forbidding what its own
   sibling document (QCLI-2.10) correctly implements. Both single-task
   reviews passed the synthesis on its own terms; only the cross-document
   integration read caught it, because the contradiction only exists when
   both documents are read together. Convention: when a document restates
   another's normative rule, the review checklist should diff the
   restatement against the source clause-by-clause, not just verify the
   restated version reads sensibly in isolation.
2. **Amending and force-pushing a just-pushed, nothing-built-on-it commit is
   sometimes the right fix — but always ask first, even when you authored
   the mistake yourself and are confident it's safe.** The orchestrator's
   own commit message tripped a real lint (MDX-unsafe raw `<` embedded via
   `lore sync` into `docs/log.md`). The safe fix (amend + force-push) was
   objectively low-risk — tip of `dev`, pushed moments earlier, nothing
   else had built on it — but is still a shared-history rewrite, so it went
   through `AskUserQuestion` rather than being decided unilaterally. The
   user's answer also asked for the upstream defect to be reported, not
   just the symptom patched — both were done.
3. **The upstream defect (confirmed in `lore-cli` source, not just
   inferred from symptoms): `src/core/log.ts`'s log-sync generator embeds a
   commit's raw subject into `docs/log.md` with no MDX escaping, and
   `src/core/check.ts`'s own portability rule then flags that exact
   generator-produced content — a self-inflicted, cross-file gate failure.**
   Filed as `LCLI-316` in `opum-ai/lore-cli`'s own Backlog. Until it lands,
   avoid raw `<`, `>`, `{`, `}` in commit subjects on any commit that will
   pass through `lore sync`'s log generation (i.e. essentially all of
   them) — spell out or hyphenate instead (e.g. "Story-to-Task" not
   "Story<->Task").
4. **Working in a second, foreign repository (to file a cross-repo defect
   report) needs the same ground-truth check as this repo — branch,
   uncommitted state, before touching anything.** `lore-cli`'s local
   checkout was on a non-default release branch with substantial unrelated
   uncommitted and untracked changes from another session already present.
   The task was created (additive, low-risk) but deliberately **not
   committed** — committing into a foreign, active, uncommitted workspace
   the orchestrator doesn't own the context for is not a call to make
   unilaterally, unlike creating the file itself.
5. **A rebase conflict on a task's own Backlog file needs the richer side
   kept, and "richer" isn't always the same side.** Two distinct cases
   this wave: for the *escalated* branch (3 passes of history), `dev`'s
   settled content (Done/ACs/final-summary) was richer than the branch's
   stale task-file diff — resolved `--ours`. For the *fresh* wave-5
   branches, the branch's own plan/notes were richer than `dev`'s
   dispatch-label-only stub — resolved `--theirs`, then the `wave-5` label
   (which only existed on `dev`'s stub) had to be **manually reapplied at
   settlement**, since taking `--theirs` silently drops it. General rule:
   identify which side has the more complete, authoritative content for
   that specific conflict — don't apply a blanket `--ours`/`--theirs`
   convention across different conflict shapes — and always check for
   labels the discarded side had gained.
6. **The wave-level integration review found real, substantive findings
   (dropped safety clauses, not just wording nits) a fifth consecutive
   time, including in a wave where both single-task reviews passed within
   one fix cycle.** This is now a fully load-bearing pattern across every
   wave this campaign ran, not an artifact of any one wave's task mix —
   confirms the practice generalizes and should be standard for any future
   multi-task wave in this project, campaign or not.

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
| F2 | Register `Prior QCLI research records` slice doesn't enumerate two documents QCLI-2.3 cites under it; `quest-doc canonical product records` slice's permitted use may not cover how QCLI-2.4 actually cites it | **Proposed** as two new ACs on QCLI-2.12 — approved by owner at restore #4, applied, both confirmed on QCLI-2.12's re-review |
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

### Wave 4 — 2026-08-04 — QCLI-2.5, QCLI-2.6, QCLI-2.12, QCLI-2.14 — all merged and settled, plus a follow-up batch (one branch escalated)

Base `dev @ 94529f0` (after this restore's pre-wave orchestrator edits: F2's
two ACs applied to QCLI-2.12, QCLI-2.8's dependency list widened, the stale
runbook reference fixed directly on `dev`). Four members, exactly the
frontier hint from the wave-3 handover — two newly ready (QCLI-2.5, QCLI-2.6)
and two of wave 3's approved follow-up proposals (QCLI-2.12, QCLI-2.14) —
disjoint clusters, disjoint authored files (QCLI-2.5/2.6 each authored a new
doc; QCLI-2.12 owned the register + migration ledger; QCLI-2.14 owned QCLI-
2.7's deliverable + the research-program Spec). Merged serially in ordinal
order, each rebased onto the moving `dev` with mandatory re-verification;
every branch's own Backlog task file conflicted against the dispatch/in-
review label commits (expected, resolved as established — branch content
kept, labels reapplied via the `backlog` CLI); QCLI-2.6 and QCLI-2.14
additionally conflicted on `docs/log.md`/the Story's managed block (expected,
resolved via `-X theirs` + a post-rebase `lore sync`, never hand-merged):

| Task | PR | Squash commit | Review |
| --- | --- | --- | --- |
| QCLI-2.5 | #12 | `407ea61` | approve, pass 2 (pass 1 `request_changes` — AC5 gap: `draft create` enumerated but never actually exercised) |
| QCLI-2.6 | #13 | `739aa7e` | approve, pass 1 |
| QCLI-2.12 | #14 | `d55eaf7` | approve, pass 2 (pass 1 `request_changes` — F1/F2 AC-level findings) |
| QCLI-2.14 | #15 | `157ad56` | approve, pass 2 (pass 1 `request_changes` from an independent second review pass, after the first pass had already approved — see conventions item 3) |

Final state after the main wave: `lore check --strict` 23 files 0/0;
`lore validate --strict` 23 files 0/0 6 skipped; `lore orphans` 0/0. Still no
test/build/lint gate in this repository.

**QCLI-2.5's B1 finding.** `backlog draft create` was enumerated in the AC4
surface table but had no AC5 execution row — the document's existing
`DRAFT-1` evidence actually came from `task create --draft`, a different CLI
node, falsifying the document's own "every node exercised" claim. Fixed by
actually running `draft create` against a fresh scratch repo and recording
real evidence; re-confirmed by independent reproduction on re-review.

**QCLI-2.14's stall-and-recovery.** The first fix attempt (for a stale
`QCLI-2.8` dependency-range clause in newly-authored prose) was dispatched
to a resumed teammate and silently stalled for 2+ hours with zero commits;
killed and redispatched as a background agent, which completed in under 2
minutes. See conventions item 1.

**Wave-level integration review — 6 findings (F1-F6, this wave's own
numbering), 1 fixed directly, 4 fixed via follow-up, 1 escalated.**

| # | Finding | Disposition |
| - | --- | --- |
| F1 | `docs/log.md` carried 5 dangling pre-squash SHAs and was missing the QCLI-2.14 merge entry | **Fixed directly** by the orchestrator — mechanical `lore sync` on `dev`, no worker dispatch needed |
| F2 | Register's `Prior QCLI research records` slice still didn't enumerate 3 documents (QCLI-2.3, QCLI-2.4, QCLI-2.7's deliverables) cited under it by this wave's new documents | **Fixed and stayed fixed** across all 3 follow-up passes — confirmed complete and untouched by every subsequent pass |
| F3 | That same slice's `Exact revision or retrieval date` field predated its own enumerated members | **Escalated** — see "Needs a human / blocked" |
| F4 | The migration ledger's admission-rule note omitted QCLI-2.12's own same-day register amendments | Basis question resolved by the owner (ruling 13); the fix itself (naming the amendments, citing the correct authority) was applied cleanly in follow-up pass 1 and confirmed stable, but is entangled with F3 in the same escalated branch |
| F5 | QCLI-2.5's deliverable said "two scratch repositories" where the review-round fix had made it three | **Fixed and merged**, PR #16, approved pass 1 |
| F6 | QCLI-2.5's "produced only from" evidence-source list omitted two classes (`mcp start` stdio JSON-RPC, `browser` HTTP probes) actually used | **Fixed and merged**, PR #16, approved pass 1 — see "Proposed follow-ups" for a related low-severity register-enumeration observation surfaced by this fix |

Checks that came back clean with no finding: no filename or content
collision between QCLI-2.5's and QCLI-2.6's new documents; QCLI-2.8's
already-widened dependency list (applied pre-wave, this restore) consistent
everywhere it's referenced; every shared factual figure across all four
deliverables (backlog.md v1.49.3, `@opum-ai/lore` version, BB-01..17 count,
reconciliation-candidate numbering) internally consistent; the deliberately-
deferred stale QCLI-2.8 row in the Spec's Dependency-order table confirmed
untouched, exactly as it should be.

**Follow-up fix batch — 2 branches, one closed clean, one escalated after 3
cycles.**

*F5/F6 (QCLI-2.5), one cycle, clean:*

| Fix | Task | PR | Squash commit | Review |
| --- | --- | --- | --- | --- |
| F5+F6 | QCLI-2.5 | #16 | `418c5eb` | approve, pass 1 |

*F2/F3/F4 (QCLI-2.12's register + ledger), three cycles, escalated:*

Branch `fix/qcli-2.12-followup-f2-f3-f4`, based on `dev @ 086ee74` (post-F1
mechanical fix). Pass 1 fixed F2 (stayed fixed thereafter) and F3/F4, but
review found the F3 fix incomplete (4 of 9 members still stale, finding B1)
plus 2 more issues (B2, B3). Pass 2 fixed B2/B3 and 4 stale pins, but review
found the SAME field still had exactly 1 stale pin — introduced by pass 2's
own B3 edit to the co-owned ledger landing after the register had already
pinned it. Pass 3 ran an exhaustive from-scratch 9-member audit and fixed
every pin identified stale as of pass 2's review — but the identical trap
fired a third time (this pass's own two content commits, 6 seconds apart,
recreated exactly one new stale pin). Reviewer verdict: **escalate**, fix-
cycle budget exhausted (2-retry cap, 3 total review passes). Branch pushed
(`5dd001e`), left unmerged. Full detail, root-cause analysis, and the two
proposed durable fixes are in "Needs a human / blocked" above.

One more mechanical `lore sync` on `dev` after the F5/F6 merge (consistent
with the now-established one-sync-per-batch convention). Final state after
settlement: `lore check --strict` 23 files 0/0; `lore validate --strict` 23
files 0/0 6 skipped; `lore orphans` 0/0.

**Relay reliability — same defect as waves 2 and 3, every agent role, every
wave running.** Every idle notification this wave arrived without its
payload; every verdict was obtained only after an explicit resend request.
No exceptions this wave either.

### Wave 5 — 2026-08-04 — QCLI-2.8, QCLI-2.10 — merged and settled; escalation resolved; campaign complete

Two-part session. First, the wave-4 escalation (`fix/qcli-2.12-followup-f2-f3-f4`,
3 review passes, `human_needed`) was resolved: the owner chose Option A
(self-pin the migration ledger) via `AskUserQuestion`, explained in
plain-language terms with a recommendation per the owner's follow-up
request. Two more fix-and-review cycles closed it (a false git-history
timing claim, then a wording tightening), both within the normal 2-retry
cap. Merged as PR #17, squash commit `c8dfdca`. Full detail archived under
"Needs a human / blocked" above.

Then wave 5 proper: `dev @ f39ff5c`, two members — QCLI-2.8 (`cluster:synthesis`,
the largest task in the campaign, deps on 10 other subtasks) and QCLI-2.10
(`cluster:migration`, deps on QCLI-2.5) — disjoint clusters, each authoring
its own new document, dispatched in parallel:

| Task | PR | Squash commit | Review |
| --- | --- | --- | --- |
| QCLI-2.8 | #18 | `8749119` | approve, pass 2 (pass 1 `request_changes` — an 18-row vs. 15-row AC5 count error, a false "ten dependencies" Spec-table attribution, 6 non-blocking citation nits) |
| QCLI-2.10 | #19 | `de41389` | approve, pass 2 (pass 1 `request_changes` — a false register-admissibility claim for one citation, 3 non-blocking citation-targeting nits) |

Final state after the main wave: `lore check --strict` 25 files 0/0;
`lore validate --strict` 25 files 0/0 6 skipped; `lore orphans` 0/0.

**Wave-level integration review — 9 narrow cross-document findings (C1-C7,
S1, S4) plus 2 orchestrator-scope items, all resolved this session.**

| # | Finding | Disposition |
| - | --- | --- |
| C1 | Playbook misattributed a self-imposed restriction (QCLI-2.5's) to the register | Fixed, PR #20 |
| C2 | Synthesis dropped the fidelity contract's human-consented-remediation escape clause | Fixed, PR #20 |
| C3 | Synthesis dropped the fidelity contract's primary one-writer-coexistence precondition sentence | Fixed, PR #20 |
| C4 | Asymmetric register-gap disclosure between the two siblings | Fixed (disclosure added to the synthesis), PR #20 |
| C5 | No navigational cross-reference between the two siblings' overlapping migration content | Fixed (additive only, no dependency added), PR #20 |
| C6 | "Phase" meant two different things across the two siblings | Fixed (4 occurrences reworded in the playbook), PR #20 |
| C7 | Synthesis restated Backlog-version-derived facts with no pin/recheck clause | Fixed, PR #20 |
| S1 | Two mistargeted "below" pointers in the playbook | Fixed, PR #20 |
| S4 | Playbook's "Lifecycle folder" definition claimed 4 locations while enumerating 5 | Fixed, PR #20 |
| O1 | Story↔Task coupling: QCLI-2.10-2.14 missing from the Story's frontmatter and their own `doc:` back-refs | **Fixed directly** by the orchestrator via `lore link`, commit `8c3133e` |
| O2 | Register's "Prior QCLI research records" slice doesn't enumerate QCLI-2.5, 2.6, 2.8, 2.9, or 2.10 | **Real work, not narrow** — proposed as a follow-up task, not fixed (out of scope for both wave-5 tasks); see "Proposed follow-ups" |

S3 (brittle line-number citations) was checked during the C1-C7/S1/S4 fix
pass and found already accurate — no edit needed. The C1-C7/S1/S4 follow-up
branch was reviewed and approved on the first pass; merged as PR #20,
squash commit `8935551`.

**A process defect, unrelated to any task's content, was found and fixed
during O1's settlement:** see "Campaign conventions learned in wave 5" item
2-3 for the full account (an orchestrator commit message tripped a real
`lore-cli` portability-lint defect; fixed via an owner-approved amend +
force-push, plus an upstream defect report, `LCLI-316`, filed in
`opum-ai/lore-cli`).

**Settlement.** QCLI-2.8 and QCLI-2.10 settled `Done`, all ACs checked
against reviewer-confirmed evidence (4 and 6 respectively). The parent epic
QCLI-2 was then also settled `Done` — its own 4 ACs independently verified
against specific completed deliverables (not mechanically inferred from
"all children Done"; see QCLI-2's task notes for the full evidence chain).
Final gates after all wave-5 work: `lore check --strict` 25 files 0/0;
`lore validate --strict` 25 files 0/0 6 skipped; `lore orphans` 0/0.

**Campaign complete.** Queue empty; no further campaign-labelled, non-Done
tasks. One follow-up proposed (O2, register enumeration), pending owner
approval.


