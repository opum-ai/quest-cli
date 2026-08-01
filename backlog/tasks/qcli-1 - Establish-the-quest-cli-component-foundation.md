---
id: QCLI-1
title: Establish the quest-cli component foundation
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-01 17:07'
updated_date: '2026-08-01 17:22'
labels:
  - 'doc:stories/establish-the-quest-cli-component-foundation'
dependencies: []
documentation:
  - docs/stories/establish-the-quest-cli-component-foundation.md
priority: high
type: docs
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Set up quest-cli as the future implementation repository for the quest npm package and quest command. Define its component-local ownership, preserve the clean-room and Lore-release gates, and migrate the former OCLI research campaign into a traceable QCLI successor backlog without adding product source or runtime dependencies.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The repository charter identifies quest-cli as owner of the quest package, executable, component contracts, tests, and releases
- [ ] #2 The backlog contains a traceable successor for every unfinished former OCLI research item and keeps product implementation gated on the Lore release evidence
- [ ] #3 Lore docs define local boundaries with quest-doc, quest-web, opum-doc, and lore-doc and include a context-free pickup runbook
- [ ] #4 No product implementation or runtime dependency is added, and Lore strict validation, strict checks, and git diff checks pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create the component charter, repository decision, campaign Story, migration ledger, and handover. 2. Populate a future QCLI research campaign mirroring the unfinished OCLI work with explicit provenance. 3. Link local tasks to the Story and preserve the release gate. 4. Reconcile and run strict validation.
<!-- SECTION:PLAN:END -->
