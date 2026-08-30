---
id: QCLI-151
title: quest instructions emits two envelope kinds the manifest never declares
status: To Do
assignee: []
created_date: '2026-08-30 00:22'
labels: []
dependencies: []
references:
  - 'src/cli/main.ts:747'
  - 'src/cli/main.ts:773'
  - 'src/application/command-contract.ts:134'
priority: medium
type: bug
ordinal: 182000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-141 added two output modes to 'quest instructions' but did not extend the manifest's kind declaration.

'quest instructions --list' emits kind agent.guides (src/cli/main.ts:747) and 'quest instructions <guide>' emits kind agent.guide (src/cli/main.ts:773). The manifest entry for instructions still declares only kind agent.instructions (src/application/command-contract.ts:134). It gained filters and fields for the new modes, but not the kinds.

This is the same contract-vs-implementation class as QCLI-133 and QCLI-137, inverted: there the manifest declared fields the CLI never emitted; here the CLI emits kinds the manifest never declares. A machine consumer that reads the registry to know which envelope to expect - which is exactly what QuestTrackerClient's handshake does for other commands - will reject or mis-branch these two.

Found by independent review of the QCLI-135 branch, out of that task's scope.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The manifest declares every envelope kind quest instructions can emit, in whatever form the contract shape supports for a command with more than one
- [ ] #2 A test fails if a command emits a kind its own manifest entry does not declare, generalising past this instance the way manifest-field-coverage did for fields
- [ ] #3 The tracker adapter handshake is checked against the instructions command specifically, since it is the consumer the mismatch would break
<!-- AC:END -->
