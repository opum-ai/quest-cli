---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-04 06:01'
updated_date: '2026-08-04 12:58'
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

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

None — wave 1 settled; wave 2 dispatch pending at the time of this write.

## Needs a human / blocked

No task is labelled `needs-human`. All three owner decisions pending at the end
of restore #1 are now resolved:

1. Charter/ADR contradiction — **resolved** by QCLI-5 (Done).
2. QCLI-2.9's acceptance criteria — **resolved** by ruling 9: they fit as
   written; the task is dispatchable with a framing note.
3. The Lore activation gate — **assigned**, not assumed. QCLI-2.7 owns formal
   confirmation and must verify rather than inherit the restore-#1 finding.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed. Each entry is a ready-to-run proposal.

*(Restore-#1 follow-up 1 was discharged by QCLI-5. Follow-ups 2 and 3 —
classifying lore-cli's release-gate documents, and adding a catch-all to the
lore-cli Contextual slice — are folded into QCLI-2.7's AC7 register work rather
than filed separately, since ruling 8 requires touching the same slice.)*

None currently open.

## Wave log

### Wave 1 — 2026-08-04 — QCLI-2.1 — merged, settled

Base `dev @ 0cf0f34`, rebased onto `3107d3a`, merged as squash commit
**`1f51cce`** via PR #1. Worktree leased from the treehouse pool and returned;
branch `feat/qcli-2.1-revalidate-provenance` deleted locally — the **remote**
copy survived and was pruned at restore #2.

Delivered `docs/reference/quest-cli-research-source-register.md` — 17 source
slices, each carrying an explicit `Classification` plus the six provenance
fields AC1 requires. All three ACs checked on reviewer-confirmed evidence.

Review: two passes.

- **Pass 1 → `request_changes`.** One major defect: the register asserted "no
  source slice informs a QCLI requirement unless listed here as Allowed", but
  5 of 15 slices carried no classification anywhere — including the historical
  OCLI records and the recovery commits `7b82afc`/`d42c016`, which are
  QCLI-2.2's and QCLI-2.3's primary evidence. Applied literally, the register
  would have locked out its own downstream tasks. Fixed by adding
  `Classification` as the first field of every slice.
- **Pass 2 → `approve`.** Audited whether adding those fields silently
  reclassified any of the 10 slices whose class was previously only implied by
  a lookup table — **zero reclassifications**, against a byte-identical
  vocabulary table. A wrong-but-authoritative class would have been worse than
  an absent one.

Verification (re-run after rebase): `lore check --strict` 16 files 0 errors 0
warnings; `lore validate --strict` 16 files 0 errors 0 warnings 6 skipped;
`lore orphans` 0 orphans 0 dangling links; tree clean. No automated test,
build, or lint gate exists in this repository and none was claimed.

**Material finding for the campaign — the Lore activation gate.**
`opum-ai/lore-cli`'s `docs/reference/lore-cli-release-truth.md` records
`@opum-ai/lore@0.1.0` as genuinely released: six public npm packages, tag
`v0.1.0` → commit `e621d209be2cc8867d1c38c7c78b4b4acc96d82e`, GitHub Actions
run `30870431925`, per-package SHA-256 recorded, clean registry install
verified, Trusted Publisher bound to `opum-ai/lore-cli`. The charter and ADR
gate Quest *implementation* on the canonical Lore release, so that gate now
appears **satisfied** — QCLI-2.7 owns formal confirmation. One caveat carried
in Lore's own record: LCLI-278 is still open, so automated `publish: true`
dispatches remain prohibited because the `release` environment has no
effective required-reviewer rule.

Process note: the reviewer for pass 1 was dispatched while the worker was still
writing (the orchestrator resumed the worker with an evidence correction, then
dispatched review without waiting for the resumed run to finish). The reviewer
detected the moving branch, waited for it to stabilize, and judged the final
state — but the sequencing was an orchestrator error. Wait for a resumed
worker's completion notification before dispatching review.

Wave-level integration review: **not run, by construction.** Wave 1 had a single
member, so there is no cross-task surface a single-task review could have
missed. Not a skipped gate.

### Interlude — QCLI-5 — 2026-08-04 — outside the campaign, merged to `dev`

Not a campaign task (no `campaign` label) and not dispatched by this skill, but
it discharged restore-#1's proposed follow-up 1 and lifted the gate on
QCLI-2.9. Commit `942da73`. Amended five sites across four documents: the ADR
gained an inline dated amendment superseding decision #1's
`salient-data/quest-cli` and recording decision #2's scope fallback as
*exercised* rather than overridden; the charter now states `@opum-ai/quest`
with the executable still `quest`; the register's "not yet transferred" claim
became the completed transfer with two reclassification triggers marked fired;
and the migration ledger's repository-history note gained the transfer plus an
explicit statement that `quest-doc`, `lore-doc`, `opum-doc`, and `quest-web`
remain in `salient-data` — verified live before any link was touched.

Two reusable findings from its notes: `lore link` takes a **concept id, not a
path** — a path argument fails with "not in the bundle" while still exiting
`0`, so the exit code alone does not prove a link landed. And `lore orphans`
will report a task with no owning doc, which is the check that catches it.

### Wave 2 — 2026-08-04 — QCLI-2.2, QCLI-2.7, QCLI-2.9 — dispatched

Three members, disjoint clusters, disjoint authored files. QCLI-2.7 carries the
folded-in adapter alignment (rulings 7 and 8) and owns the source register this
wave. QCLI-2.9 carries the closed-decision framing (ruling 9). Outcome recorded
at settlement.
