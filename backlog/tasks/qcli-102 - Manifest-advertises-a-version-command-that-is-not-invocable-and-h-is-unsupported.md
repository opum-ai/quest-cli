---
id: QCLI-102
title: >-
  Manifest advertises a 'version' command that is not invocable, and -h is
  unsupported
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 15:24'
updated_date: '2026-08-17 23:58'
labels:
  - cli
  - manifest
  - help
  - parity
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
references:
  - 'https://github.com/opum-ai/quest-cli/pull/115'
  - 'https://github.com/opum-ai/quest-cli/actions/runs/32082195825'
documentation:
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
modified_files:
  - src/cli/main.ts
  - test/contract/cli-process.test.ts
  - test/cli-tracker-process.test.ts
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
- [x] #1 Every command name in the manifest is invocable, or is removed from the manifest
- [x] #2 quest version exits 0 and reports the version, matching quest --version
- [x] #3 quest -h behaves as quest --help
- [x] #4 A test enumerates manifest command names and invokes each one, failing if an advertised name returns a usage error
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Accept the manifest-advertised `version` spelling in the early dispatcher and return the same bare version output as `--version`.
2. Accept `-h` as a conventional alias of `--help`, preserving central output-mode stripping and targeted-help behavior.
3. Add focused contract assertions proving `version` equals `--version` and `-h` equals `--help`.
4. Extend the isolated manifest-command process matrix to include every manifest entry, including the kind-null `version` command, require an invocation recipe for each, and reject usage diagnostics while keeping mutators inside the temporary store.
5. Run focused and full repository gates, package gates, strict Lore checks, diff check, and independent review; then deliver through a dev pull request and settle the lease.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Preflight at merged dev 6f247cc found the manifest correctly declares version, while runQuest only recognizes sole --version. The help branch likewise recognizes help and --help but not -h. The existing isolated manifest payload matrix already provides safe argument recipes for all 39 payload commands and special-cases browser shutdown. QCLI-102 should land before QCLI-110 because both touch early runQuest routing. QCLI-109 is independent in the value parser. Implementation complete: the early dispatcher accepts sole version with byte-identical output to --version, and accepts -h in leading and targeted-help positions while preserving JSON and plain mode resolution. The isolated process matrix now requires and invokes a recipe for every live manifest entry, including kind-null version, and rejects usage diagnostics. All mutations remain inside its temporary task store and browser execution is bounded. Verification passed: focused 19 tests and 968 expectations, full repository check with 160 tests and 1582 expectations, package check, packed package tests, strict Lore validation and check, and git diff check. Independent review accepted all four acceptance criteria.

Delivery complete: exact candidate f3d1ea5 passed source qualification and all six immutable package jobs in run 32082195825. PR 115 merged to dev at b048d2c, and the merge tree 9e30b67 exactly matched the reviewed candidate tree. The campaign remote branch was deleted and lease 82e23e2355bfc0691a390547851ec91a was returned after clean and merged-state verification.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aligned the dispatcher with the public manifest by making quest version match quest --version and adding conventional -h help routing. Added direct parity assertions and a manifest-wide isolated process test that invokes every advertised command and rejects usage failures. Focused, full, package, Lore, and diff gates passed. Independent review accepted the result.

Delivered through PR 115 after all seven required CI jobs passed, with exact candidate-tree verification.
<!-- SECTION:FINAL_SUMMARY:END -->
