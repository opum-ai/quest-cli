---
id: QCLI-2.2
title: Reconcile legacy Opum requirements into Quest CLI candidates
status: To Do
assignee: []
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 12:56'
labels:
  - campaign
  - research
  - requirements
  - legacy
  - clean-room
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:requirements'
dependencies:
  - QCLI-2.1
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extract component-relevant functional intent from admitted legacy Opum decisions and task narratives, then classify it as Quest CLI contract candidates. Work only from admitted authored requirements and observable narratives; do not inspect or port legacy implementation source or tests. Route every product-wide vocabulary, execution-graph, architecture, or roadmap change to the canonical quest-doc specification.

Scope boundary for wave 2 (2026-08-04, restore #2): QCLI-2.7 and QCLI-2.9 run concurrently. QCLI-2.7 owns all edits to docs/reference/quest-cli-research-source-register.md this wave — cite it read-only, do not edit it. Your deliverable is a new reference document of your own. The register is the admission authority: a source may inform a QCLI requirement only if the register classifies it Allowed. Read it before citing anything.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A source-attributed matrix covers every admitted legacy decision, specification, guide, task narrative, and prototype review used
- [ ] #2 Each component candidate is classified reusable, adapted, superseded, deferred, or rejected against the current Quest, Lore, and Opum boundaries
- [ ] #3 Any change to Quest-wide semantics, vocabulary, architecture, or roadmap is proposed to quest-doc and is not treated as normative in quest-cli
- [ ] #4 The result preserves supported CLI execution invariants while rejecting the former product name, repository home, and command namespace
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-01 18:16
---
Authority audit: scope is now limited to Quest CLI component candidates; quest-doc remains the sole product-wide decision owner.
---
<!-- COMMENTS:END -->
