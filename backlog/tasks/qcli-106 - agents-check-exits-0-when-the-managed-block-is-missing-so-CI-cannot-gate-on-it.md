---
id: QCLI-106
title: >-
  agents --check exits 0 when the managed block is missing, so CI cannot gate on
  it
status: To Do
assignee: []
created_date: '2026-08-17 15:33'
updated_date: '2026-08-17 16:26'
labels:
  - cli
  - agents
  - ci
  - exit-codes
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
documentation:
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
priority: medium
type: bug
ordinal: 129000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`quest agents --check` returns exit 0 both when the managed instruction block is present and current, and when `AGENTS.md` does not exist at all. A CI job gating on this command cannot tell a healthy bridge from one that was never installed or was deleted.

Candidate: v0.2.0, native darwin-arm64 sha256 1d5491bd90ab7fb3a9d97d700023088ebbbae75ce23eca4dc345076895cb5ad5.

## Repro

    $ quest init --json
    $ ls AGENTS.md
    ls: AGENTS.md: No such file or directory

    $ quest agents --check --json ; echo "exit=$?"
    {"schemaVersion":1,"kind":"agent.instructions-status","data":{"state":"missing"}}
    exit=0

    $ quest agents --update-instructions --json >/dev/null
    $ quest agents --check --json ; echo "exit=$?"
    {"schemaVersion":1,"kind":"agent.instructions-status","data":{"state":"current"}}
    exit=0

Both states exit 0. Only `drift` is mapped to a non-zero code:

    $ # tamper inside the managed markers
    $ quest agents --check --json ; echo "exit=$?"
    {"error_type":"drift","message":"Quest agent instruction block differs from version 0.2.0.","principal":null}
    exit=6

In `src/cli/main.ts` the check branch reads `if (check2 && result.state === "drift") return failure("drift", ...)`, so `missing` falls through to the success path.

The JSON payload does distinguish the states, so a consumer parsing `data.state` is fine; the gap is the exit code, which is what a shell CI gate actually uses. The drift case already proves the command is meant to be gateable.

Whether `missing` should gate is a product call - a repository that deliberately does not install the bridge should not fail CI. If so, the fix may be a flag (for example `--require-installed`) rather than changing the default. What should not stand is that the default gives no exit-code-visible difference between 'installed and correct' and 'not installed at all'.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A CI gate can distinguish 'current' from 'missing' by exit code, whether by default or behind an explicit flag
- [ ] #2 The chosen behaviour is documented in the command's help and in the agent instructions
- [ ] #3 The drift case keeps exit 6 and its drift error_type
- [ ] #4 Tests cover current, missing, drift, and malformed-marker states and pin each one's exit code
<!-- AC:END -->
