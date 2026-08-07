---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI activation-gate evidence record
tags:
  - quest
  - cli
  - activation-gate
  - evidence
  - lore
  - gate
summary: "Quest-cli's clause-4 record of the evidence and time it consumed from the Lore-owned release-gate predicate, live-verified 2026-08-05."
timestamp: 2026-08-05T15:28:15.750Z
---

# Quest CLI activation-gate evidence record

This Reference is `QCLI-11`'s output: quest-cli's own record of clause 4 of the
Lore-owned release-gate predicate — "`quest-cli` records the exact evidence it
consumed and the decision time" — per the
[delivery roadmap](../specs/quest-cli-delivery-roadmap.md#phase-0--activation-precondition)'s
naming of this task as that clause's obligation. It supersedes nothing: no
prior document in this repository recorded a clause-4 evidence capsule before
this one.

**What this record does not do, stated up front because the task that
produced it forbids it:** it does not evaluate the gate, does not compute or
infer a Pass/Fail result of its own, and does not open implementation. The
gate decision belongs to `lore-doc` and its task `LDOC-4`; a consumer
repository — this one — cannot infer it. Every result stated below is either
a literal quote of what the gate's own owner has already said, or a dated
observation of an input the predicate depends on, never a conclusion this
document draws from those observations.

## Details

### The predicate this record answers to (quoted from its owner)

Quoted verbatim from `lore-doc`'s
[Quest integration and Lore release gate](https://github.com/salient-data/lore-doc/blob/dev/docs/specs/quest-integration-and-lore-release-gate.md)
(Spec, `lore-doc`, local clone `/Volumes/external/repos/lore-doc`, HEAD
`45d0d90f68a6c471365494155f1fcae5b7d01196` as read 2026-08-05 — a moving
reference, re-verify before relying; the predicate section itself was last
touched by commit `32cb28567453a35c8c9f2e7687f730ca501fab21`,
2026-08-01T13:30:53-05:00, unchanged since):

> Quest product implementation remains inactive unless all of these
> statements are true at the same live inspection boundary:
>
> 1. the owner has accepted the then-current Lore release boundary in
>    `LDOC-4`;
> 2. `lore-cli`'s live Backlog, release documentation, artifact metadata, and
>    immutable publication evidence agree that boundary is complete;
> 3. no relevant owner-held blocker or contradictory handover remains; and
> 4. `quest-cli` records the exact evidence it consumed and the decision
>    time.
>
> Any false, stale, missing, or contradictory input makes the result
> **closed**. A dated `lore-doc` snapshot, a local build, task files alone, or
> the existence of Quest documentation cannot open the gate.
>
> At the 2026-08-01 audit boundary the gate was closed: no Lore Git tag
> existed, the inspected package version was `0.0.0`, the public npm lookup
> returned `E404`, and unresolved release records remained. These are dated
> observations, not a replacement for the next live check.

This record satisfies clause 4 alone. Clauses 1–3 are quoted here only so the
evidence table below can be organized against them; this document asserts no
disposition of clauses 1–3, which are `lore-doc`'s to rule on.

**Local-clone note:** `lore-doc`'s working tree at the path above carried one
uncommitted, unrelated line at read time — a stale `salient-data/quest-cli`
canonical-owner link in this same file's "Summary" section, edited locally
(not yet committed) to `opum-ai/quest-cli`. The predicate text quoted above is
identical in both the committed `HEAD` and the working tree; only that
unrelated link line differs. Recorded under "Discrepancies found," below, as
an out-of-scope discovery — this repository does not edit `lore-doc`.

### Evaluation boundary

All observations below were captured live in one narrow inspection window on
**2026-08-05, between 15:29:21Z and 15:29:23Z UTC** (`date -u` bracketing each
command, reproduced in full). This is an independent re-verification, not a
copy of the 2026-08-04 figures already recorded in this repository's
[Lore dependency and adapter contract evidence](quest-cli-lore-dependency-and-adapter-contract-evidence.md)
(`QCLI-2.7`) or [packaging contract](quest-cli-packaging-contract.md)
(`QCLI-2.9`) — both cited read-only below for comparison, neither restated or
overridden.

quest-cli's own consumed revision at the time of this evaluation: this
worktree's `HEAD` `bb70619922dff171f479e68fa7de949b03d4b3a1` (branch
`feat/qcli-11-activation-gate-evidence-record`), remote
`git@github.com:opum-ai/quest-cli.git`, clean except for this task's own
in-progress edits (`git status --short`).

### Evidence consumed

| Clause | Input | Repository / revision / path | Literal command | Observation (2026-08-05, 15:29:21Z–15:29:23Z UTC) |
| --- | --- | --- | --- | --- |
| 1 | Owner acceptance of the Lore release boundary | `lore-doc`, task `LDOC-4`, local clone `/Volumes/external/repos/lore-doc`, task file last touched `18f019966323b58f11d058d261903242eacf9440` (2026-08-01T13:22:43-05:00) | `backlog task view LDOC-4 --plain` | `Status: To Do` (`Updated: 2026-08-01 18:20 UTC`) — moving reference, re-verify before relying. No acceptance criterion checked. Unchanged since the last dated observation this repository holds (`QCLI-2.7`, 2026-08-04). |
| 1 | Predicate text itself (does the clause still read as quoted?) | `lore-doc`, `docs/specs/quest-integration-and-lore-release-gate.md`, HEAD `45d0d90` | `git rev-parse HEAD`; `git log -1 --format='%H %cI %s' -- docs/specs/quest-integration-and-lore-release-gate.md` | `45d0d90f68a6c471365494155f1fcae5b7d01196`; predicate section last touched `32cb285`, 2026-08-01T13:30:53-05:00 — immutable anchor for that revision; unchanged since. |
| 2 | `lore-cli` Git tag existence | `lore-cli`, local clone `/Volumes/external/repos/lore-cli` | `git tag -l -n1` | `v0.1.0` (`e621d209be2cc8867d1c38c7c78b4b4acc96d82e`, per `QCLI-2.7`'s prior pin) **and** `v0.1.1` ("Release v0.1.1") — a tag not present in this repository's last capsule (`QCLI-2.7`, 2026-08-04, which pinned only `v0.1.0`). Immutable anchor once tagged; the *existence* of a second tag since the last capsule is the changed fact, flagged under "Discrepancies found," below. |
| 2 | `lore-cli` current HEAD | `lore-cli`, local clone | `git rev-parse HEAD` | `dae32ed73bfedbc0f40bb3eb1c886a2dbb5499eb` — moving reference, re-verify before relying. |
| 2 | Published package version | public npm registry, `@opum-ai/lore` | `npm view @opum-ai/lore version` | `0.1.1` — moving reference (a registry lookup); differs from the `0.1.0` this repository's last capsule recorded (`QCLI-2.7`, 2026-08-04) and from the `0.0.0` the gate's own 2026-08-01 audit-boundary text names. Flagged under "Discrepancies found," below. |
| 2 | Target Quest package occupancy (context only — not a clause-2 Lore fact, reproduced because the task description's `0.0.0`/`E404` framing names it) | public npm registry, `@opum-ai/quest` | `npm view @opum-ai/quest version` | `npm error code E404` — unclaimed. Unchanged since this repository's packaging contract observed the same on 2026-08-04 (`QCLI-2.9`). |
| 3 | Named owner-held blocker on trusting a future Lore release the way `0.1.0`/`0.1.1` were | `lore-cli`, task `LCLI-278`, local clone, task file last touched `4182745ab741dbca59d91443c6e3b233dfe64a84` (2026-08-03T20:06:38-05:00) | `backlog task view LCLI-278 --plain` | `Status: To Do` (`Updated: 2026-08-04 01:05 UTC`) — moving reference, re-verify before relying. Unchanged since this repository's last observation (`QCLI-2.7`, 2026-08-04): GitHub's billing plan still blocks required-reviewer protection on the `release` Environment; `publish: true` remains prohibited. |
| 4 (this record) | quest-cli's own consumed revision | this repository, this worktree | `git rev-parse HEAD`; `git remote -v`; `git status --short` | `HEAD bb70619922dff171f479e68fa7de949b03d4b3a1`; `origin git@github.com:opum-ai/quest-cli.git`; clean except this task's own in-progress edits. |

### The gate result, as reported by its owner

The only gate-result statement `lore-doc` has made, in its own words, is the
2026-08-01 audit-boundary text quoted above: **closed**, because no Lore Git
tag existed, the inspected package version was `0.0.0`, the public npm
lookup returned `E404`, and unresolved release records remained.

`lore-doc` has issued no newer explicit gate-result statement as of this
record's evaluation boundary: the predicate section of its own Spec is
unchanged since 2026-08-01 (see the evidence table), and `LDOC-4` — the sole
task through which a new determination would be recorded — remains `To Do`
with no acceptance criterion checked, live-confirmed 2026-08-05.

This record states that, and only that. It does not compute a new gate
result from the changed inputs found below (a second `lore-cli` tag, a
`0.1.1` npm release); a changed input is a new fact for `lore-doc`/`LDOC-4`
to rule on, exactly as the task that produced this record requires, not
grounds for this repository to assert the gate has opened, closed
differently, or moved at all.

### Discrepancies found

Two changed facts and one stale reference, none acted on:

- **`lore-cli` has released `v0.1.1`, one release beyond this repository's
  last recorded pin.** This repository's [Lore dependency and adapter
  contract evidence](quest-cli-lore-dependency-and-adapter-contract-evidence.md)
  (`QCLI-2.7`) and [packaging contract](quest-cli-packaging-contract.md)
  (`QCLI-2.9`), both dated 2026-08-04, cite only tag `v0.1.0` and npm
  `@opum-ai/lore@0.1.0`. Live re-verification here, 2026-08-05, finds tag
  `v0.1.1` and npm `@opum-ai/lore@0.1.1` (published, per `npm view
  @opum-ai/lore time --json`, at `2026-08-05T02:27:29.041Z`, GitHub release
  `publishedAt` `2026-08-05T02:29:23Z` per `gh release list --repo
  opum-ai/lore-cli`). This is precisely the class of "changed result" the
  task that produced this record names explicitly: it is recorded here as a
  new, dated fact and nothing more. It does not, by itself, establish that
  clause 2's "immutable publication evidence agree that boundary is
  complete" — that determination is `lore-doc`'s, made against its own
  accepted release boundary, which this record does not know and does not
  assert. This record neither treats the new tag as evidence the gate
  opened nor discounts it; it is named so `lore-doc` can rule on it with a
  current input rather than a stale one.
- **`LCLI-278` (the automated-publish control gap) remains open**, unchanged
  since 2026-08-04, per the evidence table above. A second tagged release
  landing without that control being resolved is itself worth `lore-doc`
  seeing alongside the tag/version fact above, not something this record
  weighs in either direction.
- **`lore-doc`'s own committed gate Spec still cites the stale
  `salient-data/quest-cli` canonical-owner link**, one paragraph away from
  the predicate text (see "Local-clone note," above) — a straightforward
  instance of the org-transfer-redirect hazard this repository's [research
  source register](quest-cli-research-source-register.md) already documents
  for other repositories. `lore-doc`'s working tree carries an uncommitted
  fix for this exact line at read time, so it may already be resolved by the
  time this record is next consulted; this repository does not edit
  `lore-doc` and records the observation only.

None of the three items above changes what this record states in "The gate
result, as reported by its owner": that section reports `lore-doc`'s own
words and `LDOC-4`'s own live status, unaltered by anything this record
independently observed. Per the task that produced this record, a missing,
stale, or contradictory input keeps the consumed result **closed**: this
record's own consumption of clause-2/3 evidence includes one item newly
missing from the last capsule (a second `lore-cli` tag, not previously
priced in) and one item unchanged and still open (`LCLI-278`); neither
converts to an assertion that the gate has opened, and this record makes
none.

### Trigger fired 2026-08-06: the pinned owner revision moved

The moving reference this record warned about has moved. `lore-doc` advanced
from HEAD `45d0d90f68a6` (read 2026-08-05) to `d2a9a9e11ddf`, and the gate
Spec's evidence section — not merely the surrounding prose — was rewritten:
its 2026-08-01 "no Git tag, package version `0.0.0`, npm `E404`" observations
were superseded as false, and the Spec now reports items 2, 3, and 4 of the
predicate as satisfied.

`LDOC-4` is still `To Do`. The gate's owner has not accepted the release
boundary, so **the gate result is unchanged: closed.** Per this record's own
constraint, that sentence is a quote of the owner's position, not a
conclusion drawn here.

This note is a pointer to a changed input, nothing more. It does not re-run
the evidence table, does not refresh this capsule, and does not discharge the
recheck clause below — an activation session still owes every command in it.
Its purpose is to stop a future reader from trusting the `45d0d90f68a6` pin as
current. Recorded under `opum-doc`'s
[propagation Runbook](https://github.com/salient-data/opum-doc/blob/dev/docs/runbooks/propagate-component-evidence-to-dependent-decisions.md),
which names this repository a dependent of Lore release evidence.

### Recheck clause

A future activation session, or any session re-consulting this record, MUST
re-run every command in the "Evidence consumed" table above — not reuse this
capsule's 2026-08-05 output as current — and MUST separately obtain live
confirmation from `lore-doc`'s own owner-held evidence (a new `LDOC-4`
status, or a new explicit statement in the gate Spec) that the release-gate
predicate reports **Pass**, before treating implementation as active. A
changed result on any re-run (a new `lore-cli` tag or release, an `LDOC-4`
status change, a resolved or newly-opened `LCLI-278`, a claimed
`@opum-ai/quest`) is a new fact for `lore-doc`, as the gate's owner, to rule
on — never grounds for a worker in this repository to assert the gate has
opened, to compute a Pass/Fail from the recheck's own output, or to treat a
dated snapshot (this one included) as a substitute for that live check. This
mirrors the moving-vs-immutable-references and recheck-clause conventions of
the [research program Spec](../specs/quest-cli-pre-implementation-research-program.md#moving-vs-immutable-references).

## Notes

This task read, read-only: `lore-doc`'s
`docs/specs/quest-integration-and-lore-release-gate.md` and task `LDOC-4`
(local clone `/Volumes/external/repos/lore-doc`); `lore-cli`'s Git tags/HEAD
and task `LCLI-278` (local clone `/Volumes/external/repos/lore-cli`); the
public npm registry via `npm view` for `@opum-ai/lore` and `@opum-ai/quest`;
and, within this repository, the [delivery
roadmap](../specs/quest-cli-delivery-roadmap.md), [open component
decisions](quest-cli-open-component-decisions.md), [Lore dependency and
adapter contract evidence](quest-cli-lore-dependency-and-adapter-contract-evidence.md),
and [packaging contract](quest-cli-packaging-contract.md) — the last four for
comparison against prior dated capsules only, none of them modified by this
task. It ran no command that mutates `lore-doc`, `lore-cli`, or the public
npm registry; performed no package reservation, publish, or release action;
and added no product source, package metadata, runtime dependency, or
release artifact to this repository. It computed, inferred, or asserted no
gate result of its own.
