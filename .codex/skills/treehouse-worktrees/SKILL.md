---
name: treehouse-worktrees
description: Provision, inspect, return, and safely prune reusable Treehouse git worktrees for parallel Codex agents. Use when a Quest CLI coordinator needs isolated worktrees for subagents, must recover or reconcile Treehouse leases, or must classify pooled worktrees during campaign cleanup without losing dirty or unlanded work.
---

# Treehouse Worktrees

Use Treehouse as a reusable worktree pool, not as a second campaign tracker. The campaign
coordinator owns lease allocation, branch creation, return, and pruning. A subagent works only in
the exact leased path and returns evidence to the coordinator; it does not release its own lease.
This repository's `treehouse.toml` caps the pool at three and roots it under the ignored
`.treehouse/` directory so Terra/medium agents can use it within the Quest workspace sandbox.

Upstream behavior and flags are documented in the
[Treehouse repository](https://github.com/kunchenguid/treehouse). Confirm installed behavior with
`treehouse <command> --help` before using an unfamiliar or version-sensitive flag.

## Acquire an isolated worktree

1. Confirm `treehouse` is installed. Fall back to coordinator-owned `git worktree add` when it is
   unavailable; do not install tools during a campaign without user authority.
2. Pin the wave's exact integration SHA before allocation. Run `treehouse status --json` from the
   repository and reconcile any lease whose holder matches the campaign but lacks a live task.
3. Allocate non-interactively with a unique task-and-role holder:

   ```sh
   treehouse get --lease --lease-holder qcli-96-writer --json
   ```

4. Record the returned `path`, immutable `lease_id`, holder, task, and pinned base in coordinator
   state. Treehouse worktrees start detached; the coordinator creates the task branch at the pinned
   SHA before dispatch.
5. Give the subagent the absolute path, task, base SHA, branch, allowed paths, required checks, and a
   reminder that Backlog, Lore-generated surfaces, integration, delivery, and lease state remain
   coordinator-owned.

Never assign two agents the same path. Never infer that a lease is abandoned merely because no
process is running; durable leases intentionally survive without a process.

## Settle a returned agent

Require the agent to return task id, base/head SHA, changed paths, checks/results, findings, risks,
and follow-ups. Before releasing the lease, the coordinator must prove one of these:

- the worktree is clean and its work is merged into the pinned/current integration branch;
- its patch is equivalent to already integrated work; or
- every unique change is preserved on an owned branch with exact disposition recorded.

Release a verified lease with identity fencing so stale cleanup cannot release a later lease:

```sh
treehouse return --if-lease-id <lease-id> --if-lease-holder <holder> <path>
```

## Deliver native package artifacts

From an isolated, clean-index worktree with Bun, npm, Git identity, and the target Bun executables
available, run:

```sh
bun run deliver:packages -- --message "chore: refresh platform packages"
```

It builds each of the six `QUEST_BUN_TARGET` values serially, emits JSON-line evidence, stages only
the root manifest plus native package artifacts, rechecks the package gates, and makes one ordinary
Git commit. Unrelated unstaged work is preserved. It refuses a pre-staged index, conflicts, and
assume-unchanged/skip-worktree tags in scope. Exit 137 or SIGKILL is reported as
`memory_or_staging_failure`, with staged and missing path lists reported and any partial ordinary
staging left visible for diagnosis.

Before returning a lease, prove the exact lease identity and normal visible state:

```sh
git status --short
git diff --cached --name-only
git ls-files -v -- package.json npm/quest-*
treehouse return --if-lease-id <lease-id> --if-lease-holder <holder> <path>
```

Treehouse return resets the worktree. Do not use `--force` merely because it is dirty, and never
return a dirty or unlanded worktree until its unique state is preserved or an exact destructive
decision is explicitly authorized.

## Audit and prune

Treat clean detached Treehouse pool entries as reusable infrastructure, not repository debris.
Start cleanup with read-only evidence:

```sh
treehouse status --json
treehouse prune --verbose
```

`prune` is a dry run by default and skips leased, in-use, dirty, unmerged, or unverifiable entries.
Use `treehouse prune --yes` only after reviewing the exact current-repository candidate set. Do not
use global prune for a repository-scoped campaign. Do not use `destroy --include-unlanded`,
`--include-in-use`, or `--include-leased` under standing campaign cleanup authority.

For any dirty candidate, compare its paths and content with current integration. Patch-equivalent
campaign work may be cleaned under the campaign's merged-artifact authority. Preserve unique
in-scope work on a recovery branch and route it back through review/delivery. Retain genuinely
unrelated or decision-dependent work with its owner, reason, and cleanup condition; do not bundle it
into a broad discard request.

If Treehouse reports recovered pool state, treat every recovered entry as leased until inspected.
Do not clear or destroy a recovery lease based only on age or a missing process.
