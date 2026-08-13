---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Keep Lore optional and integrate only through versioned public records
tags:
  - quest
  - cli
  - lore
  - integration
  - adapter
summary: No Quest-only workflow depends on Lore being reachable, neither product writes the other's private storage, and link failures are loud.
timestamp: 2026-08-05T11:44:34.984Z
---

# Keep Lore optional and integrate only through versioned public records

## Status

Accepted. This record promotes a decision the research campaign already settled; it
does not make a new one.

Settled by `QCLI-2.7` and `QCLI-2.4`, recorded in the
[Lore dependency and adapter contract evidence](../reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md),
as contract 7 of the
[component contracts and delivery graph](../reference/quest-cli-component-contracts-and-delivery-graph.md),
and in the [component charter](../reference/quest-cli-component-charter.md) under
"Sources of truth".

The Lore-owned side of this boundary is normative in `lore-doc`'s Quest integration and
release gate specification. This record states only Quest's obligations and does not
restate, reconstruct, or reinterpret Lore's.

## Context

Lore and Quest are companion products from the same estate, built by the same people, on
the same documentation conventions. That closeness is exactly what makes the tempting
design dangerous: a shared in-process package, a shared database, or a bidirectional
writer would all be easy to build and would couple the two products permanently.

Two facts rule it out. First, Quest must be useful in a task-only repository with no Lore
present at all — a user adopting Quest is not thereby adopting Lore. Second, each product
is authoritative for a different thing: Lore for authored knowledge, Quest for execution
records. A shared store gives each product write access to the other's authority, and
there is then no boundary at which either can be held to a contract.

The research also found the practical state of the Lore side, and it is not ready:
`BacklogAdapter` is `lore-cli`'s **only** task-tracker adapter type, with no generic
tracker abstraction to implement a second, differently-shaped backend against. Whatever
Quest builds, there is currently nothing on Lore's side to plug into.

And a trap worth stating plainly: Lore's inbound adapter expectation and Lore's own
documented outbound contract diverge deliberately. Building Quest by mirroring Lore's
published output would produce the wrong shape.

## Decision

**Lore is optional at runtime. Integration is versioned public record exchange only.
Neither product writes the other's private storage.**

- **No Quest-only workflow depends on Lore being reachable.** Claim and deliver, lease
  expiry and reclamation, human review gates, and projection rebuild all complete with no
  Lore present. Of the six end-to-end workflows, exactly one involves Lore, and invoking
  it is itself optional.
- **A Lore link fails loud.** On unreachability or a stale concept identifier, the command
  fails visibly and **leaves the task's own authoritative state untouched**. An
  unavailable, incompatible, incomplete, or stale Lore export never silently becomes
  current Quest state.
- **Exchange is explicit and versioned**, carrying stable identities, schema and version
  metadata, source repository, revision, path, and content provenance. Either side may
  rebuild its own local projection of the other's records; neither writes the other's
  files or database.
- **Lore holds no authority inside Quest's write path.** It participates in no ordering
  decision and satisfies no gate — see
  [Coordinate through Git compare-and-swap without a central arbiter](coordinate-through-git-compare-and-swap-without-a-central-arbiter.md).
- **Quest does not mirror Lore's envelope by default.** Where the two must agree, that
  agreement is negotiated as a named boundary item, not assumed.
- **The adapter activates only through its own owning task**, after the public contract is
  accepted and migration rollback is proven.

Deliberately **not** decided here, because they are `lore-doc`'s to decide: the exact
binary-invocation surface Lore would expect, including binary name, any operator
override, and the probe sequence; whether Lore's write path accepts a JSON-flagged create
or edit response; and whether the coupling convention reuses the literal `doc:` label
format. Assuming that last one is free reuse is itself a finding, not a given. All three
are tracked in the
[open component decisions register](../reference/quest-cli-open-component-decisions.md).

## Consequences

- **Lore is a port with an adapter behind it**, like Git or the filesystem — never a
  library call reaching into Quest's domain.
- **Every Lore-touching command needs a defined behaviour for Lore being absent**, and
  "absent" is the default case rather than an error path.
- **Phase 5 is externally blocked regardless of Quest's internal readiness.** Three of its
  requirements need a `lore-doc` decision, and the adapter seam it would target does not
  exist on Lore's side yet. Quest can prepare for any outcome; it cannot proceed alone.
- **Divergence between the two products is a reportable defect, not something either side
  resolves unilaterally.** The `*-cli` repository is authoritative for what ships; the
  `*-doc` repository stays the normative owner of the contract.
- **Version skew is a first-class concern.** A future Lore release changes what Quest can
  rely on, which is why exchange carries version metadata rather than assuming a shape.
