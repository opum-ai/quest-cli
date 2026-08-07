---
id: QCLI-49
title: Define the commit step for the orchestrator's dispatch-marking writes
status: To Do
assignee: []
created_date: '2026-08-07 20:27'
labels:
  - campaign
  - 'cluster:campaign-machinery'
dependencies: []
priority: medium
type: chore
ordinal: 68000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
With `backlog/config.yml` setting `auto_commit: false`, `backlog task edit QCLI-<N> -s "In Progress" --add-label "wave-<N>"` writes the task file and leaves it **dirty in whichever checkout ran it**. The orchestrator runs those edits in its own `dev` checkout; each worker independently commits its *own* copy of the same task file inside its worktree (plan, notes). The two copies diverge, and `reference/wave-loop.md` sections d and i never say whether the orchestrator's write should be committed.

**This is not theoretical — it broke doc-11 wave 1 (2026-08-07).** The merge queue hit `error: cannot rebase: You have unstaged changes` on `QCLI-45`, because `dev` still carried uncommitted `wave-1` / `in-review` label edits for both wave members. It was resolved by discarding the label churn (verified first to contain only labels and `updated_date`, no plan or notes) and reconstructing the labels at settlement — but that resolution was improvised mid-merge, not a documented procedure.

The same gap was independently flagged by `QCLI-47`'s worker as an out-of-scope discovery, which is corroboration from a second direction rather than the same observation twice.

Either answer is defensible and the task is to pick one and write it down:

- **Commit them** — dispatch marking becomes a real commit on `<default>` (and under `QCLI-47`'s hybrid rule it carries `Refs: QCLI-<N>`, since it has a single directing task).
- **Leave them uncommitted and discard at settlement** — cheaper, but then the merge queue needs an explicit "orchestrator checkout must be clean before rebasing any member" precondition, and crash recovery loses the dispatch marking that R2/R3 rely on to tell what actually got underway.

Note the interaction with `R4d`'s stated purpose: the marking exists so a crashed session's R2/R3 can tell which members were really dispatched. An uncommitted marking does not survive a crash, which is an argument the chosen answer has to address either way.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The skill states, at the point of action in `reference/wave-loop.md` section d, whether dispatch-marking and in-flight-pointer writes are committed — and if so, on which ref and with which trailer under QCLI-47 hybrid rule
- [ ] #2 The merge queue (section g) carries an explicit precondition about the orchestrator own checkout being clean before rebasing a member, or an explicit statement that it cannot be dirty given the chosen answer
- [ ] #3 The interaction with the worker own committed copy of the same task file is described, including what happens to it at merge
- [ ] #4 The chosen answer addresses whether dispatch marking survives a crash, since R2/R3 reconciliation depends on it
- [ ] #5 The rule is stated concretely enough that a future session does not re-derive it: a reader can tell what to run, in what order, without inference
<!-- AC:END -->
