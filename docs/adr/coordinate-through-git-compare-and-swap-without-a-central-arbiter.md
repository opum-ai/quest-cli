---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Coordinate through Git compare-and-swap without a central arbiter
tags:
  - quest
  - cli
  - concurrency
  - git
  - coordination
summary: Quest derives every ordering guarantee from Git's own atomic ref update, and introduces no lock server, broker, or coordinating daemon.
timestamp: 2026-08-05T11:44:34.632Z
---

# Coordinate through Git compare-and-swap without a central arbiter

## Status

Accepted. This record promotes a decision the research campaign already settled; it
does not make a new one.

Settled by `QCLI-2.6`, recorded in the
[Git, filesystem, and concurrency threat model](../reference/quest-cli-git-filesystem-and-concurrency-threat-model.md)
under "Topology and trust model", and carried into contracts 2 and 4 of the
[component contracts and delivery graph](../reference/quest-cli-component-contracts-and-delivery-graph.md).

## Context

Quest is local-first and multi-writer by nature. The realistic topology is several
worktrees and several clones of the same repository, operated by humans and delegated
agents, sometimes concurrently, sometimes offline, with no guarantee that any two of them
can see each other at the moment they act.

Every coordination primitive a server-based system would reach for is unavailable in that
topology, or available only by adding infrastructure that contradicts local-first
operation. There is no shared filesystem to lock against, no daemon that all clones can
reach, no clock they share, and no moment at which "the current state" is globally
knowable.

Git, however, already solves exactly one piece of this, and solves it well: updating a
ref is atomic and conditional. A push either fast-forwards from the basis the writer
expected or it is rejected. That is a compare-and-swap, and it is the only synchronisation
primitive present in every deployment Quest targets, by construction, because Quest's
records live in Git in the first place.

The threat model's races, divergence, and stale-basis threats all reduce to the same
question — what happens when two writers act on the same basis — and Git already has an
answer that no participant can bypass.

## Decision

**Every ordering guarantee comes from Git's own atomic, conditional ref update. Quest
introduces no lock server, broker, coordinating daemon, or shared mutable state outside
the repository.**

Concretely:

- **Contention is resolved by losing the compare-and-swap**, not by acquiring a lock
  beforehand. Two concurrent claims on the same task resolve to exactly one winner
  (`BB-15`, `TM-03`), and the loser learns it lost from the rejected update.
- **A losing write is reported as a structured conflict.** It is never silently retried,
  never force-applied, and never resolved by discarding committed history.
- **Lore is bounded entirely out of the authoritative-write surface.** It participates in
  no ordering decision, holds no lock, and writes nothing inside Quest's authoritative
  records.
- **Git is not an actor.** It is a substrate with useful atomicity, not a participant with
  intent; nothing may be attributed to it as a decision-maker.

Deliberately **not** decided here: the locking primitive used for purely local,
within-clone serialisation, and the merge or rebase strategy applied to authored records.
Both remain open in the
[open component decisions register](../reference/quest-cli-open-component-decisions.md).

## Consequences

- **Offline operation works without special handling**, because there is nothing to be
  offline *from*. A writer acts locally and discovers contention when it synchronises.
- **Conflicts are a normal, user-visible outcome**, not an internal error. The CLI surface
  must therefore have a first-class way to express "declined, someone else won" that is
  distinct from "failed" — see
  [Emit three categorical command outcomes over a versioned envelope](emit-three-categorical-command-outcomes-over-a-versioned-envelope.md).
- **There is no global "now" and no global view.** Anything requiring one is not
  implementable under this decision, and lease expiry is designed around its absence —
  see [Bound claims with leases evaluated against the evaluator's own clock](bound-claims-with-leases-evaluated-against-the-evaluator-s-own-clock.md).
- **Correctness is testable against real clones rather than mocks.** Scenarios `TM-03`
  (two real clones racing a claim) and `TM-04` (stale-basis write after an unnoticed
  remote advance) exercise the actual primitive, not a simulation of it.
- **The ceiling is Git's own throughput.** A workload that would need finer-grained
  concurrency than one ref update at a time is out of scope for this design, and that
  trade is accepted in exchange for needing no infrastructure at all.
