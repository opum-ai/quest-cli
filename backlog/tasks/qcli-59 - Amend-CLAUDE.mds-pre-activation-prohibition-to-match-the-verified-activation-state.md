---
id: QCLI-59
title: >-
  Amend CLAUDE.md's pre-activation prohibition to match the verified activation
  state
status: In Progress
assignee: []
created_date: '2026-08-08 21:42'
updated_date: '2026-08-09 02:05'
labels:
  - campaign
  - 'cluster:governance'
  - wave-2
dependencies:
  - QCLI-56
priority: high
type: chore
ordinal: 78000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

`CLAUDE.md` states: "**do not create the thing that would make the description true**: no `package.json`, no `bin` entry, no install instructions, no package reservation, no release. Describing nothing while adding scaffolding satisfies the wording and breaks the rule."

That text is a restatement of the research programme Spec's **"Prohibited work before activation"** list. It is not arbitrary — it is the pre-activation gate expressed as a working rule. But as written it blocks the first commit of any implementation, so it must be amended rather than ignored or routed around once activation is actually established.

## The conditional, which is the whole point of this task

**This amendment is made only if `QCLI-56`'s recheck capsule records the gate's owner reporting Pass.** If the recheck does not establish that — because an input is stale, missing, contradictory, or because `lore-doc` has not said it — then `CLAUDE.md` is left exactly as it is and this task records why. A worker must not amend on the strength of the 2026-08-06 open-gate report alone: the activation-gate evidence record states plainly that **an open Lore gate is not activation**, and `QCLI-56` exists precisely because this repository's own Phase 0 obligation is separate.

The dependency on `QCLI-56` is declared natively, so this task cannot be dispatched until that one is `Done`. That ordering is the mechanism, but the conditional above is the actual obligation — a `Done` predecessor whose capsule reports anything other than Pass still means "do not amend."

## Scope of the amendment, if made

Narrow and asymmetric:

- **Becomes permitted:** product source, executable scaffolding, a `package.json`, a `bin` entry, runtime dependencies — the things Phase 2 needs to exist at all.
- **Stays prohibited:** package publication, release workflows claiming readiness, public install instructions, and package reservation. Those are Phase 6, whose entry additionally requires D2 and D3, and `@opum-ai/quest` remains unclaimed (`E404`, observed 2026-08-08).

The amendment must not introduce any claim that `@opum-ai/quest` is published, installable, or released — that half of the CLAUDE.md rule is about truthful description and survives activation untouched.

## Convention question the worker must resolve

`CLAUDE.md` is operative current guidance, not a dated evidence record, so the correct-in-place branch of the supersession rulings applies rather than preserve-and-amend. The worker should reason this out explicitly against the record-vs-current-assertion test rather than assume it, and must cite the directing task per the `QCLI-44` ruling.

## Origin

Filed 2026-08-08 with the user's explicit approval at doc-14 init, which included the explicit instruction that this amendment be conditional on a verified Pass.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The amendment is made only if QCLI-56's capsule records the gate's owner reporting Pass; if it does not, CLAUDE.md is left unchanged and the task records the observed state and why it did not amend
- [ ] #2 If amended, product source and executable scaffolding become permitted while package publication, release workflows, public install instructions, and package reservation remain prohibited pending Phase 6
- [ ] #3 The amendment cites QCLI-56's capsule and names this directing task, per the QCLI-44 citation ruling
- [ ] #4 The worker states its reasoning for treating CLAUDE.md as current guidance (correct-in-place) rather than an evidence record (preserve-and-amend), against the record-vs-current-assertion test rather than by assumption
- [ ] #5 No claim that @opum-ai/quest is published, installable, or released is introduced anywhere
- [ ] #6 A sweep confirms no remaining passage in CLAUDE.md asserts the pre-activation prohibition as unqualified current state; method and results recorded in the task notes
<!-- AC:END -->
