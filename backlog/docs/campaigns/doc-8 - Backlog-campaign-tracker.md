---
id: doc-8
title: Backlog campaign tracker
type: other
created_date: '2026-08-06 18:09'
updated_date: '2026-08-06 20:05'
---
# Backlog campaign tracker

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Frontier

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan. Informational hint only: as of
2026-08-06 (post wave 1), 1 ready (QCLI-39 — its native dependency on
QCLI-36/37/38 is now satisfied, all three Done), 0 blocked, 3 Done this wave.

## Confirmed queue order

Confirmed by the user on 2026-08-06. This is the wave-builder's tie-break, NOT
a guarantee that any task lands in any particular wave. All four tasks were
proposed as follow-ups by the doc-7 (QCLI-33/34/35) campaign's wave-1
reviewers and worker, and filed this session with the user's approval.

1. QCLI-36 — Fix QCLI-34's task metadata: correct the references field to
   real paths — **Done, wave 1**
2. QCLI-37 — Reconcile the stale 'record layout' status cell at register
   line 167 — **Done, wave 1**
3. QCLI-38 — Determine whether 'naming scheme' is also closed by the
   QCLI-25 authored-record-layout section — **Done, wave 1**
4. QCLI-39 — Sync docs/log.md again to close post-wave-1 SHA drift —
   ready for wave 2. A native Backlog dependency on QCLI-36/37/38 was added
   this session to formalize the "run last" sequencing rationale below, so
   future restores compute this automatically rather than re-deriving it.

Rationale: lowest-risk/highest-information first. QCLI-39 (log sync) was
deliberately sequenced last so it can capture the other three's merge
commits — the same lesson wave 1 of doc-7 learned the hard way with
QCLI-33/34/35.

**File-overlap risk — resolved at wave-1 restore (R4b)**: a live
file-citation read confirmed QCLI-36 (backlog task file only), QCLI-37
(register line 167, Spec-open-questions mapping table), and QCLI-38
(register line 194, Contract-level open items table, + delivery-graph doc
lines ~431-444) touch either different files or non-overlapping line ranges
of the same file. All three ran in a single wave (wave 1) with no conflict.

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:task-metadata | QCLI-34's own bad `references` field | QCLI-36 |
| cluster:register-mapping-table | Stale status cell in the register's Spec-open-questions mapping table (~line 167) | QCLI-37 |
| cluster:naming-scheme-reconciliation | Same-concept-vs-distinct determination for "naming scheme" against QCLI-25/D4, register + delivery-graph open-item tables | QCLI-38 |
| cluster:lore-log-sync | docs/log.md SHA drift accumulated since QCLI-35's sync | QCLI-39 |

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(clean — wave 1 fully merged, settled, and worktrees released)

## Needs a human / blocked

(none)

## Proposed follow-ups (awaiting user approval)

**Not filed — per this project's no-autonomous-task-creation rule, surfaced
here and at the wave-1 report for the user's approval.**

1. **Reconcile stale "file layout"/"naming scheme" open-item bundles outside
   the register and delivery-graph docs.**
   - **Why**: wave 1's integration review found two documents outside
     QCLI-34/36/37/38's scope that still make live (not historical-record)
     claims that "file layout" and/or "naming scheme" remain open, now stale
     since both are closed (citing QCLI-25/D4) in
     `docs/reference/quest-cli-open-component-decisions.md` and
     `docs/reference/quest-cli-component-contracts-and-delivery-graph.md`:
     - `docs/adr/require-atomic-idempotent-operation-owned-mutations.md`
       line 69: "Deliberately not decided here: the file layout, naming
       scheme, event schema, and locking primitive... Those remain open in
       the [open component decisions register]..."
     - `docs/specs/quest-cli-architecture.md` line 223 (the "Deferred by
       design" table): `| Naming scheme, event schema | Git mutation
       contract open items |`, immediately below a row that already marks
       canonical-ID grammar/authored-record-layout closed.
   - **Acceptance criteria** (drafted):
     1. ADR line 69 no longer asserts file layout/naming scheme "remain
        open" in the register.
     2. Architecture spec line 223 reflects naming scheme as closed (citing
        QCLI-25/D4) while leaving event schema open, following the pattern
        of the row above it.
     3. No other row/section in either file modified; no historical-record
        document (the Spec's own Open Questions list, the QCLI-2.6 threat
        model's non-goals section) is touched — those intentionally
        preserve original wording per this repo's supersession convention.
     4. `lore validate --strict` and `lore check` pass with 0 errors/0
        warnings.

## Wave log

- 2026-08-06 — campaign init (doc-8). Prior campaign (doc-7, QCLI-33/34/35)
  closed 2026-08-06 with 0 campaign-labelled tasks remaining; queue was
  empty. doc-7's wave-1 report proposed 4 follow-ups, never filed per this
  project's no-autonomous-task-creation rule. User chose to file all 4 and
  run a full campaign. Created QCLI-36 (task-metadata fix), QCLI-37
  (register mapping-table reconciliation), QCLI-38 (naming-scheme
  determination), QCLI-39 (log sync), each with description + testable ACs
  per `task-creation` guide, no implementation plan. Labelled all four
  `campaign` + cluster label. User confirmed queue order (36, 37, 38, 39)
  and its rationale. No wave dispatched yet — file-overlap risk between
  QCLI-36/37/38 flagged above for restore to resolve live.

- 2026-08-06 — wave 1 (QCLI-36, QCLI-37, QCLI-38). Restore R2 found no
  ground-truth drift (queue, worktrees, PRs all matched the handover;
  treehouse pool fully available). R4b live file-citation read resolved the
  file-overlap risk: all three tasks touch disjoint files/line-ranges, so
  all three ran in one wave. Added a native Backlog dependency
  (QCLI-39 → QCLI-36, QCLI-37, QCLI-38) to formalize the prior session's
  "QCLI-39 runs last" sequencing rationale.
  - QCLI-36: implemented (fixed QCLI-34's `references` field), reviewed
    (approve), merged as `cc8787e` (PR #52).
  - QCLI-37: implemented (closed "record layout" at register line 167),
    reviewed (approve, independently re-ran `lore validate --strict` /
    `lore check`, both 0/0), merged as `4640ab3` (PR #53).
  - QCLI-38: implemented (determined "naming scheme" is the same concept as
    QCLI-25/D4; closed it in both the register and delivery-graph docs),
    reviewed (approve — reviewer independently re-verified the
    same-concept determination against primary sources, not just
    mechanics), merged as `761313d` (PR #54).
  - Wave-level integration review (after all three merged): found one
    narrow cross-task gap — line 167 never mentioned "naming scheme" as
    closed even though QCLI-38 closed it elsewhere under the same decision,
    defeating the doc's own stated cross-check purpose. Fixed directly
    (`chore/qcli-doc8-wave1-integration-fix`, reviewed approve, merged as
    `098dbe6`, PR #55) — a narrow, mechanical one-line addition, not filed
    as a Backlog task. Two further findings (stale claims in
    `require-atomic-idempotent-operation-owned-mutations.md` and
    `quest-cli-architecture.md`) were classified "real work" and drafted
    above as a proposed follow-up, awaiting user approval per this
    project's no-autonomous-task-creation rule.
  - Settlement: QCLI-36, QCLI-37, QCLI-38 all moved to `Done`, ACs checked
    per reviewer-confirmed evidence only, final summaries recorded.
    Committed as `8ed4341`.
  - **Process note for the next session**: this restore hit the same
    "unattributed dirty task-metadata files in the orchestrator's own
    checkout" hazard doc-7's wave 1 first surfaced — this time
    root-caused: `backlog task edit` does not auto-commit, so orchestrator-
    only edits (dispatch marking, in-review marking, `--dep` edits) sitting
    uncommitted in the main checkout collide with the next `git pull
    --ff-only` once a worker's branch (which independently touches the
    same task file, e.g. via `--plan`) merges. Recovered by discarding the
    stale local diff and redoing the edits post-pull. **Going forward:
    commit orchestrator-only Backlog edits promptly** (settlement writes
    already do this; dispatch/in-review marking should too) rather than
    leaving them to accumulate uncommitted across a wave.
