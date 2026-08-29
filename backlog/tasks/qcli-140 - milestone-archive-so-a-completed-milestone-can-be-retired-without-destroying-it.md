---
id: QCLI-140
title: >-
  milestone archive, so a completed milestone can be retired without destroying
  it
status: To Do
assignee: []
created_date: '2026-08-29 00:32'
labels:
  - cli
  - parity
  - data-integrity
dependencies:
  - QCLI-134
references:
  - src/cli/main.ts
priority: medium
type: feature
ordinal: 172000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Quest offers only milestone delete. Retiring a finished milestone therefore destroys its record, including its task references.

Backlog 1.50.1 has milestone archive <name>. Quest already treats archive-not-delete as the normal retirement path everywhere else - task archive and draft archive both exist and are in the manifest - so milestones are the inconsistent case rather than a deliberate design.

Filed out of the QCLI-134 register with the owner deciding to implement (2026-08-29). Lore does not consume milestone commands at all (verified against its shipped binary).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 quest milestone archive <id> retires a milestone while preserving its record and its task references, mirroring task archive and draft archive.
- [ ] #2 An archived milestone is excluded from milestone list by default and remains retrievable, consistent with how archived tasks and drafts behave.
- [ ] #3 The manifest declares the command, and milestone delete keeps its existing destructive behaviour for callers that genuinely want it.
<!-- AC:END -->
