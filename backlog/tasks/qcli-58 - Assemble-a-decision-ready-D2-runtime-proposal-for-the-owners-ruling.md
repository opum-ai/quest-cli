---
id: QCLI-58
title: Assemble a decision-ready D2 runtime proposal for the owner's ruling
status: To Do
assignee: []
created_date: '2026-08-08 21:42'
updated_date: '2026-08-08 21:43'
labels:
  - campaign
  - 'cluster:decisions'
dependencies: []
priority: high
type: spike
ordinal: 77000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

D2 — the runtime choice — is the one Phase 1 decision recorded as **owned but not closed**. The license, platform, and runtime ownership record (`QCLI-27`) claims quest-cli ownership of the question; the choice itself was deferred as blocked pre-activation.

It is also the decision that most directly gates writing any product source at all: Phase 2 cannot produce code without knowing what it is written for, and Phase 6's entry names D2 and D3 explicitly.

## What this task is, and is not

**It does not decide.** D2 stays owned-not-closed until the owner rules. This task assembles the evidence and options so that ruling can be made against a real comparison rather than from memory, and the produced document must say plainly that it decides nothing.

The research programme Spec prohibits "freezing runtime ... choices whose required Lore evidence is unfinished." Lore's evidence is no longer unfinished — `@opum-ai/lore@0.1.1` is published and the Lore-owned gate is reported open — so preparing the comparison is allowed work. Freezing the choice is still the owner's act, not this task's.

## Inputs that must be weighed

- The recorded platform matrix: macOS, Linux, Windows, claimed as quest-cli-owned (`QCLI-27`).
- The packaging contract's constraints, including its mandatory release-time recheck clause.
- Lore's own shipped runtime — **as context whose relevance must be argued, not assumed.** Quest is a separate component with its own platform commitments; "Lore did X" is an input, not a reason.
- The architecture Spec's runtime-neutrality: it was authored deliberately runtime-neutral, so the proposal should identify which architectural boundaries a runtime choice would actually constrain and which it would not.

## Origin

Filed 2026-08-08 with the user's explicit approval at doc-14 init, in a campaign scoped to what is required to begin implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The proposal enumerates the candidate runtimes with their tradeoffs assessed against the recorded macOS/Linux/Windows platform matrix, citing QCLI-27 rather than restating it
- [ ] #2 Each candidate's implications for Phase 6 packaging and clean-install verification are stated, citing the packaging contract's own constraints
- [ ] #3 Lore's shipped runtime is cited as context with its relevance to Quest's choice argued explicitly, not assumed by precedent
- [ ] #4 The proposal identifies which architecture-Spec boundaries a runtime choice would actually constrain and which are genuinely runtime-neutral
- [ ] #5 The document states explicitly that it decides nothing and that D2 remains owned-not-closed pending the owner's ruling
- [ ] #6 The open component decisions register's D2 entry points at the proposal with its status left unchanged
- [ ] #7 No runtime is frozen, and no runtime dependency, package metadata, or executable scaffolding is added
<!-- AC:END -->
