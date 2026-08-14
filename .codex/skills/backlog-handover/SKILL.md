---
name: backlog-handover
description: Initialize, restore, run, inspect, or hand over autonomous Backlog.md campaigns in this repository. Use when the user invokes backlog-handover, asks to burn down multiple tasks, requests the next safe task or a parallel documentation wave, or needs unfinished campaign state preserved for another session.
---

# Backlog Handover

Drive Quest CLI campaigns from live Backlog, Git, and Lore state. Keep one compact tracker per
campaign and one disposable restart pointer. Optimize documentation work for continuous,
bounded-parallel execution while stopping at this repository's explicit human-decision boundaries.

## Start every invocation

1. Run `backlog instructions overview` before answering or acting.
2. Read every applicable `AGENTS.md`. Its autonomous-docs section is standing campaign authority.
3. Select the explicit mode, or infer clear natural-language intent:
   - `init`: establish a campaign and immediately begin its first live wave.
   - `restore`: ground and continue the active campaign until complete or genuinely blocked.
   - `write`: flush unfinished state and replace the active handover.
   - `status`: inspect and report without mutation; use only when intent is genuinely ambiguous.
4. Run `node .codex/skills/backlog-handover/scripts/audit-handover-lifecycle.mjs` whenever
   `.claude/handovers/` exists. Reconcile drift before unrelated dispatch.
5. Read the complete mode reference before continuing: `references/init.md` (then
   `references/restore.md`) for init, `references/restore.md` for restore,
   `references/handover.md` for write/status, and `references/delivery.md` only once an integrated
   result is ready.

Before task planning, status changes, notes, or implementation, run `backlog instructions
task-execution`. Before final task disposition, run `backlog instructions task-finalization`.

## State and ownership

Trust live Backlog tasks first, then the active campaign's Backlog document, then the short
`.claude/handovers/active.md` restart pointer. Treat `doc-1` as frozen legacy history: never append
another campaign or copy completed history into it.

The coordinator alone writes Backlog tasks, campaign documents, handovers, Lore-generated surfaces,
integration branches, and remote delivery state. Workers edit only assigned source paths in isolated
worktrees and return structured evidence. Serialize all shared-state mutation.

## Execution policy

- Dispatch the widest safe wave, up to three agents, whenever ready tasks lack dependency and
  file-conflict edges; do not default to one task.
- Recompute readiness after settlement and continue directly; wave, PR, or cleanup completion is
  not itself a stopping point.
- Batch reviewed work into at most one PR for this repository per wave, targeting `dev` only when
  the governing `AGENTS.md` authority applies.
- Record validation by exact tree SHA and reuse it only while the tree is identical. Rerun only gates
  invalidated by a changed tree, while satisfying required final gates.
- Search before filing a clear in-scope follow-up; record genuine product or owner choices as human
  decisions instead of inventing answers.

## Invariants and failure handling

- Use the Backlog CLI for every Backlog read or mutation. Keep implicit Backlog remote operations
  disabled; ground remote Git explicitly only for authorized delivery.
- Route `docs/` work through Lore. Never hand-edit managed blocks, indexes, or logs.
- Preserve unrelated dirty state. Use one pinned integration base per wave and no shared stash.
- `active.md` is the sole executable cursor; historical handovers have no runnable continuation.
  Run `scripts/test-audit-handover-lifecycle.mjs` whenever lifecycle semantics change.
- Do not expose secrets or private endpoints. `dev` to `main`, publication, material decisions,
  repository administration, and deletion outside campaign-created merged artifacts require explicit
  authority.
- A first failed gate triggers diagnosis, one safe remediation, and a rerun. If it still fails, use
  independent review or an alternate safe fix when available; persist a handover only if that bounded
  loop still fails or a stated pause condition applies.

End each mode with compact queue counts, unresolved exceptions, and either the next automatic action
taken or the exact human decision required.
