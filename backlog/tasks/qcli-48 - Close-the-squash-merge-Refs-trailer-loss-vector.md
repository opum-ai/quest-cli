---
id: QCLI-48
title: Close the squash-merge Refs trailer-loss vector
status: In Progress
assignee: []
created_date: '2026-08-07 20:27'
updated_date: '2026-08-08 01:08'
labels:
  - campaign
  - 'cluster:campaign-machinery'
  - wave-2
dependencies: []
priority: medium
type: chore
ordinal: 67000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A `Refs: QCLI-<N>` line separated from the final trailer block by a blank line is **not** parsed by git as a trailer. `git interpret-trailers --parse` returns only the trailing `Co-Authored-By:` block, and `%(trailers:key=Refs)` reports empty — silently defeating the exact measurement `QCLI-47`'s evidence and provenance record depend on.

Discovered during doc-11 wave-1 review (2026-08-07) and confirmed to predate that wave:

- `QCLI-47`'s own branch commit `6f3236f` carried the line but not a parseable trailer. Fixed at merge by authoring the squash message explicitly; the merged `694e109` parses correctly.
- **`7efc1a4` — the already-merged `QCLI-43` squash commit — carries no parseable `Refs` trailer on `dev` today.** Compare `342e76d`, a directly-authored settlement commit, which parses correctly.

The pattern: directly-authored commits keep their trailer; PR squash-merges lose it when the generated body places `Refs:` above a blank line and another trailer block. This means some commits counted as "untrailered" by a `%(trailers:key=Refs)` sweep may in fact contain the text — so any future sweep using that method needs to distinguish the two.

Scope: a verification rule plus a sweep. Does **not** rewrite history — no existing commit is amended or re-trailered.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A sweep of `dev` identifies every merged commit whose message text contains a `Refs:` line that `git interpret-trailers --parse` does not report, with the command and the per-commit result recorded
- [ ] #2 The backlog-handover skill states that a Refs trailer must sit in the final trailer block with no blank line separating it from other trailers, and names `git interpret-trailers --parse` as the verification
- [ ] #3 The skill shows a worked correct example and a worked incorrect example, so the failure mode is recognizable without re-deriving it
- [ ] #4 The disposition of the already-merged non-parseable commits (notably `7efc1a4`) is recorded as an explicit decision rather than left implicit
- [ ] #5 No existing commit is amended or re-trailered; `git log` on `dev` shows no rewritten history
<!-- AC:END -->
