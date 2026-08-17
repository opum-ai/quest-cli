---
id: QCLI-100
title: Stop consuming --json and --plain as help targets in the 'help' spelling
status: To Do
assignee: []
created_date: '2026-08-17 15:20'
updated_date: '2026-08-17 16:26'
labels:
  - cli
  - output-contract
  - help
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
documentation:
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
priority: medium
type: bug
ordinal: 123000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`quest help --json` and `quest help --plain` treat the global output-mode flag as the name of a help topic, and fail with not_found instead of rendering help.

Observed on the v0.2.0 candidate (native darwin-arm64 sha256 1d5491bd90ab7fb3a9d97d700023088ebbbae75ce23eca4dc345076895cb5ad5):

    $ quest help --json ; echo "exit=$?"
    {"error_type":"not_found","message":"No help is available for --json.","principal":null}
    exit=3
    $ quest help --plain ; echo "exit=$?"
    {"error_type":"not_found","message":"No help is available for --plain.","principal":null}
    exit=3

The '--help' spelling is unaffected and works correctly:

    $ quest --help --json
    {"schemaVersion":1,"kind":"help.commands","data":{"commands":[...]}}

In `src/cli/main.ts` the help branch computes `helpTarget` as `arguments_[0] === "help" ? arguments_[1] : ...` before the flag parser runs, so any flag in that position becomes the topic name. The mode flags must be stripped before a help target is resolved.

This matters for agent use: `quest help --json` is the natural machine-readable discovery call, and the manifest advertises help as supporting a help.commands envelope. The Opum command contract (opum-doc `docs/specs/opum-command-contract.md`, section 1) resolves output mode centrally, before command logic, precisely so no command can reinterpret a mode flag.

Note that the plain-mode output itself is separately broken - see the plain/pretty renderer defect - so fixing this alone makes 'quest help --plain' print 'help.commands' rather than real help.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 quest help --json exits 0 and emits the help.commands envelope
- [ ] #2 quest help --plain exits 0 and renders help in plain mode
- [ ] #3 quest help <unknown-topic> still exits 3 with a not_found envelope
- [ ] #4 A test covers the help, --help, 'help <group>' and '<group> --help' spellings each combined with --json and with --plain
<!-- AC:END -->
