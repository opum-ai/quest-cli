---
id: QCLI-100
title: Stop consuming --json and --plain as help targets in the 'help' spelling
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 15:20'
updated_date: '2026-08-17 21:25'
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
- [x] #1 quest help --json exits 0 and emits the help.commands envelope
- [x] #2 quest help --plain exits 0 and renders help in plain mode
- [x] #3 quest help <unknown-topic> still exits 3 with a not_found envelope
- [x] #4 A test covers the help, --help, 'help <group>' and '<group> --help' spellings each combined with --json and with --plain
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Normalize help argv by removing global output-mode flags before resolving the optional topic, while rejecting multiple or unsupported help tokens. 2. Preserve help, --help, help <group>, and <group> --help semantics and keep unknown topics classified not_found. 3. Add the eight required spelling/mode subprocess cases plus unknown-topic control, then run focused/full/package/Lore gates and independent review before dev delivery.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented centralized help-argument normalization that removes --json/--plain before topic resolution, rejects more than one positional help token, and preserves not_found for unknown topics. Added all eight required help/--help/group spelling and mode combinations plus unknown-topic control; focused contract suite passes 10/10 with 158 expectations.

Advanced the candidate to 0.2.4 and rebuilt all six Bun 1.3.14 platform binaries with refreshed root/platform checksums. bun run check passed 156 tests/1108 expectations; check:packages and test:packages passed. QCLI-97.8 migration, QCLI-98 human output, QCLI-99 principal conformance, QCLI-101 parser, and QCLI-108 repository-scope coverage remain green.

Independent acceptance and cumulative release reviews approved. Reviewers also verified JSON precedence when both modes are present, topic resolution with modes before/after the topic, unknown diagnostics, 0.2.4 embedded in all binaries, exact checksums, stage-visible artifacts, and preservation of prior campaign contracts.

PR 109 projection CI exposed the pre-existing Windows ARM64 tampering test at 5003-5004ms twice. Delivery remediation set only that test's explicit timeout to 15 seconds, matching the adjacent expensive projection test. Focused projection suite passed 10/10, formatting/diff checks passed, and independent micro-review approved the exact one-line scope.

CI follow-up (2026-08-17): Windows ARM64 confirmed the original tampering test passes with its 15s bound, then exposed the same 5s runner variance in another projection recovery test (5.01s). Scoped the 15s allowance to the isolated projection-platform workflow command so all projection cases share the ARM64 budget; focused 10/10 and independent review passed.

Owner decision (2026-08-17): quarantine the repeatedly failing Windows ARM64 projection lane while retaining its signal as an allowed-failure matrix job. QCLI-111 owns diagnosis and restoration as a required lane; QCLI-112 owns the separate Bun artifact/Git delivery failures; QCLI-97.9 owns the stale installed Quest migration surface blocking Lore.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Normalized help arguments so global --json/--plain modes are removed before the optional topic is resolved, preserving plain rendering, JSON envelopes, and not_found unknown-topic behavior. Added all eight required help/--help/group spelling-mode combinations and an unknown-topic control. Released the 0.2.4 candidate with all six binaries rebuilt and checksummed; verified by 10 focused tests/158 assertions, 156 full tests/1108 assertions, package and packed-package gates, direct host compiled coverage, and two independent approvals.
<!-- SECTION:FINAL_SUMMARY:END -->
