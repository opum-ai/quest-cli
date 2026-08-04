---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-04 06:01'
updated_date: '2026-08-04 07:07'
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

**Owner decision, 2026-08-04:** quest-cli moves to the `opum-ai` GitHub org and
publishes in the `opum-ai` npm org as **`@opum-ai/quest`**, executable still
`quest`. The transfer has **not** been executed — `git remote -v` still reports
`salient-data/quest-cli`.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of the end of
restore #1, QCLI-2.1 is Done; 9 remain. QCLI-2.2, QCLI-2.7, and QCLI-2.9 became
dependency-clear when QCLI-2.1 settled, and their clusters (requirements,
lore-gate, packaging) are disjoint.

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
| cluster:lore-gate | Lore dependency/evidence matrix | QCLI-2.7 |
| cluster:packaging | npm package allocation/provenance | QCLI-2.9 |
| cluster:scenarios | Black-box acceptance scenarios | QCLI-2.3 |
| cluster:domain | Actors/workflows/domain language | QCLI-2.4 |
| cluster:migration | Backlog migration fidelity + adoption playbook | QCLI-2.5, QCLI-2.10 |
| cluster:threat-model | Git/filesystem/concurrency threat model | QCLI-2.6 |
| cluster:synthesis | Final activation-ready synthesis | QCLI-2.8 |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

None — wave 1 settled, worktree returned to the pool, branch deleted.

## Needs a human / blocked

No task is labelled `needs-human`. Three **owner decisions** are pending, and
two of them gate wave 2's quality:

1. **Two governing documents now contradict the register** (recorded inside it
   as Superseded findings, deliberately not resolved by QCLI-2.1):
   - `docs/reference/quest-cli-component-charter.md:23` still reads "preferred
     npm package `quest` and executable `quest`"
   - `docs/adr/use-quest-cli-for-the-quest-package-and-command.md` decision #1
     still names `salient-data/quest-cli` as the canonical repository
   Dispatching QCLI-2.9 before these are reconciled means building packaging
   research on top of documents that disagree with each other.
2. **QCLI-2.9's acceptance criteria may no longer fit.** Its title and ACs are
   framed around *resolving* the unscoped `quest` allocation; the owner has
   already decided `@opum-ai/quest`. AC1 ("Dated registry evidence records
   current ownership … for the preferred quest package name") and AC3
   ("accepted unscoped name or scoped fallback") need re-reading against a
   decision that is already made.
3. **The Lore activation gate may now be satisfied.** See the wave log.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed. Each entry is a ready-to-run proposal.

1. **Amend the charter and the ADR to the `opum-ai` identity.** Update charter
   `:23` to `@opum-ai/quest` (executable still `quest`) and ADR decision #1 to
   `opum-ai/quest-cli`, recording the supersession inline per the migration
   ledger's stated convention rather than rewriting history. Scope: two files,
   both lore-managed. Should land **before** QCLI-2.9 runs.
2. **Classify lore-cli's release-gate documents in the register.**
   `reference/lore-cli-release-truth.md` and `runbooks/release-publishing.md`
   are named as QCLI-2.7's evidence but carry no class from the register's own
   six-term vocabulary, so the register's admission rule cannot be satisfied
   for QCLI-2.7's own primary source. Fails closed, so it is not urgent, but
   QCLI-2.7 will hit it. Could fold into QCLI-2.7 rather than a new task.
3. **Add a catch-all to the lore-cli Contextual slice.** It enumerates five
   Backlog documents as a closed list;
   `reference/historical-upstream-backlog-json-tag-watch.md` is a sixth in the
   same corpus (upstream tag-watch provenance, not source-derived, so no
   laundering risk). A clause covering "any further lore-cli document deriving
   from Backlog.md source" would close the gap permanently.

## Wave log

### Wave 1 — 2026-08-04 — QCLI-2.1 — merged, settled

Base `dev @ 0cf0f34`, rebased onto `3107d3a`, merged as squash commit
**`1f51cce`** via PR #1. Worktree leased from the treehouse pool and returned;
branch `feat/qcli-2.1-revalidate-provenance` deleted.

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
