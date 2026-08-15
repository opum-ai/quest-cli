---
id: QCLI-74
title: Qualify jira-cli and freeze Jira migration fidelity mappings
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-15 01:25'
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
- [x] #1 The installed jira-cli version, currently observed as 1.0.2, and its relevant public command and JSON shapes are captured as versioned goldens
- [x] #2 Mappings cover issue identity and key, status, priority, type, hierarchy, links, versions, labels, people, timestamps, description, and comments
- [x] #3 Attachments, worklogs, changelog history, boards, and sprints are explicit preview gaps and are never silently approximated
- [x] #4 Quest never reads Jira credentials, calls Jira HTTP APIs, or parses ADF directly
- [x] #5 Paging, missing issues, permission failures, source changes, and rate or transport failures have deterministic adapter outcomes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record the installed jira-cli version and enumerate its public CLI and JSON surfaces without reading credentials or calling Jira directly.
2. Capture a core-plus-comments fidelity mapping, deterministic failure classifications, and explicit unsupported preview gaps using public contract evidence only.
3. Author the Quest migration-fidelity contract, sync Lore, run strict checks, and finalize with objective evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-15 qualification: jira --version and npm latest both report 1.0.2 (registry modified 2026-08-06T03:01:37.597Z). Captured only public help and version/registry output for issue get/search, paged comments, project versions, links, metadata, and credential-profile commands; no Jira site, credentials, HTTP API, ADF payload, source, or private tests were accessed. Authored synthetic-golden-only fidelity rules and deterministic subprocess outcomes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Qualified jira-cli 1.0.2 as Quest's bounded one-way Jira Cloud adoption subprocess. Added the core-plus-comments mapping, explicit gaps, credential/HTTP/ADF boundary, paging and diagnostic rules, and requalification trigger.
<!-- SECTION:FINAL_SUMMARY:END -->
