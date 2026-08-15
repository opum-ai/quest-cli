---
id: QCLI-91
title: Qualify Quest migrations and Lore interoperation end to end
status: To Do
assignee: []
created_date: '2026-08-14 18:08'
updated_date: '2026-08-14 18:27'
labels:
  - quest-0.1
  - 'wave:qualification'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-87
  - QCLI-88
  - QCLI-89
  - QCLI-90
documentation:
  - docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md
  - docs/specs/quest-cli-functional-requirements.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - test/e2e/migration/
  - test/fault/migration/
  - scripts/qualification/
priority: high
type: task
ordinal: 109000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Run the integrated migration and interoperability qualification across real disposable Git repositories, the supported Backlog public release, recorded and disposable Jira projects, and the released Lore knowledge contract. This task is the release gate for source immutability and compensating rollback.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Backlog fixtures cover custom prefixes and padding, every lifecycle, duplicate IDs across folders, Unicode, comments, documents, decisions, relationships, and mid-scan changes
- [ ] #2 Jira fixtures and disposable-project runs cover paging, hierarchy, comments, people, missing fields, permission failures, and source drift
- [ ] #3 Every migration preview is reproducible, every source fingerprint is unchanged, and every approved mapping is complete
- [ ] #4 Fault injection before and after each Lore and Quest saga boundary proves compensation or exact blocked-incomplete state
- [ ] #5 Direct cutover, bounded shadow refresh, final cutover, safe rollback, and post-cutover-edit refusal are documented and passing
<!-- AC:END -->
