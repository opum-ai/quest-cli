# Handover — doc-14 wave 1 complete: the Phase 0 gate is discharged (waves: 1, tasks: 3)

**Date**: 2026-08-08 | **Grounded against**: `dev` @ `3d9466a`, clean, in sync with `origin/dev` | **Campaign doc**: doc-14 (`backlog/docs/campaigns/doc-14 - Backlog-campaign-tracker.md`)

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli. Campaign
doc-14 is scoped to the issues required to begin Quest CLI implementation.
Wave 1 resolved QCLI-56, QCLI-57, QCLI-60. Two tasks remain: QCLI-58 and
QCLI-59.

THE HEADLINE: the Lore-owned activation gate is confirmed OPEN and this
repository's own Phase 0 recheck is discharged (QCLI-56, merged 1962d2a).

DO NOT read that as authorization to write product source. Both authorities
say otherwise in terms, and this is the single most important thing not to
get wrong:
  - lore-doc's gate Spec: opening the gate "removes the Lore-owned dependency
    and nothing else ... A worker who reads this section as authorization to
    start writing Quest product source has misread it."
  - This repo's evidence record: "An open Lore gate is not activation" —
    clean-room admission, research completeness, and the roadmap's Phase 0
    component checks are untouched and still owed.

QCLI-59 (amend CLAUDE.md's package.json/bin/install prohibition) has its
stated precondition satisfied but IS BLOCKED ON A USER RULING that had not
been given when this handover was written. Do not dispatch it without one.
Check whether the user has ruled since. QCLI-58 (assemble a D2 runtime
proposal) is unblocked and prepares a decision without making it.

Nothing is in flight. No branches, no leases, no open PRs.
```

## State

| Item | Status |
| ---- | ------ |
| Campaign doc | doc-14, wave-1 log written |
| Queue | 4 `To Do` (QCLI-54, QCLI-55 unlabelled and out of scope; QCLI-58, QCLI-59 in campaign), 75 `Done` |
| In flight | None |
| Blocked | QCLI-59 — needs a user ruling, not a dependency |
| Waves completed | 1 (three tasks, parallel) |
| Branch | `dev` @ `3d9466a`, clean, in sync |
| Campaign branches | None, local or remote |
| Open PRs | None |
| Worktree pool | 6 treehouse slots, all `available`, zero leases |

## Wave 1 results

| Task | Merged | Review | ACs |
| --- | --- | --- | --- |
| QCLI-56 — Phase 0 activation recheck | `1962d2a` (PR #70) | request_changes → approve | 7/7 |
| QCLI-57 — Backlog.md v1.49.3 pin | `5c24b48` (PR #71) | request_changes → approve | 6/6 |
| QCLI-60 — default-branch push defect | `49bcae9` (PR #72) | request_changes ×2 → approve | 9/9 |

## Next steps

1. `/backlog-handover restore`. R2 should find clean ground truth matching the table above.
2. **Check for a user ruling on QCLI-59 first.** Without one, wave 2 is QCLI-58 alone.
3. QCLI-58 and QCLI-59 share `cluster:decisions`/`cluster:governance` — they do not conflict, so if the ruling has been given they can share a wave. QCLI-59 also declares `--dep QCLI-56`, now `Done`.

## Critical context / traps

- **The driver defect QCLI-60 fixed is now merged**, so a future wave no longer needs the hand-applied push workaround. Verify (d) step 4 pushes before assuming.
- **QCLI-59's conditional is the obligation, not its dependency.** A `Done` predecessor whose capsule reported anything other than Pass would still mean "do not amend." The capsule *does* report Pass, in the owner's own "pass/fail" vocabulary — but that satisfies the precondition only.
- **`lore-cli`'s local clone is parked on another session's branch** (`chore/lcli-315-3-post-merge-reconciliation`). Cite `origin/dev`; do not check it out.
- **Workers must not run `lore sync`.** QCLI-56's first worker did, inside a task branch — the QCLI-43 form violation. Benign here, but `reference/templates.md` still carries no prohibition (recorded as an unfiled follow-up in doc-14).

## Do not repeat

- Do not let a default squash body through on a branch whose commit messages contain a superseded figure. QCLI-56's `625136c` still says "advanced twice"; the corrected 25/6/6 counts only reached `dev` because the squash message was hand-authored.
- Do not classify an `npm view` field as an immutable anchor without testing whether re-observation can change it. QCLI-57 failed review on exactly that.
