---
# yaml-language-server: $schema=../../.lore/schemas/spec.schema.json
type: Spec
title: Quest CLI architecture
tags:
  - quest
  - cli
  - architecture
  - ports
  - layering
  - trust-model
summary: "Runtime-neutral component architecture for Quest CLI: layers, ports, trust model, durability tiers, and error taxonomy, with every runtime choice left open."
timestamp: 2026-08-05T11:50:25.565Z
---

# Quest CLI architecture

## Summary

The component ADR settled Quest CLI's structure in a single phrase: one package with an
enforced internal **CLI, application, domain, and ports** boundary. That phrase is correct
and, on its own, not buildable. This Spec turns it into a structure — what each layer
holds, which way dependencies point, what the ports are, and what the layers are obliged
to preserve.

It is deliberately **runtime-neutral**. Runtime, native packaging, and the supported
platform matrix may not be frozen until live Lore evidence is reviewed, so nothing here
names a language, a build system, a library, or a storage engine. That constraint costs
nothing: the architecture the research supports is a ports-and-adapters one, and
ports-and-adapters is exactly the shape that survives having its runtime chosen later.

The load-bearing claim is narrow. Quest's correctness properties — atomic
operation-owned writes, compare-and-swap conflict detection, clock-local lease evaluation,
read-only purity — are all statements about **boundaries**, not algorithms. Get the
boundaries wrong and no amount of careful implementation recovers them; get them right and
each property has one place it can be enforced and one place it can be tested.

Quest-wide architecture is canonical in the [consolidated Quest namespace](https://github.com/opum-ai/opum-doc/tree/dev/docs/quest). This Spec describes the component
only, and anything here that would change Quest-wide vocabulary, the actor model, or the
product promise is a **proposal** to that repository, not normative because a QCLI
document states it.

## Requirements

Architectural obligations, as distinct from the functional requirements in the
[functional requirements Spec](quest-cli-functional-requirements.md).

### Layering

- **Dependencies are mechanically constrained.** `scripts/check-layers.mjs` enforces the
  graph: domain imports no other Quest layer; ports import domain vocabulary; application imports domain and
  ports; adapters import domain and ports; ordinary CLI modules import application only.
  `src/cli/composition.ts` is the sole adapter-import exception, limited to constructing
  concrete implementations for application use cases.
- **The domain layer has no knowledge of Git, the filesystem, the clock, the process
  environment, or output formatting.** If domain code can observe any of them, the
  invariants that depend on substitutability cannot be tested.
- **No layer may be bypassed.** A CLI command reaching a port directly defeats the
  boundary, and the boundary is the deliverable — this is the seam the ADR calls
  *enforced*, and enforcement means a check, not a convention.
- **One package.** No separately versioned kernel before a concrete second in-process
  consumer, incompatible runtime needs, independent release cadence, or a measured
  subprocess cost justifies it (`FR-IDENT-2`).

### Ports

- **Every effect on the outside world crosses a port.** Git, filesystem, clock, Lore, and
  the projection store are the five.
- **Every port is substitutable in tests.** This is not a style preference. Scenario
  `TM-05` injects clock skew, which is impossible if lease evaluation reads a system clock
  directly; scenarios `TM-01`, `TM-02`, and `TM-12` interrupt writes at chosen points,
  which requires a Git port that can be made to fail where the test says.
- **A port defines the vocabulary the domain needs, not the capability the adapter has.**
  The Git port exposes conditional-update semantics because the domain needs
  compare-and-swap — not the whole of Git because Git offers it.

### Preservation

- **Byte fidelity across the boundary.** Titles and content round-trip byte-for-byte;
  nothing is normalised, unescaped, or shell-interpreted in transit (`FR-IDENT-6`).
- **Identifier comparison belongs to the domain.** Case and Unicode equivalence are
  decided by Quest's own comparison logic and never delegated to filesystem behaviour,
  which differs across platforms and would make identity itself platform-dependent
  (`FR-IDENT-4`).
- **Encoding failures are classified, not swallowed.** Non-UTF-8 content produces a defined
  classification at the boundary where it is read (`FR-IDENT-8`).

## Design

### Layers

```text
  CLI              argument parsing, output rendering, exit-code mapping
   |               knows: the envelope, the exit table, human formatting
   v
  Application      use cases: claim, renew, gate, sync, migrate, link
   |               owns: transaction scope, the path set an operation may touch
   v
  Domain           tasks, events, claims, leases, gates, identifiers
   |               pure: no I/O, no clock, no environment
   v
  Ports            git · filesystem · clock · lore · projection store
                   implemented by adapters outside the domain
```

**CLI.** Parses input, renders results, maps outcome classes to exit codes. It holds the
envelope shape and the exit table and nothing else — every human-readable string is
*derived from* a structured result, never produced alongside one, because two independent
renderings drift and the prose then becomes accidentally normative (`FR-CLI-2`).

**Application.** One use case per operation. This layer owns the two things that make
`INV-1` and `INV-4` enforceable: the **transaction scope** of an operation, and its
**owned path set**, computed *before any write begins*. That ordering is a real constraint
— it rules out the natural implementation of discovering what to stage by inspecting the
tree afterwards, which is precisely how a tool ends up committing a user's unrelated work.

**Domain.** Tasks, events, claims, leases, gates, identifiers, and the rules relating
them. Pure by construction. Lease expiry lives here as a **function of authored history
and a supplied instant** — it does not read a clock, it is given one, which is what makes
`FR-LIFE-4` and `FR-LIFE-5` testable under injected skew.

**Ports.** The five below.

### Ports

| Port | Domain vocabulary | Why it is a port |
| --- | --- | --- |
| **Git** | Conditional ref update, read at revision, commit an owned path set | Compare-and-swap is the only coordination primitive Quest has; it must be interruptible at chosen points for `TM-01`, `TM-02`, `TM-12` |
| **Filesystem** | Read, write, enumerate, byte-preserving | Case folding, Unicode normalisation, and path handling differ per platform, and `TM-10` runs against two real filesystems |
| **Clock** | Supply the current instant | Lease expiry is evaluator-local by design; `TM-05` injects skew, which a direct system-clock read makes untestable |
| **Lore** | Resolve a concept identifier, exchange versioned records | Lore is optional and externally versioned; the adapter must be absent-by-default (`FR-LORE-1`) |
| **Projection store** | Write, read, rebuild, report freshness | Bun SQLite is disposable and rebuildable; the domain never treats it as authority |

The clock port is the one most often omitted as over-engineering, and it is the one this
design most depends on. Without it, the single most important concurrency property —
that two honest evaluators agree, and that a detected disagreement is surfaced rather than
resolved — has no test.

### Trust model

Four statements, each load-bearing:

1. **Git's conditional ref update is the only ordering authority.** There is no central
   arbiter, no lock server, no coordinating daemon. Contention is discovered by losing a
   compare-and-swap, not prevented by acquiring a lock.
2. **Git is a substrate, not an actor.** It has useful atomicity; it has no intent, and
   nothing is attributed to it as a decision.
3. **Lore is bounded entirely out of the authoritative-write surface.** It participates in
   no ordering decision, holds no claim, and writes nothing inside Quest's authoritative
   records.
4. **A projection confers no authority.** It cannot satisfy a gate, hold a claim, or be
   trusted over Git. On disagreement, the authored records win and the disagreement is
   **reported**, never silently reconciled (`FR-PROJ-1`, `FR-PROJ-8`).

### Durability tiers

Three tiers, and the distinction between the first two is where a tool most easily lies to
its user:

| Tier | State | May Quest report durable success? |
| --- | --- | --- |
| i | Synchronized authoritative history | Yes |
| ii | Local-only unsynchronized commits | **No** |
| iii | Disposable projection | Never authoritative at all |

A commit that exists in exactly one clone is not durable. Reporting it as durable is the
specific failure that loses a user's work when that clone dies — the case `TM-06`
exercises by destroying a clone while it holds a lease (`FR-GIT-9`).

### Error taxonomy

Three outcome classes, distinguished at every layer, not collapsed at the CLI:

| Class | Meaning | Examples |
| --- | --- | --- |
| **Success** | The operation completed | A claim acquired; a gate satisfied |
| **Decline or conflict** | The operation correctly did not proceed | A lost claim race; a not-found read; a stale-generation heartbeat; a blocked gate |
| **Error** | Something is wrong | Corrupt record; unreadable repository; encoding failure |

The middle class is the one that must not be collapsed. A claim that loses a race did
exactly what it should, and reporting it as failure leaves every caller unable to
distinguish "someone else got there first" from "something is broken" (`FR-CLI-1`).

Two consequences for layering. The application layer cannot model results as
success-or-throw, because decline is neither. And an **anomaly** — two evaluators
disagreeing about a lease — is a fourth domain condition that fits none of the three
cleanly; it is neither success nor a correct decline nor an internal fault.

The command boundary does not expose those domain classes as a second wire taxonomy.
[Ratify the Quest CLI result
contract](../adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md)
(`QCLI-24`, amended by `QCLI-69`) maps successful results and classified non-successes
onto the shared Opum result/diagnostic contract. In particular, evaluator disagreement is
reported as a structured `drift` diagnostic on exit `6`, not an anomaly-specific envelope
field or exit code.

### Operation shape

Every mutating operation follows one sequence, and the ordering is the enforcement
mechanism for `INV-1` and `INV-4`:

```text
1. read basis          record the revision the decision is made against
2. decide              domain logic, pure, no I/O
3. compute owned paths the complete set, before any write
4. write               filesystem effects for owned paths only
5. commit              conditional on the basis from step 1
6. report              success · decline/conflict · error
```

A rejected step 5 is a **decline**, not an error, and it is reported with enough structure
for the caller to act (`FR-GIT-3`). Steps 1 through 4 leave no partially applied effect if
interrupted (`FR-GIT-1`, `FR-GIT-10`).

Read-only operations execute steps 1, 2, and 6 only — never 3, 4, or 5, on any path
including not-found and error (`FR-CLI-6`). Because the classification is structural
rather than a property of the implementation, it can be checked rather than trusted.

### Deferred by design

Named here so their absence is legible as a decision rather than an oversight. Each is
tracked with owner and unblock condition in the
[open component decisions register](../reference/quest-cli-open-component-decisions.md).

| Deferred | Register entry |
| --- | --- |
| Runtime, language, toolchain, native packaging | D2 — closed: Bun, compiled per-platform binaries behind a minimal Node launcher |
| Supported platform matrix | D3 — closed; Component, claimed by `QCLI-27` |
| Canonical identifier grammar, authored-record layout | D4 — closed by [Adopt a T-prefixed canonical identifier grammar and its authored-record layout](../adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md) (`QCLI-25`) |
| Naming scheme | D4 — closed by [Adopt a T-prefixed canonical identifier grammar and its authored-record layout](../adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md) (`QCLI-25`); directing-task citation added 2026-08-07 by `QCLI-44`: this entry's own reconciling task is `QCLI-40` |
| Event schema | Git mutation contract open items |
| Locking primitive for local serialisation, merge and rebase strategy | Git mutation contract open items |
| Projection storage or index engine | Bun SQLite; disposable projection only |
| Scale target | D5 — closed by [Adopt the Quest CLI projection scale target and accept rebuild-on-doubt as sufficient](../adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md) (`QCLI-26`) |
| Archival and retention model | D7a |
| Command vocabulary, flags | CLI contract open items |
| Envelope shape, exit table | Closed by [Ratify the Quest CLI result contract](../adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md) (`QCLI-24`, amended by `QCLI-69`) against the frozen Opum command contract |

### Proposals routed to Quest-wide authority

Two things this Spec touches that it does not own. Both are proposals, not decisions:

- **Gate-approval actor eligibility** — who counts as an accountable human, delegated
  agent, reviewer, or approver. Quest-wide, routed through
  [Opum's Quest external routing and provenance record](https://github.com/opum-ai/opum-doc/blob/dev/docs/quest/quest-external-routing-and-provenance.md).
  The component actor table describes how these roles act within Quest CLI and
  corroborates rather than resolves the routed question.
- **Whether to canonize "anomaly" as a first-class domain outcome class in Quest's
  product-wide vocabulary**, alongside success, decline, and error.
  [Ratify the Quest CLI result
  contract](../adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md)
  (`QCLI-24`, amended by `QCLI-69`) keeps anomaly distinguishable in the component's
  domain model while mapping it through the shared diagnostic taxonomy at the wire
  boundary. It arises from that component-local condition, but canonizing it as a
  product-wide vocabulary term is a separate proposal this Spec does not own.

## Open questions

- **Anomaly's placement in the domain taxonomy and wire mapping is resolved.** A detected lease
  disagreement is neither success, nor a correct decline, nor an internal fault.
  [Ratify the Quest CLI result
  contract](../adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md)
  (`QCLI-24`, amended by `QCLI-69`) keeps it distinguishable as a domain condition and
  maps evaluator disagreement to a structured `drift` diagnostic on exit `6`.
- **Layer enforcement is resolved.** `scripts/check-layers.mjs` validates every TypeScript
  source import against the declared graph and runs as a strict prepublication gate. The
  one composition-root exception is path-specific and regression-tested; it does not grant
  ordinary CLI modules access to concrete adapters.
- **How is the owned path set expressed?** `INV-4` requires it computed before any write,
  but whether it is a declared manifest, a builder the operation accumulates into, or a
  capability the port grants is undecided and shapes the application layer's interface.
- **Whether the projection port needs transactional semantics is resolved.**
  Rebuild-on-doubt trades implementation complexity against rebuild cost, a tradeoff
  that could not be settled before the scale target (D5). [Adopt the Quest CLI
  projection scale target and accept rebuild-on-doubt as
  sufficient](../adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md)
  (`QCLI-26`) closes D5 and states directly: no durable transactional index is required
  to satisfy this scale target; rebuild-on-doubt stays the projection's primary
  recovery mechanism.
- **Is there a second in-process consumer on the horizon?** The ADR defers a kernel split
  until one exists. Nothing observed so far suggests one, and this should be re-checked
  rather than assumed settled forever.
