---
id: QCLI-161
title: >-
  No supported way to change taskIdPrefix after init; the only discoverable
  workaround is destructive
status: To Do
assignee: []
created_date: '2026-08-31 13:35'
labels: []
dependencies: []
priority: high
type: bug
ordinal: 190000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Incident report (relayed via opag, 2026-08-31, opag not naming an actor for the opum-agent case -- "the wipe there predates the ruling that led opum-cli-e2e to do it, and I have no evidence naming an actor"): opum-cli-e2e needed to change its workspace taskIdPrefix after `quest init`. There is no reinit and no prefix-change command, and `quest init` refuses with already_initialized (src/adapters/workspaces/local-workspaces.ts:100-121, verified: stats the target, throws already_initialized if `.quest/workspace.toml` exists, writes with flag "wx" so it cannot overwrite an existing file). So the only discoverable path was `rm -rf .quest && quest init`. Harmless for opum-cli-e2e (.quest/ gitignored there, zero tasks minted yet).

The same sequence is what emptied opum-agent workspace of 26 tracked task records (recovered only because opum-agent tracks .quest/ in git, via `git checkout -- .quest/`). No actor is established for that incident, but the mechanism is now understood: the init guard verified above protects the FILE (workspace.toml) from being silently overwritten, but says nothing about the DIRECTORY being removed first -- rm -rf bypasses the guard entirely, and init then succeeds as a fresh initialization with no record that anything existed before.

Confirmed no reinit/prefix-change surface exists today: grepped src/cli/main.ts for taskIdPrefix and already_initialized -- taskIdPrefix is only settable through the init wizard/flag path (lines ~530-726), gated by the same already_initialized guard; command-help.ts documents no reinit or config-edit command for init.

Two related gaps to design against, scope as the implementer sees fit:
1. A supported way to change taskIdPrefix (or any workspace.toml field) after init, without deleting the directory first.
2. Whether init (or a would-be reinit) should notice/warn when it is about to write into a `.quest/` directory that recently held real records -- e.g. sibling tasks/archive subdirectories with content, even though workspace.toml itself is absent -- rather than treating an absent workspace.toml as equivalent to "never initialized, nothing here."
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A supported command or flag exists to change taskIdPrefix (or workspace name) on an existing workspace, without removing .quest/ first
- [ ] #2 The dangerous rm -rf .quest && quest init workaround is no longer the only discoverable path for a routine taskIdPrefix change -- documented in quest init --help / quest instructions
- [ ] #3 Design states whether init detects and warns/refuses when the target directory holds task/archive content but no workspace.toml (the state rm -rf .quest followed by quest init leaves behind for anyone re-running it against a directory that still has stray Quest-owned files), or explicitly rules that out of scope with a reason
- [ ] #4 Regression test proves a workspace with existing tasks cannot be silently reinitialized by any documented command path
<!-- AC:END -->
