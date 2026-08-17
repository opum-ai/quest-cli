---
id: QCLI-99
title: Declare the reserved principal field on success envelopes
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 15:20'
updated_date: '2026-08-17 20:42'
labels:
  - cli
  - output-contract
  - opum-contract
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
documentation:
  - docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
priority: high
type: bug
ordinal: 122000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Quest's error envelopes declare the reserved `principal` slot, but its success envelopes omit the key entirely.

Observed on the v0.2.0 candidate (native darwin-arm64 sha256 1d5491bd90ab7fb3a9d97d700023088ebbbae75ce23eca4dc345076895cb5ad5):

    $ quest task list --json
    {"schemaVersion":1,"kind":"task.list","data":[]}
    $ quest overview --json
    {"schemaVersion":1,"kind":"project.overview","data":{...}}
    $ quest task view T-9 --json
    {"error_type":"not_found","message":"task_not_found","principal":null}

The error path is correct; the success path is missing the slot. Confirmed absent on every read-only command exercised: manifest, instructions, completion bash, task status-flow, task list, overview, board, doctor, milestone list, decision list, draft list, search.

The Opum command contract (opum-doc `docs/specs/opum-command-contract.md`, section 2 'Reserved principal field') makes this a MUST and is explicit that omission is not a variant:

> A component that cannot yet populate it MUST still declare the slot by emitting `principal: null`; omitting the key entirely is not an equivalent alternative, and is a non-conformance, not a variant.

Position is also fixed: `principal` is the last top-level key, after `data` on the success envelope. Populating it with a real value is out of scope here - the contract requires a ratifying amendment to opum-doc before any component ships a non-null value, so this task covers null-declaration only.

Related: QCLI-68 recorded quest-cli's local obligation to this contract; QCLI-69 reconciled the result-contract ADR with it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every success envelope emits a principal key as its last top-level key, with the value null
- [x] #2 The error and uncaught envelopes keep their existing principal slot in the same last-key position
- [x] #3 A conformance test invokes each manifest command and asserts the principal key is present on the emitted envelope, and fails if the key is removed
- [x] #4 No component populates principal with a non-null value without a prior ratifying amendment to the opum-doc contract
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Normalize every CLI success envelope at the output boundary so principal: null is appended last without changing JSON mode precedence or human rendering. 2. Add manifest-driven JSON conformance coverage for every payload command, including stateful migration and bounded browser handling, plus exact success/error/uncaught key-order assertions. 3. Rebuild and checksum all six platform artifacts from the final source, run focused/full/package/Lore gates, obtain independent review, and deliver through dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented output-boundary normalization that reconstructs every CLI success envelope in frozen key order and appends principal: null while preserving human rendering from data. Refactored the existing manifest matrix into reusable plain/JSON execution; the new JSON conformance pass invokes every non-null-kind manifest command, including migration and browser, and asserts null plus last-key position. Direct contract tests now freeze success, every diagnostic class including uncaught, and principal key order. Focused 22-test run passed with 540 expectations.

Candidate identity advanced to 0.2.3 so the changed wire contract does not reuse the 0.2.2 artifact identity. Bun 1.3.14 rebuilt all six target binaries and refreshed root/platform checksums. After one formatter-only remediation, bun run check passed 155 tests/1086 expectations; check:packages and test:packages passed; explicit text-path diff check passed and no stale 0.2.2 runtime/test/package surfaces remain outside historical docs.

Independent acceptance and cumulative release reviews approved after clearing inherited Treehouse assume-unchanged hints on all six generated binary paths. Reviewers verified stage visibility, exact key order, no non-null principal population, host packaged output, all target versions/checksums, and preservation of QCLI-97.8/98/101/108.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Standardized every CLI success envelope as schemaVersion, kind, data, principal: null at the output boundary while preserving human rendering. Added a manifest-driven JSON subprocess conformance pass for every payload command and exact last-key tests for success and all diagnostic classes, including uncaught. Released the 0.2.3 candidate with all six native artifacts rebuilt and checksummed. Verified by 22 focused tests/540 assertions, the 155-test full gate/1086 assertions, package and packed-package gates, host packaged JSON inspection, and two independent approvals.
<!-- SECTION:FINAL_SUMMARY:END -->
