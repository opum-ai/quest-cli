---
id: doc-6
title: Backlog campaign tracker
type: other
created_date: '2026-08-06 02:39'
updated_date: '2026-08-06 04:06'
---
# Backlog campaign tracker

**Campaign complete as of 2026-08-06.** Both queued tasks (QCLI-31, QCLI-32)
are Done. No campaign-labelled tasks remain in a non-Done state. Run
`/backlog-handover init` to start a fresh campaign from whatever's next in
the open queue.

Protocol: restore → recompute the ready/conflict graph from Backlog → acquire
worktrees → mark the acquired members dispatched → implement + review in
parallel → serialize the merge → settle tasks and write this doc once more →
loop until the queue is empty or blocked → write handover.

## Frontier

Empty — campaign complete. QCLI-31 and QCLI-32 are both Done.

## Confirmed queue order

Confirmed by the user on 2026-08-06. Both tasks were surfaced by the
doc-cleanup campaign's (`doc-5`) wave-1 integration review and approved
for filing that same session.

1. QCLI-31 — Reconcile the remaining architecture-Spec passages that still
   read as open after the Phase 1 ADRs — **Done, wave 1**
2. QCLI-32 — Run a centralized lore sync to reconcile the
   Phase-1-ratification Story — **Done, wave 2**

**QCLI-32 carried a real Backlog dependency on QCLI-31 (`--dep QCLI-31`),
not just a queue-order tie-break.** This repo had already hit a real
conflict from running `lore sync` in parallel with an in-flight content
edit (doc-4, wave 1) — `lore sync` can regenerate shared index files
repo-wide, a side effect the file-citation conflict check cannot see since
QCLI-31 and QCLI-32's *named* references were disjoint. The dependency
forced QCLI-32 into its own wave after QCLI-31 merged, by design, per user
decision. This played out exactly as anticipated in wave 2: `lore sync`
did touch a file outside QCLI-32's declared scope (`docs/log.md`), and the
worker correctly caught and reverted it rather than committing it.

## Clusters

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| cluster:architecture-spec | Self-contradiction in quest-cli-architecture.md left by QCLI-30's narrow scope fence | QCLI-31 (Done) |
| cluster:lore-sync | Centralized lore sync closing out the Phase-1-ratification Story's pre-existing drift | QCLI-32 (Done) |

## In flight

(empty — campaign complete, nothing in flight)

## Needs a human / blocked

(none)

## Proposed follow-ups (awaiting user approval)

Surfaced during this campaign's two review passes. Not filed — this repo
forbids creating follow-up tasks without user approval.

1. **Adjacent contradiction in `docs/specs/quest-cli-architecture.md`, same
   pattern as QCLI-31 itself** (surfaced by the QCLI-31 reviewer). Open
   Questions bullet 4 (~line 263) still asks "does the projection port need
   transactional semantics, or is rebuild-on-doubt sufficient? ... cannot
   be settled before the scale target (D5)" — but D5 is now closed (by
   QCLI-31, citing the QCLI-26 ADR), and that same ADR already answers the
   question at its line 114 ("No durable transactional index is required
   to satisfy this scale target"). QCLI-31's AC6 scope fence correctly
   forbade touching this passage, so it was left as-is by design. Proposed
   task: reconcile Open Questions bullet 4 with the QCLI-26 ADR's
   rebuild-on-doubt ruling, same shape as QCLI-31.
2. **Minor terminology tension, informational only** (surfaced by the
   QCLI-31 reviewer). The register's contract-level table
   (`quest-cli-open-component-decisions.md` ~line 193) and
   `quest-cli-component-contracts-and-delivery-graph.md` (~lines 431-437)
   both still list "file layout" among the Git mutation contract's open
   items, while register D4's detail and the QCLI-25 ADR both say the
   *authored-record layout* is settled. Possibly the same concept under two
   names, in which case one of the two source documents is drifting — or
   they are genuinely distinct and no action is needed. Lower priority than
   (1).
3. **`docs/log.md` needs a dedicated regeneration commit** (surfaced by the
   QCLI-32 worker and independently confirmed by the QCLI-32 reviewer via a
   `lore sync --dry-run`, which shows the fix is now precisely scoped to
   that one file). Pre-existing drift from squash-merge SHA rewrites since
   `docs/log.md`'s last sync at commit `43bc22e` — 4 of its 85 SHAs are
   unreachable from HEAD. Unrelated to QCLI-31/32's content; deliberately
   left untouched twice during QCLI-32's implementation to stay within its
   AC3 scope fence. Proposed task: a standalone `chore(docs): sync log.md`
   commit on `dev`, no other changes.

## Wave log

- 2026-08-06 — campaign init. Queue was QCLI-31 and QCLI-32, both filed at
  the end of the prior doc-cleanup campaign (`doc-5`) as user-approved
  integration-review follow-ups. Labelled `campaign` plus a cluster label.
  User confirmed QCLI-31 first, with QCLI-32 made explicitly dependent on
  QCLI-31 (not just ordered) to avoid a known `lore sync` conflict pattern.
  No wave dispatched yet.
- 2026-08-06 — wave 1 = {QCLI-31}. Worktree acquired from the treehouse pool
  (slot 1, base `dev`@`94baa05`), branch
  `fix/qcli-31-architecture-spec-reconciliation`. Worker reconciled the
  Error taxonomy passage and the "Deferred by design" table against the
  ratified Phase 1 ADRs; `lore validate --strict` passed (47 files, 0
  errors, 0 warnings). Reviewer independently re-ran the same gate and
  confirmed all 6 acceptance criteria with file/line evidence — verdict
  `approve`, plus two non-blocking findings (recorded above under Proposed
  follow-ups #1 and #2). Rebase onto `origin/dev` produced one
  purely-mechanical conflict in the task file's `assignee`/`updated_date`
  fields (content diff untouched) — resolved by the orchestrator,
  re-verified post-rebase (still 0 errors/warnings), merged as PR #47 /
  `ccb68d1`. QCLI-31 settled to Done. QCLI-32 unblocked.
- 2026-08-06 — wave 2 = {QCLI-32}, the campaign's last task. Worktree
  reacquired from the treehouse pool (slot 1, base `dev`@`77ee0de`), branch
  `chore/qcli-32-lore-sync-phase1-ratification`. Worker ran `lore sync`
  centrally, flipping the Phase-1-ratification Story's frontmatter `status`
  from `in-progress` to `done` and refreshing its `<!-- lore:tasks -->`
  block; `lore check` went from 2 errors to 0 errors/0 warnings, `lore
  validate --strict` passed. `lore sync` also touched `docs/log.md` as an
  out-of-scope side effect — the worker correctly reverted it (twice, once
  per invocation cycle) rather than committing it, and flagged it as a
  follow-up (recorded above as #3). Reviewer independently re-ran `lore
  check` and `lore validate --strict`, and ran a `lore sync --dry-run` to
  positively confirm no other file was left uncommitted — verdict
  `approve`. Rebase onto `origin/dev` produced the same class of mechanical
  task-file conflict as wave 1 (`assignee`/`updated_date` only); resolved,
  re-verified post-rebase (label survival for `wave-2` explicitly
  double-checked per the reviewer's flag), merged as PR #48 / `2e57876`.
  QCLI-32 settled to Done.
- 2026-08-06 — campaign complete. 0 campaign-labelled tasks remain non-Done.
  Both waves ran clean (no escalations, no needs-human items). Three
  follow-ups proposed above, awaiting user approval before filing.
