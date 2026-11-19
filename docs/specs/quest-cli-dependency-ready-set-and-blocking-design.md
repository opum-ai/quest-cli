---
# yaml-language-server: $schema=../../.lore/schemas/spec.schema.json
type: Spec
title: Quest CLI dependency, ready-set, and blocking design
tags:
  - quest
  - cli
  - dependencies
  - scheduling
  - ready-set
  - blocking
summary: Normative dependency-edge, claimable ready-set, cycle, and authored blocking semantics for Quest task scheduling.
timestamp: 2026-08-13T04:51:59.449Z
---

# Quest CLI dependency, ready-set, and blocking design

## Summary

Quest needs two related answers that are easy to collapse into one unsafe operation:

- the **dependency graph** answers which task must complete before another task may start;
- the **claimable ready set** answers which tasks an actor may try to claim at one authored
  Git revision and one evaluation instant.

They are not interchangeable. Topological position is structural; readiness also depends
on current lifecycle completion, authored blockers, and evaluated claim/lease state. This
Spec, directed by `QCLI-62`, defines both and makes malformed graphs fail closed. It is
grounded in the [functional requirements](quest-cli-functional-requirements.md), the
[architecture](quest-cli-architecture.md), the accepted
[identifier and authored-record layout](../adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md),
the accepted [lease model](../adr/bound-claims-with-leases-evaluated-against-the-evaluator-s-own-clock.md),
and the accepted [result contract](../adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md).

The design introduces no graph database, sidecar file, or second authority. Dependency
references and blocker events live in each task's one Git-tracked authored record. A ready
set, reverse-edge index, and strongly connected components are disposable projections
computed from those records.

## Requirements

### Normative vocabulary

The key words **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are normative.

- **Dependency**: a prerequisite task whose dependency-completion predicate must be true
  before its dependent can be ready.
- **Dependent**: a task that names one or more dependencies.
- **Dependency-complete**: the lifecycle module's single, explicit predicate indicating
  that a task has reached the dependency-satisfying terminal state. The full lifecycle
  enum remains outside this Spec; a scheduler MUST call this predicate and MUST NOT infer
  completion from a title, file location, free-text status, or projection.
- **Explicit blocker**: an authored, non-dependency reason that temporarily prevents a
  task from being ready.
- **Claimable ready set**: tasks that satisfy the predicate below and may therefore enter
  the compare-and-swap claim operation. Listing a task as ready grants no authority and
  reserves nothing.
- **Evaluation scope**: every canonical task record in one explicitly enrolled workspace
  at one authoritative Git revision.

### Invariants

1. Every dependency endpoint resolves to exactly one canonical `T-<sequence>` task in the
   same evaluation scope before graph evaluation begins.
2. Dependency edges and blocker events come only from authored task records. A blocker
   whose `block_id` is a question id additionally derives its current meaning from that
   question's authored record, read at the same revision: the block is active only while
   the question is `open` (see
   [Question-named blockers](#question-named-blockers-qcli-448)). Readiness therefore
   reads two authored stores -- the task records, and the question store when a blocker
   names a question -- and no projection may repair or override either. The derivation is
   a read; it is never a second task write.
3. Graph validation and cycle detection complete before any ready task is returned. A
   malformed graph produces no partial ready set.
4. Readiness is evaluated at a named Git revision and with an injected clock instant,
   matching the architecture's pure domain and clock-port boundary.
5. Ready-set enumeration is read-only. A later claim can still lose its Git
   compare-and-swap and return a structured conflict under `FR-GIT-3`.

## Design

### Dependency edge semantics

Each task record owns a `dependencies` collection containing canonical task identifiers.
If task `T-9` names `T-4`, the stored reference reads "`T-9` depends on `T-4`" and the
directed graph edge is:

```text
T-4 (dependency)  ──>  T-9 (dependent)
```

The direction matters: completion information flows from `T-4` to `T-9`; blocking does
not flow backwards. A dependent never makes its dependency unready merely by naming it.

An edge is valid only when all of these checks pass against the same authoritative
revision:

| Check | Required behavior |
| --- | --- |
| Canonical form | Resolve aliases first, then store and compare the fixed-case canonical `T-*` id. An alias MUST NOT remain in `dependencies`. |
| Existing endpoints | Both records exist exactly once in the enrolled workspace. A missing or ambiguous endpoint is `dependency_target_not_found` or `dependency_target_ambiguous`, not an unsatisfied edge. |
| No self-edge | After canonical resolution, dependency and dependent differ. `T-9 -> T-9` is `dependency_self_edge`. |
| No duplicate | A dependent names a canonical dependency at most once. Raw entries that resolve to the same canonical id are `dependency_duplicate_edge`; readers MUST NOT silently deduplicate them. |
| Scope | Cross-workspace edges are invalid in this first design. A record cannot acquire an implicit workspace by being referenced. |
| Acyclic whole graph | After the checks above, the evaluation-scope graph contains no directed cycle. |

The named edge-validation failures are structured `validation` diagnostics under the
accepted result contract and therefore exit `6`. Rejecting rather than normalising
malformed authored data makes a writer, a full rebuild, and a cold reader produce the
same answer.

The `dependencies` collection is co-located with the task's aliases, lifecycle events,
claims, and gates in the one record whose filename is anchored on its canonical id. It
does not change the accepted authored layout and does not create an independent edge
record format. A reverse index from dependency to dependents is derived and disposable.

### Validation and cycle policy

Evaluation proceeds in this order:

```text
1. enumerate every task record in the enrolled workspace at revision R
2. resolve and validate canonical task identities
3. validate every dependency entry and construct dependency -> dependent edges
4. compute strongly connected components over the complete graph
5. if any cyclic component exists, return dependency_cycle and no ready set
6. otherwise evaluate the ready predicate for every task at (R, now)
7. return ready tasks sorted by canonical task id
```

A component with more than one member is cyclic. A self-edge has already failed at step
3, so it cannot reach step 4. The error payload MUST name `dependency_cycle` and include
all cyclic components, with member ids and components sorted by canonical task id so two
evaluators report the same evidence. It uses `error_type: "validation"` and exit `6`, the
result contract's shared code for invalid authored state. It MUST NOT be reported as a
domain decline, anomaly, warning, final layer, or partially usable result.

Cycle handling is fail-closed for the entire evaluation scope. Even tasks outside the
cycle are not returned from that ready-set request: returning them would make behavior
depend on whether a caller noticed and excluded the malformed component. A caller may fix
the authored records and evaluate a new revision; it may not ask the scheduler to treat a
cyclic remainder as executable.

### Claim and lease evaluation

For each otherwise eligible task, the domain evaluates claim state from authored history
at revision `R` and supplied instant `now`:

| Claim state | Ready implication |
| --- | --- |
| No claim | Passes the claim/lease clause. |
| Live lease | Not ready; another live claim holds execution rights. |
| Expired lease | Passes as **reclaimable**. The later claim operation must append the required reclamation and new-claim events atomically; enumeration itself writes nothing. |
| Lease disagreement or invalid claim history | The request returns a structured `drift` diagnostic on exit `6`; it does not guess readiness. |

This preserves the accepted lease ADR: expiry is computed from authored history and an
injected instant, never stored as an `expired` flag; reclamation appends; and exactly one
lease exists per canonical task after alias resolution. A ready-set result is a
point-in-time observation, not a lease. Every consumer must still run the conditional
claim operation and handle a lost race as a decline/conflict.

### Explicit blocking model

Dependency waiting and explicit blocking are distinct:

- an incomplete dependency makes the ready predicate false without authoring a blocker;
- an explicit blocker exists only because an actor authored a blocker-opened event.

Each blocker is represented inside the task's sole authored record by append-only logical
events. The names below define required semantics; the later general event-schema task may
choose wire spelling but may not remove these fields or meanings.

| Event | Required data and validity |
| --- | --- |
| Blocker opened | A record-local stable `block_id`, non-empty human-readable `reason`, author identity, authored time, and optional evidence links. The id is unique among that task's ACTIVE intervals. |
| Blocker cleared | The same `block_id`, clearing author, authored time, and evidence or explanation showing why the reason no longer applies. It must reference one open interval, and a later open of the same `block_id` starts a new interval. |

At revision `R`, an ORDINARY blocker (one whose `block_id` is not a question id) is active
exactly when its opened event is present and no valid cleared event for that `block_id` is
present later in the same authored history. A QUESTION-named blocker is additionally gated
by its question record at the same revision: it is active only while that question is
`open`; an `answered` or `withdrawn` question makes it inactive even though no cleared
event exists; and a `Q-N` id with no question record at that revision fails CLOSED and stays
active, because a reference that cannot be resolved is not a resolution. A task is
explicitly blocked when its active-blocker set is non-empty. Opening a duplicate id,
clearing an unknown id, or clearing an already-cleared blocker is invalid authored history
and returns a named `validation` diagnostic on exit `6`; it is never repaired in a projection.
Duplicate and already-cleared are evaluated against the ACTIVE interval only, so an `opened`
event that follows a `cleared` event for the same id opens a new interval and is valid.

`block_id` is local correlation within one canonical task. It is not a task identity and is
not a second global namespace, but it is not opaque either: an id matching the question
grammar (`^Q-[1-9][0-9]*$`) refers into the question store and carries the derived semantics
above. Any other non-empty string is an ordinary correlation id with no second-record
meaning. A question-shaped `block_id` is therefore a reference into an existing authored
namespace, not the declaration of a new one, and the blocker events themselves stay in that
task's one Git-tracked file. Clearing a blocker appends evidence; it never deletes or
rewrites why the task was blocked.

Reopening the same real-world concern after it cleared uses a new `block_id`, so each
interval remains auditable. A question-named blocker is the deliberate exception, because
its id IS the question reference rather than an interval label: blocking again on the same
question reuses the same `Q-N`, and the append-only history separates the intervals by
event order (`opened`, `cleared`, `opened`) under one id. The event-history rules therefore
key on the active interval, not on whether an id has ever appeared, and re-blocking a
question that a task cleared early is valid authored history. `quest task block` and
`quest task unblock` reach this shape for the first time under QCLI-448.

### Question-named blockers (QCLI-448)

A task may name a question id as its blocker instead of an ordinary correlation id. The
task record stores the reference exactly as any other blocker event; the block is cleared
by DERIVATION, not by a second task write. At revision `R`:

- `quest task block <task> --question Q-N --reason <text>` appends an `opened` event whose
  `block_id` is `Q-N`. The id MUST match the question grammar; a value that does not is a
  `validation` failure on exit `6`. The named question MUST exist at `R` (`question_not_found`,
  exit `3`) and MUST be `open` (`question_not_open`, exit `6`). Opening a second block for a
  question already active on that task is `blocker_duplicate_open` on exit `6`.
- `quest task unblock <task> --question Q-N --reason <text>` appends a `cleared` event for
  the active `Q-N` interval. It is the EARLY clear only: answering or withdrawing the
  question clears every task naming it with no task command at all. Clearing a question the
  task is not currently blocked on, including a second clear of an already-cleared interval,
  is `blocker_unknown_or_repeat_clear` on exit `6`.
- `quest task list --ready` OMITS a task whose only active blockers are open questions, and
  lists it again once the question is `answered` or `withdrawn`. No per-task exclusion line
  appears in that listing's output; the task simply does not appear.
- Both commands accept the same optional `--if-revision` per-record precondition `task edit`
  takes. A stale value is an exit `5` conflict carrying the sent and actual revisions, and
  it writes nothing, so a guarded block or unblock has no unguarded window.

The same rules govern every readiness consumer, including one that reads the task store
directly rather than through `quest task list`: when a question-status index is supplied, a
`Q-N` blocker is filtered by the question's status, and a `Q-N` absent from that index
fails closed. A caller with no question store keeps the authored open/cleared history alone,
which is the behavior before question blockers existed.

This design was ruled by `opum-doc`, and the ruling is recorded verbatim:

> QCLI-448: not sequenced behind QCLI-447 and needs no write-path decision. A question
> blocker is derived at read time (blocked while the named question is open), so resolving
> the question clears it with no second write. Measure the blockers field first, as AC2
> says; report a gap to opum-doc rather than designing around it.

Source: `opum-doc` `ODOC-480` on `origin/dev`, commit
`f6390ed883dd551c596a3828a45f08ef37076a2f` (2026-11-18T23:54:20Z), note "GROOMING
2026-11-18, second routing batch". The operator-questions design this implements is
`opum-doc` `docs/reference/operator-questions-in-quest-design.md` at `opum-doc` **dev**
(`f6390ed8`, blob `9f8403c8e836a9af567abec7152123a22abf2240`), step 7; it is not the
`main` revision.

### Claimable ready-set predicate

For a validated acyclic graph at revision `R` and instant `now`, task `t` is in the
claimable ready set exactly when:

```text
ready(t, R, now) :=
    lifecycleEligibleToClaim(t, R)
    AND every d in dependencies(t, R) satisfies dependencyComplete(d, R)
    AND activeBlockers(t, R) is empty
    AND claimState(t, R, now) is either unclaimed or expired/reclaimable
```

This is a conjunction, not a priority order. Failure of any ordinary clause excludes the
task and SHOULD be exposed as structured readiness reasons such as
`lifecycle_ineligible`, `dependency_incomplete`, `explicitly_blocked`, or
`live_claim`. Invalid authored state, a dependency cycle, or lease anomaly aborts the
request according to the policies above instead of appearing as another false clause.

The lifecycle module remains the owner of the full stage enum and of which one terminal
state satisfies `dependencyComplete`; this Spec binds the scheduler to those explicit
predicates so it cannot substitute string matching. Gates remain lifecycle constraints:
if a pending gate makes `lifecycleEligibleToClaim` false, readiness is false without
inventing a duplicate explicit blocker.

### Isolated tasks and topological layers

An isolated task has no dependencies and no dependents. Its universal dependency clause
is vacuously true, so it is ready whenever the lifecycle, explicit-blocker, and claim/lease
clauses pass. It MUST be evaluated and MUST NOT be placed in an `unsequenced` bucket or
dropped because it has no graph edges.

Topological layers remain useful for explanation and planning, but they are not ready
sets:

- layer membership depends only on graph shape;
- readiness depends on live authored state at `(R, now)`;
- a layer-one task with a live lease or explicit blocker is not ready;
- a later-layer task whose dependencies are already complete can be ready now; and
- an isolated task is both a valid zero-indegree graph member and a readiness candidate.

Any UI that shows layers MUST label them as topology and compute claimable readiness
separately. An autonomous scheduler consumes only the ready-set result.

### Deliberate delta from Backlog.md

The reference inspected for `QCLI-62` is Backlog.md's MIT-licensed
[`computeSequences()` at commit `a80b7a16`](https://github.com/jeremy-newhouse/Backlog.md/blob/a80b7a16e2ba78db89565703f520e519d70731f7/src/core/sequences.ts#L12-L90).
It is a useful layering implementation, not a safe autonomous scheduling contract.

| Backlog.md behavior | Source | Quest rule |
| --- | --- | --- |
| Builds layers from the supplied tasks and ignores dependencies whose targets are outside that set | [`sequences.ts` lines 19–33](https://github.com/jeremy-newhouse/Backlog.md/blob/a80b7a16e2ba78db89565703f520e519d70731f7/src/core/sequences.ts#L19-L33) | Evaluate the complete enrolled workspace; a missing target is a named error. |
| Separates edge-free tasks without an ordinal into `unsequenced` and excludes them from layering | [`sequences.ts` lines 35–44](https://github.com/jeremy-newhouse/Backlog.md/blob/a80b7a16e2ba78db89565703f520e519d70731f7/src/core/sequences.ts#L35-L44) | Evaluate isolated tasks normally; the dependency clause is vacuously true. |
| Uses indegree alone; task lifecycle, blockers, claims, and leases are not inputs | [`sequences.ts` lines 46–65](https://github.com/jeremy-newhouse/Backlog.md/blob/a80b7a16e2ba78db89565703f520e519d70731f7/src/core/sequences.ts#L46-L65) | Apply the explicit point-in-time ready predicate after graph validation. |
| When no zero-indegree node remains, emits every remaining task as a deterministic final layer | [`sequences.ts` lines 67–76](https://github.com/jeremy-newhouse/Backlog.md/blob/a80b7a16e2ba78db89565703f520e519d70731f7/src/core/sequences.ts#L67-L76) | Return a `validation` diagnostic naming `dependency_cycle`, exit `6`, with no ready tasks. |

The divergence is deliberate: Backlog.md promises that every supplied task appears once
for presentation, while Quest must ensure that no malformed or currently unavailable task
is silently presented to an autonomous scheduler as executable.

The repository's backlog-handover wave loop — the canonical user-level `backlog-handover`
skill's `reference/wave-loop.md` (moved out of this repository to
`/Users/jdnewhouse/.agents/skills/backlog-handover/`, commit `c802cb1`) — is also an
input, but it coordinates a human-visible Backlog campaign rather than defining Quest's
product API. Its current policy halts and labels cycle members while continuing
over the acyclic campaign remainder, and its ready test combines `To Do`, `Done`
dependencies, labels, and file conflicts. That is a deliberate orchestration policy over a
curated queue. It does not weaken this Spec: while that coordinator operates directly on
Backlog records, it may keep its own documented policy, but it MUST NOT present the reduced
result as Quest's workspace ready set. Any future coordinator consuming Quest's evaluator
must surface the named error and stop scheduling from that result until the malformed
authored graph is corrected.

### Implementation obligations

An implementation is conformant only if focused tests cover at least:

- edge direction and incomplete-versus-complete dependency behavior;
- alias canonicalisation before self-edge and duplicate-edge checks;
- missing, ambiguous, self, duplicate, and cross-workspace targets;
- a two-node cycle, a longer cycle, multiple disjoint cycles, and an acyclic task outside a
  cycle all producing one fail-closed `validation` diagnostic naming
  `dependency_cycle` on exit `6`;
- an isolated unclaimed task appearing in the ready set;
- each ready-predicate clause independently excluding a task;
- live, expired/reclaimable, and anomalous lease evaluation with an injected clock;
- blocker open, clear, duplicate-open, unknown-clear, and repeat-clear histories;
- a question-named blocker: open, derived clear on answer, derived clear on withdraw,
  early `task unblock`, repeat clear, re-block on the same question id, a dangling
  question id failing closed, and a block refused on a question that is not open; and
- projection rebuild producing the same ordered result as a cold authoritative read.

## Open questions

This Spec intentionally leaves these decisions with their existing owners:

- the full lifecycle-stage enum and the wire representation of its events;
- the general event envelope and serialization beyond the blocker semantics required here;
- concrete lease and heartbeat durations;
- command names, flags, and whether topology gets a dedicated user-facing command; and
- projection storage/index technology.

None prevents the dependency validator or ready predicate from being implemented as pure
domain functions. Their inputs and fail-closed outcomes are fixed here; the deferred items
choose surrounding representation or policy, not different scheduling semantics.
