---
id: QCLI-107
title: >-
  Error classification: contention leaks dependency_target_ambiguous, and EACCES
  maps to validation not denied
status: Done
assignee: []
created_date: '2026-08-17 15:46'
updated_date: '2026-08-17 22:12'
labels:
  - cli
  - exit-codes
  - concurrency
  - opum-contract
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
documentation:
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
priority: medium
type: bug
ordinal: 130000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two failure paths land on `validation` (exit 6) when the frozen taxonomy has a more accurate code, so a caller cannot tell a retryable situation or a permissions problem from a bad request.

Candidate: v0.2.0, native darwin-arm64 sha256 1d5491bd90ab7fb3a9d97d700023088ebbbae75ce23eca4dc345076895cb5ad5.

## A. Write contention sometimes surfaces an internal token as a validation error

Ten concurrent `task create` calls against one initialized workspace:

    for i in $(seq 1 10); do (quest task create "C$i" --actor jdn --actor-kind human --json > out.$i 2> err.$i; echo $? > rc.$i) & done; wait

    writer  1 rc=5 {"error_type":"conflict","message":"Task write conflicted with a newer revision.","principal":null}
    writer  4 rc=6 {"error_type":"validation","message":"dependency_target_ambiguous","principal":null}
    writer  6 rc=0
    writer  7 rc=0
    writer  8 rc=6 {"error_type":"validation","message":"dependency_target_ambiguous","principal":null}
    ...

Most writers correctly get `conflict` / exit 5. A minority get `validation` / exit 6 with the message `dependency_target_ambiguous` - an internal token, not a sentence, with no hint and no input. Nothing about the invocation was invalid: the same command succeeds when run alone. Reproduces at 10 and at 12 concurrent writers.

Consequences:

- A caller implementing the obvious retry policy ('retry on exit 5') will not retry these, and will surface an unexplained failure instead.
- The message is an internal identifier. The contract's diagnostics section (opum-doc `docs/specs/opum-command-contract.md` section 5) models failures as typed values carrying `message` and an optional `hint`; `dependency_target_ambiguous` is neither human-readable nor actionable.
- The remaining records are consistent and `doctor` reports healthy afterwards, so this is a classification problem rather than corruption.

Also worth recording: there is no built-in retry, so 10 concurrent creates yield 2 successes. That may be the intended optimistic-concurrency contract, but it should be stated in the agent instructions so callers know retry is theirs to implement.

## B. A permission failure is classified validation rather than denied

    $ quest init --json >/dev/null
    $ quest task create "Before" --actor jdn --actor-kind human --json >/dev/null
    $ chmod -R a-w .quest
    $ quest task create "Should not persist" --actor jdn --actor-kind human --json ; echo "exit=$?"
    {"error_type":"validation","message":"EACCES: permission denied, mkdir '.../.quest/tasks/.write.lock'","principal":null}
    exit=6

The behaviour is otherwise correct - the write does not happen, reads keep working, and the raw errno message is at least specific. But the taxonomy reserves `denied` (exit 4) for exactly this, and a caller distinguishing 'your input was wrong' from 'I could not write' has to string-match `EACCES` to do it.

lore-cli hit and fixed the same class of issue under LCLI-108 ('readConfigText maps EACCES/EPERM config read failures to validation not denied'), so there is a sibling precedent for the mapping.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Write contention always surfaces as error_type conflict with exit 5, never as validation
- [x] #2 No internal token such as dependency_target_ambiguous reaches a user-facing message; failures carry a readable message and, where useful, a hint
- [x] #3 EACCES and EPERM on the task store map to error_type denied with exit 4
- [x] #4 The agent instructions state whether callers are expected to implement their own retry on conflict
- [x] #5 A concurrency test asserts that every non-zero exit from N concurrent writers is exactly 5, and a permissions test asserts exit 4
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Classify filesystem EACCES and EPERM exceptions as denied/exit 4 before generic validation handling.
2. Translate the exact dependency_target_ambiguous contention token to a readable conflict/exit 5 diagnostic with an explicit retry hint; preserve unrelated validation classifications.
3. Document that Quest does not retry conflicts and callers own bounded retries in the managed agent instructions.
4. Add repeated multi-process writer coverage that constrains every failure to conflict/exit 5 and a read-only store test that constrains permission failure to denied/exit 4 without mutation.
5. Run focused and full qualification, bump the combined QCLI-106/QCLI-107 release once, rebuild/check all six artifacts, independently review, and deliver through dev.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation is intentionally a narrow boundary translation. Only EACCES/EPERM become denied, and only dependency_target_ambiguous becomes a readable retryable conflict. Other domain validation tokens retain their current behavior. QCLI-106 and QCLI-107 share main.ts and the managed instruction string, so they are serialized on one branch and will share one version/artifact rebuild.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented and independently approved at source commit c4e5dcd atop QCLI-106. The CLI maps EACCES/EPERM to denied/exit 4 before generic classification, and translates only tracker write conflict or the exact dependency_target_ambiguous contention token to a readable conflict/exit 5 diagnostic with a retry hint. Managed agent instructions state that Quest does not retry conflicts and callers own bounded retry. Five independent 12-writer process rounds assert every nonzero result is conflict/5 and never leaks the token; the task-store permission test asserts denied/4, successful reads, and no mutation. Focused combined verification passed 26 tests / 867 expectations; full bun run check passed 160 tests / 1398 expectations.
<!-- SECTION:FINAL_SUMMARY:END -->
