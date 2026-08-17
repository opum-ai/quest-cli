---
id: QCLI-102
title: >-
  Manifest advertises a 'version' command that is not invocable, and -h is
  unsupported
status: To Do
assignee: []
created_date: '2026-08-17 15:24'
updated_date: '2026-08-17 16:26'
labels:
  - cli
  - manifest
  - help
  - parity
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
documentation:
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
priority: low
type: bug
ordinal: 125000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`quest manifest --json` advertises a command named `version`, but invoking that spelling fails:

    $ quest manifest --json | jq '.data.commands[] | select(.name=="version")'
    {"name":"version","schemaVersion":1,"kind":null,"mutates":false}

    $ quest version ; echo "exit=$?"
    {"error_type":"usage","message":"Unknown or missing Quest command.","principal":null}
    exit=2

Only `--version` is handled, and only as the sole argument. The Opum command contract (opum-doc `docs/specs/opum-command-contract.md` section 4.2) requires the registry to be machine-discoverable so an agent can enumerate capabilities without reading source; an agent that enumerates the manifest and invokes `quest version` gets a usage error for an advertised command.

Separately, the conventional short help flag is unsupported:

    $ quest -h ; echo "exit=$?"
    {"error_type":"usage","message":"Unknown or missing Quest command.","principal":null}
    exit=2

Candidate: v0.2.0, native darwin-arm64 sha256 1d5491bd90ab7fb3a9d97d700023088ebbbae75ce23eca4dc345076895cb5ad5.

Either fix is acceptable per command: make the advertised spelling work, or stop advertising it. The invariant that matters is that the manifest and the dispatcher agree.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every command name in the manifest is invocable, or is removed from the manifest
- [ ] #2 quest version exits 0 and reports the version, matching quest --version
- [ ] #3 quest -h behaves as quest --help
- [ ] #4 A test enumerates manifest command names and invokes each one, failing if an advertised name returns a usage error
<!-- AC:END -->
