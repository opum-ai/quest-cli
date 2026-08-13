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
2. Dependency edges, blocker events, and their current meanings come only from authored
   task records. A projection may accelerate evaluation but may not repair or override
   them.
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

The named edge-validation failures are structured **errors** under the accepted result
contract and therefore exit `2`. Rejecting rather than normalising malformed authored
data makes a writer, a full rebuild, and a cold reader produce the same answer.

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
evaluators report the same evidence. It uses outcome `error` and exit `2`, the result
contract's established code for invalid or corrupt authored state. It MUST NOT be reported
as a decline, anomaly, warning, final layer, or partially usable result.

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
| Lease disagreement or invalid claim history | The request returns the established anomaly outcome and exit `3`; it does not guess readiness. |

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
| Blocker opened | A record-local stable `block_id`, non-empty human-readable `reason`, author identity, authored time, and optional evidence links. The id is unique within that task record. |
| Blocker cleared | The same `block_id`, clearing author, authored time, and evidence or explanation showing why the reason no longer applies. It must reference one open blocker and may occur once. |

At revision `R`, a blocker is active exactly when its opened event is present and no valid
cleared event for that `block_id` is present later in the same authored history. A task is
explicitly blocked when its active-blocker set is non-empty. Opening a duplicate id,
clearing an unknown id, or clearing an already-cleared blocker is invalid authored history
and returns a named error on exit `2`; it is never repaired in a projection.

`block_id` is local correlation within one canonical task, not another task identity and
not a second global namespace. The blocker events stay in that task's one Git-tracked
file. Clearing a blocker appends evidence; it never deletes or rewrites why the task was
blocked. Reopening the same real-world concern after it cleared uses a new `block_id`, so
each interval remains auditable.

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
| When no zero-indegree node remains, emits every remaining task as a deterministic final layer | [`sequences.ts` lines 67–76](https://github.com/jeremy-newhouse/Backlog.md/blob/a80b7a16e2ba78db89565703f520e519d70731f7/src/core/sequences.ts#L67-L76) | Return `dependency_cycle`, outcome `error`, exit `2`, with no ready tasks. |

The divergence is deliberate: Backlog.md promises that every supplied task appears once
for presentation, while Quest must ensure that no malformed or currently unavailable task
is silently presented to an autonomous scheduler as executable.

The repository's
[backlog-handover wave loop](../../.claude/skills/backlog-handover/reference/wave-loop.md)
is also an input, but it coordinates a human-visible Backlog campaign rather than defining
Quest's product API. Its current policy halts and labels cycle members while continuing
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
  cycle all producing one fail-closed `dependency_cycle` result on exit `2`;
- an isolated unclaimed task appearing in the ready set;
- each ready-predicate clause independently excluding a task;
- live, expired/reclaimable, and anomalous lease evaluation with an injected clock;
- blocker open, clear, duplicate-open, unknown-clear, and repeat-clear histories; and
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
