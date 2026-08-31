---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Operate Quest CLI autonomous documentation campaigns
tags:
  - operations
  - campaigns
  - backlog
  - automation
  - performance
summary: Records the Quest CLI-local fast operating profile for autonomous Backlog-driven documentation campaigns, including authority, bounded parallelism, delivery, validation reuse, and measurable targets.
timestamp: 2026-08-14T01:40:27.519Z
---

# Operate Quest CLI autonomous documentation campaigns

Quest CLI documentation campaigns use an **autonomous-docs** fast lane: a confirmed
repository-local campaign runs from inventory through delivery and owned cleanup without
routine approval pauses. This is an operating profile, not authority to build the
future `quest` product or to decide product, security, publication, or release policy.

[`AGENTS.md`](../../AGENTS.md#autonomous-documentation-campaigns) is the normative
authorization; the canonical user-level `backlog-handover` skill (moved out of this
repository to `/Users/jdnewhouse/.agents/skills/backlog-handover` — see "Worktree and
cleanup hygiene," below) implements it. [QCLI-71](../../backlog/tasks/qcli-71%20-%20Adopt-the-autonomous-documentation-campaign-fast-lane.md)
established this record; [QCLI-96](../../backlog/tasks/qcli-96%20-%20Make-autonomous-campaigns-loop-until-a-true-pause.md)
owns its continuous-loop and session-renewal amendments.

## Details

### Quest-local boundary

The campaign scope is `quest-cli` only. A coordinator may use the confirmed scope for
local Backlog and Lore operations, documentation and repository-process edits, isolated
worktrees and branches, commits, delivery to non-production `dev`, and removal of only
campaign-created merged artifacts. The workspace profile grants no sibling repository
authority; a cross-repository request is a new scope boundary.

One coordinator owns every Backlog task and tracker mutation, handover, Lore-generated
surface, integration branch, and remote action. Up to three agents may explore, sweep,
write, review, or test in parallel only from one pinned base and with explicit
non-overlapping path budgets. The coordinator dispatches workers as this session's own
Claude Code subagents; Codex is retired as a dispatch target for this fleet. Workers
return evidence rather than mutate shared state.

The loop pauses only for a material product, security, publication, release, or
repository-admin decision; missing credentials; unresolved merge conflict; unrelated
dirty overlap; destructive action outside campaign-created artifacts; scope expansion;
or verification that remains failed after bounded remediation. `dev` to `main` remains
outside this authority.

### Fast path

1. `init` inventories only ready, agent-resolvable Quest CLI documentation and
   repository-process tasks, creates one compact tracker, writes the active cursor, and
   immediately enters restore/execution.
2. Restore grounds live task, Git, worktree, and tracker facts. It constructs a
   conservative dependency and file-conflict graph instead of trusting a promised wave.
3. Dispatch the widest safe wave, with no more than three agents. The coordinator
   serializes shared-state changes and integration.
4. Settle each task's detailed evidence on that task, one compact disposition per task
   in its tracker, and recompute readiness immediately. A completed wave is not a pause.
5. Integrate reviewed work into at most one Quest CLI pull request per wave to `dev`.
   Continue through merge verification, task settlement, artifact cleanup, and the next
   ready wave. A PR, merge, or cleanup boundary is not a pause.

### Stop and session-renewal contract

A nonterminal run has exactly two exit forms. `human-decision` names a real authority
boundary or external blocker and the one human action that unblocks it. `session-renewal`
is used only after durable state is flushed because the environment must end or the
context is demonstrably unreliable. It tells the operator to run `/clear`, start a new
session in `quest-cli`, invoke `$backlog-handover restore`, and continue without
reconfirmation. Routine context growth or a preference for a smaller session is not a
reason to stop.

Both forms record the tracker, numeric queue partition, branch and worktree, exact last
completed stage, retained artifacts, and exact next action. The lifecycle audit rejects
a vague or ungrounded cursor. When the queue is empty, the coordinator completes the
tracker, removes the executable cursor, audits completion, and leaves no closed campaign
available to restore.

### Worktree and cleanup hygiene

The canonical user-level skills give the coordinator its fenced lease workflow and worker
procedures: `opum-worktrees` for reusable agent worktrees, with `backlog-handover`
alongside, both under `/Users/jdnewhouse/.agents/skills/` (outside this bundle by
authority of the opum-agent shared skill source record). `codex-worker` is retired along
with Codex as a dispatch target. Clean detached pool entries are infrastructure, not
debris; workers never release their own leases.

Dirty campaign work is classified by content, not by `git status` alone. Work already
represented on `dev` may be cleaned under merged-artifact authority. Unique in-scope work
is preserved on an owned recovery branch and returned through review and delivery. Unique
unrelated or decision-dependent work is retained with exact ownership and disposition.
Safe pruning, merged-branch cleanup, and a clean fast-forward proceed separately instead
of being bundled into a request to discard unique changes.

Backlog task/status reads do not fetch: [`backlog/config.yml`](../../backlog/config.yml)
sets `remote_operations: false`. Delivery grounds Git remote state explicitly only when
the standing authority and a delivery decision require it.

### Compact state and validation economy

The coordinator's session keeps its sole executable cursor at `.claude/handovers/active.md`.
Codex is retired as a dispatch target for this fleet; a leftover `.codex/handovers/active.md`
from before that retirement is migration input only: ground it against live Backlog and Git
state, preserve any incomplete campaign in the current cursor, then remove the legacy
executable file and audit that directory as complete.

Each tracker stays below 200 lines and 32 KiB; the one executable `active.md` cursor
stays below 120 lines and 16 KiB. Historical handovers are non-executable. Commands,
gate results, review findings, and risks belong on the owning task rather than in the
tracker or cursor.

Record every gate as repository, exact tree SHA, command, and result. Reuse a result
only while the tree is identical: a rebase, conflict resolution, generated rewrite, or
different merge tree invalidates it, while a new commit object with the same tree does
not. Pure documentation gets focused checks while authored and one cumulative final-tree
`lore sync`, `lore validate --strict`, `lore check --strict`, and `git diff --check`.
Skills, configuration, scripts, and cross-repository contracts add only their focused
checks; a full suite is never repeated for an identical tree.

The first failed gate receives diagnosis, one safe in-scope correction, and a rerun. A
second failure requires independent review or an alternate safe fix when available;
only then is it a pause boundary.

### Operating targets

Measure the first five campaigns under this profile:

| Measure | Target |
| --- | --- |
| Routine approval prompts after campaign invocation | 0 |
| Init-to-first-edit turns | 1 |
| Ready non-conflicting tasks dispatched together | At least 2 when two exist |
| Delivery pull requests | At most 1 per repository per wave |
| Tracker settlements | 1 per wave |
| Strict Lore gates | 1 per distinct final wave tree |
| Duplicate full-suite runs on an identical tree | 0 |
| Tracker or handover truncation/repair incidents | 0 |

If the targets miss, inspect campaign traces for serial dispatch, repeated task reads,
approval escalation, duplicated validation, conflict reconstruction, and tracker growth
before increasing model effort.
