---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI open component decisions
tags:
  - quest
  - cli
  - decisions
  - open-questions
  - blockers
  - register
summary: Single register of every open Quest CLI component decision, contract-level unknown, external blocker, and unfiled residual item, with owner and unblock condition.
timestamp: 2026-08-05T11:43:04.113Z
---

# Quest CLI open component decisions

Every Quest CLI question that is still open, in one place. The completed research
campaign settled a great deal and deliberately left the rest open; but "the rest" is
currently scattered across per-task settlement notes, per-contract *Explicitly open*
subsections, and two separate Open-questions lists. Several items are recorded as owned
by no task at all, which makes them invisible to planning rather than merely unresolved.

This register resolves nothing. It states each open item as it stands, names who can
close it, and names the delivery phase that needs it closed. Where an item has no owner,
that is recorded as a fact rather than left implicit.

The derived design layer this register belongs to cites the research corpus as evidence;
the [component contracts and delivery graph](quest-cli-component-contracts-and-delivery-graph.md)
and the [research programme Spec](../specs/quest-cli-pre-implementation-research-program.md)
remain the authorities for everything summarised below.

## Details

### How to use this register

- **Before freezing anything**, check whether it appears here. The research programme
  Spec prohibits freezing runtime, packaging, supported-platform, and integration choices
  whose required Lore evidence is unfinished; the entries below say which those are.
- **Before claiming an item**, re-run its recheck command. Most entries depend on a
  moving reference, and several were last observed on 2026-08-04.
- **An item marked "no owner" is not an invitation to decide it.** It means a future task
  must claim it explicitly. Two of them carry an owner ruling that a worker may not
  substitute their own judgement.

### Recheck clause

This document is almost entirely moving references. Anything below that names a task
status, a registry state, or a repository revision is a dated observation, not a standing
fact.

Before relying on any entry, re-run the command in its **Recheck** column. Where no
command is given, the entry is a component decision with no external input and needs no
re-check — only an owner.

The blanket re-checks, to be run against live fetched clones and never a stale local
checkout:

```bash
backlog task view LDOC-4  --plain    # in lore-doc  — the activation gate
backlog task view LCLI-278 --plain   # in lore-cli  — automated-publish control
backlog task view OCLI-7  --plain    # in opum-doc  — legacy evidence disposition
npm view @opum-ai/quest version      # package availability
gh api repos/opum-ai/quest-cli --jq .full_name   # current owner after redirects
```

A changed result is **a new fact for the owner named in the entry to rule on**. It is
never grounds for a worker to substitute a different answer, pick a fallback, or treat
the change as authorisation. An entry reading *blocked* or *requiring owner input*
remains an unconditional stop.

### Component decisions

The seven categories the research programme Spec, the source register, and the six
dependency deliverables leave open, from
[component contracts and delivery graph](quest-cli-component-contracts-and-delivery-graph.md),
"Unresolved component decisions (AC3)".

| # | Decision | Status | Owner | Unblocked by | Needed for |
| --- | --- | --- | --- | --- | --- |
| D1 | Product license and contributor provenance | Open | Product owner | An owner ruling; no admitted source records a choice | Phase 1; blocks public release |
| D2 | Runtime and native packaging | **Blocked** | Component, post-activation | Completed Lore evidence reviewed after the gate opens | Phases 2 and 6 |
| D3 | Supported-platform matrix and final npm package ownership | Open, **no owner** | Component | A future task claiming it explicitly | Phase 6 |
| D4 | Canonical ID grammar | Open | Component | A Phase 1 decision | Phase 2; gates Phases 3 and 4 |
| D5 | Scale target | Open | Component | A Phase 1 decision | Phase 3 storage and index design |
| D6 | Product-wide actor and governance model | Routed, **unwritten** | `quest-doc` | A task authoring it into `quest-doc` | Phase 2 gate-approval eligibility |
| D7a | Quest's own archival and retention model | Open | Component | A component decision | Phase 2 record layout |
| D7b | Legacy Opum evidence retention and remote disposition | **Blocked** | `opum-doc`, task `OCLI-7` | `OCLI-7` deciding | Nothing in Quest's delivery path |

Detail where the one-line status understates the constraint:

- **D1 — License.** No admitted source in the campaign records a chosen license for
  `@opum-ai/quest`; the charter and the component ADR are both silent. Backlog.md's MIT
  license and the npm registry metadata this campaign read were admitted as
  *naming-conflict and allocation evidence only*, never as license guidance. Permissive
  licensing elsewhere makes copying legally permissible, not provenance-clean — the two
  are separate tests and only the second binds this campaign.
- **D2 — Runtime.** Explicitly gated on completed Lore evidence, so structurally
  post-activation. No task owned it as of 2026-08-04. This is the entry most likely to be
  mistaken for a free choice, because nothing about it is technically hard; the
  prohibition is procedural.
- **D3 — Platform.** Distinct from D2 in carrying *no* Lore-evidence gate — it could be
  claimed now. The packaging contract's delivered scope was npm package allocation and
  provenance only, and it claimed neither platform nor runtime. A future task must claim
  this explicitly; it is not implied by any existing task's scope.
- **D4 — ID grammar.** No admitted legacy ID-grammar design exists to port. Backlog.md's
  project-configurable prefix, zero-padding, and dot-suffixed hierarchy must **not** be
  silently inherited. Resolved by no document in the campaign, and named as a stated
  non-goal by the threat model.
- **D6 — Governance.** Quest-wide, not component-local, and already routed to
  `quest-doc`. The component actor-responsibility table answers only how these roles act
  *within* Quest CLI and "corroborates rather than resolves" the routed proposal. **No
  task in any repository has authored it into `quest-doc`.** Phase 2 can build the gate
  mechanism without it, but not gate-approval actor eligibility.
- **D7a — Archival.** The migration research found a real collision hazard in Backlog.md's
  archive-folder handling — an active and an archived record can share an ID, invisible to
  every enumerated command — which Quest's own collision scan must cover independently.
  Whether Quest needs an archive tier at all, beyond the three-tier durability model
  already derived, is undecided.

### Where the research programme Spec's open questions landed

The [research programme Spec](../specs/quest-cli-pre-implementation-research-program.md)
carries five Open questions. They are not a separate list from the entries above — they
are the same questions at a coarser grain. This mapping exists so neither list can be
closed while the other still holds the question open.

| Spec open question | Register entries |
| --- | --- |
| Product license and contributor provenance | D1 |
| Final npm package ownership and supported platform matrix | D3 — **no owner**; plus the CLI identity contract item on release-time availability |
| Runtime and native packaging after Lore's completed evidence is reviewed | D2 — **blocked, no owner** |
| Canonical ID grammar, authored-record layout, event schema, and scale target | D4, D5, and the Git mutation contract items on record layout and event schema |
| Projection engine and lifecycle, and the first stable Lore exchange contract | D5, the projection contract item on storage engine, and the three Lore integration contract items |

The two the Spec itself flags as unowned by any current task are the second and third.
Neither the packaging contract nor the adoption playbook resolves them — the packaging
contract's delivered scope was allocation and provenance only.

### Contract-level open items

Each of the seven functional contracts carries its own *Explicitly open* list. These are
narrower than the component decisions above and mostly resolve inside Phase 1.

| Contract | Open item | Owner | Needed for |
| --- | --- | --- | --- |
| CLI identity | Final availability of `@opum-ai/quest` at release time | Component, at release | Phase 6 |
| Lifecycle | Concrete lease and heartbeat timing parameters | Component | Phase 2 |
| Lifecycle | The specific lifecycle-stage enum | Component | Phase 2 |
| Lifecycle | Gate-approval actor eligibility | `quest-doc` (D6) | Phase 2 |
| JSON and exits | Exact envelope shape — `schemaVersion` form, `kind` naming, shared `data` key or per-`kind` payload key, per-command payload-key naming | Component | Phase 1 |
| JSON and exits | The literal exit-code-to-outcome table | Component | Phase 1 |
| JSON and exits | The not-found signal convention | Component **and** `lore-doc` | Phase 1 |
| JSON and exits | Whether create and edit emit a JSON envelope uniformly | Component **and** `lore-doc` | Phase 1 |
| Git mutation | File layout, naming scheme, event schema, locking primitive, merge and rebase strategy, storage engine | Component | Phase 2 |
| Migration | Whether and how to preserve Backlog-era Git history | Component | Phase 4 |
| Migration | Whether Quest needs an analogue of Backlog's cross-branch task-state overlay | Component | Phase 4 |
| Projection | Any concrete storage or index engine | Component | Phase 3 |
| Lore integration | Exact binary-invocation surface — binary name, operator override, probe sequence | `lore-doc` | Phase 5 |
| Lore integration | Whether Lore's write path accepts a JSON-flagged create or edit response | `lore-doc` | Phase 5 |
| Lore integration | Whether the coupling convention reuses the literal `doc:` label format | `lore-doc` | Phase 5 |

One finding is worth restating because it inverts the obvious approach: **building Quest
by mirroring Lore's documented `--json` output would produce the wrong shape.** Lore's
inbound adapter expectation and Lore's own outbound contract diverge deliberately, so
Quest must decide its envelope itself rather than inherit either.

### External blockers

Three named tasks outside this component, each observed 2026-08-04 and each a moving
reference.

| Blocker | Repository | Observed status | Blocks | Recheck |
| --- | --- | --- | --- | --- |
| `LDOC-4` — gate Quest implementation on accepted Lore release evidence | `lore-doc` | To Do (2026-08-04) | Phase 0, and therefore all implementation | `backlog task view LDOC-4 --plain` |
| `LCLI-278` — automated-publish control | `lore-cli` | To Do (2026-08-04) | Phase 0 unless an equivalent control is approved out of band | `backlog task view LCLI-278 --plain` |
| `OCLI-7` — legacy Opum evidence preservation and remote disposition | `opum-doc` | To Do (2026-08-04) | D7b only; nothing in the delivery path | `backlog task view OCLI-7 --plain` |

`LDOC-4` is the gate. Its predicate has four clauses, and the fourth is quest-cli's own
obligation to record the exact evidence it consumed and the decision time — tracked here
as `QCLI-11`. A dated snapshot, a local build, a consumer summary, or the existence of
Quest documentation cannot open the gate.

There is also a **structural** Lore-side blocker that no task closes: `BacklogAdapter` is
`lore-cli`'s only task-tracker adapter type, and no generic tracker abstraction exists to
implement a second backend against. Phase 5 depends on work that is unstarted on Lore's
side, independent of how ready Quest is internally.

### Boundary decisions Quest cannot make alone

Five items from the Lore adapter contract review classified as requiring a `lore-doc`
boundary decision. Quest can prepare for any outcome but can settle none of them.

| Ref | Question |
| --- | --- |
| 1b | The exact binary name Lore would invoke, and whether an operator-configurable override exists |
| 3b | A minimum-version floor and the exact probe sequence, encoded as Lore-side code |
| 4c | Whether Lore's adapter accepts a JSON create response for a `quest`-shaped backend |
| 5b | Not-found signalling — a genuine three-way tension between exit-code-and-empty-stdout and a JSON-first convention, resolved by no current document. Also requires a Quest contract change |
| 6c | Whether the coupling convention reuses the literal `doc:` label string format. Assuming reuse is free is itself a finding, not a given |

### Residual items recorded but never filed

The campaign trackers report no outstanding *proposed* follow-ups, and that is accurate:
the proposal queue is empty. But the following surfaced inside task settlement notes and
were never filed as tasks. They are recorded here so they stop being visible only to a
reader of per-task notes.

This project requires approval before follow-up work is filed, so listing an item here is
not a decision to file it.

| Item | Source | Consequence if left |
| --- | --- | --- |
| No task claims the supported-platform matrix | QCLI-2.8 decision 3 — "a future task must claim it explicitly" | D3 stays unowned; Phase 6 has no input |
| The product-wide actor model was routed to `quest-doc` but never authored there | QCLI-2.2 candidate 6, corroborated by QCLI-2.4 | D6 stays unwritten; Phase 2 cannot settle gate eligibility |
| The research programme Spec's dependency-order row for QCLI-2.8 is stale — it reads a range that predates the 2.11–2.14 corrections | QCLI-2.14, deferred to an owner decision | A reader mis-reads the synthesis inputs |
| QCLI-2.12's findings F4 and F5 were "left for the orchestrator to track" | QCLI-2.12 notes | No tracking record exists |
| The playbook and the charter and migration ledger are not backlinked to each other | QCLI-2.10, which was instructed not to edit either file | Navigation gap between the operational procedure and its governing records |
| A licensing-source misattribution in QCLI-2.8, not affecting its conclusion | QCLI-2.8 settlement | Minor citation defect |
| A bin path sits in the Description column of a dated-evidence table in the packaging contract | QCLI-2.9 settlement follow-up | Minor table defect |
| The Allowed classification of one register slice is sound but not traceable to the task notes it cites | QCLI-2.1 settlement | Provenance chain has one unverifiable link |
| Backlog.md's `browser` command exposes an undocumented HTTP JSON endpoint whose field shapes diverge from its own CLI contract | QCLI-2.5 finding 13, flagged for QCLI-2.8, which declined to rule | An unexamined boundary if Quest ever mirrors that surface |
| `LCLI-316` was filed in `lore-cli` but deliberately left uncommitted | Campaign tracker, wave 5 | Untracked by any quest-cli mechanism; whoever next works in `lore-cli` must commit it |

### A reclassification trigger that has probably fired

The migration fidelity contract is pinned to **Backlog.md v1.49.3**, and states its own
trigger: a newer release requires a re-check before any contract freezes. That pin was set
on 2026-08-04 and nobody has re-checked it since.

This matters more than a routine version bump, because the fidelity contract rests on an
exhaustive enumeration of that version's invocable surface and thirteen findings about its
undocumented behaviour. A newer Backlog.md may have changed any of them.

```bash
npm view backlog.md version    # compare against the pinned 1.49.3
```

Re-running the enumeration is Phase 1 work. A changed version does not invalidate the
contract; it obliges a re-check of the findings the contract depends on, and any that
changed become new facts for the owner to rule on.

### What is not open

For completeness, and to stop settled matters being re-litigated: repository and package
identity, the executable name, the single-package layering, Git-records-as-authority, the
Git compare-and-swap coordination model, the five mutation invariants, lease semantics,
the three categorical command outcomes, the six migration fidelity properties, and Lore's
runtime optionality are all **settled**. They are recorded in the
[architecture decision records](../adr/index.md) and traced in the
[functional requirements](../specs/quest-cli-functional-requirements.md).
