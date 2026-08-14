---
id: QCLI-95
title: Publish @opum-ai/quest 0.1.0
status: To Do
assignee: []
created_date: '2026-08-14 18:08'
updated_date: '2026-08-14 18:27'
labels:
  - quest-0.1
  - 'wave:release'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-93
  - QCLI-94
documentation:
  - docs/reference/quest-cli-packaging-contract.md
  - docs/runbooks/quest-cli-release.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - package.json
  - docs/reference/quest-cli-release-truth.md
  - README.md
priority: high
type: task
ordinal: 113000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Perform the separately authorized first public Quest release after every implementation and qualification gate passes. This task owns the live registry recheck, immutable publication, clean-install verification, release evidence, and truthful postpublication documentation; it must remain blocked without explicit owner authorization.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The @opum-ai/quest registry name, conflicting names, repository identity, current Lore release, and package metadata are rechecked live immediately before publication
- [ ] #2 Publication occurs only with explicit owner authorization and uses the exact reviewed immutable root and six platform artifacts
- [ ] #3 The public registry serves the expected version and all clean-install smoke tests pass against registry artifacts
- [ ] #4 Immutable release evidence records versions, integrity, provenance, source commit, platform artifacts, and verification results
- [ ] #5 Availability and install documentation changes only after successful publication and verification; failure leaves no false availability claim
<!-- AC:END -->
