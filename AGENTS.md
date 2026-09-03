<!-- What this file is. Read before adding to it. -->
<!--
AGENTS.md is NOT where this repository's rules live. CLAUDE.md is: the fleet
operating block, the repository profile, ownership and the dangerous set.

Two things read this file, and neither is Claude Code, which does not load it:

  1. opum-agent's `assertNoMigrationLaunchFence`, which requires the
     `opum-agent shared skill source: ...` marker line below. It is a substring
     check, not a hash -- `lore agents` may reformat around it freely, but
     hard-wrapping that line mid-string breaks the fleet's launch gate.
  2. The `backlog-handover` skill, whose step 2 says to read every applicable
     AGENTS.md and whose SKILL.md:107 calls it "the authority ledger". That is
     what the autonomous-docs block below is -- a standing campaign grant that
     NARROWS authority. Do not delete it as boilerplate.

The AUTHORITY LEDGER for this repository is CLAUDE.md's `opum:fleet-operating`
block, section "Ownership", as narrowed by the autonomous-docs block below.

Because nothing loads this file automatically, prose written here drifts unseen --
opum-doc's copy claimed `backlog/` still existed on disk for a day while its own
CLAUDE.md said otherwise. Put new repository rules in CLAUDE.md. Add to this file
only what one of the two consumers above actually reads.
-->


<!-- QUEST GUIDELINES START -->
<CRITICAL_INSTRUCTION>

## Quest Workflow

This project cut its tracker of record over from Backlog.md to Quest (`quest`,
`@opum-ai/quest` 0.3.1) on 2026-09-03 (`QCLI-160`/`QCLI-169`).

**For every user request in this project, run `quest instructions overview` before answering or taking action.**

Use the overview to decide whether to search, read, create, or update Quest tasks.

Before task lifecycle actions, read the matching detailed guide:
- `quest instructions task-creation` before creating or splitting tasks
- `quest instructions task-execution` before planning, changing status or assignee, adding a plan or implementation notes, or implementing task work
- `quest instructions task-finalization` before checking acceptance criteria, writing final summaries, or moving tasks to terminal statuses
- `quest instructions workspace` before workspace initialization or migration work

Use `quest help <command>` before running unfamiliar commands. Help shows options, fields, and examples.

Every write needs an explicit actor: `--actor <id> --actor-kind human`, or
`--actor-kind delegated-agent --accountable-human <id>` when the actor performing the
write is an agent rather than the human it is accountable to.

Do not edit `.quest/` task, draft, document, decision, or milestone JSON files directly.
Use the `quest` CLI so metadata, relationships, and history stay consistent. `.quest/` is
tracked in Git and must never be gitignored.

**`backlog/` no longer exists in this repository.** Every record it held (214 tasks,
0 excluded) has a counterpart in `.quest/tasks/`; it was removed as pure duplication
once the migration was verified, not archived elsewhere. Its full pre-removal content
is still in Git history — `git log -- backlog/` finds it, and the removal itself is a
single ordinary commit, revertible like any other. Do not recreate `backlog/` or a
`.backlog/` directory as a tracker; `quest` is the only tracker of record. Migration
renumbered Backlog's dotted subtask ids (e.g. `QCLI-97.11.1`) to flat Quest ids; the old
dotted spelling survives as a resolving alias (`quest task view QCLI-97.11.1` still
resolves), so a dotted id in older prose or commit messages is pre-cutover history, not
a broken reference. A Story's `<!-- lore:tasks -->` block rendering bare task ids
(`QCLI-1`) instead of hyperlinks into `backlog/` is expected post-cutover behavior —
already observed and reported to `lore-cli` — not local breakage.

- **Skill:** `.claude/skills/quest/SKILL.md` — how to drive quest.

</CRITICAL_INSTRUCTION>
<!-- QUEST GUIDELINES END -->

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

<!-- quest:agent-instructions:begin -->
# Quest agent instructions

This project uses Quest CLI 0.3.1 for tracker operations. Run `quest manifest --json` to discover the supported command contract. Use `quest instructions --json` for the current versioned protocol. For Backlog tracker cutover, run `quest migration backlog preview --source <project> --json`, review its digest and mappings, then apply it with `quest migration backlog apply --source <project> --digest <digest> --actor <id> --actor-kind human --json`. Quest writes require an explicit actor declaration; do not edit Quest-authored records directly. CI should run `quest agents --check --require-installed`: current instructions exit 0, while missing, drifted, or malformed managed instructions exit 6. Quest does not retry write conflicts automatically; callers should read the latest task state and perform their own bounded retry when a command returns conflict/exit 5.
<!-- quest:agent-instructions:end -->
