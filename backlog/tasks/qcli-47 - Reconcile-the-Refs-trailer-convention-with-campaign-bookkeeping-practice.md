---
id: QCLI-47
title: Reconcile the Refs trailer convention with campaign bookkeeping practice
status: To Do
assignee: []
created_date: '2026-08-07 18:52'
labels:
  - campaign
  - 'cluster:campaign-machinery'
dependencies: []
references:
  - .claude/skills/backlog-handover/SKILL.md
  - .claude/skills/backlog-handover/reference/wave-loop.md
priority: low
type: chore
ordinal: 66000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The backlog-handover skill's Commits convention (`.claude/skills/backlog-handover/SKILL.md` line 98) reads: "always a `Refs: QCLI-<N>` trailer — except `lore sync`'s own `backlog/` auto-commit ... the one deliberate exception". QCLI-43 carved out that single exception. The doc-10 wave-2 reviewer then found the orchestrator's **own** campaign bookkeeping commits routinely lack the trailer — practice the convention as written does not permit, sitting awkwardly next to a rule that now names exactly one exception. This is pre-existing practice drift, not something QCLI-43 introduced.

Verified 2026-08-07 at doc-11 init — and practice is **inconsistent, not uniformly absent**, which corrects how doc-10 framed this:

- Empty `%(trailers:key=Refs)`: `8721feb`, `146956d`, `9c63769`, `d0b5f41`, `3686859` (init doc-10), `34bceae`, `8caae19`, `748bf5f`, `6047774`.
- Carries `Refs: QCLI-43`: `0b63077`, `342e76d`.

The pattern behind the split: single-task bookkeeping commits (dispatch / in-flight pointer / settle) increasingly do carry the trailer, while campaign-scoped commits (init, close) do not — and those genuinely have no single directing task to name.

**OWNER RULING (2026-08-07, obtained at doc-11 campaign init, before dispatch): hybrid.** Emit `Refs: QCLI-<N>` on bookkeeping commits that have a single directing task — already the de facto practice in `0b63077` and `342e76d` — and document an exception in SKILL.md for genuinely campaign-scoped commits (init, close, gitignore) that have none.

Owner's rationale: it matches what the evidence already shows the orchestrator doing correctly, and preserves the traceability the recent single-task commits provide rather than discarding it to make the rule simpler.

Scope: this is a skill-documentation change. It touches `.claude/skills/backlog-handover/SKILL.md` and any `reference/*.md` file restating the same claim. It does **not** rewrite history — no existing commit is amended or re-trailered.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The Commits convention in SKILL.md states the hybrid rule: a `Refs: QCLI-<N>` trailer is required on bookkeeping commits that have a single directing task, and campaign-scoped commits with no single task are a named exception alongside the existing `lore sync` one
- [ ] #2 Every place in the skill that restates the commit convention agrees with the recorded rule, verified by grep across SKILL.md and reference/, leaving no claim false
- [ ] #3 The orchestrator-facing instructions name which bookkeeping commits fall on each side, concretely enough that a future session emits the right trailer without re-deriving the rule
- [ ] #4 The skill version and provenance record reflect this change, in the same form that 0.9.1-qcli.2 used to record the QCLI-43 divergence
<!-- AC:END -->
