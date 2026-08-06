# Handover — QCLI-31/32 integration-follow-up campaign (waves: 0, tasks: QCLI-31, QCLI-32)

**Date**: 2026-08-06 | **Grounded against**: `dev` @ `94baa05`, clean, in sync with `origin/dev` (pushed) | **Campaign doc**: `doc-6`, `backlog/docs/campaigns/doc-6 - Backlog-campaign-tracker.md`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli. This is
the FIRST restore for this campaign — 0 waves completed so far, campaign was
just initialized. 2 tasks are filed and campaign-labelled: QCLI-31 and
QCLI-32. QCLI-32 has a REAL Backlog dependency on QCLI-31 (--dep QCLI-31,
not just a queue-order tie-break) — it will not be ready until QCLI-31 is
Done. Queue order confirmed by the user on 2026-08-06; do not re-ask — see
doc-6's "Confirmed queue order" section for why (a known lore-sync conflict
pattern from doc-4 wave 1).
The ready set is recomputed live at restore — do NOT hardcode a "next wave"
list here; expect wave 1 = {QCLI-31} only, then wave 2 = {QCLI-32} once
QCLI-31 settles — but recompute rather than assume.
dev is already pushed and in sync with origin/dev as of this handover.
```

## State

| Item | Status |
| ---- | ---- |
| Campaign doc | `doc-6`, populated, current |
| Tasks filed | QCLI-31 (To Do, no deps, ready), QCLI-32 (To Do, depends on QCLI-31, not yet ready) |
| Waves run | 0 |
| Worktrees | 6 `treehouse` pool slots, all `status: "available"` (no lease held) — normal idle state, not orphaned |
| Branches | none created yet for this campaign |
| Open PRs | none |
| `dev` vs `origin/dev` | in sync — `94baa05` pushed |

## This session's in-flight wave (omit if clean)

(clean — no wave dispatched this session)

## Next steps

1. Recompute the ready set live (`backlog task list --json` + `task view --json` on QCLI-31, QCLI-32) — expect only QCLI-31 ready (QCLI-32 blocked by its dependency).
2. Dispatch wave 1 = {QCLI-31} alone.
3. After QCLI-31 settles to Done, QCLI-32 becomes ready — dispatch wave 2 = {QCLI-32} alone. Do not try to force both into one wave; the dependency is deliberate (see traps below).
4. Campaign is expected to be complete after wave 2 — recompute the queue at settlement rather than assuming.

## Critical context / traps

- **QCLI-32's dependency on QCLI-31 is intentional, not a scheduling accident.** This repo already hit a real conflict from running `lore sync` in parallel with an in-flight content edit (prior campaign `doc-4`, wave 1) — `lore sync` can regenerate shared lore-managed index files repo-wide, a side effect the file-citation conflict-graph check cannot see because QCLI-31 and QCLI-32's *named* references are disjoint (`docs/specs/quest-cli-architecture.md` vs. `docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md`). Do not remove or route around the dependency to save a wave.
- **QCLI-31** is a pure-prose fix to `docs/specs/quest-cli-architecture.md` (a self-contradiction QCLI-30 left behind — see its description for exact line numbers). Gate: `lore validate --strict`. No `lore sync` should be needed.
- **QCLI-32** actually runs `lore sync` — this is the one task in this campaign where that's the intended action, not a scope violation. Its ACs require the resulting diff to be confined to the Story file's frontmatter `status` and its `<!-- lore:tasks -->` managed block; anything else the sync touches must be reported back rather than committed. Read the task's AC3 closely before letting a worker run `lore sync` unsupervised.
- **Both tasks were originally proposed by the doc-cleanup campaign's (`doc-5`) wave-1 integration review**, then approved and filed by the user in that same session, then swept into this new campaign at init. Full provenance is in QCLI-31/32's own descriptions and in `doc-5`'s wave log if more context is needed.
- Fleet-routing convention (this repo's CLAUDE.md): re-verify `opum-ai/quest-cli` org ownership via `gh api repos/opum-ai/quest-cli --jq .full_name` if it's been a while since 2026-08-04 — do not trust a redirecting old URL.
- **Agent-dispatch lesson from the doc-5 campaign, worth repeating here**: do NOT pass a `name` parameter to the Agent tool when dispatching workers/reviewers — that spins them up as async "teammate" peers that only relay results via proactive messaging (unreliable — a wait-fork cannot block on their reply). Dispatch workers/reviewers as plain Agent calls with no `name`; the tool blocks and the completion notification carries the actual return value directly. Track wave-in-flight state with TaskCreate/TaskUpdate instead of named teammates.
- **Another doc-5 lesson**: `backlog task edit` mutations run in the orchestrator's own checkout (not a worktree) must be committed and pushed immediately, not left as uncommitted local changes — an uncommitted dispatch-marking edit collided with an incoming `git pull --ff-only` after the first merge in doc-5's wave 1 and had to be discarded and redone. Commit every orchestrator-side `backlog task edit` (dispatch marks, settlement) right after running it.

## Do not repeat

- (nothing failed this session — clean init)
- See the two lessons above under "Critical context / traps" — both are process fixes from the immediately preceding campaign (doc-5), carried forward so they aren't rediscovered the hard way again.
