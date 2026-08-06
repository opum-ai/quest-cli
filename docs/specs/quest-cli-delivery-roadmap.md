---
# yaml-language-server: $schema=../../.lore/schemas/spec.schema.json
type: Spec
title: Quest CLI delivery roadmap
tags:
  - quest
  - cli
  - roadmap
  - phases
  - delivery
  - activation-gate
summary: Seven delivery phases with entry and exit criteria, requirement coverage, and blockers, making the dormant delivery graph executable without activating it.
timestamp: 2026-08-05T11:51:45.273Z
---

# Quest CLI delivery roadmap

## Summary

The research campaign produced a seven-phase delivery graph and correctly left it dormant.
This Spec makes it executable — entry and exit criteria, requirement coverage, verifying
scenarios, and blockers per phase — **without activating it**. Describing what a phase
requires and produces is allowed work; starting one is not.

The finding that matters most is easy to miss inside an eight-hundred-line reference
document, so it is stated here first:

> **Phase 1 is not blocked on the Lore gate.** It is decision work, produces no code, and
> its only blockers are Quest's own unresolved component decisions. It is therefore the
> next actionable unit of work — and it is what unblocks Phases 2 through 5.

Phase 0 and Phase 6 are owner-gated and cannot be worked at all. Phases 2 through 5 are
describable and designable now, but may not produce product source, a runtime dependency,
executable scaffolding, or any packaging artifact before Phase 0 passes and is
independently re-verified live.

`quest-doc` owns the product-wide staged roadmap; its
[clean-room execution graph](https://github.com/salient-data/quest-doc/blob/dev/docs/specs/quest-clean-room-execution-graph.md)
is the normative record of the eight product stages. This Spec is the component-local
elaboration of them and does not restate them as normative here.

## Requirements

### What a phase must satisfy to be complete

- **Every requirement in its coverage set is implemented and verified** by the scenarios
  named for it in the
  [functional requirements Spec](quest-cli-functional-requirements.md).
- **Every open decision it depends on is closed** and recorded, not worked around. A phase
  that proceeds on an assumption in place of a decision has produced an undocumented
  decision, which is worse than a delay.
- **Its exit criteria are demonstrated, not asserted.** The verification classes are
  contract, integration, real-clone, fault, migration, packaging, and release tests; a
  phase claiming completion names which ran.
- **Nothing prohibited was produced.** The research programme Spec's prohibited-work list
  applies unchanged to every phase in this graph.

### What this Spec does not do

It creates no task, assigns none, activates no phase, and opens no gate. Feature-level task
planning is done just in time when a phase is authorised, against the state of the
codebase and the open decisions at that moment — not pre-planned here, where it would be
stale before it was actionable.

## Design

### Phase overview

| Phase | Scope | Blocked by | Workable now? |
| --- | --- | --- | --- |
| 0 | Activation precondition | The Lore-owned gate; `LCLI-278` | No — owner-held |
| 1 | Component decisions, no code | Quest's own open decisions only | **Yes** |
| 2 | Core execution engine | Phase 1; Phase 0 for any code | Design only |
| 3 | Local projection | Phase 2 | Design only |
| 4 | Backlog migration | Phases 2 and 3 | Design only |
| 5 | Lore adapter | Phase 1; `lore-doc` boundary decisions | Partially, externally blocked |
| 6 | Packaging and release | Phase 0; D2 and D3 | No |

---

### Phase 0 — Activation precondition

**Owner:** `lore-doc`, task `LDOC-4`. Not a Quest-side task.

**Entry.** None; it is the root.

**Exit.** All four clauses of the gate predicate hold at one live inspection boundary: the
owner has accepted the then-current Lore release boundary; `lore-cli`'s live Backlog,
release documentation, artifact metadata, and immutable publication evidence agree that
boundary is complete; no relevant owner-held blocker or contradictory handover remains;
and quest-cli records the exact evidence it consumed and the decision time. Any false,
stale, missing, or contradictory input makes the result **closed**.

**Status.** `LDOC-4` was To Do when last observed on 2026-08-04, and remained To Do on
`QCLI-11`'s live re-verification on 2026-08-05 (see the [activation-gate evidence
record](../reference/quest-cli-activation-gate-evidence-record.md)) — a moving reference,
re-verify with `backlog task view LDOC-4 --plain` against a live fetched clone.

**What a consumer may not do.** A dated snapshot, a local build, a consumer summary, or
the existence of Quest documentation cannot open this gate. Clause 4 is quest-cli's own
obligation and is tracked as task `QCLI-11`; satisfying it records what was consumed and
does **not** constitute a gate result — see the [activation-gate evidence
record](../reference/quest-cli-activation-gate-evidence-record.md) `QCLI-11` produced.

---

### Phase 1 — Component decisions

**No code. Not blocked on Phase 0.** This is the actionable work today.

**Entry.** The open component decisions register exists and enumerates what must be
closed. It does.

**Exit.** These are decided and recorded:

| Decision | Register entry | Closed / owned by |
| --- | --- | --- |
| JSON envelope shape — `schemaVersion` form, `kind` naming, payload key structure | CLI contract open items | **Closed** — [Ratify the Quest CLI result contract](../adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md) (`QCLI-24`) |
| The literal exit-code-to-outcome table | CLI contract open items | **Closed** — [Ratify the Quest CLI result contract](../adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md) (`QCLI-24`) |
| The not-found signal convention | CLI contract open items, partly `lore-doc` | **Closed, Quest's own side** — [Ratify the Quest CLI result contract](../adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md) (`QCLI-24`); the `lore-doc` boundary half stays open, unowned by Quest |
| Canonical identifier grammar | D4 | **Closed** — [Adopt a T-prefixed canonical identifier grammar and its authored-record layout](../adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md) (`QCLI-25`) |
| Product license and contributor provenance | D1 | **Closed** — [license, platform, and runtime ownership record](../reference/quest-cli-license-platform-and-runtime-ownership-record.md) (`QCLI-27`): MIT, informal/none for now |
| Explicit ownership of the platform question | D3 — Component, claimed by `QCLI-27` | **Closed** — [license, platform, and runtime ownership record](../reference/quest-cli-license-platform-and-runtime-ownership-record.md) (`QCLI-27`): macOS, Linux, Windows; claimed as quest-cli-owned |
| Explicit ownership of the runtime question | D2 — blocked, but ownership is not | **Owned, not closed** — [license, platform, and runtime ownership record](../reference/quest-cli-license-platform-and-runtime-ownership-record.md) (`QCLI-27`) claims quest-cli ownership; the runtime choice itself remains blocked, post-activation |
| Scale target | D5 | **Closed** — [Adopt the Quest CLI projection scale target and accept rebuild-on-doubt as sufficient](../adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md) (`QCLI-26`) |
| Where an anomaly sits in the outcome taxonomy | Architecture open questions | **Closed, component-level placement** — [Ratify the Quest CLI result contract](../adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md) (`QCLI-24`): a distinguishable fourth outcome value (`outcome: "anomaly"`); full product-wide outcome-vocabulary canonization remains a separate `quest-doc` proposal, not settled here |

Plus one standing re-verification obligation: the migration fidelity contract is pinned to
Backlog.md **v1.49.3** and its own recheck clause obliges re-checking before anything
freezes on it. Every `FR-MIG` requirement rests on findings from that build.

*Corrected 2026-08-05 (`QCLI-17`): this previously called the re-verification "overdue,"
inheriting a since-corrected claim in the [open component decisions
register](../reference/quest-cli-open-component-decisions.md) that the pin was probably
stale. It was not — that register now records the verified 2026-08-05 registry state
(`npm view backlog.md version` / `dist-tags.latest` both `1.49.3`, `time.modified`
2026-08-03). The obligation to re-check before this phase's exit, or any freeze,
whichever comes first, is unchanged.*

**Requirements decided (not implemented):** `FR-CLI-1`, `FR-CLI-2`, `FR-CLI-4`,
`FR-CLI-7`, `FR-IDENT-3`, `FR-MIG-7`.

**Two decisions are not Quest's to make.** D6, the product-wide actor model, must be
authored into `quest-doc` — no task in any repository has done so. The `lore-doc` half of
the not-found convention needs that owner. A phase that "decides" either unilaterally has
overstepped.

---

### Phase 2 — Core execution engine

**Entry.** Phase 1's identifier grammar and envelope decisions are closed. Phase 0 has
passed, for any code to be written at all.

**Exit.** Claims, leases, heartbeats, the gate mechanism excluding actor eligibility,
event-derived state, and operation-owned Git mutation satisfying all five invariants.

**Requirements:** `FR-IDENT-2` … `FR-IDENT-8`, all `FR-LIFE`, all `FR-CLI`, `FR-GIT-1` …
`FR-GIT-5`, `FR-GIT-8` … `FR-GIT-10`.

**Verified by:** `BB-01` … `BB-06`, `BB-09` … `BB-15`; `TM-01` … `TM-12` except `TM-11`'s
subdirectory half.

**Notes.** This is the phase where the architecture's boundaries either hold or do not.
The clock port, the pre-computed owned path set, and the read-only classification are all
enforceable here and effectively unrecoverable later. The gate *mechanism* can be built
without D6; gate *actor eligibility* cannot.

---

### Phase 3 — Local projection

**Entry.** Phase 2 complete — there must be authoritative records to project from.

**Exit.** A rebuildable projection with freshness reporting, resume-not-restart
synchronization, corruption recovery, and a documented forced-rebuild escape hatch.

**Requirements:** all `FR-PROJ`, plus `FR-GIT-6` and `FR-GIT-7`.

**Verified by:** `BB-07`, `BB-08`, `BB-16`, `BB-17`.

**Notes.** Blocked on D5, the scale target, for any storage-engine choice — a projection
cannot be sized before the target it is sized for exists. The rule that survives every
engine choice: on disagreement, Git wins and the disagreement is reported.

---

### Phase 4 — Backlog migration

**Entry.** Phase 2 for a canonical identifier grammar to map into; Phase 3 for a projection
to populate.

**Exit.** Deterministic dry-run preview, reversible mapping, collision handling across both
scopes, source immutability, coexistence window, and rollback evidence. The
[Backlog adoption and migration playbook](../reference/quest-cli-backlog-adoption-and-migration-playbook.md)
is the authored operational procedure — its six preconditions and nine-step cutover are
the acceptance shape for this phase.

**Requirements:** all `FR-MIG`.

**Notes.** Re-check the v1.49.3 pin before starting. This phase carries the highest
user-visible risk in the roadmap, because it is the only one that touches data a user
already depends on, and the fidelity contract's own findings describe a source tool whose
identifier counters are not global and whose repair command cannot see the collision that
matters.

---

### Phase 5 — Lore adapter

**Entry.** Phase 1's envelope decision. Externally: `lore-doc` boundary decisions.

**Exit.** The already-satisfiable adapter obligations are met; the boundary-dependent ones
are either resolved by their owner or explicitly deferred.

**Requirements:** all `FR-LORE`.

**Blocked, structurally.** Three adapter obligations need a `lore-doc` decision — the
binary invocation surface, the write-response shape, and whether the coupling label format
is reused. Beyond those, `BacklogAdapter` is `lore-cli`'s only tracker adapter type, with
no generic abstraction to implement a second backend against. **This phase cannot complete
on Quest's readiness alone**, however well Phases 1 through 4 go.

---

### Phase 6 — Packaging and release

**Entry.** Phase 0 passed; D2 runtime and D3 platform decided.

**Exit.** Clean-install verification passes; `@opum-ai/quest` is published through a
protected path; component release and rollback runbooks exist.

**Requirements:** `FR-IDENT-1`.

**Standing prohibition.** No repository or site surface may present anything that would
lead a reader to believe Quest is obtainable until a protected immutable package is
actually published and clean-install verification passes. The rule is an *effect*, not a
list of element types — a version badge violates it on the same ground as an install
button.

**Also required at release time:** re-run the packaging contract's mandatory recheck
clause live. The 2026-08-04 observation that `@opum-ai/quest` was unregistered is not
current proof of availability, and if the name is no longer free that is a new fact for
the owner to rule on — never grounds for a worker to substitute a name.

---

### Deliverables the research does not yet name as phase work

Two gaps between what the charter claims to own and what exists. Both are recorded here so
they are scheduled rather than discovered late.

**Test strategy — Phase 1 to design, Phase 2 to establish.** The charter claims ownership
of unit, contract, integration, real-clone, fault, packaging, and release tests. The
repository currently has **no automated test, build, or lint gate at all**; the only gates
are Lore's validation, link checking, and orphan reporting. The `BB` and `TM` scenarios are
raw material for a suite, not a suite design — and both were authored before any runtime
was chosen, so neither is expressible as an executable test until D2 is settled. What can
be designed now: the harness shape, the fixture policy (throwaway scratch repositories
only, never a user project), and which scenarios need real multi-clone topologies rather
than mocks.

**Release and rollback runbooks — Phase 6.** The charter claims them; `docs/runbooks/`
contains only the research handover. They are a Phase 6 exit criterion.

### Dependency graph

```text
Phase 0 ──────────────────────────────────────┐
(owner-gated: LDOC-4, LCLI-278)               │
                                              v
Phase 1 ───> Phase 2 ───> Phase 3 ───> Phase 4
(no code,        │            │
 available       │            │
 now)            │            └──> (projection to populate)
                 │
                 └──> Phase 5  (also needs lore-doc decisions)

Phase 6 <── Phase 0 + D2 runtime + D3 platform
```

Phase 0 gates any code in Phases 2 through 6. Phase 1 needs neither.

## Open questions

- **When does Phase 0 get evaluated?** `LDOC-4` has been To Do since before Lore shipped.
  The evidence it waits on has since changed — `@opum-ai/lore` is published with release
  tags, where the audit that closed the gate found none — but evaluating that is
  `lore-doc`'s call, and a consumer repository cannot infer it. Task `QCLI-11` records
  what quest-cli consumed; it does not open anything.
- ~~**Who claims D3, the platform matrix?**~~ **Resolved 2026-08-05** by the
  [license, platform, and runtime ownership
  record](../reference/quest-cli-license-platform-and-runtime-ownership-record.md)
  (`QCLI-27`): supported-platform matrix macOS, Linux, and Windows; ownership
  explicitly claimed as quest-cli-owned.
- **Who authors D6 into `quest-doc`?** Gate actor eligibility blocks part of Phase 2 and no
  task in any repository has been filed for it.
- **Can Phase 5 be usefully split** into the unilaterally satisfiable obligations and the
  externally blocked ones, so the first half is not held hostage to the second?
- **Is a coexistence period part of Phase 4's exit, or a phase of its own?** The playbook
  describes a window that opens, is monitored for drift, and closes — which is operational
  time, not implementation work, and does not fit a phase boundary cleanly.
