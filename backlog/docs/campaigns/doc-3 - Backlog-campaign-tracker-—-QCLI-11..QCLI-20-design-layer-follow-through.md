---
id: doc-3
title: Backlog campaign tracker — QCLI-11..QCLI-20 design-layer follow-through
type: other
created_date: '2026-08-05 12:33'
updated_date: '2026-08-05 17:39'
---
# Backlog campaign tracker — QCLI-11..QCLI-20 design-layer follow-through

Protocol: restore -> recompute the ready/conflict graph from Backlog -> acquire
worktrees -> mark the acquired members dispatched -> implement + review in
parallel -> serialize the merge -> settle tasks and write this doc once more ->
loop until the queue is empty or blocked -> write handover.

Campaign opened 2026-08-05, immediately after QCLI-10 settled. Its members are
the follow-through from the design layer QCLI-10 produced: residual defects that
lived only in settlement notes, one factual error the design layer itself
introduced, the activation-gate evidence record, and proposals for the Phase 1
component decisions.

## Frontier

**Waves 1 and 2 complete as of 2026-08-05.** 12 of 13 members Done (QCLI-12..17
in wave 1, QCLI-11/18/19/20/21/22 in wave 2). QCLI-23 filed the same day after
user approval of wave 2's integration-review follow-up — 1 ready, 0 blocked,
0 in flight.

The ready set is ALWAYS recomputed live from `backlog task list --json` plus
each candidate's `task view --json` at the start of every restore/wave — never
trust a persisted "next wave" plan.

No task in this campaign has a Backlog `dependencies` entry. Every member was
independently startable; wave composition was bounded by the file-conflict
graph and the wave-size cap, not by dependency order.

## Confirmed queue order

Confirmed by the user on 2026-08-05 via the init interview, principle
"lowest-risk first": cheapest and most mechanical work validates the wave
machinery before anything consequential runs through it. This is the
wave-builder's tie-break, NOT a guarantee that any task lands in any particular
wave.

1. QCLI-12 — Fix the stale QCLI-2.8 dependency-order row in the research programme Spec — **Done, wave 1**
2. QCLI-13 — Backlink the adoption playbook from the component charter and migration ledger — **Done, wave 1**
3. QCLI-14 — Correct the bin-path row in the packaging contract's Description column — **Done, wave 1**
4. QCLI-15 — Audit two unresolved register findings: the untraceable Allowed value and QCLI-2.12's F4 and F5 — **Done, wave 1**
5. QCLI-16 — Audit and correct the licensing-source misattribution in the contracts and delivery graph — **Done, wave 1**
6. QCLI-17 — Correct the open component decisions register's Backlog.md reclassification-trigger claim — **Done, wave 1**
7. QCLI-11 — Record quest-cli's activation-gate evidence and decision time — **Done, wave 2**
8. QCLI-18 — Propose the CLI result contract: envelope shape, exit-code table, not-found convention, and anomaly placement — **Done, wave 2**
9. QCLI-19 — Propose the canonical identifier grammar and authored-record layout — **Done, wave 2**
10. QCLI-20 — Propose the scale target and the projection sizing basis it implies — **Done, wave 2**

Appended after wave 1, approved by the user on 2026-08-05 (not part of the
original init-time order, so no relative priority is implied among 11-14 vs.
these two — the wave builder treated all six as equally ready):

11. QCLI-21 — Reconcile the open component decisions register and contracts graph against the QCLI-12..17 corrections — **Done, wave 2**
12. QCLI-22 — Re-pin the research source register's member pins invalidated by the QCLI-12..17 wave — **Done, wave 2**

Appended after wave 2's integration review, approved by the user on
2026-08-05:

13. QCLI-23 — Re-verify QCLI-2.7's drift table against lore-cli v0.1.1 and refresh dependent documents — **filed, To Do, ready for a future wave**

## Clusters

Every member carried a distinct cluster label, because every member wrote to a
distinct file. Cluster collision was not the real constraint here —
authored-file ownership was — but the labels were kept disjoint so the wave
builder did not serialize work that was genuinely parallel.

| Cluster label | Covers | Tasks |
| ------------- | ------ | ----- |
| `cluster:convention` | The research programme Spec | QCLI-12 (Done) |
| `cluster:adoption` | The adoption playbook and its inbound links | QCLI-13 (Done) |
| `cluster:packaging` | The packaging contract | QCLI-14 (Done) |
| `cluster:provenance` | The research source register | QCLI-15 (Done), QCLI-22 (Done), QCLI-23 (To Do) |
| `cluster:synthesis` | The component contracts and delivery graph | QCLI-16 (Done) |
| `cluster:migration` | The open component decisions register, migration slice | QCLI-17 (Done) |
| `cluster:lore-gate` | The activation-gate evidence record (new document) | QCLI-11 (Done) |
| `cluster:cli-contract` | CLI result contract proposal (new document) | QCLI-18 (Done) |
| `cluster:identity` | Identifier grammar proposal (new document) | QCLI-19 (Done) |
| `cluster:projection` | Scale target proposal (new document) | QCLI-20 (Done) |
| `cluster:tracking-reconciliation` | The open component decisions register's tracking table + D1, and the contracts graph | QCLI-21 (Done) |

Note: QCLI-22 shares `cluster:provenance` with QCLI-15 — both touch the
research source register. This was intentional; the cluster label reflects
file ownership, not wave membership, and QCLI-15 was already Done by the time
QCLI-22 ran, so there was no live conflict.

### Authored-file ownership

Exactly one wave member edited any given pre-existing document, verified
disjoint throughout:

| Task | Wrote to |
| ---- | --------- |
| QCLI-12 (Done) | `docs/specs/quest-cli-pre-implementation-research-program.md` |
| QCLI-13 (Done) | `docs/reference/quest-cli-component-charter.md`, `docs/reference/former-ocli-to-qcli-migration-ledger.md` |
| QCLI-14 (Done) | `docs/reference/quest-cli-packaging-contract.md` |
| QCLI-15 (Done) | `docs/reference/quest-cli-research-source-register.md` |
| QCLI-16 (Done) | `docs/reference/quest-cli-component-contracts-and-delivery-graph.md` |
| QCLI-17 (Done) | `docs/reference/quest-cli-open-component-decisions.md`, and `docs/specs/quest-cli-delivery-roadmap.md` (the soft edge fired — QCLI-17 did touch the roadmap; `quest-cli-functional-requirements.md` was checked and confirmed to need no edit) |
| QCLI-21 (Done) | `docs/reference/quest-cli-open-component-decisions.md`, `docs/reference/quest-cli-component-contracts-and-delivery-graph.md` |
| QCLI-22 (Done) | `docs/reference/quest-cli-research-source-register.md` |
| QCLI-11, 18, 19, 20 (Done) | New documents only |

QCLI-21 and QCLI-22 were file-disjoint from each other and from
QCLI-11/18/19/20 — all six ran in one wave (wave 2, at the wave-size cap of 6).

## In flight

Cleared at settlement; non-empty only mid-wave or after a crash.

| Task | Wave | Worktree path | Branch | Stage reached |
| ---- | ---- | ------------- | ------ | ------------- |

(empty — both waves fully merged and settled; campaign complete)

## Needs a human / blocked

No campaign member is blocked. Three items sit outside the campaign because an
agent cannot finish them:

- **Register D1, product license.** Owner-held. No admitted source records a
  choice, and licensing is a product decision, not a research finding.
- **Register D3, supported-platform matrix ownership.** Needs a human to assign
  ownership. The decision itself carries no Lore-evidence gate, so it becomes
  agent-workable once someone owns it.
- **Register D6, the product-wide actor and governance model.** Belongs in
  `quest-doc`, not this repository. No task in any repository has been filed for
  it, and filing one here would be the wrong repository.

Register D2 (runtime and native packaging) is structurally blocked
post-activation and is deliberately not in the campaign.

## Proposed follow-ups (awaiting user approval)

Never created unprompted — this project requires approval before follow-up work
is filed.

Two register entries were deliberately NOT filed at init and are recorded here
so the decision is legible rather than silent:

- **The `browser` HTTP endpoint boundary** (QCLI-2.5 finding 13). Flagged for
  QCLI-2.8, which declined to rule. It is a decision, not a defect, and it only
  matters if Quest ever mirrors that surface.
- **`LCLI-316`, filed in `lore-cli` and left uncommitted.** Out of repository.
  Whoever next works in `lore-cli` should commit it; no quest-cli mechanism
  tracks it.

Wave 1's two follow-ups (tracking-document reconciliation, register
re-pinning) were approved on 2026-08-05 and filed as **QCLI-21** and
**QCLI-22**; both are now Done — see Confirmed queue order above.

**From wave 2's integration review — approved by the user on 2026-08-05 and
filed as QCLI-23** (see Confirmed queue order above; linked to Story
`stories/prepare-quests-clean-room-research-foundation`):

- **Re-verify and re-date QCLI-2.7's Part 3 drift table against `lore-cli`
  `v0.1.1` (currently pinned at `v0.1.0`), and refresh the two sibling
  documents that echo that pin.** QCLI-2.7's own text (`docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md:373-380`)
  states a reclassification trigger: cutting a new `lore-cli` tag must trigger
  re-verification of `MIN_BACKLOG_VERSION`/`EXPECTED_SCHEMA_VERSION` and the
  drift table, not silent reuse of the old numbers. QCLI-11's live re-check
  (2026-08-05) found `lore-cli` has in fact cut `v0.1.1` and published
  `@opum-ai/lore@0.1.1` — the trigger fired, and no task in this campaign
  serviced it (QCLI-11 correctly stayed in scope and only recorded the
  discovery; QCLI-22's re-verification pass was scoped to register member
  *pins*, not `lore-cli` release facts).

  The integration review independently re-ran the trigger's own checks and
  found the good news first: `git diff --stat v0.1.0..v0.1.1` over the four
  adapter-surface paths QCLI-2.7 names is empty, `MIN_BACKLOG_VERSION` and
  `EXPECTED_SCHEMA_VERSION` are unchanged, so **no Part 2 reclassification is
  needed** — QCLI-18's load-bearing constraint on that divergence survives
  intact. But three Part 3 drift-table rows are now factually false, not
  merely dated (`dev` HEAD SHA, the "1 commit only on the tag side / 29 only on
  `dev`'s side" count — actually 0/124 now — and the "is the tag an ancestor of
  `dev` HEAD" answer, which has flipped from No to Yes). This is exactly
  recovered finding F5's hazard (a quoted drift-table row going stale), arriving
  from the *other* task's direction — QCLI-21/22 left "does F5 still apply?"
  open; it does. `0.1.0` is also still asserted as current, with no
  cross-reference to QCLI-11's newer capsule, in the research source register
  (`:360-366`) and the packaging contract (`:78`).

  **Scope (as filed in QCLI-23)**: re-verify and re-date QCLI-2.7's Part 3
  drift table against `lore-cli` `v0.1.1`/current HEAD (recording that the
  four adapter-surface paths remain byte-identical, so no Part 2
  reclassification follows); refresh the register's `lore-cli` release-evidence
  retrieval date and the packaging contract's `@opum-ai/lore` row; add
  reciprocal pointers between those three documents and QCLI-11's evidence
  record. Explicitly out of scope: any gate evaluation — the boundary
  discipline QCLI-11 established (record evidence, never compute or assert a
  gate result) must be preserved.

## Wave log

- 2026-08-05 — init. Campaign created from the open queue plus user-approved
  additions. QCLI-10 settled first (all 5 subtasks Done; all 5 ACs checked
  against named evidence; merged to dev as 1330ecf, log sync dde1242).

  Two init-time verifications changed the planned scope, and both are worth
  carrying forward:

  1. **The Backlog.md v1.49.3 reclassification trigger has NOT fired.**
     `npm view backlog.md version` returns `1.49.3` on 2026-08-05, with
     `dist-tags.latest` = `1.49.3` and `time.modified` = 2026-08-03. The pinned
     version IS the current published release. The approved
     "v1.49.3 re-verification" task was therefore replaced by QCLI-17, which
     corrects the register's own false claim that the trigger had probably
     fired — an error the design layer introduced hours earlier and which was
     falsified by the first live check run against it.

  2. **The playbook backlink residual is half stale.** QCLI-2.10 recorded that
     the playbook and the charter/ledger were not backlinked "or vice versa".
     The playbook does cite both (lines 75, 427-428); only the inbound direction
     is missing. QCLI-13 was narrowed accordingly.

  Standing trap carried from doc-2, unchanged and still generic to SHA-pinning
  as a mechanism: any task editing a register-pinned document invalidates that
  pin on merge, whether or not the task intended to touch the register. QCLI-12,
  QCLI-13, QCLI-14, and QCLI-16 all edit documents the source register may pin;
  each carries an acceptance criterion requiring the pin be handled in the same
  pass or the need for a separate correction recorded.

- 2026-08-05 — wave 1 (tasks: QCLI-12, QCLI-13, QCLI-14, QCLI-15, QCLI-16,
  QCLI-17). All six dispatched into treehouse worktrees off wave base `ffe8487`,
  implemented and reviewed in parallel (mid-tier workers, top-tier reviewers),
  merged strictly serially, all settled Done.

  **Review rounds:** every one of the six required a `request_changes` round —
  none were architectural, all were fixable in a single fresh-worker fix pass
  (uncommitted notes, unrecorded downstream-invalidation findings, prose
  accuracy issues, one factual defect in an audit's own enumeration, one
  register-vs-contract wording contradiction the reviewer caught before it
  shipped). All six reached `approve` on the second review pass and merged
  clean.

  **Register-pin parallel-edit constraint held.** QCLI-12/13/14/16 were each
  instructed not to self-pin the research source register in-wave (to avoid a
  collision with QCLI-15, which owned the register this wave); all four
  complied and recorded their pin findings as notes-only follow-ups instead.
  Confirmed zero register diff for all four throughout.

  **Merge-time conflicts — two classes, both validated by disposition review
  before resolution, both proven safe by empirical dry-run:**
  1. Backlog task-file YAML frontmatter (`assignee`/`created_date`/`updated_date`)
     conflicting between the orchestrator's own campaign-bookkeeping commits on
     `dev` and each branch's own status edits. Resolution: take the branch side
     wholesale; `labels` and body content merge cleanly outside the hunk.
  2. Lore-*generated* files (`docs/log.md`, the Story's
     `<!-- lore:tasks -->` managed block) conflicting because each branch's
     local copy predates later merges. These are build artifacts regenerated
     wholesale by `lore sync` from the git DAG — resolution: clear the marker
     with either side, then run `lore sync` after the rebase completes.
     Verified via a throwaway-worktree replay of the whole wave that both
     resolution choices converge to the identical byte-for-byte `lore sync`
     output.

  All six merged via squash PRs (#25-#30), `dev` synced with `lore sync` after
  each merge. One drift found and fixed mid-wave: `dev` itself had fallen out
  of sync after the first two merges (a settlement pass skipped the post-merge
  `lore sync` step) — fixed directly on `dev`, and the post-merge-sync step was
  added to the remaining five merges to prevent recurrence. A second drift
  (story status/managed-block stale after the final settlement) was caught and
  fixed by the wave-level integration review before close.

  **Wave-level integration review** (after all six merged): found no content
  contradictions introduced by combining the six branches directly, but found
  that finishing six defects the design layer's own tracking documents
  describe left those tracking documents stale. Drafted two follow-up tasks;
  the user approved both and they were filed the same session as **QCLI-21**
  and **QCLI-22** (see Confirmed queue order). Also independently verified the
  register-pin-staleness follow-ups QCLI-12/13/14/16 recorded are all still
  genuinely outstanding (nothing in the wave incidentally fixed them), and
  folded them into QCLI-22 rather than filing four separate tasks.

  Merged SHAs: QCLI-12 `1dd4aa6` (PR #25), QCLI-13 `d871d32` (PR #26), QCLI-14
  `077d3be` (PR #27), QCLI-15 `6b78fd0` (PR #28), QCLI-16 `44a7ed8` (PR #29),
  QCLI-17 `fb8e8e3` (PR #30). `dev` head after settlement + doc updates +
  filing QCLI-21/22: `4d8224e`.

- 2026-08-05 — wave 2 (tasks: QCLI-11, QCLI-18, QCLI-19, QCLI-20, QCLI-21,
  QCLI-22). All six dispatched into treehouse worktrees off wave base
  `bb70619`, implemented and reviewed in parallel (mid-tier workers, top-tier
  reviewers), merged strictly serially in confirmed queue order, all settled
  Done. This filled the wave-size cap of 6 exactly.

  **Review rounds:** QCLI-11 and QCLI-19 approved on the first pass. QCLI-18,
  QCLI-20, QCLI-21, and QCLI-22 each required one `request_changes` round —
  all localized citation/attribution defects or narrow convention issues, none
  architectural. QCLI-21's round was the most substantive: the reviewer
  independently **recovered** the QCLI-2.12 F4/F5 original reviewer text from a
  local Claude Code session transcript after the worker's own search of it had
  come up empty — the recovered text was integrated into the register's
  tracking row (kept listed as open; recovering the text doesn't close the
  finding, it only makes it evaluable) and independently re-verified a second
  time on re-review. This in turn required an unplanned addendum fix pass on
  QCLI-22 (already reviewed and mid-fix for its own unrelated findings), since
  QCLI-22 owns the register file where a sibling note asserting that same text
  was "unrecoverable" needed correcting. All six reached `approve` and merged
  clean.

  **Merge-time conflicts** — all were the two classes wave 1 pre-validated
  (Backlog frontmatter, Lore-generated files); every rebase-time conflict
  across all six merges was resolved by clearing the marker and running
  `lore sync`, with zero escalations to a fresh disposition review needed.

  **Orchestrator process defect, caught and fixed mid-wave**: the initial
  dispatch-marking (`In Progress` + `wave-2` label) and later `in-review`
  labeling were run from the main checkout's working directory instead of
  inside any worktree, and were never committed — a variant of the handover's
  own "check `git status` before every `git checkout`" warning, now confirmed
  to also apply to plain `backlog task edit` calls run from the wrong
  directory. Caught when the first post-merge `git pull --ff-only` refused to
  fast-forward over uncommitted local changes. Recovery: confirmed the stale
  edits were redundant bookkeeping already superseded by each worker's own
  status transition (verified via `git show origin/dev:<path>` before
  discarding), discarded them with `git restore`, and proceeded. No task state
  or review evidence was lost — only orchestrator-side label bookkeeping that
  settlement re-applied correctly and committed this time.

  **Wave-level integration review** (after all six merged): found the cumulative
  corpus internally consistent — no duplicate/contradictory statements between
  the three new Phase-1 proposals and QCLI-21/22's corrections, all forward/
  backward references between QCLI-21 and QCLI-22 resolve correctly, no
  filename/frontmatter collisions, and all managed-block regeneration cycles
  during the merge queue left the Story tables and `docs/log.md` internally
  consistent (no duplicates, nothing dropped). Found one real, substantive
  finding (the `lore-cli` v0.1.1 reclassification-trigger staleness — see
  Proposed follow-ups above; approved and filed as QCLI-23 the same session)
  and fixed two narrow ones directly in a follow-up worker+review pass (an off-by-one
  transcript-line citation, a stale-tense/missing-link pair, and a missing
  roadmap back-link to QCLI-11's evidence record — merged as PR #37). Also
  fixed, as mechanical `lore sync` regeneration run directly on `dev` (no
  worker/review cycle needed): `docs/log.md` dangling pre-squash SHAs left by
  QCLI-22's un-squashed worktree commits, same defect class as `f30b0c5`.

  Merged SHAs: QCLI-11 `a625577` (PR #31), QCLI-18 `eda251b` (PR #32), QCLI-19
  `adea711` (PR #33), QCLI-20 `3c4eb24` (PR #34), QCLI-21 `f43a083` (PR #35),
  QCLI-22 `2fd6c13` (PR #36). Integration-review fixes `ed14115` (PR #37).
  `dev` head after settlement + doc updates: this commit.

- 2026-08-05 — QCLI-23 filed. The user approved wave 2's integration-review
  follow-up (see Proposed follow-ups above); filed and linked to
  `stories/prepare-quests-clean-room-research-foundation` via `lore link`.
  `dev` head after filing: `3d72158`.

**Waves 1 and 2 complete.** 12 of 13 members Done; QCLI-23 filed and ready for
a future wave (the only ready-set member, so it will run alone or `restore`
can simply be run to pick it up as a one-task wave). Suggest
`/backlog-handover restore` to drain QCLI-23, or `/backlog-handover init` if a
larger fresh queue should be assembled around it first.
