---
# yaml-language-server: $schema=../../.lore/schemas/spec.schema.json
type: Spec
title: Quest CLI functional requirements
tags:
  - quest
  - cli
  - requirements
  - traceability
  - scenarios
  - contracts
summary: One identifier space for every Quest CLI functional requirement, traced to its source research, its verifying scenario, and the delivery phase that builds it.
timestamp: 2026-08-05T11:48:42.277Z
---

# Quest CLI functional requirements

## Summary

Quest CLI's requirements already exist. They are spread across five research documents in
five incompatible shapes — seventeen black-box scenarios, twelve fault-injection
scenarios, five mutation invariants, thirteen threat-category requirements, six migration
fidelity properties, fifteen adapter rows, and sixteen legacy dispositions — with no
shared identifier, no priority, and no path from a requirement to the test that proves it
or the phase that builds it.

This Spec gives them one identifier space and one traceability chain. It **derives**; it
does not decide. Every requirement below restates something the research already settled,
cites where, and names the scenario that verifies it.

Requirements are expressed in **operation categories** — claim, lease renewal,
gate-guarded, read-only inspection, synchronization, recovery — rather than command names.
The scenarios were authored that way deliberately, and Quest's command vocabulary is still
open; naming commands here would freeze by implication what the research left open on
purpose.

Identifiers are `FR-AREA-n` across seven areas, matching the seven functional contracts:

| Area | Covers |
| --- | --- |
| `IDENT` | Package and executable identity, canonical identifiers, workspace scope, path and encoding safety |
| `LIFE` | Lifecycle stages, claims, leases, heartbeats, gates, reclamation, delegation |
| `CLI` | Command outcomes, machine-readable envelope, exit behaviour |
| `GIT` | Mutation invariants, staging ownership, durability tiers |
| `MIG` | Backlog.md migration fidelity and coexistence |
| `PROJ` | Local projection, rebuild, freshness, recovery |
| `LORE` | Lore optionality and versioned exchange |

**Nothing here is activated.** Implementation remains gated on the Lore-owned release
gate; this document describes what would be built, not permission to build it.

## Requirements

Every requirement is **first-release** unless marked otherwise. A requirement marked
**open** has a settled *obligation* but an unsettled *form* — the register entry names
what is missing.

### Source legend

The `Source` column names a document and heading. Each maps to the task that settled it:

| Source shorthand | Document | Settled by |
| --- | --- | --- |
| Contract *n* | [Component contracts and delivery graph](../reference/quest-cli-component-contracts-and-delivery-graph.md), "Component contracts (AC2)" | `QCLI-2.8` |
| Threat model | [Git, filesystem, and concurrency threat model](../reference/quest-cli-git-filesystem-and-concurrency-threat-model.md) | `QCLI-2.6` |
| Fidelity contract | [Backlog migration fidelity contract](../reference/quest-cli-backlog-migration-fidelity-contract.md) | `QCLI-2.5` |
| Glossary, actor table, workflow table | [Component glossary, actors, and workflows](../reference/quest-cli-component-glossary-actors-and-workflows.md) | `QCLI-2.4` |
| Legacy candidate *n* | [Legacy Opum requirement reconciliation](../reference/legacy-opum-requirement-reconciliation-for-quest-cli.md) | `QCLI-2.2` |
| Adapter item | [Lore dependency and adapter contract evidence](../reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md) | `QCLI-2.7` |
| Charter | [Component charter](../reference/quest-cli-component-charter.md) | `QCLI-1` |
| Component ADR; packaging contract | [Use quest-cli for the Quest package and command](../adr/use-quest-cli-for-the-quest-package-and-command.md); [packaging contract](../reference/quest-cli-packaging-contract.md) | `QCLI-1`, amended `QCLI-5`; `QCLI-2.9` |
| Lore-owned gate specification | [Opum Lore integration and release gate](https://github.com/opum-ai/opum-doc/blob/dev/docs/lore/specs/quest-integration-and-lore-release-gate.md) | External owner route |

### Source coverage

Every structured requirement set in the research corpus is represented below. This table
is the completeness check — a set with no requirements pointing at it would be a gap.

| Research set | Count | Where it lands |
| --- | --- | --- |
| Mutation invariants | 5 | `FR-GIT-1` … `FR-GIT-5` |
| Threat categories | 13 | Dirty worktrees `FR-GIT-4`, `FR-GIT-8`; partial writes `FR-GIT-1`, `FR-GIT-10`; retries and duplicate events `FR-GIT-2`; aliases `FR-IDENT-3`, `FR-LIFE-8`; clocks and leases `FR-LIFE-4` … `FR-LIFE-6`; races `FR-LIFE-7`, `FR-GIT-3`; divergence `FR-GIT-3`, `FR-PROJ-1`; hostile paths `FR-IDENT-6`; encoding `FR-IDENT-8`; case sensitivity `FR-IDENT-4`; subdirectories `FR-IDENT-7`; repository removal `FR-GIT-9` |
| Migration fidelity properties | 6 | `FR-MIG-1` … `FR-MIG-6` |
| End-to-end workflows | 6 | Claim and deliver `FR-LIFE-2`, `FR-LIFE-9`; lease expiry and reclamation `FR-LIFE-3`, `FR-LIFE-11`; human review gate `FR-LIFE-9`, `FR-LIFE-10`; projection rebuild `FR-PROJ-2`, `FR-PROJ-5`; optional Lore link `FR-LORE-1`, `FR-LORE-2`; delegation handoff `FR-LIFE-13` |
| Actor constraint sets | 7 | Delegated agent `FR-LIFE-13`; reviewer and approver `FR-LIFE-10`; Lore `FR-LORE-4`; Git `FR-GIT-3`; projection `FR-PROJ-8`; accountable human and maintainer `FR-LIFE-13` (**open**, pending register D6) |
| Lore adapter rows | 15 | Already satisfiable `FR-CLI-3` … `FR-CLI-5`, `FR-LORE-1` … `FR-LORE-4`; Quest-decision `FR-CLI-2`, `FR-CLI-4`, `FR-CLI-7`, `FR-MIG-7`; externally blocked rows tracked in the register, not as requirements |
| Legacy candidates, Reusable and Adapted | 9 | `FR-CLI-1`, `FR-GIT-4`, `FR-LIFE-2` … `FR-LIFE-5`, `FR-LIFE-9`, `FR-LIFE-12`, `FR-IDENT-3`, `FR-IDENT-5`, `FR-CLI-6` |
| Black-box scenarios | 17 | Full mapping under Design, below |
| Fault-injection scenarios | 12 | Full mapping under Design, below |

The five **rejected**, two **superseded**, and two **deferred** legacy candidates are
deliberately absent: they are recorded dispositions, not requirements. The
Externally blocked adapter rows are likewise absent as requirements, because Quest cannot
state an obligation whose shape another owner has not decided — they are register
entries instead.

### IDENT — identity, workspace scope, and input safety

| ID | Requirement | Source | Verified by | Phase |
| --- | --- | --- | --- | --- |
| `FR-IDENT-1` | The package is `@opum-ai/quest` and the executable is `quest` | Component ADR; packaging contract | Packaging tests | 6 |
| `FR-IDENT-2` | One package, with an enforced internal CLI, application, domain, and ports boundary; no separately versioned kernel before a concrete second consumer | Component ADR decision 3 | Architecture conformance check | 2 |
| `FR-IDENT-3` | A task has one canonical identity; aliases resolve to it and never constitute a second identity | Contract 1; legacy candidate 10 | `BB-14` | 2 |
| `FR-IDENT-4` | Canonical-identifier uniqueness is enforced by Quest's own comparison logic, never delegated to filesystem case behaviour | Threat model, "Case sensitivity" | `TM-10` | 2 |
| `FR-IDENT-5` | Repository enrolment is explicit; workspaces are isolated from one another | Legacy candidate 2 | Integration tests | 2 |
| `FR-IDENT-6` | Titles and content containing non-ASCII, quoted, or shell-metacharacter payloads round-trip byte-for-byte and are never interpreted | Threat model, "Hostile paths" | `BB-09`, `TM-08` | 2 |
| `FR-IDENT-7` | Records placed in deeply nested subdirectories are honoured and enumerated exactly once | Threat model, "Subdirectories" | `BB-10`, `TM-11` | 2 |
| `FR-IDENT-8` | Non-UTF-8 content receives a defined error classification; it never becomes silent data loss | Threat model, "Encoding" | `BB-11`, `TM-09` | 2 |

### LIFE — lifecycle, claims, leases, and gates

| ID | Requirement | Source | Verified by | Phase |
| --- | --- | --- | --- | --- |
| `FR-LIFE-1` | A task moves through `To Do` → `In Progress` → `Done`; terminal records are retained in place. | Contract 2 | Integration tests | 2 |
| `FR-LIFE-2` | Claims are authored records, conditioned on the state they read | Contract 2; legacy candidate 3 | `BB-15` | 2 |
| `FR-LIFE-3` | A claim is valid only while its TTL lease is live; the default lease is 30 minutes with a 5-minute heartbeat, validated through configuration. | Contract 2; legacy candidate 4 | `BB-01` | 2 |
| `FR-LIFE-4` | Lease expiry is evaluable from authored history plus the evaluating actor's own local clock alone | Threat model, "Clocks and leases" 1 | `BB-01`, `TM-05` | 2 |
| `FR-LIFE-5` | Two honest evaluators computing expiry for the same history at materially the same moment reach the same status; a detected disagreement surfaces as a named anomaly and is never silently resolved | Threat model, "Clocks and leases" 2 | `TM-05` | 2 |
| `FR-LIFE-6` | A lease renewal is scoped to the exact lease generation it was issued against; a late or stale renewal can never extend a newer holder's lease | Threat model, "Clocks and leases" 4 | `BB-02` | 2 |
| `FR-LIFE-7` | Two concurrent claims on the same canonical task resolve to exactly one winner — never both succeeding, never both failing | Contract 2; threat model, "Races" | `BB-15`, `TM-03` | 2 |
| `FR-LIFE-8` | Exactly one lease exists per canonical task system-wide, not one per identifier form | Contract 2 | `BB-14`, `TM-11` | 2 |
| `FR-LIFE-9` | A gate blocks the lifecycle until its condition is recorded as satisfied with evidence | Contract 2; legacy candidate 5 | `BB-03` | 2 |
| `FR-LIFE-10` | Self-supplied approval evidence never satisfies a gate requiring separation | Contract 2 | `BB-04` | 2 |
| `FR-LIFE-11` | Reclaiming an expired lease appends a new claim event; it never rewrites the expired claim's history | Contract 2; glossary, "Reclamation" | `TM-06` | 2 |
| `FR-LIFE-12` | State is derived from recorded events | Legacy candidate 1 | Integration tests | 2 |
| `FR-LIFE-13` | A `delegated-agent` cites one accountable `human` actor, may submit work and evidence, but cannot itself satisfy a human-judgement or separation-of-duty gate; reviewer and maintainer are roles, not actor kinds. Opaque authored identities are not authentication or authorization. | ODOC-57 accepted local actor/delegation vocabulary | `BB-04` | 2 |

### CLI — command outcomes and machine-readable results

| ID | Requirement | Source | Verified by | Phase |
| --- | --- | --- | --- | --- |
| `FR-CLI-1` | Every command distinguishes at minimum three categorical outcomes: success; a structured decline or conflict distinct from success; and a structured error distinct from both | Contract 3 | `BB-02`, `BB-03`, `BB-11`, `BB-15`, `BB-17` | 1 decides, 2 implements |
| `FR-CLI-2` | Every command produces `{schemaVersion: 1, kind, data, principal}` with dotted live kinds; `principal` remains `null` until its population is separately ratified. | QCLI-69 result-contract amendment | Contract tests | 2 |
| `FR-CLI-3` | A mutating command's success result carries enough structure to recover a newly minted identifier without parsing human-readable stdout | Contract 3; adapter item 4b | Contract tests | 2 |
| `FR-CLI-4` | A read command's not-found outcome is unambiguous and distinct from an unrelated hard error. **Open:** the signal convention, partly an external Lore boundary decision | Contract 3; adapter items 5a, 5b | Contract tests | 1 decides, 2 implements |
| `FR-CLI-5` | The version command reports a bare, parseable semantic version and exits zero | Contract 3; adapter item 3a | Contract tests | 2 |
| `FR-CLI-6` | Read-only commands perform zero mutation as a caller-observable part of their result contract, on every path including not-found and error | Contract 3; `INV-5` | `BB-05`, `BB-06` | 2 |
| `FR-CLI-7` | Exit codes are deterministic: 0 success, 1 uncaught, 2 usage, 3 not_found, 4 denied, 5 conflict, 6 validation/drift. | QCLI-69 result-contract amendment | Contract tests | 2 |

### GIT — mutation invariants and durability

| ID | Requirement | Source | Verified by | Phase |
| --- | --- | --- | --- | --- |
| `FR-GIT-1` | `INV-1` Atomicity — a mutating operation's owned filesystem and Git effects all become visible together, or none do | Threat model, `INV-1` | `TM-01`, `TM-02`, `TM-12` | 2 |
| `FR-GIT-2` | `INV-2` Idempotency — invoking the same logical operation more than once for the same logical request produces the same observable end state as invoking it once | Threat model, `INV-2` | `BB-02`, `BB-07`, `BB-08`, `TM-02` | 2 |
| `FR-GIT-3` | `INV-3` Conflict detection — an authoritative write is conditioned on the state it read; a losing write is rejected with a structured conflict, never silently retried, force-applied, or resolved by discarding committed history | Threat model, `INV-3` | `BB-15`, `BB-17`, `TM-03`, `TM-04` | 2 |
| `FR-GIT-4` | `INV-4` Operation-owned staging — an operation stages and commits exactly the paths it owns, determined before any write begins | Threat model, `INV-4` | `BB-12`, `BB-16`, `TM-07` | 2 |
| `FR-GIT-5` | `INV-5` Read-only purity — see `FR-CLI-6`, which states the same invariant from the command surface | Threat model, `INV-5` | `BB-05`, `BB-06` | 2 |
| `FR-GIT-6` | Synchronization commits only its own owned changes, scoped per file | Contract 4 | `BB-16` | 3 |
| `FR-GIT-7` | Synchronization never downgrades unrelated task state | Contract 4 | `BB-17` | 3 |
| `FR-GIT-8` | A failed operation's recovery path never discards unrelated dirty changes | Threat model, "Dirty worktrees" | `BB-13`, `TM-07` | 2 |
| `FR-GIT-9` | Durability is three-tiered — synchronized history, local-only unsynchronized commits, disposable projection — and durable success is never reported on the strength of local-only commits alone | Threat model, "Repository removal" | `TM-06` | 2 |
| `FR-GIT-10` | A write failure partway through multi-file staging leaves no partially applied logical effect | Threat model, "Partial writes" | `TM-12` | 2 |

### MIG — migration fidelity and coexistence

| ID | Requirement | Source | Verified by | Phase |
| --- | --- | --- | --- | --- |
| `FR-MIG-1` | A no-mutation dry run reports exactly what migration would create and map, enumerating per source record its lifecycle-folder origin, source identifier, proposed target identifier, and any flagged collision or gap; a complete read-only preview exits `0` with `requiresApproval: true` and a deterministic digest | Fidelity contract, "Deterministic dry runs" | Migration tests | 4 |
| `FR-MIG-2` | The source-to-target identifier mapping is persisted, keyed on the pair of source folder and source identifier, and reversible without re-scanning the source | Fidelity contract, "Reversible ID mapping" | Migration tests | 4 |
| `FR-MIG-3` | Same-scope and cross-scope duplicate identifiers are detected and reported, never silently resolved; the scan is strictly wider than the source tool's own repair scope | Fidelity contract, "Collision handling"; finding 3 | Migration tests | 4 |
| `FR-MIG-4` | The read phase never invokes a source-mutating command against a user's live project, at any point, including for convenience | Fidelity contract, "Source immutability" | Migration tests | 4 |
| `FR-MIG-5` | Migration assumes no quiescence signal from the source; a long-running read pass re-scans and diffs the file list on completion and flags, never silently merges, anything that changed mid-scan | Fidelity contract, "One-writer coexistence" | Migration tests | 4 |
| `FR-MIG-6` | Every created target record carries source folder, source identifier, target identifier, and a timestamp sufficient for manual rollback | Fidelity contract, "Rollback evidence" | Migration tests | 4 |
| `FR-MIG-7` | Quest defines its own canonical identifier grammar and does not inherit the source tool's configurable prefix, zero-padding, or dot-suffixed hierarchy. **Open:** the grammar itself, register D4 | Fidelity contract, field disposition | Migration tests | 1 decides, 4 applies |
| `FR-MIG-8` | Fidelity gaps are declared as gaps rather than approximated — including derived values with no stored counterpart and index state no documented surface exposes | Fidelity contract, field disposition | Documentation review | 4 |

### PROJ — local projection

| ID | Requirement | Source | Verified by | Phase |
| --- | --- | --- | --- | --- |
| `FR-PROJ-1` | The projection is never authoritative and is never trusted over Git on disagreement; a disagreement is reported, not silently reconciled | Contract 6 | Integration tests | 3 |
| `FR-PROJ-2` | The projection is deterministically rebuildable from Git alone | Contract 6 | Integration tests | 3 |
| `FR-PROJ-3` | An interrupted synchronization resumes from its last durable progress point; it never restarts from zero and never silently skips | Contract 6 | `BB-07` | 3 |
| `FR-PROJ-4` | Repeated interruption never permanently wedges the refresh loop | Contract 6 | `BB-08` | 3 |
| `FR-PROJ-5` | A forced full rebuild exists as a documented escape hatch | Contract 6 | Integration tests | 3 |
| `FR-PROJ-6` | Projection freshness is reportable to the caller | Contract 6 | Integration tests | 3 |
| `FR-PROJ-7` | The projection is explicitly scoped to enrolled workspaces | Charter, "Sources of truth" | Integration tests | 3 |
| `FR-PROJ-8` | A projection can never satisfy a gate, hold a claim, or answer authoritatively | Actor table, "Cannot do" | Integration tests | 3 |
| `FR-PROJ-9` | Corruption is detected and recoverable by rebuild. Bun SQLite is disposable; Git-authored records remain authoritative. | Contract 6; D5 projection decision | Fault tests | 3 |

### LORE — optional integration

| ID | Requirement | Source | Verified by | Phase |
| --- | --- | --- | --- | --- |
| `FR-LORE-1` | No Quest-only workflow depends on Lore being reachable; five of the six end-to-end workflows involve Lore not at all | Contract 7; workflow table | Integration tests | 5 |
| `FR-LORE-2` | A Lore link fails loud on unreachability or a stale concept identifier and leaves the task's own authoritative state untouched | Contract 7 | Integration tests | 5 |
| `FR-LORE-3` | Exchange is explicit and versioned, carrying stable identities, schema and version metadata, source repository, revision, path, and content provenance | Lore-owned gate specification, integration obligations | Contract tests | 5 |
| `FR-LORE-4` | Neither product writes the other's private files or database; either may rebuild its own local projection | Charter, "Sources of truth" | Integration tests | 5 |
| `FR-LORE-5` | An unavailable, incompatible, incomplete, or stale Lore export never silently becomes current Quest state | Lore-owned gate specification | Integration tests | 5 |
| `FR-LORE-6` | The adapter activates only through its owning component task, after the public contract is accepted and migration rollback is proven | Lore-owned gate specification | Process gate | 5 |

### Constraints

These bind implementation and are not themselves features.

**First-release non-goals** — generic documentation authoring, a graph explorer, local
MCP, a hosted service, accounts, RBAC, a dashboard, and a separately versioned kernel
package. Each enters only through a later evidence-backed decision.

**Clean-room prohibitions** — Backlog.md's implementation source and internal tests are
excluded, not merely unread; reading one and declining to cite it is still a breach.
Admissible surface is published documentation, help output, plain and JSON output, and
artifacts produced by running the binary against throwaway scratch repositories outside
the worktree. No source informs a requirement unless the
[research source register](../reference/quest-cli-research-source-register.md) classifies
it Allowed for the exact use cited.

**Activation** — no product source, runtime dependency, executable scaffolding, package
metadata, or publication before the [Lore-owned gate](https://github.com/opum-ai/opum-doc/blob/dev/docs/lore/specs/quest-integration-and-lore-release-gate.md)
is satisfied by its owner-held evidence.

## Design

### Traceability

Every black-box and fault-injection scenario in the corpus maps to at least one
requirement. No scenario is unclaimed, so there is no coverage gap to record.

**Black-box scenarios**

| Scenario | Covers | Requirements |
| --- | --- | --- |
| `BB-01` | Lease expiry computed identically by live check and rebuilt projection | `FR-LIFE-3`, `FR-LIFE-4` |
| `BB-02` | A late, stale-token heartbeat cannot renew a lease it no longer holds | `FR-LIFE-6`, `FR-GIT-2`, `FR-CLI-1` |
| `BB-03` | A gate blocks until a distinct identity records approval evidence | `FR-LIFE-9`, `FR-CLI-1` |
| `BB-04` | Self-supplied approval does not satisfy a separation-requiring gate | `FR-LIFE-10`, `FR-LIFE-13` |
| `BB-05` | Read-only purity, including on the error path | `FR-CLI-6`, `FR-GIT-5` |
| `BB-06` | Read-only purity under a concurrent writer, with no torn reads | `FR-CLI-6`, `FR-GIT-5` |
| `BB-07` | Interrupted synchronization resumes rather than restarting or stalling | `FR-PROJ-3`, `FR-GIT-2` |
| `BB-08` | Repeated interruption never permanently wedges the refresh loop | `FR-PROJ-4` |
| `BB-09` | Hostile title payloads round-trip byte-for-byte and are never interpreted | `FR-IDENT-6` |
| `BB-10` | Deeply nested placement is honoured and enumerated exactly once | `FR-IDENT-7` |
| `BB-11` | Non-UTF-8 content gets a defined error classification | `FR-IDENT-8`, `FR-CLI-1` |
| `BB-12` | An operation never stages pre-existing unrelated dirty changes | `FR-GIT-4` |
| `BB-13` | A failed operation's recovery never discards unrelated dirty changes | `FR-GIT-8` |
| `BB-14` | An alias cannot claim a task already claimed under its canonical identifier | `FR-IDENT-3`, `FR-LIFE-8` |
| `BB-15` | Two concurrent claims resolve to exactly one winner | `FR-LIFE-7`, `FR-GIT-3`, `FR-CLI-1` |
| `BB-16` | Synchronization commits only its own owned changes, scoped per file | `FR-GIT-6`, `FR-GIT-4` |
| `BB-17` | Synchronization never downgrades unrelated task state | `FR-GIT-7`, `FR-GIT-3`, `FR-CLI-1` |

**Fault-injection scenarios**

| Scenario | Fault | Requirements |
| --- | --- | --- |
| `TM-01` | Process killed mid-write, before commit | `FR-GIT-1` |
| `TM-02` | Process killed after commit, before the caller receives the result | `FR-GIT-1`, `FR-GIT-2` |
| `TM-03` | Two real clones race the same claim | `FR-GIT-3`, `FR-LIFE-7` |
| `TM-04` | Stale-basis write after an unnoticed remote advance | `FR-GIT-3` |
| `TM-05` | Injected clock skew across lease evaluators | `FR-LIFE-4`, `FR-LIFE-5` |
| `TM-06` | Clone destroyed while holding a lease | `FR-LIFE-11`, `FR-GIT-9` |
| `TM-07` | Dirty worktree plus a crash mid-operation | `FR-GIT-4`, `FR-GIT-8` |
| `TM-08` | Hostile path payloads against a real checkout | `FR-IDENT-6` |
| `TM-09` | Non-UTF-8 bytes injected directly on disk | `FR-IDENT-8` |
| `TM-10` | Case-folding collision across two real filesystems | `FR-IDENT-4` |
| `TM-11` | Concurrent subdirectory placement plus alias registration | `FR-IDENT-7`, `FR-LIFE-8` |
| `TM-12` | Write failure partway through multi-file staging | `FR-GIT-10`, `FR-GIT-1` |

### Coverage by phase

| Phase | Requirements it satisfies |
| --- | --- |
| 1 — Component decisions | Decides the open form of `FR-CLI-1`, `FR-CLI-2`, `FR-CLI-4`, `FR-CLI-7`, `FR-MIG-7`, and register items D1, D3, D4, D5 |
| 2 — Core execution engine | `FR-IDENT-2` … `FR-IDENT-8`, all `FR-LIFE`, all `FR-CLI`, `FR-GIT-1` … `FR-GIT-5`, `FR-GIT-8` … `FR-GIT-10` |
| 3 — Local projection | `FR-GIT-6`, `FR-GIT-7`, all `FR-PROJ` |
| 4 — Backlog migration | All `FR-MIG` |
| 5 — Lore adapter | All `FR-LORE` |
| 6 — Packaging and release | `FR-IDENT-1` |

### Verification classes

The charter claims ownership of unit, contract, integration, real-clone, fault,
packaging, and release tests. The mapping to this document:

- **Contract tests** — the command surface: envelope shape, exit classes, not-found
  signalling, version output.
- **Integration tests** — workflows end to end against a real repository.
- **Real-clone and fault tests** — the `TM` scenarios, against genuine multi-clone Git
  topologies. These cannot be run against mocks; the invariants they prove are properties
  of real Git behaviour under real interruption.
- **Migration tests** — against throwaway scratch repositories only, never a user project.

No test framework, harness, fixture policy, or coverage bar is chosen here. The repository
currently has **no automated test, build, or lint gate at all** — the only gates are Lore's
own validation, link checking, and orphan reporting. Establishing one is a roadmap
deliverable.

## Open questions

Requirements marked **open** above have a settled obligation and an unsettled form. Each
is tracked, with owner and unblock condition, in the
[open component decisions register](../reference/quest-cli-open-component-decisions.md) —
this Spec deliberately keeps one register rather than a second competing list.

The items that most constrain this document:

- **The envelope shape, exit-code table, and not-found convention** (`FR-CLI-2`,
  `FR-CLI-4`, `FR-CLI-7`). Until Phase 1 settles these, no contract test can be written,
  because there is no contract to assert against.
- **The canonical identifier grammar** (`FR-IDENT-3`, `FR-MIG-7`, register D4). It gates
  the record layout, so it gates Phase 2.
- **Gate-approval actor eligibility** (`FR-LIFE-13`, register D6). Routed through
  [Opum's Quest external routing and provenance record](https://github.com/opum-ai/opum-doc/blob/dev/docs/quest/quest-external-routing-and-provenance.md).
- **Scale target and projection engine** (`FR-PROJ-9`, register D5). Phase 3 cannot size
  its storage without them.
- **The Backlog.md version pin.** Every `FR-MIG` requirement rests on findings from build
  v1.49.3, whose own recheck clause obliges re-verification before anything freezes.
