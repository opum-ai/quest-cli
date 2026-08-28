---
id: QCLI-136
title: >-
  Expose every quest init setup answer as a flag so lore init can provision a
  Quest workspace directly
status: To Do
assignee: []
created_date: '2026-08-28 21:46'
updated_date: '2026-08-28 23:09'
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
- [x] #1 Every question quest init's interactive wizard asks has a 1:1 command-line flag, so a caller passing all of them reaches the identical workspace state with zero prompts
- [x] #2 quest init --json emits the workspace.initialized envelope when driven entirely by flags, and never prompts under --json, --plain, or a non-TTY stdin
- [x] #3 The init flag set is machine-discoverable (quest manifest --json, or init's own help) so a consumer can detect support rather than probing by trial and error
- [x] #4 A task created in a workspace initialized with a custom task-ID prefix round-trips through create, view, list, and edit without a canonical-id validation error
- [ ] #5 The supported version is stated in the release notes so Lore CLI can gate on a minimum Quest version rather than an exact-match allowlist
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ACs 1-4 verified empirically against merged dev @ 5e0f88e (QCLI-132, PR #170), which landed the domain-layer change this task was gated on:
- AC1: wizard asks exactly 3 questions (Project name, Task ID prefix, Write CLAUDE.md/AGENTS.md) and each has a 1:1 flag (--name, --task-id-prefix, --agent-instructions). Passing all three reaches the workspace state with zero prompts.
- AC2: 'quest init --name Demo --task-id-prefix DEMO --agent-instructions --json' emits the full workspace.initialized envelope; the wizard is gated on stdoutIsTty && stdinIsTty && no explicit output mode && no explicit flag, so --json/--plain/non-TTY can never prompt.
- AC3: 'quest help init --json' returns flags: ["--name","--task-id-prefix","--agent-instructions"], so Lore can detect support rather than probing. (quest manifest --json is deliberately unchanged/byte-identical; the AC allows either source.)
- AC4: DEMO-1 round-tripped create -> view -> list -> edit with no canonical-id validation error.
AC5 (minimum version stated in release notes) is NOT met and is not a code change: it needs a Quest release whose notes state the supported floor. Release/publication is owner-authorized per AGENTS.md, so this task stays open on that one criterion.
<!-- SECTION:NOTES:END -->
