---
id: doc-7
title: Backlog campaign tracker
type: other
created_date: '2026-08-06 10:52'
updated_date: '2026-08-06 15:15'
---
# Backlog campaign tracker

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. As of 2026-08-06 (post wave-1): 0 ready,
0 blocked, 0 in-flight. Queue empty — campaign complete.

## Confirmed queue order

Confirmed by the user on 2026-08-06: priority tie-break 33 → 35 → 34. All
three ran as a single parallel wave as approved. **Merge order deviated from
this tie-break**: the QCLI-33 reviewer flagged that docs/log.md (QCLI-35's
target) is a per-commit ledger that QCLI-33's and QCLI-34's merges would each
add an entry to, so merging QCLI-35 before QCLI-34 would leave it stale
almost immediately. Actual merge order was 33 → 34 → 35, with the QCLI-35
branch rebased onto origin/dev after both other merges landed before opening
its PR. This is a scheduling deviation only — the tie-break governs wave
composition and priority, not literal merge sequencing, and all three still
ran as one wave exactly as approved.

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:architecture-spec | Open Questions bullet 4 in quest-cli-architecture.md, same pattern as QCLI-31 | QCLI-33 (Done) |
| cluster:terminology-reconciliation | "file layout" vs "authored-record layout" terminology tension in the register + delivery-graph contract tables | QCLI-34 (Done) |
| cluster:lore-log-sync | docs/log.md SHA drift from squash-merge rewrites | QCLI-35 (Done) |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

## Needs a human / blocked

(none — all three campaign tasks resolved without escalation)

## Proposed follow-ups (awaiting user approval)

Surfaced by wave-1 reviewers and workers; none filed, per this project's
no-autonomous-task-creation rule.

- **Fix QCLI-34's own task metadata**: its `references` field names
  `docs/registers/quest-cli-open-component-decisions.md` and
  `docs/specs/quest-cli-component-contracts-and-delivery-graph.md` — neither
  path exists (`docs/registers/` doesn't exist at all; the delivery-graph
  file lives under `docs/specs/`... no, under `docs/reference/`). The QCLI-34
  reviewer confirmed via `git diff --name-only` that the worker correctly
  edited the real files at `docs/reference/quest-cli-open-component-decisions.md`
  and `docs/reference/quest-cli-component-contracts-and-delivery-graph.md`.
  The task record's metadata is the defect, not the shipped change. ACs:
  QCLI-34's `references` field is corrected to the real paths; no other task
  metadata changed.
- **Register line 167 stale status cell**: the Spec-open-questions mapping
  table (a different table from the one QCLI-34 touched) still lists "the Git
  mutation contract items on record layout and event schema" with no status
  marker, while D4/D5 in the same cell carry bold **closed**. Now that record
  layout is closed (QCLI-34), that cell under-reports. ACs: the cell reflects
  record layout's closed status without touching event schema's (still open)
  status; lore validate --strict and lore check both pass.
- **"Naming scheme" terminology check**: both the QCLI-34 worker and reviewer
  independently confirmed "naming scheme" (a sibling open item in the same
  list "file layout" was closed from) is plausibly also settled by the same
  QCLI-25 authored-record-layout section ("filename anchored on the canonical
  id in fixed case..." is literally a naming scheme). Left untouched by
  QCLI-34 as out of its stated scope. ACs: same shape as QCLI-34 — read
  QCLI-25 closely, determine same-concept-vs-distinct, reconcile the open-item
  listing accordingly.
- **Centralized docs/log.md sync, post-wave-1**: QCLI-35 closed the
  pre-existing SHA-unreachable drift, but docs/log.md is already one sync
  behind again — it's missing entries for QCLI-34's and QCLI-35's own merges
  (ce4a130, 2b30560) and the wave-1 settlement commit (79166fa). Both wave-1
  reviewers flagged this as expected, ordinary drift, not a QCLI-35 defect,
  and recommended a follow-up sync — the same doc-6 → doc-7 pattern that
  produced QCLI-35 itself. ACs: same shape as QCLI-35 (dry-run first, confined
  to docs/log.md, 0 unreachable SHAs after, lore check 0 errors).

## Wave log

- 2026-08-06 — campaign init (doc-7). Prior campaign (doc-6, QCLI-31/32)
  closed 2026-08-06 with 0 campaign-labelled tasks remaining; queue was empty.
  doc-6's wave log had proposed 3 follow-ups, never filed per this project's
  no-autonomous-task-creation rule. User chose to file all 3 and run a full
  campaign. Created QCLI-33 (architecture-spec reconciliation, cluster
  `cluster:architecture-spec`), QCLI-34 (terminology reconciliation, cluster
  `cluster:terminology-reconciliation`), QCLI-35 (log.md sync, cluster
  `cluster:lore-log-sync`), each with description + testable ACs per
  `task-creation` guide, no implementation plan. Labelled all three
  `campaign` + cluster label. User confirmed queue order (33, 35, 34 as
  priority tie-break) and approved running all three as one parallel wave —
  no cross-task file overlap, no dependency forced. No wave dispatched yet.

- 2026-08-06 — wave 1 (tasks: QCLI-33, QCLI-34, QCLI-35), full parallel
  dispatch, all three resolved to Done. R2 ground-truth verification found no
  drift from the handover; local `dev` was 1 commit ahead of `origin/dev`
  (the campaign-init commit) and was pushed before opening any PRs, since an
  unpushed wave-base commit would otherwise bleed into every PR's diff.
  Acquired 3 treehouse worktrees, pinned to wave base `37c0a21`, dispatched
  one sonnet-tier worker + one opus-tier reviewer per task, pipelined as each
  completed:
  - **QCLI-33**: worker reworded architecture-Spec Open Questions bullet 4 to
    cite the QCLI-26 ADR's rebuild-on-doubt ruling. Reviewer: **approve**, all
    5 ACs independently confirmed (citation accuracy checked against ADR
    source, both lore gates re-run clean); 3 non-blocking nits, no changes
    requested. Reviewer's coordination note (not a defect) drove the merge-
    order deviation to 33 → 34 → 35 — see Confirmed queue order above. Merged
    ba2338f (PR #49, squash).
  - **QCLI-34**: worker determined "file layout" and "authored-record layout"
    are the same concept (high confidence) and closed both open-item
    listings accordingly. Reviewer: **approve**, all 6 ACs independently
    confirmed; built and tested the strongest counter-case for "genuinely
    distinct" and it failed on two independent grounds (threat-model
    non-goals mapping, register line 167's own "record layout" gloss) — no
    escalation warranted, evidence converges. Reviewer also resolved a path
    discrepancy in the worker's own report in the worker's favor: the task's
    `references` field names two non-existent paths; the worker correctly
    edited the real files under `docs/reference/`. Rebased cleanly onto
    QCLI-33's merge, re-verified (both lore gates clean). Merged ce4a130
    (PR #50, squash).
  - **QCLI-35**: worker ran `lore sync --dry-run` first (per its hard scope
    fence, a direct lesson from QCLI-32), confirmed scope, then regenerated
    docs/log.md, closing all 4 pre-existing unreachable SHAs (86/86 reachable
    after). Reviewer: **approve**, all 5 ACs independently re-derived,
    including a deliberately scrutinized AC3 (the lore-sync tool's documented
    backlog/-auto-commit behavior, examined against this project's own
    QCLI-32 precedent rather than accepted on convention alone). Reviewer
    also caught that the worker's plan/notes edits were never committed to
    the branch — orchestrator committed them before merging so they weren't
    lost. Rebased onto QCLI-33+QCLI-34's merges, re-verified (0 unreachable
    SHAs still held; log.md now one wave behind again by design — see
    proposed follow-up). Merged 2b30560 (PR #51, squash).

  **Incident during settlement (resolved, no data lost)**: after the QCLI-34
  pull, an unattributed `backlog`/`lore` interaction auto-committed dirty
  task-metadata files as `chore(backlog): sync task changes` and left
  docs/log.md regenerated-but-uncommitted in the orchestrator's own checkout
  — before QCLI-35's PR had merged, so local `dev` diverged from `origin/dev`
  once the QCLI-35 PR did merge. The stray local commit's unique content
  (QCLI-33/34 settlement writes) was fully reproducible from the exact
  commands already run, so local `dev` was reset to `origin/dev` and QCLI-33/
  QCLI-34 settlement was redone identically; the incidental docs/log.md
  regeneration was discarded (superseded by the proposed follow-up sync
  above). No task content or review verdict was lost. Root cause not fully
  diagnosed — flagged here in case it recurs.

  Settlement (orchestrator, on `dev` directly): all 5/5, 6/6 (5 applicable),
  and 5/5 ACs checked per task from reviewer-confirmed evidence only; notes
  and final summaries recorded; all three moved to Done, `wave-1` label
  retained, `in-review`/`merge-pending` removed. Committed as `79166fa`.

  Queue is now empty — campaign doc-7 complete pending user confirmation.
