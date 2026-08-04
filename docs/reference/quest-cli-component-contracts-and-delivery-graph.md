---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI component contracts and delivery graph
tags:
  - quest
  - cli
  - synthesis
  - contracts
  - delivery-graph
  - activation-gate
  - clean-room
summary: Synthesizes admitted QCLI-2.2-2.7 (and 2.11-2.14 corrected) research into implementation-independent component contracts and a dormant, activation-gated delivery graph.
timestamp: 2026-08-04T22:10:22.749Z
---

# Quest CLI component contracts and delivery graph

This Reference is `QCLI-2.8`'s output: the top-level integration of six
completed research deliverables (`QCLI-2.2`–`QCLI-2.7`) and four completed
correction passes against those deliverables and the shared corpus
(`QCLI-2.11`–`QCLI-2.14`) into reviewed, implementation-independent Quest
CLI component contracts, plus a proposed component delivery graph. It is
the current successor to former `OCLI-3.8` ("research synthesis") per the
[migration ledger](former-ocli-to-qcli-migration-ledger.md) row
`OCLI-3.8 → QCLI-2.8`.

Every requirement below traces to the [research source
register](quest-cli-research-source-register.md) or to one of the ten
dependencies named in the Provenance section, per this task's own
acceptance criterion #1. No requirement, scenario, or contract term in this
document was authored from memory of a prior wave, from a legacy Opum or
Backlog.md implementation, or from any source the register does not
classify Allowed for the specific use cited. Provenance is preserved, not
compressed away: where a cited document already states the detailed
invariant, threat, or scenario, this document restates it functionally and
cites rather than duplicates it, following the same "supplies the
invariants those scenarios are instances of, not a second copy" discipline
[`QCLI-2.6`](quest-cli-git-filesystem-and-concurrency-threat-model.md)
already established relative to
[`QCLI-2.3`](quest-cli-black-box-acceptance-scenarios.md).

This document settles no Quest-wide vocabulary, actor model, architecture,
or roadmap question — see "Routing to `quest-doc` and inactive status"
(AC4), below. It authorizes no implementation. Every component decision
this campaign left evidence-dependent stays open here, named explicitly as
an open question, a component decision, a product-owner proposal, or a
blocker (AC3) — none is resolved by drafting this synthesis.

## Details

### Provenance and grounding (AC1)

| Source | Repository / path | Revision | Contributes |
| --- | --- | --- | --- |
| Quest CLI research source register | [`quest-cli-research-source-register.md`](quest-cli-research-source-register.md) (this repo) | this branch, as revalidated by `QCLI-2.1` and amended by `QCLI-2.7`/`QCLI-2.11`/`QCLI-2.12`/`QCLI-2.13` | The per-slice admission authority for every citation in this document and in all ten dependencies below |
| Quest CLI component charter | [`quest-cli-component-charter.md`](quest-cli-component-charter.md) (this repo) | this branch | The owned-surface authority ("Owns here" list, routing table, first-release non-goals, "Sources of truth") every contract below is grounded against |
| Former OCLI to QCLI migration ledger | [`former-ocli-to-qcli-migration-ledger.md`](former-ocli-to-qcli-migration-ledger.md) (this repo) | this branch | Row-gating authority establishing this task as `OCLI-3.8`'s current successor; the preservation rules this document follows |
| Quest CLI pre-implementation research program | [`quest-cli-pre-implementation-research-program.md`](../specs/quest-cli-pre-implementation-research-program.md) (Spec, this repo) | this branch | The program's Allowed/Prohibited work lists, Required Outputs, the Dependency order table naming six of this task's ten dependencies (`QCLI-2.2`–`QCLI-2.7`; the Spec's table predates `QCLI-2.11`–`QCLI-2.14`'s creation and carries no row for them — the full ten-item set is named in this task's own Backlog record, not in this table), the Moving vs. immutable references and Recheck clause conventions this document follows, and the Open Questions this document treats as still open |
| Use quest-cli for the Quest package and command | [ADR](../adr/use-quest-cli-for-the-quest-package-and-command.md) (this repo) | this branch, incl. the 2026-08-04 `QCLI-5` amendment | Current package/repository/command identity and its own explicit conditionality statement, cited by the CLI identity contract below |
| Prepare Quest's clean-room research foundation | [Story](../stories/prepare-quests-clean-room-research-foundation.md) (this repo) | this branch | The campaign's own acceptance criteria this document's structure answers to |
| `QCLI-2.2` — Legacy Opum requirement reconciliation for Quest CLI | [`legacy-opum-requirement-reconciliation-for-quest-cli.md`](legacy-opum-requirement-reconciliation-for-quest-cli.md) (this repo) | this branch, as corrected by `QCLI-2.11` | The 16-row legacy-candidate classification (Reusable/Adapted/Superseded/Deferred/Rejected) this document's CLI identity, lifecycle, and Git mutation contracts build on; the sole product-wide routing (candidate #6) this document re-affirms |
| `QCLI-2.3` — Quest CLI black-box acceptance scenarios | [`quest-cli-black-box-acceptance-scenarios.md`](quest-cli-black-box-acceptance-scenarios.md) (this repo) | this branch, as corrected by its own wave-3 follow-up | 17 independently authored scenarios (`BB-01`–`BB-17`) this document's lifecycle, JSON/exits, and Git mutation contracts cite as caller-observable grounding; this document is the "`QCLI-2.8`" that scenario document's own "Structured result and exit" field definition already points to for the concrete JSON/exit-code table |
| `QCLI-2.4` — Quest CLI component glossary, actors, and workflows | [`quest-cli-component-glossary-actors-and-workflows.md`](quest-cli-component-glossary-actors-and-workflows.md) (this repo) | this branch, as corrected by its own wave-3 follow-up | The candidate vocabulary and six end-to-end workflows this document's lifecycle and projection contracts cite; the component-level actor-responsibility table that corroborates, without resolving, candidate #6 |
| `QCLI-2.5` — Quest CLI Backlog migration fidelity contract | [`quest-cli-backlog-migration-fidelity-contract.md`](quest-cli-backlog-migration-fidelity-contract.md) (this repo) | this branch, as corrected by its own review and wave-4 follow-up | The six fidelity-contract properties (deterministic dry runs, reversible ID mapping, collision handling, source immutability, one-writer coexistence, rollback evidence) this document's migration contract restates functionally |
| `QCLI-2.6` — Quest CLI Git, filesystem, and concurrency threat model | [`quest-cli-git-filesystem-and-concurrency-threat-model.md`](quest-cli-git-filesystem-and-concurrency-threat-model.md) (this repo) | this branch | The five named mutation invariants (`INV-1`–`INV-5`) this document's Git mutation contract restates verbatim, and the topology/repository-removal grounding this document's projection contract cites |
| `QCLI-2.7` — Quest CLI Lore dependency and adapter contract evidence | [`quest-cli-lore-dependency-and-adapter-contract-evidence.md`](quest-cli-lore-dependency-and-adapter-contract-evidence.md) (this repo) | this branch, as corrected by its own review passes and by `QCLI-2.14` | The live Lore activation-evidence matrix (Part 1) this document's activation-gate section cites without restating; the 15-row `AC5` adapter-requirement classification (Part 2) this document's Lore integration and JSON/exits contracts draw on |

`QCLI-2.11`, `QCLI-2.12`, `QCLI-2.13`, and `QCLI-2.14` produced no
deliverable of their own to cite separately — each is a correction pass
against the register, the migration ledger, the research program Spec, and
the `QCLI-2.2`/`QCLI-2.3`/`QCLI-2.4`/`QCLI-2.7` deliverables named above.
The Spec's Dependency order table, cited in the Provenance table above,
names only the six deliverables `QCLI-2.2`–`QCLI-2.7`; the full ten-item
dependency set — those six plus these four correction passes — is named in
this task's own Backlog record (`QCLI-2.8`'s `Dependencies` field), not in
the Spec's table. This document read the corrected **live text** of every
one of those documents, not the correction tasks' own implementation notes;
see "Reconciliation across the ten dependencies," below, for the specific
corrections verified present.

`QCLI-2.9`'s [packaging contract](quest-cli-packaging-contract.md) is
**not** one of this task's ten named dependencies and is not cited as a
source here. Where this document needs the settled `@opum-ai/quest`
package-identity fact, it cites the register's own "quest-cli repository
and npm package identity" slice directly, per this task's own instruction
that every claim trace to a dependency deliverable "or to the register
directly."

Not used to inform any requirement below: Backlog.md implementation source
and internal tests (Excluded); the local Backlog.md clone (Quarantined);
any Quarantined legacy Opum artifact; the Deferred
`jeremy-newhouse/opum-engine` prototype surfaces beyond their register-cited
existence and disposition; and the `lore-cli` Backlog.md corpus (Contextual,
citable for nothing). No admitted dependency deliverable cites any of these
either, and this document adds no new citation of them.

### Scope and authorship boundary

The [component charter](quest-cli-component-charter.md) states plainly:
"Any research result that would change the Quest-wide vocabulary, actor
model, architecture, or roadmap is a proposal to `quest-doc`. It is not
normative merely because a QCLI task produced it." This document is the
synthesis of six deliverables that already drew that line — `QCLI-2.2`
first identified the one candidate that crosses it (candidate #6,
accountable-human delegation and actor responsibilities as a cross-repository
model) and routed it to `quest-doc`; `QCLI-2.4` independently corroborated,
without resolving, that same routing with its own component-level actor
table. This document does not reopen, re-decide, or restate that routing as
if it were new — see "Routing to `quest-doc` and inactive status" (AC4),
below, which consolidates it as an already-existing fact this synthesis
inherits.

Every functional contract below describes how the Quest CLI **component**
itself behaves — its own command surface, its own local records, its own
Git usage, its own consumption of Lore's published contract. None of it
binds `quest-doc`, `quest-web`, or a future Opum component the way a
product-wide decision would.

### Activation gate and dormancy

The Lore-wide integration boundary and release-gate policy is owned by
`lore-doc`, per the [component charter](quest-cli-component-charter.md)'s
routing table; Lore implementation and immutable release evidence belongs
to the owning `lore-*` repository, currently `lore-cli`. `QCLI-2.7`'s
[Lore dependency and adapter contract evidence](quest-cli-lore-dependency-and-adapter-contract-evidence.md)
is the maintained Quest-side consumer view of that gate. This document does
not reproduce, approximate, or restate the gate's own predicate, the
integration-obligation list, or the open-questions list `QCLI-2.7`'s own
Part 1 already declines to reproduce in full — those remain `lore-doc`'s
to own and are mutable.

`QCLI-2.7`'s Part 1 matrix classifies five Quest CLI choices against Lore.
Two bear directly on activation and are cited here by classification only,
not restated: "Whether *any* Quest product implementation may activate" is
**Requiring owner input**, gated on task `LDOC-4` (`lore-doc`); "Whether a
*future* Lore version bump can be trusted the same way `0.1.0` was" is
**Blocked on a named owner result**, gated on task `LCLI-278` (`lore-cli`).
The remaining three choices — the published release Quest research
currently targets, the versioned Lore import/link/adapter behavior, and
whether Lore treats a future Quest CLI as a drop-in `backlog`-shaped target
or builds it a distinct adapter — are **Evidence-complete**,
**Provisionally researchable**, and **Requiring owner input** respectively;
this document's "Lore integration" contract and the "Unresolved component
decisions" section, below, carry each forward at the same classification,
without upgrading any of them.

`QCLI-2.7`'s Part 1 also states an explicit **Activation handover
requirement**: a future activation session must, at minimum, re-run the
matrix's live commands with a new date, separately obtain live confirmation
from `lore-doc`'s own owner-held evidence that the release-gate predicate
reports Pass, and treat any choice still reading "blocked on a named owner
result" or "requiring owner input" as an unconditional stop, not a judgment
call to override. This document adopts that same requirement without
weakening it and adds nothing of its own beyond naming it.

**Live re-verification performed for this document (2026-08-04).**
Independent of `QCLI-2.7`'s own dated observation, this task re-ran, in the
local read-only clones:

- `backlog task view LDOC-4 --plain` in `/Volumes/external/repos/lore-doc`
  → status **To Do**, unchanged from `QCLI-2.7`'s finding.
- `backlog task view LCLI-278 --plain` in `/Volumes/external/repos/lore-cli`
  → status **To Do**, unchanged from `QCLI-2.7`'s finding.

Both are moving references, not immutable anchors — a Backlog task's live
status is exactly the class of fact the research program Spec's
["Moving vs. immutable
references"](../specs/quest-cli-pre-implementation-research-program.md#moving-vs-immutable-references)
subsection names. Per that subsection's
["Recheck clause
requirement"](../specs/quest-cli-pre-implementation-research-program.md#recheck-clause-requirement),
any later worker or activation session relying on this document's dormancy
conclusion **must** re-run both commands above (against live, fetched
clones, not a stale local checkout) before treating either status as
current, and must treat a changed result — either task moving off **To
Do** — as a new fact for the owner or the activation session to rule on,
exactly as `QCLI-2.7`'s own Activation handover requirement already states;
a worker may not silently treat either task landing as sufficient on its
own to begin implementation, since the Lore-wide gate predicate itself is a
separate, owner-held fact this document does not observe.

**Therefore:** every functional contract in the next section and every
node in the proposed delivery graph below is dormant. Each is describable
now, from admitted evidence, but none may begin implementation until (1)
the Lore-owned release gate reports Pass from `lore-doc`'s own live owner
evidence, and (2) a later, explicitly authorized activation session
performs the live re-verification this section and `QCLI-2.7`'s Activation
handover requirement both name — never a reuse of this document's or
`QCLI-2.7`'s dated observation as current proof. This document performs no
such activation and authorizes none.

### Component contracts (AC2)

Each contract states required, caller-observable behavior and invariants —
never a frozen schema, command name, flag, file layout, or algorithm, and
never anything traceable to Backlog.md's or legacy Opum's implementation
source. Where a sub-question remains genuinely open, it is named under
"Explicitly open" and carried forward into "Unresolved component decisions"
(AC3), not silently resolved here.

#### 1. CLI identity

*Grounded in:* the [register](quest-cli-research-source-register.md#quest-cli-repository-and-npm-package-identity-owner-decision-2026-08-04)'s
"quest-cli repository and npm package identity" slice; the
[component charter](quest-cli-component-charter.md)'s "Owns here" list
(lines 23–24) and "First-release non-goals" (line 47); the accepted [ADR](../adr/use-quest-cli-for-the-quest-package-and-command.md)
decision items 2–3 and its 2026-08-04 amendment; `QCLI-2.2`'s
[reconciliation](legacy-opum-requirement-reconciliation-for-quest-cli.md)
AC4 (Rejected identity vs. preserved execution invariants) and candidate
#13 (the former `opum pm` nesting, Rejected).

- The canonical component repository is `opum-ai/quest-cli`; the executable
  is `quest`; the target scoped npm package is `@opum-ai/quest` — unclaimed,
  unreserved, unpublished as of this document's own citation of the
  register, and not reserved, published, or released by this document
  (register, "quest-cli repository and npm package identity" slice).
- Command vocabulary, deterministic JSON, human output, and exit behavior
  are quest-cli's own to author (charter, line 24); no legacy `opum pm`
  nested command grouping carries forward (`QCLI-2.2` candidate #13,
  Rejected; AC4).
- The component begins as one package with an enforced CLI → application →
  domain → ports internal boundary; a separately released kernel package is
  deferred until a concrete second in-process consumer, incompatible
  runtime need, independent release cadence, or measured subprocess cost
  justifies it (ADR decision item 3) — an explicit non-decision to split
  prematurely, not a permanent single-package commitment.
- The former product name ("Opum"/`opum`), the former repository home
  (`salient-data/opum-cli`/`opum-doc`), and the former command namespace
  (`opum pm ...`) are rejected identity, not carried forward in any form
  (`QCLI-2.2` AC4).

*Explicitly open:* final availability of `@opum-ai/quest` at release time
(the register's own slice records this as time-bound, not settled by this
citation); product license (see "Unresolved component decisions," below).

#### 2. Lifecycle

*Grounded in:* `QCLI-2.4`'s
[glossary](quest-cli-component-glossary-actors-and-workflows.md) (Lifecycle
concepts: Lifecycle stage, Gate satisfaction, Reclamation, Recovery; Claims:
Claim record, Claim conflict); `QCLI-2.2`'s
[reconciliation](legacy-opum-requirement-reconciliation-for-quest-cli.md)
candidates #3–#5 (Git CAS-backed claims, TTL leases, human/plan/review
gates — mechanism only, all Adapted); `QCLI-2.6`'s
[threat model](quest-cli-git-filesystem-and-concurrency-threat-model.md)
"Clocks and leases" and "Races" threats, `INV-2`, and `INV-3`; `QCLI-2.3`'s
`BB-01`–`BB-04`, `BB-14`, `BB-15`.

- A task's lifecycle position is a candidate stage sequence only (e.g.
  unclaimed, claimed, gated, delivered, closed) — a name for the shape, not
  a frozen enum (`QCLI-2.4` glossary, "candidate shape only... not frozen
  here").
- Claims are Git CAS-backed authored records (`QCLI-2.2` #3, Adapted),
  valid only while a TTL lease is live (`QCLI-2.2` #4); lease expiry must be
  evaluable from authored history plus the evaluating actor's own local
  clock alone, and any two honest evaluators computing expiry for the same
  history at materially the same wall-clock moment must reach the same
  held/expired status, with a detected disagreement surfaced as a named
  anomaly, never silently resolved (`QCLI-2.6`, "Clocks and leases,"
  requirements 1–2; `BB-01`).
- A lease renewal (heartbeat) must be scoped to the exact lease
  generation/token it was issued against, so a late or stale renewal can
  never extend a different, newer holder's lease (`QCLI-2.6` requirement 4;
  `BB-02`).
- A gate blocks a task's lifecycle until its condition is recorded as
  satisfied with evidence (`QCLI-2.2` #5, mechanism only); self-supplied
  approval evidence never satisfies a separation-requiring gate (`BB-04`).
- Two concurrent claims on the same canonical task resolve to exactly one
  winner via conflict detection, never both succeeding and never both
  failing (`BB-15`; `QCLI-2.6` "Races," `INV-3`).
- Reclamation of an expired lease appends a new claim event; it never
  rewrites the expired claim's own history (`QCLI-2.4` glossary,
  Reclamation term; `QCLI-2.6` `TM-06`).

*Explicitly open:* concrete lease/heartbeat timing parameters; the specific
lifecycle-stage enum; gate-approval actor eligibility (who counts as an
accountable human, delegated agent, reviewer, or approver) — routed to
`quest-doc`, see "Governance" under Unresolved component decisions, below.

#### 3. JSON and exits

*Grounded in:* the [component charter](quest-cli-component-charter.md)
line 24; `QCLI-2.3`'s
[scenarios](quest-cli-black-box-acceptance-scenarios.md) categorical
exit/result vocabulary and its own explicit routing of the concrete
JSON/exit-code table to this document; `QCLI-2.7`'s
[adapter contract review](quest-cli-lore-dependency-and-adapter-contract-evidence.md)
Part 2 items 2a/2b/3a/3b/4a/4b/5a/5b and its central finding of envelope
divergence from Lore's own outbound contract.

- Every command must produce a deterministic, versioned, machine-parseable
  result on request (charter line 24), distinguishing at minimum three
  categorical outcomes: success; a structured decline or conflict distinct
  from success; and a structured error distinct from both (`QCLI-2.3`'s
  scenario-field convention; concrete instances in `BB-02`, `BB-03`,
  `BB-11`, `BB-15`, `BB-17`).
- `quest --version` (or equivalent) must report a bare, parseable semantic
  version and exit `0` (`QCLI-2.7` item 3a, "already satisfiable by Quest's
  chartered contract").
- A read command's not-found outcome must be unambiguous and distinguished
  from an unrelated hard error (`QCLI-2.7` item 5a, "already satisfiable");
  the exact signal convention is a genuine open tension — Quest's own
  charter default favors a structured error envelope over a bare exit-code
  convention, but is not obligated to mirror the narrower bare-exit-code
  pattern a current Lore adapter happens to expect (`QCLI-2.7` item 5b) —
  see "Explicitly open," below.
- Every mutating command must return, on success, a structured confirmation
  sufficient to recover any newly minted identifier without depending on
  parsing a specific human-readable stdout line (functional response to the
  write-path capture tension `QCLI-2.7` item 4b names between Quest's own
  deterministic-JSON default and a current Lore adapter convention).
- Read-only commands must have zero mutation as a caller-observable
  invariant of their exit/result contract, on every path including a
  not-found or error path (`BB-05`, `BB-06`; restated as `INV-5` under Git
  mutation, below, since the same invariant governs both).

*Explicitly open (component decisions, not resolved here):* the exact
envelope shape — whether `schemaVersion` is numeric or another form, the
`kind` naming convention, whether a shared `data` key exists or each `kind`
carries its own payload key, per-command payload-key naming — `QCLI-2.7`
Part 2 proves Quest must decide this itself, neither inheriting a current
Lore adapter's inbound expectation nor Lore's own outbound `cli-contract.md`
shape by default, since the two already diverge on purpose (item 2b); the
literal exit-code-to-outcome table; the not-found signal convention (item
5b); whether create/edit commands emit a JSON envelope uniformly (Quest's
own likely preference) or something narrower to match what a current Lore
adapter's write path already assumes (items 4b/4c) — the latter half of
that question is a `lore-doc` boundary decision, not resolvable by Quest
alone.

#### 4. Git mutation

*Grounded in:* the [component charter](quest-cli-component-charter.md)'s
"Sources of truth" and "safe filesystem and operation-owned Git behavior"
(line 27); `QCLI-2.6`'s
[threat model](quest-cli-git-filesystem-and-concurrency-threat-model.md)
`INV-1`–`INV-5` and its 13-item threat catalog; `QCLI-2.3`'s `BB-05`,
`BB-06`, `BB-09`–`BB-13`, `BB-16`, `BB-17`.

The five mutation invariants below are restated verbatim from `QCLI-2.6`'s
own naming (its own acceptance criterion #2 fixed these five terms); this
document does not re-derive or duplicate `QCLI-2.6`'s full threat-to-
invariant traceability table, only the invariants themselves as the
component's Git mutation contract.

| Invariant | Statement | Defends against (see `QCLI-2.6` for the full account) |
| --- | --- | --- |
| `INV-1` Atomicity | A mutating operation's owned filesystem and Git effects either all become visible together or none do | Partial writes; dirty-worktree absorption; mid-operation worktree removal |
| `INV-2` Idempotency | Invoking the same logical operation more than once for the same logical request produces the same observable end state as invoking it exactly once | Retries; duplicate events; the resume-not-restart half of partial writes (`BB-07`/`BB-08`); stale-heartbeat renewal (`BB-02`) |
| `INV-3` Conflict detection | An authoritative write is conditioned on the state it read (compare-and-swap against the target ref); a losing write is rejected with a structured conflict, never silently retried, force-applied, or resolved by discarding already-committed history | Races (`BB-15`); divergence; alias-vs-claim races; the non-downgrade half of `BB-17` |
| `INV-4` Operation-owned staging and commits | An operation stages and commits exactly the paths it owns for its own logical effect, determined before any write begins | Dirty worktrees (`BB-12`/`BB-13`); the scoped-commit half of `BB-16`/`BB-17` |
| `INV-5` Zero mutation from read-only commands | A command classified read-only performs no filesystem or Git mutation under any circumstance — success, not-found, or error path alike — regardless of a concurrent writer | Read-only purity (`BB-05`/`BB-06`); the read side of races |

*Explicitly open (`QCLI-2.6`'s own stated non-goals, unchanged here):* file
layout, naming scheme, canonical-ID grammar, event schema, locking
primitive, merge/rebase strategy, storage engine, and which supported
platforms Quest ships for — see "Unresolved component decisions," below.

#### 5. Migration

*Grounded in:* `QCLI-2.5`'s
[Backlog migration fidelity contract](quest-cli-backlog-migration-fidelity-contract.md)
AC1 (inventory), AC2 (field disposition), AC3 (the fidelity contract
itself), and its Findings.

- **Deterministic dry runs:** a no-mutation preview mode reports exactly
  what a migration would create and map, and exits non-zero while that
  preview is outstanding; the preview enumerates, per source record, its
  lifecycle-folder origin, source ID, proposed target ID, and any flagged
  collision or gap.
- **Reversible ID mapping:** Quest must persist an explicit source-ID →
  target-ID mapping keyed on `(source folder, source ID)`, not source ID
  alone, and the mapping must be reversible — given a target ID, Quest must
  recover the exact source file without re-scanning the source project.
- **Collision handling:** both same-scope duplicate IDs and cross-scope
  duplicate IDs (e.g., an active and an archived record sharing an ID) must
  be detected and reported, never silently resolved. `QCLI-2.5`'s own
  finding is the concrete evidence this generalizes from, not an invented
  Quest design choice: a real, unmanufactured active/archive ID collision
  from ordinary Backlog.md usage is invisible to Backlog's own `doctor`
  command, which scopes itself explicitly to "active or completed" tasks —
  Quest's own collision scan must be strictly wider than that scope.
- **Source immutability:** the migration read phase must never invoke a
  source-mutating Backlog.md command against a user's live project, at any
  point, for any convenience reason (e.g., never auto-run a repair command
  to "clean up" a collision before reading it).
- **One-writer coexistence:** the read pass must not assume the source
  project is quiescent from any Backlog.md-visible signal (Backlog provides
  no lock file); a long-running read pass must re-scan and diff the file
  list after completing and flag, never silently merge, any file that
  changed mid-scan.
- **Rollback evidence:** for every record a migration creates on the target
  side, Quest must record source folder, source ID, target ID, and a
  timestamp sufficient to support a manual rollback without re-running the
  mapping step or re-scanning the source project.

*Explicitly open:* whether or how to preserve Backlog-era Git history
itself (`QCLI-2.5`'s own owner-supplied-fixture finding: no Backlog.md
command surfaces that history as a record to preserve, so preserving it is
a Quest-side migration design decision, not an inherited requirement);
whether Quest needs a feature analogous to Backlog's
cross-branch task-state overlay (`QCLI-2.5`'s own explicit unsupported
gap — real and currently active in Backlog.md, but its reconciliation
algorithm is not derivable from any admissible source); Quest's own
canonical ID grammar, which this contract deliberately does not inherit
from Backlog's project-configurable, dot-suffixed convention (see
"Unresolved component decisions," below).

#### 6. Projection

*Grounded in:* the [component charter](quest-cli-component-charter.md)'s
"Sources of truth" (line 29, "rebuildable local projection, freshness,
recovery, and scale"); `QCLI-2.4`'s
[glossary](quest-cli-component-glossary-actors-and-workflows.md) Projection,
Freshness, Staleness/drift, and Rebuild terms; `QCLI-2.6`'s "Repository
removal" threat and `BB-07`/`BB-08`.

- A projection is never itself authoritative and is never trusted over Git
  on disagreement — disagreement is surfaced, not silently resolved in the
  projection's favor (charter; `QCLI-2.4` glossary, Derived local
  projection actor row).
- A projection must be rebuildable deterministically from authoritative
  Git state alone, discarding the prior projection without loss of
  authoritative data (charter; `QCLI-2.4` glossary, Rebuild term).
- An interrupted synchronization/refresh must resume from its last
  durably-recorded progress point on retry — never restart from zero and
  never silently skip unprocessed events (`BB-07`); repeated interruption
  must never permanently wedge the refresh loop, and an explicit forced
  full rebuild must remain available as a documented escape hatch distinct
  from incremental resume (`BB-08`).
- Projection state must be reported with its own recorded currency
  (freshness) relative to the authoritative Git state it was built from;
  detected staleness or drift must be surfaced, never silently tolerated
  (charter; `QCLI-2.4` glossary, Staleness/drift term).
- Local-only, unsynchronized Git commits are a distinct third tier — not
  authoritative synchronized history, and not the disposable projection.
  Quest must not report an operation as durably succeeded on the strength
  of that tier alone if the operation's own definition of "durable"
  requires synchronization (`QCLI-2.6`, "Repository removal," tier (ii)).

*Explicitly open:* scale target; any concrete storage or index engine for
the projection (both `QCLI-2.6`'s own non-goals and the Spec's Open
Questions; see below).

#### 7. Lore integration

*Grounded in:* the [component charter](quest-cli-component-charter.md)
line 30 ("versioned Lore import/link/adapter behavior"); `QCLI-2.7`'s
[Lore dependency and adapter contract evidence](quest-cli-lore-dependency-and-adapter-contract-evidence.md)
Part 1 (the "Optional Lore link" dependency's "Provisionally researchable"
classification) and Part 2 (the full adapter review and its `AC5`
15-row classification table); `QCLI-2.4`'s glossary "Optional Lore link"
workflow row.

- Lore participation is optional by default: no Quest-only workflow in the
  component's own lifecycle (claim and deliver, lease expiry and
  reclamation, human review gate, projection rebuild) depends on Lore being
  reachable (`QCLI-2.4` workflow table; charter "Sources of truth" section,
  "Neither writes the other's private files or database").
- A Lore link, when invoked, must fail loud on unreachability or a stale
  concept ID and leave the task's own authoritative state untouched
  (`QCLI-2.4` glossary, Optional Lore link workflow row).
- Where an adapter requirement is already satisfiable inside Quest's own
  chartered contract (`QCLI-2.7` `AC5` items 1a, 2a, 3a, 4a, 5a, 6a), it is
  an ordinary component obligation, already covered by the CLI identity,
  lifecycle, and JSON/exits contracts above — no separate Lore-specific
  carve-out is needed for these.
- Where a requirement's resolution depends only on a Quest-side decision
  not yet made (`QCLI-2.7` `AC5` items 1c, 2b, 4b, 6b), the required
  behavior is already stated functionally in the JSON/exits and Migration
  contracts above; the concrete choice is an open component decision (see
  below), not resolved by this document.
- Where a requirement's resolution depends on `lore-cli` or `lore-doc`'s
  own unbuilt or undecided side (`QCLI-2.7` `AC5` items 1b, 3b, 4c, the
  `lore-doc` half of 5b, 6c) — including the central finding that
  `lore-cli`'s only adapter type today is `BacklogAdapter`, with no
  generic pluggable interface to implement a second, differently-shaped
  backend against — it is an explicit blocker awaiting a `lore-doc`
  boundary decision, carried into "Unresolved component decisions" and the
  delivery graph below, never treated as settled by this document.

*Explicitly open:* the exact binary-invocation surface Lore would expect
from Quest (binary name, any operator-configurable override, probe
sequence); whether Lore's write path is updated to accept a JSON-flagged
create/edit response for a `quest`-shaped backend; whether the Story↔Task
coupling convention reuses the literal `doc:<conceptId>` label format —
every one of these is contingent on work or a decision this document has
no authority to perform.

### Unresolved component decisions (AC3)

Seven categories the research program Spec, the register, and the six
dependency deliverables leave open. Each is stated as it currently stands —
an open question, an explicit component decision awaiting an owner or a
later task, a product-owner proposal already routed elsewhere, or a
blocker gated on external work — never resolved by naming it here.

1. **Licensing.** The Spec's [Open
   Questions](../specs/quest-cli-pre-implementation-research-program.md#open-questions)
   name "Product license and contributor provenance" directly. No admitted
   source in this campaign records a chosen license for `@opum-ai/quest`;
   the [charter](quest-cli-component-charter.md) and the
   [ADR](../adr/use-quest-cli-for-the-quest-package-and-command.md) are
   silent on license choice. Backlog.md's own MIT license and the
   `@opum-ai/lore`/`quest`/`quest-cli` npm registry metadata this campaign
   read were admitted only as naming-conflict and allocation evidence
   (register, "npm package name occupancy" and "lore-cli / the `lore`
   command" slices), never as license guidance for Quest's own choice.
   **Status:** open, owner-held.

2. **Runtime.** The Spec's Open Questions name "Runtime and native
   packaging after Lore's completed evidence is reviewed" — explicitly
   gated on completed Lore evidence, i.e. structurally post-activation, per
   `QCLI-2.14`'s correction of `QCLI-2.7`'s original (withdrawn) cession of
   this question to `QCLI-2.9`. **Status:** blocked, outside any current
   wave; no task owns it as of this document.

3. **Platform.** The Spec's Open Questions separately name "Final npm
   package ownership and supported platform matrix" — distinct from
   runtime in carrying no Lore-evidence gate. `QCLI-2.7`'s Part 1 states
   plainly, as corrected by `QCLI-2.14`: "`QCLI-2.9` is not the owner of
   either: its Dependency order row records its delivered scope as npm
   package allocation and provenance only... and none was claimed here."
   **Status:** open, currently unowned by any task; a future task must
   claim it explicitly.

4. **ID grammar.** The Spec's Open Questions name "Canonical ID grammar,
   authored-record layout, event schema, and scale target" as one bullet.
   `QCLI-2.2`'s reconciliation candidate #10 (canonical task identity and
   alias handling, Adapted) already notes no admitted legacy ID-grammar
   design exists to port; `QCLI-2.5`'s migration contract independently
   confirms Backlog's own project-configurable prefix/zero-padding and
   dot-suffixed hierarchy (`TASK-1.1`) must not be silently inherited as
   Quest's own grammar (Migration contract, "Explicitly open," above);
   `QCLI-2.6` lists it among its own stated non-goals. **Status:** open,
   component decision, resolved by no document in this campaign.

5. **Scale.** Same Spec bullet as ID grammar, "...and scale target."
   `QCLI-2.6` derives its Git mutation invariants without assuming any
   particular scale; `QCLI-2.5` notes migration read-pass cost scales with
   source-project size but sets no target. **Status:** open, component
   decision.

6. **Governance.** The product-wide accountable-human / delegated-agent /
   reviewer / approver actor model. `QCLI-2.2`'s candidate #6 already
   identifies this as Quest-wide, not quest-cli-local, and explicitly
   routes it to `quest-doc`, stating the proposal "belongs in `quest-doc`'s
   own repository, not authored here and not authored into `quest-doc` by
   this quest-cli task." `QCLI-2.4`'s own component-level actor-
   responsibility table answers only how these roles act **within**
   Quest CLI, explicitly not a cross-repository definition, and states it
   "corroborates rather than resolves candidate #6." This document does
   not reopen that routing beyond re-affirming it (see AC4, below); it
   remains a proposal a later task must author into `quest-doc`'s own
   repository. **Status:** product-owner proposal, already routed, not
   authored here.

7. **Archival.** Two distinct facets, kept separate:
   - **(a) Quest's own record-archival/retention model.** The Spec's
     "authored-record layout" bullet implicates this; `QCLI-2.5`'s
     migration contract found a real, unmanufactured collision hazard in
     Backlog.md's own archive-folder handling (an active and an archived
     record can share an ID, invisible to every enumerated Backlog.md
     command) that Quest's own migration collision scan must independently
     cover (Migration contract, "Collision handling," above), rather than
     inherit Backlog's narrower scope. Whether Quest needs an archive tier
     at all, and what invariants would govern it beyond the Git-history
     three-tier model `QCLI-2.6` already derives (synchronized history /
     local-only unsynchronized commits / disposable projection), is not
     decided here. **Status:** open, component decision.
   - **(b) Legacy Opum evidence retention and remote disposition.** A
     separate, narrower question belonging to `opum-doc`, not quest-cli:
     the register's "Former `opum-cli` repository identity" slice names
     `opum-doc` task `OCLI-7` under the Story title "Decide legacy Opum
     evidence disposition," blocked on `QCLI-2.1` (Done); the register
     itself records neither a status nor `OCLI-7`'s fuller task title.
     `QCLI-2.2`'s reconciliation, as observed 2026-08-04, names `OCLI-7`'s
     fuller title ("Decide legacy Opum evidence preservation and remote
     disposition") and records it as still To Do — a moving reference,
     re-verify before relying — and already corrected the record that
     `OCLI-7` decides retention/disposition of already-registered legacy
     sources, not their historical existence (which is no longer in
     question). This document does not perform, substitute for, or reopen
     that decision. **Status:** blocked on a named owner task outside this
     component.

### Proposed component delivery graph (dormant)

A candidate ordering of future implementation work across the seven
functional contract areas above, mapped against the open decisions and
blockers in the section above. Every phase and every item below is a
**proposal** for a later, explicitly authorized task to pick up. This
document creates no Backlog task, assigns no task, claims no task, and
starts no task. Per the research program Spec's own "Allowed work" list —
"synthesize reviewed, implementation-independent functional contracts and
a dormant implementation graph" — this section is exactly that allowed
output, not a Prohibited-work violation of its own list ("product source,
runtime dependencies, generated CLI or package scaffolding").

| Phase | Candidate scope | Builds on (contracts) | Blocked by | Status |
| --- | --- | --- | --- | --- |
| 0 — Activation precondition | The Lore-owned release gate reports Pass from live `lore-doc` owner evidence; `LCLI-278`'s automated-publish control is resolved or an equivalent out-of-band control is approved | n/a | The Lore-wide gate (owner-held, see "Activation gate and dormancy," above) | Not started; gate unpassed as of this document's 2026-08-04 re-verification |
| 1 — Component decisions (no code) | Resolve the JSON-envelope shape, the not-found signal convention, canonical ID grammar, product license, and explicit ownership of the platform and runtime open questions | CLI identity; JSON and exits | The seven categories in "Unresolved component decisions," above; not blocked on the Lore gate itself | Proposal only |
| 2 — Core execution engine | Claims, leases, gate mechanism (excluding actor eligibility), event-derived state, operation-owned Git mutation satisfying `INV-1`–`INV-5` | Lifecycle; Git mutation | Phase 1's ID-grammar and envelope decisions | Proposal only, depends on Phase 1 |
| 3 — Local projection | Rebuildable projection, freshness/staleness reporting, resume-not-restart synchronization per `BB-07`/`BB-08` | Projection | Phase 2 | Proposal only, depends on Phase 2 |
| 4 — Backlog migration | Deterministic dry-run preview, reversible ID mapping, collision handling across both scopes, rollback evidence | Migration | Phase 2 (a canonical ID grammar to map into); Phase 3 (a projection to populate) | Proposal only, depends on Phases 2–3 |
| 5 — Lore adapter | Satisfy the `AC5` "already satisfiable" items unilaterally; the "requiring a `lore-doc` boundary decision" items (binary name/override, probe sequence, write-response shape, coupling-label format reuse) cannot start regardless of internal readiness | Lore integration | Phase 1 (envelope shape); `lore-doc` boundary decisions — an external blocker, not a Quest-side task | Proposal only, partially blocked externally |
| 6 — Packaging and release | Clean-install verification; protected publication of `@opum-ai/quest`; component release and rollback runbooks | CLI identity (packaging) | Phase 0's gate; the runtime and platform decisions named in Unresolved component decisions; the ADR's own consequence — "must not display a working install command until a protected immutable package is actually published and clean-install verification passes" | Proposal only, last phase, cannot begin before Phase 0 regardless of other phases' readiness |

Phases 1–5 are, in principle, describable and could be scoped as further
research or design work even before Phase 0's gate passes, consistent with
the Spec's Allowed-work list. None of them may, at any point before Phase
0's gate passes and is independently re-verified live, produce product
source, a runtime dependency, executable scaffolding, or a packaging or
release artifact — the Spec's Prohibited-work list applies to every phase
in this graph exactly as it applies to this document.

### Routing to `quest-doc` and inactive status (AC4)

Exactly one candidate in the entire corpus this document synthesizes
crosses the charter's product-wide line, and it is not new here:
`QCLI-2.2`'s reconciliation candidate #6, accountable-human delegation and
actor responsibilities as a cross-repository, Quest-wide model.
`QCLI-2.4`'s own component-level actor-responsibility table independently
corroborates, without resolving, that same routing. This document adds no
further Quest-wide finding of its own: it consolidates candidate #6's
existing routing (see "Governance" under Unresolved component decisions,
above) rather than reopening it, and it authors nothing into `quest-doc`'s
own repository.

No other content in this document proposes a change to Quest-wide
vocabulary, cross-repository architecture, or roadmap. Where a functional
contract above cites vocabulary `quest-doc` already adopts (task, event,
workspace, claim, lease, gate, delivery evidence, human ownership,
delegation — per `QCLI-2.4`'s own grounding in `quest-doc`'s canonical
execution graph), this document treats it as already settled elsewhere,
not newly proposed here.

**All implementation tasks remain unassigned and inactive.** This document
creates no Backlog task, assigns no task, checks no acceptance criterion
belonging to a future implementation task, and activates nothing. Every
phase in the proposed delivery graph above is dormant pending both
conditions stated under "Activation gate and dormancy": the Lore-owned
release gate reporting Pass, and a later, explicitly authorized session's
live re-verification of that fact — never a reuse of any dated observation
recorded in this document or in any of its ten dependencies.

### Reconciliation across the ten dependencies

This document's own research pass verified, against the **live** text of
the corrected documents (not the correction tasks' own implementation
notes), that the cross-task corrections `QCLI-2.11`–`QCLI-2.14` made are
present and consistent in every document this synthesis cites:

- The register's prior `846f054^ is c5ebee8` misattribution now correctly
  reads `846f054^` is `3023468` (`QCLI-2.11`).
- The register's `lore-cli` Backlog.md corpus catch-all states one test, in
  one formulation, in both the "Repository or URL" and "Exclusions" fields
  (`QCLI-2.12`).
- Every `d7ca18f` citation checked in the register and in `QCLI-2.2`'s
  reconciliation reads as a dated pin ("observed 2026-08-04; moving
  reference, re-verify before relying" or equivalent phrasing), not a live
  "HEAD" assertion (`QCLI-2.11`).
- `QCLI-2.7`'s Part 1 matrix no longer names `QCLI-2.9` as the owner of
  runtime, native-packaging, or supported-platform evidence — it now states
  plainly that no current task owns that question, and the Spec's
  dependency table carries explicit rows for `QCLI-2.9` and `QCLI-2.10`
  (`QCLI-2.14`) — verified directly in "Unresolved component decisions,"
  items 2–3, above.
- The Spec's "Verification bar" carries the Moving vs. immutable
  references and Recheck clause conventions this document follows, with a
  confirmed mutual cross-reference to the register's `lore-cli`
  reclassification-trigger bullet (`QCLI-2.13`).

No further correction to any of these documents is needed from this task,
and none was made — this document's scope boundary excludes editing the
register or the migration ledger (see Notes, below), and no other file this
synthesis cites required a fix beyond what `QCLI-2.11`–`QCLI-2.14` already
applied.

**One residual gap, reported and left standing, not fixed here.** The
register's "Backlog.md public surface" slice enumerates published
documentation, `backlog --help` and per-command help, `--plain`/`--json`
output, and on-disk artifacts produced by running the tool as the
admissible evidence classes for Backlog.md — it does not explicitly name
process-level responses from running the installed binary (for example,
`mcp start`'s stdio JSON-RPC response) as an admissible class either way.
`QCLI-2.5`'s
[Backlog migration fidelity contract](quest-cli-backlog-migration-fidelity-contract.md)
already relies on this evidence substantively (the server's self-reported
version and its EOF-shutdown behavior), under an enumeration clause that
document added to its own text, not the register's. This document's
"JSON and exits" and "Lore integration" contracts above do not themselves
depend on that evidence class, so nothing in this synthesis is affected
either way; the register's own silence on the question is noted here as an
out-of-scope finding for the register's owner, consistent with this task's
explicit instruction not to edit the register.

### Independence and verification

This document opened no Backlog.md implementation source or internal
tests, the local Backlog.md clone, any Quarantined legacy Opum artifact, or
the Deferred `jeremy-newhouse/opum-engine` prototype surfaces. It read the
ten dependencies' own **final, live** text in full, not a
summary or a prior wave's memory of them, and re-verified `LDOC-4`'s and
`LCLI-278`'s live Backlog status independently in the local `lore-doc` and
`lore-cli` clones, read-only, on 2026-08-04. It made no repository,
package, release, or remote mutation, opened no other external clone
beyond the two read-only status checks above, and did not edit the
register, the migration ledger, or any sibling task's document.

## Notes

This task read, in full, the research source register, the component
charter, the accepted ADR, the migration ledger, the research program
Spec, the Story, and all six `QCLI-2.2`–`QCLI-2.7` dependency deliverables'
own live (post-`QCLI-2.11`–`QCLI-2.14`-correction) text — not their
implementation notes or any prior summary. It did not open `QCLI-2.9`'s
packaging contract as a cited source (out of this task's ten named
dependencies), though the register's own "quest-cli repository and npm
package identity" and "npm package name occupancy" slices, which that
document also cites, were read and cited here directly. It opened no
Backlog.md implementation source or internal tests, no legacy Opum
implementation source, no artifact classified Quarantined by the source
register, and no `lore-cli` Backlog.md-corpus document. It did not edit
the source register or the migration ledger (out of this task's scope per
its own instructions), the research program Spec, or any sibling task's
output document. It made no repository, package, release, or remote
mutation in this repository or in any external clone; the two live status
checks against `lore-doc` and `lore-cli` were read-only Backlog CLI
invocations against pre-existing local clones.
