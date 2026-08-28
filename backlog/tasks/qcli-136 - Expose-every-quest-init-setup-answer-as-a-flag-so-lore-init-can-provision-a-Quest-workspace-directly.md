---
id: QCLI-136
title: >-
  Expose every quest init setup answer as a flag so lore init can provision a
  Quest workspace directly
status: To Do
assignee: []
created_date: '2026-08-28 21:46'
updated_date: '2026-08-28 21:47'
labels:
  - cli
  - init
  - onboarding
  - lore-integration
dependencies:
  - QCLI-126
references:
  - >-
    Consumer: opum-ai/lore-cli LCLI-358.6 (Provision the Quest workspace
    directly from lore init)
  - parent LCLI-358 — the two packages release as a pair.
ordinal: 168000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lore CLI is adding a git-first `lore init` preflight that asks the tracker question, then provisions the selected tracker itself. Quest is Lore's default tracker and its first-class one: for Quest, Lore must ask Quest's own setup questions inline and run `quest init` directly, rather than printing a command and exiting (the escape-hatch pattern reserved for the interactive `backlog init` and credential-bearing `jira init`).

Released Quest 0.2.9 cannot support that. Confirmed live on 2026-08-28 against the installed 0.2.9 binary:

    $ quest init --name demo --task-id-prefix DEMO --json
    {"error_type":"usage","message":"init accepts only --agent-instructions, --json, and --plain."}

So today Lore can only run a flagless `quest init --json`, which provisions an unnamed workspace and silently drops whatever the user answered. QCLI-126 added `--name` and `--task-id-prefix` but is unreleased and its task-ID-prefix leg is blocked on the hardcoded `canonicalIdPattern` in src/domain/records.ts; QCLI-126 AC#1 (the interactive wizard) is still unchecked.

This task is the consumer-facing contract Lore needs: every question `quest init` asks a human must have an equivalent flag, so a non-interactive caller reaches the identical end state, and the supported flag set must be discoverable so Lore can version-gate on it instead of guessing.

Ships paired with the corresponding Lore CLI release: both packages are published together.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every question quest init's interactive wizard asks has a 1:1 command-line flag, so a caller passing all of them reaches the identical workspace state with zero prompts
- [ ] #2 quest init --json emits the workspace.initialized envelope when driven entirely by flags, and never prompts under --json, --plain, or a non-TTY stdin
- [ ] #3 The init flag set is machine-discoverable (quest manifest --json, or init's own help) so a consumer can detect support rather than probing by trial and error
- [ ] #4 A task created in a workspace initialized with a custom task-ID prefix round-trips through create, view, list, and edit without a canonical-id validation error
- [ ] #5 The supported version is stated in the release notes so Lore CLI can gate on a minimum Quest version rather than an exact-match allowlist
<!-- AC:END -->
