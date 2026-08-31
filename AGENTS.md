
<!-- BACKLOG.MD GUIDELINES START -->
<!-- backlog.md-instructions-version: 1.48.0 -->
<CRITICAL_INSTRUCTION>

## Backlog.md Workflow

This project uses Backlog.md for task and project management.

**For every user request in this project, run `backlog instructions overview` before answering or taking action.**

Use the overview to decide whether to search, read, create, or update Backlog tasks.

Before task lifecycle actions, read the matching detailed guide:
- `backlog instructions task-creation` before creating or splitting tasks
- `backlog instructions task-execution` before planning, changing status or assignee, adding a plan or implementation notes, or implementing task work
- `backlog instructions task-finalization` before checking acceptance criteria, writing final summaries, or moving tasks to terminal statuses

Use `backlog <command> --help` before running unfamiliar commands. Help shows options, fields, and examples.

Do not edit Backlog task, draft, document, decision, or milestone markdown files directly. Use the `backlog` CLI so metadata, relationships, and history stay consistent.

</CRITICAL_INSTRUCTION>
<!-- BACKLOG.MD GUIDELINES END -->

## Repository delivery scope

This repository owns mutations only within `/Volumes/external/repos/quest-cli`, including
its Backlog, Lore, Git, worktree, delivery, and cleanup state; it must not mutate any
sibling repository. See this repository's `CLAUDE.md` for how sessions coordinate across
the fleet.

- Use the canonical user-level skills `backlog-handover` and `opum-worktrees` under
  `/Users/jdnewhouse/.agents/skills/{backlog-handover,opum-worktrees}`. Do not allow
  repository copies of those skills to shadow the user-level procedures.
- Authority marker (immutable): opum-agent shared skill source: /Volumes/external/.opum-worktrees/opum-agent-fb33aefbfb36/64/opum-agent/tooling/codex-skills
  This exact line is read by opum-agent's own migration-launch-fence gate
  (`assertFinalizedInstructionMarkers`, tooling/agent-skills/src/source-migration.mjs) as a
  substring check on `origin/dev`. Do not remove or reword it without confirming with
  opum-agent first; verified 2026-08-30.
- Deliver only through the non-production integration branch `dev`; `main` promotion requires
  separate explicit user authority.

<!-- autonomous-docs:begin -->
## Autonomous documentation campaigns

A user invocation of `$backlog-handover init` or `$backlog-handover restore`, or a request to
burn down Quest CLI documentation backlog work, authorizes `autonomous-docs` mode for the confirmed
quest-cli-only scope. A bare `init` means every ready, agent-resolvable documentation and
repository-process task in this repository, excluding `do-not-activate` history, external-state
blockers, and material owner decisions.

Within that scope, proceed without further prompts through local Backlog and Lore mutations,
in-scope quest-cli edits, isolated worktrees and branches, commits, pushes, pull requests to this
repository's non-production integration branch `dev`, merges after required checks, and deletion of
only campaign-created merged branches and disposable worktrees. This authority does not grant
access to sibling repositories: they are neither selected nor writable under this contract. The
coordinator alone owns Backlog, campaign, generated Lore, integration, and remote delivery state;
workers receive isolated worktrees and explicit non-overlapping path budgets. Parallel execution
with up to three subagents is authorized. Do not amend, force-push, or rewrite Git history.

Pause for a material product, security, publication, release, or repository-admin decision; missing
credentials; repeatedly failed required verification; unresolved merge conflicts; unrelated dirty
overlap; destructive action outside campaign-created artifacts; or any scope expansion beyond
quest-cli. Promotion from `dev` to `main` is never standing authority. A check is repeatedly failed
only after diagnosis, one safe in-scope remediation and rerun, plus an independent review or
alternate safe fix when available; a first transient failure is not a stopping condition.

Keep executing through task work, independent review, commits, `dev` pull requests and merges,
settlement, safe cleanup, and newly ready waves. A wave boundary, merged pull request, cleanup pass,
or subjective context-size preference is not a stopping condition. Every nonterminal stop must be
one of two explicit forms: a named human decision or blocker from the list above, or a session
renewal after durable state is flushed because the environment must end or context is no longer
reliable. A session renewal must tell the operator to run `/clear`, start a new session in
`quest-cli`, invoke `$backlog-handover restore`, and continue the persisted campaign without
reconfirmation. In either form, report the tracker, queue counts, branch and worktree, last completed
stage, retained artifacts, and exact next action.
<!-- autonomous-docs:end -->

<!-- lore:agents:begin -->
This repo uses **lore** — an OKF-native documentation CLI — for the docs bundle under `docs/`.
When working on documentation, drive it through `lore` (not a plain editor) so Story <-> Task
coupling, managed blocks, and cross-links stay coherent.

- **Skill:** `.codex/skills/lore/SKILL.md` — how to drive lore.
- **Just-in-time detail:** run `lore instructions` for the canonical agent loop, then
  `lore instructions <topic>` (`linking`, `sync`, `check`, `validation`, `workspace`).
<!-- lore:agents:end -->
