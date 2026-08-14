---
id: QCLI-74
title: Qualify jira-cli and freeze Jira migration fidelity mappings
status: To Do
assignee: []
created_date: '2026-08-14 18:08'
updated_date: '2026-08-14 18:27'
labels:
  - quest-0.1
  - 'wave:contracts'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-72
documentation:
  - docs/specs/quest-cli-functional-requirements.md
  - docs/reference/quest-cli-component-charter.md
  - docs/stories/deliver-quest-cli-0-1-0.md
modified_files:
  - docs/reference/quest-cli-jira-migration-fidelity-contract.md
  - test/fixtures/jira/
priority: high
type: spike
ordinal: 92000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Qualify the installed @salient-ai/jira-cli public JSON and process contract for one-way Jira Cloud adoption. Quest must delegate credentials, HTTP, pagination transport, and ADF handling to jira-cli while freezing a testable core-plus-comments fidelity matrix.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The installed jira-cli version, currently observed as 1.0.2, and its relevant public command and JSON shapes are captured as versioned goldens
- [ ] #2 Mappings cover issue identity and key, status, priority, type, hierarchy, links, versions, labels, people, timestamps, description, and comments
- [ ] #3 Attachments, worklogs, changelog history, boards, and sprints are explicit preview gaps and are never silently approximated
- [ ] #4 Quest never reads Jira credentials, calls Jira HTTP APIs, or parses ADF directly
- [ ] #5 Paging, missing issues, permission failures, source changes, and rate or transport failures have deterministic adapter outcomes
<!-- AC:END -->
