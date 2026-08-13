# Templates

## Campaign doc

Created once at init:

```bash
backlog doc create "Backlog campaign tracker" -p campaigns -t other
```

Thereafter updated **only** via `backlog doc update <docId> --content "..."` — never by editing the file under `backlog/docs/` directly, and never placed in the lore-managed `docs/` tree.

The doc deliberately holds only what Backlog cannot express natively. Status, dependencies, acceptance criteria, plans, notes, and final summaries all live on the tasks themselves; duplicating them here is how the two records drift apart.

```markdown
# Backlog campaign tracker

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of
<date / wave N>, roughly <count> ready, <count> blocked.

## Confirmed queue order

Confirmed by the user on <date>. This is the wave-builder's tie-break, NOT a
guarantee that any task lands in any particular wave.

1. QCLI-<N> — <title>
2. …

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

`Stage reached` uses `reference/wave-loop.md`'s **Per-task stage numbers** scale. Its numeral and stage annotation must name the same defined stage; append extra context only after that matching annotation.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

## Needs a human / blocked

- QCLI-<N>: <why an agent alone cannot finish it, or the reviewer's stated
  escalation reason>

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed. Each entry is a ready-to-run proposal.

- From wave <N> integration review: **<title>**
  <description>
  ACs: <criterion>; <criterion>

## Wave log

- <date> — wave <N> (tasks: QCLI-<Ns>): <what happened per task; any
  request_changes/escalate verdicts with the reviewer's stated reasoning and how
  they resolved; merged SHAs; any wave-level integration finding>
```

---

## Handover

Active file: `.claude/handovers/HANDOVER-{YYYY-MM-DD}-backlog-campaign.md`, gitignored. On consumption, move it to `archive/handovers/` (tracked) and commit on the default branch; on name collision, suffix `-2`, `-3`, … One active handover per topic.

```markdown
# Handover — {one-line goal} (waves: {N}, tasks: {QCLI-Ns})

**Date**: {YYYY-MM-DD} | **Grounded against**: {branch @ SHA, clean/dirty, ahead/behind} | **Campaign doc**: {backlog doc id + path}

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in {repo path}. {N} waves completed this session,
{M} tasks resolved (all recorded in Backlog — check status Done with the
campaign label). Queue order confirmed by the user on {date}; do not re-ask.
The ready set is recomputed live at restore — do NOT hardcode a "next wave"
list here.
{Locked decisions, traps, and for each still-in-flight item: worktree path +
branch + last completed stage number.}
```

## State

| Item | Status |
| ---- | ------ |

## This session's in-flight wave (omit if clean)

`Stage reached` uses `reference/wave-loop.md`'s **Per-task stage numbers** scale. Its numeral and stage annotation must name the same defined stage; append extra context only after that matching annotation.

| Task | Worktree path | Branch | Stage reached | Note |
| ---- | ------------- | ------ | ------------- | ---- |

## Next steps

1. {ordered, concrete, with file/task references}

## Critical context / traps

- {non-obvious constraints}

## Do not repeat

- {failed approaches: "tried X, failed because Y"}
```

Rules:

- **No invented content.** Every SHA and status verified by command in W1; gaps stated as gaps.
- **Failed approaches are mandatory** when anything failed.
- **Never persist a "next wave" plan** — the next restore recomputes it live, and a stale plan is worse than none.
- No secrets and no machine-specific absolute paths in anything committed. Worktree paths belong in the gitignored active handover, not the archived copy's committed prose, if they leak local layout.
