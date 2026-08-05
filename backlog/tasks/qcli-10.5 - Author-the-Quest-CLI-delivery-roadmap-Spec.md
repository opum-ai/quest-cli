---
id: QCLI-10.5
title: Author the Quest CLI delivery roadmap Spec
status: To Do
assignee: []
created_date: '2026-08-05 11:41'
updated_date: '2026-08-05 11:42'
labels:
  - quest
  - cli
  - roadmap
  - phases
  - activation-gate
  - 'doc:stories/prepare-quest-cli-for-implementation-activation'
dependencies:
  - QCLI-10.1
  - QCLI-10.3
documentation:
  - docs/stories/prepare-quest-cli-for-implementation-activation.md
parent_task_id: QCLI-10
priority: high
type: docs
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The seven-phase delivery graph is dormant inside an eight-hundred-line reference document, with no entry or exit criteria and no mapping from phases to requirements. Its single most actionable finding - that Phase 1 is decision work not blocked on the Lore gate - is effectively invisible.

Make the graph executable without activating it. The roadmap describes what each phase requires and produces; it authorises no implementation and opens no gate.

Cite quest-doc as the owner of the product-wide staged roadmap rather than restating it as normative here.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each of the seven phases records entry criteria, exit criteria, the requirements it satisfies, the scenarios that verify it, and its open-decision dependencies
- [ ] #2 The roadmap makes prominent that Phase 1 is component decision work not blocked on the Lore-owned release gate, and is therefore the next actionable unit of work
- [ ] #3 A test strategy is named as a phase deliverable, recording that the repository currently has no automated test, build, or lint gate
- [ ] #4 Component release and rollback runbooks are named as phase deliverables, recording that the charter claims them and the runbooks directory does not contain them
- [ ] #5 quest-doc is cited as the owner of the product-wide staged roadmap rather than restated as normative here
- [ ] #6 No phase is activated, no gate is opened, and no implementation is authorised
<!-- AC:END -->
