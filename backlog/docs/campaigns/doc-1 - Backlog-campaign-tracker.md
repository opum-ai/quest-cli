---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-04 06:01'
updated_date: '2026-08-04 06:25'
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
project's clean-room gate (see `docs/reference/quest-cli-component-charter.md`
and `docs/reference/former-ocli-to-qcli-migration-ledger.md`): no product
source, runtime dependency, executable scaffolding, package publication, or
release. Workers must not inspect or port legacy Opum/OCLI implementation
source or tests — only admitted, cited requirements/narratives. Any
Quest-wide vocabulary/architecture/roadmap finding is a proposal to
`quest-doc`, never treated as normative here.

## Owner rulings — 2026-08-04, restore #1

Recorded verbatim because they change task scope. Do not re-litigate; do not
re-ask.

1. **Backlog.md source stays EXCLUDED — strict clean-room.** The owner was
   offered a contextual/allowed reclassification (backlog.md is MIT, so source
   reading would be legally permissible with attribution) and declined. The
   constraint is authorship independence, not licensing. Permitted evidence is
   published documentation, `backlog --help` and each command's own help,
   `--plain`/`--json` output, and on-disk artifacts produced by running the
   tool. Undocumented behavior is a finding to record, never a reason to open
   the source. QCLI-2.1 must classify the backlog.md source slice as
   **excluded** and its public surface as **allowed**.
2. **Coverage must be exhaustive, not representative.** The owner directed
   that the backlog CLI's help and commands be "fully enumerated and tested for
   complete coverage of all functionality end to end." QCLI-2.5 gained ACs #4,
   #5, #6 for this: enumerate the whole surface with a method proving nothing
   was omitted, exercise every command end to end against a throwaway scratch
   repository, and record the pinned revision plus a no-source-inspected
   attestation.
3. **Pinned Backlog revision: v1.49.3.** The owner named v1.49.1; v1.49.3 is
   the current npm release and the locally installed build, and the owner chose
   to pin current. A newer release is a reclassification trigger requiring
   recheck before any contract freezes.
4. **QCLI-2.10 approved and created** — the Backlog→Quest adoption/migration
   playbook, dependent on QCLI-2.5, `cluster:migration` (so it serializes
   behind QCLI-2.5 on both dependency and conflict grounds).

## Dated evidence gathered at restore #1 — 2026-08-04

Registry/release facts captured by the orchestrator. These are **inputs for the
owning tasks to verify and classify**, not settled findings, and each is
dated because each can drift.

| Fact | Value as of 2026-08-04 | Owning task |
| --- | --- | --- |
| `backlog.md` latest npm release | 1.49.3, MIT, `git+https://github.com/MrLesk/Backlog.md.git`, homepage `backlog.md` | QCLI-2.5, QCLI-2.10 |
| `backlog` binary installed locally | 1.49.3, via bun global | QCLI-2.5 |
| lore-cli v0.1.0 initial release | **GitHub release** `salient-data/lore-cli` tag `v0.1.0`, published 2026-08-04T02:44:47Z. No npm publication under this name was found | QCLI-2.7 |
| npm `lore-cli` | **Occupied by an unrelated third party** — v0.13.2, MIT, `git+https://github.com/lore/lore.git`. Not Salient Data's package | QCLI-2.7, QCLI-2.9 |
| npm `lore` | Also occupied by that same unrelated project, v0.13.0, last modified 2022-06-19 | QCLI-2.9 |
| npm `quest` (Quest's preferred unscoped name) | **Occupied** — v0.4.0 exists on the public registry | QCLI-2.9 |
| npm `@salient-data/*` scope | `@salient-data/quest`, `@salient-data/quest-cli`, `@salient-data/lore-cli` all return 404 — scope appears unclaimed for these names | QCLI-2.9 |

The lore-cli finding matters beyond QCLI-2.7: the pattern of a Salient Data
component shipping a GitHub release while the matching unscoped npm name is
held by an unrelated project is exactly the constraint QCLI-2.9 exists to
resolve for `quest`. QCLI-2.7 must verify the release evidence against the
owning repository itself rather than trusting this table.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of
2026-08-04 restore #1, 10 tasks queued, 1 ready (QCLI-2.1), 9 blocked on
dependencies.

## Confirmed queue order

Confirmed by the user on 2026-08-04. This is the wave-builder's tie-break, NOT
a guarantee that any task lands in any particular wave.

1. QCLI-2.1 — Revalidate Quest research provenance and the migration boundary
2. QCLI-2.2 — Reconcile legacy Opum requirements into Quest CLI candidates
3. QCLI-2.7 — Track Lore dependencies and Quest activation evidence
4. QCLI-2.9 — Resolve the `quest` npm package allocation and provenance gate
5. QCLI-2.3 — Turn prototype failures into Quest black-box scenarios
6. QCLI-2.4 — Define Quest CLI actors, workflows, and domain-language candidates
7. QCLI-2.5 — Research Backlog migration fidelity through public contracts
8. QCLI-2.6 — Model Quest Git, filesystem, and concurrency threats
9. QCLI-2.10 — Author the Backlog-to-Quest adoption and migration playbook
10. QCLI-2.8 — Synthesize Quest CLI research into activation-ready component contracts

QCLI-2.10 was inserted after QCLI-2.5 (its dependency) and before QCLI-2.8,
which must synthesize it.

## Clusters

| Cluster label | Covers | Tasks |
| --- | --- | --- |
| cluster:provenance | Source/provenance register revalidation | QCLI-2.1 |
| cluster:requirements | Legacy Opum requirement reconciliation | QCLI-2.2 |
| cluster:lore-gate | Lore dependency/evidence matrix | QCLI-2.7 |
| cluster:packaging | npm package allocation/provenance | QCLI-2.9 |
| cluster:scenarios | Black-box acceptance scenarios | QCLI-2.3 |
| cluster:domain | Actors/workflows/domain language | QCLI-2.4 |
| cluster:migration | Backlog migration fidelity contract + adoption playbook | QCLI-2.5, QCLI-2.10 |
| cluster:threat-model | Git/filesystem/concurrency threat model | QCLI-2.6 |
| cluster:synthesis | Final activation-ready synthesis (depends on all above) | QCLI-2.8 |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |
| QCLI-2.1 | 1 | `~/.treehouse/quest-cli-033df3/1/quest-cli` (lease `6742857eebf086fef538f19a5f7aec9b`, holder `qcli/QCLI-2.1`) | `feat/qcli-2.1-revalidate-provenance` | 1 — dispatched |

## Needs a human / blocked

None currently.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up
work is filed. Each entry is a ready-to-run proposal.

None outstanding. QCLI-2.10 was proposed and approved at restore #1 and is now
a real task, so it has been removed from this section.

## Wave log

### Wave 1 — 2026-08-04 — QCLI-2.1

Dispatched. Base `dev @ 0cf0f34`. Outcome recorded at settlement.
