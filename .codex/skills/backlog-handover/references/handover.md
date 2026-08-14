# Status and handover

## Status mode

Stay read-only after the mandatory Backlog overview. Ground the active tracker, queued and in-flight
tasks, branch/worktree state, and lifecycle audit. Report resolved, in-flight, blocked/human, and
ready counts plus one next action. Do not fetch merely for status.

## Write mode

Write only for a real blocker, environment stop, or unsafe context growth—not a successful wave.
Flush task and compact tracker facts through Backlog, then mechanically audit the tracker before
replacing `.claude/handovers/active.md`:

```sh
backlog doc view <tracker-id> --plain | node .codex/skills/backlog-handover/scripts/audit-campaign-tracker.mjs
```

It must be at most 200 lines and 32 KiB. Keep the handover below 120 lines and 16 KiB:

```markdown
# Handover — <campaign>
**Lifecycle**: executable-current
**Grounded against**: <quest-cli branch, full SHA, dirty/ahead state>
**Tracker**: <id and title>
**Mode**: autonomous-docs
## Paste-ready prompt
Use `$backlog-handover restore` in quest-cli. Continue under the persisted contract and tracker;
recompute readiness live.
## State
- Resolved / in flight / blocked / ready counts
## In flight
| Task | Worktree/branch | Last verified tree and stage | Blocker or next action |
## Exceptions
```

Historical handovers use the historical marker, omit the prompt, and contain no imperative or
`$backlog-handover` continuation text. Run the lifecycle audit after replacement.
