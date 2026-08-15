---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Bound claims with leases evaluated against the evaluator's own clock
tags:
  - quest
  - cli
  - lifecycle
  - claims
  - leases
summary: A claim is valid only while a TTL lease is live, expiry is computed from authored history plus the evaluator's local clock, and reclamation appends.
timestamp: 2026-08-05T11:44:34.771Z
---

# Bound claims with leases evaluated against the evaluator's own clock

## Status

Accepted. This record promotes a decision the research campaign already settled; it
does not make a new one.

Settled by `QCLI-2.6` and `QCLI-2.4`, recorded in the
[Git, filesystem, and concurrency threat model](../reference/quest-cli-git-filesystem-and-concurrency-threat-model.md)
under "Clocks and leases" and "Races", and as contract 2 of the
[component contracts and delivery graph](../reference/quest-cli-component-contracts-and-delivery-graph.md).

## Context

Work is claimed by humans and by delegated agents. Both abandon work: a person walks
away, a process is killed, a laptop dies, a container is reaped. If a claim never expires,
one abandoned claim blocks a task permanently and the only remedy is manual
intervention — which, in a repository users can edit directly, means someone hand-editing
a record to steal a claim.

A lease is the standard answer, and it usually depends on a shared clock. Quest has none.
It coordinates through Git alone, with no daemon and no moment when global state is
knowable, so "ask the server whether this lease is live" is not available. Worse, clock
skew between clones is not hypothetical: the threat model injects it deliberately in
scenario `TM-05`.

That leaves a real design tension. Expiry must be decidable by whoever is asking, right
now, from what they can see — and yet two honest participants asking at the same moment
must not disagree about whether a lease is live, or the system has two truths.

A second, subtler failure the research isolated: a heartbeat arriving late. A process
stalls, its lease expires, another holder claims the task, and *then* the stalled
process's renewal lands. If renewal is scoped only to the task, that late message extends
a lease the sender no longer holds — silently transferring the task back to a holder that
has already lost it.

## Decision

**A claim is an authored record valid only while a TTL lease is live. Expiry is computed
from authored history plus the evaluating actor's own local clock, and nothing else.**

- **Two honest evaluators must agree.** Any two evaluators computing expiry for the same
  history at materially the same wall-clock moment must reach the same held-or-expired
  status. A detected disagreement is surfaced as a **named anomaly**, never silently
  resolved in either direction — an unexplained disagreement is information, and
  discarding it to produce a clean answer is the failure.
- **Renewal is scoped to the exact lease generation it was issued against.** A late or
  stale heartbeat can never extend a different, newer holder's lease (`BB-02`).
- **Two concurrent claims resolve to exactly one winner** — never both succeeding, never
  both failing (`BB-15`), by the compare-and-swap in
  [Coordinate through Git compare-and-swap without a central arbiter](coordinate-through-git-compare-and-swap-without-a-central-arbiter.md).
- **Exactly one lease exists per canonical task, system-wide** — not one per identifier
  form. An alias cannot claim a task already claimed under its canonical identifier
  (`BB-14`).
- **Reclamation appends.** Taking over an expired lease writes a new claim event; it never
  rewrites the expired claim's own history. The record of who held it and how it ended
  survives.
- **A gate blocks until its condition is recorded as satisfied with evidence**, and
  self-supplied approval evidence never satisfies a gate that requires separation
  (`BB-03`, `BB-04`).

Deliberately **not** decided here: concrete lease and heartbeat timing parameters and the
specific lifecycle-stage enum. Timing remains configurable rather than acquiring an
implicit default. Gate-approval actor eligibility is now closed by D6's accepted ODOC-57
local actor/delegation vocabulary: delegated agents may submit work and evidence but not
satisfy human-judgement or separation-of-duty gates.

## Consequences

- **The clock is a dependency, so it must be substitutable.** Testing `TM-05` requires
  injecting skew, which is impossible if the implementation reads the system clock
  directly. This is why the architecture names a clock port.
- **Expiry is computed, never stored.** No "expired" flag is written by a background
  process, because there is no background process and no writer guaranteed to run.
- **Lease duration is a real trade-off left open**: too short and legitimate long work is
  reclaimed underneath its holder; too long and abandoned work blocks for that duration.
  Phase 1 or 2 must choose, and the choice is a product judgement, not a technical one.
- **Anomaly reporting needs a home in the command surface.** "These two evaluators
  disagree" is neither success nor error, and must be expressible.
- **Claim history is append-only and therefore grows.** How, or whether, it is ever
  compacted is part of the open archival question D7a.
