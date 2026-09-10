---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Treat Git-tracked authored records as the sole authority
tags:
  - quest
  - cli
  - storage
  - authority
  - projection
summary: Authored records in Git are authoritative; every projection is derived, disposable, and deterministically rebuildable from Git alone.
timestamp: 2026-08-05T11:44:34.563Z
---

# Treat Git-tracked authored records as the sole authority

## Status

Accepted. This record promotes a decision the research campaign already settled; it
does not make a new one.

Settled by `QCLI-2.6` and `QCLI-2.8`, recorded in the
[component charter](../reference/quest-cli-component-charter.md) under "Sources of
truth", the
[Git, filesystem, and concurrency threat model](../reference/quest-cli-git-filesystem-and-concurrency-threat-model.md)
under "Repository removal", and the
[component contracts and delivery graph](../reference/quest-cli-component-contracts-and-delivery-graph.md)
contract 6.

## Context

Quest records execution state — tasks, dependencies, claims, leases, gates, lifecycle
events, delivery evidence. Answering the questions users actually ask of that state
("what is ready?", "what is blocked?", "who holds this?") requires traversal and rollup
that reading raw files cannot serve at interactive speed. Something derived is therefore
unavoidable.

The failure mode this decision exists to prevent is the one that makes derived state
dangerous: a cache that is *sometimes* authoritative. Once any answer can only be
obtained from the index, the index becomes a second system of record, and every
divergence between it and the files becomes a data-loss question rather than a
refresh question.

The threat model makes the stakes concrete. A projection can be corrupted, truncated
mid-write, built from a stale basis, or destroyed with its clone. Under every one of
those faults the authored records survive in Git, because Git is what synchronises,
merges, and preserves history across worktrees and clones. The research also found the
converse hazard in the field: an existing tool's derived milestone-completion figure has
no stored counterpart, so a migration that expected to copy it would find nothing to copy.

## Decision

**Git-tracked authored records are the sole authority. Every graph, index, or cache is
derived, disposable, deterministically rebuildable from Git alone, and explicitly scoped
to enrolled workspaces.**

Three consequences of that are themselves normative:

1. **The projection is never trusted over Git.** On any disagreement between authored
   records and the projection, the authored records win and the disagreement is reported,
   not silently reconciled.
2. **A projection can never satisfy a gate, hold a claim, or answer a question
   authoritatively.** It accelerates reads; it confers no authority.
3. **Durability is three-tiered, and the tiers are not interchangeable** —
   (i) synchronized authoritative history, (ii) local-only unsynchronized commits, and
   (iii) the disposable projection. Quest must not report durable success on the strength
   of tier (ii) alone: a commit that exists only in one clone is not yet durable, and
   saying otherwise is the specific lie that loses a user's work when that clone dies.

Deliberately **not** decided here: the storage or index engine, the on-disk record
layout, and the scale target the projection is sized for. Those remain open in the
[open component decisions register](../reference/quest-cli-open-component-decisions.md)
as D5, D7a, and the projection contract's own open items.

## Consequences

- **Rebuild is a supported operation, not a recovery hack.** A forced full rebuild must
  exist as a documented escape hatch, and rebuilding from Git must be deterministic —
  the same history must produce the same projection.
- **Freshness must be reportable.** If the projection can be stale, a user must be able
  to find out that it is, without inferring it from wrong answers.
- **Interrupted synchronization resumes from its last durable progress point**, never
  restarting from zero and never silently skipping; repeated interruption must not wedge
  the refresh loop. Verified by scenarios `BB-07` and `BB-08`.
- **Backup and portability come free.** A user's execution state travels with the
  repository, and any Git-native workflow — branch, clone, bisect, archive — applies to
  it without Quest's participation.
- **The cost is read latency on a cold projection**, and the design accepts it. A rebuild
  that is slow at very large scale is a Phase 3 engineering problem, not a reason to make
  the cache authoritative.
- **This forecloses a shared database with Lore**, and does so on purpose. See
  [Keep Lore optional and integrate only through versioned public records](keep-lore-optional-and-integrate-only-through-versioned-public-records.md).
