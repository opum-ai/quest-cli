---
id: QCLI-98
title: Render human output for plain and pretty modes instead of the envelope kind
status: To Do
assignee: []
created_date: '2026-08-17 15:19'
updated_date: '2026-08-17 16:26'
labels:
  - cli
  - output-contract
  - parity
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
documentation:
  - docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
priority: high
type: bug
ordinal: 121000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every non-JSON invocation prints only the result envelope's `kind` string, so the entire human-facing surface of the CLI carries no information.

`output()` in `src/cli/main.ts` builds stdout as `mode === "json" ? JSON.stringify(data) : `${data.kind}\n``. There is no plain or pretty renderer at all: the non-JSON branch emits the kind and discards `data`.

Observed on the v0.2.0 candidate (native darwin-arm64 sha256 1d5491bd90ab7fb3a9d97d700023088ebbbae75ce23eca4dc345076895cb5ad5), in an initialized workspace:

    $ quest task list --plain
    task.list
    $ quest overview --plain
    project.overview
    $ quest board --plain
    project.board
    $ quest doctor --plain
    project.doctor
    $ quest manifest --plain
    manifest.registry
    $ quest instructions --plain
    agent.instructions
    $ quest help
    help.commands

Pretty mode is identical - over a pty (`script -q /dev/null quest overview`) the output is still `project.overview`. A non-TTY stdout auto-selects plain, so piping or redirecting any command yields the kind string too.

This breaks the Opum command contract's output-mode requirement (opum-doc `docs/specs/opum-command-contract.md` section 1), which freezes three real modes - pretty, --plain, --json. It also blocks QCLI-97 acceptance criterion 3 (a discoverable help/instructions surface), because `quest help` and the bare `quest` invocation are the first thing a new user or agent runs and they print `help.commands`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every command with a --json payload renders a human-readable plain-mode representation of that payload; no command emits a bare kind string in plain or pretty mode
- [ ] #2 Pretty mode renders on a TTY and is ANSI-free when NO_COLOR is set or when stdout is not a TTY
- [ ] #3 A bare 'quest' invocation and 'quest help' both list the real commands in human-readable form
- [ ] #4 A black-box test asserts, for every command in the manifest, that plain-mode stdout is not equal to that command's declared kind
<!-- AC:END -->
