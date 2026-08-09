---
id: doc-14
title: Backlog campaign tracker
type: other
created_date: '2026-08-08 21:44'
updated_date: '2026-08-09 02:53'
---
# Backlog campaign tracker

Protocol: restore -> recompute the ready/conflict graph from Backlog -> acquire
worktrees -> mark the acquired members dispatched -> implement + review in
parallel -> serialize the merge -> settle tasks and write this doc once more ->
loop until the queue is empty or blocked -> write handover.

## Why this campaign exists — the pivot

doc-13 closed having resolved two tasks, both about the campaign machinery
itself. Asked directly whether the project was still working on docs and when
implementation could start, the honest answer was that the last eleven completed
tasks (QCLI-43..QCLI-53) had all been process and convention work, and that the
repository contains **zero product source** — 86 backlog files, 47 docs files,
and no `src/`, no tests, no entry point.

This campaign is scoped by the user to exactly one thing: **the issues required
to begin implementation.** Campaign-tooling work is deliberately excluded except
where it would halt this campaign itself.

## The gate situation, established at init by reading the corpus

A correction the init investigation produced, worth stating because the earlier
framing was wrong:

- **The Lore-owned gate is already open.** Its owner accepted the Lore `0.1.1`
  release boundary in `LDOC-4` on 2026-08-06, and `lore-doc`'s gate Spec reports
  the result as **open** — read as the owner's own conclusion, per
  `docs/reference/quest-cli-activation-gate-evidence-record.md`.
- **CLAUDE.md's packaging prohibition is not arbitrary.** It restates the
  research programme Spec's "Prohibited work before activation" list. The gate
  binds it, so it is amended by establishing activation, never by routing around.
- **But an open Lore gate is not activation.** The evidence record says so
  explicitly. This repository still owes its own Phase 0 recheck, and that
  recheck clause is emphatic: a worker must re-run every command, must not reuse
  the 2026-08-05 capsule, and must **never** compute a Pass/Fail itself — only
  read the owner's own live statement.
- The pins have moved twice. The capsule pins `lore-doc` at `45d0d90f68a6` and
  notes it advanced to `d2a9a9e11ddf`; a read-only spot check on 2026-08-08 found
  HEAD `101f9bb`. The recheck is genuinely owed, not a formality.
- Phase 1 is nearly closed. Envelope shape, exit-code table, identifier grammar,
  license, platform, scale target, and anomaly placement are all recorded
  **Closed**. What remains Quest-owned is one standing pin re-verification
  (QCLI-57) and D2, the runtime, which is **owned but not closed** (QCLI-58).
- Two open items are explicitly **not Quest's to decide**: D6's product-wide
  actor model belongs to `quest-doc`, and the `lore-doc` half of the not-found
  convention belongs to that owner. A phase that decides either unilaterally has
  overstepped. Neither is in this queue.

## Confirmed queue order

Confirmed by the user on 2026-08-08. This is the wave-builder's tie-break, NOT a
guarantee that any task lands in any particular wave.

1. QCLI-56 — Discharge the Phase 0 activation recheck (the gating task)
2. QCLI-57 — Re-verify the Backlog.md v1.49.3 pin
3. QCLI-58 — Assemble a decision-ready D2 runtime proposal
4. QCLI-59 — Amend CLAUDE.md, conditional on a verified Pass
5. QCLI-60 — Push the orchestrator's bookkeeping commits (tooling; see below)

## Frontier

**CAMPAIGN COMPLETE — 2026-08-08.** All five queued tasks resolved across two
waves. Queue: **0 campaign tasks remaining**, 0 in flight, 0 blocked, 0
needs-human. The two `To Do` tasks left in Backlog (QCLI-54, QCLI-55) are
unlabelled and were scoped out at init — see "Deliberately excluded".

The ready set is ALWAYS recomputed live at the start of every restore/wave —
never trust a persisted "next wave" plan.

**The gate is confirmed open, the Phase 0 recheck is discharged** (QCLI-56,
`1962d2a`), **the D2 runtime comparison is assembled and awaiting the owner's
ruling** (QCLI-58, `f123b9b`), **and CLAUDE.md's pre-activation prohibition is
narrowed** (QCLI-59, `34a1c36`). What remains before a first line of product
source is a **user decision, not a task** — see "What actually blocks
implementation now".

## Dependency and conflict structure

One native dependency: **QCLI-59 depends on QCLI-56**, declared with `--dep`,
because CLAUDE.md may only be amended once the recheck establishes what is true.
That ordering is the mechanism; the conditional inside QCLI-59 is the actual
obligation — a `Done` predecessor whose capsule reports anything other than Pass
still means do not amend.

Conflicts, by cluster:

| Cluster | Tasks | Primary file target |
| --- | --- | --- |
| `cluster:gate` | QCLI-56 | `docs/reference/quest-cli-activation-gate-evidence-record.md` |
| `cluster:decisions` | QCLI-57, QCLI-58 | both may touch `docs/reference/quest-cli-open-component-decisions.md` |
| `cluster:governance` | QCLI-59 | `CLAUDE.md` |
| `cluster:skill-docs` | QCLI-60 | `.claude/skills/backlog-handover/**` |

QCLI-57 and QCLI-58 share a cluster because both may edit the open component
decisions register — a real file-level conflict, so they serialize. Every other
pair is disjoint, which made this the first campaign in this series to run
genuinely parallel waves rather than degrading to size 1.

## Driver defect — FIXED as of wave 2

QCLI-60 merged at wave-1 settlement (`49bcae9`), so the defect below is **no
longer active**. Recorded for the history it explains.

While it was unfixed, `reference/wave-loop.md` (d) step 4 committed the
dispatch-marking pass on `<default>` without pushing it; the squash-merge then
folded that commit's content into the merge commit and local `<default>`
diverged, halting (g) step 5. **Wave 1 applied the push by hand** as a deliberate
workaround. **Wave 2 was the first wave where that push was the merged
procedure** rather than a hand-applied workaround — dispatch-marking commit
`7718da8` and in-flight-pointer commit `a801c54` were both pushed to `origin/dev`
before any worker was dispatched or any worktree re-pinned. Both `--ff-only`
syncs in wave 2's merge walk landed as clean fast-forwards.

## Clusters

| Cluster label | Covers | Tasks |
| --- | --- | --- |
| `cluster:gate` | The activation-gate evidence record | QCLI-56 |
| `cluster:decisions` | Phase 1's remaining Quest-owned decision surface | QCLI-57, QCLI-58 |
| `cluster:governance` | CLAUDE.md's prohibition text | QCLI-59 |
| `cluster:skill-docs` | The backlog-handover skill's own mechanics | QCLI-60 |

## Deliberately excluded

QCLI-54 and QCLI-55 remain filed, `To Do`, and **unlabelled**, so the ready-set
computation never considers them. Both are campaign-tooling documentation fixes,
not implementation blockers; the user scoped them out explicitly at init. The
four further proposals recorded in doc-13 are likewise unfiled. Nothing is lost —
all of it is available to a later campaign.

## In flight

None. Cleared at wave-2 settlement: both worktrees returned to the pool (6/6
`available`, zero leases), both branches deleted local and remote, no open PRs.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

_Empty — campaign complete._

## The wave-2 ruling — given 2026-08-08

**QCLI-59 was dispatched under an explicit user ruling.** Recorded here because
the ruling, not the dependency, is what released it.

At wave-1 settlement this doc recorded that QCLI-59's stated precondition was
satisfied but that a satisfied precondition is not an authorization, since both
authorities say an open Lore gate is not activation:

- `lore-doc`'s own gate Spec: opening the gate "removes the *Lore-owned*
  dependency and nothing else … A worker who reads this section as authorization
  to start writing Quest product source has misread it."
- This repository's evidence record: "An open Lore gate is not activation …
  every gate this repository holds in its own right — clean-room admission,
  research completeness, and the component activation checks in the delivery
  roadmap's Phase 0 — is untouched and still owed."

**What the wave-2 investigation found, before putting the ruling to the user.**
The three gates that sentence names were checked against the corpus rather than
taken at face value:

- The phrases "clean-room admission" and "research completeness" appear **nowhere
  else in `docs/`** as tracked criteria — only twice, both inside that same
  cautionary sentence (`grep -rn` over `docs/`). No checklist or exit criteria
  stand behind either.
- The Stories that carry that work are all `status: done`:
  `prepare-quests-clean-room-research-foundation`,
  `prepare-quest-cli-for-implementation-activation`,
  `establish-the-quest-cli-component-foundation`, and
  `ratify-the-quest-cli-phase-1-component-decisions`.
- The delivery roadmap's **written Phase 0 exit criterion** is the four-clause
  gate predicate itself — "All four clauses of the gate predicate hold at one
  live inspection boundary" — which is exactly what QCLI-56 verified.

Read together, that sentence looks like standing boilerplate repeated at every
boundary, not a live list of outstanding work. **This finding was recorded, not
acted on:** no document was amended on the strength of it, and QCLI-59's scope
stayed CLAUDE.md alone.

**The ruling.** Presented with that finding, the user authorized the amendment
and directed that wave 2 run both QCLI-58 and QCLI-59. The stated project goal
governing it: begin real implementation as soon as possible, but not before the
docs and tooling foundation is solid.

**What the ruling does not do.** It does not declare every Quest-side gate
discharged, and QCLI-59's amendment does not imply that. Phase 6 — publication,
release workflows, public install instructions, package reservation — stays
prohibited, and its entry additionally requires D2 and D3. `@opum-ai/quest`
remains unclaimed (`E404`, observed 2026-08-08).

## What actually blocks implementation now

Stated plainly, because this campaign existed to answer it.

**Nothing in Backlog.** The campaign queue is empty. What remains is a decision
only the owner can make, plus one hazard the wave itself created.

1. **D2 — the runtime — is undecided.** `QCLI-58` assembled the comparison and
   deliberately stops short of ruling. No product source, `package.json`, or
   `bin` entry can be written without naming a runtime.
2. **F1 below is unresolved.** As merged, `CLAUDE.md` permits exactly the
   artifacts that would decide D2 by construction. Until that is guarded or D2
   is ruled, the first worker to act on the permission closes the decision the
   owner reserved.

## Needs a human / blocked

None queued. Two known items are out of scope because they belong to other
owners, recorded here so a later session does not mistake them for oversights:

- **D6, the product-wide actor model** — must be authored into `quest-doc`. No
  task in any repository has done so. Phase 2 can build the gate *mechanism*
  without it; gate *actor eligibility* cannot be built without it.
- **The `lore-doc` half of the not-found convention** — needs that owner.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed.

### From wave 2's integration review

**F1 — HIGH — the wave permits the act that silently closes D2.**
`CLAUDE.md`'s "Now permitted" bullet lists `package.json`, a `bin` entry, and
runtime dependencies, and attaches D2 only to Phase 6. But none of those three
can be written without naming a runtime, so **the first worker acting on the
permission decides D2 by construction** — the exact ruling `QCLI-58` reserved for
the owner, and what the roadmap itself calls "an undocumented decision, which is
worse than a delay." Two documents inside the same wave diff say D2 binds
earlier: the open decisions register's D2 **Needed for** cell reads "Phases 2
and 6", and this tracker said D2 is "the one substantive thing standing between
this repository and its first line of product source."
*Verified directly at settlement:* register cell reads "Phases 2 and 6";
roadmap phase table (`:77`) lists Phase 6 against "Phase 0; D2 and D3" and Phase
2 against "Phase 1; Phase 0 for any code". So the register/roadmap disagreement
on whether D2 gates Phase 2 **predates this wave** — the wave is what made it
operative.
*Narrow fix:* one clause guarding the permitted bullet — permitted, but the
first artifact naming a runtime closes D2, so the owner's D2 ruling lands first
(or is explicitly declared unnecessary). *Real work:* reconciling the
register/roadmap disagreement itself.

**F2 — MED — `docs/index.md:22-23` is now false.** It reads "Product source and
runtime dependencies remain gated on the full Lore release." The Lore release
happened (`@opum-ai/lore@0.1.1`, accepted 2026-08-06) and `CLAUDE.md` now permits
both. Docs-bundle front door, operative prose, so correct-in-place applies.
*Verified directly at settlement.* Narrow fix: amend in place citing `QCLI-59`.

**F3 — MED — `docs/runbooks/quest-cli-research-handover.md` instructs the
opposite of `CLAUDE.md`.** Step 4 (`:46-48`) and, worse, its **ready-to-paste
prompt** (`:75`) both say "Do not add product source, runtime dependencies,
package scaffolding…" conditioned on a gate that has now passed — so it
propagates a spent prohibition verbatim into fresh sessions. Narrow fix.
Separately (`:57`) it names a gate **no other document in the repo names**:
"Implementation remains prohibited until `quest-doc`'s canonical handover **and**
the current Lore-owned release gate both pass." Whether that `quest-doc` handover
is a live outstanding gate or dead runbook prose is **real work** — and it bears
directly on whether implementation may begin.

**F4 — LOW — same-session date skew.** QCLI-58's artifacts date the wave
2026-08-09 (UTC); QCLI-59 and this tracker date it 2026-08-08 (local, `-05:00`).
Both landed in one session. Reads as the proposal postdating an amendment marked
"unreconciled as of 2026-08-08". Narrow fix: mark the two unqualified register
mentions as UTC.

### Carried from wave 1, still unfiled

1. **`reference/templates.md` should tell workers not to run `lore sync`.**
   QCLI-56's first worker ran it inside a task branch — the QCLI-43 form
   violation. Effect was benign, but `templates.md` contains zero occurrences of
   "lore" while `backlog/config.yml` sets `auto_commit: false`, making `lore
   sync`'s auto-commit the advertised way to persist Backlog writes.
2. **A shell-portability nit in the open component decisions register.** The
   `npm view backlog.md time['1.49.3']` command is correct under its `bash` fence
   but zsh glob-expands the brackets and returns "no matches found," which reads
   as "the version is gone." Quoting the argument fixes both.
3. **Qualify the evidence record's "still owed" sentence.** Per the wave-2 ruling
   section above, it names clean-room admission, research completeness, and the
   roadmap's Phase 0 component checks as gates "untouched and still owed," but
   the first two are undefined anywhere else in the corpus and their Stories are
   `status: done`, while the third's written exit criterion is the very predicate
   QCLI-56 verified. The sentence appears twice (lines 257 and 405). Because the
   record is a dedicated evidence record, `QCLI-45` preserve-and-amend governs:
   any correction is a dated, superseded-marked appended note citing its
   directing task, never an in-place rewrite.

Also recorded, deliberately **not** proposed: QCLI-56's stale frontmatter
(`summary:`/`timestamp:` still say 2026-08-05). Its reviewer declined to file a
follow-up, reasoning that under preserve-and-amend the follow-up would itself
need a dated amendment plus a QCLI-44 citation, for a metadata line that
misstates no observed fact. Fold into a general docs-metadata sweep if one ever
runs.

## Wave log

### Wave 1 — QCLI-56, QCLI-57, QCLI-60 — settled 2026-08-08

**The first genuinely parallel wave in this campaign series.** Three tasks, three
disjoint clusters, three worktrees, implemented concurrently and reviewed
pipelined per completed implementer rather than behind a wave-wide barrier. Base
`0f2c537`; marking commit `b332669`.

| Task | Merged | Review passes | Outcome |
| --- | --- | --- | --- |
| QCLI-56 | `1962d2a` (PR #70) | `request_changes` → `approve` | 7/7 ACs |
| QCLI-57 | `5c24b48` (PR #71) | `request_changes` → `approve` | 6/6 ACs |
| QCLI-60 | `49bcae9` (PR #72) | `request_changes` ×2 → `approve` | 9/9 ACs |

**The campaign's gating result.** QCLI-56 discharged the Phase 0 recheck. The
owner reports the gate **open** — "All four predicate items are satisfied at one
live inspection boundary", `LDOC-4` Done — and the vocabulary gap between that
and the clause's literal "Pass" was closed from the owner's *own* Authority table
("Receive a **pass/fail** gate result"), so the record reports a Pass without this
repository computing one. Preserve-and-amend was proved mechanically: `168 0`,
zero deletions, lines 1–293 byte-identical to `dev`.

**Every task needed its review.** Three findings that would each have shipped a
falsehood or a hazard:

- QCLI-60's recovery procedure proved *class membership* and then ran
  `reset --hard`. For a mid-wave in-flight-pointer commit — which lands after the
  worktree re-pin and so rides no branch into the squash — that would have
  destroyed the campaign doc's in-flight table, the very crash-recovery signal R2
  depends on.
- QCLI-57 classified `time.modified` as an immutable anchor. It is a moving
  reference: the packument's last-modified time, 328ms from `1.49.3`'s actual
  publish timestamp and advancing on any later package write.
- QCLI-56 stated `lore-cli` had "advanced twice" when it had advanced 25 commits
  across 6 merged PRs — a wrong number in a record whose stated value is fidelity,
  which a default squash body would have carried onto `dev` permanently.

**The gate corrected itself, twice.** QCLI-60's implementer overruled the
reviewer's proposed content-presence check, showing the suggested path-diff
false-positives on the dispatch-marking case; the reviewer verified the objection
against real history and adopted the implementer's version over its own. QCLI-56's
fixer declined a reviewer-suggested frontmatter edit after discovering the
document asserts "nothing above is edited or re-tensed" about itself.

### Wave 2 — QCLI-58, QCLI-59 — settled 2026-08-08 — CAMPAIGN COMPLETE

Base `a0ba453`; marking commit `7718da8`, committed **and pushed** before
dispatch — the first wave to do so as merged procedure rather than wave 1's
hand-applied workaround. Two disjoint clusters, implemented concurrently,
reviewed pipelined per completed implementer.

| Task | Merged | Review passes | Outcome |
| --- | --- | --- | --- |
| QCLI-58 | `f123b9b` (PR #73) | `request_changes` → `approve` | 7/7 ACs |
| QCLI-59 | `34a1c36` (PR #74) | `request_changes` → `approve` | 6/6 ACs |

**Both reviews caught a defect that would have shipped a falsehood.**

- **QCLI-58: Deno presented as costless.** Its one disclosed limitation —
  partial npm compatibility via `npm:` specifiers — appeared once at L68 and in
  *none* of the three comparison tables, including the summary table an owner
  actually rules from. Every other candidate's drawback was carried through. No
  recommendation appears anywhere, so the document satisfied "decides nothing"
  in wording while tilting the comparison in substance — the precise failure a
  decision-grade document must not have. Pass 2 proved the cure mechanically:
  a diff filtered for added/removed `| Node.js`, `| Bun`, and `| Compiled` rows
  returned **0**, so no sibling candidate was softened to compensate.
- **QCLI-59: a present-tense unconditional prohibition left standing.**
  `CLAUDE.md` would have shipped saying, in one block, that the prohibition
  blocks product source until Phase 0 passes / that Phase 0 is not re-evaluated
  / that product source is now permitted. The worker's own AC#6 sweep was too
  narrow to catch it; the reviewer's wider sweep did.

**Both reviewers independently surfaced the same larger divergence** from
opposite sides: amending `CLAUDE.md` alone leaves
`docs/specs/quest-cli-pre-implementation-research-program.md` and
`docs/specs/quest-cli-delivery-roadmap.md` still prohibiting product source
outright. Two agents converging on it from different tasks is corroboration, not
one reviewer's framing. Disposition, by explicit orchestrator ruling: **named,
marked unreconciled, left open** — no agent declared CLAUDE.md supreme over a
Spec, or the reverse.

**`merge-pending`'s point-of-action edit was exercised for the first time.**
`QCLI-51` recorded that this transition had never been run in a recorded wave,
only inferred safe by analogy to `in-review`. It behaved as specified:
label-only diff, confirmed, discarded as soon as that task's own review reached
a terminal verdict (`QCLI-53`'s per-task trigger), with the orchestrator's
`<default>` checkout clean before and across the whole merge walk.

**Two stale-figure corrections, both caught by reviewers, not by workers.**
Each fix worker copied its pre-fix `git diff dev...HEAD --stat` forward into a
verification note labelled as run *after* the fix: QCLI-58's said 367/3 when it
was **391/3** (proposal 325 lines, not 318); QCLI-59's said 103/8 when it was
**162/8**. Both scope conclusions were right; only the counts were wrong. The
QCLI-58 figure propagated into the orchestrator's own pre-merge check before the
reviewer corrected it — recorded because a verification record that is wrong
while claiming to be freshly run is exactly the defect class these notes exist to
prevent.

**Wave-level integration review** returned 1 HIGH, 2 MED, 2 LOW, all recorded as
proposed follow-ups above. It also confirmed QCLI-58's own prohibition sentences
remain true on `dev` (each is scoped to "by this task" or asserts a fact about
the research programme Spec, whose list is unchanged), that nothing was
scaffolded (no `package.json`, `bin/`, `src/`, lockfile, tsconfig, or any
`.ts/.js/.go/.rs` file, tracked or untracked), that no published/installable
claim was introduced, and that the register and proposal agree with neither
implying a runtime was chosen. It also cleared several documents explicitly,
notably the packaging contract (whose "may be drafted … must not be described as
reserved, live, or installable" split matches the amendment's) and the functional
requirements Spec (whose prohibition was written conditionally on the Lore gate
reporting Pass, so it self-released and now agrees with `CLAUDE.md`).
