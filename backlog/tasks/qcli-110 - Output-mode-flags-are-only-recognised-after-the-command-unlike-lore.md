---
id: QCLI-110
title: 'Output mode flags are only recognised after the command, unlike lore'
status: To Do
assignee: []
created_date: '2026-08-17 18:44'
labels:
  - cli
  - argument-parsing
  - output-contract
dependencies: []
priority: low
type: bug
ordinal: 135000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`--json` and `--plain` are only honoured once the command and its action have been parsed. Placed before them, they are treated as the command itself and the invocation fails.

Candidate: v0.2.2, native darwin-arm64 sha256 8ae73c74536b28870532e94d97686ee1c65ac094f69a357ec1139bcba6fffb9e.

    $ quest task list --json          # works
    $ quest --json task list ; echo "exit=$?"
    {"error_type":"usage","message":"Unknown or missing Quest command.","principal":null}
    exit=2
    $ quest task --json list ; echo "exit=$?"
    {"error_type":"usage","message":"Unknown or missing Quest command.","principal":null}
    exit=2

The sibling CLI accepts the leading form:

    $ lore --json validate
    {"schemaVersion":1,"kind":"validate.report","data":{...}}      exit 0

This is **pre-existing** - it reproduces on 0.2.0 and is not caused by QCLI-101. It is filed now because QCLI-101's acceptance criterion #2 reads 'recognised as output modes wherever they appear in argv', and that criterion was closed. QCLI-101 fully satisfied the part that mattered - a mode flag is never consumed as another flag's value - but the literal 'wherever they appear' claim does not hold, so the record should either be made true or the criterion's scope narrowed.

The Opum command contract (opum-doc `docs/specs/opum-command-contract.md` section 1) resolves output mode 'once, centrally, before any command logic runs'. A mode resolved only after positional dispatch is not resolved before command logic; lore's behaviour is the reference shape here.

Also related: QCLI-100, where the `help` spelling consumes a mode flag as a help topic. Both stem from mode flags being read positionally rather than stripped globally first, and a single fix may close both - if so, close them with evidence rather than folding one into the other.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 --json and --plain are honoured in any argv position, including before the command and between a group and its action
- [ ] #2 Mode resolution happens before positional dispatch, per the Opum command contract section 1
- [ ] #3 QCLI-101's guarantees are unchanged: a mode flag is never consumed as another flag's value, and missing or duplicated values remain usage errors
- [ ] #4 Tests cover each mode flag in leading, mid-argv and trailing positions for a group command and a single-word command
<!-- AC:END -->
