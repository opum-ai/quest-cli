---
id: QCLI-103
title: >-
  Milestone and decision mutations return no record, and one kind covers both
  lists and acks
status: In Progress
assignee:
  - '@codex'
created_date: '2026-08-17 15:26'
updated_date: '2026-08-17 21:35'
labels:
  - cli
  - output-contract
  - planning
  - opum-contract
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
documentation:
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
priority: medium
type: bug
ordinal: 126000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Planning-record mutations return an acknowledgement with no record and no id, so a caller cannot learn the identity of what it just created. The same envelope `kind` is also reused for payloads of different shapes.

Candidate: v0.2.0, native darwin-arm64 sha256 1d5491bd90ab7fb3a9d97d700023088ebbbae75ce23eca4dc345076895cb5ad5.

## A. create returns no id

    $ quest milestone create "M" --actor jdn --actor-kind human --json
    {"schemaVersion":1,"kind":"milestone.records","data":{"kind":"success","revision":"741b6cdc..."}}

    $ quest decision create "D" --actor jdn --actor-kind human --json
    {"schemaVersion":1,"kind":"decision.records","data":{"kind":"success","revision":"3b7f670e..."}}

`--id` is optional; when omitted, `nextPlanningId()` allocates `M-<n>` / `DEC-<n>`. Because the response omits it, the only way to learn the allocated id is a follow-up `milestone list` and an inference about which entry is new - which is racy as soon as two writers are active, and is exactly the ambiguity the allocation is supposed to remove.

The sibling commands do return the record:

    $ quest task create "T" ... --json
    {"schemaVersion":1,"kind":"task.created","data":{"id":"T-1","title":"T",...}}
    $ quest draft create "D" ... --json
    {"schemaVersion":1,"kind":"draft.created","data":{"kind":"success","draft":{"id":"D-1",...},...}}

So the gap is specific to `milestone` and `decision`. `edit` and `delete` return the same bare ack.

## B. one kind, several payload shapes

`milestone.records` is emitted by `list`, `view`, `create`, `edit` and `delete`; `decision.records` likewise. The payload is an array for `list`, and an object for the mutations:

    $ quest milestone list --json
    {...,"kind":"milestone.records","data":[{"id":"M-1","title":"R",...}]}
    $ quest milestone edit M-1 --title R ... --json
    {...,"kind":"milestone.records","data":{"kind":"success","revision":"..."}}

The Opum command contract (opum-doc `docs/specs/opum-command-contract.md` section 4.1) has each command declare 'a stable kind string in dotted `command.payload` form'; the point of the payload half is that a consumer can key on `kind` to know the shape it is about to parse. Here a consumer keying on `milestone.records` must additionally branch on `Array.isArray(data)` to find out what it received. The task commands already model this correctly with distinct kinds per operation - `task.list`, `task.view`, `task.created`, `task.updated`, `task.completed`, `task.archived`, `task.demoted`.

Note this interacts with QCLI-102: the manifest lists `milestone` and `decision` as single entries with one kind, so the per-action kinds are not discoverable either way.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 milestone create and decision create return the created record including its allocated id
- [ ] #2 milestone edit and decision edit return the updated record; delete returns enough to identify what was removed
- [ ] #3 Distinct kinds identify distinct payload shapes for the planning groups, so no single kind covers both an array and an ack
- [ ] #4 The manifest declares every kind the milestone and decision groups can emit
- [ ] #5 A test creates a planning record without --id and uses only the create response to view it, with no intervening list
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Trace planning service mutation return values, record codecs, CLI dispatch, and command-manifest declarations on the merged QCLI-100 base. 2. Return created and updated planning records plus stable deletion identity from the service boundary without weakening Git/CAS acknowledgement data. 3. Split milestone and decision list/view/create/edit/delete result kinds and declare every invocable action in the manifest. 4. Add service, command-contract, and black-box tests that use an allocated create id directly and extend the QCLI-98/QCLI-99/QCLI-101 manifest matrices. 5. Run focused and full gates, independently review the exact tree, then rebuild and qualify native packages at the combined planning-wave delivery boundary.
<!-- SECTION:PLAN:END -->
