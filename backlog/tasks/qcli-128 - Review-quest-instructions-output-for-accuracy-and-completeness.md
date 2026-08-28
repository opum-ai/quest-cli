---
id: QCLI-128
title: Review quest instructions output for accuracy and completeness
status: To Do
assignee: []
created_date: '2026-08-28 18:50'
labels:
  - cli
  - instructions
  - docs
  - review
dependencies:
  - QCLI-124
references:
  - src/cli/main.ts
priority: low
type: spike
ordinal: 160000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
quest instructions (src/cli/main.ts, kind agent.instructions) returns the managed CLAUDE.md/AGENTS.md block plus version, the same content QCLI-124 derived from the release version for the 0.2.9 candidate. Before this content is leaned on further, for example by the onboarding prompts requested in QCLI-126, confirm it is accurate, complete, and consistent with how CLAUDE.md and AGENTS.md actually route Quest work in this repo. This is a review, not a known defect.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Written comparison of quest instructions output against the current CLAUDE.md and AGENTS.md managed blocks in this repo, noting any drift.
- [ ] #2 Confirms whether the content correctly reflects 0.2.9 behavior: exit codes, conflict and retry guidance, and migration command examples.
- [ ] #3 Follow-up tasks filed for any inaccuracy or gap found; none required if the review finds no issues.
<!-- AC:END -->
