---
id: QCLI-44
title: Settle whether inline supersession amendments must cite the directing task
status: In Progress
assignee: []
created_date: '2026-08-07 05:04'
updated_date: '2026-08-07 11:44'
labels:
  - campaign
  - 'cluster:supersession-convention'
  - wave-1
dependencies: []
references:
  - CLAUDE.md
  - docs/reference/quest-cli-open-component-decisions.md
  - docs/reference/quest-cli-component-contracts-and-delivery-graph.md
  - docs/adr/require-atomic-idempotent-operation-owned-mutations.md
priority: low
type: docs
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
CLAUDE.md states this repo supersession convention as: amend it inline, dated, citing the directing task. Repo practice does not currently follow one form.

Cites the directing task:
- docs/reference/quest-cli-open-component-decisions.md line 167 -- closed (same decision as D4; QCLI-25, reconciled here by QCLI-38)

Cites only the closing decision, not the directing task:
- docs/reference/quest-cli-component-contracts-and-delivery-graph.md (~lines 435-441) -- the QCLI-34/QCLI-38 closure prose
- docs/adr/require-atomic-idempotent-operation-owned-mutations.md (~line 72) -- the QCLI-40 amendment

Raised as a nit by QCLI-40 reviewer, who correctly declined to re-spin the branch over it: nothing here is wrong today, and the split is a convention question rather than a defect. It keeps surfacing on reconciliation work, and each task re-derives the answer from scratch, so it is worth settling once.

This needs an owner ruling on which form is normative before any editing. The two candidate rulings are: (a) directing-task citation is required, and existing amendments that omit it get reconciled; or (b) citing the closing decision alone is sufficient, and CLAUDE.md wording is relaxed to match actual practice. Do not guess -- record the ruling, then apply it.

Note the supersession convention itself forbids rewriting historical-record text, so applying ruling (a) means amending the existing amendments inline rather than restating them.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The normative form is recorded in one place -- either CLAUDE.md or the open component decisions register -- stating whether an inline supersession amendment must cite the directing task, with the ruling dated
- [ ] #2 Every inline supersession amendment currently in docs/ conforms to the recorded ruling, or is explicitly listed as a documented exception with its reason
- [ ] #3 No historical-record text is rewritten in the course of conforming: amendments are amended inline per the convention, not restated
- [ ] #4 lore validate --strict and lore check both pass with 0 errors and 0 warnings
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @orchestrator
created: 2026-08-07 11:42
---
OWNER RULING (2026-08-07, recorded by campaign doc-10 orchestrator on the owner's behalf; the owner selected this option interactively at campaign init).

Ruling: option (a) — a directing-task citation IS required.

An inline supersession amendment must cite the directing task (the Backlog task under which the amendment was made), in addition to whatever closing decision it names. CLAUDE.md line 90 therefore stands as written and is NOT to be relaxed; the amendments that currently cite only the closing decision are the things that get reconciled.

Owner's stated rationale: agents read docs/ without git history in context, so a directing-task citation is what makes the full reasoning (task description, acceptance criteria, implementation notes) reachable from the document itself. Git preserves the same trace, but not in a form a docs reader can follow.

Scope this implies:
- CLAUDE.md line 90: unchanged (already states the required form).
- docs/reference/quest-cli-open-component-decisions.md line 167: already conformant — leave as is.
- docs/reference/quest-cli-component-contracts-and-delivery-graph.md (~lines 435-441), the QCLI-34/QCLI-38 closure prose: needs the directing-task citation added inline.
- docs/adr/require-atomic-idempotent-operation-owned-mutations.md (~line 72), the QCLI-40 amendment: needs the directing-task citation added inline.

Binding constraint from AC #3 and CLAUDE.md's own supersession convention: do NOT rewrite or restate the existing amendment text. Amend the amendments inline, dated, leaving the prior wording legible. This task is itself the directing task for those additions, so cite QCLI-44.
---
<!-- COMMENTS:END -->
