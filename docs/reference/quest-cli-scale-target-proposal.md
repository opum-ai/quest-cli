---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI scale target proposal
tags:
  - quest
  - cli
  - scale
  - projection
  - decisions
  - proposal
  - phase-1
summary: Proposes a reasoned record, event, repository, and clone-count scale target and rebuild time budget for owner ruling, and what it implies for projection transactional semantics.
timestamp: 2026-08-05T15:30:30.343Z
---

# Quest CLI scale target proposal

This Reference is `QCLI-20`'s deliverable: a proposed scale target for register
entry [D5](quest-cli-open-component-decisions.md) — "Open | Component | A
Phase 1 decision | Phase 3 storage and index design" — cited here read-only,
never edited by this document. D5's absence currently blocks two things: the
projection storage or index engine cannot be sized without it
([component contracts and delivery graph](quest-cli-component-contracts-and-delivery-graph.md),
"Unresolved component decisions (AC3)," item 5 ("Scale"), "`QCLI-2.5` notes
migration read-pass cost scales with source-project size but sets no
target"), and the
[architecture Spec](../specs/quest-cli-architecture.md)'s open question —
"Does the projection port need transactional semantics, or is rebuild-on-doubt
sufficient? ... cannot be settled before the scale target (D5)" — has nothing
to settle against.

**This document proposes; it does not decide.** No ADR is created here, no
decision is recorded as accepted, and the
[open component decisions register](quest-cli-open-component-decisions.md) is
not edited by this task — a separate reconciliation task folds the outcome in
once an owner rules, per the
[owning Story](../stories/follow-through-on-the-quest-cli-design-layer.md)'s
own account of how the three Phase 1 proposal tasks (`QCLI-18`, `QCLI-19`,
`QCLI-20`) relate to that register. It also chooses no storage or index
engine — see "Why no engine is chosen here," below — because register entry
D2 (runtime and native packaging) is blocked post-activation, and the
[research programme Spec](../specs/quest-cli-pre-implementation-research-program.md)
prohibits "freezing runtime, LadybugDB, packaging, supported-platform, or
integration choices whose required Lore evidence is unfinished." An engine
choice is exactly such a freeze once it is made concrete enough to be useful,
because a real engine choice is made in the vocabulary of a runtime
(threads or processes, available libraries, embeddable stores), not in the
runtime-neutral vocabulary this Spec is written in.

**Ratified — 2026-08-05 (`QCLI-26`).** The component owner has since ruled on register
entry D5. [Adopt the Quest CLI projection scale target and accept rebuild-on-doubt as
sufficient](../adr/adopt-the-quest-cli-projection-scale-target-and-accept-rebuild-on-doubt-as-sufficient.md)
is the accepted ADR that closes it, choosing no storage or index engine either. The "this
document proposes; it does not decide" framing above no longer holds; it is preserved
here unedited, as the proposal that ADR rules on, per this project's inline-supersession
convention.

## Details

### Method: each figure traces to a reasoning chain, not a round number

The corpus admits no external benchmark for Quest's own future usage — no
prior QCLI research task ran Quest, or Backlog.md, against a realistically
sized project and recorded the result, and the migration fidelity contract's
own dry-run evidence exercises single-digit synthetic task counts chosen to
exhibit a behavior, not to represent scale (e.g. the ambiguous-ID dry run in
the [Backlog migration fidelity contract](quest-cli-backlog-migration-fidelity-contract.md)
uses one duplicate group across two files). Asserting a round number here
would repeat register D5's own defect at one remove: a target with no
traceable reasoning is barely more useful than no target.

Two things this document *can* trace to, instead:

1. **This campaign's own live Backlog.md corpus**, dated and verified in this
   worktree on 2026-08-05: 41 active task records under `backlog/tasks/`
   (`ls backlog/tasks | wc -l`), 35 of them `Done` and 6 `To Do`, none moved
   to `backlog/completed` or `backlog/archive` (both empty — consistent with
   the fidelity contract's finding that Backlog's `cleanup` archival step
   needs a real TTY and was never driven to completion here); and 106 commits
   touching `backlog/` against 62 touching `docs/`, out of 146 commits total,
   spanning 2026-08-01 to 2026-08-05 (`git log --oneline -- backlog/ | wc -l`,
   same for `docs/` and total). This is real, but it is a **compressed,
   agent-driven research campaign run over five days, not a human project run
   over years** — it anchors a floor, not a target, and it is restated here
   as a dated observation subject to the register's own recheck discipline,
   not a standing fact.
2. **What the corpus already says about Quest's own shape** — that
   [state is event-derived, not separately mutated](quest-cli-component-glossary-actors-and-workflows.md)
   (glossary, "Event" term), that
   [workspace enrollment is explicit, opt-in, and per-repository, isolating one workspace's projection from another's](quest-cli-component-glossary-actors-and-workflows.md)
   (glossary, "Workspace" and "Enrollment" terms), that Quest is chartered as
   a **local, single-package, non-hosted** tool whose first-release non-goals
   explicitly exclude "hosted service... dashboard" and a "remote portfolio"
   (charter, "First-release non-goals"; "Routes elsewhere" table routing
   "remote portfolio" to `opum-doc`), and that coordination happens across
   [an unbounded-in-principle but practically small set of local worktrees and independently cloned repositories](quest-cli-git-filesystem-and-concurrency-threat-model.md)
   with no central arbiter (threat model, "local worktrees and multiple
   clones"; `TM-03`'s two-clone race is the minimum case, not the maximum).

Each dimension below reasons from one or both of these anchors to a specific
figure, then states the figure as a **design point** — the scale a projection
should be sized and tested against — rather than a hard ceiling Quest must
refuse to exceed.

### Record count (per enrolled workspace)

A record, in Quest's own vocabulary, is a task: "the unit of accountable work
Quest tracks" (glossary, "Task" term). Record count accumulates for as long as
a workspace stays enrolled and unarchived, which the corpus leaves open (D7a,
Quest's own archival model, is itself undecided) — so the relevant question is
not "how many records exist at any instant" but "how many records accumulate
in the live, unarchived scope of one workspace over a realistic tracked
lifetime before archival pressure becomes someone's problem."

This campaign's own corpus — 41 records in five compressed days, entirely
unarchived — is a floor, not an answer: it is what an *accelerated* research
campaign produces, not what a *sustained* engineering project produces. A
small-to-mid team tracking one repository continuously, opening records at a
materially slower but sustained rate across months and years rather than
days, plausibly accumulates records one to two orders of magnitude beyond
this five-day snapshot before any archival relief.

**Proposed design point: on the order of 10,000 active-plus-historical task
records per enrolled workspace**, before archival (D7a) removes any of them
from the live scope. This is deliberately not a wall: a workspace at 12,000 or
15,000 records is not a defect, but the projection's read, write, and
freshness-reporting paths should be built and tested at this order of
magnitude, not at the single- or double-digit scale every scenario in this
corpus currently exercises.

### Event count (per enrolled workspace)

Because task/workspace state is derived from event history rather than
separately mutated (glossary, "Event" term), event count is not the same
quantity as record count scaled by a constant — every lifecycle transition a
record passes through (open, claimed, renewed one or more times, gated,
delivered, edited, commented) is its own event, and Quest's own operation
shape commits one Git-tracked event per mutating operation
([architecture Spec](../specs/quest-cli-architecture.md), "Operation shape").

This campaign's own commit history gives a real, if compressed, ratio: 106
commits touching `backlog/` against 41 task records is roughly 2.6 mutating
commits per record — and that ratio is itself a floor, because a five-day
campaign has had no time to accumulate the renewal cycles, lease
reclamations, or repeated gate attempts a multi-year project's records pass
through. A record's full lifecycle under Quest's own lifecycle contract
(claim, one or more lease renewals, possibly a lost-and-reclaimed lease,
a gate attempt, delivery, plus ordinary edits and comments) plausibly
produces on the order of 10-15 events across its lifetime, not the 2.6 this
campaign's compressed history shows.

**Proposed design point: on the order of 100,000-150,000 events per enrolled
workspace** at the 10,000-record design point above (roughly 10-15
events/record) — the sizing basis for the projection's write volume and index
size, not for its user-facing record count.

### Repository (workspace) count (per Quest installation)

The charter's explicit multi-repository enrollment model
("`quest-doc` execution graph, 'explicit multi-repository enrollment and
isolation'", per the glossary's "Workspace" term) means Quest must handle more
than one enrolled workspace at once — but the charter just as explicitly
places "hosted service... dashboard" and "remote portfolio" out of scope for
this component's first release. The realistic cardinality this document
reasons from is therefore **one developer or small team's own local
enrollment set**, not an organization's portfolio: a main project plus a
handful of libraries and side projects one person or small team actively
tracks from a single machine or a small set of machines.

**Proposed design point: on the order of 25 concurrently enrolled workspaces
per Quest installation.** This bounds the aggregate projection size (roughly
25 x the per-workspace record/event design points above) without assuming a
portfolio-scale count that the charter already routes elsewhere
(`opum-doc`'s "remote portfolio," explicitly out of this component's scope).

### Clone count (per enrolled repository)

The threat model derives Quest's safety and recovery invariants from a
topology of "local worktrees and multiple clones" coordinating through Git
compare-and-swap with no central arbiter — a worktree is a working directory
sharing one clone's object store, and a clone is "an independently cloned
repository, with its own object database" whose "local worktree/clone can be
arbitrarily stale relative to any other" (threat model, topology
grounding). `TM-03` exercises exactly two clones racing the same claim as
its minimum case; the durability tiers ("Repository removal") reason about
what is lost when *one* clone holding local-only unsynchronized commits is
destroyed, which only matters if more than one clone plausibly exists.

Quest's own non-hosted, local-tool framing (see "Repository (workspace)
count," above) bounds this the same way: the realistic clone count for one
enrolled repository is one developer's own working copies across their own
machines (laptop, desktop, a CI checkout) plus a small collaborating team's
own clones of the same repository — not an unbounded fleet.

**Proposed design point: on the order of 5-10 live clones per enrolled
repository.** This generalizes `TM-03`'s two-clone minimum to a realistic
small-team count for reasoning about compare-and-swap contention frequency
and the cost of the durability tiers' worst case (an unsynchronized clone
destroyed) without assuming distributed-system-scale fleet sizes this
component was never chartered to serve.

### Rebuild time budget, and the forced-full-rebuild escape hatch

The [functional requirements](../specs/quest-cli-functional-requirements.md)
already commit Quest to "a forced full rebuild exists as a documented escape
hatch" (`FR-PROJ-5`), and the black-box corpus already specifies its
behavior: `BB-08` requires that "an explicit forced full rebuild (distinct
from incremental resume) is also available and produces the same
state-equivalent result, as a documented escape hatch," invoked precisely
when incremental resume (`BB-07`) has been interrupted repeatedly or when
staleness/drift is detected and doubted (`FR-PROJ-1`, `FR-PROJ-6`). That
escape hatch has no stated cost today — this is what a scale target supplies.

The CLI layer's own obligations frame the budget: commands render a result
synchronously to a human or a JSON envelope (architecture Spec, "Layers"),
so a rebuild a user triggers by running a command is subject to ordinary
interactive-CLI patience, not a background-job tolerance, at the scale this
document proposes as ordinary. The glossary already flags the escape valve
for the case that exceeds it: "an operator may be asked to confirm scope for
a very large or multi-workspace rebuild (a UX candidate, not fixed here)"
(glossary, "Projection rebuild after loss or corruption" workflow row) — this
document does not fix that UX, only the scale threshold at which it stops
being optional.

**Proposed design point:**

- **At the ordinary per-workspace design point** (10,000 records / roughly
  100,000-150,000 events): a forced full rebuild should complete in **low
  single-digit seconds**, consistent with a full replay of a Git-tracked
  event history of that size on ordinary developer hardware, and without
  requiring the operator-confirmation UX the glossary already flags as a
  candidate.
- **At the proposed aggregate bound** (roughly 25 workspaces at the same
  per-workspace design point, i.e. a rebuild spanning most or all enrolled
  workspaces at once): a forced full rebuild should complete within **a low
  number of minutes**, at which point the glossary's operator-confirmation
  UX candidate stops being optional and becomes a requirement this document
  recommends a future task adopt rather than defer indefinitely.

A design that cannot meet the ordinary-scale budget by replaying full Git
history on every forced rebuild is itself evidence the projection needs a
durable, incremental checkpoint rather than relying on full replay as its
only recovery path — which is exactly the question the next section answers.

### What this implies for the projection port's transactional-semantics question

The architecture Spec leaves open "does the projection port need
transactional semantics, or is rebuild-on-doubt sufficient? This trades
implementation complexity against rebuild cost and cannot be settled before
the scale target (D5)." With a scale target now proposed, this document's
reasoned answer — for the owner to rule on, not a settled decision — is:

**Rebuild-on-doubt remains sufficient as the primary recovery mechanism at
the design points proposed above, and full ACID-style cross-record
transactional semantics are not implied by this scale target.** A full
replay of a Git-tracked history at the proposed per-workspace order of
magnitude (10,000 records, 100,000-150,000 events) is estimated to complete
inside the proposed rebuild time budget, because Git itself is optimized for
exactly this access pattern (sequential history read) at this order of
magnitude. Choosing rebuild-on-doubt over a durable transactional index at
this scale is the cheaper implementation, and the scale target does not force
the more expensive one.

That said, two things this scale target does **not** change, because they
were already settled independent of it, and this document restates rather
than reopens them:

- `FR-PROJ-3` and `FR-PROJ-4` already require an interrupted
  synchronization/refresh to resume from its last durably-recorded progress
  point rather than restart from zero or silently skip events (`BB-07`,
  `BB-08`). That is itself a narrower, already-accepted form of durable
  write — a monotonic checkpoint of *how far the projection has read*, not a
  transactional guarantee over the projection's own record contents. This
  scale target does not add to or relax that requirement; it only says a
  *full* rebuild, invoked as the documented escape hatch rather than an
  incremental resume, stays affordable enough that Quest is not forced to
  make incremental resume the *only* viable recovery path.
- This conclusion is scale-dependent by construction, and is expected to
  invert if a future owner ruling sets the target meaningfully higher than
  this document proposes — for instance, at anything closer to a
  multi-tenant or hosted-portfolio scale, which the charter currently routes
  outside this component entirely (see "Repository (workspace) count,"
  above). At that scale, a full-history replay would plausibly exceed any
  acceptable rebuild budget, and durable, incremental, transactional index
  semantics would stop being optional. Because that scale is explicitly out
  of this component's chartered scope today, this document does not propose
  designing for it.

### Why no storage or index engine is chosen here

Two independent reasons, either of which is sufficient on its own:

1. **Register D2 (runtime and native packaging) is blocked, structurally
   post-activation** — "no task owned it as of 2026-08-04" and it unblocks
   only once completed Lore evidence is reviewed after the release gate
   opens. A concrete storage or index engine is chosen in the vocabulary of
   a runtime — an embeddable library, a file format, a language binding —
   none of which this Spec's runtime-neutral architecture can name before D2
   is settled ([architecture Spec](../specs/quest-cli-architecture.md),
   "deliberately runtime-neutral... nothing here names a language, a build
   system, a library, or a storage engine").
2. **The research programme Spec prohibits it directly**: "freezing
   runtime... packaging, supported-platform, or integration choices whose
   required Lore evidence is unfinished" is listed as prohibited work before
   activation. An engine choice made now, ahead of D2, would be exactly such
   a freeze — the
   [component contracts and delivery graph](quest-cli-component-contracts-and-delivery-graph.md)'s
   projection contract itself carries an "Explicitly open" line naming both
   items together ("scale target; any concrete storage or index engine for
   the projection"), citing the research programme Spec's Open Questions as
   its own basis, and this document closes only the first one, proposed for
   owner ruling.

This document's scale target and rebuild time budget are precisely the
sizing inputs a future engine choice will need — that is what makes settling
D5 a Phase 1 prerequisite for Phase 3 (open component decisions register,
register table: "D5 | Scale target | Open | Component | A Phase 1
decision | Phase 3 storage and index design") — but supplying those inputs is
not the same act as spending them on a choice, and this document does only
the former.

### Summary: proposed figures for owner ruling

| Dimension | Proposed design point | Traces to |
| --- | --- | --- |
| Record count | ~10,000 per enrolled workspace | This campaign's 41-record/5-day floor, scaled 1-2 orders of magnitude for a sustained multi-year project |
| Event count | ~100,000-150,000 per enrolled workspace | This campaign's ~2.6 commits/record floor, scaled to ~10-15 events/record for a full claim/renew/gate/deliver lifecycle |
| Repository (workspace) count | ~25 per Quest installation | Charter's multi-repo enrollment model, bounded by the charter's own non-hosted/non-portfolio scope |
| Clone count | ~5-10 per enrolled repository | Threat model's worktree/clone topology, generalizing `TM-03`'s two-clone minimum to a small-team count |
| Rebuild time budget (ordinary scale) | low single-digit seconds | CLI's synchronous/interactive obligation, at the record/event design points above |
| Rebuild time budget (aggregate, ~25 workspaces) | low minutes, operator-confirmation UX becomes non-optional beyond this | Glossary's already-flagged "very large or multi-workspace rebuild" UX candidate |

None of these figures is accepted by this document. Each is a proposal this
document's own reasoning chain supports, standing until an owner rules on
register D5 and a later reconciliation task (not this one) records that
ruling in the open component decisions register.

## Notes

This task read, and cites read-only, the open component decisions register,
the component contracts and delivery graph, the architecture Spec, the
functional requirements Spec, the research programme Spec, the component
charter, the component glossary, the Git/filesystem/concurrency threat model,
the black-box acceptance scenarios, and the Backlog migration fidelity
contract. It edited none of them. It created no ADR and recorded no decision
as accepted. The self-hosted figures cited above (41 task records, 106/62/146
commit counts) were independently re-derived in this worktree via `ls
backlog/tasks | wc -l` and `git log --oneline -- <path> | wc -l` on
2026-08-05, and are dated observations rather than standing facts, per this
corpus's own recheck discipline.
