---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI component glossary, actors, and workflows
tags:
  - quest
  - cli
  - domain
  - actors
  - workflows
  - glossary
  - ownership
summary: Component-level glossary, actor responsibilities, and end-to-end workflows for Quest CLI; routes the product-wide actor model to quest-doc as a non-normative proposal.
timestamp: 2026-08-04T15:04:16.776Z
---

# Quest CLI component glossary, actors, and workflows

This Reference is `QCLI-2.4`'s output: a component-level glossary, actor
responsibility mapping, and end-to-end workflow catalog for the Quest CLI
component, defined before local schemas or commands are frozen. It is the
current successor to former `OCLI-3.4` per the
[migration ledger](former-ocli-to-qcli-migration-ledger.md). Every term below
is a **candidate** for independent authorship — a name and a responsibility,
not a frozen schema, command, or exit-code table; the
[research program](../specs/quest-cli-pre-implementation-research-program.md)
keeps runtime, packaging, and schema choices open pending Lore evidence, and
this document does not close any of them.

This document is independently authored, per the
[Story](../stories/prepare-quests-clean-room-research-foundation.md)'s own
acceptance criterion that "legacy Opum intent... become independently
authored Quest workflows, invariants, threats, and scenarios without source
or test copying." It is grounded in, and cites, three already-admitted
records rather than any legacy implementation: the
[component charter](quest-cli-component-charter.md) (the current owned-surface
authority), `QCLI-2.2`'s
[legacy requirement reconciliation](legacy-opum-requirement-reconciliation-for-quest-cli.md)
(the admitted legacy-candidate disposition matrix — cited here read-only, not
restated or re-classified), and `QCLI-2.7`'s
[Lore dependency and adapter contract evidence](quest-cli-lore-dependency-and-adapter-contract-evidence.md)
(cited here read-only for its central finding that no generic Lore↔task-tracker
adapter abstraction exists today). It also cites `quest-doc`'s own canonical
[Quest clean-room execution graph](https://github.com/salient-data/quest-doc/blob/dev/docs/specs/quest-clean-room-execution-graph.md)
(Spec, `quest-doc`, local clone `/Volumes/external/repos/quest-doc`, commit
`7d4d60c2854a533bbba63e6b69320587b8f88e83` (observed 2026-08-04; moving
reference, re-verify before relying), clean tree per `git status` at that
observation) — an Allowed source per the
[research source register](quest-cli-research-source-register.md#quest-doc-canonical-product-records)
("align this register's terms... cite when a rule here implements a
`quest-doc`-level rule") — as the authority for which vocabulary is *already*
Quest-wide (adopted there) versus what remains component-scoped candidate
language this document may originate. As of that observed commit,
`quest-doc`'s own repository held no actor-model glossary
(`quest-repository-and-authority-map.md` mentions "reviewer" once, in its own
review-routing rule, not as a Quest domain-actor definition), so no term
below overwrites or contradicts an existing `quest-doc` decision as of that
observation — see "Recheck clause for the `quest-doc` citation," below, for
what a changed result obligates.

## Details

### Scope and authorship boundary

The [component charter](quest-cli-component-charter.md) states plainly: "Any
research result that would change the Quest-wide vocabulary, actor model,
architecture, or roadmap is a proposal to `quest-doc`. It is not normative
merely because a QCLI task produced it." `QCLI-2.2`'s reconciliation already
drew the exact line this document stays inside, for its **candidate #6**
(accountable-human delegation and actor responsibilities): that candidate "is
Quest-wide **actor model**, not a quest-cli-local mechanism... This routing is
scoped to the **product-wide** actor model only; it is distinct from the
**component-level** actor-responsibility mapping `QCLI-2.4`'s own AC2 owns as
quest-cli's to make (distinguishing accountable humans, delegated agents,
reviewers, maintainers, Lore, Git, and derived local projections as they act
within this component) — nothing here forecloses that."

This document is that component-level mapping, and nothing more:

- Every glossary term, actor row, and workflow below describes how Quest CLI
  itself — one component — behaves, stores state, and assigns responsibility.
  None of it claims to be the cross-repository, product-wide definition of
  "accountable human," "delegated agent," "reviewer," or "approver" that
  would bind `quest-doc`, `quest-web`, or a future Opum component the same
  way.
- Where a term already appears in `quest-doc`'s own canonical
  [execution graph](https://github.com/salient-data/quest-doc/blob/dev/docs/specs/quest-clean-room-execution-graph.md)
  ("Core behavioral contract": "stable task, event, repository, workspace,
  and canonical-ID semantics"; "dependency readiness, explicit blocking,
  claims, TTL leases, heartbeats, human ownership, delegation, plan/review
  gates, and evidence-backed completion") — this document builds on that
  already Quest-wide vocabulary rather than inventing it. It does not
  originate the categories *task*, *event*, *workspace*, *claim*, *lease*,
  *gate*, *delivery evidence*, *human ownership*, or *delegation*; it gives
  them a component-scoped glossary entry and, where the charter and the
  admitted legacy candidates support it, a candidate mechanism.
- Where a term goes beyond that — naming the specific roles who may hold
  ownership or delegation, and how those roles interact with a gate — this
  document proposes quest-cli's own answer for its own command surface only.
  See "Routing to `quest-doc`" (AC4), below, which names this explicitly
  rather than leaving it implicit.

### Component glossary (AC1)

Candidate vocabulary, grouped by the categories AC1 names. A term's
"Grounding" column cites the admitted source it builds on; "Adapted"/
"Reusable" references are `QCLI-2.2`'s own disposition labels for the cited
legacy candidate, reproduced here for traceability, not re-derived.

#### Execution entities

| Term | Candidate definition | Grounding |
| --- | --- | --- |
| Task | The unit of accountable work Quest tracks; the subject of a claim, a gate, and delivery evidence | `quest-doc` execution graph, "Execution records... tasks"; charter "task/event/workspace schemas" |
| Event | An authored, Git-tracked record from which current task/workspace state is derived — state is a projection of event history, not a separately mutated record | Reconciliation candidate #1 (event-derived task/workspace state), Adapted |
| Workspace | An explicit, scoped enrollment boundary a task, claim, or projection operates within; enrollment is opt-in per repository, not implicit or global | Reconciliation candidate #2 (explicit workspace enrollment/scoping), Adapted; `quest-doc` execution graph, "explicit multi-repository enrollment and isolation" |
| Claim | A Git CAS-backed record asserting a specific actor currently holds accountable execution rights over a task | Reconciliation candidate #3 (Git CAS-backed claim records), Adapted |
| Lease | A claim's time-bounded validity window; a claim without a live lease is reclaimable | Reconciliation candidate #4 (TTL leases), Adapted |
| Gate | A block-until-satisfied checkpoint a task's lifecycle cannot pass until its condition is recorded as satisfied, with evidence | Reconciliation candidate #5 (human/plan/review gates, mechanism only), Adapted |
| Delivery evidence | The recorded artifact(s) that prove a gate's condition was satisfied — the record a reviewer or an accountable human points to, not a free-text claim | Task description ("delivery evidence"); `quest-doc` execution graph, "evidence-backed completion" |
| Adapter | The versioned behavior by which Quest CLI imports, links to, or exchanges data with Lore | Charter, "versioned Lore import/link/adapter behavior" (owns-here line 30) |
| Projection | A rebuildable, disposable, workspace-scoped local view derived from authoritative Git state; never itself authoritative | Charter, "Sources of truth": "Any graph/index is derived, disposable, deterministically rebuildable, and explicitly workspace-scoped" |

#### Lifecycle concepts

| Term | Candidate definition | Grounding |
| --- | --- | --- |
| Lifecycle stage | A task's position in its accountable-work sequence (candidate shape only — e.g. unclaimed, claimed, gated, delivered, closed — not frozen here) | `quest-doc` execution graph, "Execution records such as tasks... lifecycle events"; charter "dependency readiness, claims, leases, gates, lifecycle, and evidence" |
| Gate satisfaction | The recorded, evidenced transition of a gate from pending to satisfied — an authored write, never inferred from projection state alone | Reconciliation candidate #5, Adapted |
| Reclamation | The recovery path that releases an expired lease's claim back to an unclaimed state without discarding the task's event history | Reconciliation candidate #4, Adapted (mechanism only; no legacy heartbeat/reclaim design is ported) |
| Recovery | Any failure-triggered path that restores a claim, lease, or projection to a state consistent with authoritative Git history, never by mutating history to fit a broken projection | Charter, "rebuildable local projection, freshness, recovery, and scale"; reconciliation candidate #8 (read-only purity), Adapted |

#### Identities

| Term | Candidate definition | Grounding |
| --- | --- | --- |
| Accountable human | The human who owns responsibility for a task's outcome within this component; the identity a gate's satisfaction is ultimately answerable to | `quest-doc` execution graph, "human ownership"; component-level only — see Routing (AC4) |
| Delegated agent | An identity — typically automation — executing work under an accountable human's claim, without itself holding accountable ownership | `quest-doc` execution graph, "delegation"; component-level only — see Routing (AC4) |
| Reviewer | An identity whose recorded evidence satisfies a review gate; may or may not be the task's accountable human | `quest-doc` execution graph, "plan/review gates"; component-level only — see Routing (AC4) |
| Maintainer | An identity with elevated component-repository authority (e.g. merge, release) distinct from any single task's accountable human | Charter, "component release and rollback runbooks" (owns-here line 32); component-level only — see Routing (AC4) |
| Lore | A component-external knowledge system Quest CLI imports from and links to; never itself a Quest actor, holder of a claim, or gate satisfier | `quest-doc` execution graph, "Knowledge records... Lore" vs. "Execution records... Quest"; charter routing table |
| Git | The authoritative, operation-owned mutation surface for authored records; the medium of authoritative writes, not an actor with intent | Charter, "Sources of truth": "Git-tracked authored records are authoritative"; "safe filesystem and operation-owned Git behavior" |
| Derived local projection | A disposable, rebuildable, read-only view of authoritative state; never a source of truth, never itself authorized to satisfy a gate | Charter, "Sources of truth"; `quest-doc` execution graph, "Search, readiness, rollups, traversal, and cached effective state... Rebuildable local projection" |

#### Claims

| Term | Candidate definition | Grounding |
| --- | --- | --- |
| Claim record | The authored, Git-tracked assertion that a named actor holds a task's accountable execution rights, valid only while its lease is live | Reconciliation candidate #3, Adapted |
| Claim conflict | The state where two actors' claim records would overlap on the same task; a component invariant to prevent or detect, not a schema decided here | Charter, "dependency readiness, claims, leases, gates, lifecycle, and evidence"; concurrency mechanics are `QCLI-2.6`'s scope, not duplicated here |

#### Evidence

| Term | Candidate definition | Grounding |
| --- | --- | --- |
| Delivery evidence | See Execution entities, above | — |
| Gate evidence | The specific recorded artifact a gate's satisfaction cites (e.g. a review record, a completed criterion) — distinct from delivery evidence in that a task may pass several gates before final delivery | `quest-doc` execution graph, "evidence-backed completion" |
| Provenance record | An authored record of where a decision, claim, or requirement came from — the same discipline this document itself follows for its own citations | Research program, "Required outputs: each research task records exact sources, classifications, findings..." |

#### Workspaces

| Term | Candidate definition | Grounding |
| --- | --- | --- |
| Enrollment | The explicit, opt-in act of scoping a repository into Quest's tracked workspace set; absence of enrollment means absence of tracking, never implicit inclusion | Reconciliation candidate #2, Adapted; `quest-doc` execution graph, "explicit multi-repository enrollment and isolation" |
| Workspace scope | The boundary within which a claim, lease, gate, or projection is valid; a projection built for one workspace makes no claim about another | Charter, "Sources of truth," "explicitly workspace-scoped" |

#### Projections

| Term | Candidate definition | Grounding |
| --- | --- | --- |
| Freshness | A projection's own recorded currency relative to the authoritative Git state it was built from | Charter, "rebuildable local projection, freshness, recovery, and scale" |
| Staleness / drift | The detected divergence between a projection and current authoritative state, surfaced rather than silently tolerated | Charter, same line; `quest-doc` execution graph, "deterministic projection rebuild, corruption recovery, schema migration, freshness reporting, and source/projection disagreement handling" |
| Rebuild | The deterministic act of regenerating a projection from authoritative Git state alone, discarding the prior projection without loss of authoritative data | Charter, "rebuildable local projection"; reconciliation candidate #1, Adapted |

### Component actor responsibilities (AC2)

The table below maps each named actor to what it may authoritatively write,
what it relies on as a derived read, and what distinguishes its
responsibility — scoped, per "Scope and authorship boundary" above, to how
these roles act **within Quest CLI**, not as a cross-repository or
product-wide definition.

| Actor | May author (authoritative writes) | Relies on (derived reads) | Distinguishing responsibility | Cannot do |
| --- | --- | --- | --- | --- |
| Accountable human | Claims a task; satisfies or waives a gate assigned to them; records delivery evidence; delegates to an agent | Projection views of task/claim/lease/gate state for decision-making | Ultimately answerable for a task's outcome; the identity a human gate blocks on | Cannot be represented solely by a projection — accountability is never inferred, only authored |
| Delegated agent | Records progress events and delivery evidence under an accountable human's live claim | The same claim and lease state a human relies on, to know its authority is still live | Executes work; does not itself hold accountable ownership or satisfy a human gate on the accountable human's behalf | Cannot claim a task as its own accountable owner; cannot satisfy a gate reserved for human judgment |
| Reviewer | Records gate evidence (approval, rejection, or requested change) against a review gate | Delivery evidence and task history offered for review | Gatekeeper for a specific review gate; may be, but need not be, the task's accountable human | Cannot claim the task being reviewed as a precondition of reviewing it (no self-review requirement is asserted either way — component-level policy, not decided here) |
| Maintainer | Component-repository actions: release, rollback, and runbook-governed operations (charter line 32) | Projection and Git history the same as any actor, plus release/runbook state | Elevated component authority distinct from any single task's ownership | Cannot substitute maintainer authority for a task's own accountable-human or reviewer gate |
| Lore | Nothing inside Quest's authoritative records — Lore is a link/import target, not a writer here | N/A — Quest reads nothing *from* Lore as authoritative for its own execution state | Owns knowledge records (Stories, Specs, ADRs, References, rationale) in its own domain; Quest links to stable Lore concept IDs through a versioned public contract | Cannot write Quest's private storage; Quest cannot write Lore's, per the charter's "Neither product writes the other's private files or database" |
| Git | Every authoritative write Quest CLI makes, staged and committed only by its owning operation | N/A — Git is the medium, not a reader | The durable local authority and synchronization substrate underneath every other actor's writes | Is not itself an actor with intent; never a gate satisfier or claim holder |
| Derived local projection | Nothing authoritative — nothing a projection writes changes what is true | Authoritative Git state, exclusively | Fast, disposable, rebuildable view for search, readiness, and rollups | Cannot satisfy a gate, hold a claim, or be trusted over Git on disagreement — disagreement is surfaced, not silently resolved in the projection's favor |

### End-to-end CLI workflows (AC3)

Each workflow below names its authoritative writes, its derived reads, where
a human gate blocks progress, its failure-recovery path, and whether Lore
participation is optional or required. The task description itself frames
"optional Lore links" as a category, not a workflow-by-workflow open
question; each row states explicitly how that applies to it.

| Workflow | Authoritative writes | Derived reads | Human gate | Failure recovery | Lore: optional or required |
| --- | --- | --- | --- | --- | --- |
| Claim and deliver a task | Claim record (accountable human); progress events (accountable human or delegated agent); delivery evidence (whoever performs the work) | Projection of current task/claim/lease state, to confirm the task is claimable before claiming | Gate at delivery: the accountable human (or an assigned reviewer) confirms evidence satisfies the task before it closes | If the write conflicts with a concurrent claim, Quest surfaces the conflict rather than silently overwriting (mechanics are `QCLI-2.6`'s scope) | Optional — the workflow completes fully on Git-tracked records alone; no step requires a Lore round-trip |
| Lease expiry and reclamation | A reclamation event releasing the expired claim; a new claim record for the reclaiming actor | Projection surfacing which claims' leases have expired | No human gate required to reclaim an expired lease itself, but the original accountable human's prior partial evidence remains in event history for review | Recovery path: reclamation never rewrites the expired claim's history, only appends a new state; concurrent reclamation attempts are a `QCLI-2.6` concurrency question, not resolved here | Optional — reclamation is a Git/projection-only mechanism |
| Human review gate | Gate evidence record (the reviewer); gate-satisfaction event | Delivery evidence and task history the reviewer inspects | This workflow **is** the human gate — it blocks the task's lifecycle from advancing until the reviewer authors a satisfaction (or rejection) record | If a reviewer's identity or authority to gate is disputed, that is a claim-conflict-shaped recovery question, not decided here | Optional — a review gate is satisfied by an authored Quest record; a Lore link may enrich context but the gate does not depend on Lore being present |
| Projection rebuild after loss or corruption | None — rebuild reads Git history and writes only the projection, which is disposable by definition | The full authoritative Git-tracked event/claim/lease/gate history for the affected workspace(s) | No human gate on an ordinary rebuild; an operator may be asked to confirm scope for a very large or multi-workspace rebuild (a UX candidate, not fixed here) | This workflow **is** the failure-recovery path for a corrupted or lost projection; it must be deterministic and lossless against authoritative state, per the charter's "rebuildable local projection, freshness, recovery, and scale" | Optional — rebuild depends only on Quest's own Git-tracked records, never on Lore being reachable |
| Optional Lore link | A link record associating a Quest task (or its delivery evidence) with a stable Lore concept ID, through Lore's own versioned public contract | Lore's published concept identity, read (not authoritatively cached) at link time | No human gate is intrinsic to linking itself; a project may choose to gate delivery on a link existing, but that is a local policy choice, not a component invariant | If Lore is unreachable or the concept ID is stale, the link workflow fails loud and leaves the task's own authoritative state untouched — a missing link never blocks a Quest-only workflow from the table above | Required *for this workflow specifically* — it is Lore's own contract that makes it meaningful — but this workflow itself is optional to invoke, and no other row depends on it. `QCLI-2.7`'s evidence records that no generic Lore↔task-tracker adapter abstraction exists yet on Lore's side (`BacklogAdapter` is `lore-cli`'s only adapter type); the concrete shape of this link is therefore a **provisionally researchable** dependency, not settled by this document |
| Delegation handoff | A claim amendment or new claim record naming the delegated agent as executor under the accountable human's continuing ownership; progress events authored by the agent | Projection of the current claim, to confirm the accountable human's ownership is live before delegating | No gate on the handoff itself; the accountable human remains the party a later delivery or review gate is answerable to | If the accountable human's own claim lapses (lease expiry) while delegated work is in flight, that composes with the lease-expiry-and-reclamation workflow above, not a separate mechanism | Optional — delegation is expressed entirely in Quest's own claim record; Lore is not consulted to authorize a delegation |

### Routing to `quest-doc` (AC4)

Exactly one candidate crosses the charter's product-wide line, and it is
already named: `QCLI-2.2`'s reconciliation candidate #6, **accountable-human
delegation and actor responsibilities as a cross-repository, Quest-wide
model** — who counts as an accountable human, a delegated agent, a reviewer
or approver, and how those roles relate to a gate *as a decision that would
bind `quest-doc`, `quest-web`, or a future Opum component, not only
`quest-cli`*. This document does not settle that. The actor table in AC2,
above, is quest-cli's own component-level answer for its own command
surface; it corroborates rather than resolves candidate #6, and stays
non-normative outside this component until a proposal is authored into
`quest-doc`'s own repository (this document has no mutation rights there and
claims none).

No other glossary term, actor row, or workflow above proposes a change to
Quest-wide vocabulary, cross-repository architecture, or roadmap:

- The base vocabulary (task, event, workspace, claim, lease, gate, delivery
  evidence, human ownership, delegation) is not newly proposed here — it is
  already adopted Quest-wide in `quest-doc`'s own
  [execution graph](https://github.com/salient-data/quest-doc/blob/dev/docs/specs/quest-clean-room-execution-graph.md),
  cited throughout the glossary above; this document gives it component-scoped
  definitions, not a new product-wide meaning.
- The "Lore" and "Git" rows in the actor table describe how quest-cli's own
  component treats those systems, consistent with the charter's routing table
  and `quest-doc`'s own knowledge-vs-execution split; neither row asserts a
  new cross-repository responsibility for Lore or for Git.
- The "optional Lore link" workflow's dependency classification
  (provisionally researchable) is drawn directly from `QCLI-2.7`'s
  already-recorded evidence and is not a new finding this document
  introduces.

If a later task pursues the product-wide actor model, the proposal belongs in
`quest-doc`'s own repository, informed by — but not copied from — the
component-level mapping in this document.

### Recheck clause for the `quest-doc` citation

This document's negative claim in "Scope and authorship boundary" — that
`quest-doc`'s own repository holds no actor-model glossary — and its
grounding of the base vocabulary (task, event, workspace, claim, lease, gate,
delivery evidence, human ownership, delegation) in `quest-doc`'s execution
graph both depend on the moving `quest-doc` state observed 2026-08-04 at
commit `7d4d60c2854a533bbba63e6b69320587b8f88e83`. A later worker relying on
either claim must re-run, against a live `quest-doc` clone:

```
git -C <quest-doc-clone> log -1 --format='%H %ci' -- docs/specs/quest-clean-room-execution-graph.md
git -C <quest-doc-clone> log -1 --format='%H %ci' -- docs/reference/quest-repository-and-authority-map.md
git -C <quest-doc-clone> log -1 --format='%H' -- docs/
```

If either of the first two commands reports a commit other than
`7d4d60c2854a533bbba63e6b69320587b8f88e83` for its file, or the third
command's overall `docs/` HEAD has advanced past that commit, that is a new
fact — not grounds to keep relying on this document's 2026-08-04 observation.
A worker who finds a changed result must re-read both files live and confirm
(a) the base vocabulary this glossary builds on still matches what
`quest-doc`'s execution graph adopts, and (b) no actor-model glossary has
since been added to `quest-doc`'s own repository. A changed result on either
point obligates a correction to this document; it does not by itself
authorize a worker to rewrite `quest-doc`'s own content, and it does not
authorize silently continuing to cite the 2026-08-04 observation as current.

## Notes

This task read the component charter, `QCLI-2.2`'s legacy requirement
reconciliation, `QCLI-2.7`'s Lore dependency and adapter contract evidence,
the research source register, the former OCLI-to-QCLI migration ledger, the
research program Spec, and the Story — all in this repository — plus, in the
local `/Volumes/external/repos/quest-doc` clone (Allowed per the source
register's "quest-doc canonical product records" slice), the Quest
clean-room execution graph Spec and the repository-and-authority-map
Reference, both re-read live 2026-08-04 against a clean tree at commit
`7d4d60c2854a533bbba63e6b69320587b8f88e83` (observed 2026-08-04; moving
reference, re-verify before relying — see "Recheck clause for the
`quest-doc` citation," above). It opened no Backlog.md
implementation source or internal tests, no legacy Opum implementation
source, no artifact classified Quarantined by the source register, and no
`lore-cli` Backlog.md-corpus document. It did not edit the source register
(owned this wave by `QCLI-2.11`), the pre-implementation research program
Spec (owned this wave by `QCLI-2.13`), or any sibling task's output document.
It made no repository, package, release, or remote mutation in `quest-doc` or
any other external clone.
