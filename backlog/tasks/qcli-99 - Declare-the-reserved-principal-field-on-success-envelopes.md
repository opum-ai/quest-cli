---
id: QCLI-99
title: Declare the reserved principal field on success envelopes
status: To Do
assignee: []
created_date: '2026-08-17 15:20'
updated_date: '2026-08-17 16:26'
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
- [ ] #1 Every success envelope emits a principal key as its last top-level key, with the value null
- [ ] #2 The error and uncaught envelopes keep their existing principal slot in the same last-key position
- [ ] #3 A conformance test invokes each manifest command and asserts the principal key is present on the emitted envelope, and fails if the key is removed
- [ ] #4 No component populates principal with a non-null value without a prior ratifying amendment to the opum-doc contract
<!-- AC:END -->
