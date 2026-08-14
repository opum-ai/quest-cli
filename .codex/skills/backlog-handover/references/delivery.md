# Batch delivery and validation

Record each gate as `<repository> <tree SHA> <command> <result>`. Reuse it only when the exact tree
is unchanged; a rebase, conflict resolution, generated rewrite, or different merge tree invalidates
the affected evidence. A new commit object with the same tree does not.

- Pure prose: focused validation while writing, then one cumulative `lore sync`, `lore validate
  --strict`, `lore check --strict`, and `git diff --check` on the final wave tree.
- Lore coupling or managed blocks: the coordinator performs coupling/sync before strict gates.
- Skills, configuration, scripts, and executable examples: add focused parsers/tests.
- Cross-repository contracts or executable behavior: run proportionate owner tests, never a full
  suite twice on an identical tree.

Integrate reviewed work serially into one wave branch, review the cumulative diff, and deliver at
most one PR to `dev` for this repository per wave under the authorized contract. If `dev` moved,
rebase/reconstruct from its verified head and rerun only invalidated gates. A first check failure
gets one safe remediation and rerun; after a repeated failure seek independent review or an alternate
safe fix, then pause only if it remains unresolved.

Before settlement, mechanically audit the campaign tracker via `backlog doc view <tracker-id> --plain
| node .codex/skills/backlog-handover/scripts/audit-campaign-tracker.mjs`; it must be at most 200
lines and 32 KiB. After merged-head and integration-tree verification, remove only campaign-created
merged branches and disposable worktrees. Settle tasks and the one compact tracker once per wave;
retain and record any exception instead of silently deleting it.
