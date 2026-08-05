---
id: QCLI-17
title: >-
  Correct the open component decisions register's Backlog.md
  reclassification-trigger claim
status: In Progress
assignee: []
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 12:48'
labels:
  - campaign
  - 'cluster:migration'
  - correction
  - register
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-1
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: high
type: docs
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The open component decisions register, added by QCLI-10.1 on 2026-08-05, carries a section headed "A reclassification trigger that has probably fired". It asserts that the migration fidelity contract pin to Backlog.md v1.49.3 is likely stale because nobody has re-checked it.

That inference is wrong, and was checked the same day it was written. Live registry state on 2026-08-05: npm view backlog.md version returns 1.49.3, dist-tags.latest is 1.49.3, and time.modified is 2026-08-03. The pinned version IS the current published release. The trigger has not fired.

This matters beyond the wording: the section currently tells a reader that every FR-MIG requirement rests on a possibly outdated enumeration and implies re-running that enumeration is Phase 1 work. Both follow from the false premise.

Correct the section to record the verified current state as a dated moving reference with its literal command, keep the recheck obligation itself (which remains real and unchanged), and fix any downstream statement in the same document that inherited the false premise. Check the delivery roadmap and the functional requirements Spec for the same inherited claim.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The register records the verified 2026-08-05 registry state as a dated moving reference with the literal command that produced it
- [ ] #2 The claim that the trigger has probably fired is removed, and the standing obligation to re-check before anything freezes is retained
- [ ] #3 Any statement in the delivery roadmap or the functional requirements Spec that inherited the false premise is identified and corrected, or confirmed absent
- [ ] #4 The correction is recorded inline and dated, citing this task, rather than silently rewritten
- [ ] #5 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->
