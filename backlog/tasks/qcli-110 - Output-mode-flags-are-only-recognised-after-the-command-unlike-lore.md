---
id: QCLI-110
title: 'Output mode flags are only recognised after the command, unlike lore'
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 18:44'
updated_date: '2026-08-18 01:10'
labels:
  - cli
  - argument-parsing
  - output-contract
dependencies: []
references:
  - 'https://github.com/opum-ai/quest-cli/pull/118'
  - 'https://github.com/opum-ai/quest-cli/actions/runs/32086897923'
modified_files:
  - src/cli/main.ts
  - test/contract/cli-process.test.ts
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
- [x] #1 --json and --plain are honoured in any argv position, including before the command and between a group and its action
- [x] #2 Mode resolution happens before positional dispatch, per the Opum command contract section 1
- [x] #3 QCLI-101's guarantees are unchanged: a mode flag is never consumed as another flag's value, and missing or duplicated values remain usage errors
- [x] #4 Tests cover each mode flag in leading, mid-argv and trailing positions for a group command and a single-word command
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Resolve exact `--json`/`--plain` once at argv entry, preserve the established JSON-over-plain precedence and duplicate-mode tolerance, and pass only mode-free positional arguments into command dispatch. 2. Preserve central value parsing and all QCLI-101 missing, flag-shaped, and duplicate-value diagnostics. 3. Add contract coverage for leading, group/action-middle, and trailing placements of both modes across grouped and single-word commands, plus mixed-mode precedence. 4. Run focused/full checks, strict Lore gates, independent review, then deliver through a qualified pull request to `dev`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Pre-implementation review corrected the initial plan: the existing public contract test explicitly requires JSON to take precedence when both output modes are present. QCLI-110 preserves that behavior and existing duplicate-mode tolerance; its scope is position-independent resolution, not a new conflict policy.

Implementation complete: exact `--json` and `--plain` tokens are resolved and removed once at the `runQuest` entrypoint before any positional dispatch. Every output path uses the centrally resolved mode; JSON-over-plain precedence and duplicate-mode tolerance remain unchanged. Attached mode forms remain usage errors, and existing missing, flag-shaped, and duplicate value tests remain green. New contract cases prove both modes in leading, group/action-middle, and trailing positions for `completion bash`, leading/trailing positions for single-word `manifest`, and separated mixed-mode precedence. Verification passed: focused contract/process suite 25 tests with 1009 expectations; fresh full suite 166 tests with 1638 expectations; typecheck, lint, format check, layer check, and diff check. Independent review accepted all four criteria and found no regression.

Exact candidate 9c8d90a passed public workflow run 32086897923: source-gates plus all six immutable package jobs on Linux, macOS, and Windows x64/arm64. PR 118 merged to `dev` as d35e794; merge tree 6b486ad exactly matches the qualified candidate.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Resolved output mode flags globally before positional dispatch, so `--json` and `--plain` now work before, within, or after grouped commands and around single-word commands. Preserved JSON precedence, duplicate-mode tolerance, attached-value rejection, and QCLI-101 value diagnostics. Verified with 166 passing tests / 1638 expectations, static gates, and independent review.

Public qualification run 32086897923 passed all seven jobs on exact SHA 9c8d90a; PR 118 merged to `dev` at d35e794 with an identical tree.
<!-- SECTION:FINAL_SUMMARY:END -->
