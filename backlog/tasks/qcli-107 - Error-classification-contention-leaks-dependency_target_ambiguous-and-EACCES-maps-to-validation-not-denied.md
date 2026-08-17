---
id: QCLI-107
title: >-
  Error classification: contention leaks dependency_target_ambiguous, and EACCES
  maps to validation not denied
status: To Do
assignee: []
created_date: '2026-08-17 15:46'
updated_date: '2026-08-17 18:48'
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
- [ ] #1 Write contention always surfaces as error_type conflict with exit 5, never as validation
- [ ] #2 No internal token such as dependency_target_ambiguous reaches a user-facing message; failures carry a readable message and, where useful, a hint
- [ ] #3 EACCES and EPERM on the task store map to error_type denied with exit 4
- [ ] #4 The agent instructions state whether callers are expected to implement their own retry on conflict
- [ ] #5 A concurrency test asserts that every non-zero exit from N concurrent writers is exactly 5, and a permissions test asserts exit 4
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
External verification against candidate 0.2.2 (native darwin-arm64 sha256 8ae73c74536b28870532e94d97686ee1c65ac094f69a357ec1139bcba6fffb9e), 2026-08-17.

Part A still reproduces. 12 concurrent `task create` calls, repeated over 6 independent workspaces: dependency_target_ambiguous (error_type validation, exit 6) appeared in 5 of 6 rounds, 2-4 writers per affected round. The remaining losers correctly report conflict/exit 5. Records stayed unique and no writer crashed in any round, so this is classification only, not corruption.

Warning for whoever implements this: a single-round concurrency test is flaky against this defect. One round in six came back clean and would have shown a false pass. The external harness row (opum-cli-e2e, suite 27-quest-fault) was changed to repeat 5 rounds and aggregate for exactly this reason; a fix should be verified the same way rather than on one sample.

Part B still reproduces unchanged: with .quest made read-only, a write returns error_type validation / exit 6 carrying the raw EACCES text, where the taxonomy reserves denied / exit 4.
<!-- SECTION:NOTES:END -->
