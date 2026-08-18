---
id: QCLI-109
title: No way to pass a flag value that begins with two dashes
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 18:44'
updated_date: '2026-08-18 00:08'
labels:
  - cli
  - argument-parsing
  - usability
dependencies: []
references:
  - 'https://github.com/opum-ai/quest-cli/pull/116'
  - 'https://github.com/opum-ai/quest-cli/actions/runs/32083278133'
modified_files:
  - src/cli/main.ts
  - test/contract/cli-process.test.ts
  - test/cli-tracker-process.test.ts
priority: low
type: bug
ordinal: 134000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-101 correctly made a flag-shaped token an invalid value, but it introduced no escape hatch, so a legitimate value beginning with `--` is now unrepresentable through the CLI.

Candidate: v0.2.2, native darwin-arm64 sha256 8ae73c74536b28870532e94d97686ee1c65ac094f69a357ec1139bcba6fffb9e.

## Repro

Every conventional escape was tried; all are rejected or silently alter the value:

    $ quest task create A --description "--weird" --actor jdn --actor-kind human --json
    {"error_type":"usage","message":"--description requires a value.","principal":null}      exit 2

    $ quest task create A --description=--weird ...
    {"error_type":"usage","message":"--description=--weird requires a value.","principal":null}   exit 2

    $ quest task create A --description -- --weird ...
    {"error_type":"usage","message":"--description requires a value.","principal":null}      exit 2

    $ quest task edit T-1 --description "--weird" ...
    {"error_type":"usage","message":"--description requires a value.","principal":null}      exit 2

The only ways through change the stored value: a leading space (` --weird`), a single dash (`-weird`), a backslash-escaped form that stores the backslashes literally, or a unicode look-alike. None of these store `--weird`.

A positional argument is unaffected - `quest task create "--dashes-title"` succeeds - so the gap is specific to flag values: `--description`, `--context`, `--outcome`, `--title`, and any other free-text single-value flag.

## Why this matters

Description, context and outcome are free-text prose fields. Text beginning with `--` is ordinary in that setting: a diff fragment, a command being documented, a horizontal rule, a comment marker. Today such content cannot be entered at all, and the diagnostic tells the caller the flag 'requires a value' when a value was in fact supplied - which reads as a bug on the caller's side rather than an unsupported input.

## Two conventional fixes, either is fine

- Support the POSIX end-of-options separator so `--description -- --weird` treats the next token as a literal value.
- Support the `--flag=value` form, where everything after the first `=` is the value verbatim.

Supporting both is the usual choice. Whichever is chosen, the diagnostic for a genuinely missing value should point at it, for example: `--description requires a value; use --description=<value> if the value begins with --`.

This is a follow-up to QCLI-101, not a regression report against it: the rejection behaviour QCLI-101 introduced is correct and should stay.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A value beginning with -- can be supplied verbatim through at least one documented mechanism
- [x] #2 The stored value is byte-identical to what the caller intended, with no added escaping, whitespace or substitution
- [x] #3 The missing-value diagnostic names the escape mechanism
- [x] #4 A genuinely missing value is still a usage error (exit 2), and QCLI-101's duplicate and flag-shaped-value rejections are unchanged
- [x] #5 Tests cover the escape form and the still-invalid missing-value form for every free-text single-value flag
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the central flag parser to support --flag=<value>, splitting only the first equals sign and preserving the remainder byte-for-byte while leaving exact mode and boolean flags distinct. 2. Keep ordinary flag-shaped following tokens invalid and revise the genuinely missing-value diagnostic to name the equals escape mechanism. 3. Publish the mechanism in structured and plain CLI help without claiming support for a POSIX end-of-options separator. 4. Add contract matrices for inline free-text values, missing values, flag-shaped rejections, duplicates, mode behavior, and first-equals preservation. 5. Add an isolated process test that writes and reads description, title, context, and outcome values beginning with two dashes to prove stored bytes. 6. Run focused and full repository gates, package gates, strict Lore checks, diff check, independent review, and dev pull-request delivery.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Preflight at merged dev b048d2c found one central flags parser. The smallest compatible escape is --flag=<value>: split once at the first equals sign, preserve the suffix exactly, and do not consume a following argument. Ordinary --flag --other remains a usage error. The free-text single-value flags are description, title, context, and outcome; structural single-value and repeatable flags remain covered by the existing generic rejection matrices. User-facing help and the missing diagnostic will document only the supported equals form.

Implementation complete: the central parser accepts --flag=<value>, splits only the first equals sign, and preserves the remainder exactly. Raw flag-shaped next tokens remain invalid, attached values on output modes and booleans are rejected, and missing-value diagnostics name the equals escape. Structured and plain help publish the supported syntax. An isolated process test round-trips dash-prefixed multi-equals description, title, context, and outcome values through storage. Verification passed: focused 23 tests and 1006 expectations, full repository check with 164 tests and 1620 expectations, package check, packed package tests, strict Lore validation and check, and git diff check. Independent review accepted all five acceptance criteria and parser edge cases.

Delivery is externally blocked. PR 116 was opened on exact reviewed candidate da7e8c2 with tree 36c0a6d. Run 32083278133 failed before any step started: job 95550344883 had runner_id 0 and its GitHub annotation states that recent account payments failed or the spending limit must be increased. The package matrix was skipped. No code or test failure occurred. Required next action is for a repository billing administrator to restore Actions capacity, then rerun the unchanged PR checks.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a documented equals-form escape for literal flag values beginning with two dashes while preserving existing missing, duplicate, flag-shaped, mode, and boolean rejection behavior. Contract matrices cover every free-text single-value flag, and isolated process tests prove byte-identical persisted description, title, context, and outcome values. Focused, full, package, Lore, and diff gates passed; independent review accepted the result.

PR 116 is open, but required CI cannot start until repository Actions billing or spending-limit capacity is restored.
<!-- SECTION:FINAL_SUMMARY:END -->
