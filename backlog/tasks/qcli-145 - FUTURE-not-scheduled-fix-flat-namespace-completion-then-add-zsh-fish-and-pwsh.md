---
id: QCLI-145
title: >-
  FUTURE (not scheduled): fix flat-namespace completion, then add zsh, fish and
  pwsh
status: To Do
assignee: []
created_date: '2026-08-29 00:32'
labels:
  - cli
  - parity
  - future
dependencies:
  - QCLI-134
references:
  - src/cli/main.ts
priority: low
type: feature
ordinal: 177000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
NOT SCHEDULED. Filed to capture intent; the owner explicitly deferred shipping (2026-08-29).

Two separable problems, per QCLI-134:

1. QUALITY, independent of shell coverage. The generated bash script is a flat "complete -W" word list that flattens every subcommand and flag into one namespace, so it offers preview and --all at the top level where neither is valid. This is wrong regardless of how many shells are supported, and it is the half worth fixing first.

2. COVERAGE. Backlog 1.50.1 installs completions for bash, zsh, fish and pwsh; Quest emits bash only, and prints the script rather than installing it.

Downstream impact verified as none: Lore 0.3.4 does not consume Quest completion output.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The generated completion is namespace-aware: top-level offers only real top-level commands, and subcommand flags are offered only under their own subcommand.
- [ ] #2 If coverage is taken up: zsh, fish and pwsh scripts are emitted, and whether Quest installs rather than prints is decided explicitly.
- [ ] #3 A test asserts the generated script does not offer a subcommand-scoped token at top level.
<!-- AC:END -->
